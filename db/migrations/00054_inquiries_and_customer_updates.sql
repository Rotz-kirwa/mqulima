-- Migration 00054: Inquiries Schema, Stock Sourcing, and Customer Status & KYC Persistence
-- Ensures all inquiry tables have administrative fields and users/profiles have status and verification flags

-- 1. Contact Submissions administrative columns
ALTER TABLE contact_submissions 
ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'open',
ADD COLUMN IF NOT EXISTS assigned_staff VARCHAR(100) DEFAULT 'Unassigned',
ADD COLUMN IF NOT EXISTS admin_notes TEXT;

-- 2. Partnership Applications administrative columns
ALTER TABLE partnership_applications 
ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'open',
ADD COLUMN IF NOT EXISTS assigned_staff VARCHAR(100) DEFAULT 'Unassigned',
ADD COLUMN IF NOT EXISTS admin_notes TEXT;

-- 3. Stock Sourcing Requests Table
CREATE TABLE IF NOT EXISTS stock_sourcing_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_name VARCHAR(255) NOT NULL,
  preferred_brand VARCHAR(255),
  contact_name VARCHAR(255),
  contact_phone VARCHAR(50),
  contact_email VARCHAR(255),
  status VARCHAR(50) DEFAULT 'open',
  assigned_staff VARCHAR(100) DEFAULT 'Unassigned',
  admin_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Users status and KYC verification columns
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'active',
ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT false;

-- 5. Profiles status and KYC verification columns
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'active',
ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT false;
