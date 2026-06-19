import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Search, Heart, Star, SlidersHorizontal, 
  Grid, List, CheckCircle2, MapPin, Sparkles, ShieldCheck, 
  Truck, RotateCcw, PhoneCall, ChevronUp, Eye, X, ArrowRight 
} from "lucide-react";
import { toast } from "sonner";
import { AppLayout } from "@/components/mqulima/AppLayout";

// Product images
import p1Img from "@/assets/products/p1.jpg";
import p2Img from "@/assets/products/p2.jpg";
import p3Img from "@/assets/products/p3.jpg";
import p4Img from "@/assets/products/p4.jpg";
import p5Img from "@/assets/products/p5.jpg";
import p6Img from "@/assets/products/p6.jpg";
import p7Img from "@/assets/products/p7.jpg";
import p8Img from "@/assets/products/p8.jpg";

export const Route = createFileRoute("/shop")({
  head: () => ({
    meta: [
      { title: "Mqulima Marketplace — Elite Agri-Commerce" },
      { name: "description", content: "Africa's largest digital agricultural marketplace. Verified inputs, equipment, seeds, and fertilizers delivered directly to your county." },
    ],
  }),
  component: Shop,
});

interface Product {
  id: string;
  name: string;
  category: "Seeds" | "Fertilizers" | "Equipment" | "Irrigation" | "Pest Control" | "Organics";
  price: number;
  originalPrice?: number;
  rating: number;
  badge?: "BESTSELLER" | "NEW" | "TOP PICK" | "ORGANIC" | "LOW STOCK" | "";
  image: string;
  brand: string;
  stock: number;
  description: string;
  county: string;
  organic: boolean;
  verifiedSeller: boolean;
}

const mockProducts: Product[] = [
  { id: "p1", name: "Dap Fertilizer 50kg", category: "Fertilizers", price: 3200, originalPrice: 4200, rating: 4.8, badge: "BESTSELLER", image: p1Img, brand: "Chapa Meli", stock: 124, description: "Premium Diammonium Phosphate (DAP) fertilizer. Excellent for planting crops to boost root system development.", county: "Nakuru", organic: false, verifiedSeller: true },
  { id: "p2", name: "Hybrid Maize Seeds 2kg", category: "Seeds", price: 850, originalPrice: 1100, rating: 4.9, badge: "NEW", image: p2Img, brand: "Dekalb", stock: 312, description: "DK 8031 hybrid variety. Drought-tolerant, early maturing, high-yielding crop suited for medium altitudes.", county: "Uasin Gishu", organic: false, verifiedSeller: true },
  { id: "p3", name: "Solar Water Pump", category: "Equipment", price: 24000, originalPrice: 28500, rating: 4.6, badge: "TOP PICK", image: p6Img, brand: "SunPower", stock: 15, description: "Solar-powered water pump system for sustainable farm irrigation. Submersible pump includes solar panel controls.", county: "Machakos", organic: false, verifiedSeller: true },
  { id: "p4", name: "Organic Compost 20kg", category: "Organics", price: 1100, originalPrice: 1400, rating: 4.7, badge: "ORGANIC", image: p3Img, brand: "EcoGrow", stock: 88, description: "Premium microbial-rich organic compost. Restores soil biology, enhances moisture retention.", county: "Kiambu", organic: true, verifiedSeller: false },
  { id: "p5", name: "CAN Fertilizer 50kg", category: "Fertilizers", price: 2900, rating: 4.5, badge: "", image: p5Img, brand: "Yara", stock: 210, description: "Calcium Ammonium Nitrate top-dressing fertilizer. Fast release of nitrogen for vigorous leafy growth.", county: "Eldoret", organic: false, verifiedSeller: true },
  { id: "p6", name: "Tomato F1 Seeds 10g", category: "Seeds", price: 420, originalPrice: 600, rating: 4.8, badge: "LOW STOCK", image: p7Img, brand: "Royal Seed", stock: 8, description: "Sukari F1 determinate tomato seeds. Highly resistant to bacterial wilt and nematodes.", county: "Kirinyaga", organic: false, verifiedSeller: true },
  { id: "p7", name: "Knapsack Sprayer 16L", category: "Equipment", price: 3800, rating: 4.4, badge: "", image: p6Img, brand: "Cooper", stock: 34, description: "Manual shoulder-mounted garden and field sprayer. Adjustable nozzle with reinforced pressure chamber.", county: "Nairobi", organic: false, verifiedSeller: false },
  { id: "p8", name: "Drip Irrigation Kit (1 Acre)", category: "Irrigation", price: 18500, originalPrice: 22000, rating: 4.9, badge: "BESTSELLER", image: "https://images.unsplash.com/photo-1593113598332-cd288d649433?q=80&w=600&auto=format&fit=crop", brand: "DripTech", stock: 45, description: "Complete drip irrigation kit covering up to 1 acre. Includes main pipes, lateral lines, emitters, and valves.", county: "Kajiado", organic: false, verifiedSeller: true },
  { id: "p9", name: "Pyrethrum Pest Spray 1L", category: "Pest Control", price: 650, rating: 4.3, badge: "", image: p4Img, brand: "PyCo", stock: 67, description: "Natural, organic pesticide derived from pyrethrum flowers. Effectively eliminates aphids and armyworms.", county: "Nakuru", organic: true, verifiedSeller: true },
  { id: "p10", name: "NPK Fertilizer 50kg", category: "Fertilizers", price: 3100, rating: 4.7, badge: "", image: p1Img, brand: "Mavuno", stock: 95, description: "17-17-17 balanced crop fertilizer. Supports optimal development throughout all growth phases.", county: "Uasin Gishu", organic: false, verifiedSeller: true },
  { id: "p11", name: "Vegetable Seed Kit (10 varieties)", category: "Seeds", price: 1200, originalPrice: 1600, rating: 4.8, badge: "NEW", image: "https://images.unsplash.com/photo-1592417817098-8f3d6eb19675?q=80&w=600&auto=format&fit=crop", brand: "Kenya Seed", stock: 120, description: "All-in-one kitchen garden seed pack including kale, cabbage, spinach, coriander, carrots, onions, and more.", county: "Kiambu", organic: true, verifiedSeller: true },
  { id: "p12", name: "Garden Hand Tools Set", category: "Equipment", price: 2200, rating: 4.5, badge: "", image: "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?q=80&w=600&auto=format&fit=crop", brand: "Stanley", stock: 52, description: "Heavy-duty steel garden hand tools including trowel, cultivator rake, weeder, and pruning shears.", county: "Nairobi", organic: false, verifiedSeller: false }
];

