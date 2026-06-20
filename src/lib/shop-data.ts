export type ShopProduct = {
  id: string;
  name: string;
  category: "Vegetables" | "Fruits" | "Grains" | "Farm Tools" | "Seeds" | "Livestock" | "Pesticides";
  price: number;
  originalPrice?: number;
  rating: number;
  reviewsCount: number;
  badge?: "Best Seller" | "Organic" | "New" | "Sale" | "Bulk Deal" | "";
  image: string;
  brand: string;
  stock: number;
  description: string;
  county: string;
  organic: boolean;
  verifiedSeller: boolean;
  unit: string;
};

export const shopProducts: ShopProduct[] = [
  {
    id: "p1",
    name: "Sukuma Wiki (Kale)",
    brand: "Kamau Farms",
    price: 45,
    unit: "bunch",
    category: "Vegetables",
    rating: 4.8,
    reviewsCount: 124,
    badge: "Organic",
    image: "https://images.unsplash.com/photo-1628773822503-930a8589c313?w=400",
    stock: 120,
    description: "Crisp, nutrient-rich collard greens harvested at dawn. Grown organically in Kiambu volcanic soil, washed, and bundled ready for your kitchen.",
    county: "Kiambu",
    organic: true,
    verifiedSeller: true
  },
  {
    id: "p2",
    name: "Organic Tomatoes",
    brand: "Wambui Organics",
    price: 120,
    originalPrice: 150,
    unit: "kg",
    category: "Vegetables",
    rating: 4.6,
    reviewsCount: 89,
    badge: "Best Seller",
    image: "https://images.unsplash.com/photo-1595855759920-86582396756a?w=400",
    stock: 80,
    description: "Sun-ripened organic tomatoes with a rich, sweet flavor. Grown using zero chemical fertilizers in Kirinyaga County. Ideal for sauces and salads.",
    county: "Kirinyaga",
    organic: true,
    verifiedSeller: true
  },
  {
    id: "p3",
    name: "White Maize Flour 2kg",
    brand: "Unga ya Baba",
    price: 210,
    unit: "pack",
    category: "Grains",
    rating: 4.9,
    reviewsCount: 203,
    badge: "Best Seller",
    image: "https://images.unsplash.com/photo-1574316071802-0d684efa7bf5?w=400",
    stock: 250,
    description: "Premium stone-ground white maize meal. Sourced from high-quality Eldoret maize, sifted to perfection for traditional fluffy ugali.",
    county: "Uasin Gishu",
    organic: false,
    verifiedSeller: true
  },
  {
    id: "p4",
    name: "Avocado Hass",
    brand: "Nyandarua Fresh",
    price: 30,
    unit: "piece",
    category: "Fruits",
    rating: 4.7,
    reviewsCount: 156,
    badge: "",
    image: "https://images.unsplash.com/photo-1519162808019-7de1683fa2ad?w=400",
    stock: 180,
    description: "Butter-soft Hass avocados from Murang'a orchards. Rich in healthy fats with a creamy, nutty flavor profile.",
    county: "Murang'a",
    organic: true,
    verifiedSeller: true
  },
  {
    id: "p5",
    name: "Garden Hoe Long Handle",
    brand: "AgroTools KE",
    price: 850,
    unit: "unit",
    category: "Farm Tools",
    rating: 4.5,
    reviewsCount: 67,
    badge: "",
    image: "https://images.unsplash.com/photo-1598902108854-10e335adac99?w=400",
    stock: 45,
    description: "Forged high-carbon steel farm hoe fitted with a 1.5m lightweight hardwood handle. Designed for longevity and optimal weeding leverage.",
    county: "Nairobi",
    organic: false,
    verifiedSeller: true
  },
  {
    id: "p6",
    name: "Spinach Fresh",
    brand: "Rift Valley Greens",
    price: 35,
    unit: "bunch",
    category: "Vegetables",
    rating: 4.8,
    reviewsCount: 91,
    badge: "Organic",
    image: "https://images.unsplash.com/photo-1576045057995-568f588f82fb?w=400",
    stock: 110,
    description: "Lush, iron-rich spinach leaves cultivated using sustainable organic practices in Nakuru. Perfect for stews and green smoothies.",
    county: "Nakuru",
    organic: true,
    verifiedSeller: true
  },
  {
    id: "p7",
    name: "Chia Seeds 500g",
    brand: "Organic Africa",
    price: 480,
    unit: "pack",
    category: "Seeds",
    rating: 4.6,
    reviewsCount: 45,
    badge: "Organic",
    image: "https://images.unsplash.com/photo-1508747703725-719777637510?w=400",
    stock: 75,
    description: "Premium black chia seeds packed with omega-3 fatty acids, fiber, and protein. Triple-sorted and vacuum sealed for freshness.",
    county: "Meru",
    organic: true,
    verifiedSeller: true
  },
  {
    id: "p8",
    name: "Pumpkin Medium",
    brand: "Mutura Farms",
    price: 95,
    originalPrice: 130,
    unit: "piece",
    category: "Vegetables",
    rating: 4.4,
    reviewsCount: 78,
    badge: "",
    image: "https://images.unsplash.com/photo-1570586437263-ab629fccc818?w=400",
    stock: 60,
    description: "Sweet, orange-fleshed pumpkins grown in Nyeri County. Highly nutritious and features an excellent storage shelf-life.",
    county: "Nyeri",
    organic: true,
    verifiedSeller: true
  },
  {
    id: "p9",
    name: "Layers Mash Premium 70kg",
    brand: "Unga Feeds",
    price: 3650,
    originalPrice: 3950,
    unit: "bag",
    category: "Livestock",
    rating: 4.7,
    reviewsCount: 112,
    badge: "Bulk Deal",
    image: "https://images.unsplash.com/photo-1548550023-2bdb3c5beed7?w=400",
    stock: 35,
    description: "Complete nutrition mash for laying hens. Scientifically formulated with vitamins and calcium to maximize egg yield and shell hardness.",
    county: "Nakuru",
    organic: false,
    verifiedSeller: true
  },
  {
    id: "p10",
    name: "Knapsack Sprayer 16L",
    brand: "Cooper Agri",
    price: 4500,
    unit: "unit",
    category: "Farm Tools",
    rating: 4.5,
    reviewsCount: 34,
    badge: "",
    image: "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=400",
    stock: 22,
    description: "Heavy-duty 16-liter agricultural knapsack sprayer. Features a padded harness, adjustable pressure nozzle, and dual-action pump.",
    county: "Nairobi",
    organic: false,
    verifiedSeller: true
  },
  {
    id: "p11",
    name: "DK 8031 Hybrid Maize Seed",
    brand: "Dekalb",
    price: 680,
    originalPrice: 750,
    unit: "2kg",
    category: "Seeds",
    rating: 4.9,
    reviewsCount: 287,
    badge: "Best Seller",
    image: "https://images.unsplash.com/photo-1551754655-cd27e38d2076?w=400",
    stock: 140,
    description: "Certified high-yield hybrid maize seeds. Drought-tolerant, disease-resistant, and ideal for medium-altitude farming zones.",
    county: "Uasin Gishu",
    organic: false,
    verifiedSeller: true
  },
  {
    id: "p12",
    name: "Ridomil Gold MZ 68WG",
    brand: "Syngenta",
    price: 1250,
    unit: "kg",
    category: "Pesticides",
    rating: 4.6,
    reviewsCount: 93,
    badge: "",
    image: "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=400",
    stock: 90,
    description: "Highly effective systemic fungicide for preventative control of late blight, downy mildew, and soil-borne diseases in crops.",
    county: "Kiambu",
    organic: false,
    verifiedSeller: true
  }
];

