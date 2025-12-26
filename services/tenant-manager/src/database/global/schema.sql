-- Global Database Schema for Multi-Tenant SaaS Platform
-- This schema manages tenant registry, global users, settings, and usage tracking

-- Tenant Registry Table
CREATE TABLE IF NOT EXISTS tenant_registry (
    id UUID PRIMARY KEY,
    slug VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    database_name VARCHAR(255) UNIQUE NOT NULL,
    database_url TEXT NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    plan VARCHAR(50) NOT NULL DEFAULT 'free',
    admin_user_id UUID,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Global Users Table
CREATE TABLE IF NOT EXISTS global_users (
    id UUID PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash TEXT,
    tenant_id UUID NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'USER',
    is_active BOOLEAN NOT NULL DEFAULT true,
    last_login TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    FOREIGN KEY (tenant_id) REFERENCES tenant_registry(id) ON DELETE CASCADE
);

-- Tenant Settings Table
CREATE TABLE IF NOT EXISTS tenant_settings (
    tenant_id UUID PRIMARY KEY,
    settings JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    FOREIGN KEY (tenant_id) REFERENCES tenant_registry(id) ON DELETE CASCADE
);

-- Tenant Usage Table
CREATE TABLE IF NOT EXISTS tenant_usage (
    tenant_id UUID PRIMARY KEY,
    active_users_count INTEGER DEFAULT 0,
    database_size_bytes BIGINT DEFAULT 0,
    api_calls_count INTEGER DEFAULT 0,
    workflow_executions_count INTEGER DEFAULT 0,
    last_activity TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    FOREIGN KEY (tenant_id) REFERENCES tenant_registry(id) ON DELETE CASCADE
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_tenant_registry_slug ON tenant_registry(slug);
CREATE INDEX IF NOT EXISTS idx_tenant_registry_status ON tenant_registry(status);
CREATE INDEX IF NOT EXISTS idx_global_users_email ON global_users(email);
CREATE INDEX IF NOT EXISTS idx_global_users_tenant_id ON global_users(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tenant_usage_last_activity ON tenant_usage(last_activity);

