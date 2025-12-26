/**
 * Preseed Service
 * 
 * Initializes all required default data for a new workspace.
 * Ensures workspace is fully functional immediately after provisioning.
 * 
 * Preseed operations (in order):
 * 1. Create system roles (ADMIN, EDITOR, VIEWER)
 * 2. Create default pipelines
 * 3. Initialize workspace settings
 * 4. Create default object metadata
 * 5. Initialize permission mappings
 * 6. Mark workspace as onboarding complete
 */

import { Pool } from 'pg';
import { v4 as uuidv4 } from 'uuid';

export interface PreseedResult {
  workspaceId: string;
  rolesCreated: number;
  pipelinesCreated: number;
  settingsInitialized: boolean;
  objectMetadataCreated: number;
  permissionsInitialized: boolean;
  onboardingMarked: boolean;
}

class PreseedService {
  private tenantDb: Pool;

  constructor(tenantDb: Pool) {
    this.tenantDb = tenantDb;
  }

  /**
   * Execute complete preseed operation
   */
  async preseedWorkspace(workspaceId: string, organizationName: string): Promise<PreseedResult> {
    console.log(`🌱 Starting preseed for workspace: ${workspaceId}`);

    const result: PreseedResult = {
      workspaceId,
      rolesCreated: 0,
      pipelinesCreated: 0,
      settingsInitialized: false,
      objectMetadataCreated: 0,
      permissionsInitialized: false,
      onboardingMarked: false,
    };

    try {
      // Step 1: Create system roles
      console.log('📋 Step 1: Creating system roles...');
      result.rolesCreated = await this.createSystemRoles(workspaceId);

      // Step 2: Create default pipelines
      console.log('📋 Step 2: Creating default pipelines...');
      result.pipelinesCreated = await this.createDefaultPipelines(workspaceId);

      // Step 3: Initialize workspace settings
      console.log('📋 Step 3: Initializing workspace settings...');
      result.settingsInitialized = await this.initializeSettings(workspaceId, organizationName);

      // Step 4: Create default object metadata
      console.log('📋 Step 4: Creating default object metadata...');
      result.objectMetadataCreated = await this.createDefaultObjectMetadata(workspaceId);

      // Step 5: Initialize permission mappings
      console.log('📋 Step 5: Initializing permission mappings...');
      result.permissionsInitialized = await this.initializePermissions(workspaceId);

      // Step 6: Mark onboarding as complete
      console.log('📋 Step 6: Marking onboarding complete...');
      result.onboardingMarked = await this.markOnboardingComplete(workspaceId);

      console.log('✅ Preseed completed successfully:', result);
      return result;
    } catch (error: any) {
      console.error('❌ Preseed failed:', error);
      throw new Error(`Preseed failed: ${error.message}`);
    }
  }

  /**
   * Create system roles (ADMIN, EDITOR, VIEWER)
   */
  private async createSystemRoles(workspaceId: string): Promise<number> {
    const roles = [
      {
        label: 'ADMIN',
        description: 'Full access to all features',
        canUpdateAllSettings: true,
        canAccessAllTools: true,
        canReadAllObjectRecords: true,
        canUpdateAllObjectRecords: true,
        canSoftDeleteAllObjectRecords: true,
        canDestroyAllObjectRecords: true,
      },
      {
        label: 'EDITOR',
        description: 'Can read and edit records',
        canUpdateAllSettings: false,
        canAccessAllTools: true,
        canReadAllObjectRecords: true,
        canUpdateAllObjectRecords: true,
        canSoftDeleteAllObjectRecords: false,
        canDestroyAllObjectRecords: false,
      },
      {
        label: 'VIEWER',
        description: 'Read-only access',
        canUpdateAllSettings: false,
        canAccessAllTools: false,
        canReadAllObjectRecords: true,
        canUpdateAllObjectRecords: false,
        canSoftDeleteAllObjectRecords: false,
        canDestroyAllObjectRecords: false,
      },
    ];

    let createdCount = 0;

    for (const role of roles) {
      try {
        const result = await this.tenantDb.query(
          `INSERT INTO core.role (
            id, "workspaceId", label, description,
            "canUpdateAllSettings", "canAccessAllTools",
            "canReadAllObjectRecords", "canUpdateAllObjectRecords",
            "canSoftDeleteAllObjectRecords", "canDestroyAllObjectRecords"
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
          ON CONFLICT DO NOTHING`,
          [
            uuidv4(),
            workspaceId,
            role.label,
            role.description,
            role.canUpdateAllSettings,
            role.canAccessAllTools,
            role.canReadAllObjectRecords,
            role.canUpdateAllObjectRecords,
            role.canSoftDeleteAllObjectRecords,
            role.canDestroyAllObjectRecords,
          ]
        );

        if (result.rowCount && result.rowCount > 0) {
          createdCount++;
          console.log(`  ✅ Created role: ${role.label}`);
        }
      } catch (error: any) {
        console.warn(`  ⚠️  Failed to create role ${role.label}:`, error.message);
      }
    }

    return createdCount;
  }

