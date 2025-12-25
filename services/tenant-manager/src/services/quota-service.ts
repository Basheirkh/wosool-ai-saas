/**
 * Tenant Quota Service
 * 
 * Manages resource quotas and usage tracking per tenant
 * Enforces limits and provides usage analytics
 */

import { Pool } from 'pg';
import { TenantQuotas } from './redis-cache.js';

export interface QuotaCheck {
  allowed: boolean;
  reason?: string;
  current: number;
  limit: number;
  percentUsed: number;
}

export interface UsageUpdate {
  storage?: number;
  users?: number;
  apiCalls?: number;
  customObjects?: number;
}

class QuotaService {
  private globalDb: Pool;

  // Default quotas by plan
  private readonly PLAN_QUOTAS = {
    free: {
      storage: 1, // GB
      users: 5,
      apiCalls: 10000, // per month
      customObjects: 10,
    },
    pro: {
      storage: 50,
      users: 50,
      apiCalls: 100000,
      customObjects: 100,
    },
    enterprise: {
      storage: 500,
      users: 1000,
      apiCalls: 1000000,
      customObjects: 1000,
    },
  };

  constructor(globalDb: Pool) {
    this.globalDb = globalDb;
  }

  /**
   * Get tenant quotas
   */
  async getTenantQuotas(tenantId: string): Promise<TenantQuotas | null> {
    try {
      const result = await this.globalDb.query(`
        SELECT 
          tr.plan,
          tu.database_size_bytes,
          tu.active_users_count,
          tu.api_calls_count,
          tu.api_calls_last_reset,
          ts.settings
        FROM tenant_registry tr
        LEFT JOIN tenant_usage tu ON tr.id = tu.tenant_id
        LEFT JOIN tenant_settings ts ON tr.id = ts.tenant_id
        WHERE tr.id = $1
      `, [tenantId]);

      if (result.rows.length === 0) {
        return null;
      }

      const row = result.rows[0];
      const plan = row.plan as 'free' | 'pro' | 'enterprise';
      const planQuotas = this.PLAN_QUOTAS[plan];

      // Get custom quotas from settings if any
      const customQuotas = row.settings?.quotas || {};

      // Calculate current usage
      const storageGB = (row.database_size_bytes || 0) / (1024 * 1024 * 1024);
      const storageLimit = customQuotas.storage || planQuotas.storage;

      const quotas: TenantQuotas = {
        storage: {
          limit: storageLimit,
          current: parseFloat(storageGB.toFixed(2)),
          warning: storageLimit * 0.8,
        },
        users: {
          limit: customQuotas.users || planQuotas.users,
          current: row.active_users_count || 0,
        },
        apiCalls: {
          limit: customQuotas.apiCalls || planQuotas.apiCalls,
          current: row.api_calls_count || 0,
          resetDate: row.api_calls_last_reset || new Date().toISOString(),
        },
        customObjects: {
          limit: customQuotas.customObjects || planQuotas.customObjects,
          current: 0, // TODO: Query tenant database for custom object count
        },
      };

      return quotas;
    } catch (error: any) {
      console.error('Error getting tenant quotas:', error.message);
      return null;
    }
  }

  /**
   * Check if operation is allowed based on quotas
   */
  async checkQuota(
    tenantId: string,
    resource: 'storage' | 'users' | 'apiCalls' | 'customObjects',
    increment: number = 1
  ): Promise<QuotaCheck> {
    const quotas = await this.getTenantQuotas(tenantId);

    if (!quotas) {
      return {
        allowed: false,
        reason: 'Tenant not found',
        current: 0,
        limit: 0,
        percentUsed: 0,
      };
    }

    const quota = quotas[resource];
    const newValue = quota.current + increment;
    const percentUsed = (newValue / quota.limit) * 100;

    if (newValue > quota.limit) {
      return {
        allowed: false,
        reason: `${resource} quota exceeded. Limit: ${quota.limit}, Current: ${quota.current}`,
        current: quota.current,
        limit: quota.limit,
        percentUsed,
      };
    }

    return {
      allowed: true,
      current: quota.current,
      limit: quota.limit,
      percentUsed,
    };
  }

  /**
   * Update tenant usage
   */
  async updateUsage(tenantId: string, updates: UsageUpdate): Promise<void> {
    try {
      const setClauses: string[] = [];
      const values: any[] = [];
      let paramIndex = 1;

      if (updates.storage !== undefined) {
        setClauses.push(`database_size_bytes = $${paramIndex++}`);
        values.push(updates.storage);
      }

      if (updates.users !== undefined) {
        setClauses.push(`active_users_count = $${paramIndex++}`);
        values.push(updates.users);
      }

      if (updates.apiCalls !== undefined) {
        setClauses.push(`api_calls_count = api_calls_count + $${paramIndex++}`);
        values.push(updates.apiCalls);
      }

      if (setClauses.length === 0) {
        return;
      }

      setClauses.push(`last_activity = NOW()`);
      setClauses.push(`updated_at = NOW()`);
      values.push(tenantId);

      const query = `
        UPDATE tenant_usage
        SET ${setClauses.join(', ')}
        WHERE tenant_id = $${paramIndex}
      `;

      await this.globalDb.query(query, values);
    } catch (error: any) {
      console.error('Error updating tenant usage:', error.message);
    }
  }

