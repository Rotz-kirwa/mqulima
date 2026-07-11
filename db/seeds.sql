-- ============================================================================
-- MQULIMA PLATFORM — HIGH-QUALITY DEMO SEED DATA
-- Run: PSPASSWORD=mqulima_dev_2026 psql -h localhost -p 5433 -U mqulima -d mqulima_dev -f db/seeds.sql
-- ============================================================================

-- Clean up existing demo data to prevent duplicate key errors and redundancy, preserving user accounts
DELETE FROM show_likes;
DELETE FROM show_comments;
DELETE FROM show_posts;
DELETE FROM commodity_price_board;
DELETE FROM commodity_listings;
DELETE FROM payments;
DELETE FROM orders;
DELETE FROM service_requests;
DELETE FROM services;
DELETE FROM products;
DELETE FROM profiles WHERE email LIKE '%@mqulima.co.ke';

-- 1. Profiles (Farmers, Retailers, Sales Agents)
-- All usernames MUST start with mqulima_
INSERT INTO profiles (email, password_hash, full_name, username, role, county_region, farming_interests, crops, livestock, years_farming, reputation_score, followers_count, phone, is_retailer, retailer_discount_pct)
VALUES
  (
    'john.kipchirchir@mqulima.co.ke',
    '$2b$10$/Ljuf.DOutjezdz1SS7H2.DjIHCIBxo5Zrgnki.6Nw0us9gY745v6',
    'John Kipchirchir',
    'mqulima_kipchirchir',
    'farmer',
    'Uasin Gishu',
    '{"Maize", "Dairy", "Soil Care"}',
    '{"Maize", "Wheat"}',
    '{"Dairy Cows"}',
    12,
    142,
    48,
    '+254711223344',
    FALSE,
    0
  ),
  (
    'mary.wanjiku@mqulima.co.ke',
    '$2b$10$/Ljuf.DOutjezdz1SS7H2.DjIHCIBxo5Zrgnki.6Nw0us9gY745v6',
    'Mary Wanjiku',
    'mqulima_wanjiku',
    'farmer',
    'Nyandarua',
    '{"Horticulture", "Organic Farming", "Value Addition"}',
    '{"Tomatoes", "Potatoes", "Cabbage"}',
    '{"Poultry"}',
    8,
    95,
    32,
    '+254722334455',
    FALSE,
    0
  ),
  (
    'david.kiprono@mqulima.co.ke',
    '$2b$10$/Ljuf.DOutjezdz1SS7H2.DjIHCIBxo5Zrgnki.6Nw0us9gY745v6',
    'David Kiprono',
    'mqulima_kiprono',
    'farmer',
    'Kericho',
    '{"Tea", "Silage Production"}',
    '{"Tea"}',
    '{"Dairy Cows", "Goats"}',
    15,
    210,
    89,
    '+254733445566',
    FALSE,
    0
  ),
  (
    'grace.mutiso@mqulima.co.ke',
    '$2b$10$/Ljuf.DOutjezdz1SS7H2.DjIHCIBxo5Zrgnki.6Nw0us9gY745v6',
    'Grace Mutiso',
    'mqulima_mutiso',
    'farmer',
    'Machakos',
    '{"Poultry", "Drought Resistant Crops", "Irrigation"}',
    '{"Sorghum", "Millet", "Green Grams"}',
    '{"Poultry", "Beekeeping"}',
    6,
    78,
    19,
    '+254744556677',
    FALSE,
    0
  ),
  (
    'peter.mwangi@mqulima.co.ke',
    '$2b$10$/Ljuf.DOutjezdz1SS7H2.DjIHCIBxo5Zrgnki.6Nw0us9gY745v6',
    'Peter Mwangi Agrovet',
    'mqulima_mwangi_retailer',
    'retailer',
    'Nakuru',
    '{"Agrochemicals", "Seeds", "Equipment"}',
    '{}',
    '{}',
    20,
    350,
    215,
    '+254755667788',
    TRUE,
    10.00
  ),
  (
    'samuel.kirwa@mqulima.co.ke',
    '$2b$10$/Ljuf.DOutjezdz1SS7H2.DjIHCIBxo5Zrgnki.6Nw0us9gY745v6',
    'Samuel Kirwa',
    'mqulima_kirwa_agent',
    'sales_agent',
    'Nairobi',
    '{}',
    '{}',
    '{}',
    3,
    5,
    0,
    '+254766778899',
    FALSE,
    0
  );

