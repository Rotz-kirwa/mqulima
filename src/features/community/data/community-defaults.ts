import type { CommunityPost, SokoListing, PulsePost, FarmerProfile } from "../types";

export const DEFAULT_SUGGESTED_FARMERS: FarmerProfile[] = [
  {
    username: "@mqulima_wanjiku",
    name: "Mary Wanjiku",
    country: "Kenya",
    county: "Nyandarua",
    natureOfAgriculture: "Commercial Potato & Vegetable Producer",
    interests: ["Horticulture", "Certified Seeds", "Cold Storage"],
    crops: ["Shangi Potatoes", "Cabbages", "Carrots"],
    livestock: [],
    yearsFarming: 8,
    certifications: ["Potato Multiplication Certificate (ADC)", "Horticultural Exporter"],
    reputationScore: 2150,
    followersCount: 245,
    followers: ["@mqulima_samuel", "@mqulima_mutiso", "@mqulima_mwangi"],
    avatarUrl: "/images/farmer_grace.webp",
    coverImage: "/images/mkulima_hero_farm.webp",
    bio: "Certified seed potato multiplier in Ol Kalou. Scaling commercial yields using localized moisture sensors and precision fertilizer top-dressing.",
    website: "https://wanjikufarms.co.ke",
    phone: "+254712345678",
    email: "mary.wanjiku@mqulima.co.ke",
    farmingActivities: "Harvesting 45 bags of pristine Shangi potato tubers ready for transit to Nairobi Wakulima market.",
    farmingPhotos: [
      "/images/mkulima_hero_farm.webp",
      "/images/farm_tools.webp"
    ],
    joinedDate: "2024-01-15"
  },
  {
    username: "@mqulima_mutiso",
    name: "Grace Mutiso",
    country: "Kenya",
    county: "Machakos",
    natureOfAgriculture: "Organic Fruit & Avocado Exporter",
    interests: ["Phytosanitary Safety", "Apiculture", "Dryland Farming"],
    crops: ["Apple Mangoes", "Avocados", "French Beans"],
    livestock: ["Beekeeping"],
    yearsFarming: 12,
    certifications: ["EU Phytosanitary Inspector Cert", "Apiculture Specialist"],
    reputationScore: 3120,
    followersCount: 198,
    followers: ["@mqulima_wanjiku", "@mqulima_kiprono"],
    avatarUrl: "/images/farmer_joy.webp",
    coverImage: "/images/home-ecosystem.webp",
    bio: "Commercial horticulture in Masii, Machakos. Focused on pesticide-free mango orchards and export-grade avocados.",
    website: "",
    phone: "+254722987654",
    email: "grace.mutiso@mqulima.co.ke",
    farmingActivities: "Managing 350 apple mango trees under pheromone trap insect control.",
    farmingPhotos: ["https://images.unsplash.com/photo-1622383563227-04401ab4e5ea?w=800"],
    joinedDate: "2024-02-01"
  },
  {
    username: "@mqulima_samuel",
    name: "Samuel Kirwa",
    country: "Kenya",
    county: "Uasin Gishu",
    natureOfAgriculture: "Smart Cereal & Oilseed Agro-Entrepreneur",
    interests: ["Precision Agriculture", "IoT Soil Sensors", "Canola Production"],
    crops: ["Canola", "Wheat", "Yellow Maize"],
    livestock: ["Dairy Cattle"],
    yearsFarming: 9,
    certifications: ["Smart Irrigation Engineer", "Agronomy Peer Lead"],
    reputationScore: 4200,
    followersCount: 380,
    followers: ["@mqulima_wanjiku", "@mqulima_kiprono", "@mqulima_mutiso"],
    avatarUrl: "/images/farmer_samuel.webp",
    coverImage: "/images/mkulima_hero_farm.webp",
    bio: "Grain and canola producer in Moiben. Pioneering solar-powered drip irrigation and automated moisture telemetry in the North Rift.",
    website: "",
    phone: "+254701234567",
    email: "samuel.kirwa@mqulima.co.ke",
    farmingActivities: "Calibrating smart drip irrigation sensors across wheat and canola grids.",
    farmingPhotos: [
      "/images/farmers_illustration.webp",
      "/images/home-ecosystem.webp"
    ],
    joinedDate: "2023-11-20"
  },
  {
    username: "@mqulima_nduku",
    name: "Catherine Nduku",
    country: "Kenya",
    county: "Machakos",
    natureOfAgriculture: "Greenhouse Horticulture Specialist",
    interests: ["Drip Irrigation", "Greenhouse Tomatoes", "Seed Selection"],
    crops: ["Tomatoes", "Capsicum", "Onions"],
    livestock: ["Poultry (Kienyeji)"],
    yearsFarming: 7,
    certifications: ["Greenhouse Crop Production Specialist"],
    reputationScore: 1840,
    followersCount: 156,
    followers: ["@mqulima_samuel", "@mqulima_mutiso"],
    avatarUrl: "/images/farmer_grace.webp",
    coverImage: "/images/home-ecosystem.webp",
    bio: "Greenhouse grower in Mwala. Specializing in high-yield indeterminate tomato hybrids and automated foliar feeding.",
    website: "",
    phone: "+254711223344",
    email: "catherine.nduku@mqulima.co.ke",
    farmingActivities: "Harvesting greenhouse Anna F1 tomatoes with zero blossom end rot.",
    farmingPhotos: ["https://images.unsplash.com/photo-1592417817098-8f3d6eb19675?w=800"],
    joinedDate: "2024-03-10"
  },
  {
    username: "@mqulima_kiprono",
    name: "David Kiprono",
    country: "Kenya",
    county: "Kericho",
    natureOfAgriculture: "Specialty Tea & High-Elevation Orchard Grower",
    interests: ["Export Certification", "Water Harvesting", "Tea Processing"],
    crops: ["Purple Tea", "Hass Avocados"],
    livestock: ["Dairy Goats"],
    yearsFarming: 5,
    certifications: ["Smart Water Management (KALRO)"],
    reputationScore: 980,
    followersCount: 112,
    followers: ["@mqulima_samuel", "@mqulima_nduku"],
    avatarUrl: "/images/farmer_david.webp",
    coverImage: "/images/mkulima_hero_farm.webp",
    bio: "Highland grower in Kapsoit, Kericho. Passionate about purple tea agro-processing and sustainable cooperative exports.",
    website: "",
    phone: "+254733445566",
    email: "david.kiprono@mqulima.co.ke",
    farmingActivities: "Packaging first export container of artisan purple tea for European distributors.",
    farmingPhotos: ["https://images.unsplash.com/photo-1563822249548-9a72b6353cd1?w=800"],
    joinedDate: "2024-04-05"
  }
];

