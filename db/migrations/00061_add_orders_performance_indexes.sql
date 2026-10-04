-- Migration 00061: Add orders performance indexes for admin analytics and list ordering
CREATE INDEX IF NOT EXISTS idx_orders_created_at_desc ON orders (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_analytics_status ON orders (payment_status, checkout_channel) WHERE (deleted_at IS NULL);
