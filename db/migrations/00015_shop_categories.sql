-- db/migrations/00015_shop_categories.sql

-- Drop and rebuild category system properly if tables exist
DROP TABLE IF EXISTS shop_subcategories CASCADE;
DROP TABLE IF EXISTS shop_categories CASCADE;
DROP TABLE IF EXISTS shop_fields CASCADE;

CREATE TABLE IF NOT EXISTS shop_fields (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  shop_type TEXT NOT NULL CHECK (shop_type IN ('agrovet','specialist','retailers')),
  icon TEXT,
  sort_order INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS shop_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  field_id UUID REFERENCES shop_fields(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  sort_order INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS shop_subcategories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID REFERENCES shop_categories(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  sort_order INTEGER DEFAULT 0
);

-- Add to products table
ALTER TABLE products
ADD COLUMN IF NOT EXISTS field_id UUID REFERENCES shop_fields(id),
ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES shop_categories(id),
ADD COLUMN IF NOT EXISTS subcategory_id UUID REFERENCES shop_subcategories(id),
ADD COLUMN IF NOT EXISTS shop_type TEXT DEFAULT 'agrovet';

-- ═══════════════════════════════
-- SEED: SHOP FIELDS
-- ═══════════════════════════════
INSERT INTO shop_fields (name, slug, shop_type, icon, sort_order) VALUES
('Crop Production',               'crop-production',       'agrovet',    'ti-plant-2',      1),
('Fertilizers',                   'fertilizers',           'agrovet',    'ti-droplet',      2),
('Animal Production',             'animal-production',     'agrovet',    'ti-paw',          3),
('Public Health & Sanitation',    'public-health',         'agrovet',    'ti-shield-check', 4),
('Farm Tools & Machinery',        'farm-tools',            'agrovet',    'ti-tools',        5),
('Domestic Animal Pharmacy',      'animal-pharmacy',       'specialist', 'ti-first-aid-kit',6);

-- ═══════════════════════════════
-- SEED: CATEGORIES
-- ═══════════════════════════════

-- CROP PRODUCTION
WITH f AS (SELECT id FROM shop_fields WHERE slug='crop-production')
INSERT INTO shop_categories (field_id, name, slug, sort_order) VALUES
((SELECT id FROM f), 'Pesticides',        'pesticides',        1),
((SELECT id FROM f), 'Foliar Fertilizer', 'foliar-fertilizer', 2),
((SELECT id FROM f), 'Growth Catalysts',  'growth-catalysts',  3),
((SELECT id FROM f), 'Biostimulants',     'biostimulants',     4),
((SELECT id FROM f), 'Post Harvest',      'post-harvest',      5),
((SELECT id FROM f), 'Seeds & Seedlings', 'seeds-seedlings',   6);

-- FERTILIZERS
WITH f AS (SELECT id FROM shop_fields WHERE slug='fertilizers')
INSERT INTO shop_categories (field_id, name, slug, sort_order) VALUES
((SELECT id FROM f), 'Planting',               'fertilizer-planting',    1),
((SELECT id FROM f), 'Top Dressing',           'fertilizer-top-dressing',2),
((SELECT id FROM f), 'Blended',                'fertilizer-blended',     3),
((SELECT id FROM f), 'Specialized Fertilizers','fertilizer-specialized', 4),
((SELECT id FROM f), 'Organic Fertilizer',     'fertilizer-organic',     5);

-- ANIMAL PRODUCTION
WITH f AS (SELECT id FROM shop_fields WHERE slug='animal-production')
INSERT INTO shop_categories (field_id, name, slug, sort_order) VALUES
((SELECT id FROM f), 'Animal Feeds',     'animal-feeds',     1),
((SELECT id FROM f), 'Animal Pesticides','animal-pesticides',2),
((SELECT id FROM f), 'Supplements',      'supplements',      3);

-- PUBLIC HEALTH
WITH f AS (SELECT id FROM shop_fields WHERE slug='public-health')
INSERT INTO shop_categories (field_id, name, slug, sort_order) VALUES
((SELECT id FROM f), 'Water Treatment',    'water-treatment',  1),
((SELECT id FROM f), 'Sewage & Excreta',   'sewage-excreta',   2),
((SELECT id FROM f), 'Environmental',      'environmental',    3);

-- FARM TOOLS
WITH f AS (SELECT id FROM shop_fields WHERE slug='farm-tools')
INSERT INTO shop_categories (field_id, name, slug, sort_order) VALUES
((SELECT id FROM f), 'Tools',      'tools',      1),
((SELECT id FROM f), 'Implements', 'implements', 2),
((SELECT id FROM f), 'Machinery',  'machinery',  3);

-- SPECIALIST SHOP
WITH f AS (SELECT id FROM shop_fields WHERE slug='animal-pharmacy')
INSERT INTO shop_categories (field_id, name, slug, sort_order) VALUES
((SELECT id FROM f), 'Domestic Animal Pharmacy', 'domestic-pharmacy', 1);

-- ═══════════════════════════════
-- SEED: SUBCATEGORIES
-- ═══════════════════════════════

-- PESTICIDES subcategories
WITH c AS (SELECT id FROM shop_categories WHERE slug='pesticides')
INSERT INTO shop_subcategories (category_id, name, slug, sort_order) VALUES
((SELECT id FROM c),'Fungicides',        'fungicides',        1),
((SELECT id FROM c),'Insecticides',      'insecticides',      2),
((SELECT id FROM c),'Herbicides',        'herbicides',        3),
((SELECT id FROM c),'Foliar Fertilizers','foliar-in-pest',    4),
((SELECT id FROM c),'Nematicides',       'nematicides',       5),
((SELECT id FROM c),'Bactericides',      'bactericides',      6),
((SELECT id FROM c),'Rodenticides',      'rodenticides',      7);

-- FOLIAR FERTILIZER subcategories
WITH c AS (SELECT id FROM shop_categories WHERE slug='foliar-fertilizer')
INSERT INTO shop_subcategories (category_id, name, slug, sort_order) VALUES
((SELECT id FROM c),'Organic',         'foliar-organic',  1),
((SELECT id FROM c),'N, P & K',        'foliar-npk',      2),
((SELECT id FROM c),'Compound Foliar', 'foliar-compound', 3);

-- GROWTH CATALYSTS subcategories
WITH c AS (SELECT id FROM shop_categories WHERE slug='growth-catalysts')
INSERT INTO shop_subcategories (category_id, name, slug, sort_order) VALUES
((SELECT id FROM c),'Hormones','hormones',1),
((SELECT id FROM c),'Microbes', 'microbes', 2);

-- SEEDS subcategories
WITH c AS (SELECT id FROM shop_categories WHERE slug='seeds-seedlings')
INSERT INTO shop_subcategories (category_id, name, slug, sort_order) VALUES
((SELECT id FROM c),'Maize',          'seed-maize',      1),
((SELECT id FROM c),'Onions',         'seed-onions',     2),
((SELECT id FROM c),'Potato',         'seed-potato',     3),
((SELECT id FROM c),'Vegetables',     'seed-vegetables', 4),
((SELECT id FROM c),'Beans',          'seed-beans',      5),
((SELECT id FROM c),'Peas',           'seed-peas',       6),
((SELECT id FROM c),'Tomato',         'seed-tomato',     7),
((SELECT id FROM c),'Watermelon',     'seed-watermelon', 8),
((SELECT id FROM c),'Sorghum',        'seed-sorghum',    9),
((SELECT id FROM c),'Trees',          'seed-trees',      10),
((SELECT id FROM c),'Fruit Seedlings','fruit-seedlings', 11);

-- ORGANIC FERTILIZER subcategories
WITH c AS (SELECT id FROM shop_categories WHERE slug='fertilizer-organic')
INSERT INTO shop_subcategories (category_id, name, slug, sort_order) VALUES
((SELECT id FROM c),'Manure','manure',1);

-- ANIMAL FEEDS subcategories
WITH c AS (SELECT id FROM shop_categories WHERE slug='animal-feeds')
INSERT INTO shop_subcategories (category_id, name, slug, sort_order) VALUES
((SELECT id FROM c),'Fish',         'feed-fish',         1),
((SELECT id FROM c),'Pig',          'feed-pig',          2),
((SELECT id FROM c),'Dairy',        'feed-dairy',        3),
((SELECT id FROM c),'Poultry',      'feed-poultry',      4),
((SELECT id FROM c),'Beef Feedlot', 'feed-beef',         5),
((SELECT id FROM c),'Sheep & Goats','feed-sheep-goats',  6),
((SELECT id FROM c),'Multipurpose', 'feed-multipurpose', 7),
((SELECT id FROM c),'Pasture',      'feed-pasture',      8),
((SELECT id FROM c),'Pet',          'feed-pet',          9);

-- ANIMAL PESTICIDES subcategories
WITH c AS (SELECT id FROM shop_categories WHERE slug='animal-pesticides')
INSERT INTO shop_subcategories (category_id, name, slug, sort_order) VALUES
((SELECT id FROM c),'Pesticides',   'animal-pest',     1),
((SELECT id FROM c),'Dewormers',    'dewormers',       2),
((SELECT id FROM c),'Acaricides',   'acaricides',      3),
((SELECT id FROM c),'Multivitamins','animal-vitamins', 4),
((SELECT id FROM c),'Pharmacy',     'animal-pharmacy-sub',5);

-- SUPPLEMENTS subcategories
WITH c AS (SELECT id FROM shop_categories WHERE slug='supplements')
INSERT INTO shop_subcategories (category_id, name, slug, sort_order) VALUES
((SELECT id FROM c),'Salts',          'salts',          1),
((SELECT id FROM c),'Feed Additives', 'feed-additives', 2),
((SELECT id FROM c),'Multivitamins',  'multivitamins',  3);

-- DOMESTIC PHARMACY subcategories
WITH c AS (SELECT id FROM shop_categories WHERE slug='domestic-pharmacy')
INSERT INTO shop_subcategories (category_id, name, slug, sort_order) VALUES
((SELECT id FROM c),'Antimicrobials',  'antimicrobials', 1),
((SELECT id FROM c),'Antihelminties',  'antihelminties', 2),
((SELECT id FROM c),'Coccidiostats',   'coccidiostats',  3),
((SELECT id FROM c),'Anti-inflammatory','anti-inflam',   4);
