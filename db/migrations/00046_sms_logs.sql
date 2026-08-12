-- Migration 00046: Create sms_logs table for tracking SMS dispatch status and payloads
CREATE TABLE IF NOT EXISTS sms_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient VARCHAR(50) NOT NULL,
  message TEXT NOT NULL,
  trigger_type VARCHAR(100) NOT NULL,
  status VARCHAR(50) NOT NULL,
  response_payload JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_sms_logs_recipient ON sms_logs(recipient);
CREATE INDEX IF NOT EXISTS idx_sms_logs_created_at ON sms_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sms_logs_trigger_type ON sms_logs(trigger_type);
