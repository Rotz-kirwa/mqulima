-- Migration: Add participant1_id & participant2_id columns and triggers for conversations & messaging
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS participant1_id UUID;
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS participant2_id UUID;
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS user_id UUID;

ALTER TABLE ai_conversations ADD COLUMN IF NOT EXISTS participant1_id UUID;
ALTER TABLE ai_conversations ADD COLUMN IF NOT EXISTS participant2_id UUID;

ALTER TABLE messages ADD COLUMN IF NOT EXISTS participant1_id UUID;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS participant2_id UUID;

ALTER TABLE direct_messages ADD COLUMN IF NOT EXISTS participant1_id UUID;
ALTER TABLE direct_messages ADD COLUMN IF NOT EXISTS participant2_id UUID;

-- Populate participant1_id and participant2_id from existing participant_ids array
UPDATE conversations 
SET 
  participant1_id = participant_ids[1]::uuid,
  participant2_id = participant_ids[2]::uuid
WHERE participant_ids IS NOT NULL AND array_length(participant_ids, 1) >= 1;

-- Function to keep participant1_id/participant2_id and participant_ids in sync
CREATE OR REPLACE FUNCTION sync_conversation_participants()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.participant_ids IS NOT NULL AND array_length(NEW.participant_ids, 1) >= 1 THEN
    IF NEW.participant1_id IS NULL THEN
      NEW.participant1_id := NEW.participant_ids[1];
    END IF;
    IF NEW.participant2_id IS NULL AND array_length(NEW.participant_ids, 1) >= 2 THEN
      NEW.participant2_id := NEW.participant_ids[2];
    END IF;
  ELSIF NEW.participant1_id IS NOT NULL THEN
    IF NEW.participant2_id IS NOT NULL THEN
      NEW.participant_ids := ARRAY[NEW.participant1_id, NEW.participant2_id];
    ELSE
      NEW.participant_ids := ARRAY[NEW.participant1_id];
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger
DROP TRIGGER IF EXISTS trg_sync_participants ON conversations;
CREATE TRIGGER trg_sync_participants
BEFORE INSERT OR UPDATE ON conversations
FOR EACH ROW EXECUTE FUNCTION sync_conversation_participants();
