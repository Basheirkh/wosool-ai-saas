/**
 * Webhook Idempotency Service
 * 
 * Ensures webhooks are processed exactly once, preventing duplicate operations.
 * Uses database-backed idempotency key tracking with distributed locking.
 */

import { Pool } from 'pg';

export interface IdempotencyRecord {
  idempotencyKey: string;
  webhookType: string;
  clerkEventId: string;
  status: 'processing' | 'completed' | 'failed';
  result?: any;
  error?: string;
  createdAt: Date;
  completedAt?: Date;
}

class WebhookIdempotencyService {
  private globalDb: Pool;

  constructor(globalDb: Pool) {
    this.globalDb = globalDb;
  }

  /**
   * Initialize idempotency tracking table
   */
  async initializeTable(): Promise<void> {
    try {
      await this.globalDb.query(`
        CREATE TABLE IF NOT EXISTS webhook_idempotency (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          idempotency_key VARCHAR(255) NOT NULL UNIQUE,
          webhook_type VARCHAR(100) NOT NULL,
          clerk_event_id VARCHAR(255) NOT NULL,
          status VARCHAR(50) NOT NULL DEFAULT 'processing',
          result JSONB,
          error TEXT,
          created_at TIMESTAMP DEFAULT NOW(),
          completed_at TIMESTAMP,
          updated_at TIMESTAMP DEFAULT NOW()
        );

        CREATE INDEX IF NOT EXISTS idx_webhook_idempotency_key 
          ON webhook_idempotency(idempotency_key);
        CREATE INDEX IF NOT EXISTS idx_webhook_clerk_event_id 
          ON webhook_idempotency(clerk_event_id);
        CREATE INDEX IF NOT EXISTS idx_webhook_status 
          ON webhook_idempotency(status);
      `);
      console.log('✅ Webhook idempotency table initialized');
    } catch (error: any) {
      console.error('Failed to initialize idempotency table:', error);
      throw error;
    }
  }

  /**
   * Generate idempotency key from webhook data
   */
  private generateIdempotencyKey(webhookType: string, clerkEventId: string): string {
    return `${webhookType}:${clerkEventId}`;
  }

  /**
   * Check if webhook has been processed
   */
  async isProcessed(webhookType: string, clerkEventId: string): Promise<boolean> {
    const idempotencyKey = this.generateIdempotencyKey(webhookType, clerkEventId);
    
    try {
      const result = await this.globalDb.query(
        `SELECT id, status FROM webhook_idempotency 
         WHERE idempotency_key = $1 AND status IN ('completed', 'processing')`,
        [idempotencyKey]
      );

      return result.rows.length > 0;
    } catch (error: any) {
      console.error('Error checking idempotency:', error);
      return false;
    }
  }

  /**
   * Get previous result if webhook was already processed
   */
  async getPreviousResult(webhookType: string, clerkEventId: string): Promise<any | null> {
    const idempotencyKey = this.generateIdempotencyKey(webhookType, clerkEventId);
    
    try {
      const result = await this.globalDb.query(
        `SELECT result, status FROM webhook_idempotency 
         WHERE idempotency_key = $1 AND status = 'completed'`,
        [idempotencyKey]
      );

      if (result.rows.length > 0) {
        return result.rows[0].result;
      }
      return null;
    } catch (error: any) {
      console.error('Error getting previous result:', error);
      return null;
    }
  }

  /**
   * Mark webhook as processing (acquire lock)
   */
  async markProcessing(webhookType: string, clerkEventId: string): Promise<string> {
    const idempotencyKey = this.generateIdempotencyKey(webhookType, clerkEventId);
    
    try {
      const result = await this.globalDb.query(
        `INSERT INTO webhook_idempotency 
         (idempotency_key, webhook_type, clerk_event_id, status)
         VALUES ($1, $2, $3, 'processing')
         ON CONFLICT (idempotency_key) DO UPDATE 
         SET updated_at = NOW()
         WHERE webhook_idempotency.status != 'completed'
         RETURNING id`,
        [idempotencyKey, webhookType, clerkEventId]
      );

      if (result.rows.length === 0) {
        throw new Error('Webhook already processed (duplicate detected)');
      }

      return idempotencyKey;
    } catch (error: any) {
      if (error.message.includes('duplicate')) {
        throw new Error('Webhook already processed (duplicate detected)');
      }
      throw error;
    }
  }

  /**
   * Mark webhook as completed with result
   */
  async markCompleted(
    webhookType: string,
    clerkEventId: string,
    result: any
  ): Promise<void> {
    const idempotencyKey = this.generateIdempotencyKey(webhookType, clerkEventId);
    
    try {
      await this.globalDb.query(
        `UPDATE webhook_idempotency 
         SET status = 'completed', result = $1, completed_at = NOW(), updated_at = NOW()
         WHERE idempotency_key = $2`,
        [JSON.stringify(result), idempotencyKey]
      );
    } catch (error: any) {
      console.error('Error marking webhook as completed:', error);
      throw error;
    }
  }

  /**
   * Mark webhook as failed
   */
  async markFailed(
    webhookType: string,
    clerkEventId: string,
    error: string
  ): Promise<void> {
    const idempotencyKey = this.generateIdempotencyKey(webhookType, clerkEventId);
    
    try {
      await this.globalDb.query(
        `UPDATE webhook_idempotency 
         SET status = 'failed', error = $1, completed_at = NOW(), updated_at = NOW()
         WHERE idempotency_key = $2`,
        [error, idempotencyKey]
      );
    } catch (error: any) {
      console.error('Error marking webhook as failed:', error);
      throw error;
    }
  }

  /**
   * Clean up old webhook records (older than 30 days)
   */
  async cleanupOldRecords(daysToKeep: number = 30): Promise<number> {
    try {
      const result = await this.globalDb.query(
        `DELETE FROM webhook_idempotency 
         WHERE created_at < NOW() - INTERVAL '${daysToKeep} days'
         AND status IN ('completed', 'failed')`,
      );

      console.log(`✅ Cleaned up ${result.rowCount} old webhook records`);
      return result.rowCount || 0;
    } catch (error: any) {
      console.error('Error cleaning up old records:', error);
      throw error;
    }
  }

  /**
   * Get webhook processing status
   */
  async getStatus(webhookType: string, clerkEventId: string): Promise<IdempotencyRecord | null> {
    const idempotencyKey = this.generateIdempotencyKey(webhookType, clerkEventId);
    
    try {
      const result = await this.globalDb.query(
        `SELECT idempotency_key, webhook_type, clerk_event_id, status, result, error, created_at, completed_at
         FROM webhook_idempotency 
         WHERE idempotency_key = $1`,
        [idempotencyKey]
      );

      if (result.rows.length === 0) {
        return null;
      }

      const row = result.rows[0];
      return {
        idempotencyKey: row.idempotency_key,
        webhookType: row.webhook_type,
        clerkEventId: row.clerk_event_id,
        status: row.status,
        result: row.result ? JSON.parse(row.result) : undefined,
        error: row.error || undefined,
        createdAt: row.created_at,
        completedAt: row.completed_at,
      };
    } catch (error: any) {
      console.error('Error getting webhook status:', error);
      return null;
    }
  }
}

export default WebhookIdempotencyService;
