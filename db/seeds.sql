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


-- 1. Profiles (Preserve super admin accounts only)
-- (No mock profiles inserted)

-- 2. Products (Featured Collection Catalog)
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

-- 3. Service Requests & Orders
-- (Clean production database: No mock transactional activity)

-- Seed Commodity price board entries
INSERT INTO commodity_price_board (commodity_id, region, price, source)
VALUES
  ((SELECT id FROM commodities WHERE name = 'Dry Maize' LIMIT 1), 'Eldoret', 3400.00, 'NCPB Eldoret'),
  ((SELECT id FROM commodities WHERE name = 'Dry Maize' LIMIT 1), 'Nairobi', 3850.00, 'Nairobi Markets'),
  ((SELECT id FROM commodities WHERE name = 'Shangi Potatoes' LIMIT 1), 'Nakuru', 2300.00, 'Wakulima Market Nakuru'),
  ((SELECT id FROM commodities WHERE name = 'Raw Milk' LIMIT 1), 'Nyandarua', 44.00, 'Brookside Nyandarua Coop');

-- Seed agritech_news articles
INSERT INTO agritech_news (
  id, title, slug, summary, content, category, media_type, media_url, source_attribution, status, published_at
) VALUES 
  (
    'news-el-nino-kenya',
    'El Niño in Kenya: What Farmers Need to Know',
    'el-nino-in-kenya-what-farmers-need-to-know',
    'Understanding El Niño climate risks, rainfall forecasts, drainage improvements, and crop management strategies for Kenyan farmers.',
    '<p><strong>El Niño</strong> is a natural climate pattern associated with unusually warm ocean temperatures in the central and eastern tropical Pacific. Although it begins thousands of kilometres away from East Africa, it can significantly influence rainfall and temperature patterns across the region.</p><p>For Kenyan farmers, understanding El Niño is important because changes in rainfall can create both <strong>opportunities and serious agricultural risks</strong>.</p><h2>🌦️ How El Niño Affects Kenya</h2><p>El Niño is commonly associated with increased rainfall across parts of East Africa, particularly during the <strong>October–December short-rains season</strong>. However, its effects are not identical everywhere, and rainfall responses can vary depending on the strength, timing and interaction of El Niño with other climate systems.</p><p>Heavy rainfall can replenish water sources and improve soil moisture, but excessive rain can also cause <strong>flooding, soil erosion, waterlogging and crop damage</strong>.</p><p>Kenya''s experience during previous El Niño events demonstrates how significant these impacts can be. The Kenya Meteorological Department reported that the 2023 combination of El Niño and a strong positive Indian Ocean Dipole contributed to above-normal rainfall in many areas, alongside severe flooding, crop and livestock losses and infrastructure damage.</p><h2>🌽 What Does El Niño Mean for Farmers?</h2><p>For farmers, more rainfall does not automatically mean a better harvest.</p><p>Excessive rainfall can:</p><ul><li>Flood farms and destroy crops</li><li>Cause soil erosion and nutrient loss</li><li>Create waterlogged conditions</li><li>Increase fungal and other crop diseases</li><li>Damage roads used to transport farm produce</li><li>Disrupt harvesting and post-harvest handling</li><li>Increase livestock disease risks</li></ul><p>At the same time, adequate rainfall can improve <strong>water availability, pasture conditions and crop establishment</strong>, particularly where farmers have prepared their farms properly.</p><h2>🧑‍🌾 How Farmers Can Prepare</h2><p>Farmers can reduce their exposure to extreme rainfall by taking practical measures before the rains intensify.</p><h3>1. Improve Farm Drainage</h3><p>Clear drainage channels and ensure excess water can leave the farm without causing erosion.</p><h3>2. Protect the Soil</h3><p>Mulching, maintaining ground cover and using appropriate soil-conservation practices can help reduce erosion caused by heavy rainfall.</p><h3>3. Use Climate Information</h3><p>Farmers should monitor reliable seasonal forecasts and local weather updates before making decisions about planting, fertilizer application and harvesting.</p><h3>4. Protect Harvests</h3><p>Farmers should prepare adequate drying, storage and transportation arrangements before periods of heavy rainfall.</p><h2>🌱 El Niño and the Future of Kenyan Agriculture</h2><p>Climate variability is making agricultural decision-making increasingly dependent on timely information.</p><p>For farmers, weather forecasts are becoming as important as information about <strong>seed, fertilizer and market prices</strong>.</p><p><strong>Mqulima — turning climate information into better farming decisions.</strong></p>',
    'Weather Advisory',
    'image',
    'https://images.unsplash.com/photo-1515694346937-94d85e41e6f0?auto=format&fit=crop&w=1200&q=80',
    'KALRO / Mqulima Editorial Desk',
    'published',
    NOW()
  ),
  (
    'news-fuerte-avocado-kenya',
    'Fuerte Avocados (Kg) in Kenya: Market Prices, Production and Opportunities for Farmers',
    'fuerte-avocados-in-kenya-market-prices-and-opportunities',
    'Comprehensive guide on Fuerte avocado market pricing per kg, KALRO yield guidance, elevation suitability, and post-harvest cold chain management.',
    '<p><strong>Fuerte avocado</strong> is one of the established avocado varieties grown in Kenya and remains an important fruit for both domestic and commercial markets. Alongside Hass and other varieties, Fuerte forms part of Kenya’s avocado value chain, providing opportunities for farmers, traders and agribusinesses.</p><h2>What Makes Fuerte Avocado Different?</h2><p>Fuerte is a hybrid avocado variety associated with the Mexican race and is well suited to Kenya''s midland and highland production areas. KALRO identifies Fuerte among the important avocado varieties grown in Kenya and notes that Mexican and Guatemalan varieties generally perform well in Kenya''s midlands and highlands.</p><p>The fruit typically remains green when mature, unlike Hass, which develops a darker skin as it ripens. This means farmers need to pay close attention to maturity indicators when determining the right harvesting time.</p><h2>💰 Fuerte Avocado Price Per Kilogram</h2><p>The price of Fuerte avocado varies depending on <strong>location, season, fruit quality, supply, demand, market channel and whether the transaction is wholesale or retail</strong>.</p><p>For example, a recorded market entry from Gakoromone Market in Meru showed Fuerte avocado at <strong>KSh 200 per kg wholesale and KSh 250 per kg retail</strong>. Market prices can change considerably, so farmers should check current local market information before making selling decisions.</p><h3>What Determines the Price?</h3><p>Several factors influence the price farmers receive:</p><ul><li><strong>Fruit size and grade</strong></li><li><strong>Quality and maturity</strong></li><li><strong>Seasonal supply</strong></li><li><strong>Local market demand</strong></li><li><strong>Export demand</strong></li><li><strong>Distance to market</strong></li><li><strong>Post-harvest handling</strong></li><li><strong>Volume being sold</strong></li></ul><h2>🌱 Production Potential</h2><p>Avocado can become a valuable long-term enterprise when farmers select suitable varieties, planting sites and management practices.</p><p>KALRO''s avocado production guidance indicates that yields increase substantially as trees mature. Its factsheet reports approximately <strong>300–400 kg per hectare for 3–5-year-old trees</strong> and <strong>800–1,000 kg for trees older than five years</strong>.</p><h2>⚠️ Post-Harvest Handling Matters</h2><p>Avocados are highly sensitive to post-harvest handling. Poor harvesting, bruising, delayed cooling and inadequate storage can significantly reduce quality and market value.</p><p>KALRO recommends rapid cooling after harvest and identifies approximately <strong>5°C as an optimum storage temperature for Fuerte and Hass varieties</strong> in its post-harvest guidance.</p><h2>🧑‍🌾 Mqulima Market Insight</h2><p>Fuerte avocado prices should be viewed as <strong>market indicators rather than fixed prices</strong>. Farmers should compare farm-gate, wholesale and retail prices while considering transport, grading, packaging and other transaction costs.</p><p><strong>Bottom line:</strong> Fuerte avocado remains an important Kenyan avocado variety with opportunities across the domestic and commercial value chains.</p>',
    'Agronomy & Farm Tips',
    'image',
    'https://images.unsplash.com/photo-1523049673857-eb18f1d7b578?auto=format&fit=crop&w=1200&q=80',
    'Mqulima Agronomy Desk',
    'published',
    NOW() - INTERVAL '1 hour'
  ),
  (
    'news-galana-kulalu-scheme',
    'Galana-Kulalu Irrigation Scheme: Kenya’s Ambitious Drive to Transform Agriculture',
    'galana-kulalu-irrigation-scheme-kenya',
    'Overview of the Galana-Kulalu mega irrigation project in Kilifi & Tana River, Tana River water abstraction, pivot irrigation, and grain reserve stabilization.',
    '<p><strong>Galana-Kulalu Irrigation Scheme</strong> is one of Kenya’s major agricultural development projects, designed to expand large-scale irrigation, increase national food production, and strengthen the country’s long-term food security.</p><p>Spanning parts of Kilifi and Tana River counties, the project targets thousands of acres for mechanized crop production, focusing on staple crops such as maize, alongside livestock and horticultural production.</p><h2>🌾 Key Objectives & Infrastructure</h2><p>The main goal of the Galana-Kulalu initiative is to transition Kenyan agriculture from rain-fed dependence to reliable, tech-enabled irrigation infrastructure.</p><ul><li><strong>Water Abstraction:</strong> Harnessing water from the Tana River to feed extensive canal networks and modern pivot irrigation systems.</li><li><strong>Staple Grain Reserves:</strong> Boosting national strategic grain reserves to stabilize food prices across urban and rural markets.</li><li><strong>Public-Private Partnerships (PPP):</strong> Partnering with private investors and commercial agricultural enterprises to maximize yield per hectare.</li></ul><h2>📈 Opportunities for Farmers & Agribusinesses</h2><p>Beyond state-level food security, Galana-Kulalu creates vital economic opportunities across the coastal and national agricultural supply chains:</p><ul><li>Enhanced seed and fertilizer distribution networks.</li><li>Post-harvest storage and modern grain milling services.</li><li>Employment and technical skills development in mechanized farming.</li></ul><h2>🧑‍🌾 Mqulima Policy & Market Insight</h2><p>Large-scale irrigation projects like Galana-Kulalu demonstrate the shift towards sustainable, climate-resilient farming in Kenya. Integrating efficient water management with market intelligence ensures that local farmers benefit from price stability and dependable supply chains.</p><p><strong>Mqulima — turning climate information and market intelligence into better farming decisions.</strong></p>',
    'Policy & Market',
    'image',
    'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&w=1200&q=80',
    'Ministry of Water & Irrigation / Mqulima Desk',
    'published',
    NOW() - INTERVAL '2 hours'
  )
ON CONFLICT (id) DO NOTHING;

-- Done!

