-- ============================================================================
-- DB MIGRATION: 00005_add_service_request_reference.sql
-- Adds reference column to service_requests table.
-- ============================================================================

ALTER TABLE service_requests ADD COLUMN IF NOT EXISTS reference TEXT UNIQUE;
