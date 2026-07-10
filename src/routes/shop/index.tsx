import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import React, { useState, useEffect, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Heart,
  ChevronLeft,
  ChevronRight,
  Star,
  X,
  Check,
  ChevronDown,
  SlidersHorizontal,
  LayoutGrid,
  List,
  ArrowRight,
  Plus,
  Minus,
  Maximize2,
  Trash2,
  ShieldCheck,
  MapPin,
  AlertCircle,
  Eye,
  Sparkles
} from "lucide-react";
import { toast } from "sonner";
import { type ShopProduct, AGRICULTURE_TAXONOMY, mapToNewTaxonomy } from "@/lib/shop-data";
import { AppLayout } from "@/components/mqulima/AppLayout";
import { useCart } from "@/lib/cart-context";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getProducts as getShopProducts } from "@/lib/api/shop.server";
import { useAuth } from "@/hooks/useAuth";

type ShopSearch = {
  q?: string;
  shopType?: string;
  field?: string;
  category?: string;
  subcategory?: string;
};

export const Route = createFileRoute("/shop/")({
  validateSearch: (search: Record<string, unknown>): ShopSearch => {
    return {
      q: (search.q as string) || undefined,
      shopType: (search.shopType as string) || undefined,
      field: (search.field as string) || undefined,
      category: (search.category as string) || undefined,
      subcategory: (search.subcategory as string) || undefined,
    };
  },
  head: () => ({
    meta: [
      { title: "Mqulima Agrovet Store — Premium Farmers Essentials" },
      {
        name: "description",
        content: "Shop certified seeds, premium fertilizers, crop health solutions, and farm machinery with agronomist support.",
      },
    ],
  }),
  component: ShopPage,
});



