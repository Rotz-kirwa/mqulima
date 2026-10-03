-- Migration: Recategorize blog/news articles to new category taxonomy
-- Old categories: Policy & Market, Agronomy & Farm Tips, Agri-Tech & Tools, Weather Advisory, Agri-News
-- New categories: Livestock & Dairy, Crop & Harvest, Special Reports, Agroeconomy, Markets, Farm Life

-- 1. Update column default
ALTER TABLE agritech_news ALTER COLUMN category SET DEFAULT 'Crop & Harvest';

-- 2. Remap existing articles to the closest new category
UPDATE agritech_news SET category = 'Markets' WHERE category = 'Policy & Market';
UPDATE agritech_news SET category = 'Crop & Harvest' WHERE category = 'Agronomy & Farm Tips';
UPDATE agritech_news SET category = 'Special Reports' WHERE category = 'Agri-Tech & Tools';
UPDATE agritech_news SET category = 'Special Reports' WHERE category = 'Weather Advisory';
UPDATE agritech_news SET category = 'Crop & Harvest' WHERE category = 'Agri-News';

-- 3. Catch any remaining unmapped categories
UPDATE agritech_news SET category = 'Crop & Harvest' WHERE category NOT IN (
  'Livestock & Dairy', 'Crop & Harvest', 'Special Reports', 'Agroeconomy', 'Markets', 'Farm Life'
);
