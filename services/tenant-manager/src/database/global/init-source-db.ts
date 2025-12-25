/**
 * Source Database Initialization
 * 
 * Initializes the source database 'twenty' with the core schema
 * This should be run ONCE during setup, not on every tenant creation
 */

import { Pool } from 'pg';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function initializeSourceDatabase(
  postgresHost: string,
  postgresPort: string,
  postgresUser: string,
  postgresPassword: string,
  sourceDatabaseName: string = 'twenty'
): Promise<void> {
  const adminDb = new Pool({
    host: postgresHost,
    port: parseInt(postgresPort),
    user: postgresUser,
    password: postgresPassword,
    database: 'postgres',
  });

  try {
    console.log(`🔄 Checking source database '${sourceDatabaseName}'...`);

    // Check if database exists
    const dbCheck = await adminDb.query(
      'SELECT 1 FROM pg_database WHERE datname = $1',
      [sourceDatabaseName]
    );

    if (dbCheck.rows.length === 0) {
      console.log(`📦 Creating source database '${sourceDatabaseName}'...`);
      await adminDb.query(`CREATE DATABASE "${sourceDatabaseName}"`);
      console.log(`✅ Created source database '${sourceDatabaseName}'`);
    } else {
      console.log(`✅ Source database '${sourceDatabaseName}' already exists`);
    }

    await adminDb.end();

    // Connect to source database
    const sourceDb = new Pool({
      host: postgresHost,
      port: parseInt(postgresPort),
      user: postgresUser,
      password: postgresPassword,
      database: sourceDatabaseName,
    });

    try {
      // Check if core schema exists
      const schemaCheck = await sourceDb.query(
        `SELECT schema_name FROM information_schema.schemata WHERE schema_name = 'core'`
      );

      if (schemaCheck.rows.length > 0) {
        // Check if tables exist
        const tableCheck = await sourceDb.query(
          `SELECT COUNT(*) as count FROM information_schema.tables WHERE table_schema = 'core'`
        );
        const tableCount = parseInt(tableCheck.rows[0].count);

        if (tableCount >= 3) {
          console.log(`✅ Source database schema already initialized (${tableCount} tables)`);
          await sourceDb.end();
          return;
        }
      }

      console.log(`📦 Initializing source database schema...`);

      // Create core schema
      await sourceDb.query('CREATE SCHEMA IF NOT EXISTS core');

      // Create essential tables
      await sourceDb.query(`
        CREATE TABLE IF NOT EXISTS core.application (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          name VARCHAR(255),
          "universalIdentifier" VARCHAR(255)
        );
      `);

      await sourceDb.query(`
        CREATE TABLE IF NOT EXISTS core.workspace (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          "displayName" VARCHAR(255),
          subdomain VARCHAR(255),
          "activationStatus" VARCHAR(50),
          "databaseUrl" VARCHAR(255),
          "databaseSchema" VARCHAR(255),
          "workspaceCustomApplicationId" UUID,
          "defaultRoleId" UUID
        );
      `);

      await sourceDb.query(`
        CREATE TABLE IF NOT EXISTS core.role (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          "workspaceId" UUID,
          label VARCHAR(255),
          "canUpdateAllSettings" BOOLEAN,
          "canAccessAllTools" BOOLEAN,
          "canReadAllObjectRecords" BOOLEAN,
          "canUpdateAllObjectRecords" BOOLEAN,
          "canSoftDeleteAllObjectRecords" BOOLEAN,
          "canDestroyAllObjectRecords" BOOLEAN
        );
      `);

      await sourceDb.query(`
        CREATE TABLE IF NOT EXISTS core."user" (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          email VARCHAR(255) UNIQUE,
          "firstName" VARCHAR(255),
          "lastName" VARCHAR(255),
          "passwordHash" VARCHAR(255),
          "isEmailVerified" BOOLEAN DEFAULT false,
          "defaultWorkspaceId" UUID
        );
      `);

      await sourceDb.query(`
        CREATE TABLE IF NOT EXISTS core."userWorkspace" (
          "userId" UUID,
          "workspaceId" UUID,
          PRIMARY KEY ("userId", "workspaceId")
        );
      `);

      await sourceDb.query(`
        CREATE TABLE IF NOT EXISTS core.person (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          name VARCHAR(255)
        );
      `);

      await sourceDb.query(`
        CREATE TABLE IF NOT EXISTS core.opportunity (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          title VARCHAR(255)
        );
      `);

      console.log(`✅ Source database schema initialized successfully`);
    } catch (error: any) {
      console.error(`❌ Source database initialization failed: ${error.message}`);
      throw error;
    } finally {
      await sourceDb.end();
    }
  } catch (error: any) {
    console.error(`❌ Failed to initialize source database: ${error.message}`);
    throw error;
  }
}

// CLI execution
if (import.meta.url === `file://${process.argv[1]}`) {
  const postgresHost = process.env.POSTGRES_HOST || 'localhost';
  const postgresPort = process.env.POSTGRES_PORT || '5432';
  const postgresUser = process.env.POSTGRES_ADMIN_USER || process.env.POSTGRES_USER || 'postgres';
  const postgresPassword = process.env.POSTGRES_ADMIN_PASSWORD || process.env.POSTGRES_PASSWORD || '';
  const sourceDatabaseName = process.env.SOURCE_DATABASE_NAME || 'twenty';

  initializeSourceDatabase(postgresHost, postgresPort, postgresUser, postgresPassword, sourceDatabaseName)
    .then(() => {
      console.log('✅ Source database initialization complete');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Source database initialization failed:', error);
      process.exit(1);
    });
}

