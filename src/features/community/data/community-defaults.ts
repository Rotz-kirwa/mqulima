import type { CommunityPost, SokoListing, PulsePost, FarmerProfile } from "../types";

export const DEFAULT_SUGGESTED_FARMERS: FarmerProfile[] = [
  {
    username: "@mqulima_kosgeikiprono",
    name: "Kosgei Kiprono",
    country: "Kenya",
    county: "Elgeyo-Marakwet",
    natureOfAgriculture: "Crop Farming (Horticulture)",
    interests: ["Horticulture", "Potato Farming", "Commercial Production"],
    crops: ["Irish Potatoes", "Cabbages", "Vegetables"],
    livestock: [],
    yearsFarming: 3,
    certifications: ["Good Agricultural Practices (GAP)"],
    reputationScore: 1250,
    followersCount: 18,
    followers: ["@mqulima_eliudrotich", "@mqulima_kipchumbakipruto"],
    avatarUrl: "https://api.dicebear.com/7.x/initials/svg?seed=Kosgei%20Kiprono&backgroundColor=1a5438&textColor=ffffff",
    coverImage: "/images/mkulima_hero_farm.webp",
    bio: "Potato and commercial horticulture grower in Elgeyo-Marakwet. Dedicated to high-yield harvests and direct farmer-to-market trade.",
    website: "",
    phone: "+254718646944",
    email: "kosgenick@gmail.com",
    farmingActivities: "Harvesting fresh Irish potatoes in Eldoret and Elgeyo-Marakwet ready for wholesale transit.",
    farmingPhotos: [
      "/images/community/ec851063-44f4-4e29-a2fb-9c459e99e10c-0.webp",
      "/images/farm_tools.webp"
    ],
    joinedDate: "2026-09-12"
  },
  {
    username: "@mqulima_eliudrotich",
    name: "Eliud Rotich",
    country: "Kenya",
    county: "Bungoma",
    natureOfAgriculture: "Poultry Farming",
    interests: ["Poultry Farming", "Biosecurity", "Feed Formulation"],
    crops: ["Maize", "Sorghum"],
    livestock: ["Improved Kienyeji", "Broilers"],
    yearsFarming: 4,
    certifications: ["Poultry Biosecurity & Flock Management"],
    reputationScore: 980,
    followersCount: 14,
    followers: ["@mqulima_kosgeikiprono", "@mqulima_kipchumbakipruto"],
    avatarUrl: "https://api.dicebear.com/7.x/initials/svg?seed=Eliud%20Rotich&backgroundColor=1a5438&textColor=ffffff",
    coverImage: "/images/home-ecosystem.webp",
    bio: "Poultry entrepreneur in Bungoma managing disease-free flocks, egg production, and high-protein local feed formulation.",
    website: "",
    phone: "+254791260817",
    email: "eliudkirwa451@gmail.com",
    farmingActivities: "Vaccination and flock growth monitoring for improved indigenous chicken flocks.",
    farmingPhotos: [
      "/images/home-ecosystem.webp"
    ],
    joinedDate: "2026-09-12"
  },
  {
    username: "@mqulima_kipchumbakipruto",
    name: "Kipchumba Kipruto",
    country: "Kenya",
    county: "Elgeyo-Marakwet",
    natureOfAgriculture: "Mixed Farming",
    interests: ["Mixed Farming", "Dairy Cattle", "Silage Making"],
    crops: ["Maize", "Beans", "Boma Rhodes"],
    livestock: ["Dairy Cattle"],
    yearsFarming: 5,
    certifications: ["Sustainable Mixed Farming Systems"],
    reputationScore: 1100,
    followersCount: 12,
    followers: ["@mqulima_kosgeikiprono", "@mqulima_eliudrotich"],
    avatarUrl: "https://api.dicebear.com/7.x/initials/svg?seed=Kipchumba%20Kipruto&backgroundColor=1a5438&textColor=ffffff",
    coverImage: "/images/mkulima_hero_farm.webp",
    bio: "Mixed farming producer in Elgeyo-Marakwet integrating dairy cattle management with seasonal grain and fodder production.",
    website: "",
    phone: "+254702032109",
    email: "denniskipchumba98@gmail.com",
    farmingActivities: "Silage preparation and high-protein fodder preservation for dairy herds during dry seasons.",
    farmingPhotos: [
      "/images/mkulima_hero_farm.webp"
    ],
    joinedDate: "2026-09-27"
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
    commodity: "Fresh Harvest Irish Potatoes",
    type: "crop",
    price: 3500,
    quantity: "60 Bags (50kg)",
    location: "Eldoret, Elgeyo-Marakwet",
    images: ["https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=800"],
    description: "Grade 1 fresh Irish potato tubers, harvested directly from Elgeyo-Marakwet. Ready for market distribution.",
    phone: "+254718646944",
    status: "available",
    createdAt: "Yesterday"
  },
  {
    id: "s2",
    author: DEFAULT_SUGGESTED_FARMERS[1],
    commodity: "Improved Kienyeji Fertilized Eggs",
    type: "livestock",
    price: 650,
    quantity: "40 Trays",
    location: "Bungoma",
    images: ["https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?w=800"],
    description: "Fresh fertilized eggs from vaccinated, free-range improved Kienyeji parent stock. High hatchability rate.",
    phone: "+254791260817",
    status: "available",
    createdAt: "2 days ago"
  },
  {
    id: "s3",
    author: DEFAULT_SUGGESTED_FARMERS[2],
    commodity: "High Protein Boma Rhodes Hay Bales",
    type: "crop",
    price: 380,
    quantity: "250 Bales",
    location: "Iten, Elgeyo-Marakwet",
    images: ["https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800"],
    description: "Clean, tightly baled Boma Rhodes grass. Sun-cured with high protein content for dairy cattle feeding.",
    phone: "+254702032109",
    status: "available",
    createdAt: "3 days ago"
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
