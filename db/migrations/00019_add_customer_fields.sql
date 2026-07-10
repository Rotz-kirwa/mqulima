-- Migration: Add customer status, last login, and WhatsApp columns to profiles table

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'active';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMPTZ;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS whatsapp_number TEXT;

-- Update existing profiles status to active if they are currently null
UPDATE profiles SET status = 'active' WHERE status IS NULL;

-- Initialize whatsapp_number to phone number for existing records
UPDATE profiles SET whatsapp_number = phone WHERE whatsapp_number IS NULL AND phone IS NOT NULL;

-- Add index on status for faster filtering
CREATE INDEX IF NOT EXISTS idx_profiles_status ON profiles(status);
