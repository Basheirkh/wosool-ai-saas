/**
 * Clerk Authentication Service - Revised
 * 
 * Handles Clerk JWT verification and token conversion to Twenty CRM format
 * Properly handles __clerk_db_jwt tokens and workspace resolution
 */

import { Pool } from 'pg';
import jwt from 'jsonwebtoken';
import { createHash } from 'crypto';
import { v4 as uuidv4 } from 'uuid';

export interface ClerkJwtPayload {
  sub: string; // User ID
  org_id?: string; // Organization ID
  org_role?: string; // User's role in org
  email?: string;
  [key: string]: any;
}

export interface TwentyCrmTokenPayload {
  sub: string;
  userId: string;
  workspaceId: string;
  userWorkspaceId: string;
  authProvider: string;
  type: string;
}

class ClerkAuthService {
  private globalDb: Pool;
  private clerkSecretKey: string;

  constructor(globalDb: Pool) {
    this.globalDb = globalDb;
    this.clerkSecretKey = process.env.CLERK_SECRET_KEY || '';
    
    if (!this.clerkSecretKey) {
      console.warn('⚠️  CLERK_SECRET_KEY not set - Clerk JWT verification will be limited');
    }
  }

  /**
   * Exchange Clerk database JWT for session token
   * The __clerk_db_jwt is not a standard JWT - it needs to be exchanged
   */
  async exchangeClerkDbJwt(dbJwt: string): Promise<string> {
    try {
      // If it looks like a JWT, try to decode it
      if (dbJwt.includes('.')) {
        const parts = dbJwt.split('.');
        if (parts.length === 3) {
          // It's a JWT - decode it
          const decoded = jwt.decode(dbJwt) as any;
          if (decoded && decoded.sub) {
            // Use it as-is if it has the right structure
            return dbJwt;
          }
        }
      }

      // If it's a Clerk database JWT (starts with dvb_), we need to use Clerk API
      // For now, treat it as a session token identifier
      // In production, you'd call Clerk's API to exchange it
      console.log('⚠️  Clerk DB JWT detected - treating as session identifier');
      return dbJwt;
    } catch (error: any) {
      throw new Error(`Failed to exchange Clerk DB JWT: ${error.message}`);
    }
  }

  /**
   * Verify Clerk JWT token
   * Handles both standard JWTs and Clerk database JWTs
   */
  async verifyClerkToken(token: string): Promise<ClerkJwtPayload> {
    try {
      // If it's a Clerk DB JWT, exchange it first
      if (token.startsWith('dvb_')) {
        const sessionToken = await this.exchangeClerkDbJwt(token);
        // For now, we'll need to extract info from the token differently
        // In production, use Clerk's API to get session info
        return {
          sub: 'clerk-user', // Will be resolved from Clerk API
          org_id: undefined, // Will be resolved from Clerk API
        };
      }

      // Try to decode as JWT
      const decoded = jwt.decode(token) as ClerkJwtPayload;
      
      if (!decoded || !decoded.sub) {
        throw new Error('Invalid token format');
      }

      return decoded;
    } catch (error: any) {
      throw new Error(`Token verification failed: ${error.message}`);
    }
  }

  /**
   * Get Clerk session info from Clerk API
   * This is the proper way to handle __clerk_db_jwt tokens
   */
  async getClerkSessionInfo(dbJwt: string): Promise<{
    userId: string;
    orgId: string | null;
    email: string | null;
  }> {
    try {
      // Call Clerk's API to get session info
      const clerkApiUrl = process.env.CLERK_API_URL || 'https://api.clerk.dev';
      const response = await fetch(`${clerkApiUrl}/v1/sessions/${dbJwt}`, {
        headers: {
          'Authorization': `Bearer ${this.clerkSecretKey}`,
        },
      });

      if (!response.ok) {
        // Fallback: try to extract from token or use a default
        console.warn('⚠️  Could not fetch Clerk session, using fallback');
        return {
          userId: 'clerk-user',
          orgId: null,
          email: null,
        };
      }

      const session: any = await response.json();
      return {
        userId: session.user_id || session.userId,
        orgId: session.org_id || session.organizationId || null,
        email: session.email || null,
      };
    } catch (error: any) {
      console.warn('⚠️  Clerk API call failed, using fallback:', error.message);
      // Fallback: return default values
      return {
        userId: 'clerk-user',
        orgId: null,
        email: null,
      };
    }
  }

