/**
 * Tenant Resolver Service
 * 
 * Resolves tenant context from JWT tokens and manages tenant database connections.
 */

import { Pool } from 'pg';
import jwt from 'jsonwebtoken';
import { Tenant } from '../utils/tenant-context.js';
import connectionPoolManager from './connection-pool.js';

interface JWTPayload {
  sub: string;
  email: string;
  tenant_id: string;
  role: string;
  iat: number;
  exp: number;
}

class TenantResolverService {
  private globalDb: Pool;
  private jwtSecret: string;

  constructor(globalDb: Pool, jwtSecret: string) {
    this.globalDb = globalDb;
    this.jwtSecret = jwtSecret;
  }

  /**
   * Verify and decode JWT token
   */
  private verifyToken(token: string): JWTPayload {
    try {
      const decoded = jwt.verify(token, this.jwtSecret) as JWTPayload;
      return decoded;
    } catch (error: any) {
      if (error.name === 'TokenExpiredError') {
        throw new Error('Token has expired');
      }
      if (error.name === 'JsonWebTokenError') {
        throw new Error('Invalid token');
      }
      throw new Error('Token verification failed');
    }
  }

  /**
   * Resolve tenant from JWT token
   */
  async resolveTenantFromToken(token: string): Promise<Tenant> {
    // 1. Verify and decode token
    const payload = this.verifyToken(token);

    if (!payload.tenant_id) {
      throw new Error('Token missing tenant_id');
    }

    // 2. Fetch tenant from registry
    const tenantResult = await this.globalDb.query(
      `SELECT id, slug, name, database_name, database_url, status, plan
       FROM tenant_registry
       WHERE id = $1 AND status = $2`,
      [payload.tenant_id, 'active']
    );

    if (tenantResult.rows.length === 0) {
      throw new Error('Tenant not found or inactive');
    }

    const tenantData = tenantResult.rows[0];

    // 3. Verify user belongs to tenant
    const userResult = await this.globalDb.query(
      `SELECT id, is_active FROM global_users
       WHERE id = $1 AND tenant_id = $2`,
      [payload.sub, payload.tenant_id]
    );

    if (userResult.rows.length === 0) {
      throw new Error('User not found in tenant');
    }

    if (!userResult.rows[0].is_active) {
      throw new Error('User account is inactive');
    }

    // 4. Get or create connection pool
    const pool = await connectionPoolManager.getPool(tenantData.database_url);

    // 5. Build tenant object
    const tenant: Tenant = {
      id: tenantData.id,
      slug: tenantData.slug,
      name: tenantData.name,
      databaseName: tenantData.database_name,
      databaseUrl: tenantData.database_url,
      status: tenantData.status,
      plan: tenantData.plan,
      db: pool,
    };

    return tenant;
  }

  /**
   * Resolve tenant from email (for login)
   */
  async resolveTenantFromEmail(email: string): Promise<Tenant> {
    const userResult = await this.globalDb.query(
      `SELECT gu.tenant_id, tr.id, tr.slug, tr.name, tr.database_name, 
              tr.database_url, tr.status, tr.plan
       FROM global_users gu
       JOIN tenant_registry tr ON gu.tenant_id = tr.id
       WHERE gu.email = $1 AND gu.is_active = true AND tr.status = 'active'`,
      [email.toLowerCase()]
    );

    if (userResult.rows.length === 0) {
      throw new Error('User not found or tenant inactive');
    }

    const tenantData = userResult.rows[0];

    const pool = await connectionPoolManager.getPool(tenantData.database_url);

    return {
      id: tenantData.id,
      slug: tenantData.slug,
      name: tenantData.name,
      databaseName: tenantData.database_name,
      databaseUrl: tenantData.database_url,
      status: tenantData.status,
      plan: tenantData.plan,
      db: pool,
    };
  }

  /**
   * Generate JWT token for user
   */
  generateToken(userId: string, email: string, tenantId: string, role: string): string {
    const payload: JWTPayload = {
      sub: userId,
      email: email.toLowerCase(),
      tenant_id: tenantId,
      role,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60), // 24 hours
    };

    return jwt.sign(payload, this.jwtSecret);
  }
}

export default TenantResolverService;

