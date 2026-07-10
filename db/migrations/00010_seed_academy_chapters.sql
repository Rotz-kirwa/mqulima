-- ============================================================================
-- SEED ACADEMY CHAPTERS & LESSONS
-- Matches COURSES_DATA defined in src/routes/academy.tsx
-- ============================================================================

-- Seed the 5 courses first to ensure foreign key constraint satisfaction
INSERT INTO courses (id, title, slug, description, level, price)
VALUES
  (
    '579472e9-af32-4d11-b108-cb5c56e5e385',
    'Commercial Sukuma Wiki (Collard Greens) Cultivation Masterclass',
    'sukuma-wiki-production',
    'Learn how to establish, grow, and scale a highly profitable Sukuma Wiki (collard greens) enterprise. Covers nursery management, drip irrigation layout, organic pest control, and accessing county wholesale markets.',
    'beginner',
    0.00
  ),
  (
    '781d5063-2b20-440a-b6cb-0228a9f453fa',
    'Avocado Farming Masterclass',
    'avocado-masterclass',
    'Learn how to establish and manage a highly profitable avocado orchard. Covers site selection, planting, disease management, and harvesting for export markets.',
    'beginner',
    0.00
  ),
  (
    'c78cb2cb-b3c9-42a4-96c9-c81308907751',
    'Dairy Farming Essentials',
    'dairy-farming-essentials',
    'Learn the fundamentals of profitable dairy farming. This masterclass covers breed selection, feeding and nutrition, animal health management, and effective milk production and marketing.',
    'beginner',
    0.00
  ),
  (
    '8f6c15a4-858b-4814-ae47-9af3d1f87e77',
    'Poultry Farming Essentials',
    'poultry-farming-essentials',
    'Learn the fundamentals of profitable poultry farming. This masterclass covers breed selection, housing, disease prevention, and effective marketing.',
    'beginner',
    0.00
  ),
  (
    '6249d040-83bf-4360-aa62-712830792ce2',
    'AI in Agriculture: Farming Smarter with Artificial Intelligence',
    'ai-in-agriculture',
    'Discover how Artificial Intelligence is transforming modern farming. Learn about AI disease detection, precision farming, autonomous tools, and data-driven farm management.',
    'all_levels',
    0.00
  )
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  slug = EXCLUDED.slug,
  description = EXCLUDED.description,
  level = EXCLUDED.level,
  price = EXCLUDED.price;

-- Clean up any existing records to avoid duplicates
DELETE FROM chapter_lessons;
DELETE FROM course_chapters;

-- 1. Commercial Sukuma Wiki (Collard Greens) Cultivation Masterclass (579472e9-af32-4d11-b108-cb5c56e5e385)
INSERT INTO course_chapters (id, course_id, title, description, sort_order, duration_minutes, is_published)
VALUES
  ('c10a0000-0000-0000-0000-000000000001', '579472e9-af32-4d11-b108-cb5c56e5e385', 'Site Selection & Land Preparation', 'Welcome to the Sukuma Wiki Field Guide. The first step to a successful harvest is choosing the right planting site. Sukuma Wiki grows best in well-drained, fertile soil with a pH of 6.0 to 7.5 and requires at least six hours of sunlight daily.', 0, 10, true),
  ('c10a0000-0000-0000-0000-000000000002', '579472e9-af32-4d11-b108-cb5c56e5e385', 'Planting & Crop Management', 'Plant healthy seedlings and maintain a spacing of about 45 cm by 45 cm to promote airflow and reduce disease. Water regularly, especially during dry periods, but avoid waterlogging.', 1, 15, true),
  ('c10a0000-0000-0000-0000-000000000003', '579472e9-af32-4d11-b108-cb5c56e5e385', 'Pest & Disease Management', 'Inspect your crop regularly for pests such as aphids, caterpillars, and diamondback moths, as well as diseases like black rot and downy mildew. Practice crop rotation and biological controls.', 2, 10, true),
  ('c10a0000-0000-0000-0000-000000000004', '579472e9-af32-4d11-b108-cb5c56e5e385', 'Harvesting & Marketing', 'Sukuma Wiki is ready for harvesting about 6 to 8 weeks after planting. Pick the mature outer leaves first while allowing the younger inner leaves to continue growing. Transport to county wholesale markets.', 3, 10, true);

