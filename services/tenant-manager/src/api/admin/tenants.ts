/**
 * Admin Endpoints for Tenant Management
 * 
 * Global admin endpoints for managing all tenants
 */

import { Router, Request, Response, NextFunction } from 'express';
import { Pool } from 'pg';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export function createAdminRouter(globalDb: Pool): Router {
  const router = Router();

  // Middleware to check if user is super admin
  // In production, this should verify JWT and check role
  const requireSuperAdmin = (req: Request, res: Response, next: NextFunction): void => {
    // TODO: Implement proper super admin verification
    // For now, we'll use a header or API key
    const adminKey = req.headers['x-admin-key'];
    if (adminKey !== process.env.SUPER_ADMIN_KEY) {
      res.status(403).json({
        error: 'Forbidden',
        message: 'Super admin access required',
      });
      return;
    }
    next();
  };

  // GET /api/admin/tenants - List all tenants
  router.get('/tenants', requireSuperAdmin, async (req: Request, res: Response) => {
    try {
      const { status, limit = 100, offset = 0 } = req.query;

      let query = `
        SELECT 
          tr.id,
          tr.slug,
          tr.name,
          tr.database_name,
          tr.status,
          tr.plan,
          tr.created_at,
          tr.updated_at,
          tu.database_size_bytes,
          tu.active_users_count,
          tu.api_calls_count,
          tu.last_activity
        FROM tenant_registry tr
        LEFT JOIN tenant_usage tu ON tr.id = tu.tenant_id
      `;

      const params: any[] = [];
      if (status) {
        query += ` WHERE tr.status = $1`;
        params.push(status);
      }

      query += ` ORDER BY tr.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
      params.push(limit, offset);

      const result = await globalDb.query(query, params);

      res.json({
        success: true,
        data: result.rows,
        pagination: {
          limit: Number(limit),
          offset: Number(offset),
          total: result.rows.length,
        },
      });
    } catch (error: any) {
      console.error('Error fetching tenants:', error);
      res.status(500).json({
        error: 'Failed to fetch tenants',
        message: error.message,
      });
    }
  });

  // GET /api/admin/tenants/:id - Get tenant details
  router.get('/tenants/:id', requireSuperAdmin, async (req: Request, res: Response): Promise<Response | void> => {
    try {
      const { id } = req.params;

      const result = await globalDb.query(
        `SELECT 
          tr.*,
          tu.*,
          ts.settings
         FROM tenant_registry tr
         LEFT JOIN tenant_usage tu ON tr.id = tu.tenant_id
         LEFT JOIN tenant_settings ts ON tr.id = ts.tenant_id
         WHERE tr.id = $1`,
        [id]
      );

      if (result.rows.length === 0) {
        res.status(404).json({
          error: 'Not Found',
          message: 'Tenant not found',
        });
        return;
      }

      res.json({
        success: true,
        data: result.rows[0],
      });
    } catch (error: any) {
      console.error('Error fetching tenant:', error);
      res.status(500).json({
        error: 'Failed to fetch tenant',
        message: error.message,
      });
    }
  });

  // POST /api/admin/tenants/:id/suspend - Suspend tenant
  router.post('/tenants/:id/suspend', requireSuperAdmin, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      await globalDb.query(
        `UPDATE tenant_registry 
         SET status = 'suspended', suspended_at = NOW(), updated_at = NOW()
         WHERE id = $1`,
        [id]
      );

      res.json({
        success: true,
        message: 'Tenant suspended successfully',
      });
    } catch (error: any) {
      console.error('Error suspending tenant:', error);
      res.status(500).json({
        error: 'Failed to suspend tenant',
        message: error.message,
      });
    }
  });

  // POST /api/admin/tenants/:id/activate - Activate tenant
  router.post('/tenants/:id/activate', requireSuperAdmin, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      await globalDb.query(
        `UPDATE tenant_registry 
         SET status = 'active', suspended_at = NULL, updated_at = NOW()
         WHERE id = $1`,
        [id]
      );

      res.json({
        success: true,
        message: 'Tenant activated successfully',
      });
    } catch (error: any) {
      console.error('Error activating tenant:', error);
      res.status(500).json({
        error: 'Failed to activate tenant',
        message: error.message,
      });
    }
  });

  // DELETE /api/admin/tenants/:id - Delete tenant (GDPR compliance)
  router.delete('/tenants/:id', requireSuperAdmin, async (req: Request, res: Response): Promise<Response | void> => {
    try {
      const { id } = req.params;

      // Get tenant info
      const tenantResult = await globalDb.query(
        'SELECT database_name FROM tenant_registry WHERE id = $1',
        [id]
      );

      if (tenantResult.rows.length === 0) {
        res.status(404).json({
          error: 'Not Found',
          message: 'Tenant not found',
        });
        return;
      }

      const databaseName = tenantResult.rows[0].database_name;

      // Drop tenant database
      const postgresAdminUser = process.env.POSTGRES_ADMIN_USER || 'postgres';
      const postgresAdminPassword = process.env.POSTGRES_ADMIN_PASSWORD || '';
      const postgresHost = process.env.POSTGRES_HOST || 'localhost';

      try {
        const dropDbCommand = `PGPASSWORD="${postgresAdminPassword}" psql -h ${postgresHost} -U ${postgresAdminUser} -d postgres -c "DROP DATABASE \\"${databaseName}\\";"`;
        await execAsync(dropDbCommand, {
          env: { ...process.env, PGPASSWORD: postgresAdminPassword },
        });
        console.log(`✅ Dropped database: ${databaseName}`);
      } catch (error: any) {
        console.error(`Failed to drop database ${databaseName}:`, error);
        // Continue with deletion even if DB drop fails
      }

      // Mark tenant as deleted in registry
      await globalDb.query(
        `UPDATE tenant_registry 
         SET status = 'deleted', deleted_at = NOW(), updated_at = NOW()
         WHERE id = $1`,
        [id]
      );

      // Delete global users
      await globalDb.query('DELETE FROM global_users WHERE tenant_id = $1', [id]);

      // Delete tenant settings and usage
      await globalDb.query('DELETE FROM tenant_settings WHERE tenant_id = $1', [id]);
      await globalDb.query('DELETE FROM tenant_usage WHERE tenant_id = $1', [id]);

      res.json({
        success: true,
        message: 'Tenant deleted successfully (GDPR compliant)',
      });
    } catch (error: any) {
      console.error('Error deleting tenant:', error);
      res.status(500).json({
        error: 'Failed to delete tenant',
        message: error.message,
      });
    }
  });

  // GET /api/admin/stats - Get system statistics
  router.get('/stats', requireSuperAdmin, async (_req: Request, res: Response) => {
    try {
      const statsResult = await globalDb.query(`
        SELECT 
          COUNT(*) FILTER (WHERE status = 'active') as active_tenants,
          COUNT(*) FILTER (WHERE status = 'suspended') as suspended_tenants,
          COUNT(*) FILTER (WHERE status = 'pending') as pending_tenants,
          COUNT(*) as total_tenants,
          SUM(tu.database_size_bytes) as total_database_size,
          SUM(tu.active_users_count) as total_active_users,
          SUM(tu.api_calls_count) as total_api_calls
        FROM tenant_registry tr
        LEFT JOIN tenant_usage tu ON tr.id = tu.tenant_id
      `);

      res.json({
        success: true,
        data: statsResult.rows[0],
      });
    } catch (error: any) {
      console.error('Error fetching stats:', error);
      res.status(500).json({
        error: 'Failed to fetch stats',
        message: error.message,
      });
    }
  });

  return router;
}

