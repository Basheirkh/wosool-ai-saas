/**
 * Global Database Initialization
 * 
 * Automatically initializes the global database schema on startup
 */

import { Pool } from 'pg';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function initializeGlobalDatabase(globalDbUrl: string): Promise<void> {
  if (!globalDbUrl) {
    throw new Error('GLOBAL_DATABASE_URL is required');
  }

  const pool = new Pool({
    connectionString: globalDbUrl,
  });

  try {
    console.log('🔄 Checking global database schema...');

    // Check if tables exist
    const tableCheck = await pool.query(`
      SELECT COUNT(*) as count 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('tenant_registry', 'global_users', 'tenant_settings', 'tenant_usage')
    `);

    const tableCount = parseInt(tableCheck.rows[0].count);

    if (tableCount === 4) {
      console.log('✅ Global database schema already initialized');
      return;
    }

    console.log('📦 Initializing global database schema...');

    // Read and execute schema file
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');

    await pool.query(schema);

    console.log('✅ Global database schema initialized successfully');
  } catch (error: any) {
    console.error('❌ Global database initialization failed:', error.message);
    throw error;
  } finally {
    await pool.end();
  }
}

export async function validateGlobalDatabase(globalDbUrl: string): Promise<boolean> {
  const pool = new Pool({
    connectionString: globalDbUrl,
  });

  try {
    // Test connection
    await pool.query('SELECT 1');
    
    // Check if required tables exist
    const tableCheck = await pool.query(`
      SELECT COUNT(*) as count 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('tenant_registry', 'global_users', 'tenant_settings', 'tenant_usage')
    `);

    const tableCount = parseInt(tableCheck.rows[0].count);
    
    await pool.end();
    return tableCount === 4;
  } catch (error) {
    await pool.end();
    return false;
  }
}
