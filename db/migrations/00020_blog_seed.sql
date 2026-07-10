-- ============================================================================
-- DB MIGRATION: 00020_blog_seed.sql
-- Adds excerpt column to blog_posts and seeds initial blog authors + posts
-- ============================================================================

-- 1. Add excerpt column if it does not exist
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS excerpt TEXT;

-- 2. Seed blog_authors using the existing super_admin profile
-- We use 4 virtual author bios linked to the super_admin profile_id
-- (all share the same profile; this is a demo setup)
DO $$
DECLARE
  admin_profile_id UUID;
  author1_id UUID;
  author2_id UUID;
  author3_id UUID;
  author4_id UUID;
BEGIN
  -- Get the super admin profile id
  SELECT id INTO admin_profile_id FROM profiles WHERE role::text = 'super_admin' LIMIT 1;

  IF admin_profile_id IS NULL THEN
    RAISE NOTICE 'No super_admin profile found, skipping blog seed.';
    RETURN;
  END IF;

  -- Skip if authors already seeded
  IF (SELECT COUNT(*) FROM blog_authors) > 0 THEN
    RAISE NOTICE 'Blog authors already seeded, skipping.';
    RETURN;
  END IF;

  -- Insert 4 authors
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

  -- 3. Seed initial blog posts
  INSERT INTO blog_posts (author_id, title, slug, cover_image, body, excerpt, category, status, published_at)
  VALUES
  (
    author3_id,
    'Kenya''s Maize Prices Hit 3-Year High — What Smallholder Farmers Must Do Now',
    'kenya-maize-prices-3-year-high-2026',
    'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=800',
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
    'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=500',
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
    'https://images.unsplash.com/photo-1599599810769-bcde5a160d32?w=500',
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
    'https://images.unsplash.com/photo-1570042225831-d98fa7577f1e?w=500',
    'Dairy farming is capital-intensive. Feeds alone account for up to 70% of operational costs. The new agricultural policy introduces credit subsidies specifically targeting livestock feed millers and cooperative dairies.

Under this bill, registered dairy groups can access capital at a subsidized rate of 6% per annum. This capital must be spent on raw feed materials (yellow maize, cotton seed cake, wheat pollard) to manufacture high-yield dairy meal in-house.

By building feed processing bays at cooperative collection points, farmers can purchase quality feeds at up to 25% below commercial agrovet retail pricing.',
    'How the government''s subsidized interest rate program affects loan applications for smallholder dairy cooperatives.',
    'Policy & Finance',
    'published',
    NOW() - INTERVAL '26 days'
  );

  RAISE NOTICE 'Blog seed completed: 4 authors, 4 posts inserted.';
END $$;
