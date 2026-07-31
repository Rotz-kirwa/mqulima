-- Migration 00028: Add contact_phone column to commodity_listings table
ALTER TABLE commodity_listings ADD COLUMN IF NOT EXISTS contact_phone TEXT;
