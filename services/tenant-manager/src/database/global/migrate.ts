/**
 * Global Database Migration Script
 * 
 * Creates the tenant registry schema in the global database
 */

import { Pool } from 'pg';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function migrate() {
  const globalDbUrl = process.env.GLOBAL_DATABASE_URL;
  
  if (!globalDbUrl) {
    throw new Error('GLOBAL_DATABASE_URL environment variable is required');
  }

  const pool = new Pool({
    connectionString: globalDbUrl,
  });

  try {
    console.log('🔄 Running global database migrations...');

    // Read schema file
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');

    // Execute schema
    await pool.query(schema);

    console.log('✅ Global database migrations completed successfully');
  } catch (error: any) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

migrate().catch((error) => {
  console.error('Migration error:', error);
  process.exit(1);
});

