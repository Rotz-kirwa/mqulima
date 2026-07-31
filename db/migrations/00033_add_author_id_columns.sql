-- Migration: Add author_id column & auto-sync triggers for community & activity tables
ALTER TABLE show_posts ADD COLUMN IF NOT EXISTS author_id UUID;
ALTER TABLE show_comments ADD COLUMN IF NOT EXISTS author_id UUID;
ALTER TABLE show_likes ADD COLUMN IF NOT EXISTS author_id UUID;
ALTER TABLE show_bookmarks ADD COLUMN IF NOT EXISTS author_id UUID;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS author_id UUID;
ALTER TABLE direct_messages ADD COLUMN IF NOT EXISTS author_id UUID;
ALTER TABLE product_reviews ADD COLUMN IF NOT EXISTS author_id UUID;
ALTER TABLE moderation_reports ADD COLUMN IF NOT EXISTS author_id UUID;
ALTER TABLE crop_diagnoses ADD COLUMN IF NOT EXISTS author_id UUID;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS author_id UUID;
ALTER TABLE service_requests ADD COLUMN IF NOT EXISTS author_id UUID;

-- Function to keep author_id and user_id in sync
CREATE OR REPLACE FUNCTION sync_user_id_author_id()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.author_id IS NULL AND NEW.user_id IS NOT NULL THEN
    NEW.author_id := NEW.user_id;
  ELSIF NEW.user_id IS NULL AND NEW.author_id IS NOT NULL THEN
    NEW.user_id := NEW.author_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply sync triggers
DROP TRIGGER IF EXISTS trg_sync_author_id_show_posts ON show_posts;
CREATE TRIGGER trg_sync_author_id_show_posts
BEFORE INSERT OR UPDATE ON show_posts
FOR EACH ROW EXECUTE FUNCTION sync_user_id_author_id();

DROP TRIGGER IF EXISTS trg_sync_author_id_show_comments ON show_comments;
CREATE TRIGGER trg_sync_author_id_show_comments
BEFORE INSERT OR UPDATE ON show_comments
FOR EACH ROW EXECUTE FUNCTION sync_user_id_author_id();

DROP TRIGGER IF EXISTS trg_sync_author_id_show_likes ON show_likes;
CREATE TRIGGER trg_sync_author_id_show_likes
BEFORE INSERT OR UPDATE ON show_likes
FOR EACH ROW EXECUTE FUNCTION sync_user_id_author_id();

DROP TRIGGER IF EXISTS trg_sync_author_id_show_bookmarks ON show_bookmarks;
CREATE TRIGGER trg_sync_author_id_show_bookmarks
BEFORE INSERT OR UPDATE ON show_bookmarks
FOR EACH ROW EXECUTE FUNCTION sync_user_id_author_id();

DROP TRIGGER IF EXISTS trg_sync_author_id_messages ON messages;
CREATE TRIGGER trg_sync_author_id_messages
BEFORE INSERT OR UPDATE ON messages
FOR EACH ROW EXECUTE FUNCTION sync_user_id_author_id();

DROP TRIGGER IF EXISTS trg_sync_author_id_direct_messages ON direct_messages;
CREATE TRIGGER trg_sync_author_id_direct_messages
BEFORE INSERT OR UPDATE ON direct_messages
FOR EACH ROW EXECUTE FUNCTION sync_user_id_author_id();

DROP TRIGGER IF EXISTS trg_sync_author_id_product_reviews ON product_reviews;
CREATE TRIGGER trg_sync_author_id_product_reviews
BEFORE INSERT OR UPDATE ON product_reviews
FOR EACH ROW EXECUTE FUNCTION sync_user_id_author_id();

DROP TRIGGER IF EXISTS trg_sync_author_id_moderation_reports ON moderation_reports;
CREATE TRIGGER trg_sync_author_id_moderation_reports
BEFORE INSERT OR UPDATE ON moderation_reports
FOR EACH ROW EXECUTE FUNCTION sync_user_id_author_id();
