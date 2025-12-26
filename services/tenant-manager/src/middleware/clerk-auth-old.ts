/**
 * Clerk Authentication Middleware
 * 
 * Verifies Clerk JWT tokens and extracts user/tenant information
 */

import { Request, Response, NextFunction } from 'express';
import { Pool } from 'pg';

export interface ClerkAuthRequest extends Request {
  clerk?: {
    userId: string;
    orgId: string | null;
    email: string;
    tenantId: string | null;
  };
}

/**
 * Middleware to verify Clerk JWT token
 * Note: This is a simplified version. In production, use @clerk/clerk-sdk-node
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
        res.status(401).json({
          error: 'Unauthorized',
          message: 'No authentication token provided',
        });
        return;
      }

      // For now, we'll extract tenant from token or header
      // In production, verify the JWT with Clerk's public key
      const tenantSlug = req.headers['x-tenant-slug'] as string;
      
      if (tenantSlug) {
        // Resolve tenant from slug
        const tenantResult = await globalDb.query(
          'SELECT id, clerk_org_id FROM tenant_registry WHERE slug = $1 AND status = $2',
          [tenantSlug, 'active']
        );

        if (tenantResult.rows.length > 0) {
          req.clerk = {
            userId: '', // Will be extracted from token in production
            orgId: tenantResult.rows[0].clerk_org_id,
            email: '',
            tenantId: tenantResult.rows[0].id,
          };
        }
      }

      next();
    } catch (error: any) {
      console.error('Clerk auth middleware error:', error);
      res.status(403).json({
        error: 'Forbidden',
        message: 'Failed to verify authentication',
      });
    }
  };
}

