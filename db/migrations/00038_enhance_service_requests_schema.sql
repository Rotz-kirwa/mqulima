-- ============================================================================
-- 00038_enhance_service_requests_schema.sql
-- Add contact details, subservice name, farm scale, channel, and cost to service_requests
-- ============================================================================

ALTER TABLE service_requests
  ADD COLUMN IF NOT EXISTS reference TEXT,
  ADD COLUMN IF NOT EXISTS contact_name TEXT,
  ADD COLUMN IF NOT EXISTS contact_phone TEXT,
  ADD COLUMN IF NOT EXISTS subservice_name TEXT,
  ADD COLUMN IF NOT EXISTS farm_scale TEXT,
  ADD COLUMN IF NOT EXISTS channel TEXT DEFAULT 'website',
  ADD COLUMN IF NOT EXISTS estimated_cost NUMERIC(12,2);

CREATE INDEX IF NOT EXISTS idx_service_requests_reference ON service_requests(reference);
CREATE INDEX IF NOT EXISTS idx_service_requests_channel ON service_requests(channel);
