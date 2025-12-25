#!/usr/bin/env node
/**
 * Tenant Manager CLI
 * 
 * Command-line interface for managing tenants at scale
 */

import { Command } from 'commander';
import { Pool } from 'pg';
import dotenv from 'dotenv';
import chalk from 'chalk';
import ora from 'ora';
import { table } from 'table';

dotenv.config();

const program = new Command();

// Initialize database connection
const globalDb = new Pool({
  connectionString: process.env.GLOBAL_DATABASE_URL,
});

program
  .name('tenant-cli')
  .description('Enterprise tenant management CLI')
  .version('2.0.0');

// List tenants
program
  .command('list')
  .description('List all tenants')
  .option('-s, --status <status>', 'Filter by status (active, suspended, pending)')
  .option('-p, --plan <plan>', 'Filter by plan (free, pro, enterprise)')
  .option('-l, --limit <number>', 'Limit results', '50')
  .action(async (options) => {
    const spinner = ora('Fetching tenants...').start();

    try {
      let query = `
        SELECT 
          tr.id,
          tr.slug,
          tr.name,
          tr.status,
          tr.plan,
          tr.created_at,
          tu.active_users_count,
          tu.database_size_bytes,
          tu.last_activity
        FROM tenant_registry tr
        LEFT JOIN tenant_usage tu ON tr.id = tu.tenant_id
        WHERE 1=1
      `;

      const params: any[] = [];
      let paramIndex = 1;

      if (options.status) {
        query += ` AND tr.status = $${paramIndex++}`;
        params.push(options.status);
      }

      if (options.plan) {
        query += ` AND tr.plan = $${paramIndex++}`;
        params.push(options.plan);
      }

      query += ` ORDER BY tr.created_at DESC LIMIT $${paramIndex}`;
      params.push(parseInt(options.limit));

      const result = await globalDb.query(query, params);

      spinner.succeed(`Found ${result.rows.length} tenants`);

      if (result.rows.length === 0) {
        console.log(chalk.yellow('No tenants found'));
        return;
      }

      // Format data for table
      const data = [
        ['ID', 'Slug', 'Name', 'Status', 'Plan', 'Users', 'Storage', 'Created'],
        ...result.rows.map(row => [
          row.id.substring(0, 8),
          row.slug,
          row.name.substring(0, 20),
          row.status,
          row.plan,
          row.active_users_count || 0,
          formatBytes(row.database_size_bytes || 0),
          new Date(row.created_at).toLocaleDateString(),
        ]),
      ];

      console.log('\n' + table(data));
    } catch (error: any) {
      spinner.fail('Failed to fetch tenants');
      console.error(chalk.red(error.message));
      process.exit(1);
    }
  });

// Show tenant details
program
  .command('show <tenant-id>')
  .description('Show detailed information about a tenant')
  .action(async (tenantId) => {
    const spinner = ora('Fetching tenant details...').start();

    try {
      const result = await globalDb.query(`
        SELECT 
          tr.*,
          tu.*,
          ts.settings,
          gu.email as admin_email
        FROM tenant_registry tr
        LEFT JOIN tenant_usage tu ON tr.id = tu.tenant_id
        LEFT JOIN tenant_settings ts ON tr.id = ts.tenant_id
        LEFT JOIN global_users gu ON tr.admin_user_id = gu.id
        WHERE tr.id = $1 OR tr.slug = $1
      `, [tenantId]);

      if (result.rows.length === 0) {
        spinner.fail('Tenant not found');
        return;
      }

      const tenant = result.rows[0];
      spinner.succeed('Tenant found');

      console.log('\n' + chalk.bold('Tenant Details:'));
      console.log(chalk.gray('─'.repeat(50)));
      console.log(`${chalk.bold('ID:')} ${tenant.id}`);
      console.log(`${chalk.bold('Slug:')} ${tenant.slug}`);
      console.log(`${chalk.bold('Name:')} ${tenant.name}`);
      console.log(`${chalk.bold('Status:')} ${getStatusColor(tenant.status)}`);
      console.log(`${chalk.bold('Plan:')} ${tenant.plan}`);
      console.log(`${chalk.bold('Admin:')} ${tenant.admin_email}`);
      console.log(`${chalk.bold('Database:')} ${tenant.database_name}`);
      console.log(`${chalk.bold('Created:')} ${new Date(tenant.created_at).toLocaleString()}`);
      console.log(`${chalk.bold('Last Activity:')} ${tenant.last_activity ? new Date(tenant.last_activity).toLocaleString() : 'Never'}`);

      console.log('\n' + chalk.bold('Usage:'));
      console.log(chalk.gray('─'.repeat(50)));
      console.log(`${chalk.bold('Active Users:')} ${tenant.active_users_count || 0}`);
      console.log(`${chalk.bold('Storage:')} ${formatBytes(tenant.database_size_bytes || 0)}`);
      console.log(`${chalk.bold('API Calls:')} ${tenant.api_calls_count || 0}`);
      console.log(`${chalk.bold('Workflow Executions:')} ${tenant.workflow_executions_count || 0}`);

    } catch (error: any) {
      spinner.fail('Failed to fetch tenant details');
      console.error(chalk.red(error.message));
      process.exit(1);
    }
  });

