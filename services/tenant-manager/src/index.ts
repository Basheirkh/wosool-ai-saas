/**
 * Multi-Tenant Manager Service
 * 
 * Main entry point for the tenant management service
 */

import express, { Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { Pool } from 'pg';
import dotenv from 'dotenv';

// Import services
import ImprovedTenantProvisioningService from './services/tenant-provisioning.js';
const TenantProvisioningService = ImprovedTenantProvisioningService;
import TenantResolverService from './services/tenant-resolver.js';
import connectionPoolManager from './services/connection-pool.js';
import metricsService from './services/metrics-service.js';

// Import routes
import { createRegisterRouter } from './api/auth/register.js';
import { createLoginRouter } from './api/auth/login.js';
import { createAdminRouter } from './api/admin/tenants.js';
import { createDashboardRouter } from './api/admin/dashboard.js';
import { createSallaWebhookRouter } from './api/salla/webhooks.js';
import { createClerkWebhookRouter } from './api/clerk/webhooks.js';
import { initializeGlobalDatabase, validateGlobalDatabase } from './database/global/init.js';
import ProvisioningQueueService from './services/provisioning-queue.js';

// Load environment variables
dotenv.config();

// Validate required environment variables
const requiredEnvVars = ['GLOBAL_DATABASE_URL', 'JWT_SECRET', 'POSTGRES_ADMIN_USER', 'POSTGRES_ADMIN_PASSWORD', 'POSTGRES_HOST'];
const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingEnvVars.length > 0) {
  console.error('❌ Missing required environment variables:', missingEnvVars.join(', '));
  console.error('Please create a .env file based on .env.example');
  process.exit(1);
}

// Warn about insecure defaults
if (process.env.JWT_SECRET === 'change-me-in-production' || process.env.JWT_SECRET === 'change-this-to-a-strong-random-secret-in-production') {
  console.warn('⚠️  WARNING: Using default JWT_SECRET. Please change this in production!');
}

if (process.env.SUPER_ADMIN_KEY === 'change-this-to-a-strong-random-key-in-production') {
  console.warn('⚠️  WARNING: Using default SUPER_ADMIN_KEY. Please change this in production!');
}

const app: Express = express();
const PORT = process.env.PORT || 3001;

// Initialize global database connection
const globalDb = new Pool({
  connectionString: process.env.GLOBAL_DATABASE_URL,
  max: 20,
});

// Initialize services
const tenantProvisioning = new TenantProvisioningService(globalDb);
const provisioningQueue = new ProvisioningQueueService(globalDb);
const tenantResolver = new TenantResolverService(
  globalDb,
  process.env.JWT_SECRET || 'change-me-in-production'
);

// Trust proxy - required when running behind Nginx/reverse proxy
app.set('trust proxy', true);

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/public', express.static('public'));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
});
app.use('/api/', limiter);

// Health check
app.get('/health', (_req, res) => {
  res.json({
    status: 'healthy',
    service: 'tenant-manager-enterprise',
    timestamp: new Date().toISOString(),
    metrics: metricsService.getStatsSummary(),
  });
});

// API Routes
app.use('/api/auth', createRegisterRouter(globalDb, tenantProvisioning, tenantResolver));
app.use('/api/auth', createLoginRouter(globalDb, tenantResolver));
app.use('/api/admin', createAdminRouter(globalDb));

// Enterprise API Routes
const adminAuthMiddleware = (req: any, res: any, next: any) => {
  const adminKey = req.headers['x-admin-key'];
  if (adminKey !== process.env.SUPER_ADMIN_KEY) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  next();
};

app.use('/api/admin/dashboard', adminAuthMiddleware, createDashboardRouter(globalDb));
app.use('/api/salla/webhook', createSallaWebhookRouter(globalDb, provisioningQueue));
app.use('/api/clerk', createClerkWebhookRouter(globalDb, provisioningQueue, tenantProvisioning));

// Metrics endpoint for Prometheus
app.get('/metrics', async (_req, res) => {
  try {
    res.set('Content-Type', 'text/plain');
    res.send(await metricsService.getMetrics());
  } catch (error) {
    res.status(500).send(error);
  }
});

// Connection pool stats endpoint
app.get('/api/admin/pools/stats', async (req, res) => {
  const adminKey = req.headers['x-admin-key'];
  if (adminKey !== process.env.SUPER_ADMIN_KEY) {
    res.status(403).json({ error: 'Forbidden' });
    return;
  }

  const stats = connectionPoolManager.getStats();
  res.json({ success: true, data: stats });
});

// Error handling middleware
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(err.status || 500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'An error occurred',
  });
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully...');
  
  // Close all connection pools
  await connectionPoolManager.closeAllPools();
  
  // Close global database connection
  await globalDb.end();
  
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, shutting down gracefully...');
  
  await connectionPoolManager.closeAllPools();
  await globalDb.end();
  
  process.exit(0);
});

// Async startup function
async function startServer() {
  try {
    console.log('🚀 Starting Tenant Manager Service...');
    console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);

    // Initialize global database
    await initializeGlobalDatabase(process.env.GLOBAL_DATABASE_URL!);

    // Validate global database
    const isValid = await validateGlobalDatabase(process.env.GLOBAL_DATABASE_URL!);
    if (!isValid) {
      throw new Error('Global database validation failed');
    }

    // Test global database connection
    await globalDb.query('SELECT 1');
    console.log('✅ Global database connection verified');

    // Start server
    app.listen(PORT, () => {
      console.log(`✅ Tenant Manager Service running on port ${PORT}`);
      console.log(`🔗 API: http://localhost:${PORT}`);
      console.log(`🏥 Health: http://localhost:${PORT}/health`);
      console.log('\n📚 Available endpoints:');
      console.log('  POST /api/auth/register-organization - Register new tenant');
      console.log('  POST /api/auth/login - Login to tenant');
      console.log('  GET  /api/admin/tenants - List all tenants (requires admin key)');
      console.log('  GET  /api/admin/stats - System statistics (requires admin key)');
    });
  } catch (error: any) {
    console.error('❌ Failed to start server:', error.message);
    console.error('\nTroubleshooting:');
    console.error('1. Ensure PostgreSQL is running');
    console.error('2. Check GLOBAL_DATABASE_URL is correct');
    console.error('3. Verify database credentials');
    console.error('4. Check .env file exists and is properly configured');
    process.exit(1);
  }
}

// Start the server
startServer();

export default app;