  /**
   * Increment API call counter
   */
  async incrementApiCalls(tenantId: string, count: number = 1): Promise<void> {
    await this.updateUsage(tenantId, { apiCalls: count });
  }

  /**
   * Reset API call counter (monthly reset)
   */
  async resetApiCalls(tenantId: string): Promise<void> {
    try {
      await this.globalDb.query(`
        UPDATE tenant_usage
        SET api_calls_count = 0,
            api_calls_last_reset = NOW(),
            updated_at = NOW()
        WHERE tenant_id = $1
      `, [tenantId]);

      console.log(`✅ Reset API calls for tenant: ${tenantId}`);
    } catch (error: any) {
      console.error('Error resetting API calls:', error.message);
    }
  }

  /**
   * Get tenants approaching quota limits
   */
  async getTenantsNearingLimits(threshold: number = 80): Promise<any[]> {
    try {
      const result = await this.globalDb.query(`
        SELECT 
          tr.id,
          tr.slug,
          tr.name,
          tr.plan,
          tr.admin_user_id,
          tu.database_size_bytes,
          tu.active_users_count,
          tu.api_calls_count
        FROM tenant_registry tr
        JOIN tenant_usage tu ON tr.id = tu.tenant_id
        WHERE tr.status = 'active'
      `);

      const tenantsNearingLimits = [];

      for (const row of result.rows) {
        const plan = row.plan as 'free' | 'pro' | 'enterprise';
        const planQuotas = this.PLAN_QUOTAS[plan];

        // Check storage
        const storageGB = (row.database_size_bytes || 0) / (1024 * 1024 * 1024);
        const storagePercent = (storageGB / planQuotas.storage) * 100;

        // Check users
        const usersPercent = ((row.active_users_count || 0) / planQuotas.users) * 100;

        // Check API calls
        const apiCallsPercent = ((row.api_calls_count || 0) / planQuotas.apiCalls) * 100;

        if (storagePercent >= threshold || usersPercent >= threshold || apiCallsPercent >= threshold) {
          tenantsNearingLimits.push({
            tenantId: row.id,
            slug: row.slug,
            name: row.name,
            plan: row.plan,
            warnings: {
              storage: storagePercent >= threshold ? storagePercent : null,
              users: usersPercent >= threshold ? usersPercent : null,
              apiCalls: apiCallsPercent >= threshold ? apiCallsPercent : null,
            },
          });
        }
      }

      return tenantsNearingLimits;
    } catch (error: any) {
      console.error('Error getting tenants nearing limits:', error.message);
      return [];
    }
  }

  /**
   * Set custom quotas for a tenant
   */
  async setCustomQuotas(tenantId: string, customQuotas: Partial<TenantQuotas>): Promise<void> {
    try {
      await this.globalDb.query(`
        UPDATE tenant_settings
        SET settings = jsonb_set(
          COALESCE(settings, '{}'::jsonb),
          '{quotas}',
          $1::jsonb
        ),
        updated_at = NOW()
        WHERE tenant_id = $2
      `, [JSON.stringify(customQuotas), tenantId]);

      console.log(`✅ Set custom quotas for tenant: ${tenantId}`);
    } catch (error: any) {
      console.error('Error setting custom quotas:', error.message);
    }
  }

  /**
   * Get usage summary for billing
   */
  async getUsageSummary(tenantId: string, startDate: Date, endDate: Date): Promise<any> {
    try {
      // This would query historical usage data
      // For now, return current usage
      const quotas = await this.getTenantQuotas(tenantId);

      return {
        tenantId,
        period: {
          start: startDate,
          end: endDate,
        },
        usage: quotas,
        cost: this.calculateCost(quotas),
      };
    } catch (error: any) {
      console.error('Error getting usage summary:', error.message);
      return null;
    }
  }

  /**
   * Calculate cost based on usage (simple example)
   */
  private calculateCost(quotas: TenantQuotas | null): any {
    if (!quotas) {
      return { base: 0, overages: 0, total: 0 };
    }

    // Example pricing
    const PRICES = {
      free: 0,
      pro: 49,
      enterprise: 499,
      storageOverage: 0.10, // per GB
      usersOverage: 5, // per user
      apiCallsOverage: 0.001, // per 1000 calls
    };

    let overages = 0;

    // Calculate storage overage
    if (quotas.storage.current > quotas.storage.limit) {
      const overageGB = quotas.storage.current - quotas.storage.limit;
      overages += overageGB * PRICES.storageOverage;
    }

    // Calculate users overage
    if (quotas.users.current > quotas.users.limit) {
      const overageUsers = quotas.users.current - quotas.users.limit;
      overages += overageUsers * PRICES.usersOverage;
    }

    // Calculate API calls overage
    if (quotas.apiCalls.current > quotas.apiCalls.limit) {
      const overageCalls = quotas.apiCalls.current - quotas.apiCalls.limit;
      overages += (overageCalls / 1000) * PRICES.apiCallsOverage;
    }

    return {
      base: PRICES.pro, // Assume pro plan
      overages: parseFloat(overages.toFixed(2)),
      total: parseFloat((PRICES.pro + overages).toFixed(2)),
    };
  }
}

export default QuotaService;
