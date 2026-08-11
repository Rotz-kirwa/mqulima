-- Migration 00041: Production Performance Indexes, Schema Patches, Soft Deletes, and Idempotent Seeds
-- Description: Consolidate runtime auto-patch DDL into explicit version-controlled migration with scaling indexes.

-- 1. Ensure all profiles columns exist
ALTER TABLE profiles 
  ADD COLUMN IF NOT EXISTS bio TEXT,
  ADD COLUMN IF NOT EXISTS website TEXT,
  ADD COLUMN IF NOT EXISTS cover_image TEXT,
  ADD COLUMN IF NOT EXISTS farming_activities TEXT,
  ADD COLUMN IF NOT EXISTS farming_photos TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;

-- 2. Ensure all service_requests columns exist
ALTER TABLE service_requests
  ADD COLUMN IF NOT EXISTS reference TEXT,
  ADD COLUMN IF NOT EXISTS contact_name TEXT,
  ADD COLUMN IF NOT EXISTS contact_phone TEXT,
  ADD COLUMN IF NOT EXISTS subservice_name TEXT,
  ADD COLUMN IF NOT EXISTS farm_scale TEXT,
  ADD COLUMN IF NOT EXISTS channel TEXT DEFAULT 'website',
  ADD COLUMN IF NOT EXISTS estimated_cost NUMERIC(12,2);

-- 3. Add soft delete columns where missing
ALTER TABLE users ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;
ALTER TABLE products ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;
ALTER TABLE commodity_listings ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;
ALTER TABLE show_posts ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;
ALTER TABLE ai_conversations ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;

-- 4. Scale Indexes: Users & Profiles
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON profiles(id);
CREATE INDEX IF NOT EXISTS idx_users_county ON users(county) WHERE county IS NOT NULL;

-- 5. Scale Indexes: Products, Orders, & Payments
CREATE INDEX IF NOT EXISTS idx_products_category_status ON products(category_id, status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_products_county_status ON products(county, status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_orders_user_status ON orders(user_id, status, created_at DESC) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_payments_order_provider ON payments(order_id, provider, status);

-- 6. Scale Indexes: Soko Produce Marketplace
CREATE INDEX IF NOT EXISTS idx_soko_listings_user_status ON commodity_listings(user_id, status, created_at DESC) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_soko_commodity_location ON commodity_listings(commodity_id, location) WHERE deleted_at IS NULL;

-- 7. Scale Indexes: Community Forum & Messaging
CREATE INDEX IF NOT EXISTS idx_show_posts_user_created ON show_posts(user_id, created_at DESC) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_show_comments_post_id ON show_comments(post_id, created_at ASC);
CREATE INDEX IF NOT EXISTS idx_direct_messages_participants ON direct_messages(sender_id, receiver_id, created_at DESC);

-- 8. Scale Indexes: AI Doctor & Conversations
CREATE INDEX IF NOT EXISTS idx_ai_conversations_user_updated ON ai_conversations(user_id, is_pinned DESC, updated_at DESC) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_ai_messages_conv_created ON ai_messages(conversation_id, created_at ASC);
CREATE INDEX IF NOT EXISTS idx_crop_diagnoses_user_created ON crop_diagnoses(user_id, created_at DESC);

-- 9. Idempotent Featured Products Seed
INSERT INTO products (name, slug, description, base_price, original_price, stock_qty, is_featured, avg_rating, rating_count, status, brand, seller, county, unit, badge, organic, verified_seller, seller_score, condition, shop_type, field, subcategory, image_urls)
VALUES
  (
    'Premium NPK 20:20:20 Fertilizer',
    'premium-npk-20-20-20-fertilizer',
    'High-purity water-soluble NPK 20:20:20 balanced fertilizer designed to boost plant growth, flowering, and root health.',
    3200.00, 3600.00, 250, TRUE, 4.9, 32, 'active', 'Yara', 'Mculima Supplies', 'Nairobi', '50kg bag', 'Bestseller', FALSE, TRUE, 98, 'New', 'Agrovet', 'Fertilizers', 'Planting',
    ARRAY['https://i.pinimg.com/1200x/30/51/f4/3051f4e634474dad5df2920d1b7e763a.jpg']
  ),
  (
    'Lambda-Cyhalothrin 10EC Insecticide',
    'lambda-cyhalothrin-10ec-insecticide',
    'Fast-acting synthetic pyrethroid insecticide for controlling caterpillars, aphids, thrips, and beetles on crops.',
    1450.00, 1600.00, 180, TRUE, 4.8, 27, 'active', 'Pomais', 'AgroChem Supplies', 'Nairobi', '1L bottle', 'Best Seller', FALSE, TRUE, 96, 'New', 'Agrovet', 'Crop Protection', 'Insecticides',
    ARRAY['https://www.pomais.com/wp-content/uploads/2024/12/Lambda-cyhalothrin10EC-.webp']
  ),
  (
    'Seaweed Organic Growth Booster',
    'seaweed-organic-growth-booster',
    '100% natural cold-pressed seaweed extract biostimulant. Enhances root expansion, stress tolerance, and crop yields.',
    2100.00, 2400.00, 140, TRUE, 4.9, 41, 'active', 'BioGrow', 'Organic Farm Solutions', 'Nakuru', '1L bottle', 'Organic', TRUE, TRUE, 99, 'Certified Organic', 'Agrovet', 'Plant Growth & Boosters', 'Biostimulants',
    ARRAY['https://i.pinimg.com/736x/b4/9e/55/b49e55253e882f51514c8a028dda76bd.jpg']
  ),
  (
    '20L Heavy Duty Knapsack Sprayer',
    '20l-heavy-duty-knapsack-sprayer',
    'Ergonomic 20-litre manual knapsack sprayer with heavy-duty pump handle, brass lance, and multi-pattern nozzles.',
    4800.00, 5200.00, 65, TRUE, 4.7, 19, 'active', 'Harvester Tools', 'Equipment Direct', 'Nairobi', '1 unit', 'Hot Deal', FALSE, TRUE, 94, 'New', 'Agrovet', 'Farm Equipment', 'Machinery',
    ARRAY['https://i.pinimg.com/1200x/74/d7/66/74d766c45e79615e4028f5d86cb1a63d.jpg']
  ),
  (
    'Duduthrin Broad-Spectrum Insecticide',
    'duduthrin-broad-spectrum-insecticide',
    'Broad-spectrum EC insecticide formulation effective against cutworms, armyworms, whiteflies, and diamondback moths.',
    1200.00, 1350.00, 95, TRUE, 4.8, 22, 'active', 'Twiga Chemical', 'Twiga Agrovet', 'Kiambu', '500ml', 'Popular', FALSE, TRUE, 97, 'New', 'Agrovet', 'Crop Protection', 'Insecticides',
    ARRAY['https://i.pinimg.com/736x/e6/29/38/e62938172d5b057b027f3de816b373e2.jpg']
  ),
  (
    'High-Yield Layer Chicken Feed',
    'high-yield-layer-chicken-feed',
    'Nutrient-balanced complete laying mash formulated with essential calcium, amino acids, and energy for maximum egg output.',
    3250.00, 3500.00, 310, TRUE, 4.9, 38, 'active', 'Unga Feeds', 'Unga Farmcare', 'Nakuru', '70kg bag', 'Top Feed', FALSE, TRUE, 98, 'Fresh', 'Agrovet', 'Animal Farming', 'Animal Feed',
    ARRAY['https://www.myagrovet.co.ke/images/products/7367/thumb_44e1a1ca768bb3add788ec4afd3b0a57.png']
  )
ON CONFLICT (slug) DO NOTHING;
