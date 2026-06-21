import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  ShoppingCart,
  Heart,
  ChevronLeft,
  ChevronRight,
  SlidersHorizontal,
  Star,
  X,
  Check,
  ArrowRight,
  Sliders
} from "lucide-react";
import { toast } from "sonner";
import { shopProducts, shopCategories, type ShopProduct } from "@/lib/shop-data";
import { AppLayout } from "@/components/mqulima/AppLayout";
import { useCart } from "@/lib/cart-context";

type ShopSearch = {
  q?: string;
  category?: string;
};

export const Route = createFileRoute("/shop")({
  validateSearch: (search: Record<string, unknown>): ShopSearch => {
    return {
      q: (search.q as string) || undefined,
      category: (search.category as string) || undefined,
    };
  },
  head: () => ({
    meta: [
      { title: "Mqulima Shop — Jumia-Style Agriculture Category Marketplace" },
      {
        name: "description",
        content: "Browse premium African agricultural products with advanced Jumia-style filters, direct from vetted farms.",
      },
    ],
  }),
  component: ShopPage,
});

const relatedTags = [
  "sukuma wiki",
  "organic tomatoes",
  "maize seeds",
  "farm tools",
  "avocado",
  "poultry feeds",
  "fertilizers",
  "drip irrigation"
];

