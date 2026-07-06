-- ============================================================================
-- MQULIMA PLATFORM — COMPLETE DATABASE SCHEMA
-- PostgreSQL 16+ Migration
-- Run: psql -h localhost -p 5433 -U mqulima -d mqulima_dev -f this_file.sql
-- ============================================================================

-- Extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- ENUMS
-- ============================================================================

CREATE TYPE user_role AS ENUM (
  'super_admin', 'admin', 'sales_agent', 'content_editor', 'farmer', 'retailer'
);

CREATE TYPE product_status AS ENUM ('active', 'draft', 'archived');

CREATE TYPE order_status AS ENUM (
  'pending', 'confirmed', 'paid', 'processing', 'shipped', 'delivered', 'cancelled'
);

CREATE TYPE payment_status_enum AS ENUM ('pending', 'paid', 'failed', 'refunded');

CREATE TYPE payment_method_enum AS ENUM (
  'mpesa', 'airtel_money', 'bank_transfer', 'card', 'gpay', 'international'
);

CREATE TYPE checkout_channel AS ENUM ('website', 'whatsapp');

CREATE TYPE quotation_status AS ENUM ('pending', 'sent', 'accepted', 'expired');

CREATE TYPE service_request_status AS ENUM (
  'requested', 'assigned', 'in_progress', 'completed', 'cancelled'
);

CREATE TYPE service_price_type AS ENUM ('fixed', 'quote', 'poa');

CREATE TYPE blog_status AS ENUM ('draft', 'published', 'archived');

CREATE TYPE show_post_type AS ENUM ('harvest', 'story', 'tragedy', 'learning', 'moment');

CREATE TYPE listing_status AS ENUM ('active', 'sold', 'expired');

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 1. USERS & PROFILES
-- ============================================================================

