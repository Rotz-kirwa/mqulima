-- Migration 00042: Media Storage URLs & Schema Integrity
-- Description: Enforce clean URL storage across profiles, crop diagnoses, marketplace, posts, and products.

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS avatar_url TEXT,
  ADD COLUMN IF NOT EXISTS cover_image TEXT,
  ADD COLUMN IF NOT EXISTS farming_photos TEXT[] DEFAULT '{}';

ALTER TABLE products
  ADD COLUMN IF NOT EXISTS image_urls TEXT[] DEFAULT '{}';

ALTER TABLE commodity_listings
  ADD COLUMN IF NOT EXISTS image_urls TEXT[] DEFAULT '{}';

ALTER TABLE show_posts
  ADD COLUMN IF NOT EXISTS media_urls TEXT[] DEFAULT '{}';

ALTER TABLE crop_diagnoses
  ADD COLUMN IF NOT EXISTS image_url TEXT;

ALTER TABLE direct_messages
  ADD COLUMN IF NOT EXISTS image_url TEXT;
