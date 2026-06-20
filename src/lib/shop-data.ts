export type ShopProduct = {
  id: string;
  name: string;
  category: "Vegetables" | "Fruits" | "Grains & Cereals" | "Dairy" | "Seeds & Seedlings" | "Farm Tools";
  price: number;
  originalPrice?: number;
  rating: number;
  reviewsCount: number;
  badge?: "Best Seller" | "Organic" | "New" | "Sale" | "";
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
    category: "Vegetables",
    price: 45,
    originalPrice: 60,
    rating: 4.8,
    reviewsCount: 128,
    badge: "Best Seller",
    image: "https://images.unsplash.com/photo-1628773822503-930a8589c313?q=80&w=600&auto=format&fit=crop",
    brand: "Kamau Farms",
    stock: 150,
    description: "Freshly cut high-yield Collard Greens (Sukuma Wiki). Sourced from rich volcanic soils, washed, and bundled daily.",
    county: "Kiambu",
    organic: true,
    verifiedSeller: true,
    unit: "bunch"
  },
  {
    id: "p2",
    name: "Organic Tomatoes",
    category: "Vegetables",
    price: 120,
    originalPrice: 150,
    rating: 4.6,
    reviewsCount: 94,
    badge: "Organic",
    image: "https://images.unsplash.com/photo-1595855759920-86582396756a?q=80&w=600&auto=format&fit=crop",
    brand: "Wambui Organics",
    stock: 85,
    description: "Sweet and juicy vine-ripened organic tomatoes. Hand-picked at peak ripeness without artificial pesticide usage.",
    county: "Kirinyaga",
    organic: true,
    verifiedSeller: true,
    unit: "kg"
  },
  {
    id: "p3",
    name: "White Maize Flour (2kg)",
    category: "Grains & Cereals",
    price: 210,
    originalPrice: 245,
    rating: 4.9,
    reviewsCount: 310,
    badge: "Best Seller",
    image: "https://images.unsplash.com/photo-1574316071802-0d684efa7bf5?q=80&w=600&auto=format&fit=crop",
    brand: "Unga ya Baba",
    stock: 500,
    description: "Premium stone-ground white maize meal. Sifted to perfection for soft, delicious traditional ugali.",
    county: "Uasin Gishu",
    organic: false,
    verifiedSeller: true,
    unit: "pack"
  },
  {
    id: "p4",
    name: "Avocado (Hass)",
    category: "Fruits",
    price: 30,
    rating: 4.7,
    reviewsCount: 78,
    badge: "Best Seller",
    image: "https://images.unsplash.com/photo-1523049673857-eb18f1d7b578?q=80&w=600&auto=format&fit=crop",
    brand: "Nyandarua Fresh",
    stock: 200,
    description: "Creamy, high-grade Hass avocados. Perfectly mature and ready to ripen naturally in your kitchen.",
    county: "Murang'a",
    organic: true,
    verifiedSeller: true,
    unit: "piece"
  },
  {
    id: "p5",
    name: "Garden Hoe (Long Handle)",
    category: "Farm Tools",
    price: 850,
    originalPrice: 950,
    rating: 4.5,
    reviewsCount: 42,
    badge: "Sale",
    image: "https://images.unsplash.com/photo-1598902108854-10e335adac99?q=80&w=600&auto=format&fit=crop",
    brand: "AgroTools KE",
    stock: 40,
    description: "Durable forged carbon-steel farming hoe with a polished, lightweight hardwood handle. Excellent for weeding.",
    county: "Nairobi",
    organic: false,
    verifiedSeller: false,
    unit: "piece"
  },
  {
    id: "p6",
    name: "Spinach (Fresh)",
    category: "Vegetables",
    price: 35,
    rating: 4.8,
    reviewsCount: 65,
    badge: "Organic",
    image: "https://images.unsplash.com/photo-1576045057995-568f588f82fb?q=80&w=600&auto=format&fit=crop",
    brand: "Rift Valley Greens",
    stock: 120,
    description: "Crisp, iron-rich spinach leaves harvested at sunrise. Perfect for healthy salads, stews, and traditional sides.",
    county: "Nakuru",
    organic: true,
    verifiedSeller: true,
    unit: "bunch"
  },
  {
    id: "p7",
    name: "Chia Seeds (500g)",
    category: "Seeds & Seedlings",
    price: 480,
    originalPrice: 550,
    rating: 4.6,
    reviewsCount: 52,
    badge: "New",
    image: "https://images.unsplash.com/photo-1511112465311-64e7c7a26f30?q=80&w=600&auto=format&fit=crop",
    brand: "Organic Africa",
    stock: 95,
    description: "Premium organic chia seeds loaded with Omega-3, fiber, and protein. Certified clean sorting and packaging.",
    county: "Meru",
    organic: true,
    verifiedSeller: true,
    unit: "pack"
  },
  {
    id: "p8",
    name: "Pumpkin (Medium)",
    category: "Vegetables",
    price: 95,
    originalPrice: 120,
    rating: 4.4,
    reviewsCount: 38,
    badge: "Sale",
    image: "https://images.unsplash.com/photo-1506815444479-bfdb1e96c566?q=80&w=600&auto=format&fit=crop",
    brand: "Mutura Farms",
    stock: 60,
    description: "Traditional sweet orange-fleshed medium pumpkins. Grown naturally, highly nutritious and stores well.",
    county: "Nyeri",
    organic: true,
    verifiedSeller: false,
    unit: "piece"
  },
  {
    id: "p9",
    name: "Fresh Milk (1L)",
    category: "Dairy",
    price: 85,
    rating: 4.8,
    reviewsCount: 190,
    badge: "Best Seller",
    image: "https://images.unsplash.com/photo-1550583724-b2692b85b150?q=80&w=600&auto=format&fit=crop",
    brand: "Molo Milk",
    stock: 300,
    description: "Pasteurized whole milk from grass-fed cows. Farm fresh, creamy, and packed with nutrition.",
    county: "Nakuru",
    organic: false,
    verifiedSeller: true,
    unit: "bottle"
  },
  {
    id: "p10",
    name: "Organic Yoghurt (500ml)",
    category: "Dairy",
    price: 160,
    originalPrice: 180,
    rating: 4.7,
    reviewsCount: 88,
    badge: "Organic",
    image: "https://images.unsplash.com/photo-1488477181946-6428a0291777?q=80&w=600&auto=format&fit=crop",
    brand: "Bio Foods",
    stock: 50,
    description: "Probiotic-rich plain organic yoghurt. Thick, creamy, and sweetened with natural farm honey.",
    county: "Nairobi",
    organic: true,
    verifiedSeller: true,
    unit: "tub"
  }
];

export const shopCategories = [
  { id: "All", label: "All Items", icon: "📦" },
  { id: "Vegetables", label: "Vegetables", icon: "🥬" },
  { id: "Fruits", label: "Fruits", icon: "🍎" },
  { id: "Grains & Cereals", label: "Grains & Cereals", icon: "🌾" },
  { id: "Dairy", label: "Dairy", icon: "🥛" },
  { id: "Seeds & Seedlings", label: "Seeds & Seedlings", icon: "🌱" },
  { id: "Farm Tools", label: "Farm Tools", icon: "🚜" },
  { id: "Organic", label: "Organic", icon: "🌿" },
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
