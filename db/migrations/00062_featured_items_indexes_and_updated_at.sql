-- Migration 00062: Add position index and updated_at column to featured_items
ALTER TABLE featured_items 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

CREATE INDEX IF NOT EXISTS idx_featured_items_position ON featured_items (position ASC);