CREATE TABLE profiles (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email         TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  full_name     TEXT NOT NULL,
  username      TEXT UNIQUE NOT NULL CHECK (username ~ '^mqulima_'),
  country       TEXT NOT NULL DEFAULT 'Kenya',
  county_region TEXT,
  farming_interests TEXT[] DEFAULT '{}',
  crops         TEXT[] DEFAULT '{}',
  livestock     TEXT[] DEFAULT '{}',
  years_farming INT DEFAULT 0,
  certifications TEXT[] DEFAULT '{}',
  reputation_score INT DEFAULT 0,
  followers_count INT DEFAULT 0,
  role          user_role NOT NULL DEFAULT 'farmer',
  avatar_url    TEXT,
  phone         TEXT,
  id_number     TEXT,
  delivery_address TEXT,
  nature_of_agriculture TEXT,
  is_retailer   BOOLEAN DEFAULT FALSE,
  retailer_discount_pct NUMERIC(5,2) DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE INDEX idx_profiles_role ON profiles(role);
CREATE INDEX idx_profiles_username ON profiles(username);
CREATE INDEX idx_profiles_email ON profiles(email);

-- ============================================================================
-- 2. PRODUCTS / SHOP
-- ============================================================================

CREATE TABLE product_categories (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name              TEXT NOT NULL,
  slug              TEXT UNIQUE NOT NULL,
  parent_category_id UUID REFERENCES product_categories(id) ON DELETE SET NULL,
  pos_category_ref  TEXT,
  icon              TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER product_categories_updated_at
  BEFORE UPDATE ON product_categories
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TABLE products (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT NOT NULL,
  slug          TEXT UNIQUE NOT NULL,
  category_id   UUID REFERENCES product_categories(id) ON DELETE SET NULL,
  description   TEXT,
  base_price    NUMERIC(12,2) NOT NULL DEFAULT 0,
  original_price NUMERIC(12,2),
  image_urls    TEXT[] DEFAULT '{}',
  stock_qty     INT NOT NULL DEFAULT 0,
  is_featured   BOOLEAN DEFAULT FALSE,
  avg_rating    NUMERIC(3,2) DEFAULT 0,
  rating_count  INT DEFAULT 0,
  status        product_status NOT NULL DEFAULT 'draft',
  brand         TEXT,
  seller        TEXT,
  county        TEXT,
  unit          TEXT,
  badge         TEXT,
  organic       BOOLEAN DEFAULT FALSE,
  verified_seller BOOLEAN DEFAULT FALSE,
  seller_score  INT DEFAULT 0,
  condition     TEXT,
  shop_type     TEXT,
  field         TEXT,
  subcategory   TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE INDEX idx_products_category ON products(category_id, status);
CREATE INDEX idx_products_status ON products(status);
CREATE INDEX idx_products_featured ON products(is_featured) WHERE is_featured = TRUE;

CREATE TABLE product_variants (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id    UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  variant_label TEXT NOT NULL,
  price         NUMERIC(12,2) NOT NULL,
  original_price NUMERIC(12,2),
  stock_qty     INT NOT NULL DEFAULT 0,
  sku           TEXT UNIQUE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER product_variants_updated_at
  BEFORE UPDATE ON product_variants
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TABLE product_reviews (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id  UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  rating      INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment     TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(product_id, user_id)
);

-- ============================================================================
-- 3. QUOTATIONS & ORDERS
-- ============================================================================

CREATE TABLE quotations (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  items           JSONB NOT NULL DEFAULT '[]',
  status          quotation_status NOT NULL DEFAULT 'pending',
  pdf_url         TEXT,
  sales_agent_id  UUID REFERENCES profiles(id) ON DELETE SET NULL,
  valid_until     TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER quotations_updated_at
  BEFORE UPDATE ON quotations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TABLE proforma_invoices (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quotation_id    UUID NOT NULL REFERENCES quotations(id) ON DELETE CASCADE,
  invoice_number  TEXT UNIQUE NOT NULL,
  items           JSONB NOT NULL DEFAULT '[]',
  total           NUMERIC(12,2) NOT NULL DEFAULT 0,
  pdf_url         TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE orders (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  items             JSONB NOT NULL DEFAULT '[]',
  subtotal          NUMERIC(12,2) NOT NULL DEFAULT 0,
  total             NUMERIC(12,2) NOT NULL DEFAULT 0,
  status            order_status NOT NULL DEFAULT 'pending',
  payment_method    payment_method_enum,
  payment_status    payment_status_enum NOT NULL DEFAULT 'pending',
  delivery_address  TEXT,
  checkout_channel  checkout_channel DEFAULT 'website',
  sales_agent_id    UUID REFERENCES profiles(id) ON DELETE SET NULL,
  notes             TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE INDEX idx_orders_user ON orders(user_id, status);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_payment ON orders(payment_status);

CREATE TABLE payments (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id      UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  provider      TEXT NOT NULL,
  provider_ref  TEXT,
  amount        NUMERIC(12,2) NOT NULL,
  status        payment_status_enum NOT NULL DEFAULT 'pending',
  raw_payload   JSONB,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE stock_recommendations (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  product_name_suggested TEXT NOT NULL,
  category              TEXT,
  notes                 TEXT,
  status                TEXT DEFAULT 'pending',
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- 4. SERVICES
-- ============================================================================

CREATE TABLE service_categories (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  slug        TEXT UNIQUE NOT NULL,
  description TEXT,
  icon        TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER service_categories_updated_at
  BEFORE UPDATE ON service_categories
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TABLE services (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id   UUID NOT NULL REFERENCES service_categories(id) ON DELETE CASCADE,
  name          TEXT NOT NULL,
  slug          TEXT UNIQUE NOT NULL,
  description   TEXT,
  price_type    service_price_type NOT NULL DEFAULT 'quote',
  base_price    NUMERIC(12,2),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER services_updated_at
  BEFORE UPDATE ON services
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TABLE service_requests (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  service_id        UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  status            service_request_status NOT NULL DEFAULT 'requested',
  assigned_expert_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  notes             TEXT,
  scheduled_date    TIMESTAMPTZ,
  location          TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER service_requests_updated_at
  BEFORE UPDATE ON service_requests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE INDEX idx_service_requests_status ON service_requests(status);

-- ============================================================================
-- 5. BLOG / MQULIMA NEWS
-- ============================================================================

CREATE TABLE blog_authors (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id  UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  bio         TEXT,
  is_active   BOOLEAN DEFAULT TRUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE blog_posts (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id     UUID NOT NULL REFERENCES blog_authors(id) ON DELETE CASCADE,
  title         TEXT NOT NULL,
  slug          TEXT UNIQUE NOT NULL,
  cover_image   TEXT,
  body          TEXT NOT NULL,
  category      TEXT,
  status        blog_status NOT NULL DEFAULT 'draft',
  published_at  TIMESTAMPTZ,
  view_count    INT DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER blog_posts_updated_at
  BEFORE UPDATE ON blog_posts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE INDEX idx_blog_posts_status ON blog_posts(status, published_at DESC);

CREATE TABLE newsletter_subscribers (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email         TEXT UNIQUE NOT NULL,
  user_id       UUID REFERENCES profiles(id) ON DELETE SET NULL,
  subscribed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  status        TEXT DEFAULT 'active'
);

CREATE TABLE newsletter_issues (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title             TEXT NOT NULL,
  compiled_post_ids UUID[] DEFAULT '{}',
  sent_at           TIMESTAMPTZ,
  status            TEXT DEFAULT 'draft',
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- 6. FORUM — MQULIMA SHOW
-- ============================================================================

CREATE TABLE show_posts (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type          show_post_type NOT NULL DEFAULT 'moment',
  title         TEXT,
  caption       TEXT,
  media_urls    TEXT[] DEFAULT '{}',
  like_count    INT DEFAULT 0,
  relate_count  INT DEFAULT 0,
  comment_count INT DEFAULT 0,
  tags          TEXT[] DEFAULT '{}',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER show_posts_updated_at
  BEFORE UPDATE ON show_posts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE INDEX idx_show_posts_user ON show_posts(user_id, created_at DESC);

CREATE TABLE show_comments (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id     UUID NOT NULL REFERENCES show_posts(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  body        TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE show_likes (
  id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id   UUID NOT NULL REFERENCES show_posts(id) ON DELETE CASCADE,
  user_id   UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  UNIQUE(post_id, user_id)
);

-- ============================================================================
-- 7. FORUM — MQULIMA SOKO
-- ============================================================================

CREATE TABLE commodities (
  id    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name  TEXT NOT NULL,
  unit  TEXT NOT NULL DEFAULT 'kg'
);

CREATE TABLE commodity_listings (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  commodity_id  UUID NOT NULL REFERENCES commodities(id) ON DELETE CASCADE,
  quantity      NUMERIC(12,2) NOT NULL,
  asking_price  NUMERIC(12,2) NOT NULL,
  location      TEXT,
  description   TEXT,
  image_urls    TEXT[] DEFAULT '{}',
  status        listing_status NOT NULL DEFAULT 'active',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER commodity_listings_updated_at
  BEFORE UPDATE ON commodity_listings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE INDEX idx_commodity_listings_status ON commodity_listings(commodity_id, status);

CREATE TABLE commodity_price_board (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  commodity_id  UUID NOT NULL REFERENCES commodities(id) ON DELETE CASCADE,
  region        TEXT NOT NULL,
  price         NUMERIC(12,2) NOT NULL,
  recorded_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  source        TEXT
);

-- ============================================================================
-- 8. FORUM — MQULIMA PULSE
-- ============================================================================

CREATE TABLE pulse_posts (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title         TEXT NOT NULL,
  body          TEXT NOT NULL,
  category      TEXT,
  source_url    TEXT NOT NULL,
  published_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- 9. FORUM — MQULIMA KONNEKT
-- ============================================================================

CREATE TABLE conversations (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_ids UUID[] NOT NULL,
  is_group        BOOLEAN DEFAULT FALSE,
  name            TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER conversations_updated_at
  BEFORE UPDATE ON conversations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TABLE messages (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id       UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  body            TEXT NOT NULL,
  media_url       TEXT,
  read_at         TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_messages_conversation ON messages(conversation_id, created_at);

-- ============================================================================
-- 10. ACADEMY (placeholder)
-- ============================================================================

CREATE TABLE courses (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title         TEXT NOT NULL,
  slug          TEXT UNIQUE NOT NULL,
  description   TEXT,
  instructor_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  level         TEXT DEFAULT 'beginner',
  price         NUMERIC(12,2) DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER courses_updated_at
  BEFORE UPDATE ON courses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TABLE course_enrollments (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id     UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  user_id       UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  progress_pct  INT DEFAULT 0 CHECK (progress_pct >= 0 AND progress_pct <= 100),
  completed_at  TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(course_id, user_id)
);

-- ============================================================================
-- 11. SUPPORT TABLES
-- ============================================================================

CREATE TABLE audit_log (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id    UUID REFERENCES profiles(id) ON DELETE SET NULL,
  action      TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id   UUID,
  diff        JSONB,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_audit_log_entity ON audit_log(entity_type, entity_id);
CREATE INDEX idx_audit_log_actor ON audit_log(actor_id, created_at DESC);

CREATE TABLE notifications (
  id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id   UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type      TEXT NOT NULL,
  payload   JSONB NOT NULL DEFAULT '{}',
  read_at   TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_notifications_user ON notifications(user_id, read_at NULLS FIRST);

-- ============================================================================
-- 12. SEED DATA — Admin User + Service Categories
-- ============================================================================

-- Create super admin (password: Admin@2026!)
INSERT INTO profiles (email, password_hash, full_name, username, role, county_region)
VALUES (
  'admin@mqulima.co.ke',
  -- bcrypt hash of 'MqulimaAdminSecurePassword2026!'
  '$2b$10$05A3WPZDgsxp4edD83ej7u1mlpTRfZ0Dv/ICrjPAwBWJg6ZTCLrty',
  'Mqulima Admin',
  'mqulima_admin',
  'super_admin',
  'Nairobi'
);

-- Seed service categories (matches existing frontend data)
INSERT INTO service_categories (name, slug, description, icon) VALUES
  ('Soil Testing & Analysis', 'soil', 'Lab-grade soil analysis with crop-specific fertilizer recommendations', '🧫'),
  ('Veterinary & Animal Health', 'veterinary', 'Expert vets at your farm gate within 24 hours', '🩺'),
  ('Animal Feeds & Nutrition', 'feeds', 'Premium feed formulations and nutritional advisory', '🌾'),
  ('Crop Production', 'crop-production', 'Seed selection, planting calendars, and crop management', '🌱'),
  ('Value Addition', 'value-addition', 'Post-harvest processing, packaging, and market linkage', '⚙️'),
  ('Other Services', 'other', 'Machinery rental, advisory, AI insemination, and more', '🚜');

-- Seed commodities for Soko price board
INSERT INTO commodities (name, unit) VALUES
  ('Dry Maize', '90kg bag'),
  ('Wheat', '90kg bag'),
  ('Shangi Potatoes', '50kg bag'),
  ('Raw Milk', 'litre'),
  ('Avocados (Fuerte)', 'kg'),
  ('French Beans', 'kg'),
  ('Apple Mangoes', 'kg'),
  ('Tea (Green Leaf)', 'kg'),
  ('Dairy Meal', '70kg bag'),
  ('DAP Fertilizer', '50kg bag');

-- ============================================================================
-- DONE
-- ============================================================================
