/**
 * Improved Tenant Provisioning Service
 * 
 * Handles creation of new tenant databases with better error handling,
 * rollback mechanisms, and flexible schema copying.
 */

import { Pool } from 'pg';
import { v4 as uuidv4 } from 'uuid';
import { exec } from 'child_process';
import { promisify } from 'util';
const execAsync = promisify(exec);

export interface TenantProvisioningRequest {
  organizationName: string;
  adminEmail: string;
  adminPassword: string;
  plan?: 'free' | 'pro' | 'enterprise';
}

export interface TenantProvisioningResult {
  tenantId: string;
  slug: string;
  databaseName: string;
  databaseUrl: string;
  adminUserId: string;
  status: 'pending' | 'active';
}

class ImprovedTenantProvisioningService {
  private globalDb: Pool;
  private postgresAdminUser: string;
  private postgresAdminPassword: string;
  private postgresHost: string;
  private postgresPort: string;
  private tenantDbPrefix: string;
  private sourceDatabaseName: string;
  private useDockerForSchemaCopy: boolean;
  private dockerContainerName: string;

  constructor(globalDb: Pool) {
    this.globalDb = globalDb;
    this.postgresAdminUser = process.env.POSTGRES_ADMIN_USER || process.env.POSTGRES_USER || 'postgres';
    this.postgresAdminPassword = process.env.POSTGRES_ADMIN_PASSWORD || process.env.POSTGRES_PASSWORD || '';
    this.postgresHost = process.env.POSTGRES_HOST || 'localhost';
    this.postgresPort = process.env.POSTGRES_PORT || '5432';
    this.tenantDbPrefix = process.env.TENANT_DB_PREFIX || 'twenty_tenant_';
    this.sourceDatabaseName = process.env.SOURCE_DATABASE_NAME || 'twenty';
    this.useDockerForSchemaCopy = process.env.USE_DOCKER_FOR_SCHEMA_COPY === 'true';
    this.dockerContainerName = process.env.DOCKER_POSTGRES_CONTAINER || 'twenty-db';
  }

  /**
   * Generate unique tenant slug from organization name
   */
  private generateSlug(organizationName: string): string {
    return organizationName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .substring(0, 50);
  }

  /**
   * Generate unique database name
   */
  private generateDatabaseName(slug: string): string {
    const uuid = uuidv4().replace(/-/g, '').substring(0, 8);
    const dbName = `${this.tenantDbPrefix}${slug}_${uuid}`;
    
    // PostgreSQL database name limit is 63 characters
    if (dbName.length > 63) {
      return `${this.tenantDbPrefix}${slug.substring(0, 30)}_${uuid}`;
    }
    
    return dbName;
  }

  /**
   * Check if slug is unique
   */
  private async isSlugUnique(slug: string): Promise<boolean> {
    const result = await this.globalDb.query(
      'SELECT id FROM tenant_registry WHERE slug = $1',
      [slug]
    );
    return result.rows.length === 0;
  }

  /**
   * Check if email is unique globally
   */
  private async isEmailUnique(email: string): Promise<boolean> {
    const result = await this.globalDb.query(
      'SELECT id FROM global_users WHERE email = $1',
      [email.toLowerCase()]
    );
    return result.rows.length === 0;
  }

  /**
   * Check if source database exists
   */
  private async checkSourceDatabase(): Promise<boolean> {
    const adminDb = new Pool({
      host: this.postgresHost,
      port: parseInt(this.postgresPort),
      user: this.postgresAdminUser,
      password: this.postgresAdminPassword,
      database: 'postgres',
    });

    try {
      const result = await adminDb.query(
        'SELECT 1 FROM pg_database WHERE datname = $1',
        [this.sourceDatabaseName]
      );
      await adminDb.end();
      return result.rows.length > 0;
    } catch (error) {
      await adminDb.end();
      return false;
    }
  }

  /**
   * Create PostgreSQL database
   */
  private async createDatabase(databaseName: string): Promise<void> {
    const adminDb = new Pool({
      host: this.postgresHost,
      port: parseInt(this.postgresPort),
      user: this.postgresAdminUser,
      password: this.postgresAdminPassword,
      database: 'postgres',
    });

    try {
      // Check if database already exists
      const checkResult = await adminDb.query(
        'SELECT 1 FROM pg_database WHERE datname = $1',
        [databaseName]
      );

      if (checkResult.rows.length > 0) {
        console.log(`Database ${databaseName} already exists`);
        await adminDb.end();
        return;
      }

      // Create database
      await adminDb.query(`CREATE DATABASE "${databaseName}"`);
      console.log(`✅ Created database: ${databaseName}`);
    } catch (error: any) {
      if (error.message.includes('already exists')) {
        console.log(`Database ${databaseName} already exists`);
      } else {
        throw new Error(`Failed to create database: ${error.message}`);
      }
    } finally {
      await adminDb.end();
    }
  }

