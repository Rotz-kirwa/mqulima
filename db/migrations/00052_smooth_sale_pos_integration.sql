-- Migration 00052: Smooth Sale POS Integration Schema
-- Adds external POS product tracking, variations location stock, POS token storage, and POS sync logs

-- 1. Extend products table with external_product_id
ALTER TABLE products 
  ADD COLUMN IF NOT EXISTS external_product_id TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS idx_products_external_product_id 
  ON products(external_product_id) 
  WHERE external_product_id IS NOT NULL;

-- 2. Extend product_variants table with external_variation_id, location, and updated_at
ALTER TABLE product_variants
  ADD COLUMN IF NOT EXISTS external_variation_id TEXT,
  ADD COLUMN IF NOT EXISTS location TEXT,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

CREATE UNIQUE INDEX IF NOT EXISTS idx_product_variants_external_variation_id 
  ON product_variants(external_variation_id) 
  WHERE external_variation_id IS NOT NULL;

-- 3. Create pos_auth_tokens table to persist OAuth tokens securely
CREATE TABLE IF NOT EXISTS pos_auth_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider TEXT NOT NULL UNIQUE,
  access_token TEXT NOT NULL,
  token_type TEXT DEFAULT 'Bearer',
  expires_in INTEGER NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Create pos_sync_logs table for audit & observability
CREATE TABLE IF NOT EXISTS pos_sync_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sync_type TEXT NOT NULL, -- 'smooth_sale_cron' or 'manual_admin'
  status TEXT NOT NULL,    -- 'success', 'failed', 'in_progress'
  products_synced INTEGER DEFAULT 0,
  variations_synced INTEGER DEFAULT 0,
  error_message TEXT,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_pos_sync_logs_started_at ON pos_sync_logs(started_at DESC);
