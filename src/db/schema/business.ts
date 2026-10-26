import { pgTable, varchar, text, numeric, jsonb, boolean, timestamp } from "drizzle-orm/pg-core";

export interface OperatingHourDay {
  day: string;
  open: string;
  close: string;
  closed: boolean;
}

export interface BusinessSocialLinks {
  twitter?: string;
  tiktok?: string;
  linkedin?: string;
  instagram?: string;
  facebook?: string;
  youtube?: string;
}

export interface BusinessFaqItem {
  q: string;
  a: string;
}

export interface BusinessPolicies {
  delivery?: string;
  payments?: string;
  returns?: string;
  warranty?: string;
}

export const businessProfile = pgTable("business_profile", {
  id: varchar("id", { length: 50 }).primaryKey().default("default"),
  businessName: varchar("business_name", { length: 255 }).notNull().default("Mqulima"),
  legalName: varchar("legal_name", { length: 255 }).default("Kirgit Agri Enterprises Limited"),
  brandTagline: varchar("brand_tagline", { length: 255 }).default("Africa's 360° agriculture ecosystem"),
  brandSlogan: varchar("brand_slogan", { length: 255 }).default("Taking you first class"),
  primaryCategory: varchar("primary_category", { length: 150 }).notNull().default("Agricultural Supply Outlet & Services"),
  shortDescription: text("short_description").notNull().default("Empowering Kenyan farmers with verified agronomy knowledge, certified seeds and fertilizers, precision weather tools, and vetted agricultural specialists."),
  fullOverview: text("full_overview").notNull().default("Founded in Eldoret, Mqulima is Africa's premier 360° digital farming ecosystem. We connect smallholders, commercial growers, and agro-dealers directly with certified inputs, on-demand agronomy specialists, precision climate radar, and transparent farm-to-market trade linkages across all 47 counties of Kenya."),
  phonePrimary: varchar("phone_primary", { length: 50 }).notNull().default("+254 723 346 134"),
  phoneSecondary: varchar("phone_secondary", { length: 50 }),
  emailPrimary: varchar("email_primary", { length: 150 }).notNull().default("info@mqulima.com"),
  emailSupport: varchar("email_support", { length: 150 }).notNull().default("support@mqulima.com"),
  whatsappNumber: varchar("whatsapp_number", { length: 50 }).notNull().default("254723346134"),
  addressStreet: varchar("address_street", { length: 255 }).notNull().default("Junction, Eldoret–Iten Highway"),
  addressCity: varchar("address_city", { length: 100 }).notNull().default("Eldoret"),
  addressCounty: varchar("address_county", { length: 100 }).notNull().default("Uasin Gishu"),
  addressPostalCode: varchar("address_postal_code", { length: 50 }).default("30100"),
  addressCountry: varchar("address_country", { length: 100 }).default("Kenya"),
  latitude: numeric("latitude", { precision: 10, scale: 7 }).default("0.5143000"),
  longitude: numeric("longitude", { precision: 10, scale: 7 }).default("35.2698000"),
  mapsUrl: text("maps_url").default("https://maps.google.com/?q=Junction,+Eldoret+Iten+Highway"),
  serviceAreas: text("service_areas").array().default([
    "Eldoret",
    "Uasin Gishu County",
    "Trans Nzoia County",
    "Elgeyo-Marakwet County",
    "Nandi County",
    "Nakuru County",
    "Nationwide Delivery across Kenya"
  ]),
  operatingHours: jsonb("operating_hours").$type<OperatingHourDay[]>().default([
    { day: "Monday", open: "08:00", close: "18:00", closed: false },
    { day: "Tuesday", open: "08:00", close: "18:00", closed: false },
    { day: "Wednesday", open: "08:00", close: "18:00", closed: false },
    { day: "Thursday", open: "08:00", close: "18:00", closed: false },
    { day: "Friday", open: "08:00", close: "18:00", closed: false },
    { day: "Saturday", open: "08:00", close: "13:00", closed: false },
    { day: "Sunday", open: "00:00", close: "00:00", closed: true }
  ]),
  logoUrl: text("logo_url").default("/mqulima-logo.png"),
  coverImageUrl: text("cover_image_url").default("/images/about/hero.webp"),
  galleryImages: text("gallery_images").array().default([
    "/hero-cinematic.webp",
    "/hero-aerial.webp",
    "/services_crop_production.webp",
    "/services_soil_analysis.webp",
    "/services_value_addition.webp",
    "/services_veterinary_care.webp",
    "/mqulima_soko_crop.webp",
    "/mqulima_news_banner.webp"
  ]),
  socialLinks: jsonb("social_links").$type<BusinessSocialLinks>().default({
    twitter: "https://x.com/_mqulima",
    tiktok: "https://tiktok.com/@_mqulima",
    linkedin: "https://linkedin.com/company/mqulima-hub",
    instagram: "https://instagram.com/mqulima",
    facebook: "",
    youtube: ""
  }),
  faqs: jsonb("faqs").$type<BusinessFaqItem[]>().default([
    {
      q: "Where is Mqulima physically located?",
      a: "Our primary headquarters and distribution depot are situated at Junction, along the Eldoret–Iten Highway in Eldoret, Uasin Gishu County, Kenya. Visitors and farmers are welcome during official business hours."
    },
    {
      q: "What products and agricultural inputs does Mqulima supply?",
      a: "Mqulima supplies certified seeds, genuine crop protection chemicals (fungicides, herbicides, insecticides), specialized fertilizers, animal feeds, veterinary health products, and farm equipment directly from verified manufacturers including Yara, Osho Chemical, Unga Farmcare, and Truvets."
    },
    {
      q: "What agricultural services can I book through Mqulima?",
      a: "We provide certified soil nutrient testing, veterinary health diagnostics, livestock feed formulation, silage harvesting and shredding, artificial insemination (AI) cattle breeding, greenhouse construction, and borehole drilling across the Rift Valley and Western Kenya."
    },
    {
      q: "Does Mqulima deliver farm inputs outside Eldoret?",
      a: "Yes. While our primary regional hub is in Eldoret, we fulfill orders across all 47 counties of Kenya through vetted courier and agricultural freight partners with tracking and SMS delivery updates."
    },
    {
      q: "What payment methods are supported?",
      a: "We accept Safaricom M-Pesa STK Push payments, direct Paystack card and bank payments, and official bank remittances. All online transactions generate verified SMS and electronic receipts."
    },
    {
      q: "How does Mqulima guarantee the authenticity of farm inputs?",
      a: "All seeds and agrochemicals in our AgroShop catalog are sourced directly from registered primary distributors and verified against national regulatory standards (KEPHIS and PCPB). We maintain a strict zero-counterfeit guarantee."
    }
  ]),
  businessPolicies: jsonb("business_policies").$type<BusinessPolicies>().default({
    delivery: "Same-day regional dispatch for Eldoret and Uasin Gishu; 24-48 hours delivery across Rift Valley, Western, and Nairobi; up to 72 hours for remote counties. Orders are dispatched from our Eldoret Regional Depot.",
    payments: "Cashless payments via Safaricom M-Pesa STK Push, Paystack debit/credit cards, and verified merchant paybills. Cash on delivery is not accepted for dispatched bulk cargo.",
    returns: "Unopened, sealed, and undamaged goods with tamper seals intact may be returned within 48 hours of receipt accompanied by the official Mqulima digital invoice.",
    warranty: "All certified seed varieties are covered under standard germination guarantees provided by primary breeders. Technical service work carries vetted expert quality warranties."
  }),
  googlePlaceId: varchar("google_place_id", { length: 255 }).default(""),
  googleReviewUrl: text("google_review_url").default("https://maps.google.com/?q=Junction,+Eldoret+Iten+Highway"),
  isPublished: boolean("is_published").notNull().default(true),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  updatedBy: varchar("updated_by", { length: 255 }).default("system"),
});

export type BusinessProfileSelect = typeof businessProfile.$inferSelect;
export type BusinessProfileInsert = typeof businessProfile.$inferInsert;