INSERT INTO chapter_lessons (id, chapter_id, title, content_type, video_url, video_type, video_duration_seconds, text_content, sort_order, is_free_preview)
VALUES
  -- Chapter 1 Lessons
  ('f10a0000-0000-0000-0000-000000000001', 'c10a0000-0000-0000-0000-000000000001', 'Introduction & Nursery Selection', 'video', 'https://youtube.com/watch?v=9MQOIRzZHa0', 'youtube', 600, null, 0, true),
  ('f10a0000-0000-0000-0000-000000000002', 'c10a0000-0000-0000-0000-000000000001', 'Soil Testing & PH Correction Guide', 'text', null, null, null, 'Before planting collard greens, perform a soil analysis. The ideal soil pH ranges between 6.0 and 7.5. Acidic soils should be corrected with agricultural lime.', 1, false),
  -- Chapter 2 Lessons
  ('f10a0000-0000-0000-0000-000000000003', 'c10a0000-0000-0000-0000-000000000002', 'Irrigation Grid Layout', 'video', 'https://youtube.com/watch?v=9MQOIRzZHa0', 'youtube', 300, null, 0, false),
  ('f10a0000-0000-0000-0000-000000000004', 'c10a0000-0000-0000-0000-000000000002', 'Spacing and Weed Suppression Guidelines', 'text', null, null, null, 'Maintain spacing of 45cm by 45cm. Consistent weeding is vital in the first 4 weeks to avoid root competition.', 1, false),
  -- Chapter 3 Lessons
  ('f10a0000-0000-0000-0000-000000000005', 'c10a0000-0000-0000-0000-000000000003', 'Organic Pest Identification Guide', 'text', null, null, null, 'Check leaves daily for caterpillars, aphids and moths. Organic neem tree oil solution is recommended for small-scale operations.', 0, false),
  -- Chapter 4 Lessons
  ('f10a0000-0000-0000-0000-000000000006', 'c10a0000-0000-0000-0000-000000000004', 'Sizing and Packing for Market Delivery', 'text', null, null, null, 'Bundle collard greens in equal weights. Transport early in the morning when ambient temperatures are lower to minimize spoilage.', 0, false);


-- 2. Avocado Farming Masterclass (781d5063-2b20-440a-b6cb-0228a9f453fa)
INSERT INTO course_chapters (id, course_id, title, description, sort_order, duration_minutes, is_published)
VALUES
  ('c10b0000-0000-0000-0000-000000000001', '781d5063-2b20-440a-b6cb-0228a9f453fa', 'Site Selection & Land Preparation', 'A successful avocado orchard begins with selecting the right location. Avocados thrive in well-drained, fertile soils with a pH of 5.5–7.0 and require full sunlight.', 0, 10, true),
  ('c10b0000-0000-0000-0000-000000000002', '781d5063-2b20-440a-b6cb-0228a9f453fa', 'Orchard Management & Planting', 'Choose certified, grafted avocado seedlings for faster fruiting and better yields. Plant at the beginning of the rainy season or provide irrigation during dry periods.', 1, 10, true),
  ('c10b0000-0000-0000-0000-000000000003', '781d5063-2b20-440a-b6cb-0228a9f453fa', 'Pest & Disease Control', 'Healthy avocado trees require regular monitoring for pests such as fruit flies, thrips, and mites, as well as diseases like root rot and anthracnose. Use Integrated Pest Management (IPM).', 2, 10, true),
  ('c10b0000-0000-0000-0000-000000000004', '781d5063-2b20-440a-b6cb-0228a9f453fa', 'Harvesting & Export Markets', 'Most grafted avocado trees begin producing fruit after 3 to 4 years. Harvest only mature fruits using proper picking tools to avoid bruising.', 3, 10, true);

INSERT INTO chapter_lessons (id, chapter_id, title, content_type, video_url, video_type, video_duration_seconds, text_content, sort_order, is_free_preview)
VALUES
  -- Chapter 1 Lessons
  ('f10b0000-0000-0000-0000-000000000001', 'c10b0000-0000-0000-0000-000000000001', 'Avocado Soil Drainage Test', 'text', null, null, null, 'Avocados are highly sensitive to waterlogging. Ensure holes are 60cm wide and deep, and filled with a rich manure-topsoil mix.', 0, true),
  -- Chapter 2 Lessons
  ('f10b0000-0000-0000-0000-000000000002', 'c10b0000-0000-0000-0000-000000000002', 'Spacing And Grafting Verification', 'text', null, null, null, 'Grafted Hass cultivars should be spaced 6-8 meters apart for optimal canopy exposure and airflow.', 0, false),
  -- Chapter 3 Lessons
  ('f10b0000-0000-0000-0000-000000000003', 'c10b0000-0000-0000-0000-000000000003', 'Preventing Phytophthora Root Rot', 'text', null, null, null, 'Maintain clean mulch and avoid over-irrigation. Apply biological agents like Trichoderma to suppress root diseases.', 0, false),
  -- Chapter 4 Lessons
  ('f10b0000-0000-0000-0000-000000000004', 'c10b0000-0000-0000-0000-000000000004', 'Quality checks for Hass Export Standards', 'text', null, null, null, 'Harvest with stems attached. Do not drop avocados on the ground; pack in plastic crates with foam padding.', 0, false);


