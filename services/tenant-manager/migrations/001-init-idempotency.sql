-- Migration: Initialize Webhook Idempotency and Registration Tracking Tables
-- Created: 2024-12-26
-- Description: Creates tables for tracking webhook processing and registration idempotency

-- ============================================
-- Webhook Idempotency Table
-- ============================================
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

-- Indexes for webhook_idempotency
CREATE INDEX IF NOT EXISTS idx_webhook_idempotency_key 
  ON webhook_idempotency(idempotency_key);
CREATE INDEX IF NOT EXISTS idx_webhook_clerk_event_id 
  ON webhook_idempotency(clerk_event_id);
CREATE INDEX IF NOT EXISTS idx_webhook_status 
  ON webhook_idempotency(status);
CREATE INDEX IF NOT EXISTS idx_webhook_created_at 
  ON webhook_idempotency(created_at);

-- ============================================
-- Registration Idempotency Table
-- ============================================
CREATE TABLE IF NOT EXISTS registration_idempotency (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  idempotency_key VARCHAR(255) NOT NULL UNIQUE,
  status VARCHAR(50) NOT NULL DEFAULT 'processing',
  result JSONB,
  error TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP,
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for registration_idempotency
CREATE INDEX IF NOT EXISTS idx_registration_idempotency_key 
  ON registration_idempotency(idempotency_key);
CREATE INDEX IF NOT EXISTS idx_registration_status 
  ON registration_idempotency(status);
CREATE INDEX IF NOT EXISTS idx_registration_created_at 
  ON registration_idempotency(created_at);

-- ============================================
-- Provisioning Status Table
-- ============================================
CREATE TABLE IF NOT EXISTS provisioning_status (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id VARCHAR(255) NOT NULL UNIQUE,
  tenant_id UUID,
  status VARCHAR(50) NOT NULL DEFAULT 'pending',
  progress INTEGER DEFAULT 0,
  current_step TEXT,
  error TEXT,
  result JSONB,
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for provisioning_status
CREATE INDEX IF NOT EXISTS idx_provisioning_job_id 
  ON provisioning_status(job_id);
CREATE INDEX IF NOT EXISTS idx_provisioning_tenant_id 
  ON provisioning_status(tenant_id);
CREATE INDEX IF NOT EXISTS idx_provisioning_status 
  ON provisioning_status(status);

-- ============================================
-- Audit Log Table
-- ============================================
CREATE TABLE IF NOT EXISTS audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action VARCHAR(100) NOT NULL,
  entity_type VARCHAR(100),
  entity_id UUID,
  tenant_id UUID,
  user_id UUID,
  details JSONB,
  status VARCHAR(50),
  error TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for audit_log
CREATE INDEX IF NOT EXISTS idx_audit_log_action 
  ON audit_log(action);
CREATE INDEX IF NOT EXISTS idx_audit_log_entity 
  ON audit_log(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_tenant 
  ON audit_log(tenant_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_created_at 
  ON audit_log(created_at);

-- ============================================
-- Cleanup Function
-- ============================================
CREATE OR REPLACE FUNCTION cleanup_old_webhook_records(days_to_keep INTEGER DEFAULT 30)
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM webhook_idempotency 
  WHERE created_at < NOW() - INTERVAL '1 day' * days_to_keep
  AND status IN ('completed', 'failed');
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

