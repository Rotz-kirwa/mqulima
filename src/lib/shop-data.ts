export const AGRICULTURE_TAXONOMY: Record<string, string[] | Record<string, string[]>> = {
  "Seeds & Seedlings": [
    "Maize", "Beans", "Tomatoes", "Potatoes", "Onions", "Watermelon", "Vegetables", "Fruit Seedlings", "Tree Seedlings", "Sorghum", "Peas"
  ],
  "Crop Protection": [
    "Insecticides", "Fungicides", "Herbicides", "Rodenticides", "Nematicides", "Bactericides"
  ],
  "Fertilizers": [
    "Planting", "Top Dressing", "Foliar", "Organic", "Blended", "Specialized"
  ],
  "Plant Growth & Boosters": [
    "Plant Hormones", "Biostimulants", "Microbial Solutions"
  ],
  "Harvest & Storage": [
    "Post Harvest Products", "Crop Preservation", "Storage Solutions"
  ],
  "Animal Farming": {
    "Animal Feed": ["Dairy", "Poultry", "Pig", "Fish", "Sheep", "Goat", "Beef Feedlot", "Pasture", "Pet"],
    "Animal Health": ["Dewormers", "Veterinary Medicines", "Vaccines", "Animal Pesticides", "Vitamins"],
    "Supplements": ["Mineral Salts", "Feed Additives", "Multivitamins"]
  },
  "Farm Equipment": [
    "Hand Tools", "Machinery", "Implements"
  ],
  "Water & Sanitation": [
    "Water Treatment", "Environmental Solutions"
  ]
};

export function cleanDescriptionText(raw: string | null | undefined): string {
  if (!raw) return "";
  return raw
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/\s+/g, " ")
    .trim();
}

