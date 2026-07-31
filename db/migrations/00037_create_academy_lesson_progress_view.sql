-- ============================================================================
-- MQULIMA PLATFORM — ACADEMY LESSON PROGRESS VIEW ALIAS
-- Migration: 00037_create_academy_lesson_progress_view.sql
-- ============================================================================

CREATE OR REPLACE VIEW academy_lesson_progress AS
SELECT 
  id,
  user_id,
  course_id,
  lesson_id,
  completed_at
FROM user_completed_lessons;
