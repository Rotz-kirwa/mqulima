-- Migration: Create farmer_followers, farmer_following, farmer_activities, and farmer_badges tables
CREATE TABLE IF NOT EXISTS farmer_followers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  farmer_id UUID,
  follower_id UUID,
  user_id UUID,
  author_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE OR REPLACE VIEW user_followers AS SELECT * FROM farmer_followers;
CREATE OR REPLACE VIEW followers AS SELECT * FROM farmer_followers;

CREATE TABLE IF NOT EXISTS farmer_following (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  farmer_id UUID,
  following_id UUID,
  user_id UUID,
  author_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE OR REPLACE VIEW user_following AS SELECT * FROM farmer_following;

CREATE TABLE IF NOT EXISTS farmer_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  farmer_id UUID,
  user_id UUID,
  author_id UUID,
  activity_type VARCHAR(100),
  details JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS farmer_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  farmer_id UUID,
  user_id UUID,
  badge_name VARCHAR(100),
  awarded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE OR REPLACE VIEW user_badges AS SELECT * FROM farmer_badges;

CREATE TABLE IF NOT EXISTS user_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  action VARCHAR(100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