export function mapToNewTaxonomy(p: any) {
  let cat = (typeof p.category === "string" ? p.category : "").trim();
  let sub = (typeof p.subcategory === "string" ? p.subcategory : "").trim();
  
  const nameLower = (p.name || "").toLowerCase();
  const descLower = (p.description || "").toLowerCase();
  const catLower = cat.toLowerCase();
  const subLower = sub.toLowerCase();

  // Strip unhelpful POS generic keywords or bad stringified objects
  if (catLower === "single" || catLower === "combo" || catLower === "general" || catLower.includes("[object")) cat = "";
  if (subLower === "single" || subLower === "combo" || subLower === "general" || subLower.includes("[object")) sub = "";

  // 1. Seeds & Seedlings
  if (catLower.includes("seed") || subLower.includes("seed") || nameLower.includes("seed") ||
      nameLower.includes("spinach") || nameLower.includes("fordhook") || nameLower.includes("rio grande") ||
      nameLower.includes("tomato") || nameLower.includes("cabbage") || nameLower.includes("onion") ||
      nameLower.includes("kale") || nameLower.includes("sukuma") || nameLower.includes("carrot")) {
    let subcat = "Vegetables";
    if (nameLower.includes("maize")) subcat = "Maize";
    else if (nameLower.includes("bean")) subcat = "Beans";
    else if (nameLower.includes("tomato") || nameLower.includes("rio grande")) subcat = "Tomatoes";
    else if (nameLower.includes("potato")) subcat = "Potatoes";
    else if (nameLower.includes("onion")) subcat = "Onions";
    else if (nameLower.includes("watermelon")) subcat = "Watermelon";
    else if (nameLower.includes("sorghum")) subcat = "Sorghum";
    else if (nameLower.includes("pea")) subcat = "Peas";
    else if (nameLower.includes("tree")) subcat = "Tree Seedlings";
    else if (nameLower.includes("fruit")) subcat = "Fruit Seedlings";
    return { category: "Seeds & Seedlings", subcategory: subcat };
  }

  // 2. Crop Protection (Agrochemicals)
  if (catLower.includes("pesticide") || subLower.includes("pesticide") || 
      subLower.includes("fungicide") || subLower.includes("insecticide") || 
      subLower.includes("herbicide") || subLower.includes("nematicide") || 
      subLower.includes("bactericide") || subLower.includes("rodenticide") ||
      nameLower.includes("fungicide") || nameLower.includes("insecticide") || 
      nameLower.includes("herbicide") || nameLower.includes("nematicide") ||
      nameLower.includes("weedal") || nameLower.includes("zetanil") || nameLower.includes("tajiri") ||
      nameLower.includes("alphasumu") || nameLower.includes("coopers") || nameLower.includes("acoster") ||
      nameLower.includes("vectoclor") || nameLower.includes("mistress") || nameLower.includes("macarena") ||
      nameLower.includes("hispeid") || nameLower.includes("aquawet") || nameLower.includes("ridomil") ||
      nameLower.includes("actara") || nameLower.includes("roundup") || nameLower.includes("dudu")) {
    let subcat = "Insecticides";
    if (subLower.includes("fungi") || nameLower.includes("fungi") || nameLower.includes("zetanil") || nameLower.includes("tajiri") || nameLower.includes("mistress") || nameLower.includes("ridomil")) subcat = "Fungicides";
    else if (subLower.includes("herbi") || nameLower.includes("herbi") || nameLower.includes("weedal") || nameLower.includes("roundup")) subcat = "Herbicides";
    else if (subLower.includes("nemati") || nameLower.includes("nemati")) subcat = "Nematicides";
    else if (subLower.includes("bacteri") || nameLower.includes("bacteri")) subcat = "Bactericides";
    else if (subLower.includes("rodent") || nameLower.includes("rodent")) subcat = "Rodenticides";
    return { category: "Crop Protection", subcategory: subcat };
  }

  // 3. Fertilizers & Plant Growth Boosters
  if (catLower.includes("fertilizer") || subLower.includes("fertilizer") || nameLower.includes("fertilizer") ||
      nameLower.includes("npk") || nameLower.includes("dap") || nameLower.includes("can") || nameLower.includes("urea") ||
      nameLower.includes("foliar") || nameLower.includes("biosol") || nameLower.includes("algreen") ||
      nameLower.includes("diamond") || nameLower.includes("unizyme") || nameLower.includes("cytomone") ||
      nameLower.includes("unigrow") || nameLower.includes("blosol")) {
    let subcat = "Specialized";
    if (subLower.includes("planting") || nameLower.includes("planting") || nameLower.includes("dap")) subcat = "Planting";
    else if (subLower.includes("dressing") || nameLower.includes("dressing") || nameLower.includes("can") || nameLower.includes("urea")) subcat = "Top Dressing";
    else if (subLower.includes("foliar") || nameLower.includes("foliar") || nameLower.includes("algreen") || nameLower.includes("diamond") || nameLower.includes("biosol")) subcat = "Foliar";
    else if (subLower.includes("organic") || nameLower.includes("organic") || subLower.includes("manure") || nameLower.includes("manure")) subcat = "Organic";
    else if (subLower.includes("blend") || nameLower.includes("blend")) subcat = "Blended";
    return { category: "Fertilizers", subcategory: subcat };
  }

  // 4. Animal Farming (Feeds, Dewormers, Health, Supplements)
  if (catLower.includes("animal") || catLower.includes("feed") || subLower.includes("feed") || 
      catLower.includes("vet") || subLower.includes("vet") || catLower.includes("supplement") || 
      subLower.includes("supplement") || nameLower.includes("dewormer") || nameLower.includes("dairy") ||
      nameLower.includes("poultry") || nameLower.includes("pig") || nameLower.includes("fish") ||
      nameLower.includes("sheep") || nameLower.includes("goat") || nameLower.includes("cow") ||
      nameLower.includes("vet") || nameLower.includes("nilzan") || nameLower.includes("kupe") ||
      nameLower.includes("twigalick") || nameLower.includes("norbrook") || nameLower.includes("dabendozole") ||
      nameLower.includes("afya bora") || nameLower.includes("milking salve") || nameLower.includes("sidai") ||
      nameLower.includes("ultradip") || nameLower.includes("block")) {
    
    if (catLower.includes("feed") || subLower.includes("feed") || nameLower.includes("feed") || nameLower.includes("meal") || nameLower.includes("mash") || nameLower.includes("afya bora")) {
      let leaf = "Dairy";
      if (nameLower.includes("poultry") || nameLower.includes("chick") || nameLower.includes("grower") || nameLower.includes("layer")) leaf = "Poultry";
      else if (nameLower.includes("pig") || nameLower.includes("sow")) leaf = "Pig";
      else if (nameLower.includes("fish")) leaf = "Fish";
      else if (nameLower.includes("sheep") || nameLower.includes("goat")) leaf = "Sheep";
      else if (nameLower.includes("beef") || nameLower.includes("feedlot")) leaf = "Beef Feedlot";
      return { category: "Animal Farming", subcategory: "Animal Feed", leafCategory: leaf };
    }
    
    if (catLower.includes("supplement") || subLower.includes("supplement") || nameLower.includes("salt") || nameLower.includes("block") || nameLower.includes("twigalick") || nameLower.includes("lick")) {
      let leaf = "Mineral Salts";
      if (nameLower.includes("additive")) leaf = "Feed Additives";
      else if (nameLower.includes("vitamin") || nameLower.includes("booster")) leaf = "Multivitamins";
      return { category: "Animal Farming", subcategory: "Supplements", leafCategory: leaf };
    }

    let leaf = "Veterinary Medicines";
    if (nameLower.includes("dewormer") || nameLower.includes("nilzan") || nameLower.includes("dabendozole")) leaf = "Dewormers";
    else if (nameLower.includes("kupe") || nameLower.includes("tick")) leaf = "Animal Pesticides";
    return { category: "Animal Farming", subcategory: "Animal Health", leafCategory: leaf };
  }

  // 5. Farm Tools & Equipment
  if (catLower.includes("tool") || catLower.includes("machinery") || catLower.includes("implement") ||
      subLower.includes("tool") || subLower.includes("machinery") || subLower.includes("implement") ||
      nameLower.includes("pump") || nameLower.includes("sprayer") || nameLower.includes("shovel") ||
      nameLower.includes("hoe") || nameLower.includes("plough") || nameLower.includes("panga") ||
      nameLower.includes("trigger") || nameLower.includes("pipe") || nameLower.includes("nozzle") || nameLower.includes("nozle")) {
    let subcat = "Hand Tools";
    if (nameLower.includes("pump") || nameLower.includes("sprayer") || nameLower.includes("trigger") || nameLower.includes("pipe") || nameLower.includes("nozzle") || nameLower.includes("nozle")) subcat = "Machinery";
    return { category: "Farm Equipment", subcategory: subcat };
  }

  return { category: cat || "Crop Protection", subcategory: sub || "General" };
}