// Suspend tenant
program
  .command('suspend <tenant-id>')
  .description('Suspend a tenant')
  .option('-r, --reason <reason>', 'Reason for suspension')
  .action(async (tenantId, options) => {
    const spinner = ora('Suspending tenant...').start();

    try {
      await globalDb.query(`
        UPDATE tenant_registry
        SET status = 'suspended',
            suspended_at = NOW(),
            updated_at = NOW()
        WHERE id = $1 OR slug = $1
      `, [tenantId]);

      spinner.succeed(`Tenant suspended: ${tenantId}`);
      if (options.reason) {
        console.log(chalk.gray(`Reason: ${options.reason}`));
      }
    } catch (error: any) {
      spinner.fail('Failed to suspend tenant');
      console.error(chalk.red(error.message));
      process.exit(1);
    }
  });

// Activate tenant
program
  .command('activate <tenant-id>')
  .description('Activate a suspended tenant')
  .action(async (tenantId) => {
    const spinner = ora('Activating tenant...').start();

    try {
      await globalDb.query(`
        UPDATE tenant_registry
        SET status = 'active',
            suspended_at = NULL,
            updated_at = NOW()
        WHERE id = $1 OR slug = $1
      `, [tenantId]);

      spinner.succeed(`Tenant activated: ${tenantId}`);
    } catch (error: any) {
      spinner.fail('Failed to activate tenant');
      console.error(chalk.red(error.message));
      process.exit(1);
    }
  });

// System stats
program
  .command('stats')
  .description('Show system statistics')
  .action(async () => {
    const spinner = ora('Fetching statistics...').start();

    try {
      const result = await globalDb.query(`
        SELECT 
          COUNT(*) FILTER (WHERE status = 'active') as active_tenants,
          COUNT(*) FILTER (WHERE status = 'suspended') as suspended_tenants,
          COUNT(*) FILTER (WHERE status = 'pending') as pending_tenants,
          COUNT(*) as total_tenants,
          SUM(tu.database_size_bytes) as total_storage,
          SUM(tu.active_users_count) as total_users,
          SUM(tu.api_calls_count) as total_api_calls
        FROM tenant_registry tr
        LEFT JOIN tenant_usage tu ON tr.id = tu.tenant_id
      `);

      const stats = result.rows[0];
      spinner.succeed('Statistics retrieved');

      console.log('\n' + chalk.bold('System Statistics:'));
      console.log(chalk.gray('─'.repeat(50)));
      console.log(`${chalk.bold('Total Tenants:')} ${stats.total_tenants}`);
      console.log(`${chalk.bold('Active:')} ${chalk.green(stats.active_tenants)}`);
      console.log(`${chalk.bold('Suspended:')} ${chalk.yellow(stats.suspended_tenants)}`);
      console.log(`${chalk.bold('Pending:')} ${chalk.gray(stats.pending_tenants)}`);
      console.log(`${chalk.bold('Total Storage:')} ${formatBytes(stats.total_storage || 0)}`);
      console.log(`${chalk.bold('Total Users:')} ${stats.total_users || 0}`);
      console.log(`${chalk.bold('Total API Calls:')} ${(stats.total_api_calls || 0).toLocaleString()}`);

    } catch (error: any) {
      spinner.fail('Failed to fetch statistics');
      console.error(chalk.red(error.message));
      process.exit(1);
    }
  });

// Health check
program
  .command('health')
  .description('Check system health')
  .action(async () => {
    console.log(chalk.bold('System Health Check:'));
    console.log(chalk.gray('─'.repeat(50)));

    // Check database
    const dbSpinner = ora('Checking database...').start();
    try {
      await globalDb.query('SELECT 1');
      dbSpinner.succeed('Database: ' + chalk.green('✓ Connected'));
    } catch (error) {
      dbSpinner.fail('Database: ' + chalk.red('✗ Disconnected'));
    }

    // Check Redis (if configured)
    if (process.env.REDIS_URL) {
      const redisSpinner = ora('Checking Redis...').start();
      try {
        // Import Redis client
        const { createClient } = await import('redis');
        const redis = createClient({ url: process.env.REDIS_URL });
        await redis.connect();
        await redis.ping();
        await redis.quit();
        redisSpinner.succeed('Redis: ' + chalk.green('✓ Connected'));
      } catch (error) {
        redisSpinner.fail('Redis: ' + chalk.red('✗ Disconnected'));
      }
    }

    console.log('');
  });

// Helper functions
function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function getStatusColor(status: string): string {
  switch (status) {
    case 'active':
      return chalk.green(status);
    case 'suspended':
      return chalk.yellow(status);
    case 'pending':
      return chalk.gray(status);
    case 'deleted':
      return chalk.red(status);
    default:
      return status;
  }
}

// Parse arguments
program.parse();

// Close database connection on exit
process.on('exit', () => {
  globalDb.end();
});
