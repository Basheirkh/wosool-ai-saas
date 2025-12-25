/**
 * Tenant Provisioning Queue Service
 * 
 * Async background processing for tenant provisioning
 * Allows API to respond immediately while provisioning happens in background
 */

import Queue from 'bull';
import { Pool } from 'pg';
import ImprovedTenantProvisioningService from './tenant-provisioning.js';

export interface ProvisioningJob {
  jobId: string;
  organizationName: string;
  adminEmail: string;
  adminPassword: string;
  plan?: 'free' | 'pro' | 'enterprise';
  clerkOrgId?: string;
  createdAt: Date;
}

export interface ProvisioningStatus {
  jobId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  currentStep?: string;
  tenantId?: string;
  slug?: string;
  error?: string;
  startedAt?: Date;
  completedAt?: Date;
}

class ProvisioningQueueService {
  private queue: Queue.Queue<ProvisioningJob>;
  private globalDb: Pool;
  private provisioningService: ImprovedTenantProvisioningService;
  private statusMap: Map<string, ProvisioningStatus> = new Map();

  constructor(globalDb: Pool) {
    this.globalDb = globalDb;
    this.provisioningService = new ImprovedTenantProvisioningService(globalDb);

    // Initialize Bull queue
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
    
    this.queue = new Queue('tenant-provisioning', redisUrl, {
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 5000,
        },
        removeOnComplete: false,
        removeOnFail: false,
      },
    });

    this.setupProcessors();
    this.setupEventHandlers();
  }

  /**
   * Setup queue processors
   */
  private setupProcessors(): void {
    this.queue.process(async (job) => {
      const { jobId, organizationName, adminEmail, adminPassword, plan, clerkOrgId } = job.data;

      console.log(`🔄 Processing provisioning job: ${jobId}`);

      // Update status
      this.updateStatus(jobId, {
        status: 'processing',
        progress: 10,
        currentStep: 'Validating request',
        startedAt: new Date(),
      });

      try {
        // Step 1: Validate
        await job.progress(20);
        this.updateStatus(jobId, {
          progress: 20,
          currentStep: 'Creating database',
        });

        // Step 2: Provision tenant
        const result = await this.provisioningService.provisionTenant({
          organizationName,
          adminEmail,
          adminPassword,
          plan,
        });

        // Link Clerk org ID if provided
        if (job.data.clerkOrgId && result.tenantId) {
          await this.globalDb.query(
            'UPDATE tenant_registry SET clerk_org_id = $1 WHERE id = $2',
            [job.data.clerkOrgId, result.tenantId]
          );
          console.log(`✅ Linked Clerk org ${job.data.clerkOrgId} to tenant ${result.tenantId}`);
        }

        await job.progress(80);
        this.updateStatus(jobId, {
          progress: 80,
          currentStep: 'Finalizing setup',
        });

        // Step 3: Complete
        await job.progress(100);
        this.updateStatus(jobId, {
          status: 'completed',
          progress: 100,
          currentStep: 'Completed',
          tenantId: result.tenantId,
          slug: result.slug,
          completedAt: new Date(),
        });

        console.log(`✅ Provisioning completed: ${result.slug}`);

        return {
          success: true,
          tenantId: result.tenantId,
          slug: result.slug,
        };
      } catch (error: any) {
        console.error(`❌ Provisioning failed for job ${jobId}:`, error.message);

        this.updateStatus(jobId, {
          status: 'failed',
          progress: 0,
          error: error.message,
          completedAt: new Date(),
        });

        throw error;
      }
    });
  }

  /**
   * Setup event handlers
   */
  private setupEventHandlers(): void {
    this.queue.on('completed', (job, result) => {
      console.log(`✅ Job ${job.id} completed:`, result);
    });

    this.queue.on('failed', (job, err) => {
      console.error(`❌ Job ${job?.id} failed:`, err.message);
    });

    this.queue.on('stalled', (job) => {
      console.warn(`⚠️  Job ${job.id} stalled`);
    });

    this.queue.on('error', (error) => {
      console.error('Queue error:', error);
    });
  }

  /**
   * Add tenant provisioning job to queue
   */
  /**
   * Enqueue provisioning job (alias for addProvisioningJob)
   */
  async enqueue(data: {
    organizationName: string;
    adminEmail: string;
    adminPassword: string;
    plan?: 'free' | 'pro' | 'enterprise';
    clerkOrgId?: string;
  }): Promise<string> {
    return this.addProvisioningJob(
      data.organizationName,
      data.adminEmail,
      data.adminPassword,
      data.plan,
      data.clerkOrgId
    );
  }

  async addProvisioningJob(
    organizationName: string,
    adminEmail: string,
    adminPassword: string,
    plan?: 'free' | 'pro' | 'enterprise',
    clerkOrgId?: string
  ): Promise<string> {
    const jobId = `prov-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const job = await this.queue.add({
      jobId,
      organizationName,
      adminEmail,
      adminPassword,
      plan,
      clerkOrgId,
      createdAt: new Date(),
    }, {
      jobId,
    });

    // Initialize status
    this.statusMap.set(jobId, {
      jobId,
      status: 'pending',
      progress: 0,
      currentStep: 'Queued',
    });

    console.log(`📝 Added provisioning job: ${jobId}`);

    return jobId;
  }

  /**
   * Update job status
   */
  private updateStatus(jobId: string, update: Partial<ProvisioningStatus>): void {
    const current = this.statusMap.get(jobId) || {
      jobId,
      status: 'pending' as const,
      progress: 0,
    };

    this.statusMap.set(jobId, {
      ...current,
      ...update,
    });
  }

  /**
   * Get job status
   */
  async getStatus(jobId: string): Promise<ProvisioningStatus | null> {
    // Check in-memory status first
    const memoryStatus = this.statusMap.get(jobId);
    if (memoryStatus) {
      return memoryStatus;
    }

    // Check Bull queue
    try {
      const job = await this.queue.getJob(jobId);
      if (!job) {
        return null;
      }

      const state = await job.getState();
      const progress = job.progress();

      return {
        jobId,
        status: state === 'completed' ? 'completed' : state === 'failed' ? 'failed' : state === 'active' ? 'processing' : 'pending',
        progress: typeof progress === 'number' ? progress : 0,
        currentStep: state,
      };
    } catch (error) {
      return null;
    }
  }

  /**
   * Get queue statistics
   */
  async getQueueStats(): Promise<{
    waiting: number;
    active: number;
    completed: number;
    failed: number;
    delayed: number;
  }> {
    const [waiting, active, completed, failed, delayed] = await Promise.all([
      this.queue.getWaitingCount(),
      this.queue.getActiveCount(),
      this.queue.getCompletedCount(),
      this.queue.getFailedCount(),
      this.queue.getDelayedCount(),
    ]);

    return {
      waiting,
      active,
      completed,
      failed,
      delayed,
    };
  }

  /**
   * Retry failed job
   */
  async retryJob(jobId: string): Promise<boolean> {
    try {
      const job = await this.queue.getJob(jobId);
      if (!job) {
        return false;
      }

      await job.retry();
      console.log(`🔄 Retrying job: ${jobId}`);
      return true;
    } catch (error: any) {
      console.error(`Failed to retry job ${jobId}:`, error.message);
      return false;
    }
  }

  /**
   * Remove job from queue
   */
  async removeJob(jobId: string): Promise<boolean> {
    try {
      const job = await this.queue.getJob(jobId);
      if (!job) {
        return false;
      }

      await job.remove();
      this.statusMap.delete(jobId);
      console.log(`🗑️  Removed job: ${jobId}`);
      return true;
    } catch (error: any) {
      console.error(`Failed to remove job ${jobId}:`, error.message);
      return false;
    }
  }

  /**
   * Clean old jobs
   */
  async cleanOldJobs(olderThanMs: number = 7 * 24 * 60 * 60 * 1000): Promise<void> {
    try {
      await this.queue.clean(olderThanMs, 'completed');
      await this.queue.clean(olderThanMs, 'failed');
      console.log(`🧹 Cleaned jobs older than ${olderThanMs}ms`);
    } catch (error: any) {
      console.error('Failed to clean old jobs:', error.message);
    }
  }

  /**
   * Close queue
   */
  async close(): Promise<void> {
    await this.queue.close();
    console.log('✅ Provisioning queue closed');
  }
}

export default ProvisioningQueueService;
