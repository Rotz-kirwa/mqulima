-- Reconcile columns declared in Drizzle schemas that were missing in live PostgreSQL.
-- Fixes 500 Internal Server Error on /api/admin/services and /api/admin/inquiries.

ALTER TABLE service_requests ADD COLUMN IF NOT EXISTS contact_email TEXT;
ALTER TABLE show_posts ADD COLUMN IF NOT EXISTS category TEXT;
ALTER TABLE direct_messages ADD COLUMN IF NOT EXISTS message_text TEXT;
ALTER TABLE crop_diagnoses ADD COLUMN IF NOT EXISTS crop_name TEXT;
ALTER TABLE crop_diagnoses ADD COLUMN IF NOT EXISTS diagnosis_result TEXT;
ALTER TABLE crop_diagnoses ADD COLUMN IF NOT EXISTS confidence_score NUMERIC(5, 2);
ALTER TABLE crop_diagnoses ADD COLUMN IF NOT EXISTS treatment_recommendation TEXT;