  /**
   * Copy schema using pg_dump (with or without Docker)
   */
  private async copySchemaPgDump(databaseName: string): Promise<void> {
    try {
      let copyCommand: string;

      if (this.useDockerForSchemaCopy) {
        // Use Docker exec for pg_dump
        copyCommand = `docker exec ${this.dockerContainerName} sh -c "PGPASSWORD='${this.postgresAdminPassword}' pg_dump -U ${this.postgresAdminUser} -d ${this.sourceDatabaseName} --schema=core --schema-only --no-owner --no-acl --no-tablespaces --no-privileges 2>/dev/null | PGPASSWORD='${this.postgresAdminPassword}' psql -U ${this.postgresAdminUser} -d ${databaseName} -v ON_ERROR_STOP=0 2>&1 | grep -v 'ERROR.*does not exist' | grep -v 'already exists' || true"`;
      } else {
        // Use local pg_dump
        copyCommand = `PGPASSWORD='${this.postgresAdminPassword}' pg_dump -h ${this.postgresHost} -p ${this.postgresPort} -U ${this.postgresAdminUser} -d ${this.sourceDatabaseName} --schema=core --schema-only --no-owner --no-acl --no-tablespaces --no-privileges | PGPASSWORD='${this.postgresAdminPassword}' psql -h ${this.postgresHost} -p ${this.postgresPort} -U ${this.postgresAdminUser} -d ${databaseName} -v ON_ERROR_STOP=0`;
      }

      await execAsync(copyCommand, {
        env: { ...process.env, PGPASSWORD: this.postgresAdminPassword },
        maxBuffer: 50 * 1024 * 1024,
        timeout: 180000,
      });

      console.log(`✅ Schema copied using pg_dump`);
    } catch (error: any) {
      console.warn(`Schema copy had some errors (may be expected):`, error.message);
    }
  }

  /**
   * Verify schema was copied successfully
   */
  private async verifySchema(databaseUrl: string): Promise<boolean> {
    const tenantDb = new Pool({ connectionString: databaseUrl });

    try {
      // Check if core schema exists
      const schemaCheck = await tenantDb.query(
        `SELECT schema_name FROM information_schema.schemata WHERE schema_name = 'core'`
      );

      if (schemaCheck.rows.length === 0) {
        await tenantDb.end();
        return false;
      }

      // Check if key tables exist
      const tableCheck = await tenantDb.query(
        `SELECT COUNT(*) as count FROM information_schema.tables WHERE table_schema = 'core'`
      );

      const tableCount = parseInt(tableCheck.rows[0].count);
      await tenantDb.end();

      console.log(`✅ Schema verified: ${tableCount} tables in core schema`);
      return tableCount >= 3; // Expect at least 3 core tables (application, workspace, role, user)
    } catch (error) {
      await tenantDb.end();
      return false;
    }
  }

  /**
   * Run migrations on tenant database
   */
  private async runMigrations(databaseUrl: string): Promise<void> {
    const databaseName = databaseUrl.split('/').pop() || '';

    console.log(`📦 Copying schema to tenant database: ${databaseName}`);

    // Check if source database exists
    const sourceExists = await this.checkSourceDatabase();
    if (!sourceExists) {
      throw new Error(`Source database '${this.sourceDatabaseName}' does not exist. Please create it first or set SOURCE_DATABASE_NAME to an existing database.`);
    }

    // Create core schema first
    const targetDb = new Pool({
      host: this.postgresHost,
      port: parseInt(this.postgresPort),
      user: this.postgresAdminUser,
      password: this.postgresAdminPassword,
      database: databaseName,
    });

    try {
      await targetDb.query('CREATE SCHEMA IF NOT EXISTS core');
      console.log(`✅ Core schema created`);
      await targetDb.end();
    } catch (error) {
      await targetDb.end();
      throw error;
    }

    // Copy schema using pg_dump
    await this.copySchemaPgDump(databaseName);

    // Wait for schema to be available
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Verify schema
    const isValid = await this.verifySchema(databaseUrl);
    if (!isValid) {
      throw new Error('Schema verification failed - not enough tables copied');
    }
  }

