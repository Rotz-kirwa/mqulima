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
  SlidersHorizontal
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
      { title: "Mqulima Marketplace — Jumia-Style Shop" },
      {
        name: "description",
        content: "Shop fresh agricultural inputs, seeds, pesticides, and tools with premium marketplace filters.",
      },
    ],
  }),
  component: ShopPage,
});

const RELATED_TAGS = [
  "fresh greens",
  "clean fertilizers",
  "hybrid maize",
  "pest control",
  "drip kits",
  "animal feeds",
  "milking equipment",
  "soil catalysts"
];

function ShopPage() {
  const navigate = useNavigate();
  const searchParams = Route.useSearch();
  const { addToCart } = useCart();

  // Wishlist state loaded from localStorage
  const [wishlist, setWishlist] = useState<Set<string>>(new Set(["k1", "k6"]));
  useEffect(() => {
    try {
      const stored = localStorage.getItem("mqulima_wishlist");
      if (stored) setWishlist(new Set(JSON.parse(stored)));
    } catch (e) {
      console.error(e);
    }
  }, []);

  // Sync Search Query & Category from URL
  const [searchText, setSearchText] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");

  useEffect(() => {
    if (searchParams.q) {
      setSearchText(searchParams.q);
    } else {
      setSearchText("");
    }
    if (searchParams.category) {
      setSelectedCategory(searchParams.category);
    } else {
      setSelectedCategory("All");
    }
    setCurrentPage(1);
  }, [searchParams.q, searchParams.category]);

  // Sidebar Filter States
  const [brandSearch, setBrandSearch] = useState("");
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [minPrice, setMinPrice] = useState(0);
  const [maxPrice, setMaxPrice] = useState(25000);
  const [appliedMinPrice, setAppliedMinPrice] = useState(0);
  const [appliedMaxPrice, setAppliedMaxPrice] = useState(25000);
  const [minSellerScore, setMinSellerScore] = useState<number | null>(null);

  // Sorting Option
  const [sortBy, setSortBy] = useState("Popularity");

  // Mobile Filters Drawer State
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

  // Extract all unique brands from the catalog for the filter panel
  const allBrands = useMemo(() => {
    const brandsSet = new Set<string>();
    shopProducts.forEach((p) => {
      if (p.brand) brandsSet.add(p.brand);
    });
    return Array.from(brandsSet).sort();
  }, []);

  // Filtered brands based on Brand Search Input
  const filteredBrandChoices = useMemo(() => {
    return allBrands.filter((b) =>
      b.toLowerCase().includes(brandSearch.toLowerCase())
    );
  }, [allBrands, brandSearch]);

  // Main filter function
  const filteredProducts = useMemo(() => {
    return shopProducts
      .filter((p) => {
        // Category Filter
        if (selectedCategory !== "All") {
          if (p.category !== selectedCategory) return false;
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

        // Brands check filter
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
    selectedCategory,
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
  const handleCategorySelect = (category: string) => {
    setSelectedCategory(category);
    navigate({
      search: (prev) => ({
        ...prev,
        category: category === "All" ? undefined : category
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
    toast.success(`${p.name} added to cart!`);
  };

  const handleTagClick = (tag: string) => {
    setSearchText(tag);
    navigate({
      search: (prev) => ({
        ...prev,
        q: tag
      })
    });
  };

  // Reusable Filter Content (for both Sidebar and Mobile Drawer)
  const renderFilterContent = () => (
    <div className="space-y-6 text-left">
      {/* Category section */}
      <div>
        <h3 className="text-xs font-bold text-[#282828] uppercase tracking-wider mb-3">Category</h3>
        <div className="space-y-2 text-sm text-[#282828]">
          {shopCategories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => handleCategorySelect(cat.id)}
              className={`block hover:text-[#F68B1E] transition w-full text-left font-medium capitalize ${
                selectedCategory === cat.id ? "text-[#F68B1E] font-bold" : "text-[#75757A]"
              }`}
            >
              <span className="mr-2">{cat.icon}</span>
              <span>{cat.label}</span>
            </button>
          ))}
        </div>
      </div>

      <hr className="border-gray-200" />

      {/* Brand Section */}
      <div>
        <h3 className="text-xs font-bold text-[#282828] uppercase tracking-wider mb-3">Brand</h3>
        
        {/* Brand Search box */}
        <div className="relative mb-3 flex items-center border border-gray-300 rounded-md p-1.5 bg-[#F5F5F5] focus-within:border-[#F68B1E] focus-within:bg-white transition">
          <Search size={14} className="text-[#75757A] mr-2" />
          <input
            type="text"
            placeholder="Search brand..."
            value={brandSearch}
            onChange={(e) => setBrandSearch(e.target.value)}
            className="w-full bg-transparent border-0 outline-none text-xs text-[#282828] placeholder-gray-405"
          />
        </div>

        {/* Brands checklist */}
        <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1 text-xs scrollbar-thin">
          {filteredBrandChoices.length === 0 ? (
            <span className="text-[#75757A] block text-xs italic">No brands found</span>
          ) : (
            filteredBrandChoices.map((brand) => {
              const isChecked = selectedBrands.includes(brand);
              return (
                <label
                  key={brand}
                  className="flex items-center gap-2 cursor-pointer text-[#282828] font-medium hover:text-[#F68B1E] transition"
                >
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => handleBrandToggle(brand)}
                    className="w-3.5 h-3.5 rounded border-gray-300 accent-[#F68B1E]"
                  />
                  <span>{brand}</span>
                </label>
              );
            })
          )}
        </div>
      </div>

      <hr className="border-gray-200" />

      {/* Price filter (KSH) */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-bold text-[#282828] uppercase tracking-wider">Price (KSh)</h3>
          <button
            onClick={handlePriceApply}
            className="text-xs font-bold text-[#F68B1E] hover:underline"
          >
            Apply
          </button>
        </div>

        {/* Dual range slider */}
        <div className="relative h-1 bg-gray-200 rounded-full mt-3 mb-6 mx-1">
          <div
            className="absolute h-full bg-[#F68B1E] rounded-full"
            style={{
              left: `${(minPrice / 25000) * 100}%`,
              right: `${100 - (maxPrice / 25000) * 100}%`
            }}
          />
          <input
            type="range"
            min="0"
            max="25000"
            value={minPrice}
            onChange={(e) => {
              const val = Math.min(Number(e.target.value), maxPrice - 500);
              setMinPrice(val);
            }}
            className="absolute w-full h-1 appearance-none bg-transparent pointer-events-none cursor-pointer outline-none top-0 left-0 [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[#F68B1E]"
          />
          <input
            type="range"
            min="0"
            max="25000"
            value={maxPrice}
            onChange={(e) => {
              const val = Math.max(Number(e.target.value), minPrice + 500);
              setMaxPrice(val);
            }}
            className="absolute w-full h-1 appearance-none bg-transparent pointer-events-none cursor-pointer outline-none top-0 left-0 [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[#F68B1E]"
          />
        </div>

        {/* Price input text fields */}
        <div className="flex items-center gap-2">
          <input
            type="number"
            value={minPrice}
            onChange={(e) => setMinPrice(Number(e.target.value))}
            className="w-full border border-gray-300 rounded-md p-1.5 text-xs text-[#282828] text-center outline-none focus:border-[#F68B1E]"
          />
          <span className="text-gray-400 text-xs">-</span>
          <input
            type="number"
            value={maxPrice}
            onChange={(e) => setMaxPrice(Number(e.target.value))}
            className="w-full border border-gray-300 rounded-md p-1.5 text-xs text-[#282828] text-center outline-none focus:border-[#F68B1E]"
          />
        </div>
      </div>

      <hr className="border-gray-200" />

      {/* Seller Score */}
      <div>
        <h3 className="text-xs font-bold text-[#282828] uppercase tracking-wider mb-3">Seller Score</h3>
        <div className="space-y-3 text-xs">
          {[80, 60, 40, 20].map((score) => (
            <label
              key={score}
              className="flex items-center gap-2 cursor-pointer text-[#282828] font-medium hover:text-[#F68B1E]"
            >
              <input
                type="radio"
                name="seller_score"
                checked={minSellerScore === score}
                onChange={() => {
                  setMinSellerScore(score);
                  setCurrentPage(1);
                }}
                className="w-3.5 h-3.5 rounded-full border-gray-300 accent-[#F68B1E]"
              />
              <span>{score}% or more</span>
            </label>
          ))}
          {minSellerScore !== null && (
            <button
              onClick={() => {
                setMinSellerScore(null);
                setCurrentPage(1);
              }}
              className="text-[10px] font-bold text-red-500 hover:underline block mt-2"
            >
              Clear seller score filter
            </button>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <AppLayout>
      <div className="bg-[#F5F5F5] min-h-screen text-[#282828] font-sans pb-16 pt-4">
        <div className="max-w-[1300px] mx-auto px-3 sm:px-4">
          
          {/* Breadcrumbs */}
          <div className="text-left text-xs text-[#75757A] mb-3.5 flex items-center gap-1.5 font-medium">
            <Link to="/" className="hover:text-[#F68B1E] transition">Home</Link>
            <span>&gt;</span>
            <span className="text-[#282828] capitalize">
              {selectedCategory === "All" ? "Shop" : selectedCategory}
            </span>
          </div>

          {/* Mobile Filters Trigger Bar */}
          <div className="lg:hidden flex items-center justify-between bg-white border border-gray-200 rounded-md p-2 mb-4 shadow-sm">
            <button
              onClick={() => setMobileFiltersOpen(true)}
              className="flex-1 flex items-center justify-center gap-2 text-xs font-bold text-[#282828] border-r border-gray-200 py-1.5 hover:text-[#F68B1E] transition"
            >
              <SlidersHorizontal size={14} className="text-[#F68B1E]" />
              <span>Filters</span>
            </button>
            <div className="flex-1 flex items-center justify-center gap-1 pl-2">
              <span className="text-[10px] text-[#75757A] font-semibold">Sort:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="text-xs font-bold text-[#282828] bg-transparent outline-none cursor-pointer"
              >
                <option value="Popularity">Popularity</option>
                <option value="Price Low to High">Low to High</option>
                <option value="Price High to Low">High to Low</option>
                <option value="Highest Rated">Highest Rated</option>
              </select>
            </div>
          </div>

          <div className="flex gap-4 items-start">
            
            {/* Desktop Left Filter Sidebar */}
            <aside className="hidden lg:block w-[240px] shrink-0 bg-white rounded-md border border-gray-200 p-4 text-left shadow-sm">
              {renderFilterContent()}
            </aside>

            {/* Right main products list */}
            <main className="flex-1 bg-white rounded-md border border-gray-200 p-3 sm:p-5 text-left shadow-sm">
              
              {/* Title & Count Header */}
              <div className="flex items-center justify-between border-b border-gray-100 pb-3 mb-3">
                <div className="flex items-baseline gap-2">
                  <h1 className="text-base sm:text-lg md:text-xl font-bold text-[#282828] capitalize">
                    {selectedCategory === "All" ? "Fresh Products" : selectedCategory}
                  </h1>
                  <span className="text-[10px] sm:text-xs text-[#75757A] font-semibold">
                    ({filteredProducts.length} found)
                  </span>
                </div>

                {/* Sort By Dropdown (hidden on mobile, handled in the trigger bar) */}
                <div className="hidden lg:flex items-center gap-2 text-xs font-medium">
                  <span className="text-[#75757A]">Sort by:</span>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="border border-gray-200 rounded px-2.5 py-1 text-[#282828] outline-none focus:border-[#F68B1E] bg-white font-bold cursor-pointer"
                  >
                    <option value="Popularity">Popularity</option>
                    <option value="Price Low to High">Price Low to High</option>
                    <option value="Price High to Low">Price High to Low</option>
                    <option value="Highest Rated">Highest Rated</option>
                  </select>
                </div>
              </div>

              {/* Related results tags */}
              <div className="text-[11px] text-left mb-4 flex items-center flex-wrap gap-1 leading-relaxed">
                <span className="text-[#75757A] font-medium">Related:</span>
                {RELATED_TAGS.map((tag, idx) => (
                  <React.Fragment key={tag}>
                    {idx > 0 && <span className="text-gray-300">|</span>}
                    <button
                      onClick={() => handleTagClick(tag)}
                      className="text-[#F68B1E] hover:underline font-bold"
                    >
                      {tag}
                    </button>
                  </React.Fragment>
                ))}
              </div>

              {/* Desktop Quick Filters row */}
              <div className="hidden lg:flex items-center gap-2 mb-6 flex-wrap">
                <button className="border border-gray-300 hover:border-[#F68B1E] rounded-full px-3.5 py-1 text-xs font-semibold text-[#282828] hover:text-[#F68B1E] bg-white flex items-center gap-1">
                  <span>Brand</span>
                  <ChevronDown size={12} />
                </button>
                <button className="border border-gray-300 hover:border-[#F68B1E] rounded-full px-3.5 py-1 text-xs font-semibold text-[#282828] hover:text-[#F68B1E] bg-white flex items-center gap-1">
                  <span>Price</span>
                  <ChevronDown size={12} />
                </button>
                {(selectedBrands.length > 0 || appliedMinPrice > 0 || appliedMaxPrice < 25000 || minSellerScore !== null) && (
                  <button
                    onClick={() => {
                      setSelectedBrands([]);
                      setMinPrice(0);
                      setMaxPrice(25000);
                      setAppliedMinPrice(0);
                      setAppliedMaxPrice(25000);
                      setMinSellerScore(null);
                      toast.success("Filters reset");
                    }}
                    className="text-xs text-red-500 hover:underline font-bold"
                  >
                    Clear Filters
                  </button>
                )}
              </div>

              {/* Product Grid */}
              {paginatedProducts.length === 0 ? (
                <div className="border border-dashed border-gray-200 rounded-lg p-12 text-center my-6 bg-[#F5F5F5]">
                  <span className="text-2xl block mb-2">🔍</span>
                  <span className="text-xs font-bold text-[#282828]">No products found</span>
                  <p className="text-[10px] text-[#75757A] mt-1">Try broadening your search query or adjusting filters.</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-2 sm:gap-3">
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
                        className="group relative bg-white rounded-md border border-transparent hover:border-gray-200 hover:shadow-md transition-all duration-200 flex flex-col w-full cursor-pointer h-full justify-between p-1.5 sm:p-2"
                      >
                        {/* Image area */}
                        <div className="relative w-full h-[120px] sm:h-[160px] bg-gray-50 rounded overflow-hidden mb-2">
                          <img
                            src={p.image}
                            alt={p.name}
                            className="w-full h-full object-cover group-hover:scale-102 transition duration-200"
                            onError={(e) => { e.currentTarget.src = '/placeholder-product.png'; }}
                          />

                          {/* Blue anniversary tag */}
                          {p.badge && (
                            <span className="absolute top-1.5 left-1.5 text-[8px] sm:text-[9px] font-bold px-1.5 py-0.5 rounded-sm text-white bg-[#0055B3] uppercase tracking-wide">
                              Anniversary deal
                            </span>
                          )}

                          {/* Heart wishlist button */}
                          <button
                            onClick={(e) => handleToggleWishlist(p.id, e)}
                            className="absolute bottom-1.5 right-1.5 bg-white/90 hover:bg-white p-1.5 rounded-full shadow-sm hover:scale-105 transition"
                          >
                            <Heart
                              size={12}
                              className={`text-[#75757A] hover:text-[#F68B1E] ${
                                isWishlisted ? "fill-[#F68B1E] text-[#F68B1E]" : ""
                              }`}
                            />
                          </button>
                        </div>

                        {/* Text fields & Price details */}
                        <div className="flex-1 flex flex-col justify-between text-left">
                          <div>
                            <span className="text-[9px] text-[#75757A] font-bold uppercase tracking-wider block mb-0.5">
                              {p.brand}
                            </span>
                            <h3 className="text-[11px] sm:text-xs text-[#282828] font-medium leading-snug line-clamp-2 min-h-[30px] sm:min-h-[32px] group-hover:text-[#F68B1E] transition">
                              {p.name}
                            </h3>
                          </div>

                          <div className="mt-1.5">
                            {/* Price */}
                            <div className="text-xs sm:text-sm font-bold text-[#282828]">
                              KSh {p.price.toLocaleString()}
                            </div>

                            {/* Strikethrough & discount */}
                            {hasDiscount && (
                              <div className="flex items-center gap-1 mt-0.5">
                                <span className="text-[9px] sm:text-[10px] text-[#75757A] line-through">
                                  KSh {p.originalPrice!.toLocaleString()}
                                </span>
                                <span className="text-[8px] sm:text-[9px] bg-[#FFEADA] text-[#F68B1E] px-1 py-0.2 rounded font-bold">
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
                                        ? "fill-[#F68B1E] text-[#F68B1E]"
                                        : "text-gray-200"
                                    }`}
                                  />
                                ))}
                              </div>
                              <span className="text-[8px] sm:text-[9px] text-[#75757A] font-bold">
                                ({p.reviewsCount})
                              </span>
                            </div>
                          </div>

                          {/* Add To Cart */}
                          <div className="mt-2.5">
                            <button
                              onClick={(e) => handleAddToCartClick(p, e)}
                              className="w-full bg-[#F68B1E] hover:bg-[#E07A5F] text-white text-[9px] sm:text-[10px] font-bold py-1.5 rounded transition-colors flex items-center justify-center gap-1 uppercase tracking-wider"
                            >
                              <ShoppingCart size={10} />
                              <span>Add To Cart</span>
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
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mt-8 border-t border-gray-150 pt-4">
                  <div className="text-[10px] sm:text-xs text-[#75757A] font-semibold">
                    Showing {startIndex + 1}–{Math.min(startIndex + itemsPerPage, filteredProducts.length)} of {filteredProducts.length} results
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => {
                        setCurrentPage((p) => Math.max(1, p - 1));
                        window.scrollTo({ top: 0, behavior: "smooth" });
                      }}
                      disabled={currentPage === 1}
                      className="w-7 h-7 rounded border border-gray-300 flex items-center justify-center text-xs font-bold disabled:opacity-40 hover:bg-gray-50 bg-white transition"
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
                          className={`w-7 h-7 rounded border text-[10px] sm:text-xs font-bold flex items-center justify-center transition-colors ${
                            currentPage === page
                              ? "bg-[#F68B1E] border-[#F68B1E] text-white"
                              : "border-gray-300 hover:bg-gray-50 text-[#282828] bg-white"
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
                      className="w-7 h-7 rounded border border-gray-300 flex items-center justify-center text-xs font-bold disabled:opacity-40 hover:bg-gray-50 bg-white transition"
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
                  <h3 className="text-sm font-bold text-[#282828] uppercase tracking-wider">Filters</h3>
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
                className="w-full bg-[#F68B1E] hover:bg-[#E07A5F] text-xs font-bold text-white uppercase py-3 rounded-md transition mt-6 tracking-wide"
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
