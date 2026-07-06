-- ============================================================================
-- MQULIMA AI TOOLS — CROP DIAGNOSES SCHEMA EXTENSION
-- Migration: 00012_crop_diagnoses.sql
-- ============================================================================

CREATE TABLE IF NOT EXISTS crop_diagnoses (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID REFERENCES profiles(id) ON DELETE CASCADE,
  crop         TEXT NOT NULL,
  symptoms     TEXT[] NOT NULL DEFAULT '{}',
  image_url    TEXT,
  disease_name TEXT NOT NULL,
  confidence   NUMERIC(5,2) NOT NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for retrieving user diagnostic history
CREATE INDEX IF NOT EXISTS idx_crop_diagnoses_user ON crop_diagnoses(user_id);