-- 2. Products (matching some shop products in shop-data.ts)
INSERT INTO products (name, slug, description, base_price, original_price, stock_qty, is_featured, avg_rating, rating_count, status, brand, seller, county, unit, badge, organic, verified_seller, seller_score, condition, shop_type, field, subcategory)
VALUES
  (
    'Mavuno Planting Fertilizer',
    'mavuno-planting-fertilizer',
    'Balanced NPK for maize, beans and vegetables. Boosts root development.',
    3450.00,
    3800.00,
    124,
    TRUE,
    4.8,
    24,
    'active',
    'Mavuno',
    'Mculima Supplies',
    'Nairobi',
    '50kg bag',
    'Bestseller',
    FALSE,
    TRUE,
    95,
    'New',
    'Agrovet',
    'Fertilizers',
    'Planting'
  ),
  (
    'DK 8031 Hybrid Maize Seed',
    'dk-8031-hybrid-maize-seed',
    'Drought-tolerant hybrid, matures in 120 days. Ideal for Rift Valley.',
    680.00,
    750.00,
    312,
    TRUE,
    4.7,
    18,
    'active',
    'Dekalb',
    'Kenya Seed Co.',
    'Uasin Gishu',
    '2kg pack',
    'Certified',
    FALSE,
    TRUE,
    98,
    'New',
    'Agrovet',
    'Seeds',
    'Maize'
  ),
  (
    'Ridomil Gold MZ 68WG',
    'ridomil-gold-mz-68wg',
    'Systemic fungicide for late blight in tomatoes and potatoes.',
    1250.00,
    1400.00,
    88,
    FALSE,
    4.5,
    12,
    'active',
    'Syngenta',
    'CropCare Kenya',
    'Nairobi',
    '1kg',
    'New',
    FALSE,
    TRUE,
    92,
    'New',
    'Agrovet',
    'Pesticides',
    'Fungicide'
  ),
  (
    'Maclick Super Dewormer',
    'maclick-super-dewormer',
    'Broad-spectrum dewormer for cattle, sheep and goats.',
    980.00,
    1100.00,
    56,
    FALSE,
    4.6,
    9,
    'active',
    'Norbrook',
    'Vetcare East Africa',
    'Kiambu',
    '500ml',
    'Popular',
    FALSE,
    TRUE,
    94,
    'New',
    'Agrovet',
    'Livestock',
    'Veterinary'
  ),
  (
    'Knapsack Sprayer 16L',
    'knapsack-sprayer-16l',
    'Heavy-duty manual sprayer with adjustable nozzle and brass lance.',
    4500.00,
    5000.00,
    34,
    TRUE,
    4.3,
    15,
    'active',
    'Cooper',
    'Harvester Tools',
    'Nairobi',
    '1 unit',
    'Bulk -10%',
    FALSE,
    TRUE,
    89,
    'New',
    'Equipment',
    'Sprayers',
    'Manual'
  );

-- 3. Services & Service Requests
-- First get IDs of seeded service categories and service types.
-- Category 'soil'
INSERT INTO services (category_id, name, slug, description, price_type, base_price)
VALUES
  (
    (SELECT id FROM service_categories WHERE slug = 'soil' LIMIT 1),
    'Standard Soil pH & NPK Analysis',
    'soil-ph-npk-analysis',
    'Detailed lab test of soil pH, nitrogen, phosphorus, potassium, and organic matter contents.',
    'fixed',
    2500.00
  ),
  (
    (SELECT id FROM service_categories WHERE slug = 'veterinary' LIMIT 1),
    'Emergency Veterinary Farm Visit',
    'emergency-vet-visit',
    'On-farm diagnostics and emergency veterinary care for dairy cows, sheep, and goats.',
    'quote',
    1500.00
  ),
  (
    (SELECT id FROM service_categories WHERE slug = 'other' LIMIT 1),
    'Mobile Silage Shredding Service',
    'silage-shredding',
    'High-output mobile shredding machine delivered to your farm for silage preparation.',
    'fixed',
    800.00
  );

