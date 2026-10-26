-- Migration: 00066_create_business_profile.sql
-- Description: Authoritative Business Profile & Settings for Mqulima Platform
-- Stores company information, contact details, operating hours, gallery, FAQs, policies, and Google Business Profile links

CREATE TABLE IF NOT EXISTS business_profile (
  id VARCHAR(50) PRIMARY KEY DEFAULT 'default',
  business_name VARCHAR(255) NOT NULL DEFAULT 'Mqulima',
  legal_name VARCHAR(255) DEFAULT 'Kirgit Agri Enterprises Limited',
  brand_tagline VARCHAR(255) DEFAULT 'Africa''s 360° agriculture ecosystem',
  brand_slogan VARCHAR(255) DEFAULT 'Taking you first class',
  primary_category VARCHAR(150) NOT NULL DEFAULT 'Agricultural Supply Outlet & Services',
  short_description TEXT NOT NULL DEFAULT 'Empowering Kenyan farmers with verified agronomy knowledge, certified seeds and fertilizers, precision weather tools, and vetted agricultural specialists.',
  full_overview TEXT NOT NULL DEFAULT 'Founded in Eldoret, Mqulima is Africa''s premier 360° digital farming ecosystem. We connect smallholders, commercial growers, and agro-dealers directly with certified inputs, on-demand agronomy specialists, precision climate radar, and transparent farm-to-market trade linkages across all 47 counties of Kenya.',
  phone_primary VARCHAR(50) NOT NULL DEFAULT '+254 723 346 134',
  phone_secondary VARCHAR(50) DEFAULT '+254 718 646 944',
  email_primary VARCHAR(150) NOT NULL DEFAULT 'info@mqulima.com',
  email_support VARCHAR(150) NOT NULL DEFAULT 'support@mqulima.com',
  whatsapp_number VARCHAR(50) NOT NULL DEFAULT '254723346134',
  address_street VARCHAR(255) NOT NULL DEFAULT 'Junction, Eldoret–Iten Highway',
  address_city VARCHAR(100) NOT NULL DEFAULT 'Eldoret',
  address_county VARCHAR(100) NOT NULL DEFAULT 'Uasin Gishu',
  address_postal_code VARCHAR(50) DEFAULT '30100',
  address_country VARCHAR(100) NOT NULL DEFAULT 'Kenya',
  latitude NUMERIC(10, 7) DEFAULT 0.5143000,
  longitude NUMERIC(10, 7) DEFAULT 35.2698000,
  maps_url TEXT NOT NULL DEFAULT 'https://maps.google.com/?q=Junction,+Eldoret+Iten+Highway',
  service_areas TEXT[] NOT NULL DEFAULT ARRAY['Eldoret', 'Uasin Gishu County', 'Trans Nzoia County', 'Elgeyo-Marakwet County', 'Nandi County', 'Nakuru County', 'Nationwide Delivery across Kenya'],
  operating_hours JSONB NOT NULL DEFAULT '[
    {"day": "Monday", "open": "08:00", "close": "18:00", "closed": false},
    {"day": "Tuesday", "open": "08:00", "close": "18:00", "closed": false},
    {"day": "Wednesday", "open": "08:00", "close": "18:00", "closed": false},
    {"day": "Thursday", "open": "08:00", "close": "18:00", "closed": false},
    {"day": "Friday", "open": "08:00", "close": "18:00", "closed": false},
    {"day": "Saturday", "open": "08:00", "close": "13:00", "closed": false},
    {"day": "Sunday", "open": "00:00", "close": "00:00", "closed": true}
  ]'::jsonb,
  logo_url TEXT NOT NULL DEFAULT '/mqulima-logo.png',
  cover_image_url TEXT NOT NULL DEFAULT '/images/about/hero.webp',
  gallery_images TEXT[] NOT NULL DEFAULT ARRAY[
    '/hero-cinematic.webp',
    '/hero-aerial.webp',
    '/services_crop_production.webp',
    '/services_soil_analysis.webp',
    '/services_value_addition.webp',
    '/services_veterinary_care.webp',
    '/mqulima_soko_crop.webp',
    '/mqulima_news_banner.webp'
  ],
  social_links JSONB NOT NULL DEFAULT '{
    "twitter": "https://x.com/_mqulima",
    "tiktok": "https://tiktok.com/@_mqulima",
    "linkedin": "https://linkedin.com/company/mqulima-hub",
    "instagram": "https://instagram.com/mqulima",
    "facebook": "",
    "youtube": ""
  }'::jsonb,
  faqs JSONB NOT NULL DEFAULT '[
    {
      "q": "Where is Mqulima physically located?",
      "a": "Our primary headquarters and distribution depot are situated at Junction, along the Eldoret–Iten Highway in Eldoret, Uasin Gishu County, Kenya. Visitors and farmers are welcome during official business hours."
    },
    {
      "q": "What products and agricultural inputs does Mqulima supply?",
      "a": "Mqulima supplies certified seeds, genuine crop protection chemicals (fungicides, herbicides, insecticides), specialized fertilizers, animal feeds, veterinary health products, and farm equipment directly from verified manufacturers including Yara, Osho Chemical, Unga Farmcare, and Truvets."
    },
    {
      "q": "What agricultural services can I book through Mqulima?",
      "a": "We provide certified soil nutrient testing, veterinary health diagnostics, livestock feed formulation, silage harvesting and shredding, artificial insemination (AI) cattle breeding, greenhouse construction, and borehole drilling across the Rift Valley and Western Kenya."
    },
    {
      "q": "Does Mqulima deliver farm inputs outside Eldoret?",
      "a": "Yes. While our primary regional hub is in Eldoret, we fulfill orders across all 47 counties of Kenya through vetted courier and agricultural freight partners with tracking and SMS delivery updates."
    },
    {
      "q": "What payment methods are supported?",
      "a": "We accept Safaricom M-Pesa STK Push payments, direct Paystack card and bank payments, and official bank remittances. All online transactions generate verified SMS and electronic receipts."
    },
    {
      "q": "How does Mqulima guarantee the authenticity of farm inputs?",
      "a": "All seeds and agrochemicals in our AgroShop catalog are sourced directly from registered primary distributors and verified against national regulatory standards (KEPHIS and PCPB). We maintain a strict zero-counterfeit guarantee."
    }
  ]'::jsonb,
  business_policies JSONB NOT NULL DEFAULT '{
    "delivery": "Same-day regional dispatch for Eldoret and Uasin Gishu; 24-48 hours delivery across Rift Valley, Western, and Nairobi; up to 72 hours for remote counties. Orders are dispatched from our Eldoret Regional Depot.",
    "payments": "Cashless payments via Safaricom M-Pesa STK Push, Paystack debit/credit cards, and verified merchant paybills. Cash on delivery is not accepted for dispatched bulk cargo.",
    "returns": "Unopened, sealed, and undamaged goods with tamper seals intact may be returned within 48 hours of receipt accompanied by the official Mqulima digital invoice.",
    "warranty": "All certified seed varieties are covered under standard germination guarantees provided by primary breeders. Technical service work carries vetted expert quality warranties."
  }'::jsonb,
  google_place_id VARCHAR(255) DEFAULT '',
  google_review_url TEXT DEFAULT 'https://maps.google.com/?q=Junction,+Eldoret+Iten+Highway',
  is_published BOOLEAN NOT NULL DEFAULT true,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by VARCHAR(255) DEFAULT 'system'
);

-- Seed single default row if not exists
INSERT INTO business_profile (id)
VALUES ('default')
ON CONFLICT (id) DO NOTHING;

-- Index for instant lookup
CREATE INDEX IF NOT EXISTS idx_business_profile_published ON business_profile (id, is_published);
