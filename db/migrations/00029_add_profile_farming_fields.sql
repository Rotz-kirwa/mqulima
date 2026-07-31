-- Migration: Add profile farming fields
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS farming_activities TEXT,
ADD COLUMN IF NOT EXISTS farming_photos TEXT[] DEFAULT '{}';
