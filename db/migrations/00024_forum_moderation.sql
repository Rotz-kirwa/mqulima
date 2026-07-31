-- ============================================================================
-- 00024_forum_moderation.sql
-- ============================================================================

-- 1. Alter show_posts and show_comments
ALTER TABLE show_posts ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'published' CHECK (status IN ('published', 'pending', 'hidden', 'flagged', 'deleted', 'archived'));
ALTER TABLE show_posts ADD COLUMN IF NOT EXISTS views_count INT DEFAULT 0;
ALTER TABLE show_posts ADD COLUMN IF NOT EXISTS reports_count INT DEFAULT 0;

ALTER TABLE show_comments ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'published' CHECK (status IN ('published', 'pending', 'hidden', 'flagged', 'deleted'));
ALTER TABLE show_comments ADD COLUMN IF NOT EXISTS reports_count INT DEFAULT 0;

-- 2. Alter profiles to support moderation status
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS restriction_status TEXT NOT NULL DEFAULT 'active' CHECK (restriction_status IN ('active', 'warning', 'restricted', 'suspended', 'banned'));

-- 3. Create forum_reports table
CREATE TABLE IF NOT EXISTS forum_reports (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id   UUID REFERENCES profiles(id) ON DELETE SET NULL,
  content_type  TEXT NOT NULL CHECK (content_type IN ('post', 'comment', 'profile', 'message')),
  content_id    UUID NOT NULL,
  reason        TEXT NOT NULL CHECK (reason IN ('spam', 'harassment', 'false_information', 'scam', 'inappropriate_content', 'violence', 'copyright', 'other')),
  status        TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'dismissed', 'resolved')),
  details       TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Create moderation_actions table (Audit Logs)
CREATE TABLE IF NOT EXISTS moderation_actions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id        UUID REFERENCES profiles(id) ON DELETE SET NULL,
  action          TEXT NOT NULL,
  content_type    TEXT NOT NULL,
  content_id      UUID NOT NULL,
  previous_status TEXT,
  new_status      TEXT,
  details         TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Create user_restrictions table
CREATE TABLE IF NOT EXISTS user_restrictions (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  restriction_type  TEXT NOT NULL CHECK (restriction_type IN ('warning', 'restricted', 'suspended', 'banned')),
  expires_at        TIMESTAMPTZ,
  reason            TEXT NOT NULL,
  created_by        UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. Create moderation_settings table
CREATE TABLE IF NOT EXISTS moderation_settings (
  id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  spam_detection_enabled      BOOLEAN DEFAULT TRUE,
  repeated_posts_window_mins  INT DEFAULT 5,
  block_external_links        BOOLEAN DEFAULT FALSE,
  offensive_words_list        TEXT[] DEFAULT '{}',
  auto_flag_report_threshold  INT DEFAULT 3,
  updated_at                  TIMESTAMPTZ DEFAULT NOW()
);

-- Seed moderation settings
INSERT INTO moderation_settings (spam_detection_enabled, repeated_posts_window_mins, block_external_links, offensive_words_list, auto_flag_report_threshold)
VALUES (TRUE, 5, FALSE, ARRAY['scam', 'fake', 'hacked', 'weed', 'casino', 'betting'], 3)
ON CONFLICT DO NOTHING;
