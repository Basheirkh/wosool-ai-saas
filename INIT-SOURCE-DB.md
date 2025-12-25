# Source Database Initialization Guide

## Overview

The source database (`twenty`) is a **template database** that gets copied to each new tenant. It should be initialized **ONCE** during setup, not on every tenant creation.

## Why This Matters

- **Performance**: Copying a pre-initialized schema is much faster than creating it from scratch
- **Consistency**: All tenants start with the same base schema
- **Reliability**: Ensures the schema verification passes (requires at least 3 tables in `core` schema)

## One-Time Initialization

### Option 1: Automatic (via deploy-server.sh)

The deployment script automatically initializes the source database:

```bash
./deploy-server.sh
```

This will:
1. Create the `twenty` database if it doesn't exist
2. Create the `core` schema
3. Create all essential tables (application, workspace, role, user, userWorkspace, person, opportunity)

### Option 2: Manual (via Docker)

If you need to initialize manually:

```bash
# Start tenant-db container
docker-compose up -d tenant-db

# Wait for it to be ready
sleep 5

# Create database and schema
docker-compose exec -T tenant-db psql -U postgres << 'EOF'
-- Create database if it doesn't exist
SELECT 'CREATE DATABASE twenty'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'twenty')\gexec

-- Connect to twenty database
\c twenty

-- Create core schema
CREATE SCHEMA IF NOT EXISTS core;

-- Create essential tables
CREATE TABLE IF NOT EXISTS core.application (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255),
  "universalIdentifier" VARCHAR(255)
);

CREATE TABLE IF NOT EXISTS core.workspace (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "displayName" VARCHAR(255),
  subdomain VARCHAR(255),
  "activationStatus" VARCHAR(50),
  "databaseUrl" VARCHAR(255),
  "databaseSchema" VARCHAR(255),
  "workspaceCustomApplicationId" UUID,
  "defaultRoleId" UUID
);

CREATE TABLE IF NOT EXISTS core.role (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "workspaceId" UUID,
  label VARCHAR(255),
  "canUpdateAllSettings" BOOLEAN,
  "canAccessAllTools" BOOLEAN,
  "canReadAllObjectRecords" BOOLEAN,
  "canUpdateAllObjectRecords" BOOLEAN,
  "canSoftDeleteAllObjectRecords" BOOLEAN,
  "canDestroyAllObjectRecords" BOOLEAN
);

CREATE TABLE IF NOT EXISTS core."user" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE,
  "firstName" VARCHAR(255),
  "lastName" VARCHAR(255),
  "passwordHash" VARCHAR(255),
  "isEmailVerified" BOOLEAN DEFAULT false,
  "defaultWorkspaceId" UUID
);

CREATE TABLE IF NOT EXISTS core."userWorkspace" (
  "userId" UUID,
  "workspaceId" UUID,
  PRIMARY KEY ("userId", "workspaceId")
);

CREATE TABLE IF NOT EXISTS core.person (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255)
);

CREATE TABLE IF NOT EXISTS core.opportunity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255)
);
EOF
```

### Option 3: Using TypeScript Script

```bash
cd services/tenant-manager
npm run init:source-db
```

## Verification

After initialization, verify the source database has the required schema:

```bash
docker-compose exec -T tenant-db psql -U postgres -d twenty -c "
SELECT 
  schema_name,
  COUNT(*) as table_count
FROM information_schema.tables 
WHERE table_schema = 'core'
GROUP BY schema_name;
"
```

Expected output:
```
 schema_name | table_count 
-------------+-------------
 core        |           7
```

## What Gets Copied

When a new tenant is created, the provisioning service:
1. Creates a new database (e.g., `twenty_tenant_ahad_org_abc12345`)
2. Creates the `core` schema
3. Uses `pg_dump` to copy the schema from `twenty` database
4. Verifies at least 3 tables exist in the `core` schema
5. Initializes the workspace with admin user

## Troubleshooting

### Error: "Source database 'twenty' does not exist"

**Solution**: Run the initialization script:
```bash
./deploy-server.sh
# or manually as shown in Option 2
```

### Error: "Schema verification failed - not enough tables copied"

**Solution**: Check that the source database has at least 3 tables:
```bash
docker-compose exec -T tenant-db psql -U postgres -d twenty -c "
SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'core';
"
```

If count is less than 3, re-run the initialization.

### Error: "pg_dump: error: connection to database failed"

**Solution**: Ensure:
- `POSTGRES_HOST` points to the correct database container name (`tenant-db`)
- `POSTGRES_ADMIN_PASSWORD` is correct
- The tenant-db container is running and healthy

## Important Notes

- ✅ **Initialize ONCE**: The source database should be initialized once during setup
- ✅ **Don't modify**: Avoid modifying the source database after initialization
- ✅ **Template only**: The source database is a template - tenant data goes in separate databases
- ✅ **Schema updates**: If you need to update the schema, update the source database and it will be copied to new tenants