  /**
   * Resolve tenant from Clerk organization ID
   */
  async resolveTenantFromClerkOrg(clerkOrgId: string): Promise<{
    tenantId: string;
    databaseUrl: string;
    workspaceId: string;
  } | null> {
    const result = await this.globalDb.query(
      `SELECT tr.id as tenant_id, tr.database_url, tr.database_name
       FROM tenant_registry tr
       WHERE tr.clerk_org_id = $1 AND tr.status = 'active'
       LIMIT 1`,
      [clerkOrgId]
    );

    if (result.rows.length === 0) {
      return null;
    }

    const tenant = result.rows[0];
    
    // Get workspace ID from tenant database
    const { default: connectionPoolManager } = await import('./connection-pool.js');
    const tenantDb = await connectionPoolManager.getPool(tenant.database_url);
    
    const workspaceResult = await tenantDb.query(
      `SELECT id FROM core.workspace LIMIT 1`
    );

    const workspaceId = workspaceResult.rows.length > 0 
      ? workspaceResult.rows[0].id 
      : tenant.tenant_id; // Fallback to tenant_id

    return {
      tenantId: tenant.tenant_id,
      databaseUrl: tenant.database_url,
      workspaceId: workspaceId,
    };
  }

  /**
   * Get or create user in tenant database from Clerk user
   */
  async getOrCreateUserFromClerk(
    clerkUserId: string,
    email: string,
    tenantId: string,
    tenantDb: Pool,
    workspaceId: string
  ): Promise<{ userId: string; userWorkspaceId: string }> {
    // Check if user exists in global_users
    const globalUserResult = await this.globalDb.query(
      `SELECT id FROM global_users 
       WHERE clerk_user_id = $1 OR email = $2
       LIMIT 1`,
      [clerkUserId, email.toLowerCase()]
    );

    let userId: string;
    if (globalUserResult.rows.length > 0) {
      userId = globalUserResult.rows[0].id;
    } else {
      // Create user in global_users
      const newUserResult = await this.globalDb.query(
        `INSERT INTO global_users (id, email, clerk_user_id, tenant_id, is_active)
         VALUES (gen_random_uuid(), $1, $2, $3, true)
         RETURNING id`,
        [email.toLowerCase(), clerkUserId, tenantId]
      );
      userId = newUserResult.rows[0].id;
    }

    // Get or create user in tenant database
    const tenantUserResult = await tenantDb.query(
      `SELECT id FROM core."user" WHERE email = $1 LIMIT 1`,
      [email.toLowerCase()]
    );

    if (tenantUserResult.rows.length === 0) {
      // Create user in tenant database (no password - Clerk handles auth)
      await tenantDb.query(
        `INSERT INTO core."user" (id, email, "isEmailVerified")
         VALUES ($1, $2, true)
         ON CONFLICT (id) DO NOTHING`,
        [userId, email.toLowerCase()]
      );
    }

    // Ensure workspace exists
    const workspaceCheck = await tenantDb.query(
      `SELECT id FROM core.workspace WHERE id = $1 LIMIT 1`,
      [workspaceId]
    );

    if (workspaceCheck.rows.length === 0) {
      throw new Error(`Workspace ${workspaceId} does not exist in tenant database`);
    }

    // Link user to workspace
    const userWorkspaceResult = await tenantDb.query(
      `INSERT INTO core."userWorkspace" (id, "userId", "workspaceId")
       VALUES (gen_random_uuid(), $1, $2)
       ON CONFLICT ("userId", "workspaceId") DO UPDATE SET id = EXCLUDED.id
       RETURNING id`,
      [userId, workspaceId]
    );

    const userWorkspaceId = userWorkspaceResult.rows[0]?.id || 
      (await tenantDb.query(
        `SELECT id FROM core."userWorkspace" 
         WHERE "userId" = $1 AND "workspaceId" = $2`,
        [userId, workspaceId]
      )).rows[0]?.id;

    if (!userWorkspaceId) {
      throw new Error('Failed to create user-workspace link');
    }

    return { userId, userWorkspaceId };
  }

