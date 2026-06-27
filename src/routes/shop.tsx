import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  ShoppingCart,
  Heart,
  ChevronLeft,
  ChevronRight,
  Star,
  X,
  Check,
  ChevronDown,
  SlidersHorizontal,
  PlusCircle,
  MessageSquare
} from "lucide-react";
import { toast } from "sonner";
import { shopProducts, type ShopProduct } from "@/lib/shop-data";
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
      { title: "Mqulima Agrovet Store — Premium Farmers Essentials" },
      {
        name: "description",
        content: "Shop certified seeds, premium fertilizers, crop health solutions, and farm machinery with agronomist support.",
      },
    ],
  }),
  component: ShopPage,
});

// POS Categories Mapper Array
const POS_CATEGORIES = [
  { id: "All", label: "All POS Products", icon: "📦", categories: [] as string[] },
  { id: "Seeds", label: "Certified Seeds", icon: "🌱", categories: ["Seeds & Seedlings"] },
  { id: "Feeds", label: "Livestock Feeds", icon: "🐄", categories: ["Animal Feeds"] },
  { id: "Fertilizers", label: "Fertilizers", icon: "🍚", categories: ["Planting", "Top Dressing", "Organic fertilizer", "Foliar Fertilizer"] },
  { id: "CropHealth", label: "Crop Health Products", icon: "🧪", categories: ["Pesticides", "Growth Catalysts", "Biostimulants"] },
  { id: "Tools", label: "Farm Tools & Implements", icon: "🚜", categories: ["Tools", "Implements", "Machinery"] },
  { id: "Vet", label: "Vet Supplies / Animal Health", icon: "🏥", categories: ["Domestic Animal pharmacy", "Animal pesticides", "Supplements"] }
];

const RELATED_TAGS = [
  "certified seeds",
  "livestock feeds",
  "foliar fertilizers",
  "pesticides",
  "farm tools",
  "dairy meal",
  "hass seedling",
  "bio-digester"
];

