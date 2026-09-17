-- Migration: 00056_add_news_view_count.sql
-- Description: Adds view_count column to agritech_news table for tracking article impressions and reader views

ALTER TABLE agritech_news ADD COLUMN IF NOT EXISTS view_count INTEGER DEFAULT 0;

-- Optional index for sorting by most viewed if needed in future
CREATE INDEX IF NOT EXISTS idx_agritech_news_view_count ON agritech_news (view_count DESC);
