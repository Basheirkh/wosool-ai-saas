/**
 * Salla Data Sync Service
 * 
 * Handles data synchronization between Salla and Twenty CRM:
 * - Customer sync
 * - Product sync
 * - Order sync
 */

import { Pool } from 'pg';
import httpx from 'axios';
import connectionPoolManager from './connection-pool.js';

class SallaSyncService {
  private globalDb: Pool;
  private readonly SALLA_API_BASE = 'https://api.salla.dev/admin/v2';

  constructor(globalDb: Pool) {
    this.globalDb = globalDb;
  }

  /**
   * Sync all data for a tenant
   */
  async syncAll(tenantId: string, accessToken: string): Promise<void> {
    console.log(`🔄 Starting full sync for tenant ${tenantId}`);
    
    try {
      await this.syncCustomers(tenantId, accessToken);
      await this.syncProducts(tenantId, accessToken);
      await this.syncOrders(tenantId, accessToken);
      
      console.log(`✅ Full sync complete for tenant ${tenantId}`);
    } catch (error: any) {
      console.error(`❌ Full sync failed for tenant ${tenantId}: ${error.message}`);
    }
  }

  /**
   * Sync customers from Salla to Twenty CRM
   */
  async syncCustomers(tenantId: string, accessToken: string): Promise<void> {
    try {
      // 1. Fetch customers from Salla
      const response = await httpx.get(`${this.SALLA_API_BASE}/customers`, {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });
      const sallaCustomers = response.data.data;

      // 2. Get tenant database connection
      const tenantDb = await connectionPoolManager.getPool(tenantId);
      if (!tenantDb) throw new Error(`Could not get connection pool for tenant ${tenantId}`);

      // 3. Map and insert into Twenty CRM (assuming standard schema)
      for (const customer of sallaCustomers) {
        await tenantDb.query(
          `INSERT INTO "person" (id, "firstName", "lastName", "emails", "createdAt", "updatedAt")
           VALUES (gen_random_uuid(), $1, $2, $3, NOW(), NOW())
           ON CONFLICT DO NOTHING`,
          [customer.first_name, customer.last_name, JSON.stringify([{ email: customer.email, primary: true }])]
        );
      }

      console.log(`✅ Synced ${sallaCustomers.length} customers for tenant ${tenantId}`);
    } catch (error: any) {
      console.error(`❌ Customer sync failed for tenant ${tenantId}: ${error.message}`);
    }
  }

  /**
   * Sync products from Salla to Twenty CRM
   */
  async syncProducts(tenantId: string, accessToken: string): Promise<void> {
    try {
      // 1. Fetch products from Salla
      const response = await httpx.get(`${this.SALLA_API_BASE}/products`, {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });
      const sallaProducts = response.data.data;

      // 2. Get tenant database connection
      const tenantDb = await connectionPoolManager.getPool(tenantId);
      if (!tenantDb) throw new Error(`Could not get connection pool for tenant ${tenantId}`);

      // 3. Map and insert into Twenty CRM
      for (const product of sallaProducts) {
        // Assuming a custom "product" object exists in Twenty CRM
        await tenantDb.query(
          `INSERT INTO "product" (id, name, description, price, "createdAt", "updatedAt")
           VALUES (gen_random_uuid(), $1, $2, $3, NOW(), NOW())
           ON CONFLICT DO NOTHING`,
          [product.name, product.description, product.price.amount]
        );
      }

      console.log(`✅ Synced ${sallaProducts.length} products for tenant ${tenantId}`);
    } catch (error: any) {
      console.error(`❌ Product sync failed for tenant ${tenantId}: ${error.message}`);
    }
  }

  /**
   * Sync orders from Salla to Twenty CRM
   */
  async syncOrders(tenantId: string, accessToken: string): Promise<void> {
    try {
      // 1. Fetch orders from Salla
      const response = await httpx.get(`${this.SALLA_API_BASE}/orders`, {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });
      const sallaOrders = response.data.data;

      // 2. Get tenant database connection
      const tenantDb = await connectionPoolManager.getPool(tenantId);
      if (!tenantDb) throw new Error(`Could not get connection pool for tenant ${tenantId}`);

      // 3. Map and insert into Twenty CRM
      for (const order of sallaOrders) {
        // Assuming a custom "order" object exists in Twenty CRM
        await tenantDb.query(
          `INSERT INTO "order" (id, "orderNumber", "totalAmount", status, "createdAt", "updatedAt")
           VALUES (gen_random_uuid(), $1, $2, $3, NOW(), NOW())
           ON CONFLICT DO NOTHING`,
          [order.reference_id, order.total.amount, order.status.name]
        );
      }

      console.log(`✅ Synced ${sallaOrders.length} orders for tenant ${tenantId}`);
    } catch (error: any) {
      console.error(`❌ Order sync failed for tenant ${tenantId}: ${error.message}`);
    }
  }
}

export default SallaSyncService;
