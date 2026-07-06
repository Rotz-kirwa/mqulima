-- ============================================================================
-- MQULIMA ACADEMY — LESSON COMPLETIONS SCHEMA EXTENSION
-- Migration: 00011_academy_lesson_progress.sql
-- ============================================================================

CREATE TABLE IF NOT EXISTS user_completed_lessons (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  course_id    UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  lesson_id    UUID NOT NULL REFERENCES chapter_lessons(id) ON DELETE CASCADE,
  completed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, lesson_id)
);

-- Index for fast retrieval of user's completed lessons for a course
CREATE INDEX IF NOT EXISTS idx_completed_lessons_user_course ON user_completed_lessons(user_id, course_id);