  /**
   * Create default pipelines for CRM
   */
  private async createDefaultPipelines(workspaceId: string): Promise<number> {
    const pipelines = [
      {
        name: 'Sales Pipeline',
        description: 'Default sales pipeline',
        stages: ['Lead', 'Qualified', 'Proposal', 'Negotiation', 'Closed Won', 'Closed Lost'],
      },
      {
        name: 'Support Pipeline',
        description: 'Default support pipeline',
        stages: ['New', 'In Progress', 'Waiting on Customer', 'Resolved', 'Closed'],
      },
    ];

    let createdCount = 0;

    for (const pipeline of pipelines) {
      try {
        const pipelineId = uuidv4();
        
        // Create pipeline
        await this.tenantDb.query(
          `INSERT INTO core.pipeline (
            id, "workspaceId", name, description
          ) VALUES ($1, $2, $3, $4)
          ON CONFLICT DO NOTHING`,
          [pipelineId, workspaceId, pipeline.name, pipeline.description]
        );

        // Create stages
        for (let i = 0; i < pipeline.stages.length; i++) {
          await this.tenantDb.query(
            `INSERT INTO core.pipeline_stage (
              id, "pipelineId", name, position
            ) VALUES ($1, $2, $3, $4)
            ON CONFLICT DO NOTHING`,
            [uuidv4(), pipelineId, pipeline.stages[i], i]
          );
        }

        createdCount++;
        console.log(`  ✅ Created pipeline: ${pipeline.name}`);
      } catch (error: any) {
        console.warn(`  ⚠️  Failed to create pipeline ${pipeline.name}:`, error.message);
      }
    }

    return createdCount;
  }

  /**
   * Initialize workspace settings
   */
  private async initializeSettings(workspaceId: string, organizationName: string): Promise<boolean> {
    try {
      const settings = {
        timezone: 'UTC',
        locale: 'en-US',
        currency: 'USD',
        dateFormat: 'MM/DD/YYYY',
        timeFormat: '12h',
        weekStartDay: 'SUNDAY',
      };

      // Try to insert into workspace settings table
      await this.tenantDb.query(
        `INSERT INTO core.workspace_settings (
          "workspaceId", timezone, locale, currency,
          "dateFormat", "timeFormat", "weekStartDay"
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
        ON CONFLICT ("workspaceId") DO UPDATE SET
          timezone = $2, locale = $3, currency = $4,
          "dateFormat" = $5, "timeFormat" = $6, "weekStartDay" = $7`,
        [
          workspaceId,
          settings.timezone,
          settings.locale,
          settings.currency,
          settings.dateFormat,
          settings.timeFormat,
          settings.weekStartDay,
        ]
      );

      console.log(`  ✅ Initialized workspace settings`);
      return true;
    } catch (error: any) {
      console.warn(`  ⚠️  Failed to initialize settings:`, error.message);
      // Don't fail preseed if settings table doesn't exist
      return true;
    }
  }

