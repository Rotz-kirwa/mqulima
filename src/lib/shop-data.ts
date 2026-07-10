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

export function mapToNewTaxonomy(p: any) {
  let cat = (p.category || "").trim();
  let sub = (p.subcategory || "").trim();
  
  const nameLower = (p.name || "").toLowerCase();
  const descLower = (p.description || "").toLowerCase();
  const catLower = cat.toLowerCase();
  const subLower = sub.toLowerCase();

  // 1. Seeds & Seedlings
  if (catLower.includes("seed") || subLower.includes("seed") || nameLower.includes("seed")) {
    let subcat = "Vegetables";
    if (nameLower.includes("maize")) subcat = "Maize";
    else if (nameLower.includes("bean")) subcat = "Beans";
    else if (nameLower.includes("tomato")) subcat = "Tomatoes";
    else if (nameLower.includes("potato")) subcat = "Potatoes";
    else if (nameLower.includes("onion")) subcat = "Onions";
    else if (nameLower.includes("watermelon")) subcat = "Watermelon";
    else if (nameLower.includes("sorghum")) subcat = "Sorghum";
    else if (nameLower.includes("pea")) subcat = "Peas";
    else if (nameLower.includes("tree")) subcat = "Tree Seedlings";
    else if (nameLower.includes("fruit")) subcat = "Fruit Seedlings";
    return { category: "Seeds & Seedlings", subcategory: subcat };
  }

  // 2. Crop Protection
  if (catLower.includes("pesticide") || subLower.includes("pesticide") || 
      subLower.includes("fungicide") || subLower.includes("insecticide") || 
      subLower.includes("herbicide") || subLower.includes("nematicide") || 
      subLower.includes("bactericide") || subLower.includes("rodenticide") ||
      nameLower.includes("fungicide") || nameLower.includes("insecticide") || 
      nameLower.includes("herbicide") || nameLower.includes("nematicide") ||
      nameLower.includes("ridomil") || nameLower.includes("actara") || nameLower.includes("roundup")) {
    let subcat = "Insecticides";
    if (subLower.includes("fungi") || nameLower.includes("fungi") || nameLower.includes("ridomil")) subcat = "Fungicides";
    else if (subLower.includes("herbi") || nameLower.includes("herbi") || nameLower.includes("roundup")) subcat = "Herbicides";
    else if (subLower.includes("nemati") || nameLower.includes("nemati")) subcat = "Nematicides";
    else if (subLower.includes("bacteri") || nameLower.includes("bacteri")) subcat = "Bactericides";
    else if (subLower.includes("rodent") || nameLower.includes("rodent")) subcat = "Rodenticides";
    return { category: "Crop Protection", subcategory: subcat };
  }

  // 3. Fertilizers
  if (catLower.includes("fertilizer") || subLower.includes("fertilizer") || nameLower.includes("fertilizer")) {
    let subcat = "Specialized";
    if (subLower.includes("planting") || nameLower.includes("planting") || nameLower.includes("dap")) subcat = "Planting";
    else if (subLower.includes("dressing") || nameLower.includes("dressing") || nameLower.includes("can") || nameLower.includes("urea")) subcat = "Top Dressing";
    else if (subLower.includes("foliar") || nameLower.includes("foliar")) subcat = "Foliar";
    else if (subLower.includes("organic") || nameLower.includes("organic") || subLower.includes("manure") || nameLower.includes("manure")) subcat = "Organic";
    else if (subLower.includes("blend") || nameLower.includes("blend")) subcat = "Blended";
    return { category: "Fertilizers", subcategory: subcat };
  }

  // 4. Plant Growth & Boosters
  if (catLower.includes("growth") || subLower.includes("growth") || 
      catLower.includes("biostimulant") || subLower.includes("microbe") ||
      nameLower.includes("hormone") || nameLower.includes("booster")) {
    let subcat = "Biostimulants";
    if (nameLower.includes("hormone") || subLower.includes("hormone")) subcat = "Plant Hormones";
    else if (nameLower.includes("microb") || subLower.includes("microb") || nameLower.includes("trichoderma")) subcat = "Microbial Solutions";
    return { category: "Plant Growth & Boosters", subcategory: subcat };
  }

  // 5. Harvest & Storage
  if (catLower.includes("harvest") || subLower.includes("harvest") || 
      catLower.includes("storage") || nameLower.includes("bag") || nameLower.includes("preserv")) {
    let subcat = "Storage Solutions";
    if (nameLower.includes("preserv") || descLower.includes("preserv")) subcat = "Crop Preservation";
    else if (catLower.includes("post") || descLower.includes("post-harvest")) subcat = "Post Harvest Products";
    return { category: "Harvest & Storage", subcategory: subcat };
  }

  // 6. Animal Farming (Feed, Health, Supplements)
  if (catLower.includes("animal") || catLower.includes("feed") || subLower.includes("feed") || 
      catLower.includes("vet") || subLower.includes("vet") || catLower.includes("supplement") || 
      subLower.includes("supplement") || nameLower.includes("dewormer") || nameLower.includes("dairy") ||
      nameLower.includes("poultry") || nameLower.includes("pig") || nameLower.includes("fish") ||
      nameLower.includes("sheep") || nameLower.includes("goat") || nameLower.includes("cow") || nameLower.includes("vet")) {
    
    // Determine category layer
    if (catLower.includes("feed") || subLower.includes("feed") || nameLower.includes("feed") || nameLower.includes("meal")) {
      let leaf = "Dairy";
      if (nameLower.includes("poultry") || nameLower.includes("chick") || nameLower.includes("grower") || nameLower.includes("layer")) leaf = "Poultry";
      else if (nameLower.includes("pig") || nameLower.includes("sow")) leaf = "Pig";
      else if (nameLower.includes("fish")) leaf = "Fish";
      else if (nameLower.includes("sheep") || nameLower.includes("goat")) leaf = "Sheep";
      else if (nameLower.includes("beef") || nameLower.includes("feedlot")) leaf = "Beef Feedlot";
      else if (nameLower.includes("pasture") || nameLower.includes("grass")) leaf = "Pasture";
      else if (nameLower.includes("dog") || nameLower.includes("cat") || nameLower.includes("pet")) leaf = "Pet";
      return { category: "Animal Farming", subcategory: "Animal Feed", leafCategory: leaf };
    }
    
    if (catLower.includes("supplement") || subLower.includes("supplement") || nameLower.includes("salt") || nameLower.includes("block")) {
      let leaf = "Mineral Salts";
      if (nameLower.includes("additive")) leaf = "Feed Additives";
      else if (nameLower.includes("vitamin") || nameLower.includes("booster")) leaf = "Multivitamins";
      return { category: "Animal Farming", subcategory: "Supplements", leafCategory: leaf };
    }

    // Health
    let leaf = "Veterinary Medicines";
    if (nameLower.includes("dewormer") || subLower.includes("dewormer")) leaf = "Dewormers";
    else if (nameLower.includes("vaccine")) leaf = "Vaccines";
    else if (nameLower.includes("pesticide") || nameLower.includes("acaricide") || nameLower.includes("tick")) leaf = "Animal Pesticides";
    else if (nameLower.includes("vitamin") || nameLower.includes("multivit")) leaf = "Vitamins";
    return { category: "Animal Farming", subcategory: "Animal Health", leafCategory: leaf };
  }

  // 7. Farm Equipment
  if (catLower.includes("tool") || catLower.includes("machinery") || catLower.includes("implement") ||
      subLower.includes("tool") || subLower.includes("machinery") || subLower.includes("implement") ||
      nameLower.includes("pump") || nameLower.includes("sprayer") || nameLower.includes("shovel") ||
      nameLower.includes("hoe") || nameLower.includes("plough") || nameLower.includes("tractor")) {
    let subcat = "Hand Tools";
    if (nameLower.includes("pump") || nameLower.includes("sprayer") || nameLower.includes("machin") || nameLower.includes("generator")) subcat = "Machinery";
    else if (nameLower.includes("plough") || nameLower.includes("harrow") || nameLower.includes("planter")) subcat = "Implements";
    return { category: "Farm Equipment", subcategory: subcat };
  }

  // 8. Water & Sanitation
  if (catLower.includes("water") || catLower.includes("sanitation") || catLower.includes("sewage") ||
      nameLower.includes("chlorine") || nameLower.includes("bio-digester")) {
    let subcat = "Environmental Solutions";
    if (nameLower.includes("water") || nameLower.includes("chlorin") || nameLower.includes("purif")) subcat = "Water Treatment";
    return { category: "Water & Sanitation", subcategory: subcat };
  }

  return { category: "Seeds & Seedlings", subcategory: "Vegetables" };
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
};

export const shopProducts: ShopProduct[] = [];

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
  "Kiambu",
  "Kirinyaga",
  "Uasin Gishu",
  "Murang'a",
  "Nairobi",
  "Nakuru",
  "Meru",
  "Nyeri",
  "Machakos",
  "Baringo"
];

export const trustedSellers: any[] = [];