function ShopPage() {
  const navigate = useNavigate();
  const searchParams = Route.useSearch();
  const { addToCart } = useCart();

  // Wishlist state
  const [wishlist, setWishlist] = useState<Set<string>>(new Set());
  useEffect(() => {
    try {
      const stored = localStorage.getItem("mqulima_wishlist");
      if (stored) setWishlist(new Set(JSON.parse(stored)));
    } catch (e) {
      console.error(e);
    }
  }, []);

  // Sync Search Query & POS Category from URL
  const [searchText, setSearchText] = useState("");
  const [selectedPosCategory, setSelectedPosCategory] = useState("All");

  useEffect(() => {
    if (searchParams.q) {
      setSearchText(searchParams.q);
    } else {
      setSearchText("");
    }
    if (searchParams.category) {
      setSelectedPosCategory(searchParams.category);
    } else {
      setSelectedPosCategory("All");
    }
    setCurrentPage(1);
  }, [searchParams.q, searchParams.category]);

  // Sidebar Filter States
  const [brandSearch, setBrandSearch] = useState("");
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [minPrice, setMinPrice] = useState(0);
  const [maxPrice, setMaxPrice] = useState(90000);
  const [appliedMinPrice, setAppliedMinPrice] = useState(0);
  const [appliedMaxPrice, setAppliedMaxPrice] = useState(90000);
  const [minSellerScore, setMinSellerScore] = useState<number | null>(null);

  // Sorting Option
  const [sortBy, setSortBy] = useState("Popularity");

  // Mobile Filters Drawer State
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  // Stock Request / Recommendation Form States
  const [recommendName, setRecommendName] = useState("");
  const [recommendBrand, setRecommendBrand] = useState("");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

  // Extract all unique brands
  const allBrands = useMemo(() => {
    const brandsSet = new Set<string>();
    shopProducts.forEach((p) => {
      if (p.brand) brandsSet.add(p.brand);
    });
    return Array.from(brandsSet).sort();
  }, []);

  // Filtered brands choices
  const filteredBrandChoices = useMemo(() => {
    return allBrands.filter((b) =>
      b.toLowerCase().includes(brandSearch.toLowerCase())
    );
  }, [allBrands, brandSearch]);

  // Main filter function
  const filteredProducts = useMemo(() => {
    return shopProducts
      .filter((p) => {
        // POS Category Filter mapping
        if (selectedPosCategory !== "All") {
          const mapping = POS_CATEGORIES.find(c => c.id === selectedPosCategory);
          if (mapping && mapping.categories.length > 0) {
            if (!mapping.categories.includes(p.category)) return false;
          }
        }

        // Text Search Filter
        if (searchText.trim() !== "") {
          const query = searchText.toLowerCase().trim();
          const matches =
            p.name.toLowerCase().includes(query) ||
            p.brand.toLowerCase().includes(query) ||
            p.description.toLowerCase().includes(query) ||
            p.category.toLowerCase().includes(query);
          if (!matches) return false;
        }

        // Brands Filter
        if (selectedBrands.length > 0) {
          if (!selectedBrands.includes(p.brand)) return false;
        }

        // Price range filter
        if (p.price < appliedMinPrice || p.price > appliedMaxPrice) return false;

        // Seller Score filter
        if (minSellerScore !== null) {
          if (p.sellerScore < minSellerScore) return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === "Price Low to High") return a.price - b.price;
        if (sortBy === "Price High to Low") return b.price - a.price;
        if (sortBy === "Highest Rated") return b.rating - a.rating;
        return b.reviewsCount - a.reviewsCount; // Default: Popularity
      });
  }, [
    selectedPosCategory,
    searchText,
    selectedBrands,
    appliedMinPrice,
    appliedMaxPrice,
    minSellerScore,
    sortBy
  ]);

  // Paginated visible products
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedProducts = useMemo(() => {
    return filteredProducts.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredProducts, startIndex]);

  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage) || 1;

  // Event handlers
  const handleCategorySelect = (posCatId: string) => {
    setSelectedPosCategory(posCatId);
    navigate({
      to: "/shop",
      search: (prev: any) => ({
        ...prev,
        category: posCatId === "All" ? undefined : posCatId
      })
    });
    setMobileFiltersOpen(false);
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
    toast.success(`Price filter applied: KSh ${minPrice} - KSh ${maxPrice}`);
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
        toast.success("Added to wishlist");
      }
      localStorage.setItem("mqulima_wishlist", JSON.stringify(Array.from(next)));
      return next;
    });
  };

  const handleAddToCartClick = (p: ShopProduct, e: React.MouseEvent) => {
    e.stopPropagation();
    addToCart(p, 1);
  };

  const handleTagClick = (tag: string) => {
    setSearchText(tag);
    navigate({
      to: "/shop",
      search: (prev: any) => ({
        ...prev,
        q: tag
      })
    });
  };

  // Stock stocking recommendation submit handler
  const handleSendStockRequest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!recommendName.trim()) {
      toast.error("Please specify a product name.");
      return;
    }
    const message = `Hello Mqulima team, I would like to recommend/request stocking of the following product:\n
*Product Name:* ${recommendName.trim()}
*Brand/Description:* ${recommendBrand.trim() || "Not Specified"}\n
Please notify me if you source this item!`;

    window.open(`https://wa.me/254700000000?text=${encodeURIComponent(message)}`, "_blank");
    setRecommendName("");
    setRecommendBrand("");
    toast.success("Redirecting to sales agent to submit stocking request!");
  };

  // Reusable Filter Sidebar Content
  const renderFilterContent = () => (
    <div className="space-y-6 text-left">
      
      {/* POS Categories Section (POS Grouping request) */}
      <div>
        <h3 className="text-[10px] font-extrabold text-[#1A1A1A] uppercase tracking-wider mb-3">POS Categories</h3>
        <div className="space-y-1 text-xs text-[#1A1A1A]">
          {POS_CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => handleCategorySelect(cat.id)}
              className={`flex items-center justify-between w-full text-left py-2 px-2.5 rounded-none transition font-bold ${
                selectedPosCategory === cat.id 
                  ? "bg-[#2D6A4F] text-white shadow-xs" 
                  : "text-[#6B7280] hover:bg-[#FAFAF8] hover:text-[#1A1A1A]"
              }`}
            >
              <span className="flex items-center gap-2">
                <span>{cat.icon}</span>
                <span>{cat.label}</span>
              </span>
              {selectedPosCategory === cat.id && <Check className="h-3.5 w-3.5 text-white" />}
            </button>
          ))}
        </div>
      </div>

      <hr className="border-gray-150" />

      {/* Brand Section */}
      <div>
        <h3 className="text-[10px] font-extrabold text-[#1A1A1A] uppercase tracking-wider mb-3">Brand Filter</h3>
        
        {/* Brand Search box */}
        <div className="relative mb-3 flex items-center border border-[#E8ECE9] rounded-none p-2 bg-[#FAFAF8] focus-within:border-[#2D6A4F] focus-within:bg-white transition">
          <Search size={13} className="text-[#6B7280] mr-2" />
          <input
            type="text"
            placeholder="Search brand..."
            value={brandSearch}
            onChange={(e) => setBrandSearch(e.target.value)}
            className="w-full bg-transparent border-0 outline-none text-xs text-[#1A1A1A] placeholder-gray-400"
          />
        </div>

        {/* Brands checklist */}
        <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1 text-xs scrollbar-thin">
          {filteredBrandChoices.length === 0 ? (
            <span className="text-[#6B7280] block text-xs italic">No brands found</span>
          ) : (
            filteredBrandChoices.map((brand) => {
              const isChecked = selectedBrands.includes(brand);
              return (
                <label
                  key={brand}
                  className="flex items-center gap-2 cursor-pointer text-[#1A1A1A] font-bold hover:text-[#2D6A4F] transition"
                >
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => handleBrandToggle(brand)}
                    className="w-3.5 h-3.5 rounded-none border-[#E8ECE9] accent-[#2D6A4F]"
                  />
                  <span>{brand}</span>
                </label>
              );
            })
          )}
        </div>
      </div>

      <hr className="border-gray-150" />

      {/* Price filter (KSH) */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-[10px] font-extrabold text-[#1A1A1A] uppercase tracking-wider">Price (KSh)</h3>
          <button
            onClick={handlePriceApply}
            className="text-[10px] font-bold text-[#2D6A4F] hover:underline uppercase tracking-wider"
          >
            Apply
          </button>
        </div>

        {/* Dual range slider */}
        <div className="relative h-1 bg-gray-200 rounded-full mt-3 mb-6 mx-1">
          <div
            className="absolute h-full bg-[#2D6A4F] rounded-full"
            style={{
              left: `${(minPrice / 90000) * 100}%`,
              right: `${100 - (maxPrice / 90000) * 100}%`
            }}
          />
          <input
            type="range"
            min="0"
            max="90000"
            value={minPrice}
            onChange={(e) => {
              const val = Math.min(Number(e.target.value), maxPrice - 500);
              setMinPrice(val);
            }}
            className="absolute w-full h-1 appearance-none bg-transparent pointer-events-none cursor-pointer outline-none top-0 left-0 [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[#2D6A4F]"
          />
          <input
            type="range"
            min="0"
            max="90000"
            value={maxPrice}
            onChange={(e) => {
              const val = Math.max(Number(e.target.value), minPrice + 500);
              setMaxPrice(val);
            }}
            className="absolute w-full h-1 appearance-none bg-transparent pointer-events-none cursor-pointer outline-none top-0 left-0 [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[#2D6A4F]"
          />
        </div>

        {/* Price input text fields */}
        <div className="flex items-center gap-2">
          <input
            type="number"
            value={minPrice}
            onChange={(e) => setMinPrice(Number(e.target.value))}
            className="w-full border border-[#E8ECE9] rounded-none p-1.5 text-xs text-[#1A1A1A] text-center outline-none focus:border-[#2D6A4F]"
          />
          <span className="text-gray-400 text-xs">-</span>
          <input
            type="number"
            value={maxPrice}
            onChange={(e) => setMaxPrice(Number(e.target.value))}
            className="w-full border border-[#E8ECE9] rounded-none p-1.5 text-xs text-[#1A1A1A] text-center outline-none focus:border-[#2D6A4F]"
          />
        </div>
      </div>

      <hr className="border-gray-150" />

      {/* Stocking recommendation widget */}
      <div className="bg-[#FAF9F5] border border-[#F5A623]/25 rounded-none p-4 space-y-3">
        <div className="flex items-center gap-2">
          <PlusCircle className="h-4.5 w-4.5 text-[#F5A623]" />
          <h4 className="text-xs font-black text-[#1A1A1A]">Request stocking</h4>
        </div>
        <p className="text-[10px] text-[#6B7280] leading-relaxed">
          Can't find a product in our POS catalog? Recommend it and we'll check availability for you.
        </p>
        <form onSubmit={handleSendStockRequest} className="space-y-2">
          <input
            type="text"
            required
            placeholder="Product name (e.g. Drip Kit)"
            value={recommendName}
            onChange={(e) => setRecommendName(e.target.value)}
            className="w-full bg-white border border-[#E8ECE9] rounded-none p-2 text-[10px] outline-none focus:border-[#2D6A4F]"
          />
          <input
            type="text"
            placeholder="Brand / details (optional)"
            value={recommendBrand}
            onChange={(e) => setRecommendBrand(e.target.value)}
            className="w-full bg-white border border-[#E8ECE9] rounded-none p-2 text-[10px] outline-none focus:border-[#2D6A4F]"
          />
          <button
            type="submit"
            className="w-full bg-[#F5A623] hover:bg-[#E0951F] text-white text-[9px] font-extrabold py-2 rounded-none transition uppercase tracking-wider flex items-center justify-center gap-1.5"
          >
            <MessageSquare className="h-3 w-3" /> Request Stocking
          </button>
        </form>
      </div>

    </div>
  );

  return (
    <AppLayout>
      <div className="bg-[#FAFAF8] min-h-screen text-[#1A1A1A] font-sans pb-16 pt-6">
        <div className="max-w-[1300px] mx-auto px-4">
          
          {/* Breadcrumbs */}
          <div className="text-left text-xs text-[#6B7280] mb-5 flex items-center gap-1.5 font-medium">
            <Link to="/" className="hover:text-[#2D6A4F] transition">Home</Link>
            <span>&gt;</span>
            <span className="text-[#1A1A1A] font-semibold capitalize">
              {selectedPosCategory === "All" ? "Agrovet Store" : POS_CATEGORIES.find(c => c.id === selectedPosCategory)?.label}
            </span>
          </div>

          {/* Mobile Filters Trigger Bar */}
          <div className="lg:hidden flex items-center justify-between bg-white border border-[#E8ECE9] rounded-none p-2.5 mb-4 shadow-xs">
            <button
              onClick={() => setMobileFiltersOpen(true)}
              className="flex-1 flex items-center justify-center gap-2 text-xs font-extrabold text-[#1A1A1A] border-r border-gray-200 py-1.5 hover:text-[#2D6A4F] transition"
            >
              <SlidersHorizontal size={14} className="text-[#2D6A4F]" />
              <span>Filters</span>
            </button>
            <div className="flex-1 flex items-center justify-center gap-1 pl-2">
              <span className="text-[10px] text-[#6B7280] font-bold">Sort:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="text-xs font-extrabold text-[#1A1A1A] bg-transparent outline-none cursor-pointer"
              >
                <option value="Popularity">Popularity</option>
                <option value="Price Low to High">Low to High</option>
                <option value="Price High to Low">High to Low</option>
                <option value="Highest Rated">Highest Rated</option>
              </select>
            </div>
          </div>

          <div className="flex gap-6 items-start">
            
            {/* Desktop Left Filter Sidebar */}
            <aside className="hidden lg:block w-[260px] shrink-0 bg-white rounded-none border border-[#E8ECE9] p-5 text-left shadow-sm">
              {renderFilterContent()}
            </aside>

            {/* Right main products list */}
            <main className="flex-1 bg-white rounded-none border border-[#E8ECE9] p-5 sm:p-6 text-left shadow-sm">
              
              {/* Title & Count Header */}
              <div className="flex items-center justify-between border-b border-gray-100 pb-4 mb-4">
                <div className="flex items-baseline gap-2">
                  <h1 className="text-base sm:text-lg md:text-xl font-black text-[#1A1A1A] capitalize">
                    {selectedPosCategory === "All" ? "Fresh Agrovet Products" : POS_CATEGORIES.find(c => c.id === selectedPosCategory)?.label}
                  </h1>
                  <span className="text-[10px] sm:text-xs text-[#6B7280] font-bold">
                    ({filteredProducts.length} items found)
                  </span>
                </div>

                {/* Sort By Dropdown */}
                <div className="hidden lg:flex items-center gap-2 text-xs font-medium">
                  <span className="text-[#6B7280]">Sort by:</span>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="border border-[#E8ECE9] rounded-none px-2.5 py-1.5 text-[#1A1A1A] outline-none focus:border-[#2D6A4F] bg-white font-extrabold cursor-pointer"
                  >
                    <option value="Popularity">Popularity</option>
                    <option value="Price Low to High">Price Low to High</option>
                    <option value="Price High to Low">Price High to Low</option>
                    <option value="Highest Rated">Highest Rated</option>
                  </select>
                </div>
              </div>

              {/* Related results tags */}
              <div className="text-[11px] text-left mb-4 flex items-center flex-wrap gap-1.5 leading-relaxed">
                <span className="text-[#6B7280] font-bold">Related searches:</span>
                {RELATED_TAGS.map((tag, idx) => (
                  <button
                    key={tag}
                    onClick={() => handleTagClick(tag)}
                    className="text-[#2D6A4F] hover:underline font-extrabold"
                  >
                    {tag}{idx < RELATED_TAGS.length - 1 ? "," : ""}
                  </button>
                ))}
              </div>

              {/* Desktop Quick Filters row */}
              <div className="hidden lg:flex items-center gap-2 mb-6 flex-wrap">
                <button className="border border-[#E8ECE9] hover:border-[#2D6A4F] rounded-none px-4 py-1.5 text-xs font-extrabold text-[#1A1A1A] hover:text-[#2D6A4F] bg-white flex items-center gap-1">
                  <span>Brand</span>
                  <ChevronDown size={12} />
                </button>
                <button className="border border-[#E8ECE9] hover:border-[#2D6A4F] rounded-none px-4 py-1.5 text-xs font-extrabold text-[#1A1A1A] hover:text-[#2D6A4F] bg-white flex items-center gap-1">
                  <span>Price</span>
                  <ChevronDown size={12} />
                </button>
                {(selectedBrands.length > 0 || appliedMinPrice > 0 || appliedMaxPrice < 90000 || minSellerScore !== null) && (
                  <button
                    onClick={() => {
                      setSelectedBrands([]);
                      setMinPrice(0);
                      setMaxPrice(90000);
                      setAppliedMinPrice(0);
                      setAppliedMaxPrice(90000);
                      setMinSellerScore(null);
                      toast.success("Filters reset");
                    }}
                    className="text-xs text-red-500 hover:underline font-extrabold"
                  >
                    Clear Filters
                  </button>
                )}
              </div>

              {/* Product Grid */}
              {paginatedProducts.length === 0 ? (
                <div className="border border-dashed border-gray-200 rounded-none p-12 text-center my-6 bg-[#FAFAF8]">
                  <span className="text-2xl block mb-2">🔍</span>
                  <span className="text-xs font-bold text-[#1A1A1A]">No POS products found</span>
                  <p className="text-[10px] text-[#6B7280] mt-1">Try resetting filters or matching categories.</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4">
                  {paginatedProducts.map((p) => {
                    const isWishlisted = wishlist.has(p.id);
                    const hasDiscount = !!(p.originalPrice && p.originalPrice > p.price);
                    const discountPercentage = hasDiscount
                      ? Math.round(((p.originalPrice! - p.price) / p.originalPrice!) * 100)
                      : 0;

                    return (
                      <div
                        key={p.id}
                        onClick={() => navigate({ to: "/shop/$productId", params: { productId: String(p.id) } })}
                        className="group relative bg-[#143525] rounded-none border border-[#2D6A4F] hover:border-[#FAF9F5] hover:shadow-xl transition-all duration-300 flex flex-col w-full cursor-pointer h-full justify-between p-3 text-white"
                      >
                        {/* Image area */}
                        <div className="relative w-full h-[120px] sm:h-[160px] bg-[#0E251A] rounded-none overflow-hidden mb-3">
                          <img
                            src={p.image}
                            alt={p.name}
                            className="w-full h-full object-cover group-hover:scale-[1.03] transition duration-300"
                            onError={(e) => { e.currentTarget.src = '/placeholder-product.png'; }}
                          />

                          {/* Blue deal tags */}
                          {p.badge && (
                            <span className="absolute top-2 left-2 text-[8px] sm:text-[9px] font-black px-2 py-0.5 rounded-none text-white bg-[#3B82F6] uppercase tracking-wide">
                              {p.badge}
                            </span>
                          )}

                          {/* Heart wishlist button */}
                          <button
                            onClick={(e) => handleToggleWishlist(p.id, e)}
                            className="absolute bottom-2 right-2 bg-[#143525]/90 hover:bg-[#143525] p-1.5 rounded-none shadow-xs hover:scale-110 transition border border-[#2D6A4F]"
                          >
                            <Heart
                              size={12}
                              className={`text-white hover:text-red-500 ${
                                isWishlisted ? "fill-red-500 text-red-500" : ""
                              }`}
                            />
                          </button>
                        </div>

                        {/* Text fields & Price details */}
                        <div className="flex-1 flex flex-col justify-between text-left">
                          <div>
                            <span className="text-[9px] text-[#F5A623] font-extrabold uppercase tracking-wider block mb-0.5">
                              {p.brand}
                            </span>
                            <h3 className="text-xs text-white font-extrabold leading-snug line-clamp-2 min-h-[32px] group-hover:text-[#F5A623] transition">
                              {p.name}
                            </h3>
                          </div>

                          <div className="mt-2">
                            {/* Price */}
                            <div className="text-xs sm:text-sm font-black text-[#F5A623]">
                              KSh {p.price.toLocaleString()}
                            </div>

                            {/* Strikethrough & discount */}
                            {hasDiscount && (
                              <div className="flex items-center gap-1.5 mt-0.5">
                                <span className="text-[9px] sm:text-[10px] text-gray-300 line-through">
                                  KSh {p.originalPrice!.toLocaleString()}
                                </span>
                                <span className="text-[8px] sm:text-[9px] bg-red-900/40 text-red-300 px-1 py-0.2 rounded-none font-black border border-red-800">
                                  -{discountPercentage}%
                                </span>
                              </div>
                            )}

                            {/* Stars rating */}
                            <div className="flex items-center gap-1 mt-1">
                              <div className="flex">
                                {Array.from({ length: 5 }).map((_, sIdx) => (
                                  <Star
                                    key={sIdx}
                                    className={`h-2.5 w-2.5 ${
                                      sIdx < Math.floor(p.rating)
                                        ? "fill-[#F5A623] text-[#F5A623]"
                                        : "text-gray-500"
                                    }`}
                                  />
                                ))}
                              </div>
                              <span className="text-[8px] sm:text-[9px] text-gray-300 font-bold">
                                ({p.reviewsCount})
                              </span>
                            </div>
                          </div>

                          {/* Split Action Buttons */}
                          <div className="mt-3 grid grid-cols-2 gap-2">
                            <button
                              onClick={(e) => handleAddToCartClick(p, e)}
                              className="bg-[#F5A623] hover:bg-[#E0951F] text-white text-[9px] sm:text-[10px] font-extrabold py-2 rounded-none transition-colors flex items-center justify-center gap-1 uppercase tracking-wider shadow-xs border border-[#F5A623]"
                            >
                              <ShoppingCart size={11} />
                              <span>Add</span>
                            </button>
                            
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate({ to: "/shop/$productId", params: { productId: String(p.id) } });
                              }}
                              className="bg-transparent hover:bg-[#2D6A4F] text-white text-[9px] sm:text-[10px] font-extrabold py-2 rounded-none transition-colors flex items-center justify-center gap-1 uppercase tracking-wider border border-[#2D6A4F]"
                            >
                              <span>View</span>
                            </button>
                          </div>
                        </div>

                      </div>
                    );
                  })}
                </div>
              )}

              {/* Pagination controls */}
              {totalPages > 1 && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mt-8 border-t border-gray-100 pt-4">
                  <div className="text-[10px] sm:text-xs text-[#6B7280] font-bold">
                    Showing {startIndex + 1}–{Math.min(startIndex + itemsPerPage, filteredProducts.length)} of {filteredProducts.length} results
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => {
                        setCurrentPage((p) => Math.max(1, p - 1));
                        window.scrollTo({ top: 0, behavior: "smooth" });
                      }}
                      disabled={currentPage === 1}
                      className="w-7 h-7 rounded-lg border border-[#E8ECE9] flex items-center justify-center text-xs font-bold disabled:opacity-40 hover:bg-gray-50 bg-white transition"
                    >
                      <ChevronLeft size={12} />
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
                          className={`w-7 h-7 rounded-lg border text-[10px] sm:text-xs font-bold flex items-center justify-center transition-colors ${
                            currentPage === page
                              ? "bg-[#2D6A4F] border-[#2D6A4F] text-white"
                              : "border-[#E8ECE9] hover:bg-gray-50 text-[#1A1A1A] bg-white"
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
                      className="w-7 h-7 rounded-lg border border-[#E8ECE9] flex items-center justify-center text-xs font-bold disabled:opacity-40 hover:bg-gray-50 bg-white transition"
                    >
                      <ChevronRight size={12} />
                    </button>
                  </div>
                </div>
              )}

            </main>
          </div>

        </div>
      </div>

      {/* Mobile Drawer Filter Panel Overlay */}
      <AnimatePresence>
        {mobileFiltersOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileFiltersOpen(false)}
              className="absolute inset-0 bg-black/60"
            />
            {/* Panel */}
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 220 }}
              className="absolute inset-y-0 left-0 w-full max-w-[280px] bg-white p-5 shadow-2xl flex flex-col justify-between overflow-y-auto"
            >
              <div>
                <div className="flex items-center justify-between border-b border-gray-200 pb-3.5 mb-4">
                  <h3 className="text-sm font-bold text-[#1A1A1A] uppercase tracking-wider">Catalog Filters</h3>
                  <button
                    onClick={() => setMobileFiltersOpen(false)}
                    className="p-1 rounded-full text-gray-400 hover:text-gray-600 transition"
                  >
                    <X size={18} />
                  </button>
                </div>
                {renderFilterContent()}
              </div>

              <button
                onClick={() => setMobileFiltersOpen(false)}
                className="w-full bg-[#2D6A4F] hover:bg-[#1A5438] text-xs font-bold text-white uppercase py-3 rounded-lg transition mt-6 tracking-wide"
              >
                Apply & Close
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </AppLayout>
  );
}