const categories = [
  { id: "All", label: "All Items", icon: "📦" },
  { id: "Seeds", label: "Seeds", icon: "🌱" },
  { id: "Fertilizers", label: "Fertilizers", icon: "🧪" },
  { id: "Equipment", label: "Equipment", icon: "🚜" },
  { id: "Irrigation", label: "Irrigation", icon: "💧" },
  { id: "Pest Control", label: "Pest Control", icon: "🐛" },
  { id: "Organics", label: "Organics", icon: "🌿" }
];

const countiesList = ["All", "Nakuru", "Uasin Gishu", "Kiambu", "Machakos", "Kirinyaga", "Nairobi", "Kajiado"];

const trustedSellers = [
  { name: "AgroPlus Dealers", location: "Nakuru County", rating: 4.9, sales: "14,200+ bags", avatar: "🟢" },
  { name: "Yara Premium Hub", location: "Eldoret County", rating: 4.8, sales: "9,800+ bags", avatar: "🟡" },
  { name: "Rift Seed Distributors", location: "Kitale County", rating: 4.7, sales: "11,500+ packs", avatar: "🔵" },
  { name: "Greenfield Diagnostics", location: "Kiambu County", rating: 4.9, sales: "6,400+ units", avatar: "🟣" }
];

function Shop() {
  const [q, setQ] = useState("");
  const [selectedCat, setSelectedCat] = useState("All");
  const [priceRange, setPriceRange] = useState(30000);
  const [minRating, setMinRating] = useState(0);
  const [selectedCounty, setSelectedCounty] = useState("All");
  const [onlyOrganic, setOnlyOrganic] = useState(false);
  const [onlyVerified, setOnlyVerified] = useState(false);
  const [sortBy, setSortBy] = useState("relevance");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  
  // Interactive States
  const [wishlist, setWishlist] = useState<Set<string>>(new Set(["p1", "p8"]));
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);
  const [showFiltersMobile, setShowFiltersMobile] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [newsletterEmail, setNewsletterEmail] = useState("");

  // Countdown timer for Flash Deals (starts at 4h 32m 17s)
  const [timeLeft, setTimeLeft] = useState(4 * 3600 + 32 * 60 + 17);

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 4 * 3600 + 32 * 60 + 17));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const formatCountdown = (seconds: number) => {
    const h = Math.floor(seconds / 3600).toString().padStart(2, "0");
    const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, "0");
    const s = (seconds % 60).toString().padStart(2, "0");
    return `${h}:${m}:${s}`;
  };

  // Scroll to Top visibility
  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 400);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleAddToCart = (name: string) => {
    toast.success(`Added ${name} to cart!`);
  };

  const toggleWishlist = (id: string) => {
    const updated = new Set(wishlist);
    if (updated.has(id)) {
      updated.delete(id);
      toast.info("Removed from wishlist");
    } else {
      updated.add(id);
      toast.success("Saved to wishlist!");
    }
    setWishlist(updated);
  };

  const handleNewsletterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newsletterEmail) return;
    toast.success("Thank you for subscribing! Agri-deals are headed your way.");
    setNewsletterEmail("");
  };

  // Filtered & Sorted products
  const filteredProducts = useMemo(() => {
    return mockProducts.filter((p) => {
      const matchesSearch = p.name.toLowerCase().includes(q.toLowerCase()) || p.brand.toLowerCase().includes(q.toLowerCase()) || p.description.toLowerCase().includes(q.toLowerCase());
      const matchesCategory = selectedCat === "All" || p.category === selectedCat;
      const matchesPrice = p.price <= priceRange;
      const matchesRating = p.rating >= minRating;
      const matchesCounty = selectedCounty === "All" || p.county === selectedCounty;
      const matchesOrganic = !onlyOrganic || p.organic;
      const matchesVerified = !onlyVerified || p.verifiedSeller;

      return matchesSearch && matchesCategory && matchesPrice && matchesRating && matchesCounty && matchesOrganic && matchesVerified;
    }).sort((a, b) => {
      if (sortBy === "price-low") return a.price - b.price;
      if (sortBy === "price-high") return b.price - a.price;
      if (sortBy === "rating") return b.rating - a.rating;
      if (sortBy === "newest") return a.badge === "NEW" ? -1 : 1;
      return 0;
    });
  }, [q, selectedCat, priceRange, minRating, selectedCounty, onlyOrganic, onlyVerified, sortBy]);

  const flashDeals = useMemo(() => {
    return mockProducts.filter(p => p.originalPrice);
  }, []);

  return (
    <AppLayout>
      <div className="bg-background text-foreground">
        
        {/* 1. HERO FILTER BANNER */}
        <section className="relative border-b border-border/60 bg-gradient-to-br from-primary/5 via-background to-secondary/30 py-16">
          <div className="container-px mx-auto max-w-7xl text-center">
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-bold uppercase tracking-widest text-primary">
                <Sparkles className="h-3.5 w-3.5 text-gold" /> Direct Farm Delivery
              </span>
              <h1 className="mt-5 text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl md:text-6xl">
                Africa's Largest <span className="text-primary">Agri-Marketplace</span>
              </h1>
              <p className="mt-4 mx-auto max-w-xl text-sm text-muted-foreground md:text-base">
                Over 50,000 certified agricultural products sourced directly from verified manufacturers. Hand-delivered to your gate.
              </p>
            </motion.div>

            {/* Live Stats Row */}
            <div className="mx-auto mt-10 grid max-w-3xl grid-cols-3 gap-4 rounded-2xl border border-border/80 bg-card p-6 shadow-elegant">
              <div className="text-center">
                <div className="text-xl font-bold font-mono text-primary sm:text-2xl">12,400+</div>
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground mt-1">Active Farmers</div>
              </div>
              <div className="border-x border-border/80 text-center">
                <div className="text-xl font-bold font-mono text-primary sm:text-2xl">3,200+</div>
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground mt-1">Verified Inputs</div>
              </div>
              <div className="text-center">
                <div className="text-xl font-bold font-mono text-primary sm:text-2xl">47</div>
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground mt-1">Counties Reached</div>
              </div>
            </div>

            {/* Live Search Inputs */}
            <div className="mx-auto mt-8 flex max-w-xl items-center gap-2 rounded-full border border-border bg-card px-5 py-3 shadow-elegant">
              <Search className="h-4.5 w-4.5 text-muted-foreground" />
              <input 
                value={q} 
                onChange={(e) => setQ(e.target.value)} 
                placeholder="Search seeds, fertilizers, tools..." 
                className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground" 
              />
              {q && (
                <button onClick={() => setQ("")} className="text-muted-foreground hover:text-foreground">
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* Category Pill Filters */}
            <div className="mt-8 overflow-x-auto scrollbar-none py-2">
              <div className="flex justify-center gap-3 min-w-max px-4">
                {categories.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setSelectedCat(c.id)}
                    className={`flex items-center gap-2 rounded-full border px-5 py-2.5 text-xs font-bold transition-all duration-300 ${
                      selectedCat === c.id 
                        ? "border-primary bg-primary text-primary-foreground shadow-md" 
                        : "border-border bg-card text-muted-foreground hover:border-primary/30 hover:text-foreground"
                    }`}
                  >
                    <span>{c.icon}</span>
                    <span>{c.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* 2. FLASH DEALS STRIP */}
        <section className="border-y border-red-100 bg-red-50/50 py-6 overflow-hidden">
          <div className="container-px mx-auto max-w-7xl">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-3">
                <span className="inline-block animate-pulse rounded bg-red-600 px-2.5 py-1 text-xs font-bold tracking-widest text-white">
                  ⚡ FLASH DEALS
                </span>
                <div className="text-sm font-bold text-red-950">
                  Ends in: <span className="font-mono text-primary">{formatCountdown(timeLeft)}</span>
                </div>
              </div>
            </div>

            {/* Horizontally scrollable Deals Strip */}
            <div className="mt-6 flex gap-4 overflow-x-auto pb-2 scrollbar-none">
              {flashDeals.map((deal) => {
                const pct = deal.originalPrice ? Math.round(((deal.originalPrice - deal.price) / deal.originalPrice) * 100) : 0;
                return (
                  <div 
                    key={deal.id} 
                    className="w-[280px] shrink-0 rounded-2xl border border-red-100 bg-card p-3 shadow-elegant transition hover:border-red-300"
                  >
                    <div className="relative h-32 overflow-hidden rounded-xl bg-secondary">
                      <img 
                        src={deal.image} 
                        alt={deal.name} 
                        className="h-full w-full object-cover transition duration-300 hover:scale-105" 
                      />
                      <span className="absolute left-2 top-2 rounded bg-red-600 px-1.5 py-0.5 text-[9px] font-bold text-white">
                        -{pct}% OFF
                      </span>
                    </div>
                    <div className="mt-3">
                      <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">{deal.brand}</span>
                      <h3 className="line-clamp-1 text-sm font-bold text-foreground">{deal.name}</h3>
                      <div className="mt-2 flex items-baseline gap-2">
                        <span className="text-sm font-bold font-mono text-primary">KES {deal.price.toLocaleString()}</span>
                        <span className="text-xs font-mono text-muted-foreground line-through">KES {deal.originalPrice?.toLocaleString()}</span>
                      </div>
                      <button 
                        onClick={() => handleAddToCart(deal.name)}
                        className="mt-3 w-full rounded-lg bg-red-600/10 border border-red-600/30 py-2 text-center text-xs font-bold text-red-700 hover:bg-red-600 hover:text-white transition"
                      >
                        Claim Deal
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* 3. MAIN PRODUCT GRID */}
        <section className="container-px mx-auto max-w-7xl py-12">
          <div className="grid gap-8 lg:grid-cols-[280px_1fr]">
            
            {/* FILTER SIDEBAR (Left) */}
            <aside className="hidden flex-col gap-6 lg:flex">
              <div className="rounded-2xl border border-border bg-card p-5 shadow-elegant">
                <h2 className="text-sm font-extrabold uppercase tracking-wider text-foreground border-b border-border pb-3 flex items-center gap-2">
                  <SlidersHorizontal className="h-4 w-4 text-primary" /> Search Filters
                </h2>

                {/* Price Range Slider */}
                <div className="mt-6">
                  <label className="text-xs font-extrabold text-muted-foreground uppercase tracking-wider">Max Price (KES)</label>
                  <div className="mt-2 flex items-center justify-between text-xs font-mono text-foreground">
                    <span>0</span>
                    <span className="text-primary font-bold">KES {priceRange.toLocaleString()}</span>
                  </div>
                  <input 
                    type="range" 
                    min="400" 
                    max="30000" 
                    step="200"
                    value={priceRange} 
                    onChange={(e) => setPriceRange(Number(e.target.value))}
                    className="mt-3 w-full accent-primary" 
                  />
                </div>

                {/* County Location */}
                <div className="mt-6">
                  <label className="text-xs font-extrabold text-muted-foreground uppercase tracking-wider">County Location</label>
                  <select 
                    value={selectedCounty} 
                    onChange={(e) => setSelectedCounty(e.target.value)}
                    className="mt-2 w-full rounded-lg border border-border bg-background px-3 py-2 text-xs text-foreground outline-none"
                  >
                    {countiesList.map(c => (
                      <option key={c} value={c}>{c === "All" ? "All Counties" : c}</option>
                    ))}
                  </select>
                </div>

                {/* Ratings */}
                <div className="mt-6">
                  <label className="text-xs font-extrabold text-muted-foreground uppercase tracking-wider">Minimum Rating</label>
                  <div className="mt-2 flex flex-col gap-2">
                    {[0, 4.5, 4.8].map((stars) => (
                      <button 
                        key={stars}
                        onClick={() => setMinRating(stars)}
                        className={`flex items-center gap-2 text-xs transition ${minRating === stars ? "text-primary font-bold" : "text-muted-foreground hover:text-foreground"}`}
                      >
                        <div className={`h-3 w-3 rounded-full border ${minRating === stars ? "border-primary bg-primary" : "border-border bg-background"}`} />
                        {stars === 0 ? "All Ratings" : `${stars} ★ & Above`}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Toggles */}
                <div className="mt-6 space-y-3 border-t border-border pt-4">
                  <label className="flex items-center gap-2.5 cursor-pointer text-xs text-foreground/80">
                    <input 
                      type="checkbox" 
                      checked={onlyOrganic} 
                      onChange={(e) => setOnlyOrganic(e.target.checked)}
                      className="h-4 w-4 rounded accent-primary bg-background border-border" 
                    />
                    <span>🌱 Certified Organic</span>
                  </label>
                  <label className="flex items-center gap-2.5 cursor-pointer text-xs text-foreground/80">
                    <input 
                      type="checkbox" 
                      checked={onlyVerified} 
                      onChange={(e) => setOnlyVerified(e.target.checked)}
                      className="h-4 w-4 rounded accent-primary bg-background border-border" 
                    />
                    <span>✅ Verified Sellers</span>
                  </label>
                </div>

                {/* Clear Filters Button */}
                <button 
                  onClick={() => {
                    setPriceRange(30000);
                    setMinRating(0);
                    setSelectedCounty("All");
                    setOnlyOrganic(false);
                    setOnlyVerified(false);
                    setSelectedCat("All");
                    setQ("");
                    toast.success("Filters cleared");
                  }}
                  className="mt-6 w-full rounded-lg bg-secondary py-2 text-center text-xs font-bold text-foreground hover:bg-primary hover:text-primary-foreground transition"
                >
                  Reset Filters
                </button>

              </div>
            </aside>

            {/* PRODUCT LISTINGS (Right) */}
            <main>
              
              {/* Sort bar & Results count */}
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-4">
                <div className="text-xs font-bold text-muted-foreground">
                  Showing <span className="text-foreground font-extrabold">{filteredProducts.length}</span> results 
                  {selectedCat !== "All" && ` for '${selectedCat}'`}
                </div>

                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-muted-foreground">Sort by:</span>
                    <select 
                      value={sortBy} 
                      onChange={(e) => setSortBy(e.target.value)}
                      className="rounded bg-card border border-border px-2 py-1 text-foreground outline-none text-xs"
                    >
                      <option value="relevance">Relevance</option>
                      <option value="price-low">Price: Low to High</option>
                      <option value="price-high">Price: High to Low</option>
                      <option value="rating">Rating</option>
                      <option value="newest">New Releases</option>
                    </select>
                  </div>

                  <div className="flex items-center border border-border rounded-lg overflow-hidden bg-card">
                    <button 
                      onClick={() => setViewMode("grid")}
                      className={`p-2 transition ${viewMode === "grid" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
                    >
                      <Grid className="h-4 w-4" />
                    </button>
                    <button 
                      onClick={() => setViewMode("list")}
                      className={`p-2 transition ${viewMode === "list" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
                    >
                      <List className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Mobile Filter Button */}
              <div className="mt-4 flex lg:hidden">
                <button 
                  onClick={() => setShowFiltersMobile(true)}
                  className="flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-card py-3 text-xs font-bold text-foreground"
                >
                  <SlidersHorizontal className="h-4 w-4 text-primary" /> Filter & Sort Options
                </button>
              </div>

              {/* Products Grid / List */}
              {filteredProducts.length === 0 ? (
                <div className="mt-12 rounded-3xl border border-dashed border-border bg-card/50 py-24 text-center">
                  <span className="text-4xl">🔎</span>
                  <h3 className="mt-4 text-lg font-bold text-foreground">No products found</h3>
                  <p className="mt-2 text-xs text-muted-foreground">Try adjusting your search criteria or resetting filters.</p>
                </div>
              ) : viewMode === "grid" ? (
                <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-2 md:grid-cols-3">
                  {filteredProducts.map((p) => (
                    <article 
                      key={p.id} 
                      className="group relative flex flex-col overflow-hidden rounded-2xl border border-border/60 bg-card p-3 shadow-elegant transition hover:scale-[1.01] hover:border-primary/45 hover:shadow-elegant"
                    >
                      {/* Badge */}
                      {p.badge && (
                        <span className="absolute left-5 top-5 z-10 rounded bg-gold px-2.5 py-1 text-[8px] font-bold text-gold-foreground">
                          {p.badge}
                        </span>
                      )}

                      {/* Wishlist Heart */}
                      <button 
                        onClick={() => toggleWishlist(p.id)}
                        className="absolute right-5 top-5 z-10 grid h-8 w-8 place-items-center rounded-full bg-white/80 text-foreground shadow backdrop-blur transition hover:scale-110 active:scale-95"
                      >
                        <Heart className={`h-4 w-4 ${wishlist.has(p.id) ? "fill-red-500 text-red-500" : "text-muted-foreground hover:text-foreground"}`} />
                      </button>

                      {/* Image Area */}
                      <div className="relative aspect-square overflow-hidden rounded-xl bg-secondary">
                        <img 
                          src={p.image} 
                          alt={p.name} 
                          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" 
                        />
                        
                        {/* Quick View Button on Hover */}
                        <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                          <button 
                            onClick={() => setQuickViewProduct(p)}
                            className="flex items-center gap-1.5 rounded-full bg-blue px-4 py-2 text-xs font-bold text-white shadow-blue/20 transition hover:scale-105 active:scale-95"
                          >
                            <Eye className="h-4 w-4" /> Quick View
                          </button>
                        </div>
                      </div>

                      {/* Product Metadata */}
                      <div className="flex flex-1 flex-col pt-3">
                        <div className="flex items-center justify-between text-[9px] font-bold uppercase tracking-wider text-muted-foreground">
                          <span>{p.brand}</span>
                          <span className="flex items-center gap-1 text-primary">
                            <MapPin className="h-2.5 w-2.5" /> {p.county}
                          </span>
                        </div>
                        
                        <h3 className="mt-1 line-clamp-2 text-sm font-bold text-foreground group-hover:text-primary transition">
                          {p.name}
                        </h3>

                        {/* Ratings */}
                        <div className="mt-2 flex items-center gap-1 text-xs text-yellow-500">
                          <Star className="h-3.5 w-3.5 fill-yellow-500 text-yellow-500" />
                          <span className="font-bold">{p.rating}</span>
                          <span className="text-[10px] text-muted-foreground">(45 reviews)</span>
                        </div>

                        {/* Price row */}
                        <div className="mt-auto pt-3">
                          <div className="flex items-baseline gap-2">
                            <span className="text-base font-bold font-mono text-primary">KES {p.price.toLocaleString()}</span>
                            {p.originalPrice && (
                              <span className="text-xs font-mono text-muted-foreground line-through">KES {p.originalPrice.toLocaleString()}</span>
                            )}
                          </div>
                          <div className="text-[10px] text-muted-foreground mt-0.5">per unit</div>

                          {/* Add to Cart button */}
                          <button 
                            onClick={() => handleAddToCart(p.name)}
                            className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-gold py-2.5 text-xs font-bold text-gold-foreground shadow-gold hover:scale-[1.02] active:scale-100 transition-all duration-300"
                          >
                            Add to Cart
                          </button>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              ) : (
                // List View Mode
                <div className="mt-8 space-y-4">
                  {filteredProducts.map((p) => (
                    <article 
                      key={p.id} 
                      className="group flex flex-col gap-4 overflow-hidden rounded-2xl border border-border bg-card p-4 sm:flex-row shadow-elegant transition hover:border-primary/45"
                    >
                      <div className="relative aspect-square w-full shrink-0 sm:w-44 overflow-hidden rounded-xl bg-secondary">
                        <img src={p.image} alt={p.name} className="h-full w-full object-cover transition duration-300 group-hover:scale-105" />
                      </div>
                      <div className="flex flex-1 flex-col justify-between">
                        <div>
                          <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                            <span>{p.brand} · {p.category}</span>
                            <span className="flex items-center gap-1 text-primary">
                              <MapPin className="h-3 w-3" /> {p.county} County
                            </span>
                          </div>
                          <h3 className="mt-1 text-base font-bold text-foreground group-hover:text-primary transition">{p.name}</h3>
                          <p className="mt-2 text-xs text-muted-foreground line-clamp-2">{p.description}</p>
                        </div>
                        
                        <div className="mt-4 flex flex-wrap items-center justify-between gap-4 border-t border-border pt-4">
                          <div className="flex items-baseline gap-2">
                            <span className="text-lg font-bold font-mono text-primary">KES {p.price.toLocaleString()}</span>
                            {p.originalPrice && (
                              <span className="text-xs font-mono text-muted-foreground line-through">KES {p.originalPrice.toLocaleString()}</span>
                            )}
                          </div>

                          <div className="flex gap-2">
                            <button 
                              onClick={() => setQuickViewProduct(p)}
                              className="rounded-lg border border-border bg-background p-2 text-muted-foreground hover:text-foreground transition"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                            <button 
                              onClick={() => handleAddToCart(p.name)}
                              className="rounded-xl bg-gold px-6 py-2.5 text-xs font-bold text-gold-foreground shadow-gold"
                            >
                              Add to Cart
                            </button>
                          </div>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              )}

            </main>
          </div>
        </section>

        {/* 4. SPONSORED / FEATURED SELLERS */}
        <section className="border-t border-border/60 bg-secondary/20 py-16">
          <div className="container-px mx-auto max-w-7xl">
            <div className="text-center">
              <span className="text-xs font-bold uppercase tracking-widest text-primary">Verified Supply Chain</span>
              <h2 className="mt-2 text-2xl font-extrabold text-foreground sm:text-3xl">Trusted Sellers Near You</h2>
            </div>

            <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {trustedSellers.map((seller, idx) => (
                <div 
                  key={idx} 
                  className="rounded-2xl border border-border bg-card p-5 text-center shadow-elegant transition hover:border-primary/30"
                >
                  <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-background text-xl border border-border">
                    {seller.avatar}
                  </div>
                  <h3 className="mt-3 text-sm font-bold text-foreground">{seller.name}</h3>
                  <p className="text-xs text-muted-foreground mt-1">{seller.location}</p>
                  <div className="mt-4 flex items-center justify-center gap-1.5 text-xs text-yellow-500">
                    <Star className="h-3.5 w-3.5 fill-yellow-500 text-yellow-500" />
                    <span className="font-bold">{seller.rating}</span>
                    <span className="text-muted-foreground">· {seller.sales}</span>
                  </div>
                  <button 
                    onClick={() => toast.info(`Visiting store for ${seller.name}...`)}
                    className="mt-5 w-full rounded-xl bg-background border border-border py-2 text-xs font-bold text-foreground hover:border-primary transition"
                  >
                    Visit Store
                  </button>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 5. CATEGORY SHOWCASE (Bento Grid Layout) */}
        <section className="border-t border-border/60 py-16">
          <div className="container-px mx-auto max-w-7xl">
            <div className="text-center">
              <span className="text-xs font-bold uppercase tracking-widest text-primary">Interactive Map</span>
              <h2 className="mt-2 text-2xl font-extrabold text-foreground sm:text-3xl">Premium Seed & Input Showcases</h2>
            </div>

            {/* Bento Grid */}
            <div className="mt-10 grid gap-4 grid-cols-1 md:grid-cols-3">
              
              {/* Big Bento Card */}
              <div 
                onClick={() => setSelectedCat("Seeds")}
                className="relative h-64 md:h-auto md:row-span-2 rounded-3xl border border-border bg-cover bg-center overflow-hidden cursor-pointer group shadow-elegant"
                style={{ backgroundImage: `url(${p2Img})` }}
              >
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent transition duration-300 group-hover:from-black/90" />
                <div className="absolute bottom-6 left-6">
                  <span className="text-xs font-bold uppercase tracking-widest text-gold">🌱 Premium Seeds</span>
                  <h3 className="text-lg font-black text-white mt-1">Hybrid Seed Varieties</h3>
                  <p className="text-xs text-white/70 mt-1">Certified drought-resistant yields.</p>
                </div>
              </div>

              {/* Medium Bento Card 1 */}
              <div 
                onClick={() => setSelectedCat("Fertilizers")}
                className="relative h-48 rounded-3xl border border-border bg-cover bg-center overflow-hidden cursor-pointer group shadow-elegant"
                style={{ backgroundImage: `url(${p5Img})` }}
              >
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                <div className="absolute bottom-6 left-6">
                  <span className="text-xs font-bold uppercase tracking-widest text-gold">🧪 Top Dressing</span>
                  <h3 className="text-sm font-black text-white mt-1">Soil Nutrition & Fertilizer</h3>
                </div>
              </div>

              {/* Medium Bento Card 2 */}
              <div 
                onClick={() => setSelectedCat("Equipment")}
                className="relative h-48 rounded-3xl border border-border bg-cover bg-center overflow-hidden cursor-pointer group shadow-elegant"
                style={{ backgroundImage: `url(${p6Img})` }}
              >
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                <div className="absolute bottom-6 left-6">
                  <span className="text-xs font-bold uppercase tracking-widest text-gold">🚜 Mechanized farming</span>
                  <h3 className="text-sm font-black text-white mt-1">Equipment & Garden Tools</h3>
                </div>
              </div>

              {/* Small Bento Cards */}
              <div 
                onClick={() => setSelectedCat("Irrigation")}
                className="relative h-48 md:col-span-2 rounded-3xl border border-border bg-card p-6 flex flex-col justify-between cursor-pointer hover:border-primary/40 transition shadow-elegant group"
              >
                <div className="flex h-10 w-10 place-items-center justify-center rounded-xl bg-secondary text-lg border border-border">💧</div>
                <div>
                  <span className="text-xs font-bold uppercase tracking-widest text-primary">Irrigation Systems</span>
                  <h3 className="text-base font-black text-foreground mt-1">Drip Kits & Solar Pumps</h3>
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* 6. TRUST BADGES STRIP */}
        <section className="border-t border-border/60 bg-secondary/10 py-10">
          <div className="container-px mx-auto max-w-7xl">
            <div className="grid gap-6 grid-cols-2 md:grid-cols-5 text-center">
              <div className="flex flex-col items-center">
                <div className="grid h-10 w-10 place-items-center rounded-full bg-primary/10 text-primary"><ShieldCheck className="h-5 w-5 animate-pulse" /></div>
                <h4 className="mt-2 text-xs font-bold text-foreground">🔒 Secure M-Pesa</h4>
              </div>
              <div className="flex flex-col items-center">
                <div className="grid h-10 w-10 place-items-center rounded-full bg-primary/10 text-primary"><Truck className="h-5 w-5" /></div>
                <h4 className="mt-2 text-xs font-bold text-foreground">🚚 Nationwide Delivery</h4>
              </div>
              <div className="flex flex-col items-center">
                <div className="grid h-10 w-10 place-items-center rounded-full bg-primary/10 text-primary"><CheckCircle2 className="h-5 w-5" /></div>
                <h4 className="mt-2 text-xs font-bold text-foreground">✅ Verified Sellers Only</h4>
              </div>
              <div className="flex flex-col items-center">
                <div className="grid h-10 w-10 place-items-center rounded-full bg-primary/10 text-primary"><RotateCcw className="h-5 w-5" /></div>
                <h4 className="mt-2 text-xs font-bold text-foreground">🔄 Easy Returns</h4>
              </div>
              <div className="flex flex-col items-center col-span-2 md:col-span-1">
                <div className="grid h-10 w-10 place-items-center rounded-full bg-primary/10 text-primary"><PhoneCall className="h-5 w-5" /></div>
                <h4 className="mt-2 text-xs font-bold text-foreground">📞 24/7 Farmer Support</h4>
              </div>
            </div>
          </div>
        </section>

        {/* 7. NEWSLETTER / DEALS SIGNUP */}
        <section className="border-t border-border/60 py-16">
          <div className="container-px mx-auto max-w-7xl">
            <div className="rounded-3xl border border-border bg-card p-8 md:p-12 flex flex-col md:flex-row items-center justify-between gap-8 shadow-elegant">
              <div className="max-w-md text-left">
                <h2 className="text-2xl font-extrabold text-foreground sm:text-3xl">Get Farm Deals Before Anyone Else</h2>
                <p className="mt-2 text-xs text-muted-foreground">Subscribe to get weekly discounts, certified crop calendars, and local market price alerts.</p>
              </div>
              <form onSubmit={handleNewsletterSubmit} className="flex w-full max-w-md gap-2">
                <input 
                  type="email" 
                  value={newsletterEmail}
                  onChange={(e) => setNewsletterEmail(e.target.value)}
                  placeholder="Enter your email address" 
                  className="flex-1 rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none focus:border-primary"
                  required
                />
                <button 
                  type="submit" 
                  className="rounded-xl bg-gold px-6 py-3 text-xs font-bold text-gold-foreground shadow-gold hover:scale-[1.02] transition"
                >
                  Subscribe
                </button>
              </form>
            </div>
          </div>
        </section>

        {/* QUICK VIEW MODAL */}
        <AnimatePresence>
          {quickViewProduct && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm">
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="relative w-full max-w-2xl rounded-3xl border border-border bg-card p-6 shadow-elegant md:p-8"
              >
                <button 
                  onClick={() => setQuickViewProduct(null)}
                  className="absolute right-4 top-4 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-6 w-6" />
                </button>

                <div className="grid gap-6 md:grid-cols-2 text-left">
                  <div className="aspect-square overflow-hidden rounded-2xl bg-secondary">
                    <img src={quickViewProduct.image} alt={quickViewProduct.name} className="h-full w-full object-cover" />
                  </div>
                  
                  <div className="flex flex-col justify-between">
                    <div>
                      {quickViewProduct.badge && (
                        <span className="rounded bg-gold px-2.5 py-1 text-[8px] font-bold text-gold-foreground">
                          {quickViewProduct.badge}
                        </span>
                      )}
                      <h3 className="mt-3 text-xl font-bold text-foreground">{quickViewProduct.name}</h3>
                      <div className="mt-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">{quickViewProduct.brand}</div>
                      
                      <p className="mt-4 text-xs text-muted-foreground leading-relaxed">{quickViewProduct.description}</p>
                      
                      <div className="mt-4 space-y-1 text-xs text-foreground/80">
                        <div>County Origin: <span className="font-bold text-primary">{quickViewProduct.county}</span></div>
                        <div>Stock Level: <span className="font-bold text-primary">{quickViewProduct.stock} units remaining</span></div>
                      </div>
                    </div>

                    <div className="mt-6 border-t border-border pt-4">
                      <div className="text-2xl font-bold font-mono text-primary">KES {quickViewProduct.price.toLocaleString()}</div>
                      <button 
                        onClick={() => {
                          handleAddToCart(quickViewProduct.name);
                          setQuickViewProduct(null);
                        }}
                        className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-gold py-3 text-xs font-bold text-gold-foreground shadow-gold"
                      >
                        Add to Cart
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* MOBILE COLLAPSIBLE FILTERS DRAWER */}
        <AnimatePresence>
          {showFiltersMobile && (
            <div className="fixed inset-0 z-50 flex items-end bg-black/60 lg:hidden">
              <motion.div 
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                transition={{ type: "spring", damping: 25 }}
                className="relative w-full max-h-[85vh] overflow-y-auto rounded-t-3xl border-t border-border bg-card p-6 shadow-elegant text-left"
              >
                <div className="flex items-center justify-between border-b border-border pb-4">
                  <h3 className="text-sm font-extrabold uppercase tracking-wider text-foreground">Filter & Sort Options</h3>
                  <button onClick={() => setShowFiltersMobile(false)} className="text-muted-foreground hover:text-foreground">
                    <X className="h-6 w-6" />
                  </button>
                </div>

                {/* Price range */}
                <div className="mt-6">
                  <label className="text-xs font-extrabold text-muted-foreground uppercase tracking-wider">Max Price (KES)</label>
                  <div className="mt-2 flex items-center justify-between text-xs font-mono text-foreground">
                    <span>0</span>
                    <span className="text-primary font-bold">KES {priceRange.toLocaleString()}</span>
                  </div>
                  <input 
                    type="range" 
                    min="400" 
                    max="30000" 
                    step="200"
                    value={priceRange} 
                    onChange={(e) => setPriceRange(Number(e.target.value))}
                    className="mt-3 w-full accent-primary" 
                  />
                </div>

                {/* Location */}
                <div className="mt-6">
                  <label className="text-xs font-extrabold text-muted-foreground uppercase tracking-wider">County Location</label>
                  <select 
                    value={selectedCounty} 
                    onChange={(e) => setSelectedCounty(e.target.value)}
                    className="mt-2 w-full rounded-lg border border-border bg-background px-3 py-2 text-xs text-foreground outline-none"
                  >
                    {countiesList.map(c => (
                      <option key={c} value={c}>{c === "All" ? "All Counties" : c}</option>
                    ))}
                  </select>
                </div>

                {/* Toggles */}
                <div className="mt-6 space-y-3">
                  <label className="flex items-center gap-2.5 cursor-pointer text-xs text-foreground/80">
                    <input 
                      type="checkbox" 
                      checked={onlyOrganic} 
                      onChange={(e) => setOnlyOrganic(e.target.checked)}
                      className="h-4 w-4 rounded accent-primary bg-background border-border" 
                    />
                    <span>🌱 Certified Organic</span>
                  </label>
                  <label className="flex items-center gap-2.5 cursor-pointer text-xs text-foreground/80">
                    <input 
                      type="checkbox" 
                      checked={onlyVerified} 
                      onChange={(e) => setOnlyVerified(e.target.checked)}
                      className="h-4 w-4 rounded accent-primary bg-background border-border" 
                    />
                    <span>✅ Verified Sellers</span>
                  </label>
                </div>

                <button 
                  onClick={() => setShowFiltersMobile(false)}
                  className="mt-8 w-full rounded-xl bg-gold py-3 text-xs font-bold text-gold-foreground shadow-gold"
                >
                  Apply Filters
                </button>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* FLOAT SCROLL TO TOP */}
        <AnimatePresence>
          {showScrollTop && (
            <button 
              onClick={scrollToTop}
              className="fixed bottom-24 right-6 z-40 grid h-12 w-12 place-items-center rounded-full bg-primary text-primary-foreground shadow-lg hover:scale-110 active:scale-95 transition"
              aria-label="Scroll to top"
            >
              <ChevronUp className="h-5 w-5" />
            </button>
          )}
        </AnimatePresence>

      </div>
    </AppLayout>
  );
}