function ShopPage() {
  const navigate = useNavigate();
  const searchParams = Route.useSearch();
  const { addToCart } = useCart();

  // Wishlist state loaded from localStorage
  const [wishlist, setWishlist] = useState<Set<string>>(new Set(["1", "4"]));
  useEffect(() => {
    try {
      const stored = localStorage.getItem("mqulima_wishlist");
      if (stored) {
        setWishlist(new Set(JSON.parse(stored)));
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  // Filter States
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchSellerQuery, setSearchSellerQuery] = useState("");
  const [selectedSellers, setSelectedSellers] = useState<string[]>([]);
  
  // Price Range
  const [minPrice, setMinPrice] = useState(0);
  const [maxPrice, setMaxPrice] = useState(10000);
  const [appliedMinPrice, setAppliedMinPrice] = useState(0);
  const [appliedMaxPrice, setAppliedMaxPrice] = useState(10000);

  // Seller Score Rating
  const [minSellerScore, setMinSellerScore] = useState<number | null>(null);

  // Condition checkboxes
  const [selectedConditions, setSelectedConditions] = useState<string[]>([]);

  // Sorting
  const [sortBy, setSortBy] = useState("Popularity");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

  // Sync Search Query from URL Search Params
  const [searchText, setSearchText] = useState("");
  useEffect(() => {
    if (searchParams.q) {
      setSearchText(searchParams.q);
      setCurrentPage(1);
    } else {
      setSearchText("");
    }
  }, [searchParams.q]);

  // Sync Category from URL Search Params
  useEffect(() => {
    if (searchParams.category) {
      setSelectedCategory(searchParams.category);
      setCurrentPage(1);
    } else {
      setSelectedCategory("All");
    }
  }, [searchParams.category]);

  // Mobile Filters Drawer State
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  // Expanded sellers toggle
  const [showAllSellers, setShowAllSellers] = useState(false);

  // Hardcoded key sellers list
  const primarySellers = [
    "Kamau Farms",
    "Wambui Organics",
    "Nyandarua Fresh",
    "AgroTools KE",
    "Rift Valley Greens",
    "Organic Africa",
    "Unga ya Baba",
    "Cooper Agri"
  ];
  
  const additionalSellers = [
    "Mutura Farms",
    "Unga Feeds",
    "Dekalb Kenya",
    "Simlaw Seeds"
  ];

  const allSellersList = [...primarySellers, ...additionalSellers];

  const filteredSellersList = useMemo(() => {
    const q = searchSellerQuery.toLowerCase().trim();
    if (!q) {
      return showAllSellers ? allSellersList : primarySellers;
    }
    return allSellersList.filter((s) => s.toLowerCase().includes(q));
  }, [searchSellerQuery, showAllSellers]);

  // Combined Filtering and Sorting logic
  const filteredProducts = useMemo(() => {
    return shopProducts
      .filter((p) => {
        // Category Filter
        if (selectedCategory !== "All") {
          if (selectedCategory === "Organic") {
            if (!p.organic) return false;
          } else if (p.category !== selectedCategory) {
            return false;
          }
        }

        // Search text / Related tags query
        const query = searchText.toLowerCase().trim();
        if (query) {
          const content = `${p.name} ${p.brand} ${p.category} ${p.description}`.toLowerCase();
          if (!content.includes(query)) return false;
        }

        // Seller/Farm checkboxes (AND logic: show checked sellers only)
        if (selectedSellers.length > 0) {
          if (!selectedSellers.includes(p.brand)) return false;
        }

        // Price range
        if (p.price < appliedMinPrice || p.price > appliedMaxPrice) return false;

        // Seller Score
        if (minSellerScore !== null) {
          if (p.sellerScore < minSellerScore) return false;
        }

        // Condition Checkboxes
        if (selectedConditions.length > 0) {
          if (!selectedConditions.includes(p.condition)) return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === "Price: Low–High") return a.price - b.price;
        if (sortBy === "Price: High–Low") return b.price - a.price;
        if (sortBy === "Newest") return Number(b.badge === "New" || b.badge === "Flash Deal") - Number(a.badge === "New" || a.badge === "Flash Deal");
        if (sortBy === "Top Rated") return b.rating - a.rating;
        if (sortBy === "Most Reviewed") return b.reviewsCount - a.reviewsCount;
        return 0; // Default: Popularity / relevance
      });
  }, [selectedCategory, searchText, selectedSellers, appliedMinPrice, appliedMaxPrice, minSellerScore, selectedConditions, sortBy]);

  // Paginated visible products
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedProducts = useMemo(() => {
    return filteredProducts.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredProducts, startIndex]);

  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage) || 1;

  // Active filters array for active chips display
  const activeFilters = useMemo(() => {
    const list: { type: string; label: string; value: any }[] = [];
    if (selectedCategory !== "All") {
      list.push({ type: "category", label: `Category: ${selectedCategory}`, value: selectedCategory });
    }
    if (searchText) {
      list.push({ type: "search", label: `Search: "${searchText}"`, value: searchText });
    }
    selectedSellers.forEach((s) => {
      list.push({ type: "seller", label: `Seller: ${s}`, value: s });
    });
    if (appliedMinPrice > 0 || appliedMaxPrice < 10000) {
      list.push({
        type: "price",
        label: `KSh ${appliedMinPrice.toLocaleString()} - KSh ${appliedMaxPrice.toLocaleString()}`,
        value: { min: appliedMinPrice, max: appliedMaxPrice }
      });
    }
    if (minSellerScore !== null) {
      list.push({ type: "score", label: `Score: ${minSellerScore}%+`, value: minSellerScore });
    }
    selectedConditions.forEach((c) => {
      list.push({ type: "condition", label: c, value: c });
    });
    return list;
  }, [selectedCategory, searchText, selectedSellers, appliedMinPrice, appliedMaxPrice, minSellerScore, selectedConditions]);

  // Reset Filters
  const handleClearAll = () => {
    setSelectedCategory("All");
    setSearchText("");
    setSelectedSellers([]);
    setMinPrice(0);
    setMaxPrice(10000);
    setAppliedMinPrice(0);
    setAppliedMaxPrice(10000);
    setMinSellerScore(null);
    setSelectedConditions([]);
    setSortBy("Popularity");
    setCurrentPage(1);
    navigate({ to: "/shop", search: {} as any });
    toast.success("All filters cleared");
  };

  // Remove individual filter chip
  const handleRemoveFilter = (filter: { type: string; value: any }) => {
    setCurrentPage(1);
    if (filter.type === "category") {
      setSelectedCategory("All");
      navigate({ to: "/shop", search: { q: searchText || undefined } as any });
    } else if (filter.type === "search") {
      setSearchText("");
      navigate({ to: "/shop", search: { category: selectedCategory !== "All" ? selectedCategory : undefined } as any });
    } else if (filter.type === "seller") {
      setSelectedSellers((prev) => prev.filter((s) => s !== filter.value));
    } else if (filter.type === "price") {
      setMinPrice(0);
      setMaxPrice(10000);
      setAppliedMinPrice(0);
      setAppliedMaxPrice(10000);
    } else if (filter.type === "score") {
      setMinSellerScore(null);
    } else if (filter.type === "condition") {
      setSelectedConditions((prev) => prev.filter((c) => c !== filter.value));
    }
  };

  // Toggle wishlist state
  const handleToggleWishlist = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setWishlist((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
        toast.info("Removed from wishlist");
      } else {
        next.add(id);
        toast.success("Added to wishlist");
      }
      try {
        localStorage.setItem("mqulima_wishlist", JSON.stringify(Array.from(next)));
      } catch (err) {
        console.error(err);
      }
      return next;
    });
  };

  // Handle slide-up Add to Cart click
  const handleAddToCartClick = (p: ShopProduct, e: React.MouseEvent) => {
    e.stopPropagation();
    addToCart(p, 1);
    toast.success(`${p.name} added to cart!`);
  };

  // Sidebar Filter Section Component (reusable for Desktop and Mobile Drawer)
  const FilterContent = () => (
    <div className="flex flex-col gap-6 text-left">
      {/* Category Section */}
      <div className="border-b border-gray-100 pb-4">
        <span className="text-xs font-bold text-gray-800 uppercase tracking-wider mb-3 block">Category</span>
        <div className="flex flex-col gap-2">
          {shopCategories.map((cat) => {
            const isActive = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => {
                  setSelectedCategory(cat.id);
                  setCurrentPage(1);
                }}
                className={`text-left text-xs transition-all flex items-center py-0.5 gap-2 ${
                  isActive
                    ? "border-l-4 border-[#F5A623] pl-2 font-bold text-[#F5A623]"
                    : "text-gray-600 hover:text-gray-900 hover:pl-1 pl-0"
                }`}
              >
                <span>{cat.icon}</span>
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Seller Section */}
      <div className="border-b border-gray-100 pb-4">
        <span className="text-xs font-bold text-gray-800 uppercase tracking-wider mb-3 block">Seller</span>
        <div className="relative mb-2">
          <input
            type="text"
            placeholder="Search seller..."
            value={searchSellerQuery}
            onChange={(e) => setSearchSellerQuery(e.target.value)}
            className="w-full h-8 pl-8 pr-2 border border-gray-200 rounded text-xs bg-[#F5F5F5] focus:bg-white outline-none"
          />
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
        </div>
        <div className="flex flex-col gap-2 max-h-48 overflow-y-auto pr-1">
          {filteredSellersList.map((seller) => {
            const isChecked = selectedSellers.includes(seller);
            return (
              <label key={seller} className="flex items-center gap-2 cursor-pointer text-xs text-gray-600 hover:text-gray-900">
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={() => {
                    setCurrentPage(1);
                    setSelectedSellers((prev) =>
                      isChecked ? prev.filter((s) => s !== seller) : [...prev, seller]
                    );
                  }}
                  className="rounded border-gray-300 text-[#2D6A4F] focus:ring-[#2D6A4F] h-3.5 w-3.5"
                />
                <span>{seller}</span>
              </label>
            );
          })}
        </div>
        {!searchSellerQuery && (
          <button
            onClick={() => setShowAllSellers(!showAllSellers)}
            className="text-[10px] font-bold text-[#F5A623] hover:underline mt-2.5 block text-left"
          >
            {showAllSellers ? "See less" : "See more"}
          </button>
        )}
      </div>

      {/* Price (KSH) Section */}
      <div className="border-b border-gray-100 pb-4">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-bold text-gray-800 uppercase tracking-wider">Price (KSh)</span>
          <button
            onClick={() => {
              setAppliedMinPrice(minPrice);
              setAppliedMaxPrice(maxPrice);
              setCurrentPage(1);
              toast.success("Price filter applied");
            }}
            className="text-xs font-bold text-[#F5A623] hover:underline"
          >
            Apply
          </button>
        </div>

        {/* Dual Slider */}
        <div className="relative w-full h-6">
          <div className="absolute top-2.5 left-0 right-0 h-1 bg-gray-200 rounded-full" />
          <div
            className="absolute top-2.5 h-1 bg-[#2D6A4F] rounded-full"
            style={{
              left: `${(minPrice / 10000) * 100}%`,
              right: `${100 - (maxPrice / 10000) * 100}%`
            }}
          />
          <input
            type="range"
            min="0"
            max="10000"
            step="100"
            value={minPrice}
            onChange={(e) => setMinPrice(Math.min(Number(e.target.value), maxPrice - 200))}
            className="absolute pointer-events-none appearance-none w-full h-1 top-2.5 bg-transparent accent-[#2D6A4F] [&::-webkit-slider-thumb]:pointer-events-auto [&::-moz-range-thumb]:pointer-events-auto"
          />
          <input
            type="range"
            min="0"
            max="10000"
            step="100"
            value={maxPrice}
            onChange={(e) => setMaxPrice(Math.max(Number(e.target.value), minPrice + 200))}
            className="absolute pointer-events-none appearance-none w-full h-1 top-2.5 bg-transparent accent-[#2D6A4F] [&::-webkit-slider-thumb]:pointer-events-auto [&::-moz-range-thumb]:pointer-events-auto"
          />
        </div>

        {/* Price Inputs */}
        <div className="flex items-center justify-between gap-2 mt-2">
          <div className="flex-1 flex items-center border border-gray-300 rounded px-1.5 py-1 bg-white">
            <span className="text-[10px] text-gray-400 mr-1">Min</span>
            <input
              type="number"
              value={minPrice}
              onChange={(e) => setMinPrice(Math.min(Number(e.target.value), maxPrice - 100))}
              className="w-full text-xs font-semibold bg-transparent outline-none"
            />
          </div>
          <div className="flex-1 flex items-center border border-gray-300 rounded px-1.5 py-1 bg-white">
            <span className="text-[10px] text-gray-400 mr-1">Max</span>
            <input
              type="number"
              value={maxPrice}
              onChange={(e) => setMaxPrice(Math.max(Number(e.target.value), minPrice + 100))}
              className="w-full text-xs font-semibold bg-transparent outline-none"
            />
          </div>
        </div>
      </div>

      {/* Seller Score Section */}
      <div className="border-b border-gray-100 pb-4">
        <span className="text-xs font-bold text-gray-800 uppercase tracking-wider mb-3 block">Seller Score</span>
        <div className="flex flex-col gap-2">
          {[80, 60, 40, 20].map((score) => (
            <label key={score} className="flex items-center gap-2 cursor-pointer text-xs text-gray-600 hover:text-gray-900">
              <input
                type="radio"
                name="sellerScore"
                checked={minSellerScore === score}
                onChange={() => {
                  setMinSellerScore(score);
                  setCurrentPage(1);
                }}
                className="text-[#2D6A4F] focus:ring-[#2D6A4F] h-3.5 w-3.5 border-gray-300"
              />
              <span>{score}% or more</span>
            </label>
          ))}
          <button
            onClick={() => {
              setMinSellerScore(null);
              setCurrentPage(1);
            }}
            className="text-[10px] font-bold text-[#F5A623] hover:underline mt-1 text-left"
          >
            Clear score filter
          </button>
        </div>
      </div>

      {/* Condition Section */}
      <div className="border-b border-gray-100 pb-4">
        <span className="text-xs font-bold text-gray-800 uppercase tracking-wider mb-3 block">Condition</span>
        <div className="flex flex-col gap-2">
          {["Fresh", "Certified Organic", "Bulk Available", "Pre-Order"].map((cond) => {
            const isChecked = selectedConditions.includes(cond);
            const labelDesc = cond === "Fresh" ? "Fresh (harvested this week)" : cond;
            return (
              <label key={cond} className="flex items-center gap-2 cursor-pointer text-xs text-gray-600 hover:text-gray-900">
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={() => {
                    setCurrentPage(1);
                    setSelectedConditions((prev) =>
                      isChecked ? prev.filter((c) => c !== cond) : [...prev, cond]
                    );
                  }}
                  className="rounded border-gray-300 text-[#2D6A4F] focus:ring-[#2D6A4F] h-3.5 w-3.5"
                />
                <span>{labelDesc}</span>
              </label>
            );
          })}
        </div>
      </div>
    </div>
  );

  return (
    <AppLayout>
      <div className="min-h-screen bg-[#F5F5F5] py-2 md:py-4 text-[#1A1A1A]">
        <div className="px-2 md:px-4 mx-auto max-w-7xl">
          
          {/* Breadcrumb row */}
          <div className="flex items-center text-xs text-gray-500 mb-2 md:mb-4 justify-start font-medium">
            <Link to="/" className="hover:underline">Home</Link>
            <span className="mx-2">&gt;</span>
            <span className="text-gray-700">Shop</span>
          </div>

          <div className="flex gap-4 items-start relative">
            
            {/* LEFT SIDEBAR (Desktop only) */}
            <aside className="hidden lg:block w-[260px] shrink-0 bg-white border border-gray-200 rounded p-4 self-start">
              <FilterContent />
            </aside>

            {/* RIGHT CONTENT AREA */}
            <main className="flex-1 bg-white border border-gray-200 rounded p-2 sm:p-4">
              
              {/* Results Header Bar */}
              <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-gray-100 pb-3 gap-3">
                <div className="text-left w-full">
                  <h1 className="text-base md:text-lg font-bold text-gray-800">
                    Shop <span className="text-xs md:text-sm font-semibold text-gray-500 ml-1">({filteredProducts.length} products found)</span>
                  </h1>
                  
                  {/* Related tags subrow */}
                  <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                    <span className="text-[10px] md:text-[11px] font-bold text-gray-500">Related:</span>
                    <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full md:max-w-lg scrollbar-none flex-1">
                      {relatedTags.map((tag) => {
                        const isActive = searchText === tag;
                        return (
                          <button
                            key={tag}
                            onClick={() => {
                              setSearchText(isActive ? "" : tag);
                              setCurrentPage(1);
                            }}
                            className={`px-2.5 py-0.5 rounded-full text-[9px] md:text-[10px] font-bold border transition-all whitespace-nowrap ${
                              isActive
                                ? "bg-[#F5A623] border-[#F5A623] text-white"
                                : "border-[#F5A623] text-[#F5A623] bg-white hover:bg-orange-50"
                            }`}
                          >
                            {tag}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Sort By Dropdown (Desktop/Tablet only) */}
                <div className="hidden sm:flex items-center gap-2 justify-end shrink-0">
                  <span className="text-xs text-gray-500 font-semibold">Sort by:</span>
                  <select
                    value={sortBy}
                    onChange={(e) => {
                      setSortBy(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="border border-gray-250 rounded px-2.5 py-1.5 text-xs font-semibold text-gray-700 bg-white outline-none focus:border-[#2D6A4F]"
                  >
                    <option value="Popularity">Popularity</option>
                    <option value="Price: Low–High">Price: Low–High</option>
                    <option value="Price: High–Low">Price: High–Low</option>
                    <option value="Newest">Newest</option>
                    <option value="Top Rated">Top Rated</option>
                    <option value="Most Reviewed">Most Reviewed</option>
                  </select>

                  {/* Tablet Filter Toggle */}
                  <button
                    onClick={() => setMobileFiltersOpen(true)}
                    className="lg:hidden flex items-center gap-1.5 border border-gray-250 rounded px-3 py-1.5 text-xs font-bold text-gray-700 bg-white hover:bg-gray-50 shrink-0"
                  >
                    <Sliders className="h-3.5 w-3.5" />
                    <span>Filter</span>
                  </button>
                </div>
              </div>

              {/* ACTIVE FILTERS BAR (show only when filters active) */}
              {activeFilters.length > 0 && (
                <div className="flex flex-wrap items-center justify-between gap-2 bg-[#FAFAF8] border border-gray-150 p-2.5 rounded mt-3 text-left">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mr-1">Active filters:</span>
                    {activeFilters.map((filter, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center gap-1 rounded bg-[#E8F5E9] border border-[#2D6A4F]/20 px-2 py-0.5 text-xs font-semibold text-[#2D6A4F]"
                      >
                        <span>{filter.label}</span>
                        <button
                          onClick={() => handleRemoveFilter(filter)}
                          className="text-gray-400 hover:text-red-500 font-bold"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                  <button
                    onClick={handleClearAll}
                    className="text-xs font-bold text-red-600 hover:underline mr-1"
                  >
                    Clear All
                  </button>
                </div>
              )}

              {/* PRODUCT GRID */}
              <div className="mt-4">
                {paginatedProducts.length === 0 ? (
                  <div className="border border-dashed border-gray-200 rounded p-16 text-center my-6 bg-[#FAFAF8]">
                    <span className="text-3xl block mb-2">🔍</span>
                    <span className="text-sm font-bold text-gray-800">No products found matching these filters</span>
                    <p className="text-xs text-gray-500 mt-1">Try broadening your search criteria or resetting filters.</p>
                    <button
                      onClick={handleClearAll}
                      className="mt-4 rounded bg-[#2D6A4F] px-4 py-2 text-xs font-bold text-white hover:bg-[#1A5438]"
                    >
                      Clear Filters
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 md:gap-3">
                    {paginatedProducts.map((p) => {
                      const isWishlisted = wishlist.has(p.id);
                      const hasDiscount = !!(p.originalPrice && p.originalPrice > p.price);
                      const discountPercentage = hasDiscount
                        ? Math.round(((p.originalPrice! - p.price) / p.originalPrice!) * 100)
                        : 0;

                      // Badge background colors matching specifications
                      let badgeBg = "bg-[#2D6A4F]"; // default Organic Green
                      if (p.badge === "Flash Deal" || p.badge === "Anniversary Deal") badgeBg = "bg-[#00BCD4]";
                      if (p.badge === "Best Seller") badgeBg = "bg-[#F5A623]";
                      if (p.badge === "Bulk Deal") badgeBg = "bg-[#7B2D8B]";

                      return (
                        <div
                          key={p.id}
                          onClick={() => navigate({ to: "/shop/$productId", params: { productId: String(p.id) } })}
                          className="group border border-[#E0E0E0] rounded-[4px] bg-white p-2 md:p-3 hover:shadow-[0_2px_8px_rgba(0,0,0,0.12)] transition-all flex flex-col justify-between h-full relative cursor-pointer overflow-hidden"
                        >
                          {/* Image Box */}
                          <div className="relative aspect-square w-full bg-white flex items-center justify-center p-1.5 md:p-2 mb-1.5 md:mb-2 overflow-hidden min-w-0">
                            <img
                              src={p.image}
                              alt={p.name}
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 120 120"><rect width="100%" height="100%" fill="%23F4F6F4"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-family="system-ui" font-weight="bold" font-size="12" fill="%232D6A4F">MQULIMA</text></svg>`;
                              }}
                              className="h-full w-full object-contain max-h-[110px] md:max-h-[160px] min-w-0 max-w-full"
                              loading="lazy"
                            />
                            
                            {/* Top Left Badge */}
                            {p.badge && (
                              <span className={`absolute left-0 top-0 rounded-r px-2 py-0.5 text-[9px] font-bold text-white uppercase tracking-wider ${badgeBg}`}>
                                {p.badge}
                              </span>
                            )}

                            {/* Wishlist Heart Icon */}
                            <button
                              onClick={(e) => handleToggleWishlist(p.id, e)}
                              className="absolute right-1 bottom-1 bg-white/90 p-1.5 rounded-full hover:bg-white shadow-sm transition text-gray-400 hover:text-red-500"
                              aria-label="Wishlist"
                            >
                              <Heart className={`h-4.5 w-4.5 ${isWishlisted ? "fill-red-500 text-red-500" : ""}`} />
                            </button>
                          </div>

                          {/* Info Column */}
                          <div className="flex-1 flex flex-col justify-between text-left">
                            <div>
                              {/* Product Name */}
                              <h3 className="text-[12px] md:text-[13px] text-gray-800 line-clamp-2 leading-tight h-8 mb-1.5 font-medium hover:text-[#2D6A4F] transition-colors">
                                {p.name}
                              </h3>
                              
                              {/* Seller Muted Row */}
                              <span className="text-[9px] text-gray-400 block -mt-1 mb-1 font-semibold uppercase">
                                Seller: {p.brand}
                              </span>

                              {/* Price Row */}
                              <div className="mt-1 flex flex-col">
                                <span className="font-bold text-[#000000] text-sm">
                                  KSh {p.price.toLocaleString()}
                                </span>
                                {hasDiscount && (
                                  <div className="flex items-center gap-1.5 mt-0.5">
                                    <span className="font-sans text-[10px] text-[#888888] line-through">
                                      KSh {p.originalPrice!.toLocaleString()}
                                    </span>
                                    <span className="text-[#E02020] font-bold text-[10px]">
                                      -{discountPercentage}%
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Star rating + review count */}
                            <div className="mt-2 flex items-center gap-1 text-[11px] text-[#F5A623]">
                              <div className="flex items-center">
                                {Array.from({ length: 5 }).map((_, sIdx) => (
                                  <Star
                                    key={sIdx}
                                    className={`h-3 w-3 ${
                                      sIdx < Math.floor(p.rating) ? "fill-[#F5A623] text-[#F5A623]" : "text-gray-200"
                                    }`}
                                  />
                                ))}
                              </div>
                              <span className="text-[#888888] text-[10px] ml-0.5">
                                ({p.reviewsCount})
                              </span>
                            </div>
                          </div>

                          {/* Mobile-visible Add to Cart Button */}
                          <div className="mt-2.5 block md:hidden">
                            <button
                              onClick={(e) => handleAddToCartClick(p, e)}
                              className="w-full bg-[#2D6A4F] hover:bg-[#1A5438] py-2 text-center text-[10px] font-bold text-white uppercase rounded-[4px] transition-colors"
                            >
                              Add to Cart
                            </button>
                          </div>

                          {/* Hover Slide-up Button (Desktop only) */}
                          <div
                            onClick={(e) => handleAddToCartClick(p, e)}
                            className="absolute bottom-0 left-0 right-0 bg-[#2D6A4F] hover:bg-[#1A5438] py-2.5 text-center text-xs font-bold text-white uppercase tracking-wider translate-y-full group-hover:translate-y-0 transition-transform duration-300 z-10 hidden md:block"
                          >
                            Add to Cart
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* PAGINATION */}
              {totalPages > 1 && (
                <div className="flex flex-col items-center gap-3 mt-8 border-t border-gray-100 pt-6">
                  <div className="text-xs text-gray-500 font-medium">
                    Showing {startIndex + 1}–{Math.min(startIndex + itemsPerPage, filteredProducts.length)} of {filteredProducts.length} products
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => {
                        setCurrentPage((p) => Math.max(1, p - 1));
                        window.scrollTo({ top: 0, behavior: "smooth" });
                      }}
                      disabled={currentPage === 1}
                      className="w-8 h-8 rounded border border-gray-200 flex items-center justify-center text-sm font-semibold disabled:opacity-40 hover:bg-gray-50 bg-white"
                    >
                      &lt;
                    </button>
                    {Array.from({ length: totalPages }).map((_, idx) => {
                      const page = idx + 1;
                      return (
                        <button
                          key={page}
                          onClick={() => {
                            setCurrentPage(page);
                            window.scrollTo({ top: 0, behavior: "smooth" });
                          }}
                          className={`w-8 h-8 rounded border text-sm font-bold flex items-center justify-center transition-colors ${
                            currentPage === page
                              ? "bg-[#F5A623] border-[#F5A623] text-white"
                              : "border-gray-200 hover:bg-gray-50 text-gray-700 bg-white"
                          }`}
                        >
                          {page}
                        </button>
                      );
                    })}
                    <button
                      onClick={() => {
                        setCurrentPage((p) => Math.min(totalPages, p + 1));
                        window.scrollTo({ top: 0, behavior: "smooth" });
                      }}
                      disabled={currentPage === totalPages}
                      className="w-8 h-8 rounded border border-gray-200 flex items-center justify-center text-sm font-semibold disabled:opacity-40 hover:bg-gray-50 bg-white"
                    >
                      &gt;
                    </button>
                  </div>
                </div>
              )}
            </main>
          </div>
        </div>
      </div>

      {/* Floating Filter drawer for mobile/tablet */}
      <AnimatePresence>
        {mobileFiltersOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileFiltersOpen(false)}
              className="absolute inset-0 bg-black/50"
            />
            {/* Panel */}
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 220 }}
              className="absolute inset-y-0 left-0 w-full max-w-xs bg-white p-6 shadow-2xl flex flex-col justify-between overflow-y-auto"
            >
              <div>
                <div className="flex items-center justify-between border-b border-gray-200 pb-3 mb-4">
                  <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider">Filters</h3>
                  <button onClick={() => setMobileFiltersOpen(false)} className="p-1 rounded-full text-gray-400 hover:text-gray-600">
                    <X className="h-5 w-5" />
                  </button>
                </div>
                <FilterContent />
              </div>
              <button
                onClick={() => setMobileFiltersOpen(false)}
                className="w-full bg-[#2D6A4F] hover:bg-[#1A5438] py-2.5 text-xs font-bold text-white uppercase rounded mt-6"
              >
                Close Filters
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Floating Mobile Filter/Sort Bar fixed at bottom (visible only on mobile screen) */}
      <div className="lg:hidden fixed bottom-4 left-1/2 -translate-x-1/2 bg-white/95 backdrop-blur shadow-lg border border-gray-200 py-2.5 px-6 rounded-full flex items-center justify-between gap-6 z-40 w-[90%] max-w-sm">
        <button
          onClick={() => setMobileFiltersOpen(true)}
          className="flex items-center gap-1.5 text-xs font-bold text-gray-700 hover:text-[#2D6A4F]"
        >
          <SlidersHorizontal className="h-4 w-4 text-[#F5A623]" />
          <span>Filter</span>
        </button>
        <div className="h-4 w-px bg-gray-200" />
        <div className="flex items-center gap-1 text-xs text-gray-700">
          <span className="font-semibold text-gray-400">Sort:</span>
          <select
            value={sortBy}
            onChange={(e) => {
              setSortBy(e.target.value);
              setCurrentPage(1);
            }}
            className="bg-transparent font-bold outline-none text-[#2D6A4F]"
          >
            <option value="Popularity">Popularity</option>
            <option value="Price: Low–High">Low–High</option>
            <option value="Price: High–Low">High–Low</option>
            <option value="Newest">Newest</option>
            <option value="Top Rated">Top Rated</option>
          </select>
        </div>
      </div>
    </AppLayout>
  );
}
