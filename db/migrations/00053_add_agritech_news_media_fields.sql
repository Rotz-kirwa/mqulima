-- Migration 00053: Add media_type and media_url to agritech_news table
-- Required for news/articles media support across the platform and CMS

ALTER TABLE agritech_news 
ADD COLUMN IF NOT EXISTS media_type VARCHAR(20) DEFAULT 'image',
ADD COLUMN IF NOT EXISTS media_url TEXT;
