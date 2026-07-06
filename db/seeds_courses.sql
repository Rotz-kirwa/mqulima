-- ============================================================================
-- MQULIMA ACADEMY — COURSE SEED DATA
-- Mirrors the 5 courses defined in src/routes/academy.tsx COURSES_DATA
-- Run after initial schema and seeds.sql
-- ============================================================================

INSERT INTO courses (title, slug, description, level, price)
VALUES
  (
    'Commercial Sukuma Wiki (Collard Greens) Cultivation Masterclass',
    'sukuma-wiki-production',
    'Learn how to establish, grow, and scale a highly profitable Sukuma Wiki (collard greens) enterprise. Covers nursery management, drip irrigation layout, organic pest control, and accessing county wholesale markets.',
    'beginner',
    0.00
  ),
  (
    'Avocado Farming Masterclass',
    'avocado-masterclass',
    'Learn how to establish and manage a highly profitable avocado orchard. Covers site selection, planting, disease management, and harvesting for export markets.',
    'beginner',
    0.00
  ),
  (
    'Dairy Farming Essentials',
    'dairy-farming-essentials',
    'Learn the fundamentals of profitable dairy farming. This masterclass covers breed selection, feeding and nutrition, animal health management, and effective milk production and marketing.',
    'beginner',
    0.00
  ),
  (
    'Poultry Farming Essentials',
    'poultry-farming-essentials',
    'Learn the fundamentals of profitable poultry farming. This masterclass covers breed selection, housing, disease prevention, and effective marketing.',
    'beginner',
    0.00
  ),
  (
    'AI in Agriculture: Farming Smarter with Artificial Intelligence',
    'ai-in-agriculture',
    'Discover how Artificial Intelligence is transforming modern farming. Learn about AI disease detection, precision farming, autonomous tools, and data-driven farm management.',
    'all_levels',
    0.00
  )
ON CONFLICT (slug) DO NOTHING;
