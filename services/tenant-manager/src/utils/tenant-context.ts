/**
 * Tenant Context Management
 * 
 * Provides thread-local storage for tenant context using AsyncLocalStorage.
 * This ensures tenant isolation across async operations.
 */

import { AsyncLocalStorage } from 'async_hooks';
import { Pool } from 'pg';

export interface Tenant {
  id: string;
  slug: string;
  name: string;
  databaseName: string;
  databaseUrl: string;
  status: 'pending' | 'active' | 'suspended' | 'deleted';
  plan: 'free' | 'pro' | 'enterprise';
  db?: Pool;
}

class TenantContextManager {
  private static asyncLocalStorage = new AsyncLocalStorage<Tenant>();

  /**
   * Run a function within a tenant context
   */
  static run<T>(tenant: Tenant, callback: () => T): T {
    return this.asyncLocalStorage.run(tenant, callback);
  }

  /**
   * Run an async function within a tenant context
   */
  static async runAsync<T>(tenant: Tenant, callback: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.asyncLocalStorage.run(tenant, async () => {
        try {
          const result = await callback();
          resolve(result);
        } catch (error) {
          reject(error);
        }
      });
    });
  }

  /**
   * Get the current tenant from context
   */
  static getCurrentTenant(): Tenant | undefined {
    return this.asyncLocalStorage.getStore();
  }

  /**
   * Require tenant context (throws if not set)
   */
  static requireTenant(): Tenant {
    const tenant = this.getCurrentTenant();
    if (!tenant) {
      throw new Error('No tenant context available. Ensure tenant middleware is applied.');
    }
    return tenant;
  }

  /**
   * Check if tenant context exists
   */
  static hasTenant(): boolean {
    return this.getCurrentTenant() !== undefined;
  }
}

export default TenantContextManager;

