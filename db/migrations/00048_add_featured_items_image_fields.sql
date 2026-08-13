-- Migration 00048: Add image_url, title, and link_url columns to featured_items table for Farm Essentials featured collection management

ALTER TABLE featured_items 
ADD COLUMN IF NOT EXISTS image_url text,
ADD COLUMN IF NOT EXISTS title varchar(255),
ADD COLUMN IF NOT EXISTS link_url varchar(255);
