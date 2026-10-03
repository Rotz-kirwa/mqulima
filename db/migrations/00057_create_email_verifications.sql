-- Migration: 00057_create_email_verifications.sql
-- Description: Creates email_verifications table for secure 6-digit registration OTP verification

CREATE TABLE IF NOT EXISTS email_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  code_hash TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  attempts INTEGER NOT NULL DEFAULT 0,
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Optimization indexes for rapid lookups and rate limiting checks
CREATE INDEX IF NOT EXISTS idx_email_verifications_email_created_at ON email_verifications (email, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_email_verifications_user_id ON email_verifications (user_id);
CREATE INDEX IF NOT EXISTS idx_email_verifications_expires_at ON email_verifications (expires_at);
