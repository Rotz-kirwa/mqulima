-- Migration 00043: Create admin_logs table for tracking all administrative actions
CREATE TABLE IF NOT EXISTS admin_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id UUID,
  actor_email VARCHAR(255),
  action VARCHAR(100) NOT NULL,
  entity_type VARCHAR(100),
  entity_id VARCHAR(255),
  diff JSONB,
  ip_address VARCHAR(45),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ensure alias view for audit_log parity
CREATE OR REPLACE VIEW admin_logs_view AS
SELECT 
  id,
  actor_id,
  action,
  entity_type,
  entity_id,
  diff,
  created_at
FROM audit_log;

-- Indexes for high performance querying on audit table
CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_created_at ON admin_audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_actor ON admin_audit_logs(actor_id);