-- Service Requests
INSERT INTO service_requests (user_id, service_id, status, notes, scheduled_date, location)
VALUES
  (
    (SELECT id FROM profiles WHERE username = 'mqulima_kipchirchir' LIMIT 1),
    (SELECT id FROM services WHERE slug = 'soil-ph-npk-analysis' LIMIT 1),
    'requested',
    'Soil test for 5 acres of maize land ahead of the next planting cycle.',
    NOW() + INTERVAL '3 days',
    'Eldoret, near Annex'
  ),
  (
    (SELECT id FROM profiles WHERE username = 'mqulima_mutiso' LIMIT 1),
    (SELECT id FROM services WHERE slug = 'emergency-vet-visit' LIMIT 1),
    'assigned',
    'One of the dairy cows has a swollen udder and milk drop.',
    NOW() + INTERVAL '1 day',
    'Machakos Town'
  ),
  (
    (SELECT id FROM profiles WHERE username = 'mqulima_kiprono' LIMIT 1),
    (SELECT id FROM services WHERE slug = 'silage-shredding' LIMIT 1),
    'in_progress',
    'Need to shred 10 tonnes of maize stalks for silage.',
    NOW(),
    'Kericho, Litein area'
  ),
  (
    (SELECT id FROM profiles WHERE username = 'mqulima_wanjiku' LIMIT 1),
    (SELECT id FROM services WHERE slug = 'soil-ph-npk-analysis' LIMIT 1),
    'completed',
    'Soil test completed. Report sent to customer.',
    NOW() - INTERVAL '2 days',
    'Ol Kalou, Nyandarua'
  );

-- 4. Orders & Payments
INSERT INTO orders (user_id, items, subtotal, total, status, payment_method, payment_status, delivery_address, checkout_channel, sales_agent_id, notes)
VALUES
  (
    (SELECT id FROM profiles WHERE username = 'mqulima_wanjiku' LIMIT 1),
    '[{"id":"p1","name":"Mavuno Planting Fertilizer","price":3450,"quantity":2,"unit":"50kg bag"}]'::jsonb,
    6900.00,
    7200.00,
    'processing',
    'mpesa',
    'paid',
    'Ol Kalou Town, Nyandarua',
    'website',
    NULL,
    'Deliver via Wells Fargo'
  ),
  (
    (SELECT id FROM profiles WHERE username = 'mqulima_kiprono' LIMIT 1),
    '[{"id":"p2","name":"DK 8031 Hybrid Maize Seed","price":680,"quantity":5,"unit":"2kg pack"},{"id":"p5","name":"Knapsack Sprayer 16L","price":4500,"quantity":1,"unit":"1 unit"}]'::jsonb,
    7900.00,
    8300.00,
    'pending',
    'mpesa',
    'pending',
    'Kericho Town, Coop Bank Lane',
    'whatsapp',
    (SELECT id FROM profiles WHERE username = 'mqulima_kirwa_agent' LIMIT 1),
    'Order placed via WhatsApp conversation'
  ),
  (
    (SELECT id FROM profiles WHERE username = 'mqulima_mutiso' LIMIT 1),
    '[{"id":"p4","name":"Maclick Super Dewormer","price":980,"quantity":3,"unit":"500ml"}]'::jsonb,
    2940.00,
    3140.00,
    'shipped',
    'mpesa',
    'paid',
    'Machakos Town, Behind KCB',
    'website',
    NULL,
    'Send via Speedaf Courier'
  ),
  (
    (SELECT id FROM profiles WHERE username = 'mqulima_kipchirchir' LIMIT 1),
    '[{"id":"p1","name":"Mavuno Planting Fertilizer","price":3450,"quantity":10,"unit":"50kg bag"}]'::jsonb,
    34500.00,
    35000.00,
    'delivered',
    'bank_transfer',
    'paid',
    'Eldoret CBD, Store #4',
    'website',
    NULL,
    'Bulk order'
  );

-- Payments
INSERT INTO payments (order_id, provider, provider_ref, amount, status, raw_payload)
VALUES
  (
    (SELECT id FROM orders WHERE total = 7200.00 LIMIT 1),
    'mpesa',
    'RGF89DFK3S',
    7200.00,
    'paid',
    '{"transaction_id": "RGF89DFK3S", "merchant_request_id": "12345", "checkout_request_id": "54321", "result_code": 0}'::jsonb
  ),
  (
    (SELECT id FROM orders WHERE total = 3140.00 LIMIT 1),
    'mpesa',
    'RHG45FDK3W',
    3140.00,
    'paid',
    '{"transaction_id": "RHG45FDK3W", "merchant_request_id": "12346", "checkout_request_id": "54322", "result_code": 0}'::jsonb
  ),
  (
    (SELECT id FROM orders WHERE total = 35000.00 LIMIT 1),
    'bank_transfer',
    'REF-BANK-998822',
    35000.00,
    'paid',
    '{"transaction_id": "REF-BANK-998822", "bank_name": "KCB", "status": "approved"}'::jsonb
  );