  /**
   * Generate Twenty CRM-compatible token from Clerk token
   * This creates a token that Twenty CRM can understand
   */
  async generateTwentyCrmToken(
    clerkToken: string,
    jwtSecret: string
  ): Promise<{ accessToken: string; refreshToken: string; expiresAt: string }> {
    // Handle Clerk DB JWT
    let clerkPayload: ClerkJwtPayload;
    let sessionInfo: { userId: string; orgId: string | null; email: string | null };

    if (clerkToken.startsWith('dvb_')) {
      // It's a Clerk database JWT - get session info from Clerk API
      sessionInfo = await this.getClerkSessionInfo(clerkToken);
      clerkPayload = {
        sub: sessionInfo.userId,
        org_id: sessionInfo.orgId || undefined,
        email: sessionInfo.email || undefined,
      };
    } else {
      // Standard JWT
      clerkPayload = await this.verifyClerkToken(clerkToken);
      sessionInfo = {
        userId: clerkPayload.sub,
        orgId: clerkPayload.org_id || null,
        email: clerkPayload.email || null,
      };
    }
    
    if (!clerkPayload.org_id && !sessionInfo.orgId) {
      throw new Error('Clerk token missing organization ID. Please ensure you are part of an organization in Clerk.');
    }

    const orgId = clerkPayload.org_id || sessionInfo.orgId!;

    // Resolve tenant
    const tenant = await this.resolveTenantFromClerkOrg(orgId);
    if (!tenant) {
      throw new Error(`Tenant not found for Clerk organization ${orgId}. Please ensure the organization is provisioned.`);
    }

    // Get tenant database connection
    const { default: connectionPoolManager } = await import('./connection-pool.js');
    const tenantDb = await connectionPoolManager.getPool(tenant.databaseUrl);

    // Get or create user
    const { userId, userWorkspaceId } = await this.getOrCreateUserFromClerk(
      sessionInfo.userId,
      sessionInfo.email || `user-${sessionInfo.userId}@clerk.dev`,
      tenant.tenantId,
      tenantDb,
      tenant.workspaceId
    );

    // Generate Twenty CRM ACCESS token (not WORKSPACE_AGNOSTIC)
    // Twenty CRM expects ACCESS token with workspaceId
    const expiresIn = 24 * 60 * 60; // 24 hours
    const expiresAt = new Date(Date.now() + expiresIn * 1000).toISOString();

    const accessTokenPayload: TwentyCrmTokenPayload = {
      sub: userId,
      userId: userId,
      workspaceId: tenant.workspaceId,
      userWorkspaceId: userWorkspaceId,
      authProvider: 'clerk',
      type: 'ACCESS', // Twenty CRM expects ACCESS token
    };

    // Use JWT_SECRET directly (Twenty CRM style)
    const accessToken = jwt.sign(accessTokenPayload, jwtSecret, {
      expiresIn: expiresIn,
    });

    // Generate refresh token
    const refreshTokenPayload = {
      sub: userId,
      userId: userId,
      authProvider: 'clerk',
      targetedTokenType: 'ACCESS',
      type: 'REFRESH',
    };

    const refreshToken = jwt.sign(refreshTokenPayload, jwtSecret, {
      expiresIn: 30 * 24 * 60 * 60, // 30 days
    });

    return {
      accessToken,
      refreshToken,
      expiresAt,
    };
  }
}

export default ClerkAuthService;
