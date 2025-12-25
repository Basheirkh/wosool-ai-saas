/**
 * Connection Pool Manager
 * 
 * Manages dynamic PostgreSQL connection pools per tenant.
 * Implements lazy creation, automatic cleanup, and connection limits.
 */

import { Pool, PoolConfig } from 'pg';
import { EventEmitter } from 'events';

interface PoolMetadata {
  pool: Pool;
  createdAt: number;
  lastUsedAt: number;
  activeConnections: number;
}

class ConnectionPoolManager extends EventEmitter {
  private pools: Map<string, PoolMetadata> = new Map();
  private readonly maxConnectionsPerTenant: number;
  private readonly maxTotalConnections: number;
  private readonly idleTimeout: number;
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor(
    maxConnectionsPerTenant: number = 10,
    maxTotalConnections: number = 10000,
    idleTimeout: number = 30 * 60 * 1000 // 30 minutes
  ) {
    super();
    this.maxConnectionsPerTenant = maxConnectionsPerTenant;
    this.maxTotalConnections = maxTotalConnections;
    this.idleTimeout = idleTimeout;
    this.startCleanupInterval();
  }

  /**
   * Get or create a connection pool for a tenant
   */
  async getPool(databaseUrl: string): Promise<Pool> {
    // Check if pool already exists
    if (this.pools.has(databaseUrl)) {
      const metadata = this.pools.get(databaseUrl)!;
      metadata.lastUsedAt = Date.now();
      return metadata.pool;
    }

    // Check total connection limit
    const totalConnections = this.getTotalConnections();
    if (totalConnections >= this.maxTotalConnections) {
      throw new Error(
        `Maximum total connections (${this.maxTotalConnections}) reached. ` +
        `Current: ${totalConnections}`
      );
    }

    // Create new pool
    const poolConfig: PoolConfig = {
      connectionString: databaseUrl,
      max: this.maxConnectionsPerTenant,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
    };

    const pool = new Pool(poolConfig);

    // Handle pool errors
    pool.on('error', (err) => {
      this.emit('pool-error', { databaseUrl, error: err });
      console.error(`Pool error for ${databaseUrl}:`, err);
    });

    // Track pool metadata
    const metadata: PoolMetadata = {
      pool,
      createdAt: Date.now(),
      lastUsedAt: Date.now(),
      activeConnections: 0,
    };

    this.pools.set(databaseUrl, metadata);
    this.emit('pool-created', { databaseUrl });

    // Update active connections count
    pool.on('connect', () => {
      metadata.activeConnections++;
    });

    pool.on('remove', () => {
      metadata.activeConnections--;
    });

    return pool;
  }

  /**
   * Close a specific pool
   */
  async closePool(databaseUrl: string): Promise<void> {
    const metadata = this.pools.get(databaseUrl);
    if (!metadata) {
      return;
    }

    await metadata.pool.end();
    this.pools.delete(databaseUrl);
    this.emit('pool-closed', { databaseUrl });
  }

  /**
   * Close all pools
   */
  async closeAllPools(): Promise<void> {
    const closePromises = Array.from(this.pools.keys()).map((url) =>
      this.closePool(url)
    );
    await Promise.all(closePromises);
  }

  /**
   * Get total number of connections across all pools
   */
  getTotalConnections(): number {
    let total = 0;
    for (const metadata of this.pools.values()) {
      total += metadata.activeConnections;
    }
    return total;
  }

  /**
   * Get pool statistics
   */
  getStats() {
    const pools = Array.from(this.pools.entries()).map(([url, metadata]) => ({
      databaseUrl: url,
      createdAt: new Date(metadata.createdAt).toISOString(),
      lastUsedAt: new Date(metadata.lastUsedAt).toISOString(),
      activeConnections: metadata.activeConnections,
      maxConnections: this.maxConnectionsPerTenant,
    }));

    return {
      totalPools: this.pools.size,
      totalConnections: this.getTotalConnections(),
      maxTotalConnections: this.maxTotalConnections,
      pools,
    };
  }

  /**
   * Start cleanup interval for idle pools
   */
  private startCleanupInterval(): void {
    this.cleanupInterval = setInterval(() => {
      this.cleanupIdlePools();
    }, 5 * 60 * 1000); // Check every 5 minutes
  }

  /**
   * Clean up pools that have been idle for too long
   */
  private async cleanupIdlePools(): Promise<void> {
    const now = Date.now();
    const poolsToClose: string[] = [];

    for (const [url, metadata] of this.pools.entries()) {
      const idleTime = now - metadata.lastUsedAt;
      
      // Close pool if idle for more than timeout and no active connections
      if (idleTime > this.idleTimeout && metadata.activeConnections === 0) {
        poolsToClose.push(url);
      }
    }

    // Close idle pools
    for (const url of poolsToClose) {
      console.log(`Closing idle pool: ${url}`);
      await this.closePool(url);
    }

    if (poolsToClose.length > 0) {
      this.emit('pools-cleaned', { count: poolsToClose.length });
    }
  }

  /**
   * Stop cleanup interval (for graceful shutdown)
   */
  stopCleanupInterval(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
  }
}

// Singleton instance
export const connectionPoolManager = new ConnectionPoolManager(
  parseInt(process.env.MAX_CONNECTIONS_PER_TENANT || '10', 10),
  parseInt(process.env.MAX_TOTAL_CONNECTIONS || '10000', 10),
  parseInt(process.env.POOL_IDLE_TIMEOUT || '1800000', 10)
);

export default connectionPoolManager;