export const DEFAULT_SHOWCASE_POSTS: CommunityPost[] = [
  {
    id: "ec851063-44f4-4e29-a2fb-9c459e99e10c",
    author: {
      username: "@mqulima_kosgeikiprono",
      name: "Kosgei Kiprono",
      country: "Kenya",
      county: "Elgeyo-Marakwet",
      natureOfAgriculture: "Crop Farming (Horticulture)",
      interests: ["Horticulture", "Potato Farming"],
      crops: ["Potatoes"],
      livestock: [],
      yearsFarming: 3,
      certifications: [],
      reputationScore: 120,
      followersCount: 18,
      followers: [],
      avatarUrl: "https://api.dicebear.com/7.x/initials/svg?seed=Kosgei%20Kiprono&backgroundColor=1a5438&textColor=ffffff",
      coverImage: "/images/mkulima_hero_farm.webp",
      bio: "Potato and horticulture farmer in Elgeyo-Marakwet.",
      website: "",
      phone: "+254718646944",
      email: "kosgenick@gmail.com",
      farmingActivities: "Harvesting fresh Irish potatoes in Eldoret/Elgeyo-Marakwet.",
      farmingPhotos: [
        "/images/community/ec851063-44f4-4e29-a2fb-9c459e99e10c-0.webp"
      ],
      joinedDate: "2026-09-12"
    },
    title: "Agribusiness Leadership & Farmer Cooperative Workshop — Eldoret",
    body: "Engaging capacity-building session at Eka Hotel, Eldoret with fellow farmers, young agri-preneurs, and cooperative leaders. Focused on sustainable market linkages, farmer governance, and modern agronomic value chains. Great insights on building resilient agricultural communities!",
    category: "Success Story",
    images: [
      "/images/community/ec851063-44f4-4e29-a2fb-9c459e99e10c-0.webp"
    ],
    likes: 2,
    hasLiked: false,
    hasSaved: false,
    comments: [],
    cropsTagged: ["Agribusiness", "FarmerEmpowerment", "CapacityBuilding"],
    livestockTagged: [],
    location: "📍 Eldoret, Uasin Gishu",
    createdAt: "2026-09-12"
  }
];

