-- ============================================================================
-- MQULIMA ACADEMY — ADD COURSE DIRECT CONTENT COLUMN
-- Migration: 00022_add_course_content.sql
-- ============================================================================

ALTER TABLE courses ADD COLUMN IF NOT EXISTS content TEXT;

-- Concatenate existing chapter and lesson content to course content so we don't lose data
UPDATE courses c
SET content = (
  SELECT string_agg(
    '# ' || cc.title || E'\n' || COALESCE(cc.description, '') || E'\n\n' || COALESCE((
      SELECT string_agg(
        '## ' || cl.title || E'\n' || COALESCE(cl.text_content, '') || E'\n',
        E'\n' ORDER BY cl.sort_order
      )
      FROM chapter_lessons cl
      WHERE cl.chapter_id = cc.id
    ), ''),
    E'\n\n' ORDER BY cc.sort_order
  )
  FROM course_chapters cc
  WHERE cc.course_id = c.id
)
WHERE c.content IS NULL;
