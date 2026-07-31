-- ============================================================================
-- MQULIMA PLATFORM — HIGH-QUALITY DEMO SEED DATA
-- Run: PSPASSWORD=mqulima_dev_2026 psql -h localhost -p 5433 -U mqulima -d mqulima_dev -f db/seeds.sql
-- ============================================================================

-- Ensure default super admin account exists with password 'Admin@2026!'
INSERT INTO profiles (email, password_hash, full_name, username, role, county_region)
VALUES (
  'admin@mqulima.co.ke',
  '$2b$10$lWYhhk8gcyIkMgqYv2HKP.FTnQRNHnuLENrd9JaigTUnouGiObATa',
  'Mqulima Admin',
  'mqulima_admin',
  'super_admin',
  'Nairobi'
) ON CONFLICT (email) DO UPDATE SET 
  password_hash = '$2b$10$lWYhhk8gcyIkMgqYv2HKP.FTnQRNHnuLENrd9JaigTUnouGiObATa',
  role = 'super_admin';

-- Clean up existing demo data to prevent duplicate key errors and redundancy, preserving user accounts & admin
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
DELETE FROM blog_posts;
DELETE FROM blog_authors;
DELETE FROM profiles WHERE email LIKE '%@mqulima.co.ke' AND email != 'admin@mqulima.co.ke' AND role != 'super_admin';

-- Seed blog authors and blog posts linked to the super_admin
DO $$
DECLARE
  admin_profile_id UUID;
  author1_id UUID;
  author2_id UUID;
  author3_id UUID;
  author4_id UUID;
BEGIN
  SELECT id INTO admin_profile_id FROM profiles WHERE role::text = 'super_admin' LIMIT 1;
  IF admin_profile_id IS NULL THEN
    SELECT id INTO admin_profile_id FROM profiles LIMIT 1;
  END IF;
  IF admin_profile_id IS NULL THEN
    INSERT INTO profiles (email, password_hash, full_name, username, role)
    VALUES ('admin@mqulima.co.ke', '$2b$10$/Ljuf.DOutjezdz1SS7H2.DjIHCIBxo5Zrgnki.6Nw0us9gY745v6', 'Mqulima Admin', 'mqulima_admin', 'super_admin')
    RETURNING id INTO admin_profile_id;
  END IF;

  INSERT INTO blog_authors (id, profile_id, bio, is_active)
  VALUES
    (gen_random_uuid(), admin_profile_id, 'Over 15 years advising Rift Valley maize and wheat cooperatives on soil dynamics.', TRUE)
  RETURNING id INTO author1_id;

  INSERT INTO blog_authors (id, profile_id, bio, is_active)
  VALUES
    (gen_random_uuid(), admin_profile_id, 'Spearheading mobile-agronomy and smart IoT irrigation layouts across East Africa.', TRUE)
  RETURNING id INTO author2_id;

  INSERT INTO blog_authors (id, profile_id, bio, is_active)
  VALUES
    (gen_random_uuid(), admin_profile_id, 'Ex-ministry expert monitoring regional trade corridors, wholesale seed pricing, and grain demand.', TRUE)
  RETURNING id INTO author3_id;

  INSERT INTO blog_authors (id, profile_id, bio, is_active)
  VALUES
    (gen_random_uuid(), admin_profile_id, 'Specialist in high-yield zero grazing milk configurations and animal preventive medicine.', TRUE)
  RETURNING id INTO author4_id;

  INSERT INTO blog_posts (author_id, title, slug, cover_image, body, excerpt, category, status, published_at)
  VALUES
  (
    author3_id,
    'Kenya''s Maize Prices Hit 3-Year High — What Smallholder Farmers Must Do Now',
    'kenya-maize-prices-3-year-high-2026',
    '/mqulima_news_banner.png',
    'Maize prices across East Africa have entered a volatile super-cycle. Erratically distributed rainfall coupled with skyrocketing import costs for nitrogenous fertilizers has tightened regional grain balances. In response, wholesale prices in key hubs like Eldoret, Nakuru, and Nairobi have surged, posing both a challenge and an opportunity for agricultural cooperatives.

To capitalize on this, smallholder cultivators must move away from speculation and focus on soil-catalyst inputs to stabilize yield volume. High-grade certified seeds are critical; using recycled seed grain under these weather patterns will lead to severe yield drops.

Furthermore, collective bargaining groups must negotiate fertilizer subsidies in bulk. By pooling resources, cooperatives can purchase DAP and urea directly from shipping consignments, bypassing predatory brokers.',
    'Wholesale maize prices in Eldoret and Nakuru markets surged 34% this season, driven by erratic rainfall and export demand. Here''s what cooperatives should do before the next planting window.',
    'Market Prices',
    'published',
    NOW() - INTERVAL '13 days'
  ),
  (
    author2_id,
    'How Uasin Gishu Cooperatives Increased Yields by 40% Using Mobile Agronomy',
    'uasin-gishu-cooperatives-mobile-agronomy-40-percent',
    '/mqulima_news_banner.png',
    'Traditional farming wisdom is no longer sufficient to navigate shifting weather cycles. In Uasin Gishu, a syndicate of 12 smallholder cooperatives partnered with Mqulima''s digital agronomist network to deploy a SMS-based alert system.

The platform monitors localized meteorological data and soil moisture sensors. When conditions are optimal, automated alerts are broadcasted to farmers'' mobile phones, advising them on the exact hour to apply top-dressing fertilizer.

This precise timing prevents nitrogen runoff during sudden downpours, ensuring that root systems absorb maximum soil nutrients. The results have been stellar — yielding a 40% increase in grain weight per hectare.',
    'Using simple SMS and USSD alert systems, grain growers optimized planting windows and fertilizer inputs to achieve record harvest volumes.',
    'Agri-Tech',
    'published',
    NOW() - INTERVAL '18 days'
  ),
  (
    author1_id,
    'Organic Ginger Export Guidelines for East African Farmers',
    'organic-ginger-export-guidelines-east-africa',
    '/mqulima_news_banner.png',
    'Exporting ginger to European markets requires strict compliance with international phytosanitary standards. Buyers demand proof of pesticide-free cultivation, which means farmers must adopt organic composting techniques.

To start, soil must be enriched with biological organic compost instead of synthetic chemical fertilizers. Crop protection should rely on natural bio-pesticides like neem oil extracts and garlic sprays.

Documentation is key. Farmers need to keep exhaustive spray registers, field maps, and batch numbers. Mqulima''s cooperative logistics handles certification checks, paving the way for seamless international exports.',
    'A complete step-by-step walkthrough on obtaining pesticide-free certification and accessing European specialty herb markets.',
    'Farm Tips',
    'published',
    NOW() - INTERVAL '20 days'
  ),
  (
    author4_id,
    'Understanding the Subsidized Dairy Feed Policy of 2026',
    'subsidized-dairy-feed-policy-2026',
    '/mqulima_news_banner.png',
    'Dairy farming is capital-intensive. Feeds alone account for up to 70% of operational costs. The new agricultural policy introduces credit subsidies specifically targeting livestock feed millers and cooperative dairies.

Under this bill, registered dairy groups can access capital at a subsidized rate of 6% per annum. This capital must be spent on raw feed materials (yellow maize, cotton seed cake, wheat pollard) to manufacture high-yield dairy meal in-house.

By building feed processing bays at cooperative collection points, farmers can purchase quality feeds at up to 25% below commercial agrovet retail pricing.',
    'How the government''s subsidized interest rate program affects loan applications for smallholder dairy cooperatives.',
    'Policy & Finance',
    'published',
    NOW() - INTERVAL '26 days'
  );
