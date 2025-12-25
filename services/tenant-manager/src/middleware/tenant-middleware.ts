/**
 * Tenant Middleware
 * 
 * Express middleware for tenant resolution and context injection.
 */

import { Request, Response, NextFunction } from 'express';
import TenantResolverService from '../services/tenant-resolver.js';
import TenantContextManager from '../utils/tenant-context.js';

export interface AuthenticatedRequest extends Request {
  tenant?: any;
  user?: {
    id: string;
    email: string;
    role: string;
    tenantId: string;
  };
}

/**
 * Middleware to resolve tenant from JWT token
 */
export function tenantMiddleware(tenantResolver: TenantResolverService) {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      // Extract token from Authorization header
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        res.status(401).json({
          error: 'Unauthorized',
          message: 'No authentication token provided',
        });
        return;
      }

      const token = authHeader.replace('Bearer ', '');

      // Resolve tenant from token
      const tenant = await tenantResolver.resolveTenantFromToken(token);

      // Decode token to get user info
      const jwt = await import('jsonwebtoken');
      const decoded = jwt.decode(token) as any;

      // Attach tenant and user to request
      req.tenant = tenant;
      req.user = {
        id: decoded.sub,
        email: decoded.email,
        role: decoded.role,
        tenantId: tenant.id,
      };

      // Run next middleware in tenant context
      TenantContextManager.run(tenant, () => {
        next();
      });
    } catch (error: any) {
      console.error('Tenant resolution error:', error);
      res.status(403).json({
        error: 'Forbidden',
        message: error.message || 'Failed to resolve tenant',
      });
      return;
    }
  };
}

/**
 * Optional middleware for public endpoints that don't require tenant context
 */
export function optionalTenantMiddleware(tenantResolver: TenantResolverService) {
  return async (req: AuthenticatedRequest, _res: Response, next: NextFunction) => {
    try {
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.replace('Bearer ', '');
        const tenant = await tenantResolver.resolveTenantFromToken(token);
        const jwt = await import('jsonwebtoken');
        const decoded = jwt.decode(token) as any;

        req.tenant = tenant;
        req.user = {
          id: decoded.sub,
          email: decoded.email,
          role: decoded.role,
          tenantId: tenant.id,
        };

        TenantContextManager.run(tenant, () => {
          next();
        });
      } else {
        next();
      }
    } catch (error) {
      // If token is invalid, continue without tenant context
      next();
    }
  };
}