export type ProductSizeOption = {
  name: string;
  price: number;
  originalPrice?: number | null;
  unit: string;
};

export type ShopProduct = {
  id: string;
  name: string;
  slug?: string;
  category: string;
  shopType?: string;      // "Agrovet" | "Specialist Shop" | "For Retailers"
  field?: string;         // "Crop Production" | "Fertilizers" | "Animal Production" | "Public Health & Sanitation" | "Farm Tools & Machinery" | "Domestic Animal Pharmacy"
  subcategory?: string;
  price: number;
  originalPrice?: number | null;
  rating: number;
  reviewsCount: number;
  reviews?: number;
  badge?: "Best Seller" | "Organic" | "New" | "Sale" | "Bulk Deal" | "Flash Deal" | "Anniversary deal" | "" | null;
  image: string;
  imageUrls?: string[];
  brand: string;
  seller?: string;
  stock: number;
  description: string;
  briefDescription?: string;
  county: string;
  organic: boolean;
  verifiedSeller: boolean;
  unit: string;
  sellerScore: number;
  condition: "Fresh" | "Certified Organic" | "Bulk Available" | "Pre-Order";
  sizes?: ProductSizeOption[];
  isFeatured?: boolean;
  externalProductId?: string;
  sku?: string;
};

export const shopProducts: ShopProduct[] = [
  {
    id: "premium-npk-20-20-20-fertilizer",
    slug: "premium-npk-20-20-20-fertilizer",
    name: "Premium NPK 20:20:20 Fertilizer",
    description: "High-purity water-soluble NPK 20:20:20 balanced fertilizer designed to boost plant growth, flowering, and root health.",
    price: 3200,
    originalPrice: 3600,
    rating: 4.9,
    reviewsCount: 32,
    stock: 250,
    image: "https://i.pinimg.com/1200x/30/51/f4/3051f4e634474dad5df2920d1b7e763a.jpg",
    imageUrls: ["https://i.pinimg.com/1200x/30/51/f4/3051f4e634474dad5df2920d1b7e763a.jpg"],
    brand: "Yara",
    seller: "Mculima Supplies",
    county: "Nairobi",
    organic: false,
    verifiedSeller: true,
    unit: "50kg bag",
    sellerScore: 98,
    condition: "Fresh",
    badge: "Best Seller",
    shopType: "Agrovet",
    field: "Crop Production",
    category: "Fertilizers",
    subcategory: "Planting",
    isFeatured: true
  },
  {
    id: "lambda-cyhalothrin-10ec-insecticide",
    slug: "lambda-cyhalothrin-10ec-insecticide",
    name: "Lambda-Cyhalothrin 10EC Insecticide",
    description: "Fast-acting synthetic pyrethroid insecticide for controlling caterpillars, aphids, thrips, and beetles on crops.",
    price: 1450,
    originalPrice: 1600,
    rating: 4.8,
    reviewsCount: 27,
    stock: 180,
    image: "https://www.pomais.com/wp-content/uploads/2024/12/Lambda-cyhalothrin10EC-.webp",
    imageUrls: ["https://www.pomais.com/wp-content/uploads/2024/12/Lambda-cyhalothrin10EC-.webp"],
    brand: "Pomais",
    seller: "AgroChem Supplies",
    county: "Nairobi",
    organic: false,
    verifiedSeller: true,
    unit: "1L bottle",
    sellerScore: 96,
    condition: "Fresh",
    badge: "Best Seller",
    shopType: "Agrovet",
    field: "Crop Protection",
    category: "Crop Protection",
    subcategory: "Insecticides",
    isFeatured: true
  },
  {
    id: "seaweed-organic-growth-booster",
    slug: "seaweed-organic-growth-booster",
    name: "Seaweed Organic Growth Booster",
    description: "100% natural cold-pressed seaweed extract biostimulant. Enhances root expansion, stress tolerance, and crop yields.",
    price: 2100,
    originalPrice: 2400,
    rating: 4.9,
    reviewsCount: 41,
    stock: 140,
    image: "https://i.pinimg.com/736x/b4/9e/55/b49e55253e882f51514c8a028dda76bd.jpg",
    imageUrls: ["https://i.pinimg.com/736x/b4/9e/55/b49e55253e882f51514c8a028dda76bd.jpg"],
    brand: "BioGrow",
    seller: "Organic Farm Solutions",
    county: "Nakuru",
    organic: true,
    verifiedSeller: true,
    unit: "1L bottle",
    sellerScore: 99,
    condition: "Certified Organic",
    badge: "Organic",
    shopType: "Agrovet",
    field: "Plant Growth & Boosters",
    category: "Plant Growth & Boosters",
    subcategory: "Biostimulants",
    isFeatured: true
  },
  {
    id: "20l-heavy-duty-knapsack-sprayer",
    slug: "20l-heavy-duty-knapsack-sprayer",
    name: "20L Heavy Duty Knapsack Sprayer",
    description: "Ergonomic 20-litre manual knapsack sprayer with heavy-duty pump handle, brass lance, and multi-pattern nozzles.",
    price: 4800,
    originalPrice: 5200,
    rating: 4.7,
    reviewsCount: 19,
    stock: 65,
    image: "https://i.pinimg.com/1200x/74/d7/66/74d766c45e79615e4028f5d86cb1a63d.jpg",
    imageUrls: ["https://i.pinimg.com/1200x/74/d7/66/74d766c45e79615e4028f5d86cb1a63d.jpg"],
    brand: "Harvester Tools",
    seller: "Equipment Direct",
    county: "Nairobi",
    organic: false,
    verifiedSeller: true,
    unit: "1 unit",
    sellerScore: 94,
    condition: "Fresh",
    badge: "Sale",
    shopType: "Agrovet",
    field: "Farm Equipment",
    category: "Farm Equipment",
    subcategory: "Machinery",
    isFeatured: true
  },
  {
    id: "duduthrin-broad-spectrum-insecticide",
    slug: "duduthrin-broad-spectrum-insecticide",
    name: "Duduthrin Broad-Spectrum Insecticide",
    description: "Broad-spectrum EC insecticide formulation effective against cutworms, armyworms, whiteflies, and diamondback moths.",
    price: 1200,
    originalPrice: 1350,
    rating: 4.8,
    reviewsCount: 22,
    stock: 95,
    image: "https://i.pinimg.com/736x/e6/29/38/e62938172d5b057b027f3de816b373e2.jpg",
    imageUrls: ["https://i.pinimg.com/736x/e6/29/38/e62938172d5b057b027f3de816b373e2.jpg"],
    brand: "Twiga Chemical",
    seller: "Twiga Agrovet",
    county: "Kiambu",
    organic: false,
    verifiedSeller: true,
    unit: "500ml",
    sellerScore: 97,
    condition: "Fresh",
    badge: "Best Seller",
    shopType: "Agrovet",
    field: "Crop Protection",
    category: "Crop Protection",
    subcategory: "Insecticides",
    isFeatured: true
  },
  {
    id: "high-yield-layer-chicken-feed",
    slug: "high-yield-layer-chicken-feed",
    name: "High-Yield Layer Chicken Feed",
    description: "Nutrient-balanced complete laying mash formulated with essential calcium, amino acids, and energy for maximum egg output.",
    price: 3250,
    originalPrice: 3500,
    rating: 4.9,
    reviewsCount: 38,
    stock: 310,
    image: "https://www.myagrovet.co.ke/images/products/7367/thumb_44e1a1ca768bb3add788ec4afd3b0a57.png",
    imageUrls: ["https://www.myagrovet.co.ke/images/products/7367/thumb_44e1a1ca768bb3add788ec4afd3b0a57.png"],
    brand: "Unga Feeds",
    seller: "Unga Farmcare",
    county: "Nakuru",
    organic: false,
    verifiedSeller: true,
    unit: "70kg bag",
    sellerScore: 98,
    condition: "Fresh",
    badge: "Best Seller",
    shopType: "Agrovet",
    field: "Animal Farming",
    category: "Animal Farming",
    subcategory: "Animal Feed",
    isFeatured: true
  },
  {
    id: "high-protein-dairy-meal",
    slug: "high-protein-dairy-meal",
    name: "High-Protein Dairy Meal",
    description: "High-protein concentrate dairy meal enriched with bypass fats, mineral salts, and vitamins to boost daily milk yield.",
    price: 2950,
    originalPrice: 3200,
    rating: 4.8,
    reviewsCount: 35,
    stock: 280,
    image: "https://www.myagrovet.co.ke/images/products/7402/625a8d9a0cb201e96950aaf15ae003a8.png",
    imageUrls: ["https://www.myagrovet.co.ke/images/products/7402/625a8d9a0cb201e96950aaf15ae003a8.png"],
    brand: "Pembe Feeds",
    seller: "Pembe Millers",
    county: "Uasin Gishu",
    organic: false,
    verifiedSeller: true,
    unit: "50kg bag",
    sellerScore: 97,
    condition: "Fresh",
    badge: "Best Seller",
    shopType: "Agrovet",
    field: "Animal Farming",
    category: "Animal Farming",
    subcategory: "Animal Feed",
    isFeatured: true
  }
];

