/**
 * Metrics Service
 * 
 * Collects and exposes metrics for monitoring and observability
 * Uses Prometheus format for easy integration with monitoring tools
 */

import { Registry, Counter, Gauge, Histogram, collectDefaultMetrics } from 'prom-client';

class MetricsService {
  private registry: Registry;

  // Counters
  public tenantCreatedCounter: Counter;
  public tenantDeletedCounter: Counter;
  public apiRequestCounter: Counter;
  public apiErrorCounter: Counter;

  // Gauges
  public activeTenants: Gauge;
  public totalConnections: Gauge;
  public cacheHitRate: Gauge;
  public queueDepth: Gauge;

  // Histograms
  public apiResponseTime: Histogram;
  public provisioningTime: Histogram;
  public databaseQueryTime: Histogram;

  constructor() {
    this.registry = new Registry();

    // Collect default metrics (CPU, memory, etc.)
    collectDefaultMetrics({ register: this.registry });

    // Initialize custom metrics
    this.initializeMetrics();
  }

  private initializeMetrics(): void {
    // Counters
    this.tenantCreatedCounter = new Counter({
      name: 'tenant_created_total',
      help: 'Total number of tenants created',
      labelNames: ['plan'],
      registers: [this.registry],
    });

    this.tenantDeletedCounter = new Counter({
      name: 'tenant_deleted_total',
      help: 'Total number of tenants deleted',
      registers: [this.registry],
    });

    this.apiRequestCounter = new Counter({
      name: 'api_requests_total',
      help: 'Total number of API requests',
      labelNames: ['method', 'path', 'status'],
      registers: [this.registry],
    });

    this.apiErrorCounter = new Counter({
      name: 'api_errors_total',
      help: 'Total number of API errors',
      labelNames: ['method', 'path', 'error_type'],
      registers: [this.registry],
    });

    // Gauges
    this.activeTenants = new Gauge({
      name: 'active_tenants',
      help: 'Number of active tenants',
      registers: [this.registry],
    });

    this.totalConnections = new Gauge({
      name: 'database_connections_total',
      help: 'Total number of database connections',
      registers: [this.registry],
    });

    this.cacheHitRate = new Gauge({
      name: 'cache_hit_rate',
      help: 'Cache hit rate percentage',
      registers: [this.registry],
    });

    this.queueDepth = new Gauge({
      name: 'provisioning_queue_depth',
      help: 'Number of jobs in provisioning queue',
      labelNames: ['status'],
      registers: [this.registry],
    });

    // Histograms
    this.apiResponseTime = new Histogram({
      name: 'api_response_time_seconds',
      help: 'API response time in seconds',
      labelNames: ['method', 'path'],
      buckets: [0.01, 0.05, 0.1, 0.5, 1, 2, 5],
      registers: [this.registry],
    });

    this.provisioningTime = new Histogram({
      name: 'tenant_provisioning_time_seconds',
      help: 'Tenant provisioning time in seconds',
      buckets: [10, 30, 60, 120, 300, 600],
      registers: [this.registry],
    });

    this.databaseQueryTime = new Histogram({
      name: 'database_query_time_seconds',
      help: 'Database query time in seconds',
      labelNames: ['query_type'],
      buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1],
      registers: [this.registry],
    });
  }

  /**
   * Record API request
   */
  recordApiRequest(method: string, path: string, status: number, durationMs: number): void {
    this.apiRequestCounter.inc({ method, path, status: status.toString() });
    this.apiResponseTime.observe({ method, path }, durationMs / 1000);
  }

  /**
   * Record API error
   */
  recordApiError(method: string, path: string, errorType: string): void {
    this.apiErrorCounter.inc({ method, path, error_type: errorType });
  }

  /**
   * Record tenant creation
   */
  recordTenantCreated(plan: string): void {
    this.tenantCreatedCounter.inc({ plan });
  }

  /**
   * Record tenant deletion
   */
  recordTenantDeleted(): void {
    this.tenantDeletedCounter.inc();
  }

  /**
   * Update active tenants count
   */
  updateActiveTenants(count: number): void {
    this.activeTenants.set(count);
  }

  /**
   * Update total connections
   */
  updateTotalConnections(count: number): void {
    this.totalConnections.set(count);
  }

  /**
   * Update cache hit rate
   */
  updateCacheHitRate(rate: number): void {
    this.cacheHitRate.set(rate);
  }

  /**
   * Update queue depth
   */
  updateQueueDepth(status: string, count: number): void {
    this.queueDepth.set({ status }, count);
  }

  /**
   * Record provisioning time
   */
  recordProvisioningTime(durationSeconds: number): void {
    this.provisioningTime.observe(durationSeconds);
  }

  /**
   * Record database query time
   */
  recordDatabaseQueryTime(queryType: string, durationMs: number): void {
    this.databaseQueryTime.observe({ query_type: queryType }, durationMs / 1000);
  }

  /**
   * Get metrics in Prometheus format
   */
  async getMetrics(): Promise<string> {
    return this.registry.metrics();
  }

  /**
   * Get metrics as JSON
   */
  async getMetricsJSON(): Promise<any> {
    const metrics = await this.registry.getMetricsAsJSON();
    return metrics;
  }

  /**
   * Get stats summary for health check
   */
  getStatsSummary(): any {
    return {
      activeTenants: 0,
      totalConnections: 0,
    };
  }

  /**
   * Reset all metrics (for testing)
   */
  reset(): void {
    this.registry.resetMetrics();
  }
}

// Singleton instance
export const metricsService = new MetricsService();

export default metricsService;
