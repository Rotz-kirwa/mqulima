-- Migration: 00063_create_recovery_tokens.sql
-- Description: Creates recovery_tokens table for secure multi-channel password recovery flow

CREATE TABLE IF NOT EXISTS recovery_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  code_hash TEXT NOT NULL,
  token_hash TEXT NOT NULL,
  attempts INTEGER NOT NULL DEFAULT 0,
  max_attempts INTEGER NOT NULL DEFAULT 5,
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Optimization and lookup indexes
CREATE INDEX IF NOT EXISTS idx_recovery_tokens_user_id ON recovery_tokens (user_id);
CREATE INDEX IF NOT EXISTS idx_recovery_tokens_code_hash ON recovery_tokens (code_hash);
CREATE INDEX IF NOT EXISTS idx_recovery_tokens_token_hash ON recovery_tokens (token_hash);
CREATE INDEX IF NOT EXISTS idx_recovery_tokens_expires_at ON recovery_tokens (expires_at);
