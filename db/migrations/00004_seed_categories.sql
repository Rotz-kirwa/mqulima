-- ============================================================================
-- DB MIGRATION: 00004_seed_categories.sql
-- Seeds product categories and updates existing products to have correct category_id.
-- ============================================================================

-- 1. Insert product categories
INSERT INTO product_categories (name, slug, pos_category_ref) VALUES
  ('Seeds & Seedlings', 'seeds-seedlings', 'Seeds'),
  ('Animal Feeds', 'animal-feeds', 'Feeds'),
  ('Planting', 'planting', 'Fertilizers'),
  ('Top Dressing', 'top-dressing', 'Fertilizers'),
  ('Organic fertilizer', 'organic-fertilizer', 'Fertilizers'),
  ('Foliar Fertilizer', 'foliar-fertilizer', 'Fertilizers'),
  ('Pesticides', 'pesticides', 'CropHealth'),
  ('Growth Catalysts', 'growth-catalysts', 'CropHealth'),
  ('Biostimulants', 'biostimulants', 'CropHealth'),
  ('Tools', 'tools', 'Tools'),
  ('Implements', 'implements', 'Tools'),
  ('Machinery', 'machinery', 'Tools'),
  ('Domestic Animal pharmacy', 'domestic-animal-pharmacy', 'Vet'),
  ('Animal pesticides', 'animal-pesticides', 'Vet'),
  ('Supplements', 'supplements', 'Vet'),
  ('Sewage & Excreta', 'sewage-excreta', 'CropHealth')
ON CONFLICT (slug) DO NOTHING;

-- 2. Update existing products to reference these categories
UPDATE products
SET category_id = (SELECT id FROM product_categories WHERE name = 'Planting')
WHERE slug = 'mavuno-planting-fertilizer';

UPDATE products
SET category_id = (SELECT id FROM product_categories WHERE name = 'Seeds & Seedlings')
WHERE slug = 'dk-8031-hybrid-maize-seed';

UPDATE products
SET category_id = (SELECT id FROM product_categories WHERE name = 'Pesticides')
WHERE slug = 'ridomil-gold-mz-68wg';

UPDATE products
SET category_id = (SELECT id FROM product_categories WHERE name = 'Domestic Animal pharmacy')
WHERE slug = 'maclick-super-dewormer';

UPDATE products
SET category_id = (SELECT id FROM product_categories WHERE name = 'Tools')
WHERE slug = 'knapsack-sprayer-16l';
