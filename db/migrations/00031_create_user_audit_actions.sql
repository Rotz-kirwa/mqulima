-- Migration: Create user_audit_actions table for tracking user administration & deletion logs
CREATE TABLE IF NOT EXISTS user_audit_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  admin_id UUID,
  actor_id TEXT,
  target_user_id TEXT,
  action VARCHAR(100) NOT NULL,
  entity_type TEXT,
  entity_id TEXT,
  details JSONB,
  diff JSONB,
  metadata JSONB,
  notes TEXT,
  ip_address VARCHAR(45),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE OR REPLACE VIEW user_audit_logs AS 
SELECT * FROM user_audit_actions;
