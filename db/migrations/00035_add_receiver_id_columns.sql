-- Migration: Add receiver_id column & auto-sync triggers for messaging & notification tables
ALTER TABLE direct_messages ADD COLUMN IF NOT EXISTS receiver_id UUID;
ALTER TABLE direct_messages ADD COLUMN IF NOT EXISTS recipient_id UUID;
ALTER TABLE direct_messages ADD COLUMN IF NOT EXISTS user_id UUID;

ALTER TABLE messages ADD COLUMN IF NOT EXISTS receiver_id UUID;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS recipient_id UUID;

ALTER TABLE notifications ADD COLUMN IF NOT EXISTS receiver_id UUID;
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS recipient_id UUID;

ALTER TABLE moderation_reports ADD COLUMN IF NOT EXISTS receiver_id UUID;
ALTER TABLE moderation_reports ADD COLUMN IF NOT EXISTS recipient_id UUID;

-- Safe sync function for user_id and author_id
CREATE OR REPLACE FUNCTION sync_user_id_author_id()
RETURNS TRIGGER AS $$
BEGIN
  BEGIN
    IF NEW.author_id IS NULL AND NEW.user_id IS NOT NULL THEN
      NEW.author_id := NEW.user_id;
    ELSIF NEW.user_id IS NULL AND NEW.author_id IS NOT NULL THEN
      NEW.user_id := NEW.author_id;
    END IF;
  EXCEPTION WHEN undefined_column THEN
    -- Table doesn't have one of the columns, ignore
  END;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Safe sync function for receiver_id and recipient_id
CREATE OR REPLACE FUNCTION sync_receiver_and_recipient_id()
RETURNS TRIGGER AS $$
BEGIN
  BEGIN
    IF NEW.receiver_id IS NULL AND NEW.recipient_id IS NOT NULL THEN
      NEW.receiver_id := NEW.recipient_id;
    ELSIF NEW.recipient_id IS NULL AND NEW.receiver_id IS NOT NULL THEN
      NEW.recipient_id := NEW.receiver_id;
    END IF;
  EXCEPTION WHEN undefined_column THEN
    -- Table doesn't have one of the columns, ignore
  END;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply sync triggers
DROP TRIGGER IF EXISTS trg_sync_receiver_id_direct_messages ON direct_messages;
CREATE TRIGGER trg_sync_receiver_id_direct_messages
BEFORE INSERT OR UPDATE ON direct_messages
FOR EACH ROW EXECUTE FUNCTION sync_receiver_and_recipient_id();

DROP TRIGGER IF EXISTS trg_sync_receiver_id_messages ON messages;
CREATE TRIGGER trg_sync_receiver_id_messages
BEFORE INSERT OR UPDATE ON messages
FOR EACH ROW EXECUTE FUNCTION sync_receiver_and_recipient_id();

DROP TRIGGER IF EXISTS trg_sync_receiver_id_notifications ON notifications;
CREATE TRIGGER trg_sync_receiver_id_notifications
BEFORE INSERT OR UPDATE ON notifications
FOR EACH ROW EXECUTE FUNCTION sync_receiver_and_recipient_id();

DROP TRIGGER IF EXISTS trg_sync_receiver_id_moderation_reports ON moderation_reports;
CREATE TRIGGER trg_sync_receiver_id_moderation_reports
BEFORE INSERT OR UPDATE ON moderation_reports
FOR EACH ROW EXECUTE FUNCTION sync_receiver_and_recipient_id();
