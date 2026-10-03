-- Migration: 00058_performance_indexes_news_and_forum.sql
-- Description: Composite and functional performance indexes for agritech_news and show_posts feeds

-- 1. Agritech News Feed Indexes
CREATE INDEX IF NOT EXISTS idx_agritech_news_status_pub 
ON agritech_news (status, published_at DESC NULLS LAST, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_agritech_news_slug 
ON agritech_news (slug);

CREATE INDEX IF NOT EXISTS idx_agritech_news_category 
ON agritech_news (category);

-- 2. Forum Show Posts Feed Indexes
CREATE INDEX IF NOT EXISTS idx_show_posts_status_created 
ON show_posts (status, created_at DESC) 
WHERE (deleted_at IS NULL);

CREATE INDEX IF NOT EXISTS idx_show_posts_created_at 
ON show_posts (created_at DESC);

-- 3. Show Likes User Index (fast user_id lookup)
CREATE INDEX IF NOT EXISTS idx_show_likes_user_id 
ON show_likes (user_id);

-- 4. Show Comments Batch Lookup Index
CREATE INDEX IF NOT EXISTS idx_show_comments_post_status_created 
ON show_comments (post_id, status, created_at ASC);

-- 5. Pulse Posts Feed Index
CREATE INDEX IF NOT EXISTS idx_pulse_posts_published 
ON pulse_posts (published_at DESC NULLS LAST);

-- 6. Commodity Listings Active Feed Index
CREATE INDEX IF NOT EXISTS idx_commodity_listings_status_created 
ON commodity_listings (status, created_at DESC);