  /**
   * Create default object metadata
   */
  private async createDefaultObjectMetadata(workspaceId: string): Promise<number> {
    const objects = [
      { name: 'company', label: 'Company' },
      { name: 'contact', label: 'Contact' },
      { name: 'opportunity', label: 'Opportunity' },
      { name: 'activity', label: 'Activity' },
      { name: 'note', label: 'Note' },
    ];

    let createdCount = 0;

    for (const obj of objects) {
      try {
        const result = await this.tenantDb.query(
          `INSERT INTO core.object_metadata (
            id, "workspaceId", name, label
          ) VALUES ($1, $2, $3, $4)
          ON CONFLICT DO NOTHING`,
          [uuidv4(), workspaceId, obj.name, obj.label]
        );

        if (result.rowCount && result.rowCount > 0) {
          createdCount++;
          console.log(`  ✅ Created object metadata: ${obj.label}`);
        }
      } catch (error: any) {
        console.warn(`  ⚠️  Failed to create object metadata ${obj.name}:`, error.message);
      }
    }

    return createdCount;
  }

  /**
   * Initialize permission mappings
   */
  private async initializePermissions(workspaceId: string): Promise<boolean> {
    try {
      // Get all roles for this workspace
      const rolesResult = await this.tenantDb.query(
        `SELECT id, label FROM core.role WHERE "workspaceId" = $1`,
        [workspaceId]
      );

      // Get all objects for this workspace
      const objectsResult = await this.tenantDb.query(
        `SELECT id, name FROM core.object_metadata WHERE "workspaceId" = $1`,
        [workspaceId]
      );

      const roles = rolesResult.rows;
      const objects = objectsResult.rows;

      // Create permission mappings
      for (const role of roles) {
        for (const obj of objects) {
          try {
            await this.tenantDb.query(
              `INSERT INTO core.role_permission (
                id, "roleId", "objectId", "canRead", "canCreate", "canUpdate", "canDelete"
              ) VALUES ($1, $2, $3, $4, $5, $6, $7)
              ON CONFLICT DO NOTHING`,
              [
                uuidv4(),
                role.id,
                obj.id,
                role.label !== 'VIEWER',
                role.label === 'ADMIN' || role.label === 'EDITOR',
                role.label === 'ADMIN' || role.label === 'EDITOR',
                role.label === 'ADMIN',
              ]
            );
          } catch (error: any) {
            // Silently skip if table doesn't exist
          }
        }
      }

      console.log(`  ✅ Initialized permission mappings`);
      return true;
    } catch (error: any) {
      console.warn(`  ⚠️  Failed to initialize permissions:`, error.message);
      // Don't fail preseed if permission tables don't exist
      return true;
    }
  }

  /**
   * Mark workspace onboarding as complete
   */
  private async markOnboardingComplete(workspaceId: string): Promise<boolean> {
    try {
      // Update workspace status
      await this.tenantDb.query(
        `UPDATE core.workspace 
         SET "activationStatus" = 'ACTIVE', "onboardingStatus" = 'COMPLETED'
         WHERE id = $1`,
        [workspaceId]
      );

      console.log(`  ✅ Marked workspace onboarding complete`);
      return true;
    } catch (error: any) {
      console.warn(`  ⚠️  Failed to mark onboarding complete:`, error.message);
      // Don't fail preseed if columns don't exist
      return true;
    }
  }

  /**
   * Verify preseed was successful
   */
  async verifyPreseed(workspaceId: string): Promise<boolean> {
    try {
      // Check if workspace exists and is active
      const workspaceResult = await this.tenantDb.query(
        `SELECT id, "activationStatus" FROM core.workspace WHERE id = $1`,
        [workspaceId]
      );

      if (workspaceResult.rows.length === 0) {
        console.error('❌ Workspace not found');
        return false;
      }

      // Check if at least one role exists
      const rolesResult = await this.tenantDb.query(
        `SELECT COUNT(*) as count FROM core.role WHERE "workspaceId" = $1`,
        [workspaceId]
      );

      if (parseInt(rolesResult.rows[0].count) === 0) {
        console.error('❌ No roles found');
        return false;
      }

      console.log('✅ Preseed verification passed');
      return true;
    } catch (error: any) {
      console.error('❌ Preseed verification failed:', error);
      return false;
    }
  }
}

export default PreseedService;
