/**
 * Clerk Authentication Middleware
 * 
 * Verifies Clerk JWT tokens and extracts user/tenant information.
 * Implements proper JWT verification and role-based access control.
 */

import { Request, Response, NextFunction } from 'express';
import { Pool } from 'pg';
import jwt from 'jsonwebtoken';

export interface ClerkAuthRequest extends Request {
  clerk?: {
    userId: string;
    orgId: string | null;
    email: string;
    tenantId: string | null;
    role?: string;
    permissions?: string[];
  };
}

interface ClerkJWTPayload {
  sub: string;
  email: string;
  email_verified: boolean;
  org_id?: string;
  org_slug?: string;
  org_role?: string;
  iat: number;
  exp: number;
  iss?: string;
}

/**
 * Middleware to verify Clerk JWT token
 * Supports both Clerk JWT and custom JWT tokens
 */
export function clerkAuthMiddleware(globalDb: Pool) {
  return async (req: ClerkAuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Extract token from Authorization header or cookie
      const authHeader = req.headers.authorization;
      const token = authHeader?.startsWith('Bearer ') 
        ? authHeader.replace('Bearer ', '')
        : req.cookies?.__session || req.headers['x-clerk-token'];

      if (!token) {
        // Allow unauthenticated access to certain endpoints
        if (isPublicEndpoint(req.path)) {
          next();
          return;
        }

        res.status(401).json({
          error: 'Unauthorized',
          message: 'No authentication token provided',
        });
        return;
      }

      // Try to extract tenant from header first (for multi-tenant routing)
      const tenantSlug = req.headers['x-tenant-slug'] as string;
      const tenantId = req.headers['x-tenant-id'] as string;

      let clerkUserId = '';
      let clerkOrgId: string | null = null;
      let email = '';
      let role = '';
      let resolvedTenantId: string | null = null;

      // Try to verify as Clerk JWT first
      const clerkPublicKey = process.env.CLERK_PUBLIC_KEY;
      if (clerkPublicKey) {
        try {
          const decoded = jwt.verify(token, clerkPublicKey, {
            algorithms: ['RS256'],
          }) as ClerkJWTPayload;

          clerkUserId = decoded.sub;
          clerkOrgId = decoded.org_id || null;
          email = decoded.email;
          role = decoded.org_role || 'member';

          console.log(`✅ Verified Clerk JWT: ${email}`);
        } catch (error: any) {
          console.warn(`⚠️  Clerk JWT verification failed:`, error.message);
          // Fall through to custom JWT verification
        }
      }

      // If Clerk JWT verification failed, try custom JWT
      if (!clerkUserId) {
        try {
          const jwtSecret = process.env.JWT_SECRET || 'change-me-in-production';
          const decoded = jwt.verify(token, jwtSecret) as any;

          clerkUserId = decoded.sub || decoded.userId;
          email = decoded.email;
          resolvedTenantId = decoded.tenant_id;
          role = decoded.role || 'member';

          console.log(`✅ Verified custom JWT: ${email}`);
        } catch (error: any) {
          console.error('❌ Token verification failed:', error.message);
          res.status(401).json({
            error: 'Unauthorized',
            message: 'Invalid or expired token',
          });
          return;
        }
      }

      // Resolve tenant context
      if (tenantId) {
        // Use tenant ID from header
        resolvedTenantId = tenantId;
      } else if (tenantSlug) {
        // Resolve tenant from slug
        const tenantResult = await globalDb.query(
          'SELECT id, clerk_org_id FROM tenant_registry WHERE slug = $1 AND status = $2',
          [tenantSlug, 'active']
        );

        if (tenantResult.rows.length > 0) {
          resolvedTenantId = tenantResult.rows[0].id;
          clerkOrgId = tenantResult.rows[0].clerk_org_id || clerkOrgId;
        }
      } else if (clerkOrgId) {
        // Resolve tenant from Clerk org ID
        const tenantResult = await globalDb.query(
          'SELECT id FROM tenant_registry WHERE clerk_org_id = $1 AND status = $2',
          [clerkOrgId, 'active']
        );

        if (tenantResult.rows.length > 0) {
          resolvedTenantId = tenantResult.rows[0].id;
        }
      } else if (email) {
        // Resolve tenant from user email
        const userResult = await globalDb.query(
          `SELECT gu.tenant_id, tr.clerk_org_id 
           FROM global_users gu
           LEFT JOIN tenant_registry tr ON gu.tenant_id = tr.id
           WHERE gu.email = $1 AND gu.is_active = true`,
          [email.toLowerCase()]
        );

        if (userResult.rows.length > 0) {
          resolvedTenantId = userResult.rows[0].tenant_id;
          clerkOrgId = userResult.rows[0].clerk_org_id;
        }
      }

      // Validate user is active
      if (clerkUserId || email) {
        const userResult = await globalDb.query(
          `SELECT id, is_active, role FROM global_users 
           WHERE (clerk_user_id = $1 OR email = $2) AND is_active = true`,
          [clerkUserId || null, email.toLowerCase()]
        );

        if (userResult.rows.length === 0) {
          console.warn(`⚠️  User not found or inactive: ${email}`);
          res.status(403).json({
            error: 'Forbidden',
            message: 'User account is inactive or not found',
          });
          return;
        }

        clerkUserId = userResult.rows[0].id;
        role = userResult.rows[0].role || role;
      }

      // Attach to request
      req.clerk = {
        userId: clerkUserId,
        orgId: clerkOrgId,
        email,
        tenantId: resolvedTenantId,
        role,
        permissions: getPermissionsForRole(role),
      };

      console.log(`✅ Auth context: user=${email}, tenant=${resolvedTenantId}, role=${role}`);

      next();
    } catch (error: any) {
      console.error('❌ Clerk auth middleware error:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Authentication service error',
      });
    }
  };
}

