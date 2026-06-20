import { createFileRoute, useNavigate } from "@tanstack/react-router";
import React, { useState, useEffect, useMemo, useRef, Suspense, lazy } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  ShoppingCart,
  User,
  Heart,
  ChevronLeft,
  ChevronRight,
  Truck,
  CheckCircle2,
  Lock,
  Clock,
  X,
  SlidersHorizontal,
  Star,
  MapPin,
  ChevronDown,
  Check,
  Grid,
  List,
  Eye,
  Trash2,
  Minus,
  Plus,
  ArrowRight
} from "lucide-react";
import { toast } from "sonner";
import {
  shopProducts,
  shopCategories,
  shopCounties,
  type ShopProduct
} from "@/lib/shop-data";
import { ProductCard, ProductCardSkeleton } from "@/components/shop/ProductCard";
import { AppLayout } from "@/components/mqulima/AppLayout";
import { useCart } from "@/lib/cart-context";

const FeaturedCrops = lazy(() =>
  import("@/components/shop/FeaturedCrops").then((m) => ({ default: m.FeaturedCrops }))
);
const QuickViewModal = lazy(() =>
  import("@/components/shop/QuickViewModal").then((m) => ({ default: m.QuickViewModal }))
);

export const Route = createFileRoute("/shop")({
  head: () => ({
    meta: [
      { title: "Mqulima Shop — Fresh Produce & Agri-Products" },
      {
        name: "description",
        content: "Experience premium African agricultural e-commerce. Buy fresh vegetables, grains, seeds, tools, and organic certified produce direct from farms.",
      },
    ],
  }),
  component: ShopPage,
});

const cropSlides = [
  {
    name: "Avocado",
    title: "Premium Hass Avocados",
    description: "Creamy, buttery textures and high oil-content. Hand-selected Grade A Hass varieties ready for export and local delivery.",
    image: "https://i.pinimg.com/736x/bd/6e/49/bd6e49db2306c22d5b19f8cf284f4908.jpg",
    qualityTags: ["The Fresh Harvest", "Premium Quality", "Grade A", "Organic"],
    availability: "In Stock",
    availabilityType: "success",
    price: 30,
    unit: "piece"
  },
  {
    name: "Bananas",
    title: "Sun-Ripened Sweet Bananas",
    description: "Naturally grown, pesticide-free sweet yellow bananas. Harvested at peak maturity from family orchard farms.",
    image: "https://i.pinimg.com/736x/5f/f9/df/5ff9df1121c6bc9f0d77c9385c5bb086.jpg",
    qualityTags: ["Fresh", "Naturally Grown", "Pesticide-Free", "Farm Fresh"],
    availability: "Available Today",
    availabilityType: "info",
    price: 15,
    unit: "bunch"
  },
  {
    name: "Cabbages",
    title: "Crisp Volcanic Green Cabbages",
    description: "Firm, crunchy, iron-rich heads of green cabbage grown in rich volcanic soils. Harvested fresh at sunrise.",
    image: "https://i.pinimg.com/736x/f2/cc/ba/f2ccbafdd490c446be68de1f01555675.jpg",
    qualityTags: ["Farm Fresh", "Organic", "Grade A", "Pesticide-Free"],
    availability: "Ready for Harvest",
    availabilityType: "success",
    price: 80,
    unit: "head"
  },
  {
    name: "Peanuts",
    title: "Sun-Dried Red-Skin Peanuts",
    description: "Crunchy, high-protein raw peanuts. Perfectly sun-dried and hand-sorted for the highest snack and seed grade.",
    image: "https://i.pinimg.com/736x/bf/00/8e/bf008eb95a19f445240aad86ebe391b6.jpg",
    qualityTags: ["Naturally Grown", "Fresh Harvest", "Premium Quality"],
    availability: "Limited Stock",
    availabilityType: "warning",
    price: 150,
    unit: "kg"
  },
  {
    name: "Cereals",
    title: "Premium High-Yield Grains",
    description: "Cleanly sifted, dried sorghum, millet, and maize cereals. Ideal for long-term storage and high-quality meals.",
    image: "https://i.pinimg.com/736x/ae/f4/f1/aef4f1fef5b031d49f03b5f155fa7d20.jpg",
    qualityTags: ["Grade A", "Export Quality", "Premium Quality"],
    availability: "Pre-Order",
    availabilityType: "info",
    price: 120,
    unit: "kg"
  },
  {
    name: "Mangoes",
    title: "Juicy Machakos Apple Mangoes",
    description: "Sweet, fleshy, fiberless Kent and Apple mangoes sourced from sun-soaked eastern region organic orchards.",
    image: "https://i.pinimg.com/736x/e6/54/29/e654296e5b46b5d5a3f961fb9994d5b3.jpg",
    qualityTags: ["Fresh Harvest", "Organic", "Export Quality", "Naturally Grown"],
    availability: "Seasonal",
    availabilityType: "warning",
    price: 45,
    unit: "piece"
  },
];

type CartItem = {
  product: ShopProduct;
  quantity: number;
};