-- 5. Commodity Listings (Soko)
INSERT INTO commodity_listings (user_id, commodity_id, quantity, asking_price, location, description, status)
VALUES
  (
    (SELECT id FROM profiles WHERE username = 'mqulima_kipchirchir' LIMIT 1),
    (SELECT id FROM commodities WHERE name = 'Dry Maize' LIMIT 1),
    45.00,
    3600.00,
    'Eldoret, Uasin Gishu',
    'Premium clean dry white maize. Harvested November last year. Kept in hermetic bags.',
    'active'
  ),
  (
    (SELECT id FROM profiles WHERE username = 'mqulima_wanjiku' LIMIT 1),
    (SELECT id FROM commodities WHERE name = 'Shangi Potatoes' LIMIT 1),
    120.00,
    2200.00,
    'Ol Kalou, Nyandarua',
    'Freshly harvested Shangi potatoes, medium size, clean.',
    'active'
  ),
  (
    (SELECT id FROM profiles WHERE username = 'mqulima_kiprono' LIMIT 1),
    (SELECT id FROM commodities WHERE name = 'Raw Milk' LIMIT 1),
    350.00,
    48.00,
    'Litein, Kericho',
    'Fresh morning milk from grass-fed cows. High fat content.',
    'active'
  );

-- Seed Commodity price board entries
INSERT INTO commodity_price_board (commodity_id, region, price, source)
VALUES
  ((SELECT id FROM commodities WHERE name = 'Dry Maize' LIMIT 1), 'Eldoret', 3400.00, 'NCPB Eldoret'),
  ((SELECT id FROM commodities WHERE name = 'Dry Maize' LIMIT 1), 'Nairobi', 3850.00, 'Nairobi Markets'),
  ((SELECT id FROM commodities WHERE name = 'Shangi Potatoes' LIMIT 1), 'Nakuru', 2300.00, 'Wakulima Market Nakuru'),
  ((SELECT id FROM commodities WHERE name = 'Raw Milk' LIMIT 1), 'Nyandarua', 44.00, 'Brookside Nyandarua Coop');

-- 6. Show Posts (Forum)
INSERT INTO show_posts (user_id, type, title, caption, media_urls, like_count, relate_count, comment_count, tags)
VALUES
  (
    (SELECT id FROM profiles WHERE username = 'mqulima_kipchirchir' LIMIT 1),
    'harvest',
    'Maize Harvest 2026',
    'Bumper harvest this season! Eldoret soils are blessed. Did 28 bags per acre with organic compost!',
    '{"https://images.unsplash.com/photo-1530595467537-0b5996c41f2d"}',
    14,
    8,
    2,
    '{"Maize", "Harvest", "Eldoret"}'
  ),
  (
    (SELECT id FROM profiles WHERE username = 'mqulima_mutiso' LIMIT 1),
    'tragedy',
    'Armyworms Attack!',
    'Devastated by armyworms on my late crop. Any recommendations on systemic insecticides?',
    '{"https://images.unsplash.com/photo-1599599810769-bcde5a160d32"}',
    8,
    23,
    5,
    '{"Pests", "Help", "Armyworm"}'
  );

-- Show Comments
INSERT INTO show_comments (post_id, user_id, body)
VALUES
  (
    (SELECT id FROM show_posts WHERE title = 'Maize Harvest 2026' LIMIT 1),
    (SELECT id FROM profiles WHERE username = 'mqulima_wanjiku' LIMIT 1),
    'Congratulations John! What fertilizer spacing did you use?'
  ),
  (
    (SELECT id FROM show_posts WHERE title = 'Armyworms Attack!' LIMIT 1),
    (SELECT id FROM profiles WHERE username = 'mqulima_kiprono' LIMIT 1),
    'Try spraying Ridomil or Belt immediately. Do it early in the morning when they are active.'
  );

-- Show Likes
INSERT INTO show_likes (post_id, user_id)
VALUES
  (
    (SELECT id FROM show_posts WHERE title = 'Maize Harvest 2026' LIMIT 1),
    (SELECT id FROM profiles WHERE username = 'mqulima_wanjiku' LIMIT 1)
  ),
  (
    (SELECT id FROM show_posts WHERE title = 'Armyworms Attack!' LIMIT 1),
    (SELECT id FROM profiles WHERE username = 'mqulima_kiprono' LIMIT 1)
  );

-- Done!
