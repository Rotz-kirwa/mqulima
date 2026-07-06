-- ============================================================================
-- MQULIMA AI TOOLS — ADD JSONB COLUMN TO CROP DIAGNOSES
-- Migration: 00013_crop_diagnoses_jsonb.sql
-- ============================================================================

ALTER TABLE crop_diagnoses ADD COLUMN IF NOT EXISTS result_json JSONB;
