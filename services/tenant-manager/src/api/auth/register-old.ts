/**
 * Tenant Registration Endpoint
 * 
 * POST /api/auth/register-organization
 */

import { Router, Request, Response } from 'express';
import { z } from 'zod';
import TenantProvisioningService from '../../services/tenant-provisioning.js';
import TenantResolverService from '../../services/tenant-resolver.js';
import { Pool } from 'pg';

const registerSchema = z.object({
  organization_name: z.string().min(2).max(255),
  admin_email: z.string().email(),
  admin_password: z.string().min(8),
  plan: z.enum(['free', 'pro', 'enterprise']).optional(),
});

export function createRegisterRouter(
  globalDb: Pool,
  tenantProvisioning: TenantProvisioningService,
  tenantResolver: TenantResolverService
): Router {
  const router = Router();

  router.post('/register-organization', async (req: Request, res: Response) => {
    try {
      // Validate request body
      const validated = registerSchema.parse(req.body);

      // Provision tenant
      const result = await tenantProvisioning.provisionTenant({
        organizationName: validated.organization_name,
        adminEmail: validated.admin_email,
        adminPassword: validated.admin_password,
        plan: validated.plan || 'free',
      });

      // Generate JWT token for immediate login
      const token = tenantResolver.generateToken(
        result.adminUserId,
        validated.admin_email,
        result.tenantId,
        'ADMIN'
      );

      // Update last login
      await globalDb.query(
        'UPDATE global_users SET last_login = NOW() WHERE id = $1',
        [result.adminUserId]
      );

      res.status(201).json({
        success: true,
        message: 'Organization registered successfully',
        data: {
          tenant_id: result.tenantId,
          slug: result.slug,
          access_token: token,
          user: {
            id: result.adminUserId,
            email: validated.admin_email,
            role: 'ADMIN',
          },
        },
      });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        res.status(400).json({
          error: 'Validation error',
          details: error.errors,
        });
        return;
      }

      console.error('Registration error:', error);
      res.status(500).json({
        error: 'Registration failed',
        message: error.message || 'An error occurred during registration',
      });
    }
  });

  return router;
}

