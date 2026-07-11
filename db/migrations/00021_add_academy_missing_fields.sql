-- ============================================================================
-- MQULIMA ACADEMY — ADD MISSING COURSES FIELDS & BACKFILL
-- Migration: 00021_add_academy_missing_fields.sql
-- ============================================================================

-- 1. Add missing fields to courses table
ALTER TABLE courses
  ADD COLUMN IF NOT EXISTS category            TEXT,
  ADD COLUMN IF NOT EXISTS instructor_name     TEXT,
  ADD COLUMN IF NOT EXISTS instructor_title    TEXT,
  ADD COLUMN IF NOT EXISTS rating               NUMERIC(3,2) DEFAULT 5.00,
  ADD COLUMN IF NOT EXISTS student_count       INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS has_certificate     BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS youtube_id          TEXT;

-- 2. Backfill existing seeded courses with their categories and metadata, and mark them as published
UPDATE courses
  SET 
    category = 'CROP PRODUCTION',
    instructor_name = 'Samuel Kiprono',
    instructor_title = 'Lead Horticulturist & Agronomy Extension Officer',
    rating = 4.80,
    student_count = 1240,
    has_certificate = true,
    youtube_id = '9MQOIRzZHa0',
    is_published = true
  WHERE slug = 'sukuma-wiki-production';

UPDATE courses
  SET 
    category = 'CROP PRODUCTION',
    instructor_name = 'Samuel Kiprono',
    instructor_title = 'Lead Horticulturist & Agronomy Extension Officer',
    rating = 4.90,
    student_count = 850,
    has_certificate = true,
    youtube_id = '9MQOIRzZHa0',
    is_published = true
  WHERE slug = 'avocado-masterclass';

UPDATE courses
  SET 
    category = 'LIVESTOCK PRODUCTION',
    instructor_name = 'Grace Mutiso',
    instructor_title = 'Veterinary Specialist & Dairy Lead',
    rating = 4.70,
    student_count = 940,
    has_certificate = true,
    youtube_id = '9MQOIRzZHa0',
    is_published = true
  WHERE slug = 'dairy-farming-essentials';

UPDATE courses
  SET 
    category = 'LIVESTOCK PRODUCTION',
    instructor_name = 'Grace Mutiso',
    instructor_title = 'Veterinary Specialist & Poultry Lead',
    rating = 4.60,
    student_count = 1120,
    has_certificate = true,
    youtube_id = '9MQOIRzZHa0',
    is_published = true
  WHERE slug = 'poultry-farming-essentials';

UPDATE courses
  SET 
    category = 'AI in Agriculture',
    instructor_name = 'Dr. Eliud Kirwa',
    instructor_title = 'AI Research Lead & Agritech Advisor',
    rating = 5.00,
    student_count = 2300,
    has_certificate = true,
    youtube_id = '9MQOIRzZHa0',
    is_published = true
  WHERE slug = 'ai-in-agriculture';
