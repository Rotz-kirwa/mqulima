-- Migration: 00055_unique_constraints_and_indexes.sql
-- Description: Enforce unique constraint on farmer_followers and create composite performance indexes

-- 1. Deduplicate farmer_followers if any existed and create unique index
DELETE FROM farmer_followers a USING farmer_followers b
WHERE a.id > b.id 
  AND a.farmer_id = b.farmer_id 
  AND a.follower_id = b.follower_id;

CREATE UNIQUE INDEX IF NOT EXISTS farmer_followers_farmer_follower_uidx 
ON farmer_followers(farmer_id, follower_id);

-- 2. Ensure show_likes unique constraint / index exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'show_likes_post_id_user_id_key'
  ) AND NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE indexname = 'show_likes_post_id_user_id_key'
  ) THEN
    CREATE UNIQUE INDEX IF NOT EXISTS show_likes_post_id_user_id_key ON show_likes(post_id, user_id);
  END IF;
END $$;

-- 3. Composite performance index on orders(user_id, created_at DESC)
CREATE INDEX IF NOT EXISTS idx_orders_user_created_at 
ON orders(user_id, created_at DESC);

-- 4. Composite performance index on service_requests(user_id, status)
CREATE INDEX IF NOT EXISTS idx_service_requests_user_status 
ON service_requests(user_id, status);
