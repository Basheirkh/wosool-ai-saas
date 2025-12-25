/**
 * Multi-Tenant Login Endpoint
 * 
 * POST /api/auth/login
 */

import { Router, Request, Response } from 'express';
import { z } from 'zod';
import bcrypt from 'bcrypt';
import { Pool } from 'pg';
import TenantResolverService from '../../services/tenant-resolver.js';

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

export function createLoginRouter(
  globalDb: Pool,
  tenantResolver: TenantResolverService
): Router {
  const router = Router();

  router.post('/login', async (req: Request, res: Response): Promise<Response | void> => {
    try {
      // Validate request body
      const validated = loginSchema.parse(req.body);

      // Find user in global_users
      const userResult = await globalDb.query(
        `SELECT gu.id, gu.email, gu.password_hash, gu.role, gu.tenant_id, 
                gu.is_active, tr.status as tenant_status
         FROM global_users gu
         JOIN tenant_registry tr ON gu.tenant_id = tr.id
         WHERE gu.email = $1`,
        [validated.email.toLowerCase()]
      );

      if (userResult.rows.length === 0) {
        res.status(401).json({
          error: 'Unauthorized',
          message: 'Invalid email or password',
        });
        return;
      }

      const user = userResult.rows[0];

      // Check if user is active
      if (!user.is_active) {
        res.status(403).json({
          error: 'Forbidden',
          message: 'User account is inactive',
        });
        return;
      }

      // Check if tenant is active
      if (user.tenant_status !== 'active') {
        res.status(403).json({
          error: 'Forbidden',
          message: 'Tenant account is not active',
        });
        return;
      }

      // Verify password
      const passwordMatch = await bcrypt.compare(
        validated.password,
        user.password_hash
      );

      if (!passwordMatch) {
        res.status(401).json({
          error: 'Unauthorized',
          message: 'Invalid email or password',
        });
        return;
      }

      // Resolve tenant
      const tenant = await tenantResolver.resolveTenantFromEmail(validated.email);

      // Generate JWT token
      const token = tenantResolver.generateToken(
        user.id,
        user.email,
        user.tenant_id,
        user.role
      );

      // Update last login
      await globalDb.query(
        'UPDATE global_users SET last_login = NOW() WHERE id = $1',
        [user.id]
      );

      res.json({
        success: true,
        data: {
          access_token: token,
          tenant_id: tenant.id,
          database_url: tenant.databaseUrl, // For client-side connection if needed
          user: {
            id: user.id,
            email: user.email,
            role: user.role,
            tenant_id: tenant.id,
          },
        },
      });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: 'Validation error',
          details: error.errors,
        });
      }

      console.error('Login error:', error);
      res.status(500).json({
        error: 'Login failed',
        message: error.message || 'An error occurred during login',
      });
    }
  });

  return router;
}

