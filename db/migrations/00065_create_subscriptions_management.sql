-- Migration: 00065_create_subscriptions_management.sql
-- Description: Centralized Subscription Management System for Mqulima Platform
-- Covers Academy, Newsletters, Market Alerts, Weather Forecasts, Community, AI Services, Marketplace/Business

CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  email TEXT NOT NULL,
  full_name TEXT,
  phone TEXT,
  category VARCHAR(50) NOT NULL,
  service_name VARCHAR(255) NOT NULL,
  plan_code VARCHAR(100) DEFAULT 'standard',
  subscription_type VARCHAR(50) NOT NULL DEFAULT 'free',
  status VARCHAR(50) NOT NULL DEFAULT 'active',
  billing_cycle VARCHAR(50) DEFAULT 'none',
  price_kes NUMERIC(10,2) NOT NULL DEFAULT 0.00,
  currency VARCHAR(10) NOT NULL DEFAULT 'KES',
  payment_method VARCHAR(50) DEFAULT 'none',
  payment_reference VARCHAR(255),
  payment_status VARCHAR(50) NOT NULL DEFAULT 'unpaid',
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  next_billing_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_subscriptions_email_service UNIQUE (email, category, service_name)
);

CREATE TABLE IF NOT EXISTS subscription_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id UUID NOT NULL REFERENCES subscriptions(id) ON DELETE CASCADE,
  event_type VARCHAR(50) NOT NULL,
  actor_type VARCHAR(50) NOT NULL DEFAULT 'system',
  actor_email VARCHAR(255),
  previous_status VARCHAR(50),
  new_status VARCHAR(50),
  notes TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Performance & Query Indexes
CREATE INDEX IF NOT EXISTS idx_subscriptions_email ON subscriptions (email);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions (user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_category ON subscriptions (category);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions (status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_cat_status ON subscriptions (category, status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_started_at ON subscriptions (started_at DESC);
CREATE INDEX IF NOT EXISTS idx_sub_events_sub_id_created ON subscription_events (subscription_id, created_at DESC);

-- Backfill from newsletter_subscribers
INSERT INTO subscriptions (
  user_id,
  email,
  full_name,
  category,
  service_name,
  plan_code,
  subscription_type,
  status,
  billing_cycle,
  price_kes,
  payment_status,
  started_at
)
SELECT 
  ns.user_id,
  LOWER(TRIM(ns.email)),
  COALESCE(u.first_name || ' ' || u.last_name, 'Agritech Subscriber'),
  'news',
  'Weekly Agritech Digest & Intelligence Bulletin',
  'newsletter_free',
  'free',
  COALESCE(ns.status, 'active'),
  'none',
  0.00,
  'unpaid',
  COALESCE(ns.subscribed_at, NOW())
FROM newsletter_subscribers ns
LEFT JOIN users u ON u.id = ns.user_id OR LOWER(u.email) = LOWER(ns.email)
ON CONFLICT (email, category, service_name) DO NOTHING;

-- Log backfill event in subscription_events
INSERT INTO subscription_events (
  subscription_id,
  event_type,
  actor_type,
  actor_email,
  previous_status,
  new_status,
  notes
)
SELECT 
  s.id,
  'created',
  'system',
  'system@mqulima.com',
  NULL,
  s.status,
  'Initial backfill from newsletter_subscribers'
FROM subscriptions s
WHERE s.category = 'news'
ON CONFLICT DO NOTHING;