export const DEFAULT_SOKO_LISTINGS: SokoListing[] = [
  {
    id: "s1",
    author: DEFAULT_SUGGESTED_FARMERS[0],
    commodity: "Certified Shangi Seed Potatoes",
    type: "crop",
    price: 3200,
    quantity: "50 Bags (50kg)",
    location: "Ol Kalou, Nyandarua",
    images: ["https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=800"],
    description: "Grade 1 certified Shangi seed tubers. Sprouted and disease-free. Ready for immediate planting.",
    phone: "+254712345678",
    status: "available",
    createdAt: "Yesterday"
  },
  {
    id: "s2",
    author: DEFAULT_SUGGESTED_FARMERS[1],
    commodity: "Export Quality Apple Mangoes",
    type: "crop",
    price: 180,
    quantity: "2,000 kg",
    location: "Masii, Machakos",
    images: ["https://images.unsplash.com/photo-1622383563227-04401ab4e5ea?w=800"],
    description: "Firm, sweet, pesticide-free apple mangoes. Freshly hand-picked. Ideal for retail markets and exports.",
    phone: "+254722987654",
    status: "available",
    createdAt: "2 days ago"
  },
  {
    id: "s3",
    author: DEFAULT_SUGGESTED_FARMERS[2],
    commodity: "Dry White Maize (Clean Grain)",
    type: "crop",
    price: 3400,
    quantity: "120 Bags (90kg)",
    location: "Moiben, Uasin Gishu",
    images: ["https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800"],
    description: "Moisture content tested at 13.2%. Aflatoxin-free guaranteed, fumigated and stored in hermetic bags.",
    phone: "+254701234567",
    status: "available",
    createdAt: "3 days ago"
  },
  {
    id: "s4",
    author: DEFAULT_SUGGESTED_FARMERS[4],
    commodity: "Fresh Farm Raw Milk",
    type: "livestock",
    price: 52,
    quantity: "350 Litres/Day",
    location: "Kapsoit, Kericho",
    images: ["/images/home-ecosystem.webp"],
    description: "High butterfat organic dairy milk from pasture-fed Friesian and Ayrshire cows. Morning delivery available.",
    phone: "+254733445566",
    status: "available",
    createdAt: "4 days ago"
  }
];

export const DEFAULT_PULSE_POSTS: PulsePost[] = [
  {
    id: "pulse-1",
    title: "Kenya Maize Prices Reach 3-Year High Amidst Regional Demand",
    content: "Wholesale maize prices in Eldoret and Nakuru have reached KES 3,800 per 90kg bag, driven by export flows and tight regional balances.",
    category: "Market Trend",
    source: "https://mqulima.com/blog/kenya-maize-prices-3-year-high-2026",
    date: "2026-10-12"
  },
  {
    id: "pulse-2",
    title: "Subsidized Fertilizer Voucher Verification Now Live Across 47 Counties",
    content: "The Ministry of Agriculture has opened phase-2 voucher redemption for registered smallholder farmers at NCPB depots.",
    category: "Policy Update",
    source: "https://mqulima.com/blog/subsidized-dairy-feed-policy-2026",
    date: "2026-10-11"
  },
  {
    id: "pulse-3",
    title: "Fall Armyworm Alert in Short-Rains Maize: Recommended Bio-Interventions",
    content: "KALRO extension advisory urges early scouting at knee-high stage and deployment of bio-larvicides to protect yield potential.",
    category: "Agronomy Alert",
    source: "https://mqulima.com/blog/uasin-gishu-cooperatives-mobile-agronomy-40-percent",
    date: "2026-10-10"
  }
];