-- 3. Dairy Farming Essentials (c78cb2cb-b3c9-42a4-96c9-c81308907751)
INSERT INTO course_chapters (id, course_id, title, description, sort_order, duration_minutes, is_published)
VALUES
  ('c10c0000-0000-0000-0000-000000000001', 'c78cb2cb-b3c9-42a4-96c9-c81308907751', 'Choosing the Right Dairy Breed', 'A successful dairy farm starts with selecting the right breed. Popular dairy breeds such as Friesian, Ayrshire, Jersey, and Guernsey each have unique strengths.', 0, 15, true),
  ('c10c0000-0000-0000-0000-000000000002', 'c78cb2cb-b3c9-42a4-96c9-c81308907751', 'Feeding & Nutrition', 'Proper nutrition is essential for high milk production and healthy cows. Feed your dairy cattle a balanced diet consisting of quality fodder, hay, silage, concentrates, and minerals.', 1, 15, true),
  ('c10c0000-0000-0000-0000-000000000003', 'c78cb2cb-b3c9-42a4-96c9-c81308907751', 'Animal Health & Farm Management', 'Healthy cows produce more milk. Maintain clean housing with proper ventilation and dry bedding to reduce diseases like mastitis.', 2, 15, true),
  ('c10c0000-0000-0000-0000-000000000004', 'c78cb2cb-b3c9-42a4-96c9-c81308907751', 'Milking, Record Keeping & Marketing', 'Milk cows using clean equipment and hygienic practices at the same times each day. Keep accurate records of breeding, feeding, and medical interventions.', 3, 15, true);

INSERT INTO chapter_lessons (id, chapter_id, title, content_type, video_url, video_type, video_duration_seconds, text_content, sort_order, is_free_preview)
VALUES
  -- Chapter 1 Lessons
  ('f10c0000-0000-0000-0000-000000000001', 'c10c0000-0000-0000-0000-000000000001', 'Friesian vs Jersey: Milk Fat Analysis', 'text', null, null, null, 'Friesians yield high quantities, whereas Jerseys yield higher butterfat percentage (4.5%+), ideal for yogurt.', 0, true),
  -- Chapter 2 Lessons
  ('f10c0000-0000-0000-0000-000000000002', 'c10c0000-0000-0000-0000-000000000002', 'Formulating TMR (Total Mixed Ration)', 'text', null, null, null, 'Combine Napier silage, sweet potato vines, cotton seed cake, and mineral supplements in a consistent feed ratio.', 0, false),
  -- Chapter 3 Lessons
  ('f10c0000-0000-0000-0000-000000000003', 'c10c0000-0000-0000-0000-000000000003', 'Mastitis Detection And Sanitation Protocols', 'text', null, null, null, 'Use strip cup tests before milking. Dip teats in disinfectant post-milking and ensure concrete floors are clean.', 0, false),
  -- Chapter 4 Lessons
  ('f10c0000-0000-0000-0000-000000000004', 'c10c0000-0000-0000-0000-000000000004', 'Daily Record Keeping Spreadsheets', 'text', null, null, null, 'Record daily milk yields in liters per cow, feed expenses, insemination dates, and vaccination events.', 0, false);


-- 4. Poultry Farming Essentials (8f6c15a4-858b-4814-ae47-9af3d1f87e77)
INSERT INTO course_chapters (id, course_id, title, description, sort_order, duration_minutes, is_published)
VALUES
  ('c10d0000-0000-0000-0000-000000000001', '8f6c15a4-858b-4814-ae47-9af3d1f87e77', 'Choosing the Right Poultry Breed', 'The success of your poultry farm begins with selecting the right breed for your goals. Broilers are ideal for meat, while layers are bred for eggs.', 0, 10, true),
  ('c10d0000-0000-0000-0000-000000000002', '8f6c15a4-858b-4814-ae47-9af3d1f87e77', 'Housing, Feeding & Daily Management', 'Provide a clean, well-ventilated poultry house with enough space. Supply balanced poultry feed according to the birds age.', 1, 12, true),
  ('c10d0000-0000-0000-0000-000000000003', '8f6c15a4-858b-4814-ae47-9af3d1f87e77', 'Disease Prevention & Biosecurity', 'Preventing disease is easier and less expensive than treating it. Restrict visitors, disinfect equipment, and quarantine new birds.', 2, 11, true),
  ('c10d0000-0000-0000-0000-000000000004', '8f6c15a4-858b-4814-ae47-9af3d1f87e77', 'Harvesting, Egg Collection & Marketing', 'Collect eggs several times a day to keep them clean. Sort eggs by size and build marketing channels with local hotels.', 3, 12, true);

