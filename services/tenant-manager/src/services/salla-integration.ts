/**
 * Salla Integration Service
 * 
 * Handles Salla-specific logic:
 * - Automatic tenant creation on app installation
 * - Data fetching from Salla (customers, products, orders)
 * - Script injection for ElevenLabs widget
 */

import { Pool } from 'pg';
import httpx from 'axios'; // Using axios for simplicity in Node.js
import { v4 as uuidv4 } from 'uuid';
import ProvisioningQueueService from './provisioning-queue.js';
import metricsService from './metrics-service.js';
import SallaSyncService from './salla-sync.js';

export interface SallaStoreInfo {
  id: string;
  name: string;
  domain: string;
  email: string;
  mobile: string;
}

export interface SallaInstallationPayload {
  store_id: string;
  access_token: string;
  refresh_token?: string;
  expires_in?: number;
  store_info: SallaStoreInfo;
}

class SallaIntegrationService {
  private globalDb: Pool;
  private provisioningQueue: ProvisioningQueueService;
  private readonly SALLA_API_BASE = 'https://api.salla.dev/admin/v2';

  constructor(globalDb: Pool, provisioningQueue: ProvisioningQueueService) {
    this.globalDb = globalDb;
    this.provisioningQueue = provisioningQueue;
  }

  /**
   * Handle Salla app installation
   * 1. Create tenant automatically
   * 2. Store Salla credentials
   * 3. Trigger initial data sync
   * 4. Inject ElevenLabs widget script
   */
  async handleInstallation(payload: SallaInstallationPayload): Promise<string> {
    const startTime = Date.now();
    console.log(`🚀 Handling Salla installation for store: ${payload.store_info.name} (${payload.store_id})`);

    try {
      // 1. Check if tenant already exists for this Salla store
      const existingTenant = await this.globalDb.query(
        'SELECT id, slug FROM tenant_registry WHERE salla_store_id = $1',
        [payload.store_id]
      );

      if (existingTenant.rows.length > 0) {
        console.log(`ℹ️ Tenant already exists for Salla store ${payload.store_id}: ${existingTenant.rows[0].slug}`);
        
        // Update tokens
        await this.globalDb.query(
          'UPDATE tenant_registry SET salla_access_token = $1, salla_refresh_token = $2, updated_at = NOW() WHERE id = $3',
          [payload.access_token, payload.refresh_token, existingTenant.rows[0].id]
        );
        
        return existingTenant.rows[0].id;
      }

      // 2. Queue automatic tenant provisioning
      const adminPassword = uuidv4().substring(0, 12) + '!'; // Generate random password
      const organizationName = payload.store_info.name;
      const adminEmail = payload.store_info.email || `admin@${payload.store_info.domain}`;

      const jobId = await this.provisioningQueue.addProvisioningJob(
        organizationName,
        adminEmail,
        adminPassword,
        'pro' // Default to pro plan for Salla installs
      );

      console.log(`📝 Queued provisioning job ${jobId} for Salla store ${payload.store_id}`);

      // 3. Wait for provisioning to complete (or poll status)
      // In a real production environment, we'd handle this asynchronously via webhooks/events
      // For this implementation, we'll wait up to 60 seconds
      let tenantId: string | null = null;
      for (let i = 0; i < 12; i++) {
        await new Promise(resolve => setTimeout(resolve, 5000));
        const status = await this.provisioningQueue.getStatus(jobId);
        if (status?.status === 'completed' && status.tenantId) {
          tenantId = status.tenantId;
          break;
        }
        if (status?.status === 'failed') {
          throw new Error(`Provisioning failed: ${status.error}`);
        }
      }

      if (!tenantId) {
        throw new Error('Provisioning timed out');
      }

      // 4. Update tenant with Salla metadata
      await this.globalDb.query(
        `UPDATE tenant_registry 
         SET salla_store_id = $1, 
             salla_access_token = $2, 
             salla_refresh_token = $3, 
             salla_domain = $4,
             updated_at = NOW() 
         WHERE id = $5`,
        [payload.store_id, payload.access_token, payload.refresh_token, payload.store_info.domain, tenantId]
      );

      // 5. Update tenant settings with widget and tools config
      const baseUrl = process.env.APP_URL || 'https://api.wosool.ai';
      const widgetConfig = {
        enabled: true,
        script_url: `${baseUrl}/public/widget/wosool-widget.js`,
        tools_url: `${baseUrl}/public/widget/tools/`,
        tools_enabled: [
          'contextReader',
          'domManipulator',
          'intentAnalyzer',
          'dataExtractor',
          'enhancedNavigation',
          'navigationController'
        ],
        elevenlabs_agent_id: null, // To be configured later
        custom_settings: {
          salla_store_id: payload.store_id,
          salla_domain: payload.store_info.domain
        }
      };

      await this.globalDb.query(
        'UPDATE tenant_settings SET widget_config = $1, updated_at = NOW() WHERE tenant_id = $2',
        [JSON.stringify(widgetConfig), tenantId]
      );

      // 6. Inject ElevenLabs widget script and tools into Salla store
      await this.injectWidgetScript(payload.access_token);

      // 6. Trigger initial data sync (async)
      this.triggerInitialSync(tenantId, payload.access_token);

      metricsService.recordDatabaseQueryTime('salla_installation_complete', Date.now() - startTime);
      console.log(`✅ Salla installation complete for tenant: ${tenantId}`);

      return tenantId;
    } catch (error: any) {
      console.error(`❌ Salla installation failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Inject ElevenLabs widget script and tools into Salla store
   */
  private async injectWidgetScript(accessToken: string): Promise<void> {
    try {
      const baseUrl = process.env.APP_URL || 'https://api.wosool.ai';
      const widgetScriptUrl = `${baseUrl}/public/widget/wosool-widget.js`;
      
      // Tools to be injected alongside the widget
      const tools = [
        'contextReader.js',
        'domManipulator.js',
        'intentAnalyzer.js',
        'dataExtractor.js',
        'enhancedNavigation.js',
        'navigationController.js'
      ];

      const toolsScripts = tools.map(tool => `<script src="${baseUrl}/public/widget/tools/${tool}"></script>`).join('\n');
      
      // Salla API for script injection
      // Documentation: https://docs.salla.dev/docs/merchants/ZG9jOjI0MDU2MTEw-scripts
      await httpx.post(
        `${this.SALLA_API_BASE}/scripts`,
        {
          name: 'Wosool AI Widget & Tools',
          type: 'footer',
          content: `${toolsScripts}\n<script src="${widgetScriptUrl}"></script>`,
          is_active: true
        },
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      console.log('✅ Successfully injected Wosool widget and tools into Salla store');
    } catch (error: any) {
      console.error(`⚠️ Failed to inject widget script: ${error.message}`);
      // Don't throw here, as the tenant is already created
    }
  }

  /**
   * Trigger initial data sync from Salla to Twenty CRM
   */
  private async triggerInitialSync(tenantId: string, accessToken: string): Promise<void> {
    const syncService = new SallaSyncService(this.globalDb);
    await syncService.syncAll(tenantId, accessToken);
  }
}

export default SallaIntegrationService;