function ShopPage() {
  const navigate = useNavigate();
  // Navigation & Cart state from global context
  const { cartItems, cartOpen, setCartOpen, addToCart, buyNow } = useCart();
  const [cartBump, setCartBump] = useState(false);
  const [wishlist, setWishlist] = useState<Set<string>>(new Set(["p1", "p4"]));
  const [recentlyViewed, setRecentlyViewed] = useState<ShopProduct[]>([]);
  
  // Grid/List Layout Mode
  const [layout, setLayout] = useState<"grid" | "list">("grid");

  // Quick View selected product
  const [quickViewProduct, setQuickViewProduct] = useState<ShopProduct | null>(null);

  // Search & Filter state
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [priceRange, setPriceRange] = useState<number>(10000);
  const [selectedCounty, setSelectedCounty] = useState("All");
  const [minRating, setMinRating] = useState<number>(0);
  const [organicOnly, setOrganicOnly] = useState(false);
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [sortBy, setSortBy] = useState<string>("relevance");
  
  // Detail page selection
  const [selectedProduct, setSelectedProduct] = useState<ShopProduct | null>(null);

  // Filter drawer/popover display
  const [activeFilterTab, setActiveFilterTab] = useState<string | null>(null);

  // Backward compatibility helper for pagination resets
  const setCurrentPage = (val: any) => {};

  // Particle fly animation coordinates
  const [flyingParticles, setFlyingParticles] = useState<{ id: number; startX: number; startY: number; image: string }[]>([]);
  
  // Refs
  const cartIconRef = useRef<HTMLAnchorElement>(null);
  const filterBarRef = useRef<HTMLDivElement>(null);

  // Compute dynamic cart total quantity
  const cartCount = useMemo(() => {
    return cartItems.reduce((acc, item) => acc + item.quantity, 0);
  }, [cartItems]);

  // Search input and debounced search query state
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const handler = setTimeout(() => {
      setSearchQuery(searchInput);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchInput]);

  // Loading state for skeletons
  const [isLoading, setIsLoading] = useState(true);
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 600);
    return () => clearTimeout(timer);
  }, []);

  // Load localStorage data on mount
  useEffect(() => {
    try {
      const storedViewed = localStorage.getItem("mqulima_recently_viewed");
      if (storedViewed) {
        setRecentlyViewed(JSON.parse(storedViewed));
      }
      const storedWishlist = localStorage.getItem("mqulima_wishlist");
      if (storedWishlist) {
        setWishlist(new Set(JSON.parse(storedWishlist)));
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  // Pagination / Infinite scrolling state
  const [visibleCount, setVisibleCount] = useState(8);
  const observerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setVisibleCount((prev) => prev + 8);
        }
      },
      { threshold: 0.1 }
    );

    const currentRef = observerRef.current;
    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, [observerRef]);

  // Reset page count when filters change
  useEffect(() => {
    setVisibleCount(8);
  }, [searchQuery, selectedCategory, priceRange, selectedCounty, minRating, organicOnly, verifiedOnly, sortBy]);

  // Flash Sale countdown timer
  const [timeLeft, setTimeLeft] = useState(0);
  const [isMounted, setIsMounted] = useState(false);
  const [saleEnded, setSaleEnded] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    const targetTime = Date.now() + 6 * 60 * 60 * 1000;

    const updateTimer = () => {
      const diff = Math.max(0, Math.floor((targetTime - Date.now()) / 1000));
      setTimeLeft(diff);
      if (diff <= 0) {
        setSaleEnded(true);
      }
    };

    updateTimer();
    const timer = setInterval(updateTimer, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatCountdown = (seconds: number) => {
    const h = Math.floor(seconds / 3600).toString().padStart(2, "0");
    const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, "0");
    const s = (seconds % 60).toString().padStart(2, "0");
    return `${h}:${m}:${s}`;
  };

  const handleOrderCrop = (cropName: string) => {
    const matched = shopProducts.find(
      (p) => p.name.toLowerCase().includes(cropName.toLowerCase()) || cropName.toLowerCase().includes(p.name.toLowerCase())
    );
    if (matched) {
      setSelectedProduct(matched);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      setSearchQuery(cropName);
      const gridSection = document.getElementById("product-grid-section");
      gridSection?.scrollIntoView({ behavior: "smooth" });
    }
  };

  // Simulate skeleton loaders on filtering
  const handleCategoryChange = (category: string) => {
    setSelectedProduct(null); // return to store grid
    setSelectedCategory(category);
    setIsLoading(true);
    setCurrentPage(1);
    setTimeout(() => {
      setIsLoading(false);
    }, 500);
  };

  // Filter & Sort Logic
  const filteredProducts = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    
    return shopProducts
      .filter((product) => {
        // Category chip filter
        if (selectedCategory === "Organic") {
          if (!product.organic) return false;
        } else if (selectedCategory !== "All" && product.category !== selectedCategory) {
          return false;
        }

        // Search text query
        if (query) {
          const searchContent = `${product.name} ${product.brand} ${product.category} ${product.description}`.toLowerCase();
          if (!searchContent.includes(query)) return false;
        }

        // Extra filter inputs
        if (product.price > priceRange) return false;
        if (product.rating < minRating) return false;
        if (selectedCounty !== "All" && product.county !== selectedCounty) return false;
        if (organicOnly && !product.organic) return false;
        if (verifiedOnly && !product.verifiedSeller) return false;

        return true;
      })
      .sort((a, b) => {
        if (sortBy === "price-low") return a.price - b.price;
        if (sortBy === "price-high") return b.price - a.price;
        if (sortBy === "rating") return b.rating - a.rating;
        if (sortBy === "newest") return Number(b.badge === "New") - Number(a.badge === "New");
        return 0; // relevance / natural
      });
  }, [searchQuery, selectedCategory, priceRange, selectedCounty, minRating, organicOnly, verifiedOnly, sortBy]);

  // Flash Sale products
  const flashSaleProducts = useMemo(() => {
    return shopProducts.filter((p) => p.originalPrice).slice(0, 4);
  }, []);

  // Pagination calculations
  const displayedProducts = useMemo(() => {
    return filteredProducts.slice(0, visibleCount);
  }, [filteredProducts, visibleCount]);

  // Handle Add To Cart and trigger fly animation
  const handleAddToCart = (product: ShopProduct, event: React.MouseEvent) => {
    // Generate flying particle coordinates
    const particle = {
      id: Date.now(),
      startX: event.clientX || window.innerWidth / 2,
      startY: event.clientY || window.innerHeight / 2,
      image: product.image
    };

    setFlyingParticles((prev) => [...prev, particle]);
    
    // Add to cart using global context
    addToCart(product, 1);
  };

  const handleBuyNow = (product: ShopProduct, event: React.MouseEvent) => {
    buyNow(product);
  };

  // Toggle wishlist handler
  const handleToggleWishlist = (id: string) => {
    setWishlist((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
        toast.info("Removed from wishlist");
      } else {
        next.add(id);
        toast.success("Added to wishlist!");
      }
      try {
        localStorage.setItem("mqulima_wishlist", JSON.stringify(Array.from(next)));
      } catch (e) {
        console.error(e);
      }
      return next;
    });
  };

  // Select product for full page details
  const handleSelectProduct = (product: ShopProduct) => {
    navigate({
      to: "/shop/$productId",
      params: { productId: String(product.id) }
    });
    
    // Add to recently viewed if not already in it
    setRecentlyViewed((prev) => {
      const filtered = prev.filter((p) => p.id !== product.id);
      const updated = [product, ...filtered].slice(0, 5);
      try {
        localStorage.setItem("mqulima_recently_viewed", JSON.stringify(updated));
      } catch (e) {
        console.error(e);
      }
      return updated;
    });
  };

  // Reset all filters
  const resetFilters = () => {
    setSearchInput("");
    setSearchQuery("");
    setSelectedCategory("All");
    setPriceRange(10000);
    setSelectedCounty("All");
    setMinRating(0);
    setOrganicOnly(false);
    setVerifiedOnly(false);
    setSortBy("relevance");
    setSelectedProduct(null);
    toast.success("Filters cleared");
  };

  // Check active filters count
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (priceRange < 10000) count++;
    if (selectedCounty !== "All") count++;
    if (minRating > 0) count++;
    if (organicOnly) count++;
    if (verifiedOnly) count++;
    return count;
  }, [priceRange, selectedCounty, minRating, organicOnly, verifiedOnly]);

  return (
    <AppLayout>
      <div className="min-h-screen bg-[#FAFAF8] text-[#1A1A1A] font-sans antialiased pb-16">
        {/* ADD TO CART PARTICLE ANIMATION */}
        <AnimatePresence>
          {flyingParticles.map((particle) => (
            <motion.div
              key={particle.id}
              initial={{ x: particle.startX, y: particle.startY, scale: 0.8, opacity: 1 }}
              animate={{
                x: window.innerWidth - 60,
                y: 20,
                scale: 0.1,
                opacity: 0.2
              }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.75, ease: "easeInOut" }}
              onAnimationComplete={() => {
                setFlyingParticles((prev) => prev.filter((p) => p.id !== particle.id));
                setCartBump(true);
                setTimeout(() => setCartBump(false), 250);
              }}
              className="fixed z-[9999] h-12 w-12 pointer-events-none overflow-hidden rounded-full border-2 border-[#1A6B3C] bg-white shadow-lg"
            >
              <img src={particle.image} className="h-full w-full object-cover" />
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Search Input, Title, and Category Pills */}
        <div className="bg-white border-b border-[#F0F0F0] py-6 text-left">
          <div className="container-px mx-auto max-w-7xl flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-serif font-black tracking-tight text-[#1A1A1A] uppercase">Agri-Marketplace</h1>
              <p className="text-xs text-[#6B7280]">Fresh produce, hybrid seeds, tools, and organic certified inputs direct from trusted farmers.</p>
            </div>
            <div className="relative w-full md:max-w-md">
              <div className="relative flex items-center h-11 w-full rounded-xl border border-[#E5E7EB] bg-[#FAFAF8] px-4 transition-all focus-within:border-[#1A6B3C] focus-within:bg-white focus-within:ring-1 focus-within:ring-[#1A6B3C]/10 shadow-sm">
                <Search className="h-4.5 w-4.5 text-[#6B7280] mr-2" />
                <input
                  type="text"
                  placeholder="Search for fresh produce, seeds, tools..."
                  value={searchInput}
                  onChange={(e) => {
                    setSelectedProduct(null); // return to search grid
                    setSearchInput(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full bg-transparent text-xs text-[#1A1A1A] outline-none placeholder:text-[#6B7280]"
                />
                {searchInput && (
                  <button onClick={() => setSearchInput("")} className="text-[#6B7280] hover:text-[#1A1A1A]">
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Category Pills */}
          <div className="container-px mx-auto max-w-7xl mt-6">
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
              {shopCategories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => handleCategoryChange(cat.id)}
                  className={`flex items-center gap-1.5 shrink-0 rounded-full px-4 py-1.5 text-xs font-semibold transition-all duration-200 border ${
                    selectedCategory === cat.id && !selectedProduct
                      ? "bg-[#1A6B3C] border-[#1A6B3C] text-white shadow-sm"
                      : "bg-[#FAFAF8] border-[#E8ECE9] text-[#6B7280] hover:border-[#1A6B3C]/20 hover:text-[#1A1A1A]"
                  }`}
                >
                  <span>{cat.icon}</span>
                  <span>{cat.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

      {/* SWAPPABLE MAIN BODY */}
      <AnimatePresence mode="wait">
        {selectedProduct ? (
          // PRODUCT DETAILS VIEW (MATCHING SECOND SCREENSHOT)
          <motion.div
            key="product-details"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.3 }}
            className="pb-16"
          >
            {/* Breadcrumb strip */}
            <div className="bg-white border-b border-[#F0F0F0] py-3 text-left">
              <div className="container-px mx-auto max-w-7xl flex items-center gap-1.5 text-xs text-[#6B7280]">
                <a
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    setSelectedProduct(null);
                  }}
                  className="hover:text-[#1A6B3C]"
                >
                  Home
                </a>
                <span>/</span>
                <span className="hover:text-[#1A6B3C]">Shop</span>
                <span>/</span>
                <span className="hover:text-[#1A6B3C]">{selectedProduct.category}</span>
                <span>/</span>
                <span className="text-[#1A1A1A] font-semibold">{selectedProduct.name}</span>
              </div>
            </div>

            {/* Product details panel */}
            <div className="container-px mx-auto max-w-7xl mt-8">
              <div className="grid gap-8 md:grid-cols-2 bg-white p-6 md:p-10 border border-[#E5E7EB] text-left">
                
                {/* Left Column: Image with red OFFER badge */}
                <div className="relative aspect-square w-full bg-white flex items-center justify-center p-4 border border-[#F0F0F0]">
                  <img
                    src={selectedProduct.image}
                    alt={selectedProduct.name}
                    className="h-full w-full object-contain max-h-[400px]"
                  />
                  <span className="absolute left-4 top-4 rounded-sm bg-red-600 px-3 py-1 text-xs font-bold text-white uppercase tracking-wider">
                    Offer
                  </span>
                  {selectedProduct.organic && (
                    <span className="absolute left-4 top-12 rounded-sm bg-[#1A6B3C] px-3 py-1 text-xs font-bold text-white uppercase tracking-wider">
                      Organic
                    </span>
                  )}
                </div>

                {/* Right Column: Information & Key Specs */}
                <div className="flex flex-col">
                  {/* Category breadcrumb path */}
                  <span className="text-xs font-bold uppercase tracking-wider text-[#6B7280]">
                    {selectedProduct.category}
                  </span>

                  {/* Title */}
                  <h1 className="mt-2 text-2xl font-extrabold text-[#1A1A1A] md:text-3xl leading-tight">
                    {selectedProduct.name}
                  </h1>

                  {/* Stars Rating & In stock badge */}
                  <div className="mt-3 flex items-center gap-3">
                    <div className="flex items-center gap-0.5 text-xs text-[#F5A623]">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={`h-4.5 w-4.5 ${
                            i < Math.floor(selectedProduct.rating) ? "fill-[#F5A623] text-[#F5A623]" : "text-gray-200"
                          }`}
                        />
                      ))}
                      <span className="font-bold text-[#1A1A1A] ml-1">{selectedProduct.rating}</span>
                      <span className="text-[#6B7280] text-xs ml-1">({selectedProduct.reviewsCount} Reviews)</span>
                    </div>
                    <div className="h-3 w-px bg-gray-200" />
                    <span className="rounded-sm border border-[#1A6B3C]/30 bg-[#E8F5E9] px-2 py-0.5 text-[10px] font-bold text-[#1A6B3C] uppercase tracking-wider">
                      In Stock
                    </span>
                  </div>

                  {/* Key Features Bullet List (styled like the second screenshot) */}
                  <div className="mt-6">
                    <h3 className="text-xs font-extrabold text-[#1A1A1A] uppercase tracking-wider">
                      {selectedProduct.name} Key Features
                    </h3>
                    <ul className="mt-3 space-y-2 text-xs text-[#1A1A1A]">
                      <li className="flex items-start gap-1.5">
                        <span className="text-[#1A6B3C] font-bold">•</span>
                        <span><strong>County Origin:</strong> {selectedProduct.county} County</span>
                      </li>
                      <li className="flex items-start gap-1.5">
                        <span className="text-[#1A6B3C] font-bold">•</span>
                        <span><strong>Cultivator:</strong> {selectedProduct.brand} (Verified Seller)</span>
                      </li>
                      <li className="flex items-start gap-1.5">
                        <span className="text-[#1A6B3C] font-bold">•</span>
                        <span><strong>Organic Certified:</strong> {selectedProduct.organic ? "Yes (Grade A Natural)" : "No (Standard Farm Yield)"}</span>
                      </li>
                      <li className="flex items-start gap-1.5">
                        <span className="text-[#1A6B3C] font-bold">•</span>
                        <span><strong>Farming Style:</strong> Sourced directly from rich volcanic soils</span>
                      </li>
                      <li className="flex items-start gap-1.5">
                        <span className="text-[#1A6B3C] font-bold">•</span>
                        <span><strong>Packaging:</strong> Recyclable eco-wash bundle</span>
                      </li>
                      <li className="flex items-start gap-1.5">
                        <span className="text-[#1A6B3C] font-bold">•</span>
                        <span><strong>Stock Level:</strong> {selectedProduct.stock} units remaining</span>
                      </li>
                    </ul>
                  </div>

                  {/* Pricing display in red */}
                  <div className="mt-6 border-t border-[#F0F0F0] pt-4">
                    <div className="flex items-baseline gap-2">
                      <span className="font-sans text-2xl font-black text-red-600">
                        KSh {selectedProduct.price.toLocaleString()}
                      </span>
                      {selectedProduct.originalPrice && (
                        <span className="font-sans text-sm text-[#6B7280] line-through">
                          KSh {selectedProduct.originalPrice.toLocaleString()}
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-[#6B7280]">per {selectedProduct.unit}</span>
                  </div>

                  {/* Lock Exact Price click trigger */}
                  <button
                    onClick={() => toast.success(`Exact unit price is locked at KSh ${selectedProduct.price}!`)}
                    className="mt-4 flex w-fit items-center gap-1.5 rounded-sm border border-[#E5E7EB] bg-white px-4 py-1.5 text-xs font-bold text-[#1A1A1A] hover:bg-[#FAFAF8]"
                  >
                    <span>Click to View Exact Price</span>
                    <span>∨</span>
                  </button>

                  {/* Green alert corporate / care contact panel */}
                  <div className="mt-6 rounded-sm bg-[#E8F5E9] p-4 text-xs text-[#1A6B3C] leading-relaxed border border-[#1A6B3C]/10">
                    <ul className="space-y-1.5 list-disc list-inside">
                      <li>Our Corporate customers can place bulk orders at <a href="mailto:corporates@mqulima.com" className="underline font-semibold">corporates@mqulima.com</a></li>
                      <li>Call Mqulima Care for direct assistance at <strong className="font-bold">0745 063030</strong></li>
                      <li><strong>NB:</strong> Freshness guarantee registration is verified upon delivery dispatch</li>
                      <li><strong>Disclaimer:</strong> We cannot guarantee that the exact soil specs on this page are 100% correct, but all produce is verified organic.</li>
                    </ul>
                  </div>

                  {/* Cart Action Buttons */}
                  <div className="mt-6 flex gap-3">
                    <button
                      onClick={(e) => handleAddToCart(selectedProduct, e)}
                      className="flex-1 rounded-sm bg-[#1A6B3C] py-3 text-xs font-bold text-white uppercase tracking-wider text-center hover:bg-[#155430] transition-colors"
                    >
                      Add to Cart
                    </button>
                    <button
                      onClick={() => handleToggleWishlist(selectedProduct.id)}
                      className="grid h-11 w-11 place-items-center rounded-sm border border-[#E5E7EB] bg-white text-[#6B7280] hover:text-red-500 transition-colors"
                      aria-label="Wishlist"
                    >
                      <Heart className={`h-5 w-5 ${wishlist.has(selectedProduct.id) ? "fill-red-500 text-red-500" : ""}`} />
                    </button>
                  </div>
                </div>

              </div>
            </div>
          </motion.div>
        ) : (
          // STOREFRONT GRID VIEW
          <motion.div
            key="storefront-grid"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {/* 2. CROP SHOWCASE HERO CAROUSEL */}
            <Suspense fallback={
              <div className="container-px mx-auto max-w-7xl mt-8 mb-8 text-left h-[260px] animate-shimmer rounded-2xl" />
            }>
              <FeaturedCrops cropSlides={cropSlides} onOrderCrop={handleOrderCrop} />
            </Suspense>

            {/* 3. TRUST BAR */}
            <section className="bg-white border-b border-[#F0F0F0] py-4">
              <div className="container-px mx-auto max-w-7xl">
                <div className="grid grid-cols-2 gap-4 md:grid-cols-4 items-center">
                  
                  <div className="flex items-center gap-3 justify-center md:justify-start">
                    <div className="grid h-9 w-9 place-items-center rounded-full bg-[#1A6B3C]/10 text-[#1A6B3C]">
                      <Truck className="h-5 w-5" />
                    </div>
                    <div className="text-left leading-none">
                      <div className="text-xs font-bold text-[#1A1A1A]">Fast Delivery</div>
                      <span className="text-[10px] text-[#6B7280]">Same-day dispatch</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 justify-center md:border-l md:border-[#F0F0F0] md:pl-4">
                    <div className="grid h-9 w-9 place-items-center rounded-full bg-[#1A6B3C]/10 text-[#1A6B3C]">
                      <CheckCircle2 className="h-5 w-5" />
                    </div>
                    <div className="text-left leading-none">
                      <div className="text-xs font-bold text-[#1A1A1A]">Quality Assured</div>
                      <span className="text-[10px] text-[#6B7280]">100% verified produce</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 justify-center border-l border-[#F0F0F0] pl-4">
                    <div className="grid h-9 w-9 place-items-center rounded-full bg-[#1A6B3C]/10 text-[#1A6B3C]">
                      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                      </svg>
                    </div>
                    <div className="text-left leading-none">
                      <div className="text-xs font-bold text-[#1A1A1A]">Farm Direct</div>
                      <span className="text-[10px] text-[#6B7280]">Fresh from growers</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 justify-center border-l border-[#F0F0F0] pl-4">
                    <div className="grid h-9 w-9 place-items-center rounded-full bg-[#1A6B3C]/10 text-[#1A6B3C]">
                      <Lock className="h-5 w-5" />
                    </div>
                    <div className="text-left leading-none">
                      <div className="text-xs font-bold text-[#1A1A1A]">Secure Payment</div>
                      <span className="text-[10px] text-[#6B7280]">M-Pesa integrated</span>
                    </div>
                  </div>

                </div>
              </div>
            </section>

            {/* 4. FLASH SALE SECTION */}
            {!saleEnded && (
              <section className="py-10 bg-white border-b border-[#F0F0F0]">
                <div className="container-px mx-auto max-w-7xl">
                  <div className="flex items-center justify-between border-b border-[#F0F0F0] pb-4">
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="text-lg font-black tracking-tight text-[#1A1A1A] flex items-center gap-1">
                        ⚡ Flash Sale
                      </span>
                      <div className="flex items-center gap-1.5 rounded-full bg-red-50 px-3 py-1 text-xs font-bold text-red-600">
                        <Clock className="h-3.5 w-3.5" />
                        <span>Ends in: <span className="font-mono text-red-700">{isMounted ? formatCountdown(timeLeft) : "00:00:00"}</span></span>
                      </div>
                    </div>
                    <a
                      href="#product-grid-section"
                      className="text-xs font-bold text-[#2D6A4F] hover:underline"
                      onClick={(e) => {
                        e.preventDefault();
                        const gridSection = document.getElementById("product-grid-section");
                        gridSection?.scrollIntoView({ behavior: "smooth" });
                      }}
                    >
                      See All Deals →
                    </a>
                  </div>

                  <div className="mt-6 flex gap-4 overflow-x-auto pb-4 scrollbar-none">
                    {flashSaleProducts.map((product) => {
                      const discount = product.originalPrice
                        ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
                        : 0;

                      return (
                        <div
                          key={product.id}
                          className="w-[260px] shrink-0 rounded-[12px] bg-white p-3 border border-[#E8ECE9] hover:border-[#2D6A4F] hover:shadow-md transition-all cursor-pointer text-left"
                          onClick={() => handleSelectProduct(product)}
                        >
                          <div className="relative aspect-square overflow-hidden bg-[#FAFAF8] rounded-[8px]">
                            <img
                              src={product.image}
                              alt={product.name}
                              className="h-full w-full object-cover transition-transform duration-300 hover:scale-103"
                              loading="lazy"
                            />
                            <span className="absolute left-2.5 top-2.5 rounded-full bg-red-600 px-2 py-0.5 text-[9px] font-extrabold text-white">
                              -{discount}% OFF
                            </span>
                          </div>
                          
                          <div className="mt-3">
                            <h3 className="line-clamp-1 text-sm font-bold text-[#1A1A1A] hover:text-[#2D6A4F]">
                              {product.name}
                            </h3>
                            <span className="text-[10px] text-[#6B7280]">by {product.brand}</span>
                            
                            <div className="mt-2 flex items-baseline gap-1">
                              <span className="font-sans text-sm font-extrabold text-[#2D6A4F]">
                                KES {product.price.toLocaleString()}
                              </span>
                              {product.originalPrice && (
                                <span className="font-sans text-[11px] text-[#6B7280] line-through ml-2">
                                  KES {product.originalPrice.toLocaleString()}
                                </span>
                              )}
                            </div>

                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleAddToCart(product, e);
                              }}
                              className="mt-3.5 w-full rounded-[8px] border border-[#2D6A4F] bg-white py-1.5 text-center text-xs font-bold text-[#2D6A4F] hover:bg-[#2D6A4F] hover:text-white transition-colors"
                            >
                              Add to Cart
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </section>
            )}

            {/* 5. FILTER + SORT BAR */}
            <section
              ref={filterBarRef}
              className="sticky top-[64px] z-30 bg-white/95 backdrop-blur-md border-b border-[#F0F0F0] py-3"
            >
              <div className="container-px mx-auto max-w-7xl flex flex-wrap items-center justify-between gap-3 text-left">
                <div className="text-xs text-[#6B7280]">
                  Showing <strong className="text-[#1A1A1A]">{filteredProducts.length}</strong> products
                  {selectedCategory !== "All" && (
                    <span> in <strong className="text-[#1A6B3C]">{selectedCategory}</strong></span>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs text-[#6B7280] flex items-center gap-1 mr-1">
                    <SlidersHorizontal className="h-3.5 w-3.5 text-[#1A6B3C]" /> Filter:
                  </span>

                  {/* Price Range Pill */}
                  <div className="relative">
                    <button
                      onClick={() => setActiveFilterTab(activeFilterTab === "price" ? null : "price")}
                      className={`flex items-center gap-1 rounded-full border px-3 py-1.5 text-xs font-semibold ${
                        priceRange < 10000 ? "border-[#1A6B3C] bg-[#1A6B3C]/5 text-[#1A6B3C]" : "border-[#E8ECE9] text-[#6B7280]"
                      }`}
                    >
                      <span>Max Price: KES {priceRange.toLocaleString()}</span>
                      <ChevronDown className="h-3 w-3" />
                    </button>
                    {activeFilterTab === "price" && (
                      <div className="absolute left-0 mt-2 z-50 w-56 rounded-2xl border border-[#F0F0F0] bg-white p-4 shadow-xl">
                        <div className="flex items-center justify-between text-xs text-[#6B7280]">
                          <span>Min: KES 0</span>
                          <span>Max: KES 10,000</span>
                        </div>
                        <input
                          type="range"
                          min="50"
                          max="10000"
                          step="50"
                          value={priceRange}
                          onChange={(e) => setPriceRange(Number(e.target.value))}
                          className="w-full mt-2 accent-[#1A6B3C]"
                        />
                        <div className="mt-3 flex justify-end">
                          <button
                            onClick={() => setActiveFilterTab(null)}
                            className="rounded-lg bg-[#1A6B3C] px-3 py-1 text-[10px] font-bold text-white"
                          >
                            Apply
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Location Pill */}
                  <div className="relative">
                    <button
                      onClick={() => setActiveFilterTab(activeFilterTab === "county" ? null : "county")}
                      className={`flex items-center gap-1 rounded-full border px-3 py-1.5 text-xs font-semibold ${
                        selectedCounty !== "All" ? "border-[#1A6B3C] bg-[#1A6B3C]/5 text-[#1A6B3C]" : "border-[#E8ECE9] text-[#6B7280]"
                      }`}
                    >
                      <span>Location: {selectedCounty === "All" ? "All Counties" : selectedCounty}</span>
                      <ChevronDown className="h-3 w-3" />
                    </button>
                    {activeFilterTab === "county" && (
                      <div className="absolute left-0 mt-2 z-50 w-48 rounded-2xl border border-[#F0F0F0] bg-white p-2 shadow-xl">
                        <div className="max-h-48 overflow-y-auto">
                          {shopCounties.map((c) => (
                            <button
                              key={c}
                              onClick={() => {
                                setSelectedCounty(c);
                                setActiveFilterTab(null);
                                setCurrentPage(1);
                              }}
                              className={`flex w-full items-center justify-between rounded-lg px-3 py-1.5 text-left text-xs font-medium ${
                                selectedCounty === c ? "bg-[#1A6B3C]/5 text-[#1A6B3C]" : "text-[#6B7280] hover:bg-[#FAFAF8]"
                              }`}
                            >
                              <span>{c === "All" ? "All Counties" : c}</span>
                              {selectedCounty === c && <Check className="h-3.5 w-3.5" />}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Rating Pill */}
                  <div className="relative">
                    <button
                      onClick={() => setActiveFilterTab(activeFilterTab === "rating" ? null : "rating")}
                      className={`flex items-center gap-1 rounded-full border px-3 py-1.5 text-xs font-semibold ${
                        minRating > 0 ? "border-[#1A6B3C] bg-[#1A6B3C]/5 text-[#1A6B3C]" : "border-[#E8ECE9] text-[#6B7280]"
                      }`}
                    >
                      <span>Rating: {minRating === 0 ? "All" : `${minRating} ★+`}</span>
                      <ChevronDown className="h-3 w-3" />
                    </button>
                    {activeFilterTab === "rating" && (
                      <div className="absolute left-0 mt-2 z-50 w-40 rounded-2xl border border-[#F0F0F0] bg-white p-2 shadow-xl">
                        {[0, 4.5, 4.8].map((stars) => (
                          <button
                            key={stars}
                            onClick={() => {
                              setMinRating(stars);
                              setActiveFilterTab(null);
                              setCurrentPage(1);
                            }}
                            className={`flex w-full items-center justify-between rounded-lg px-3 py-1.5 text-left text-xs font-medium ${
                              minRating === stars ? "bg-[#1A6B3C]/5 text-[#1A6B3C]" : "text-[#6B7280] hover:bg-[#FAFAF8]"
                            }`}
                          >
                            <span>{stars === 0 ? "All Ratings" : `${stars} ★ & Above`}</span>
                            {minRating === stars && <Check className="h-3.5 w-3.5" />}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Organic Switch Pill */}
                  <button
                    onClick={() => {
                      setOrganicOnly(!organicOnly);
                      setCurrentPage(1);
                    }}
                    className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${
                      organicOnly ? "border-[#1A6B3C] bg-[#1A6B3C]/5 text-[#1A6B3C]" : "border-[#E8ECE9] text-[#6B7280]"
                    }`}
                  >
                    🌿 Organic
                  </button>

                  {/* Verified Seller Switch Pill */}
                  <button
                    onClick={() => {
                      setVerifiedOnly(!verifiedOnly);
                      setCurrentPage(1);
                    }}
                    className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${
                      verifiedOnly ? "border-[#1A6B3C] bg-[#1A6B3C]/5 text-[#1A6B3C]" : "border-[#E8ECE9] text-[#6B7280]"
                    }`}
                  >
                    ✅ Verified Sellers
                  </button>
                </div>

                <div className="flex items-center gap-3">
                  <select
                    value={sortBy}
                    onChange={(e) => {
                      setSortBy(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="rounded-lg border border-[#F0F0F0] bg-white px-3 py-2 text-xs font-semibold text-[#1A1A1A] outline-none transition hover:border-[#1A6B3C]/20"
                  >
                    <option value="relevance">Relevance</option>
                    <option value="price-low">Price: Low to High</option>
                    <option value="price-high">Price: High to Low</option>
                    <option value="rating">Top Rated</option>
                    <option value="newest">Newest Releases</option>
                  </select>

                  {/* Grid/List Toggle */}
                  <div className="flex items-center border border-[#F0F0F0] rounded-lg bg-white p-0.5">
                    <button
                      onClick={() => setLayout("grid")}
                      className={`p-1.5 rounded-md transition ${layout === "grid" ? "bg-[#1A6B3C] text-white" : "text-[#6B7280] hover:text-[#1A1A1A]"}`}
                      aria-label="Grid view"
                    >
                      <Grid className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => setLayout("list")}
                      className={`p-1.5 rounded-md transition ${layout === "list" ? "bg-[#1A6B3C] text-white" : "text-[#6B7280] hover:text-[#1A1A1A]"}`}
                      aria-label="List view"
                    >
                      <List className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  {activeFiltersCount > 0 && (
                    <button
                      onClick={resetFilters}
                      className="flex h-8 w-8 items-center justify-center rounded-full bg-[#1A6B3C]/5 text-[#1A6B3C] hover:bg-[#1A6B3C]/10 transition-colors"
                      aria-label="Clear all filters"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            </section>

            {/* ACTIVE REMOVABLE FILTER CHIPS */}
            {activeFiltersCount > 0 && (
              <section className="container-px mx-auto max-w-7xl pt-4">
                <div className="flex flex-wrap items-center gap-1.5 text-left">
                  <span className="text-[10px] font-bold text-[#6B7280] uppercase tracking-wider mr-1">Active filters:</span>
                  
                  {priceRange < 10000 && (
                    <span className="flex items-center gap-1 rounded-full bg-[#E8F5E9] px-2.5 py-1 text-xs font-bold text-[#1A6B3C]">
                      <span>Price &lt; KES {priceRange}</span>
                      <X className="h-3 w-3 cursor-pointer" onClick={() => setPriceRange(10000)} />
                    </span>
                  )}

                  {selectedCounty !== "All" && (
                    <span className="flex items-center gap-1 rounded-full bg-[#E8F5E9] px-2.5 py-1 text-xs font-bold text-[#1A6B3C]">
                      <span>County: {selectedCounty}</span>
                      <X className="h-3 w-3 cursor-pointer" onClick={() => setSelectedCounty("All")} />
                    </span>
                  )}

                  {minRating > 0 && (
                    <span className="flex items-center gap-1 rounded-full bg-[#E8F5E9] px-2.5 py-1 text-xs font-bold text-[#1A6B3C]">
                      <span>Rating: {minRating}★+</span>
                      <X className="h-3 w-3 cursor-pointer" onClick={() => setMinRating(0)} />
                    </span>
                  )}

                  {organicOnly && (
                    <span className="flex items-center gap-1 rounded-full bg-[#E8F5E9] px-2.5 py-1 text-xs font-bold text-[#1A6B3C]">
                      <span>Organic</span>
                      <X className="h-3 w-3 cursor-pointer" onClick={() => setOrganicOnly(false)} />
                    </span>
                  )}

                  {verifiedOnly && (
                    <span className="flex items-center gap-1 rounded-full bg-[#E8F5E9] px-2.5 py-1 text-xs font-bold text-[#1A6B3C]">
                      <span>Verified Seller</span>
                      <X className="h-3 w-3 cursor-pointer" onClick={() => setVerifiedOnly(false)} />
                    </span>
                  )}

                  <button onClick={resetFilters} className="text-xs font-bold text-[#6B7280] hover:text-[#1A6B3C] ml-1">
                    Clear All
                  </button>
                </div>
              </section>
            )}

            {/* 6. MAIN PRODUCT GRID */}
            <section id="product-grid-section" className="container-px mx-auto max-w-7xl py-8">
              {isLoading ? (
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                  {Array.from({ length: 8 }).map((_, idx) => (
                    <ProductCardSkeleton key={idx} layout={layout} />
                  ))}
                </div>
              ) : filteredProducts.length === 0 ? (
                <div className="rounded-3xl border border-dashed border-[#F0F0F0] bg-white py-20 text-center">
                  <span className="text-4xl">🔎</span>
                  <h3 className="mt-4 text-base font-extrabold text-[#1A1A1A]">No products match your criteria</h3>
                  <p className="mt-2 text-xs text-[#6B7280]">Try adjusting search keywords, location filters, or reset filters.</p>
                  <button
                    onClick={resetFilters}
                    className="mt-6 rounded-lg bg-[#1A6B3C] px-5 py-2 text-xs font-bold text-white hover:bg-[#155430]"
                  >
                    Reset Filters
                  </button>
                </div>
              ) : (
                <div>
                  <div className={layout === "grid" ? "grid grid-cols-2 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4" : "flex flex-col gap-4"}>
                    {displayedProducts.map((product) => (
                      <ProductCard
                        key={product.id}
                        product={product}
                        layout={layout}
                        isWishlisted={wishlist.has(product.id)}
                        onAddToCart={handleAddToCart}
                        onToggleWishlist={handleToggleWishlist}
                        onSelectProduct={handleSelectProduct}
                        onQuickView={setQuickViewProduct}
                        onBuyNow={handleBuyNow}
                      />
                    ))}
                  </div>

                  {/* Infinite scroll load trigger */}
                  {visibleCount < filteredProducts.length && (
                    <div ref={observerRef} className="mt-12 flex items-center justify-center py-6">
                      <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#1A6B3C] border-t-transparent" />
                    </div>
                  )}
                </div>
              )}
            </section>

            {/* 7. FEATURED CATEGORIES BANNER */}
            <section className="py-12 bg-white border-y border-[#F0F0F0]">
              <div className="container-px mx-auto max-w-7xl">
                <div className="text-center">
                  <span className="text-xs font-bold uppercase tracking-widest text-[#1A6B3C]">Visual Showcases</span>
                  <h2 className="mt-2 text-2xl font-black text-[#1A1A1A] md:text-3xl tracking-tight">Browse Premium Showrooms</h2>
                </div>

                <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-3">
                  <div
                    onClick={() => handleCategoryChange("Vegetables")}
                    className="group relative h-48 cursor-pointer overflow-hidden rounded-2xl border border-transparent transition-all duration-300 hover:border-[#F5A623]"
                  >
                    <img
                      src="https://images.unsplash.com/photo-1540420773420-3366772f4999?q=80&w=600&auto=format&fit=crop"
                      className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      alt="Fresh Vegetables"
                    />
                    <div className="absolute inset-0 bg-black/40" />
                    <div className="absolute bottom-5 left-5 text-left">
                      <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#F5A623]">Organic Farm Direct</span>
                      <h3 className="text-base font-black text-white mt-1">Fresh Vegetables</h3>
                    </div>
                  </div>

                  <div
                    onClick={() => handleCategoryChange("Fruits")}
                    className="group relative h-48 cursor-pointer overflow-hidden rounded-2xl border border-transparent transition-all duration-300 hover:border-[#F5A623]"
                  >
                    <img
                      src="https://images.unsplash.com/photo-1619546813926-a78fa6372cd2?q=80&w=600&auto=format&fit=crop"
                      className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      alt="Organic Fruits"
                    />
                    <div className="absolute inset-0 bg-black/40" />
                    <div className="absolute bottom-5 left-5 text-left">
                      <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#F5A623]">Hass & Local Varieties</span>
                      <h3 className="text-base font-black text-white mt-1">Organic Fruits</h3>
                    </div>
                  </div>

                  <div
                    onClick={() => handleCategoryChange("Farm Tools")}
                    className="group relative h-48 cursor-pointer overflow-hidden rounded-2xl border border-transparent transition-all duration-300 hover:border-[#F5A623]"
                  >
                    <img
                      src="https://images.unsplash.com/photo-1416879595882-3373a0480b5b?q=80&w=600&auto=format&fit=crop"
                      className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      alt="Farm Equipment"
                    />
                    <div className="absolute inset-0 bg-black/40" />
                    <div className="absolute bottom-5 left-5 text-left">
                      <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#F5A623]">Heavy-Duty & Hand Tools</span>
                      <h3 className="text-base font-black text-white mt-1">Farm Equipment</h3>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 8. RECENTLY VIEWED (Personalized Strip) */}
      {recentlyViewed.length > 0 && (
        <section className="py-10 bg-[#FAFAF8] border-b border-[#F0F0F0]">
          <div className="container-px mx-auto max-w-7xl text-left">
            <h2 className="text-sm font-extrabold uppercase tracking-wider text-[#1A1A1A] mb-5">Recently Viewed</h2>
            
            <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-none">
              {recentlyViewed.map((product) => (
                <div
                  key={product.id}
                  onClick={() => handleSelectProduct(product)}
                  className="w-[180px] shrink-0 rounded-[12px] bg-white p-2.5 border border-[#E8ECE9] hover:border-[#2D6A4F] cursor-pointer shadow-sm hover:shadow-md transition-all text-left"
                >
                  <div className="aspect-square w-full overflow-hidden bg-[#FAFAF8] rounded-[8px]">
                    <img src={product.image} className="h-full w-full object-cover" alt={product.name} />
                  </div>
                  <h3 className="line-clamp-1 text-xs font-bold text-[#1A1A1A] mt-2">{product.name}</h3>
                  <div className="font-sans text-xs font-extrabold text-[#2D6A4F] mt-1">KES {product.price.toLocaleString()}</div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 10. QUICK VIEW MODAL */}
      <AnimatePresence>
        {quickViewProduct && (
          <QuickViewModal
            product={quickViewProduct}
            onClose={() => setQuickViewProduct(null)}
            onAddToCart={handleAddToCart}
          />
        )}
      </AnimatePresence>
      </div>
    </AppLayout>
  );
}
