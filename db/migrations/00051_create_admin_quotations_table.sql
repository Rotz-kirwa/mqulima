-- Migration 00051: Create Admin Quotations Table to resolve schema collision with core quotations table

CREATE TABLE IF NOT EXISTS admin_quotations (
  id VARCHAR(255) PRIMARY KEY,
  customer_id VARCHAR(255) NOT NULL,
  title VARCHAR(255) NOT NULL,
  items_json JSONB NOT NULL,
  total_amount_ksh REAL NOT NULL,
  status VARCHAR(50) DEFAULT 'pending' NOT NULL,
  valid_until TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);
