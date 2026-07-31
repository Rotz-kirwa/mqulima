-- ============================================================================
-- 00025_forum_bookmarks_replies.sql
-- Adds parent_id to show_comments for nested replies and creates show_bookmarks
-- ============================================================================

-- 1. Add parent_id column to show_comments table if not exists
ALTER TABLE show_comments ADD COLUMN IF NOT EXISTS parent_id UUID REFERENCES show_comments(id) ON DELETE CASCADE;

-- 2. Create show_bookmarks table for saving posts
CREATE TABLE IF NOT EXISTS show_bookmarks (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id     UUID NOT NULL REFERENCES show_posts(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(post_id, user_id)
);

-- Index for fast user bookmark lookups
CREATE INDEX IF NOT EXISTS idx_show_bookmarks_user ON show_bookmarks(user_id, created_at DESC);
