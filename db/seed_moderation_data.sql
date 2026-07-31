-- Seed Forum Moderation data (Clean initialization)
-- Note: Mock reports and restrictions have been purged.

DO $$
BEGIN
  -- Clear any existing moderation table data
  DELETE FROM forum_reports;
  DELETE FROM moderation_actions;
  DELETE FROM user_restrictions;
  
  -- Ensure all profiles start active
  UPDATE profiles SET restriction_status = 'active' WHERE restriction_status IS NULL;

  RAISE NOTICE 'Forum moderation tables initialized cleanly.';
END $$;
