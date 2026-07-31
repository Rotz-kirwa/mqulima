-- Migration: Create moderation_reports table for tracking moderation reports & user deletion cascades
CREATE TABLE IF NOT EXISTS moderation_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id UUID,
  reported_user_id UUID,
  target_id UUID,
  target_type VARCHAR(50),
  reason TEXT,
  status VARCHAR(50) DEFAULT 'pending',
  action_taken TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE OR REPLACE VIEW user_reports AS 
SELECT * FROM moderation_reports;

CREATE TABLE IF NOT EXISTS user_activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  action VARCHAR(100),
  details JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  token TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE OR REPLACE VIEW user_notifications AS
SELECT * FROM notifications;

CREATE OR REPLACE VIEW admin_logs AS
SELECT * FROM user_audit_actions;