END $$;


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
  );

-- 2. Products (Featured Collection)
INSERT INTO products (name, slug, description, base_price, original_price, stock_qty, is_featured, avg_rating, rating_count, status, brand, seller, county, unit, badge, organic, verified_seller, seller_score, condition, shop_type, field, subcategory, image_urls)
VALUES
  (
    'Premium NPK 20:20:20 Fertilizer',
    'premium-npk-20-20-20-fertilizer',
    'High-purity water-soluble NPK 20:20:20 balanced fertilizer designed to boost plant growth, flowering, and root health.',
    3200.00,
    3600.00,
    250,
    TRUE,
    4.9,
    32,
    'active',
    'Yara',
    'Mculima Supplies',
    'Nairobi',
    '50kg bag',
    'Bestseller',
    FALSE,
    TRUE,
    98,
    'New',
    'Agrovet',
    'Fertilizers',
    'Planting',
    ARRAY['https://i.pinimg.com/1200x/30/51/f4/3051f4e634474dad5df2920d1b7e763a.jpg']
  ),
  (
    'Lambda-Cyhalothrin 10EC Insecticide',
    'lambda-cyhalothrin-10ec-insecticide',
    'Fast-acting synthetic pyrethroid insecticide for controlling caterpillars, aphids, thrips, and beetles on crops.',
    1450.00,
    1600.00,
    180,
    TRUE,
    4.8,
    27,
    'active',
    'Pomais',
    'AgroChem Supplies',
    'Nairobi',
    '1L bottle',
    'Best Seller',
    FALSE,
    TRUE,
    96,
    'New',
    'Agrovet',
    'Crop Protection',
    'Insecticides',
    ARRAY['https://www.pomais.com/wp-content/uploads/2024/12/Lambda-cyhalothrin10EC-.webp']
  ),
  (
    'Seaweed Organic Growth Booster',
    'seaweed-organic-growth-booster',
    '100% natural cold-pressed seaweed extract biostimulant. Enhances root expansion, stress tolerance, and crop yields.',
    2100.00,
    2400.00,
    140,
    TRUE,
    4.9,
    41,
    'active',
    'BioGrow',
    'Organic Farm Solutions',
    'Nakuru',
    '1L bottle',
    'Organic',
    TRUE,
    TRUE,
    99,
    'Certified Organic',
    'Agrovet',
    'Plant Growth & Boosters',
    'Biostimulants',
    ARRAY['https://i.pinimg.com/736x/b4/9e/55/b49e55253e882f51514c8a028dda76bd.jpg']
  ),
  (
    '20L Heavy Duty Knapsack Sprayer',
    '20l-heavy-duty-knapsack-sprayer',
    'Ergonomic 20-litre manual knapsack sprayer with heavy-duty pump handle, brass lance, and multi-pattern nozzles.',
    4800.00,
    5200.00,
    65,
    TRUE,
    4.7,
    19,
    'active',
    'Harvester Tools',
    'Equipment Direct',
    'Nairobi',
    '1 unit',
    'Hot Deal',
    FALSE,
    TRUE,
    94,
    'New',
    'Agrovet',
    'Farm Equipment',
    'Machinery',
    ARRAY['https://i.pinimg.com/1200x/74/d7/66/74d766c45e79615e4028f5d86cb1a63d.jpg']
  ),
  (
    'Duduthrin Broad-Spectrum Insecticide',
    'duduthrin-broad-spectrum-insecticide',
    'Broad-spectrum EC insecticide formulation effective against cutworms, armyworms, whiteflies, and diamondback moths.',
    1200.00,
    1350.00,
    95,
    TRUE,
    4.8,
    22,
    'active',
    'Twiga Chemical',
    'Twiga Agrovet',
    'Kiambu',
    '500ml',
    'Popular',
    FALSE,
    TRUE,
    97,
    'New',
    'Agrovet',
    'Crop Protection',
    'Insecticides',
    ARRAY['https://i.pinimg.com/736x/e6/29/38/e62938172d5b057b027f3de816b373e2.jpg']
  ),
  (
    'High-Yield Layer Chicken Feed',
    'high-yield-layer-chicken-feed',
    'Nutrient-balanced complete laying mash formulated with essential calcium, amino acids, and energy for maximum egg output.',
    3250.00,
    3500.00,
    310,
    TRUE,
    4.9,
    38,
    'active',
    'Unga Feeds',
    'Unga Farmcare',
    'Nakuru',
    '70kg bag',
    'Top Feed',
    FALSE,
    TRUE,
    98,
    'Fresh',
    'Agrovet',
    'Animal Farming',
    'Animal Feed',
    ARRAY['https://www.myagrovet.co.ke/images/products/7367/thumb_44e1a1ca768bb3add788ec4afd3b0a57.png']
  ),
  (
    'High-Protein Dairy Meal',
    'high-protein-dairy-meal',
    'High-protein concentrate dairy meal enriched with bypass fats, mineral salts, and vitamins to boost daily milk yield.',
    2950.00,
    3200.00,
    280,
    TRUE,
    4.8,
    35,
    'active',
    'Pembe Feeds',
    'Pembe Millers',
    'Uasin Gishu',
    '50kg bag',
    'Bestseller',
    FALSE,
    TRUE,
    97,
    'Fresh',
    'Agrovet',
    'Animal Farming',
    'Animal Feed',
    ARRAY['https://www.myagrovet.co.ke/images/products/7402/625a8d9a0cb201e96950aaf15ae003a8.png']
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
    '[{"id":"premium-npk-20-20-20-fertilizer","name":"Premium NPK 20:20:20 Fertilizer","price":3200,"quantity":2,"unit":"50kg bag"}]'::jsonb,
    6400.00,
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
    '[{"id":"lambda-cyhalothrin-10ec-insecticide","name":"Lambda-Cyhalothrin 10EC Insecticide","price":1450,"quantity":3,"unit":"1L bottle"},{"id":"20l-heavy-duty-knapsack-sprayer","name":"20L Heavy Duty Knapsack Sprayer","price":4800,"quantity":1,"unit":"1 unit"}]'::jsonb,
    7900.00,
    8300.00,
    'pending',
    'mpesa',
    'pending',
    'Kericho Town, Coop Bank Lane',
    'whatsapp',
    NULL,
    'Order placed via WhatsApp conversation'
  ),
  (
    (SELECT id FROM profiles WHERE username = 'mqulima_mutiso' LIMIT 1),
    '[{"id":"duduthrin-broad-spectrum-insecticide","name":"Duduthrin Broad-Spectrum Insecticide","price":1200,"quantity":2,"unit":"500ml"}]'::jsonb,
    2400.00,
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
    '[{"id":"premium-npk-20-20-20-fertilizer","name":"Premium NPK 20:20:20 Fertilizer","price":3200,"quantity":10,"unit":"50kg bag"}]'::jsonb,
    32000.00,
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


-- Seed Commodity price board entries
INSERT INTO commodity_price_board (commodity_id, region, price, source)
VALUES
  ((SELECT id FROM commodities WHERE name = 'Dry Maize' LIMIT 1), 'Eldoret', 3400.00, 'NCPB Eldoret'),
  ((SELECT id FROM commodities WHERE name = 'Dry Maize' LIMIT 1), 'Nairobi', 3850.00, 'Nairobi Markets'),
  ((SELECT id FROM commodities WHERE name = 'Shangi Potatoes' LIMIT 1), 'Nakuru', 2300.00, 'Wakulima Market Nakuru'),
  ((SELECT id FROM commodities WHERE name = 'Raw Milk' LIMIT 1), 'Nyandarua', 44.00, 'Brookside Nyandarua Coop');


-- Done!

