/**
 * Admin Dashboard API
 * 
 * Real-time dashboard endpoints for monitoring all tenants
 */

import { Router, Request, Response } from 'express';
import { Pool } from 'pg';
import redisCacheService from '../../services/redis-cache.js';
import metricsService from '../../services/metrics-service.js';
import QuotaService from '../../services/quota-service.js';

const router = Router();

export function createDashboardRouter(globalDb: Pool): Router {
  const quotaService = new QuotaService(globalDb);

  /**
   * GET /api/admin/dashboard/overview
   * Get high-level system overview
   */
  router.get('/overview', async (req: Request, res: Response) => {
    try {
      // Get tenant counts
      const tenantStats = await globalDb.query(`
        SELECT 
          COUNT(*) FILTER (WHERE status = 'active') as active,
          COUNT(*) FILTER (WHERE status = 'suspended') as suspended,
          COUNT(*) FILTER (WHERE status = 'pending') as pending,
          COUNT(*) as total
        FROM tenant_registry
      `);

      // Get usage stats
      const usageStats = await globalDb.query(`
        SELECT 
          SUM(database_size_bytes) as total_storage,
          SUM(active_users_count) as total_users,
          SUM(api_calls_count) as total_api_calls,
          SUM(workflow_executions_count) as total_workflows
        FROM tenant_usage
      `);

      // Get recent activity
      const recentActivity = await globalDb.query(`
        SELECT 
          tr.slug,
          tr.name,
          tu.last_activity
        FROM tenant_registry tr
        JOIN tenant_usage tu ON tr.id = tu.tenant_id
        WHERE tr.status = 'active'
        ORDER BY tu.last_activity DESC
        LIMIT 10
      `);

      // Get cache stats
      const cacheStats = await redisCacheService.getStats();

      // Get metrics
      const metrics = await metricsService.getMetricsJSON();

      res.json({
        tenants: tenantStats.rows[0],
        usage: usageStats.rows[0],
        recentActivity: recentActivity.rows,
        cache: cacheStats,
        timestamp: new Date().toISOString(),
      });
    } catch (error: any) {
      console.error('Dashboard overview error:', error);
      res.status(500).json({ error: 'Failed to fetch dashboard overview' });
    }
  });

  /**
   * GET /api/admin/dashboard/tenants
   * Get detailed tenant list with metrics
   */
  router.get('/tenants', async (req: Request, res: Response) => {
    try {
      const { status, plan, search, page = 1, limit = 50 } = req.query;

      let query = `
        SELECT 
          tr.id,
          tr.slug,
          tr.name,
          tr.status,
          tr.plan,
          tr.created_at,
          tu.database_size_bytes,
          tu.active_users_count,
          tu.api_calls_count,
          tu.workflow_executions_count,
          tu.last_activity,
          gu.email as admin_email
        FROM tenant_registry tr
        LEFT JOIN tenant_usage tu ON tr.id = tu.tenant_id
        LEFT JOIN global_users gu ON tr.admin_user_id = gu.id
        WHERE 1=1
      `;

      const params: any[] = [];
      let paramIndex = 1;

      if (status) {
        query += ` AND tr.status = $${paramIndex++}`;
        params.push(status);
      }

      if (plan) {
        query += ` AND tr.plan = $${paramIndex++}`;
        params.push(plan);
      }

      if (search) {
        query += ` AND (tr.name ILIKE $${paramIndex} OR tr.slug ILIKE $${paramIndex} OR gu.email ILIKE $${paramIndex})`;
        params.push(`%${search}%`);
        paramIndex++;
      }

      query += ` ORDER BY tr.created_at DESC`;

      // Add pagination
      const offset = (Number(page) - 1) * Number(limit);
      query += ` LIMIT $${paramIndex++} OFFSET $${paramIndex}`;
      params.push(Number(limit), offset);

      const result = await globalDb.query(query, params);

      // Get total count
      let countQuery = `
        SELECT COUNT(*) as total
        FROM tenant_registry tr
        LEFT JOIN global_users gu ON tr.admin_user_id = gu.id
        WHERE 1=1
      `;
      const countParams: any[] = [];
      let countParamIndex = 1;

      if (status) {
        countQuery += ` AND tr.status = $${countParamIndex++}`;
        countParams.push(status);
      }

      if (plan) {
        countQuery += ` AND tr.plan = $${countParamIndex++}`;
        countParams.push(plan);
      }

      if (search) {
        countQuery += ` AND (tr.name ILIKE $${countParamIndex} OR tr.slug ILIKE $${countParamIndex} OR gu.email ILIKE $${countParamIndex})`;
        countParams.push(`%${search}%`);
      }

      const countResult = await globalDb.query(countQuery, countParams);
      const total = parseInt(countResult.rows[0].total);

      res.json({
        tenants: result.rows,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit)),
        },
      });
    } catch (error: any) {
      console.error('Dashboard tenants error:', error);
      res.status(500).json({ error: 'Failed to fetch tenants' });
    }
  });

  /**
   * GET /api/admin/dashboard/tenant/:id
   * Get detailed tenant information
   */
  router.get('/tenant/:id', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      const result = await globalDb.query(`
        SELECT 
          tr.*,
          tu.*,
          ts.settings,
          gu.email as admin_email,
          gu.created_at as admin_created_at
        FROM tenant_registry tr
        LEFT JOIN tenant_usage tu ON tr.id = tu.tenant_id
        LEFT JOIN tenant_settings ts ON tr.id = ts.tenant_id
        LEFT JOIN global_users gu ON tr.admin_user_id = gu.id
        WHERE tr.id = $1 OR tr.slug = $1
      `, [id]);

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Tenant not found' });
      }

      const tenant = result.rows[0];

      // Get quotas
      const quotas = await quotaService.getTenantQuotas(tenant.id);

      // Get user count from tenant database
      // TODO: Query tenant database for accurate user count

      return res.json({
        tenant,
        quotas,
        timestamp: new Date().toISOString(),
      });
    } catch (error: any) {
      console.error('Dashboard tenant detail error:', error);
      return res.status(500).json({ error: 'Failed to fetch tenant details' });
    }
  });

  /**
   * GET /api/admin/dashboard/alerts
   * Get active alerts and warnings
   */
  router.get('/alerts', async (req: Request, res: Response) => {
    try {
      const alerts: any[] = [];

      // Check for tenants nearing quota limits
      const tenantsNearingLimits = await quotaService.getTenantsNearingLimits(80);
      
      for (const tenant of tenantsNearingLimits) {
        if (tenant.warnings.storage) {
          alerts.push({
            severity: tenant.warnings.storage >= 95 ? 'critical' : 'warning',
            type: 'quota',
            tenantId: tenant.tenantId,
            tenantSlug: tenant.slug,
            message: `Storage usage at ${tenant.warnings.storage.toFixed(1)}%`,
            timestamp: new Date().toISOString(),
          });
        }

        if (tenant.warnings.users) {
          alerts.push({
            severity: tenant.warnings.users >= 95 ? 'critical' : 'warning',
            type: 'quota',
            tenantId: tenant.tenantId,
            tenantSlug: tenant.slug,
            message: `User quota at ${tenant.warnings.users.toFixed(1)}%`,
            timestamp: new Date().toISOString(),
          });
        }

        if (tenant.warnings.apiCalls) {
          alerts.push({
            severity: tenant.warnings.apiCalls >= 95 ? 'critical' : 'warning',
            type: 'quota',
            tenantId: tenant.tenantId,
            tenantSlug: tenant.slug,
            message: `API calls at ${tenant.warnings.apiCalls.toFixed(1)}%`,
            timestamp: new Date().toISOString(),
          });
        }
      }

      // Check for inactive tenants (no activity in 30 days)
      const inactiveResult = await globalDb.query(`
        SELECT tr.id, tr.slug, tr.name, tu.last_activity
        FROM tenant_registry tr
        JOIN tenant_usage tu ON tr.id = tu.tenant_id
        WHERE tr.status = 'active'
          AND tu.last_activity < NOW() - INTERVAL '30 days'
        ORDER BY tu.last_activity ASC
        LIMIT 10
      `);

      for (const tenant of inactiveResult.rows) {
        alerts.push({
          severity: 'info',
          type: 'inactive',
          tenantId: tenant.id,
          tenantSlug: tenant.slug,
          message: `No activity since ${new Date(tenant.last_activity).toLocaleDateString()}`,
          timestamp: new Date().toISOString(),
        });
      }

      res.json({
        alerts,
        count: alerts.length,
        timestamp: new Date().toISOString(),
      });
    } catch (error: any) {
      console.error('Dashboard alerts error:', error);
      res.status(500).json({ error: 'Failed to fetch alerts' });
    }
  });

  /**
   * GET /api/admin/dashboard/metrics
   * Get system metrics
   */
  router.get('/metrics', async (req: Request, res: Response) => {
    try {
      const metrics = await metricsService.getMetricsJSON();
      res.json({
        metrics,
        timestamp: new Date().toISOString(),
      });
    } catch (error: any) {
      console.error('Dashboard metrics error:', error);
      res.status(500).json({ error: 'Failed to fetch metrics' });
    }
  });

  /**
   * GET /api/admin/dashboard/growth
   * Get growth statistics
   */
  router.get('/growth', async (req: Request, res: Response) => {
    try {
      const { period = '30d' } = req.query;

      let interval = '30 days';
      if (period === '7d') interval = '7 days';
      if (period === '90d') interval = '90 days';

      // Get tenant growth
      const growthResult = await globalDb.query(`
        SELECT 
          DATE(created_at) as date,
          COUNT(*) as count,
          plan
        FROM tenant_registry
        WHERE created_at >= NOW() - INTERVAL '${interval}'
        GROUP BY DATE(created_at), plan
        ORDER BY date ASC
      `);

      // Get usage growth
      const usageResult = await globalDb.query(`
        SELECT 
          DATE(updated_at) as date,
          SUM(database_size_bytes) as storage,
          SUM(active_users_count) as users,
          SUM(api_calls_count) as api_calls
        FROM tenant_usage
        WHERE updated_at >= NOW() - INTERVAL '${interval}'
        GROUP BY DATE(updated_at)
        ORDER BY date ASC
      `);

      res.json({
        tenantGrowth: growthResult.rows,
        usageGrowth: usageResult.rows,
        period,
        timestamp: new Date().toISOString(),
      });
    } catch (error: any) {
      console.error('Dashboard growth error:', error);
      res.status(500).json({ error: 'Failed to fetch growth statistics' });
    }
  });

  return router;
}

export default createDashboardRouter;