function ShopPage() {
  const navigate = useNavigate();
  const searchParams = Route.useSearch();
  const { addToCart } = useCart();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  


  // Search, taxonomy, layout mode states
  const [searchText, setSearchText] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedSubcategory, setSelectedSubcategory] = useState("All");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [currentPage, setCurrentPage] = useState(1);
  const [sortBy, setSortBy] = useState("Popularity");
  const itemsPerPage = 12;

  // Search Autocomplete state
  const [searchFocused, setSearchFocused] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Filter states
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [minPrice, setMinPrice] = useState<number>(0);
  const [maxPrice, setMaxPrice] = useState<number>(25000);
  const [appliedMinPrice, setAppliedMinPrice] = useState<number>(0);
  const [appliedMaxPrice, setAppliedMaxPrice] = useState<number>(25000);
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [inStockOnly, setInStockOnly] = useState(false);
  const [selectedRating, setSelectedRating] = useState<number | null>(null);

  // Comparison state
  const [compareList, setCompareList] = useState<ShopProduct[]>([]);
  const [compareModalOpen, setCompareModalOpen] = useState(false);

  // Wishlist state
  const [wishlist, setWishlist] = useState<Set<string>>(new Set());

  // Recently Viewed & Recommendations states
  const [recentlyViewed, setRecentlyViewed] = useState<ShopProduct[]>([]);

  const handleClearRecentlyViewed = () => {
    localStorage.removeItem("mqulima_recently_viewed");
    setRecentlyViewed([]);
  };

  const handleClearIndividualRecentlyViewed = (e: React.MouseEvent, productId: string) => {
    e.stopPropagation();
    const updated = recentlyViewed.filter((item) => item.id !== productId);
    setRecentlyViewed(updated);
    localStorage.setItem("mqulima_recently_viewed", JSON.stringify(updated));
  };

  // Mobile drawer state
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  // Stock Request form state
  const [recommendName, setRecommendName] = useState("");
  const [recommendBrand, setRecommendBrand] = useState("");

  // Fetch products
  const { data: allProductsData, isLoading: isProductsLoading } = useQuery({
    queryKey: ["allShopProducts"],
    queryFn: () => getShopProducts({ data: { limit: 1000 } })
  });

  const rawProductsList = useMemo(() => {
    return allProductsData?.products || [];
  }, [allProductsData]);



  // Map all products to the new 8-tier taxonomy
  const productsList = useMemo(() => {
    return rawProductsList.map((p) => {
      const taxonomy = mapToNewTaxonomy(p);
      return {
        ...p,
        category: taxonomy.category,
        subcategory: taxonomy.subcategory
      };
    });
  }, [rawProductsList]);

  // Load state on client mount
  useEffect(() => {
    try {
      const storedWish = localStorage.getItem("mqulima_wishlist");
      if (storedWish) setWishlist(new Set(JSON.parse(storedWish)));

      const storedRecent = localStorage.getItem("mqulima_recently_viewed");
      if (storedRecent) setRecentlyViewed(JSON.parse(storedRecent));
    } catch (e) {
      console.error(e);
    }
  }, []);

  // Sync Search Query & Taxonomy from URL
  useEffect(() => {
    setSearchText(searchParams.q || "");
    setSelectedCategory(searchParams.category || "All");
    setSelectedSubcategory(searchParams.subcategory || "All");
    setCurrentPage(1);
  }, [searchParams.q, searchParams.category, searchParams.subcategory]);

  // Close autocomplete on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setSearchFocused(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Get brands dynamically from mapped products
  const allBrands = useMemo(() => {
    const brandsSet = new Set<string>();
    productsList.forEach((p) => {
      if (p.brand) brandsSet.add(p.brand);
    });
    return Array.from(brandsSet).sort();
  }, [productsList]);

  // Autocomplete search suggestions
  const searchSuggestions = useMemo(() => {
    if (!searchText.trim()) return [];
    const query = searchText.toLowerCase().trim();
    return productsList.filter(
      (p) => p.name.toLowerCase().includes(query) || p.category.toLowerCase().includes(query)
    ).slice(0, 5);
  }, [searchText, productsList]);

  // Helper mapping: name to suitable crops
  function nameToCrops(name: string): string {
    const n = name.toLowerCase();
    if (n.includes("maize")) return "Maize, Sorghum, Cereals";
    if (n.includes("tomato") || n.includes("onion")) return "Vegetables, Horticulture";
    if (n.includes("dairy") || n.includes("feed")) return "Livestock, Cattle, Sheep";
    if (n.includes("pump") || n.includes("sprayer")) return "Multi-crop Irrigation";
    return "All Farms";
  }

  // Filter products list
  const filteredProducts = useMemo(() => {
    return productsList.filter((p) => {
      // Category filter
      if (selectedCategory !== "All") {
        if (p.category !== selectedCategory) return false;
      }
      // Subcategory filter
      if (selectedSubcategory !== "All") {
        if (p.subcategory !== selectedSubcategory) return false;
      }
      // Search text filter
      if (searchText.trim() !== "") {
        const query = searchText.toLowerCase().trim();
        const matches =
          p.name.toLowerCase().includes(query) ||
          p.brand.toLowerCase().includes(query) ||
          p.description.toLowerCase().includes(query);
        if (!matches) return false;
      }
      // Brand filter
      if (selectedBrands.length > 0) {
        if (!selectedBrands.includes(p.brand)) return false;
      }
      // Price filter
      if (p.price < appliedMinPrice || p.price > appliedMaxPrice) return false;
      // Verified Seller filter
      if (verifiedOnly && !p.verifiedSeller) return false;
      // In Stock filter
      if (inStockOnly && p.stock <= 0) return false;
      // Rating filter
      if (selectedRating !== null && p.rating < selectedRating) return false;

      return true;
    });
  }, [
    productsList,
    selectedCategory,
    selectedSubcategory,
    searchText,
    selectedBrands,
    appliedMinPrice,
    appliedMaxPrice,
    verifiedOnly,
    inStockOnly,
    selectedRating
  ]);

  // Sort products
  const sortedProducts = useMemo(() => {
    const sorted = [...filteredProducts];
    if (sortBy === "Price Low to High") sorted.sort((a, b) => a.price - b.price);
    else if (sortBy === "Price High to Low") sorted.sort((a, b) => b.price - a.price);
    else if (sortBy === "Highest Rated") sorted.sort((a, b) => b.rating - a.rating);
    else if (sortBy === "Category") {
      sorted.sort((a, b) => {
        const catCompare = (a.category || "").localeCompare(b.category || "");
        if (catCompare !== 0) return catCompare;
        return (a.name || "").localeCompare(b.name || "");
      });
    }
    else sorted.sort((a, b) => b.reviewsCount - a.reviewsCount); // Popularity fallback
    return sorted;
  }, [filteredProducts, sortBy]);

  // Paginated products
  const paginatedProducts = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return sortedProducts.slice(startIndex, startIndex + itemsPerPage);
  }, [sortedProducts, currentPage]);

  const totalPages = useMemo(() => {
    return Math.ceil(sortedProducts.length / itemsPerPage) || 1;
  }, [sortedProducts]);

  // Taxonomy dynamic count helper
  const taxonomyCounts = useMemo(() => {
    const counts: Record<string, { total: number; subs: Record<string, number> }> = {};
    
    // Initialize taxonomy keys
    Object.keys(AGRICULTURE_TAXONOMY).forEach((cat) => {
      counts[cat] = { total: 0, subs: {} };
      const subObj = AGRICULTURE_TAXONOMY[cat];
      if (Array.isArray(subObj)) {
        subObj.forEach((sub) => {
          counts[cat].subs[sub] = 0;
        });
      } else {
        Object.keys(subObj).forEach((subGroup) => {
          counts[cat].subs[subGroup] = 0;
        });
      }
    });

    // Populate counts
    productsList.forEach((p) => {
      if (counts[p.category]) {
        counts[p.category].total += 1;
        if (counts[p.category].subs[p.subcategory] !== undefined) {
          counts[p.category].subs[p.subcategory] += 1;
        } else {
          // If animal health or feed nested
          const subObj = AGRICULTURE_TAXONOMY[p.category];
          if (!Array.isArray(subObj)) {
            // Find which sub group holds the subcategory
            Object.keys(subObj).forEach((subGroup) => {
              if (subObj[subGroup].includes(p.subcategory)) {
                counts[p.category].subs[subGroup] += 1;
              }
            });
          }
        }
      }
    });

    return counts;
  }, [productsList]);

  // Navigation handlers
  const handleCategorySelect = (category: string) => {
    setSelectedCategory(category);
    setSelectedSubcategory("All");
    navigate({
      to: "/shop",
      search: (prev: any) => ({
        ...prev,
        category: category === "All" ? undefined : category,
        subcategory: undefined
      })
    });
    setMobileFiltersOpen(false);
  };

  const handleSubcategorySelect = (subcategory: string) => {
    setSelectedSubcategory(subcategory);
    navigate({
      to: "/shop",
      search: (prev: any) => ({
        ...prev,
        subcategory: subcategory === "All" ? undefined : subcategory
      })
    });
    setMobileFiltersOpen(false);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchFocused(false);
    navigate({
      to: "/shop",
      search: (prev: any) => ({
        ...prev,
        q: searchText.trim() || undefined
      })
    });
  };

  const handleSuggestionClick = (p: ShopProduct) => {
    setSearchFocused(false);
    setSearchText(p.name);
    const slug = p.slug || p.id;
    navigate({ to: "/shop/product/$slug", params: { slug } });
  };

  const handleBrandToggle = (brand: string) => {
    setSelectedBrands((prev) =>
      prev.includes(brand) ? prev.filter((b) => b !== brand) : [...prev, brand]
    );
    setCurrentPage(1);
  };

  const handlePriceApply = () => {
    setAppliedMinPrice(minPrice);
    setAppliedMaxPrice(maxPrice);
    setCurrentPage(1);
    toast.success(`Price limit set: KSh ${minPrice} - KSh ${maxPrice}`);
  };

  const handleToggleWishlist = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setWishlist((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
        toast.info("Removed from wishlist");
      } else {
        next.add(id);
        toast.success("Added to wishlist!");
      }
      localStorage.setItem("mqulima_wishlist", JSON.stringify(Array.from(next)));
      return next;
    });
  };

  // Compare List Handlers
  const handleToggleCompare = (product: ShopProduct, e: React.MouseEvent) => {
    e.stopPropagation();
    setCompareList((prev) => {
      const exists = prev.some((p) => p.id === product.id);
      if (exists) {
        toast.info(`Removed ${product.name} from comparison list`);
        return prev.filter((p) => p.id !== product.id);
      } else {
        if (prev.length >= 3) {
          toast.warning("Comparison is capped at 3 products maximum");
          return prev;
        }
        toast.success(`Added ${product.name} to comparison list`);
        return [...prev, product];
      }
    });
  };

  const handleSendStockRequest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!recommendName.trim()) {
      toast.error("Please fill in the product name.");
      return;
    }
    const message = `Hello Mqulima Support, I'm looking for a product that seems to be out of stock or unavailable:\n
Product Name: ${recommendName.trim()}
Brand: ${recommendBrand.trim() || "Any brand"}
Please notify me if it becomes available!`;
    window.open(`https://wa.me/254723346134?text=${encodeURIComponent(message)}`, "_blank");
    setRecommendName("");
    setRecommendBrand("");
    toast.success("Stock request query opened in WhatsApp!");
  };

  // Render Left Filter Content
  const renderFilterContent = () => (
    <div className="space-y-6">
      {/* 8-Tier Category Tree */}
      <div>
        <h3 className="font-extrabold text-[12px] uppercase text-[#1A1A1A] tracking-wider mb-3">
          Product Categories
        </h3>
        <div className="space-y-2.5 font-sans">
          <button
            onClick={() => handleCategorySelect("All")}
            className={`w-full text-left py-1 text-xs font-semibold hover:text-[#2D6A4F] transition-colors flex justify-between items-center ${
              selectedCategory === "All" ? "text-[#2D6A4F] font-bold" : "text-[#4B5563]"
            }`}
          >
            <span>All Categories</span>
            <span className="text-[10px] text-[#9CA3AF]">({productsList.length})</span>
          </button>
          
          {Object.keys(AGRICULTURE_TAXONOMY).map((catName) => {
            const isCatActive = selectedCategory === catName;
            const subItems = AGRICULTURE_TAXONOMY[catName];
            const catCount = taxonomyCounts[catName]?.total || 0;

            return (
              <div key={catName} className="space-y-1">
                <button
                  onClick={() => handleCategorySelect(catName)}
                  className={`w-full text-left py-1.5 px-2 rounded-lg text-xs font-semibold hover:bg-gray-50 hover:text-[#2D6A4F] transition flex justify-between items-center ${
                    isCatActive ? "bg-[#E8F5E9] text-[#2D6A4F]" : "text-[#4B5563]"
                  }`}
                >
                  <span>{catName}</span>
                  <span className="text-[10px] text-gray-400 font-mono">({catCount})</span>
                </button>
                
                {/* Collapsible Subcategory lists */}
                {isCatActive && (
                  <div className="pl-4 py-1.5 border-l-2 border-[#2D6A4F]/20 ml-2.5 space-y-1 my-1">
                    <button
                      onClick={() => handleSubcategorySelect("All")}
                      className={`block text-left w-full hover:text-[#2D6A4F] text-[11px] py-0.5 transition ${
                        selectedSubcategory === "All" ? "text-[#2D6A4F] font-bold" : "text-gray-500"
                      }`}
                    >
                      All {catName}
                    </button>
                    {Array.isArray(subItems) ? (
                      subItems.map((subName) => {
                        const isSubActive = selectedSubcategory === subName;
                        const subCount = taxonomyCounts[catName]?.subs[subName] || 0;
                        return (
                          <button
                            key={subName}
                            onClick={() => handleSubcategorySelect(subName)}
                            className={`w-full hover:text-[#2D6A4F] text-[11px] py-0.5 transition flex justify-between items-center ${
                              isSubActive ? "text-[#2D6A4F] font-bold" : "text-gray-500"
                            }`}
                          >
                            <span>{subName}</span>
                            <span className="text-[9px] text-gray-400 font-mono">({subCount})</span>
                          </button>
                        );
                      })
                    ) : (
                      Object.keys(subItems).map((subGroup) => {
                        const isSubActive = selectedSubcategory === subGroup;
                        const subCount = taxonomyCounts[catName]?.subs[subGroup] || 0;
                        return (
                          <button
                            key={subGroup}
                            onClick={() => handleSubcategorySelect(subGroup)}
                            className={`w-full hover:text-[#2D6A4F] text-[11px] py-0.5 transition flex justify-between items-center ${
                              isSubActive ? "text-[#2D6A4F] font-bold" : "text-gray-500"
                            }`}
                          >
                            <span>{subGroup}</span>
                            <span className="text-[9px] text-gray-400 font-mono">({subCount})</span>
                          </button>
                        );
                      })
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <hr className="border-gray-200" />

      {/* Brand Selection */}
      <div>
        <h3 className="font-extrabold text-[12px] uppercase text-[#1A1A1A] tracking-wider mb-3">
          Filter by Brand
        </h3>
        <div className="max-h-[160px] overflow-y-auto space-y-2 pr-2 scrollbar-thin">
          {allBrands.map((brand) => (
            <label
              key={brand}
              className="flex items-center gap-2 cursor-pointer text-gray-600 hover:text-[#2D6A4F] transition text-xs font-semibold"
            >
              <input
                type="checkbox"
                checked={selectedBrands.includes(brand)}
                onChange={() => handleBrandToggle(brand)}
                className="w-3.5 h-3.5 rounded border-gray-300 text-[#2D6A4F] focus:ring-[#2D6A4F] accent-[#2D6A4F]"
              />
              <span>{brand}</span>
            </label>
          ))}
        </div>
      </div>

      <hr className="border-gray-200" />

      {/* Price Range Slider */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <span className="font-extrabold text-[12px] uppercase text-[#1A1A1A] tracking-wider">
            Price Range (KSh)
          </span>
          <button
            onClick={handlePriceApply}
            className="text-xs font-bold text-[#2D6A4F] hover:underline uppercase tracking-wider"
          >
            Apply
          </button>
        </div>

        <div className="flex items-center gap-2 mt-2">
          <input
            type="number"
            value={minPrice}
            onChange={(e) => setMinPrice(Number(e.target.value))}
            className="w-full bg-white border border-gray-300 rounded-lg px-2 py-1.5 text-xs text-gray-800 text-center outline-none focus:border-[#2D6A4F]"
            placeholder="Min"
          />
          <span className="text-gray-400 text-xs">-</span>
          <input
            type="number"
            value={maxPrice}
            onChange={(e) => setMaxPrice(Number(e.target.value))}
            className="w-full bg-white border border-gray-300 rounded-lg px-2 py-1.5 text-xs text-gray-800 text-center outline-none focus:border-[#2D6A4F]"
            placeholder="Max"
          />
        </div>
      </div>

      <hr className="border-gray-200" />

      {/* Rating Filter */}
      <div>
        <h3 className="font-extrabold text-[12px] uppercase text-[#1A1A1A] tracking-wider mb-2.5">
          Minimum Rating
        </h3>
        <div className="space-y-2">
          {[4, 3, 2].map((stars) => (
            <button
              key={stars}
              onClick={() => {
                setSelectedRating(selectedRating === stars ? null : stars);
                setCurrentPage(1);
              }}
              className={`flex items-center gap-2 w-full text-xs font-semibold transition hover:text-[#2D6A4F] ${
                selectedRating === stars ? "text-[#2D6A4F]" : "text-gray-600"
              }`}
            >
              <div className="flex text-amber-400">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    size={12}
                    className={i < stars ? "fill-amber-400 text-amber-400" : "text-gray-300"}
                  />
                ))}
              </div>
              <span>& Up</span>
            </button>
          ))}
        </div>
      </div>

      <hr className="border-gray-200" />

      {/* Quality Badges */}
      <div>
        <h3 className="font-extrabold text-[12px] uppercase text-[#1A1A1A] tracking-wider mb-2.5">
          Verification & Stock
        </h3>
        <div className="space-y-2">
          <label className="flex items-center gap-2 cursor-pointer text-gray-600 hover:text-[#2D6A4F] text-xs font-semibold">
            <input
              type="checkbox"
              checked={verifiedOnly}
              onChange={(e) => {
                setVerifiedOnly(e.target.checked);
                setCurrentPage(1);
              }}
              className="w-3.5 h-3.5 rounded border-gray-300 text-[#2D6A4F] focus:ring-[#2D6A4F] accent-[#2D6A4F]"
            />
            <span className="flex items-center gap-1">
              <ShieldCheck size={14} className="text-[#2D6A4F]" /> Verified Sellers Only
            </span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer text-gray-600 hover:text-[#2D6A4F] text-xs font-semibold">
            <input
              type="checkbox"
              checked={inStockOnly}
              onChange={(e) => {
                setInStockOnly(e.target.checked);
                setCurrentPage(1);
              }}
              className="w-3.5 h-3.5 rounded border-gray-300 text-[#2D6A4F] focus:ring-[#2D6A4F] accent-[#2D6A4F]"
            />
            <span>Hide Out of Stock</span>
          </label>
        </div>
      </div>
    </div>
  );

  return (
    <AppLayout>
      <div className="bg-[#FAF9F6] min-h-screen text-[#1A1A1A] font-sans pb-28 lg:pb-16 pt-4">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6">
          
          {/* Main Marketplace Header */}
          <div className="bg-white border border-gray-200 p-6 rounded-2xl mb-6 shadow-sm">
            <div className="text-left">
              <h1 className="text-2xl font-black text-gray-900 tracking-tight">Farmer Marketplace</h1>
              <p className="text-xs text-gray-500 mt-1">Certified premium seeds, crop protection, and feeds with expert support</p>
            </div>
          </div>

          {/* Breadcrumb strip / Filter tags */}
          <div className="text-xs text-left mb-6 flex items-center flex-wrap gap-2 text-gray-500 font-medium">
            <Link to="/shop" onClick={() => handleCategorySelect("All")} className="hover:text-[#2D6A4F] transition font-bold">Shop</Link>
            {selectedCategory !== "All" && (
              <>
                <ChevronRight size={12} className="text-gray-300" />
                <button onClick={() => handleCategorySelect(selectedCategory)} className="hover:text-[#2D6A4F] font-bold">{selectedCategory}</button>
              </>
            )}
            {selectedSubcategory !== "All" && (
              <>
                <ChevronRight size={12} className="text-gray-300" />
                <span className="text-[#1A1A1A] font-semibold">{selectedSubcategory}</span>
              </>
            )}

          </div>


            <div className="flex gap-6 items-start">
            
            {/* Desktop Left Filter Sidebar */}
            <aside className="hidden lg:block w-[280px] shrink-0 bg-white border border-gray-200 p-6 rounded-2xl shadow-sm text-left">
              {renderFilterContent()}
            </aside>

            {/* Right Main Grid */}
            <main className="flex-1">
              
              {/* Toolbar Controls */}
              <div className="bg-white border border-gray-200 p-4 rounded-xl mb-4 shadow-sm flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-baseline gap-2 text-left">
                  <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider">
                    {selectedCategory === "All" ? "All Shop Items" : selectedCategory}
                  </h2>
                  <span className="text-xs text-gray-400 font-medium">({filteredProducts.length} items found)</span>
                </div>

                <div className="flex items-center gap-3">
                  {/* Sorting dropdown */}
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500 font-semibold">Sort by:</span>
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      className="border border-gray-200 focus:border-[#2D6A4F] rounded-lg px-2.5 py-1.5 text-xs text-gray-800 bg-white outline-none font-bold cursor-pointer"
                    >
                      <option value="Popularity">Popularity</option>
                      <option value="Category">Category</option>
                      <option value="Price Low to High">Price: Low to High</option>
                      <option value="Price High to Low">Price: High to Low</option>
                      <option value="Highest Rated">Highest Rated</option>
                    </select>
                  </div>

                  {/* View Toggles */}
                  <div className="flex items-center gap-1 border border-gray-150 p-1 rounded-lg bg-gray-50">
                    <button
                      onClick={() => setViewMode("grid")}
                      className={`p-1.5 rounded-md transition cursor-pointer ${
                        viewMode === "grid" ? "bg-[#2D6A4F] text-white shadow-sm" : "text-gray-500 hover:text-gray-800"
                      }`}
                      title="Grid Layout"
                    >
                      <LayoutGrid size={14} />
                    </button>
                    <button
                      onClick={() => setViewMode("list")}
                      className={`p-1.5 rounded-md transition cursor-pointer ${
                        viewMode === "list" ? "bg-[#2D6A4F] text-white shadow-sm" : "text-gray-500 hover:text-gray-800"
                      }`}
                      title="List Layout"
                    >
                      <List size={14} />
                    </button>
                  </div>
                </div>
              </div>

              {/* Active Filter Badges */}
              {(selectedBrands.length > 0 || appliedMinPrice > 0 || appliedMaxPrice < 25000 || verifiedOnly || selectedRating !== null) && (
                <div className="flex items-center flex-wrap gap-2 mb-4 font-sans text-left">
                  <span className="text-xs text-gray-400 font-semibold">Active filters:</span>
                  {selectedBrands.map((b) => (
                    <span key={b} className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#2D6A4F]/10 text-[#2D6A4F] rounded-full text-xs font-bold">
                      Brand: {b}
                      <X size={10} className="cursor-pointer" onClick={() => handleBrandToggle(b)} />
                    </span>
                  ))}
                  {(appliedMinPrice > 0 || appliedMaxPrice < 25000) && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#2D6A4F]/10 text-[#2D6A4F] rounded-full text-xs font-bold">
                      KSh {appliedMinPrice} - KSh {appliedMaxPrice}
                      <X size={10} className="cursor-pointer" onClick={() => { setMinPrice(0); setMaxPrice(25000); setAppliedMinPrice(0); setAppliedMaxPrice(25000); }} />
                    </span>
                  )}
                  {verifiedOnly && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#2D6A4F]/10 text-[#2D6A4F] rounded-full text-xs font-bold">
                      Verified Sellers
                      <X size={10} className="cursor-pointer" onClick={() => setVerifiedOnly(false)} />
                    </span>
                  )}
                  {selectedRating !== null && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#2D6A4F]/10 text-[#2D6A4F] rounded-full text-xs font-bold">
                      {selectedRating}★ & Up
                      <X size={10} className="cursor-pointer" onClick={() => setSelectedRating(null)} />
                    </span>
                  )}
                  <button
                    onClick={() => {
                      setSelectedBrands([]);
                      setMinPrice(0);
                      setMaxPrice(25000);
                      setAppliedMinPrice(0);
                      setAppliedMaxPrice(25000);
                      setVerifiedOnly(false);
                      setInStockOnly(false);
                      setSelectedRating(null);
                      toast.success("Cleared all filters");
                    }}
                    className="text-xs text-red-500 hover:text-red-600 hover:underline font-bold"
                  >
                    Clear All
                  </button>
                </div>
              )}

              {/* Grid / List view implementation */}
              {isProductsLoading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="aspect-[3/4] bg-white border border-gray-200 rounded-2xl p-4 flex flex-col justify-between animate-pulse">
                      <div className="w-full h-[150px] bg-gray-100 rounded-xl" />
                      <div className="flex-1 mt-4 space-y-2">
                        <div className="h-3 bg-gray-100 w-1/3 rounded" />
                        <div className="h-4 bg-gray-100 w-full rounded" />
                        <div className="h-3 bg-gray-100 w-2/3 rounded" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : paginatedProducts.length === 0 ? (
                <div className="bg-white border border-gray-200 rounded-2xl p-12 text-center my-6 flex flex-col items-center">
                  <span className="text-3xl block mb-2">🌾</span>
                  <h3 className="text-sm font-bold text-gray-800">No agricultural products match</h3>
                  <p className="text-xs text-gray-500 mt-1 mb-6">Try broadening search terms or resetting active filter sidebar tags.</p>
                  <button
                    onClick={() => {
                      setSelectedBrands([]);
                      setMinPrice(0);
                      setMaxPrice(25000);
                      setAppliedMinPrice(0);
                      setAppliedMaxPrice(25000);
                      setVerifiedOnly(false);
                      setInStockOnly(false);
                      setSelectedRating(null);
                      setSearchText("");
                      setSelectedCategory("All");
                      setSelectedSubcategory("All");
                      navigate({ to: "/shop", search: () => ({}) });
                    }}
                    className="bg-[#2D6A4F] hover:bg-[#1A5438] text-white text-xs font-bold px-5 py-2.5 rounded-lg shadow transition"
                  >
                    Reset All Filters
                  </button>
                </div>
              ) : (
                <div className={`grid gap-5 ${
                  viewMode === "list"
                    ? "grid-cols-1"
                    : "grid-cols-2 sm:grid-cols-2 md:grid-cols-3"
                }`}>
                  {paginatedProducts.map((p) => {
                    const isWishlisted = wishlist.has(p.id);
                    const isComparing = compareList.some((c) => c.id === p.id);
                    const hasDiscount = !!(p.originalPrice && p.originalPrice > p.price);
                    const discountPercentage = hasDiscount
                      ? Math.round(((p.originalPrice! - p.price) / p.originalPrice!) * 100)
                      : 0;

                    return (
                      <div
                        key={p.id}
                        onClick={() => {
                          // Save to recently viewed
                          const list = recentlyViewed.filter((item) => item.id !== p.id);
                          const updated = [p, ...list].slice(0, 4);
                          setRecentlyViewed(updated);
                          localStorage.setItem("mqulima_recently_viewed", JSON.stringify(updated));
                          const slug = p.slug || p.id;
                          navigate({ to: "/shop/product/$slug", params: { slug } });
                        }}
                        className={`group bg-white rounded-none border border-gray-200/80 hover:-translate-y-1 hover:shadow-lg transition-all duration-300 flex text-gray-800 p-4 ${
                          viewMode === "list"
                            ? "flex-row w-full gap-5 items-center"
                            : "flex-col w-full gap-3 justify-between h-full relative"
                        }`}
                      >
                        {/* Image wrapper */}
                        <div className={`relative bg-gray-50 rounded-none overflow-hidden shrink-0 ${
                          viewMode === "list"
                            ? "w-[120px] h-[120px] sm:w-[150px] sm:h-[150px]"
                            : "w-full aspect-square"
                        }`}>
                          <img
                            src={p.image}
                            alt={p.name}
                            className="w-full h-full object-cover group-hover:scale-[1.04] transition duration-300"
                            onError={(e) => { e.currentTarget.src = '/placeholder-product.png'; }}
                          />

                          {/* Hover View Button Overlay */}
                          <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center pointer-events-none z-1">
                            <span className="bg-[#2D6A4F] text-white text-[10px] font-black uppercase tracking-wider px-3.5 py-2 rounded-none shadow-lg transform translate-y-2 group-hover:translate-y-0 transition-all duration-300">
                              View Details
                            </span>
                          </div>

                          {/* Badges & Discount tags overlay */}
                          <div className="absolute top-2 left-2 flex flex-col gap-1 z-10 items-start">
                            {hasDiscount && (
                              <span className="text-[9px] font-extrabold px-2 py-0.5 rounded-none text-white bg-red-500 uppercase tracking-wide">
                                -{discountPercentage}% Off
                              </span>
                            )}
                            {p.organic && (
                              <span className="bg-emerald-600 text-white text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-none flex items-center gap-1 shadow-sm">
                                <Sparkles size={10} className="fill-white" /> Organic
                              </span>
                            )}
                            {p.badge && (
                              <span className="bg-stone-900 text-white text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-none shadow-sm">
                                {p.badge}
                              </span>
                            )}
                          </div>

                          {/* Wishlist Button */}
                          <button
                            onClick={(e) => handleToggleWishlist(p.id, e)}
                            className="absolute top-2 right-2 bg-white/90 hover:bg-white p-2 rounded-full shadow-md transition duration-200 border border-gray-100 z-10 cursor-pointer"
                          >
                            <Heart
                              size={14}
                              className={isWishlisted ? "fill-red-500 text-red-500" : "text-gray-400"}
                            />
                          </button>

                          {/* Compare Button */}
                          <button
                            onClick={(e) => handleToggleCompare(p, e)}
                            className={`absolute bottom-2 left-2 p-1.5 rounded-full shadow-md transition duration-200 border z-10 cursor-pointer ${
                              isComparing ? "bg-[#2D6A4F] text-white border-[#2D6A4F]" : "bg-white/90 text-gray-500 hover:text-[#2D6A4F] border-gray-100"
                            }`}
                            title="Compare this product"
                          >
                            <Maximize2 size={12} />
                          </button>
                        </div>

                        {/* Card Info details */}
                        <div className="flex-1 flex flex-col justify-between text-left font-sans h-full">
                          <div className="space-y-1">
                            <div className="flex items-center gap-1 flex-wrap">
                              <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wide">
                                {p.brand}
                              </span>
                              {p.verifiedSeller && (
                                <span className="inline-flex items-center text-[9px] bg-emerald-50 text-[#2D6A4F] px-1.5 py-0.2 rounded-none font-extrabold border border-emerald-100">
                                  Verified
                                </span>
                              )}
                            </div>
                            
                            <h3 className="text-xs sm:text-sm text-gray-800 font-bold leading-snug line-clamp-2 min-h-0 sm:min-h-[40px] group-hover:text-[#2D6A4F] transition-colors">
                              {p.name}
                            </h3>

                            <p className="text-xs text-gray-500">
                              {p.briefDescription || ""}
                            </p>

                            <div className="flex items-center gap-1.5 py-1">
                              <div className="flex">
                                {Array.from({ length: 5 }).map((_, sIdx) => (
                                  <Star
                                    key={sIdx}
                                    className={`h-3 w-3 ${
                                      sIdx < Math.floor(p.rating)
                                        ? "fill-amber-400 text-amber-400"
                                        : "text-gray-200"
                                    }`}
                                  />
                                ))}
                              </div>
                            </div>

                            {/* Stock Indicator */}
                            <div className="flex items-center justify-end text-[10px] min-h-[16px]">
                              <span className={`font-extrabold ${p.stock > 10 ? "text-emerald-600" : (p.stock > 0 ? "text-amber-500" : "text-red-500")}`}>
                                {p.stock > 10 ? "In Stock" : (p.stock > 0 ? `Only ${p.stock} left` : "Out of Stock")}
                              </span>
                            </div>

                            <div className="flex items-baseline gap-2 pt-1.5">
                              <span className="text-sm sm:text-base font-black text-gray-900">
                                KSh {p.price.toLocaleString()}
                              </span>
                              {hasDiscount && (
                                <span className="text-xs text-gray-400 line-through">
                                  KSh {p.originalPrice!.toLocaleString()}
                                </span>
                              )}
                            </div>

                          </div>

                           {/* Quick Purchase actions block */}
                          <div className="mt-3.5 flex gap-2 w-full pt-1.5 border-t border-gray-100">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                addToCart(p, 1);
                              }}
                              disabled={p.stock <= 0}
                              className={`flex-1 text-[10px] font-extrabold py-2 px-1 rounded-none transition-colors uppercase tracking-wider text-center flex items-center justify-center gap-1 cursor-pointer ${
                                p.stock <= 0
                                  ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                                  : "border border-[#2D6A4F] text-[#2D6A4F] hover:bg-[#2D6A4F]/5"
                              }`}
                            >
                              Add to Cart
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                const slug = p.slug || p.id;
                                navigate({ to: "/shop/product/$slug", params: { slug } });
                              }}
                              disabled={p.stock <= 0}
                              className={`flex-1 text-[10px] font-extrabold py-2 px-1 rounded-none transition-colors uppercase tracking-wider text-center flex items-center justify-center gap-1 cursor-pointer ${
                                p.stock <= 0
                                  ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                                  : "bg-[#2D6A4F] hover:bg-[#1A5438] text-white"
                              }`}
                            >
                              {p.stock <= 0 ? "Out of Stock" : "Buy Now"}
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Pagination block */}
              {totalPages > 1 && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-8 border-t border-gray-200 pt-6">
                  <div className="text-xs text-gray-500 font-bold">
                    Showing {(currentPage - 1) * itemsPerPage + 1}–{Math.min(currentPage * itemsPerPage, filteredProducts.length)} of {filteredProducts.length} items
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => {
                        setCurrentPage((p) => Math.max(1, p - 1));
                        window.scrollTo({ top: 0, behavior: "smooth" });
                      }}
                      disabled={currentPage === 1}
                      className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center text-xs font-bold disabled:opacity-40 hover:bg-gray-50 bg-white transition cursor-pointer"
                    >
                      <ChevronLeft size={14} />
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
                          className={`w-8 h-8 rounded-lg border text-xs font-extrabold flex items-center justify-center transition-colors cursor-pointer ${
                            currentPage === page
                              ? "bg-[#2D6A4F] border-[#2D6A4F] text-white"
                              : "border-gray-200 hover:bg-gray-50 text-gray-800 bg-white"
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
                      className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center text-xs font-bold disabled:opacity-40 hover:bg-gray-50 bg-white transition cursor-pointer"
                    >
                      <ChevronRight size={14} />
                    </button>
                  </div>
                </div>
              )}

              {/* Recently Viewed Strip */}
              {recentlyViewed.length > 0 && (
                <div className="mt-12 border-t border-gray-200 pt-8 text-left">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-extrabold uppercase text-[#1A1A1A] tracking-wider">
                      Recently Viewed Items
                    </h3>
                    <button
                      onClick={handleClearRecentlyViewed}
                      className="text-xs font-bold text-red-500 hover:text-red-700 transition cursor-pointer select-none"
                    >
                      Clear All
                    </button>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {recentlyViewed.map((recent) => (
                      <div
                        key={recent.id}
                        onClick={() => {
                          const slug = recent.slug || recent.id;
                          navigate({ to: "/shop/product/$slug", params: { slug } });
                        }}
                        className="relative bg-white border border-gray-200 p-3 rounded-xl hover:shadow-md transition cursor-pointer flex gap-3 items-center group/recent"
                      >
                        <div className="w-12 h-12 bg-gray-50 rounded-lg overflow-hidden shrink-0 border border-gray-150 p-0.5">
                          <img src={recent.image} alt={recent.name} className="h-full w-full object-cover" />
                        </div>
                        <div className="min-w-0 pr-4">
                          <h4 className="text-xs font-bold text-gray-800 truncate">{recent.name}</h4>
                          <span className="text-[10px] text-[#2D6A4F] font-bold block mt-0.5">KSh {recent.price.toLocaleString()}</span>
                        </div>
                        <button
                          type="button"
                          onClick={(e) => handleClearIndividualRecentlyViewed(e, recent.id)}
                          className="absolute top-2 right-2 p-1 bg-white hover:bg-gray-100 border border-gray-150 rounded-full text-gray-400 hover:text-red-500 transition shadow-sm opacity-100 sm:opacity-0 group-hover/recent:opacity-100 cursor-pointer"
                        >
                          <X size={10} strokeWidth={2.5} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Recommended seasonal banner */}
              <div className="mt-8 bg-gradient-to-r from-[#2D6A4F] to-[#1B4332] text-white p-6 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 text-left shadow-sm">
                <div className="space-y-1">
                  <span className="bg-amber-400 text-gray-900 font-extrabold text-[9px] px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                    Seasonal Special Offer
                  </span>
                  <h3 className="text-lg font-black mt-1">Get Free Delivery on orders above KSh 5,000</h3>
                  <p className="text-xs text-gray-200 max-w-xl">Stock up on premium top-dressing fertilizers and certified seeds for the planting season. Includes agronomist phone guidance.</p>
                </div>
                <button
                  onClick={() => handleCategorySelect("Fertilizers")}
                  className="bg-white hover:bg-gray-100 text-[#2D6A4F] font-extrabold text-xs px-5 py-3 rounded-xl transition shrink-0 uppercase tracking-wider flex items-center gap-1"
                >
                  Shop Now <ArrowRight size={14} />
                </button>
              </div>

              {/* Request Stock Form */}
              <div className="mt-8 bg-white border border-gray-200 p-6 rounded-2xl shadow-sm text-left">
                <h3 className="text-sm font-extrabold text-[#1A1A1A] uppercase tracking-wide">
                  Can't Find a Particular Item?
                </h3>
                <p className="text-xs text-gray-500 mt-1 mb-4 leading-relaxed">
                  Submit a quick stock inquiry request. Our agro-sourcing network will locate it and notify you within 24 hours.
                </p>
                <form onSubmit={handleSendStockRequest} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <input
                    type="text"
                    required
                    placeholder="Product name (e.g. Yara Mila Pioneer)"
                    value={recommendName}
                    onChange={(e) => setRecommendName(e.target.value)}
                    className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-xs outline-none focus:border-[#2D6A4F]"
                  />
                  <input
                    type="text"
                    placeholder="Preferred Brand / Volume (optional)"
                    value={recommendBrand}
                    onChange={(e) => setRecommendBrand(e.target.value)}
                    className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-xs outline-none focus:border-[#2D6A4F]"
                  />
                  <button
                    type="submit"
                    className="bg-[#2D6A4F] hover:bg-[#1A5438] text-white text-xs font-bold py-2.5 rounded-xl uppercase tracking-wider transition"
                  >
                    Submit Sourcing Request
                  </button>
                </form>
              </div>

            </main>
          </div>


        </div>
      </div>

      {/* Floating Bottom Comparison Drawer Indicator */}
      {compareList.length > 0 && (
        <div className="fixed bottom-6 right-6 z-40 bg-white border border-gray-200 p-4 rounded-2xl shadow-2xl flex items-center gap-4 animate-bounce font-sans">
          <div className="text-xs">
            <strong className="text-gray-800 font-extrabold">{compareList.length} items</strong> marked for comparison
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setCompareModalOpen(true)}
              className="bg-[#2D6A4F] hover:bg-[#1A5438] text-white text-[10px] font-bold px-3 py-1.5 rounded-lg uppercase tracking-wider"
            >
              Compare Now
            </button>
            <button
              onClick={() => setCompareList([])}
              className="p-1.5 hover:bg-gray-100 text-gray-400 hover:text-red-500 rounded-lg transition"
            >
              <Trash2 size={14} />
            </button>
          </div>
        </div>
      )}

      {/* Side-by-Side Comparison Modal */}
      <AnimatePresence>
        {compareModalOpen && (
          <div className="fixed inset-0 z-50 overflow-y-auto font-sans flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs text-[#1A1A1A]">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl max-w-4xl w-full p-6 shadow-2xl relative border border-gray-100 flex flex-col text-left max-h-[90vh] overflow-y-auto"
            >
              <div className="flex justify-between items-center border-b border-gray-150 pb-4 mb-4">
                <h3 className="text-base font-extrabold uppercase tracking-wider text-gray-800 flex items-center gap-1.5">
                  <Maximize2 size={16} className="text-[#2D6A4F]" /> Side-by-Side Product Comparison
                </h3>
                <button
                  onClick={() => setCompareModalOpen(false)}
                  className="p-1 hover:bg-gray-100 rounded-full transition text-[#6B7280]"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="grid grid-cols-4 gap-4 divide-x divide-gray-100">
                {/* Headers column */}
                <div className="space-y-8 text-xs font-bold text-gray-400 uppercase pt-28">
                  <div>Product Info</div>
                  <div className="pt-2">Price</div>
                  <div className="pt-2">Seller Rating</div>
                  <div className="pt-2">County</div>
                  <div className="pt-2">Stock Availability</div>
                </div>

                {/* Compare items columns */}
                {Array.from({ length: 3 }).map((_, idx) => {
                  const product = compareList[idx];
                  if (!product) {
                    return (
                      <div key={idx} className="flex flex-col items-center justify-center text-center p-6 text-gray-400 min-h-[300px]">
                        <span className="text-2xl mb-1">🌾</span>
                        <div className="text-[10px] font-bold">Slot Empty</div>
                        <p className="text-[9px] text-gray-400 mt-1 max-w-[120px]">Add another product to compare features</p>
                      </div>
                    );
                  }

                  return (
                    <div key={product.id} className="px-4 space-y-8 text-xs text-left">
                      {/* Product Card */}
                      <div className="text-center">
                        <div className="h-24 w-full bg-gray-50 rounded-xl overflow-hidden p-1 border border-gray-150 mb-2">
                          <img src={product.image} alt={product.name} className="h-full w-full object-contain" />
                        </div>
                        <h4 className="font-extrabold text-gray-800 line-clamp-2 h-8 text-xs">{product.name}</h4>
                        <span className="text-[9px] text-gray-400 uppercase font-bold">{product.brand}</span>
                      </div>

                      {/* Price */}
                      <div className="font-extrabold text-[#2D6A4F] text-sm">
                        KSh {product.price.toLocaleString()}
                      </div>

                      {/* Seller Score */}
                      <div>
                        <strong className="text-gray-700">{(product as any).sellerScore}%</strong> satisfaction
                      </div>

                      {/* County */}
                      <div>
                        {product.county}
                      </div>

                      {/* Stock */}
                      <div>
                        <span className={`font-extrabold ${product.stock > 0 ? "text-emerald-600" : "text-red-500"}`}>
                          {product.stock > 0 ? `${product.stock} units` : "Out of stock"}
                        </span>
                      </div>

                      {/* Add/Remove Actions */}
                      <div className="pt-4 flex flex-col gap-2">
                        <button
                          onClick={() => {
                            addToCart(product, 1);
                            setCompareModalOpen(false);
                          }}
                          disabled={product.stock <= 0}
                          className="w-full bg-[#2D6A4F] hover:bg-[#1A5438] text-white py-2 rounded-lg font-bold text-[10px] uppercase tracking-wider text-center disabled:opacity-40"
                        >
                          Add to Cart
                        </button>
                        <button
                          onClick={(e) => handleToggleCompare(product, e)}
                          className="w-full border border-red-200 text-red-500 hover:bg-red-50 py-1.5 rounded-lg text-[9px] uppercase tracking-wider text-center"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Docked Bottom Filter Action Bar for mobile screens */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white p-3.5 z-40 border-t border-gray-200 shadow-[0_-4px_15px_rgba(0,0,0,0.08)]">
        <button
          onClick={() => setMobileFiltersOpen(true)}
          className="w-full bg-[#2D6A4F] hover:bg-[#1A5438] text-white font-bold text-xs py-3 px-6 rounded-none uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap"
        >
          <SlidersHorizontal size={14} />
          <span>Filter Categories ({filteredProducts.length})</span>
        </button>
      </div>

      {/* Mobile Drawer Filter Panel */}
      <AnimatePresence>
        {mobileFiltersOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileFiltersOpen(false)}
              className="absolute inset-0 bg-black/60"
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 220 }}
              className="absolute bottom-0 left-0 right-0 w-full h-[85vh] bg-white shadow-2xl flex flex-col overflow-hidden rounded-t-2xl z-50 text-left"
            >
              <div className="flex items-center justify-between border-b border-gray-200 p-5 shrink-0">
                <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider">Marketplace Filters</h3>
                <button
                  onClick={() => setMobileFiltersOpen(false)}
                  className="p-1 rounded-full hover:bg-gray-100 text-gray-500 transition"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-5 pb-28">
                {renderFilterContent()}
              </div>

              <div className="absolute bottom-0 left-0 right-0 bg-white p-5 border-t border-gray-200 shrink-0">
                <button
                  onClick={() => setMobileFiltersOpen(false)}
                  className="w-full bg-[#2D6A4F] hover:bg-[#1A5438] text-xs font-bold text-white uppercase py-3 rounded-xl transition tracking-wide"
                >
                  Apply & Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>



    </AppLayout>
  );
}