  /**
   * Initialize workspace structure in tenant database
   */
  private async initializeWorkspace(
    tenantDb: Pool,
    organizationName: string,
    slug: string,
    email: string,
    passwordHash: string,
    userId: string
  ): Promise<{ workspaceId: string; roleId: string }> {
    try {
      // Get or create application ID
      let appId: string;
      const appResult = await tenantDb.query('SELECT id FROM core.application LIMIT 1');
      
      if (appResult.rows.length === 0) {
        const newAppResult = await tenantDb.query(`
          INSERT INTO core.application (id, name, "universalIdentifier")
          VALUES (gen_random_uuid(), 'Default Application', gen_random_uuid()::text)
          RETURNING id
        `);
        appId = newAppResult.rows[0].id;
      } else {
        appId = appResult.rows[0].id;
      }

      // Create workspace and role in separate queries
      const workspaceId = uuidv4();
      const roleId = uuidv4();
      
      // Create role first
      await tenantDb.query(`
        INSERT INTO core.role (
          id, "workspaceId", label,
          "canUpdateAllSettings", "canAccessAllTools",
          "canReadAllObjectRecords", "canUpdateAllObjectRecords",
          "canSoftDeleteAllObjectRecords", "canDestroyAllObjectRecords"
        ) VALUES ($1, $2, 'Admin', true, true, true, true, true, true)
      `, [roleId, workspaceId]);
      
      // Create workspace
      await tenantDb.query(`
        INSERT INTO core.workspace (
          id, "displayName", subdomain, "activationStatus",
          "databaseUrl", "databaseSchema", "workspaceCustomApplicationId", "defaultRoleId"
        ) VALUES ($1, $2, $3, 'ACTIVE', '', $4, $5, $6)
      `, [workspaceId, organizationName, slug, `workspace_${slug}`, appId, roleId]);
      
      // Verify workspace was created
      const verifyResult = await tenantDb.query(`
        SELECT id, "defaultRoleId" FROM core.workspace WHERE subdomain = $1 LIMIT 1
      `, [slug]);

      if (verifyResult.rows.length === 0) {
        throw new Error('Failed to create workspace and role');
      }
      
      console.log(`✅ Created workspace: ${workspaceId}`);

      // Create user in tenant database
      await tenantDb.query(`
        INSERT INTO core."user" (
          id, email, "passwordHash"
        ) VALUES ($1, $2, $3)
        ON CONFLICT (id) DO NOTHING
      `, [
        userId,
        email.toLowerCase(),
        passwordHash
      ]);

      console.log(`✅ Created user in tenant database`);

      // Add user as workspace member
      await tenantDb.query(`
        INSERT INTO core."userWorkspace" ("userId", "workspaceId")
        VALUES ($1, $2)
        ON CONFLICT DO NOTHING
      `, [userId, workspaceId]);

      console.log(`✅ Added user to workspace`);

      return { workspaceId, roleId };
    } catch (error: any) {
      console.error('Workspace initialization error:', error);
      throw new Error(`Failed to initialize workspace: ${error.message}`);
    }
  }

  /**
   * Rollback tenant creation on failure
   */
  private async rollbackTenant(tenantId: string, databaseName: string): Promise<void> {
    console.log(`🔄 Rolling back tenant creation: ${tenantId}`);

    try {
      // Delete from global registry
      await this.globalDb.query('DELETE FROM global_users WHERE tenant_id = $1', [tenantId]);
      await this.globalDb.query('DELETE FROM tenant_settings WHERE tenant_id = $1', [tenantId]);
      await this.globalDb.query('DELETE FROM tenant_usage WHERE tenant_id = $1', [tenantId]);
      await this.globalDb.query('DELETE FROM tenant_registry WHERE id = $1', [tenantId]);

      // Drop database
      const adminDb = new Pool({
        host: this.postgresHost,
        port: parseInt(this.postgresPort),
        user: this.postgresAdminUser,
        password: this.postgresAdminPassword,
        database: 'postgres',
      });

      try {
        await adminDb.query(`DROP DATABASE IF EXISTS "${databaseName}"`);
        console.log(`✅ Dropped database: ${databaseName}`);
      } catch (error) {
        console.warn(`Failed to drop database ${databaseName}`);
      } finally {
        await adminDb.end();
      }

      console.log(`✅ Rollback completed`);
    } catch (error: any) {
      console.error('Rollback error:', error);
    }
  }

