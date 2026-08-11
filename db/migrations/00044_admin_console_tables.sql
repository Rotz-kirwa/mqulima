-- Migration 00044: Create Mqulima Admin Console Tables

CREATE TABLE IF NOT EXISTS admin_audit_logs (
  id VARCHAR(255) PRIMARY KEY,
  actor_id VARCHAR(255) NOT NULL,
  action VARCHAR(100) NOT NULL,
  entity VARCHAR(100) NOT NULL,
  entity_id VARCHAR(255),
  diff JSONB,
  ip_address VARCHAR(45),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS quotations (
  id VARCHAR(255) PRIMARY KEY,
  customer_id VARCHAR(255) NOT NULL,
  title VARCHAR(255) NOT NULL,
  items_json JSONB NOT NULL,
  total_amount_ksh REAL NOT NULL,
  status VARCHAR(50) DEFAULT 'pending' NOT NULL,
  valid_until TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS logistics_records (
  id VARCHAR(255) PRIMARY KEY,
  order_id VARCHAR(255) NOT NULL,
  courier_name VARCHAR(255) NOT NULL,
  zone VARCHAR(100) NOT NULL,
  dispatch_status VARCHAR(50) DEFAULT 'pending' NOT NULL,
  tracking_number VARCHAR(100),
  proof_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS featured_items (
  id VARCHAR(255) PRIMARY KEY,
  entity_type VARCHAR(50) NOT NULL,
  entity_id VARCHAR(255) NOT NULL,
  position INTEGER DEFAULT 0 NOT NULL,
  active_from TIMESTAMP WITH TIME ZONE,
  active_to TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS market_price_overrides (
  id VARCHAR(255) PRIMARY KEY,
  commodity_name VARCHAR(100) NOT NULL,
  official_price_ksh REAL NOT NULL,
  admin_override_price_ksh REAL,
  unit VARCHAR(50) DEFAULT '90kg' NOT NULL,
  notes TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS ai_query_logs (
  id VARCHAR(255) PRIMARY KEY,
  user_id VARCHAR(255),
  prompt TEXT NOT NULL,
  confidence_score REAL DEFAULT 0.95,
  flagged_for_review BOOLEAN DEFAULT FALSE NOT NULL,
  token_count INTEGER DEFAULT 0,
  cost_usd REAL DEFAULT 0.0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS agritech_news (
  id VARCHAR(255) PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL,
  summary TEXT,
  content TEXT NOT NULL,
  category VARCHAR(100) DEFAULT 'Agri-News' NOT NULL,
  source_attribution VARCHAR(255),
  author_id VARCHAR(255),
  status VARCHAR(50) DEFAULT 'draft' NOT NULL,
  published_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);