/**
 * Check if endpoint is public (doesn't require auth)
 */
function isPublicEndpoint(path: string): boolean {
  const publicPaths = [
    '/health',
    '/api/auth/register',
    '/api/auth/login',
    '/api/webhooks',
    '/api/clerk/webhooks',
    '/api/salla/webhooks',
  ];

  return publicPaths.some(publicPath => path.startsWith(publicPath));
}

/**
 * Get permissions for a role
 */
function getPermissionsForRole(role: string): string[] {
  const rolePermissions: { [key: string]: string[] } = {
    admin: [
      'read:all',
      'write:all',
      'delete:all',
      'manage:users',
      'manage:settings',
      'manage:billing',
    ],
    editor: [
      'read:all',
      'write:all',
      'delete:own',
    ],
    viewer: [
      'read:all',
    ],
    member: [
      'read:own',
      'write:own',
    ],
  };

  return rolePermissions[role.toLowerCase()] || [];
}

/**
 * Require specific role
 */
export function requireRole(...allowedRoles: string[]) {
  return (req: ClerkAuthRequest, res: Response, next: NextFunction): void => {
    if (!req.clerk) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Authentication required',
      });
      return;
    }

    const userRole = req.clerk.role || 'member';
    if (!allowedRoles.includes(userRole.toLowerCase())) {
      res.status(403).json({
        error: 'Forbidden',
        message: `This action requires one of these roles: ${allowedRoles.join(', ')}`,
      });
      return;
    }

    next();
  };
}

/**
 * Require specific permission
 */
export function requirePermission(...requiredPermissions: string[]) {
  return (req: ClerkAuthRequest, res: Response, next: NextFunction): void => {
    if (!req.clerk) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Authentication required',
      });
      return;
    }

    const userPermissions = req.clerk.permissions || [];
    const hasPermission = requiredPermissions.some(permission =>
      userPermissions.includes(permission)
    );

    if (!hasPermission) {
      res.status(403).json({
        error: 'Forbidden',
        message: `This action requires one of these permissions: ${requiredPermissions.join(', ')}`,
      });
      return;
    }

    next();
  };
}

/**
 * Require tenant context
 */
export function requireTenant(req: ClerkAuthRequest, res: Response, next: NextFunction): void {
  if (!req.clerk?.tenantId) {
    res.status(400).json({
      error: 'Bad Request',
      message: 'Tenant context is required. Provide x-tenant-id, x-tenant-slug, or authenticate with Clerk.',
    });
    return;
  }

  next();
}