  /**
   * Provision a new tenant with improved error handling
   */
  async provisionTenant(request: TenantProvisioningRequest): Promise<TenantProvisioningResult> {
    const startTime = Date.now();
    let tenantId: string | null = null;
    let databaseName: string | null = null;

    try {
      // 1. Validate inputs
      if (!request.organizationName) {
        throw new Error('Missing required fields: organizationName');
      }
      
      // For Clerk-based auth, adminEmail and adminPassword are optional
      if (!request.adminEmail && !process.env.CLERK_SECRET_KEY) {
        throw new Error('Missing required fields: adminEmail (required when Clerk is not configured)');
      }

      // 2. Check email uniqueness (if provided)
      if (request.adminEmail && !(await this.isEmailUnique(request.adminEmail))) {
        throw new Error('Email already registered');
      }

      // 3. Generate unique slug
      let slug = this.generateSlug(request.organizationName);
      let attempts = 0;
      while (!(await this.isSlugUnique(slug)) && attempts < 10) {
        slug = `${slug}-${Math.floor(Math.random() * 1000)}`;
        attempts++;
      }

      if (attempts >= 10) {
        throw new Error('Failed to generate unique slug');
      }

      // 4. Generate database name and URL
      databaseName = this.generateDatabaseName(slug);
      const databaseUrl = `postgresql://${this.postgresAdminUser}:${this.postgresAdminPassword}@${this.postgresHost}:${this.postgresPort}/${databaseName}`;

      // 5. Create tenant record in registry (status: pending)
      tenantId = uuidv4();
      const adminUserId = uuidv4();
      
      await this.globalDb.query(
        `INSERT INTO tenant_registry 
         (id, slug, name, database_name, database_url, status, plan, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())`,
        [tenantId, slug, request.organizationName, databaseName, databaseUrl, 'pending', request.plan || 'free']
      );

      console.log(`📝 Created tenant registry entry: ${tenantId}`);

      // 6. Create database
      await this.createDatabase(databaseName);

      // 7. Run migrations
      await this.runMigrations(databaseUrl);

      // 8. Initialize workspace (only if email/password provided, otherwise Clerk will handle)
      let passwordHash: string | null = null;
      if (request.adminEmail && request.adminPassword) {
        const bcrypt = await import('bcrypt');
        passwordHash = await bcrypt.hash(request.adminPassword, 10);
        
        const tenantDb = new Pool({ connectionString: databaseUrl });
        
        // Wait for schema to be ready
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        await this.initializeWorkspace(
          tenantDb,
          request.organizationName,
          slug,
          request.adminEmail,
          passwordHash,
          adminUserId
        );
        
        await tenantDb.end();
      } else {
        console.log('⚠️  Skipping workspace initialization - Clerk will handle user creation');
      }

      // 9. Create global user record (if email provided)
      if (request.adminEmail) {
        await this.globalDb.query(
          `INSERT INTO global_users (id, email, password_hash, tenant_id, role, is_active)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [adminUserId, request.adminEmail.toLowerCase(), passwordHash, tenantId, 'ADMIN', true]
        );
      }

      // 10. Update tenant registry to active
      await this.globalDb.query(
        `UPDATE tenant_registry 
         SET admin_user_id = $1, status = $2, updated_at = NOW()
         WHERE id = $3`,
        [adminUserId, 'active', tenantId]
      );

      // 11. Initialize tenant settings and usage
      await this.globalDb.query(
        `INSERT INTO tenant_settings (tenant_id, settings) VALUES ($1, '{}'::jsonb)`,
        [tenantId]
      );

      await this.globalDb.query(
        `INSERT INTO tenant_usage (tenant_id) VALUES ($1)`,
        [tenantId]
      );

      const duration = Date.now() - startTime;
      console.log(`✅ Tenant provisioned in ${duration}ms: ${slug}`);

      return {
        tenantId,
        slug,
        databaseName,
        databaseUrl,
        adminUserId,
        status: 'active',
      };
    } catch (error: any) {
      console.error('❌ Tenant provisioning failed:', error.message);
      
      // Rollback on failure
      if (tenantId && databaseName) {
        await this.rollbackTenant(tenantId, databaseName);
      }
      
      throw error;
    }
  }
}

export default ImprovedTenantProvisioningService;
