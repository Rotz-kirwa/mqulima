-- ============================================================================
-- MQULIMA ACADEMY — CHAPTERS & LESSONS SCHEMA EXTENSION
-- Migration: 00009_academy_chapters.sql
-- ============================================================================

-- Extend courses table with additional fields
ALTER TABLE courses
  ADD COLUMN IF NOT EXISTS cover_image_url    TEXT,
  ADD COLUMN IF NOT EXISTS intro_video_url    TEXT,
  ADD COLUMN IF NOT EXISTS intro_video_type   TEXT CHECK (intro_video_type IN ('youtube', 'vimeo', 'direct')),
  ADD COLUMN IF NOT EXISTS duration_minutes   INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS is_published       BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS sort_order         INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS deleted_at         TIMESTAMPTZ;

-- Course chapters
CREATE TABLE IF NOT EXISTS course_chapters (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id        UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  title            TEXT NOT NULL,
  description      TEXT,
  sort_order       INTEGER NOT NULL DEFAULT 0,
  duration_minutes INTEGER DEFAULT 0,
  is_published     BOOLEAN DEFAULT false,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Chapter lessons / content items
CREATE TABLE IF NOT EXISTS chapter_lessons (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chapter_id              UUID NOT NULL REFERENCES course_chapters(id) ON DELETE CASCADE,
  title                   TEXT NOT NULL,
  content_type            TEXT NOT NULL CHECK (content_type IN ('video', 'text', 'pdf', 'quiz')),
  video_url               TEXT,
  video_type              TEXT CHECK (video_type IN ('youtube', 'vimeo', 'direct')),
  video_duration_seconds  INTEGER,
  text_content            TEXT,
  pdf_url                 TEXT,
  sort_order              INTEGER NOT NULL DEFAULT 0,
  is_free_preview         BOOLEAN DEFAULT false,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_chapters_course  ON course_chapters(course_id, sort_order);
CREATE INDEX IF NOT EXISTS idx_lessons_chapter  ON chapter_lessons(chapter_id, sort_order);
CREATE INDEX IF NOT EXISTS idx_courses_sort     ON courses(sort_order, created_at DESC);

-- Backfill existing courses: set is_published = true for seeded ones,
-- copy old image_url -> cover_image_url if column existed
UPDATE courses
  SET is_published = true,
      cover_image_url = COALESCE(cover_image_url, image_url)
  WHERE deleted_at IS NULL
    AND cover_image_url IS NULL;