export const shopCategories = [
  { id: "All", label: "All Products", icon: "📦" },
  
  // Agrovet -> Crop Production
  { id: "Pesticides", label: "Pesticides", icon: "🧪" },
  { id: "Foliar Fertilizer", label: "Foliar Fertilizer", icon: "🍃" },
  { id: "Growth Catalysts", label: "Growth Catalysts", icon: "📈" },
  { id: "Biostimulants", label: "Biostimulants", icon: "⚡" },
  { id: "Post Harvest", label: "Post Harvest", icon: "📦" },
  { id: "Seeds & Seedlings", label: "Seeds & Seedlings", icon: "🌱" },
  
  // Agrovet -> Fertilizers
  { id: "Planting", label: "Planting Fertilizers", icon: "🕳️" },
  { id: "Top Dressing", label: "Top Dressing Fertilizers", icon: "🍚" },
  { id: "Blended", label: "Blended Fertilizers", icon: "🔀" },
  { id: "Specialized Fertilizers", label: "Specialized Fertilizers", icon: "✨" },
  { id: "Organic fertilizer", label: "Organic Fertilizer", icon: "💩" },
  
  // Agrovet -> Animal Production
  { id: "Animal Feeds", label: "Animal Feeds", icon: "🐄" },
  { id: "Animal pesticides", label: "Animal Pesticides", icon: "🪰" },
  { id: "Supplements", label: "Supplements & Additives", icon: "💊" },
  
  // Agrovet -> Public Health & Sanitation
  { id: "Water treatment", label: "Water Treatment", icon: "💧" },
  { id: "Sewage & Excreta", label: "Sewage & Excreta", icon: "🚽" },
  { id: "Environmental", label: "Environmental Sanitation", icon: "🧹" },
  
  // Agrovet -> Farm tools, Implements & Machinery
  { id: "Tools", label: "Farm Tools", icon: "🔨" },
  { id: "Implements", label: "Farm Implements", icon: "🚜" },
  { id: "Machinery", label: "Farm Machinery", icon: "⚙️" },
  
  // Specialist Shop
  { id: "Domestic Animal Pharmacy", label: "Domestic Animal Pharmacy", icon: "🏥" }
];

export const shopCounties = [
  "All",
  "Baringo",
  "Bomet",
  "Bungoma",
  "Busia",
  "Elgeyo-Marakwet",
  "Embu",
  "Garissa",
  "Homa Bay",
  "Isiolo",
  "Kajiado",
  "Kakamega",
  "Kericho",
  "Kiambu",
  "Kilifi",
  "Kirinyaga",
  "Kisii",
  "Kisumu",
  "Kitui",
  "Kwale",
  "Laikipia",
  "Lamu",
  "Machakos",
  "Makueni",
  "Mandera",
  "Marsabit",
  "Meru",
  "Migori",
  "Mombasa",
  "Murang'a",
  "Nairobi",
  "Nakuru",
  "Nandi",
  "Narok",
  "Nyamira",
  "Nyandarua",
  "Nyeri",
  "Samburu",
  "Siaya",
  "Taita-Taveta",
  "Tana River",
  "Tharaka-Nithi",
  "Trans Nzoia",
  "Turkana",
  "Uasin Gishu",
  "Vihiga",
  "Wajir",
  "West Pokot"
];

export const trustedSellers: any[] = [];
