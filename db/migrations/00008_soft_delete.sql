ALTER TABLE products ADD COLUMN deleted_at TIMESTAMPTZ;
CREATE INDEX idx_products_not_deleted ON products(id) WHERE deleted_at IS NULL;

ALTER TABLE orders ADD COLUMN deleted_at TIMESTAMPTZ;
CREATE INDEX idx_orders_not_deleted ON orders(id) WHERE deleted_at IS NULL;

ALTER TABLE profiles ADD COLUMN deleted_at TIMESTAMPTZ;
CREATE INDEX idx_profiles_not_deleted ON profiles(id) WHERE deleted_at IS NULL;
