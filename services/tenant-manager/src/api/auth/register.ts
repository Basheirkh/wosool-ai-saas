/**
 * Tenant Registration Endpoint
 * 
 * POST /api/auth/register-organization
 * 
 * Features:
 * - Idempotency support (same request won't create duplicates)
 * - Comprehensive validation
 * - Proper error handling
 * - Async provisioning with status tracking
 */

import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import { Pool } from 'pg';
import ImprovedTenantProvisioningService from '../../services/tenant-provisioning.js';
import TenantResolverService from '../../services/tenant-resolver.js';

const registerSchema = z.object({
  organization_name: z.string().min(2).max(255),
  admin_email: z.string().email().optional(),
  admin_password: z.string().min(8).optional(),
  plan: z.enum(['free', 'pro', 'enterprise']).optional(),
  idempotency_key: z.string().optional(),
});

interface IdempotencyRecord {
  idempotencyKey: string;
  status: 'processing' | 'completed' | 'failed';
  result?: any;
  error?: string;
}

export function createRegisterRouter(
  globalDb: Pool,
  tenantProvisioning: ImprovedTenantProvisioningService,
  tenantResolver: TenantResolverService
): Router {
  const router = Router();

  /**
   * Initialize idempotency tracking table
   */
  async function initializeIdempotencyTable(): Promise<void> {
    try {
      await globalDb.query(`
        CREATE TABLE IF NOT EXISTS registration_idempotency (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          idempotency_key VARCHAR(255) NOT NULL UNIQUE,
          status VARCHAR(50) NOT NULL DEFAULT 'processing',
          result JSONB,
          error TEXT,
          created_at TIMESTAMP DEFAULT NOW(),
          completed_at TIMESTAMP,
          updated_at TIMESTAMP DEFAULT NOW()
        );

        CREATE INDEX IF NOT EXISTS idx_registration_idempotency_key 
          ON registration_idempotency(idempotency_key);
        CREATE INDEX IF NOT EXISTS idx_registration_status 
          ON registration_idempotency(status);
      `);
    } catch (error) {
      console.warn('Idempotency table may already exist');
    }
  }

  /**
   * Check if request was already processed
   */
  async function checkIdempotency(idempotencyKey: string): Promise<IdempotencyRecord | null> {
    try {
      const result = await globalDb.query(
        `SELECT idempotency_key, status, result, error 
         FROM registration_idempotency 
         WHERE idempotency_key = $1`,
        [idempotencyKey]
      );

      if (result.rows.length === 0) {
        return null;
      }

      const row = result.rows[0];
      return {
        idempotencyKey: row.idempotency_key,
        status: row.status,
        result: row.result ? JSON.parse(row.result) : undefined,
        error: row.error || undefined,
      };
    } catch (error: any) {
      console.error('Error checking idempotency:', error);
      return null;
    }
  }

  /**
   * Mark request as processing
   */
  async function markProcessing(idempotencyKey: string): Promise<void> {
    try {
      await globalDb.query(
        `INSERT INTO registration_idempotency (idempotency_key, status)
         VALUES ($1, 'processing')
         ON CONFLICT (idempotency_key) DO NOTHING`,
        [idempotencyKey]
      );
    } catch (error: any) {
      console.error('Error marking as processing:', error);
    }
  }

  /**
   * Mark request as completed
   */
  async function markCompleted(idempotencyKey: string, result: any): Promise<void> {
    try {
      await globalDb.query(
        `UPDATE registration_idempotency 
         SET status = 'completed', result = $1, completed_at = NOW(), updated_at = NOW()
         WHERE idempotency_key = $2`,
        [JSON.stringify(result), idempotencyKey]
      );
    } catch (error: any) {
      console.error('Error marking as completed:', error);
    }
  }

  /**
   * Mark request as failed
   */
  async function markFailed(idempotencyKey: string, error: string): Promise<void> {
    try {
      await globalDb.query(
        `UPDATE registration_idempotency 
         SET status = 'failed', error = $1, completed_at = NOW(), updated_at = NOW()
         WHERE idempotency_key = $2`,
        [error, idempotencyKey]
      );
    } catch (error: any) {
      console.error('Error marking as failed:', error);
    }
  }

  // Initialize table on startup
  initializeIdempotencyTable().catch(console.error);

  /**
   * POST /api/auth/register-organization
   * 
   * Register a new organization
   */
  router.post('/register-organization', async (req: Request, res: Response) => {
    try {
      // Validate request body
      const validated = registerSchema.parse(req.body);

      // Generate or use provided idempotency key
      const idempotencyKey = validated.idempotency_key || `${validated.organization_name}:${Date.now()}:${Math.random()}`;

      console.log(`📝 Registration request: ${validated.organization_name} (Idempotency: ${idempotencyKey})`);

      // Check if already processed
      const existing = await checkIdempotency(idempotencyKey);
      if (existing) {
        if (existing.status === 'completed') {
          console.log(`✅ Returning cached result for idempotency key: ${idempotencyKey}`);
          res.status(201).json({
            success: true,
            cached: true,
            message: 'Organization already registered',
            data: existing.result,
          });
          return;
        } else if (existing.status === 'processing') {
          console.log(`ℹ️  Registration still processing for idempotency key: ${idempotencyKey}`);
          res.status(202).json({
            success: true,
            processing: true,
            message: 'Organization registration is in progress',
            idempotency_key: idempotencyKey,
          });
          return;
        } else if (existing.status === 'failed') {
          console.log(`❌ Previous registration failed for idempotency key: ${idempotencyKey}`);
          res.status(400).json({
            error: 'Registration failed',
            message: existing.error || 'Previous registration attempt failed',
            idempotency_key: idempotencyKey,
          });
          return;
        }
      }

      // Mark as processing
      await markProcessing(idempotencyKey);

      // Provision tenant (async)
      const provisioningPromise = (async () => {
        try {
          const result = await tenantProvisioning.provisionTenant({
            organizationName: validated.organization_name,
            adminEmail: validated.admin_email || '',
            adminPassword: validated.admin_password || '',
            plan: validated.plan || 'free',
          });

          // Generate JWT token for immediate login
          let token = '';
          if (validated.admin_email) {
            token = tenantResolver.generateToken(
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
          }

          const responseData = {
            tenant_id: result.tenantId,
            slug: result.slug,
            database_name: result.databaseName,
            plan: validated.plan || 'free',
            status: result.status,
            access_token: token || undefined,
            user: validated.admin_email ? {
              id: result.adminUserId,
              email: validated.admin_email,
              role: 'ADMIN',
            } : undefined,
            preseed_result: result.preseedResult,
          };

          // Mark as completed
          await markCompleted(idempotencyKey, responseData);

          console.log(`✅ Registration completed: ${result.slug}`);

          return responseData;
        } catch (error: any) {
          console.error(`❌ Registration failed:`, error.message);
          await markFailed(idempotencyKey, error.message);
          throw error;
        }
      })();

      // Wait for provisioning to complete (with timeout)
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Registration timeout')), 30000)
      );

      try {
        const result = await Promise.race([provisioningPromise, timeoutPromise]);

        res.status(201).json({
          success: true,
          message: 'Organization registered successfully',
          data: result,
          idempotency_key: idempotencyKey,
        });
      } catch (timeoutError) {
        // Provisioning is still in progress, return 202 Accepted
        console.log(`⏱️  Provisioning timeout, returning 202 Accepted`);
        res.status(202).json({
          success: true,
          processing: true,
          message: 'Organization registration is in progress',
          idempotency_key: idempotencyKey,
        });

        // Continue provisioning in background
        provisioningPromise.catch(error => {
          console.error('Background provisioning failed:', error);
        });
      }
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        res.status(400).json({
          error: 'Validation error',
          details: error.errors,
        });
        return;
      }

      console.error('❌ Registration error:', error);
      res.status(500).json({
        error: 'Registration failed',
        message: error.message || 'An error occurred during registration',
      });
    }
  });

  /**
   * GET /api/auth/registration-status/:idempotencyKey
   * 
   * Check registration status
   */
  router.get('/registration-status/:idempotencyKey', async (req: Request, res: Response) => {
    try {
      const { idempotencyKey } = req.params;

      const record = await checkIdempotency(idempotencyKey);

      if (!record) {
        res.status(404).json({
          error: 'Not found',
          message: 'No registration found for this idempotency key',
        });
        return;
      }

      res.json({
        success: true,
        idempotency_key: idempotencyKey,
        status: record.status,
        result: record.status === 'completed' ? record.result : undefined,
        error: record.status === 'failed' ? record.error : undefined,
      });
    } catch (error: any) {
      console.error('Error checking registration status:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: error.message,
      });
    }
  });

  return router;
}