export const shopCategories = [
  { id: "All", label: "All Items", icon: "📦" },
  { id: "Vegetables", label: "Vegetables", icon: "🥬" },
  { id: "Fruits", label: "Fruits", icon: "🍎" },
  { id: "Grains", label: "Grains", icon: "🌾" },
  { id: "Farm Tools", label: "Farm Tools", icon: "🚜" },
  { id: "Seeds", label: "Seeds", icon: "🌱" },
  { id: "Livestock", label: "Livestock", icon: "🐄" },
  { id: "Pesticides", label: "Pesticides", icon: "🧪" }
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
  "Nyeri"
];

export const trustedSellers = [
  {
    name: "Kamau Farms",
    location: "Kiambu County",
    rating: 4.9,
    sales: "1,200+ orders",
    avatar: "🥬",
  },
  {
    name: "Wambui Organics",
    location: "Kirinyaga County",
    rating: 4.8,
    sales: "850+ orders",
    avatar: "🍅",
  },
  {
    name: "Rift Valley Greens",
    location: "Nakuru County",
    rating: 4.9,
    sales: "2,100+ orders",
    avatar: "🌿",
  },
  {
    name: "Organic Africa",
    location: "Meru County",
    rating: 4.7,
    sales: "640+ orders",
    avatar: "🌱",
  },
];
