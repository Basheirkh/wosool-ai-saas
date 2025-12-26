/**
 * Clerk Authentication API
 * 
 * Endpoint to convert Clerk JWT tokens to Twenty CRM-compatible tokens
 */

import { Router, Request, Response } from 'express';
import { z } from 'zod';
import ClerkAuthService from '../../services/clerk-auth.service.js';

const clerkAuthSchema = z.object({
  clerkToken: z.string().min(1),
});

export function createClerkAuthRouter(
  globalDb: any,
  jwtSecret: string
): Router {
  const router = Router();
  const clerkAuthService = new ClerkAuthService(globalDb);

  /**
   * POST /api/clerk/auth/token
   * 
   * Converts Clerk JWT token to Twenty CRM-compatible token
   */
  router.post('/token', async (req: Request, res: Response): Promise<Response | void> => {
    try {
      const validated = clerkAuthSchema.parse(req.body);
      const { clerkToken } = validated;

      // Generate Twenty CRM token from Clerk token
      const tokens = await clerkAuthService.generateTwentyCrmToken(clerkToken, jwtSecret);

      return res.json({
        success: true,
        data: {
          accessOrWorkspaceAgnosticToken: {
            token: tokens.accessToken,
            expiresAt: tokens.expiresAt,
          },
          refreshToken: {
            token: tokens.refreshToken,
            expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
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

      console.error('Clerk auth error:', error);
      return res.status(401).json({
        error: 'Authentication failed',
        message: error.message || 'Failed to convert Clerk token',
      });
    }
  });

  /**
   * GET /api/clerk/auth/verify
   * 
   * Verify Clerk token and return user/tenant info
   */
  router.get('/verify', async (req: Request, res: Response): Promise<Response | void> => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({
          error: 'Unauthorized',
          message: 'No Clerk token provided',
        });
      }

      const clerkToken = authHeader.replace('Bearer ', '');
      const payload = await clerkAuthService.verifyClerkToken(clerkToken);
      
      const tenant = payload.org_id
        ? await clerkAuthService.resolveTenantFromClerkOrg(payload.org_id)
        : null;

      return res.json({
        success: true,
        data: {
          userId: payload.sub,
          email: payload.email,
          orgId: payload.org_id,
          orgRole: payload.org_role,
          tenant: tenant ? {
            id: tenant.tenantId,
            workspaceId: tenant.workspaceId,
          } : null,
        },
      });
    } catch (error: any) {
      console.error('Clerk verify error:', error);
      return res.status(401).json({
        error: 'Verification failed',
        message: error.message || 'Invalid Clerk token',
      });
    }
  });

  return router;
}