INSERT INTO chapter_lessons (id, chapter_id, title, content_type, video_url, video_type, video_duration_seconds, text_content, sort_order, is_free_preview)
VALUES
  -- Chapter 1 Lessons
  ('f10d0000-0000-0000-0000-000000000001', 'c10d0000-0000-0000-0000-000000000001', 'Broilers vs Layers: Capital vs Return', 'text', null, null, null, 'Broilers reach maturity in 4-6 weeks for rapid returns, while layers require 18 weeks of feeding before laying begins.', 0, true),
  -- Chapter 2 Lessons
  ('f10d0000-0000-0000-0000-000000000002', 'c10d0000-0000-0000-0000-000000000002', 'Setting Up the Chicks Brooder Room', 'text', null, null, null, 'Maintain temperature using charcoal burners or heating bulbs. Line floor with dry wood shavings, never sawdust.', 0, false),
  -- Chapter 3 Lessons
  ('f10d0000-0000-0000-0000-000000000003', 'c10d0000-0000-0000-0000-000000000003', 'Vaccination Schedule for Newcastle & Gumboro', 'text', null, null, null, 'Administer Gumboro vaccine at day 7 and 14. Newcastle vaccine should be administered at day 21 via drinking water.', 0, false),
  -- Chapter 4 Lessons
  ('f10d0000-0000-0000-0000-000000000004', 'c10d0000-0000-0000-0000-000000000004', 'Egg Grading & Quality Controls', 'text', null, null, null, 'Store eggs with pointed end facing down. Grade by small, medium, large sizes. Package in clean paper egg cartons.', 0, false);


-- 5. AI in Agriculture: Farming Smarter with Artificial Intelligence (6249d040-83bf-4360-aa62-712830792ce2)
INSERT INTO course_chapters (id, course_id, title, description, sort_order, duration_minutes, is_published)
VALUES
  ('c10e0000-0000-0000-0000-000000000001', '6249d040-83bf-4360-aa62-712830792ce2', 'Introduction to AI in Agriculture', 'Artificial Intelligence (AI) is transforming modern farming by helping farmers make faster and more informed decisions.', 0, 7, true),
  ('c10e0000-0000-0000-0000-000000000002', '6249d040-83bf-4360-aa62-712830792ce2', 'AI for Crop & Livestock Management', 'AI can detect crop diseases, identify pests, monitor plant health, and recommend suitable treatments using just a smartphone photo.', 1, 8, true),
  ('c10e0000-0000-0000-0000-000000000003', '6249d040-83bf-4360-aa62-712830792ce2', 'Precision Farming with AI', 'AI works together with technologies such as drones, GPS, satellites, and smart sensors to practice precision agriculture.', 2, 7, true),
  ('c10e0000-0000-0000-0000-000000000004', '6249d040-83bf-4360-aa62-712830792ce2', 'The Future of AI in Farming', 'The future of agriculture is increasingly data-driven. AI will support autonomous tractors, robotic harvesting, and price prediction.', 3, 8, true);

INSERT INTO chapter_lessons (id, chapter_id, title, content_type, video_url, video_type, video_duration_seconds, text_content, sort_order, is_free_preview)
VALUES
  -- Chapter 1 Lessons
  ('f10e0000-0000-0000-0000-000000000001', 'c10e0000-0000-0000-0000-000000000001', 'Understanding Neural Networks for Farmers', 'text', null, null, null, 'AI utilizes historical data points to train models. Farmers interact with these models through simple interfaces like SMS or chat.', 0, true),
  -- Chapter 2 Lessons
  ('f10e0000-0000-0000-0000-000000000002', 'c10e0000-0000-0000-0000-000000000002', 'Crop Leaf Disease Image Recognition', 'text', null, null, null, 'Take clear photos of leaf lesions. AI models compare patterns with thousands of samples to diagnose blight, tuta or rust.', 0, false),
  -- Chapter 3 Lessons
  ('f10e0000-0000-0000-0000-000000000003', 'c10e0000-0000-0000-0000-000000000003', 'Optimizing NPK Application Ratios', 'text', null, null, null, 'Sensors stream soil nutrient levels to the cloud. AI algorithms calculate precise fertilizer application volumes, preventing runoff.', 0, false),
  -- Chapter 4 Lessons
  ('f10e0000-0000-0000-0000-000000000004', 'c10e0000-0000-0000-0000-000000000004', 'Predictive Analytics for Wholesale Market Prices', 'text', null, null, null, 'Historical harvest spikes, weather data, and consumption statistics are processed to forecast wholesale commodity pricing.', 0, false);
