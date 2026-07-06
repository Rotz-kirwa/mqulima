import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import React, { useState, useMemo, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ChevronRight, 
  Star, 
  Heart, 
  ShoppingCart, 
  ShieldCheck, 
  MapPin, 
  ArrowLeft,
  FileText,
  MessageSquare,
  Award,
  X,
  User,
  ThumbsUp,
  Package,
  Sparkles,
  Layers,
  ChevronDown,
  Info,
  Calendar,
  Share2,
  Maximize2,
  ZoomIn,
  Minimize2,
  HelpCircle,
  TrendingUp,
  Flame,
  Award as BestSellerIcon,
  CheckCircle,
  Truck,
  Building2,
  ChevronUp,
  Copy
} from "lucide-react";
import { toast } from "sonner";
import { AppLayout } from "@/components/mqulima/AppLayout";
import { type ShopProduct } from "@/lib/shop-data";
import { useCart } from "@/lib/cart-context";
import { useQuery } from "@tanstack/react-query";
import { getProductBySlug, getProducts } from "@/lib/api/products.server";

export const Route = createFileRoute("/shop/product/$slug")({
  head: () => {
    return {
      meta: [
        { title: "Product Details · Mqulima Hub" },
        { name: "description", content: "Explore agricultural inputs on Mqulima." }
      ]
    };
  },
  component: ProductDetailPage,
});

type Review = {
  id: string;
  name: string;
  rating: number;
  text: string;
  date: string;
  helpfulCount: number;
  verified: boolean;
};

function ProductDetailPage() {
  const { slug } = Route.useParams();
  const navigate = useNavigate();
  const { addToCart, buyNow } = useCart();
  
  // Fetch details from backend API
  const { data, isLoading, error } = useQuery({
    queryKey: ["productDetail", slug],
    queryFn: () => getProductBySlug({ data: slug })
  });

  const product = useMemo(() => {
    return data?.product;
  }, [data]);

  const { data: allProductsData } = useQuery({
    queryKey: ["products"],
    queryFn: () => getProducts({ data: { limit: 100 } })
  });

  const allProductsList = useMemo(() => {
    return allProductsData?.products || [];
  }, [allProductsData]);

  const [quantity, setQuantity] = useState(1);
  const [wishlist, setWishlist] = useState<Set<string>>(new Set());
  const [compareList, setCompareList] = useState<ShopProduct[]>([]);
  const [shareOpen, setShareOpen] = useState(false);

  // Gallery interactive states
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [isZoomed, setIsZoomed] = useState(false);
  const [zoomPos, setZoomPos] = useState({ x: 0, y: 0 });
  const [lightboxOpen, setLightboxOpen] = useState(false);

  // Description tab list state
  const [activeTab, setActiveTab] = useState<"overview" | "specs" | "usage" | "faq">("overview");

  // Selected size variation
  const [selectedSize, setSelectedSize] = useState<string | null>(null);

  // Set default size when product loads
  useEffect(() => {
    if (product && product.sizes && product.sizes.length > 0) {
      setSelectedSize(product.sizes[0].name);
    } else {
      setSelectedSize(null);
    }
  }, [product]);

  // Scroll to top and reset states when product changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
    setQuantity(1);
    setActiveImageIndex(0);
  }, [slug]);

  // Load wishlist & compare from localStorage
  useEffect(() => {
    try {
      const storedWish = localStorage.getItem("mqulima_wishlist");
      if (storedWish) setWishlist(new Set(JSON.parse(storedWish)));

      const storedCompare = localStorage.getItem("mqulima_compare");
      if (storedCompare) setCompareList(JSON.parse(storedCompare));
    } catch (e) {
      console.error(e);
    }
  }, []);

  // Compute active price/unit based on selected size variation
  const { activePrice, activeOriginalPrice, activeUnit } = useMemo(() => {
    if (!product) return { activePrice: 0, activeOriginalPrice: null, activeUnit: "" };
    if (selectedSize && product.sizes) {
      const opt = product.sizes.find(s => s.name === selectedSize);
      if (opt) {
        return {
          activePrice: opt.price,
          activeOriginalPrice: opt.originalPrice || null,
          activeUnit: `/${opt.name}`
        };
      }
    }
    return {
      activePrice: product.price,
      activeOriginalPrice: product.originalPrice || null,
      activeUnit: product.unit || "/unit"
    };
  }, [product, selectedSize]);

  // Discount percentage & savings calculation
  const { discountPercentage, savingsAmount } = useMemo(() => {
    if (!activeOriginalPrice || activeOriginalPrice <= activePrice) {
      return { discountPercentage: 0, savingsAmount: 0 };
    }
    const diff = activeOriginalPrice - activePrice;
    const pct = Math.round((diff / activeOriginalPrice) * 100);
    return { discountPercentage: pct, savingsAmount: diff };
  }, [activePrice, activeOriginalPrice]);

  // Generate dynamic, high-quality images based on category or default to main
  const productImages = useMemo(() => {
    if (!product) return [];

    // Use multiple image urls if populated
    if (product.imageUrls && product.imageUrls.length > 0) {
      return product.imageUrls;
    }
    
    // Default fallback image list
    const mainImg = product.image || "https://images.unsplash.com/photo-1592982537447-7440770cbfc9?w=800";
    
    // Custom images for visual delight depending on category
    let secondaryImages = [
      "https://images.unsplash.com/photo-1595974482597-4b8da8879bc5?w=800", // Soil / planting
      "https://images.unsplash.com/photo-1563514220-ea97928b4988?w=800", // Agronomy detail
      "https://images.unsplash.com/photo-1628352081506-83c43123ed6d?w=800"  // Warehouse stack
    ];

    if (product.category?.toLowerCase().includes("fertilizer")) {
      secondaryImages = [
        "https://images.unsplash.com/photo-1574943320219-553dd213f725?w=800", // crop harvesting
        "https://images.unsplash.com/photo-1599889958507-aa97de339943?w=800", // crop closeup
        "https://images.unsplash.com/photo-1605001011156-cbf0b0f67a51?w=800"  // green fields
      ];
    } else if (product.category?.toLowerCase().includes("seed")) {
      secondaryImages = [
        "https://images.unsplash.com/photo-1530595467537-0b5996c41f2d?w=800", // germinating seed
        "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=800", // garden bed
        "https://images.unsplash.com/photo-1523348837708-15d4a09cfac2?w=800"  // farmer holding soil
      ];
    } else if (product.category?.toLowerCase().includes("protect") || product.category?.toLowerCase().includes("pest")) {
      secondaryImages = [
        "https://images.unsplash.com/photo-1592982537447-7440770cbfc9?w=800", // crop protection spraying
        "https://images.unsplash.com/photo-1563514220-ea97928b4988?w=800", // green leaf inspect
        "https://images.unsplash.com/photo-1628352081506-83c43123ed6d?w=800"  // verified packaging
      ];
    }

    return [mainImg, ...secondaryImages];
  }, [product]);

  // ══════════════════════════════════════════
  // REVIEWS & RATING STATE
  // ══════════════════════════════════════════
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewSort, setReviewSort] = useState<"newest" | "highest" | "lowest" | "helpful">("helpful");

  useEffect(() => {
    if (!product) return;
    try {
      const stored = localStorage.getItem(`mqulima_reviews_${product.id}`);
      if (stored) {
        setReviews(JSON.parse(stored));
      } else {
        const defaults: Review[] = [
          {
            id: "r1",
            name: "Timothy Kiprono",
            rating: 5,
            text: `Incredible performance. Used this on my maize crop in Eldoret and noticed healthy dark green growth in just 10 days. The packaging was clean and moisture-proof.`,
            date: "June 28, 2026",
            helpfulCount: 24,
            verified: true
          },
          {
            id: "r2",
            name: "Jane Wambui",
            rating: 4,
            text: `High quality standard product. Delivery took about 2 days to Nakuru, which was reasonable. Yield increased significantly compared to the conventional brand.`,
            date: "June 15, 2026",
            helpfulCount: 15,
            verified: true
          },
          {
            id: "r3",
            name: "Patrick Musembi",
            rating: 5,
            text: `Outstanding brand reputation. Highly soluble and easy to apply. I will definitely order more for the next planting season.`,
            date: "May 20, 2026",
            helpfulCount: 8,
            verified: true
          }
        ];
        setReviews(defaults);
        localStorage.setItem(`mqulima_reviews_${product.id}`, JSON.stringify(defaults));
      }
    } catch (e) {
      console.error(e);
    }
  }, [product]);

  // Sort reviews logic
  const sortedReviews = useMemo(() => {
    const items = [...reviews];
    if (reviewSort === "newest") {
      return items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }
    if (reviewSort === "highest") {
      return items.sort((a, b) => b.rating - a.rating);
    }
    if (reviewSort === "lowest") {
      return items.sort((a, b) => a.rating - b.rating);
    }
    return items.sort((a, b) => b.helpfulCount - a.helpfulCount);
  }, [reviews, reviewSort]);

  // Handle wishlist
  const handleToggleWishlist = () => {
    if (!product) return;
    const newWish = new Set(wishlist);
    if (newWish.has(product.id)) {
      newWish.delete(product.id);
      toast.info("Removed from your Wishlist");
    } else {
      newWish.add(product.id);
      toast.success("Added to your Wishlist!");
    }
    setWishlist(newWish);
    localStorage.setItem("mqulima_wishlist", JSON.stringify(Array.from(newWish)));
  };

  // Handle compare
  const handleToggleCompare = () => {
    if (!product) return;
    let list = [...compareList];
    const exists = list.some((item) => item.id === product.id);
    if (exists) {
      list = list.filter((item) => item.id !== product.id);
      toast.info("Removed from Compare List");
    } else {
      if (list.length >= 4) {
        toast.warning("You can compare up to 4 products at a time.");
        return;
      }
      list.push(product);
      toast.success("Added to Compare List!");
    }
    setCompareList(list);
    localStorage.setItem("mqulima_compare", JSON.stringify(list));
  };

  // Magnifier Zoom calculations
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - left) / width) * 100;
    const y = ((e.clientY - top) / height) * 100;
    setZoomPos({ x, y });
  };

  // Copy link to clipboard
  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success("Product link copied to clipboard!");
    setShareOpen(false);
  };

  // Related products filters
  const relatedProducts = useMemo(() => {
    if (!product) return [];
    return allProductsList
      .filter((p) => p.id !== product.id && p.category === product.category)
      .slice(0, 6);
  }, [product, allProductsList]);

  const recommendedProducts = useMemo(() => {
    if (!product) return [];
    return allProductsList
      .filter((p) => p.id !== product.id && p.rating >= 4.7)
      .slice(0, 6);
  }, [product, allProductsList]);

  // Frequently bought together bundle item
  const bundleItem = useMemo(() => {
    if (!product) return null;
    return allProductsList.find((p) => p.id !== product.id && p.category === product.category) || null;
  }, [product, allProductsList]);

  const bundleChecked = useRef(true);
  const [isBundleApplied, setIsBundleApplied] = useState(true);

  // Bundle pricing
  const { bundleTotal, bundleSavings } = useMemo(() => {
    if (!product || !bundleItem) return { bundleTotal: 0, bundleSavings: 0 };
    const originalSum = activePrice + bundleItem.price;
    const bundleDiscountSum = Math.round(originalSum * 0.9); // 10% off
    return { bundleTotal: bundleDiscountSum, bundleSavings: originalSum - bundleDiscountSum };
  }, [activePrice, bundleItem]);

  const handleBuyBundle = () => {
    if (!product || !bundleItem) return;
    addToCart(bundleItem, 1);
    buyNow(product, 1, selectedSize || undefined);
  };

  // Review breakdown math
  const reviewBreakdown = useMemo(() => {
    const total = reviews.length || 1;
    const counts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    reviews.forEach((r) => {
      const ratingKey = Math.round(r.rating) as 5 | 4 | 3 | 2 | 1;
      if (counts[ratingKey] !== undefined) counts[ratingKey]++;
    });
    return Object.entries(counts).map(([stars, val]) => ({
      stars: Number(stars),
      percentage: Math.round((val / total) * 100),
      count: val
    })).reverse();
  }, [reviews]);

  // Helpful reviews handler
  const handleHelpfulVote = (reviewId: string) => {
    const updated = reviews.map((r) => {
      if (r.id === reviewId) {
        return { ...r, helpfulCount: r.helpfulCount + 1 };
      }
      return r;
    });
    setReviews(updated);
    if (product) {
      localStorage.setItem(`mqulima_reviews_${product.id}`, JSON.stringify(updated));
    }
    toast.success("Voted helpful!");
  };

  // Scroll visibility check for sticky panel
  const [showStickyBar, setShowStickyBar] = useState(false);
  const mainBuyPanelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      if (mainBuyPanelRef.current) {
        const rect = mainBuyPanelRef.current.getBoundingClientRect();
        // Show sticky bar once the main buy button scrolls out of view
        setShowStickyBar(rect.bottom < 0);
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  if (isLoading) {
    return (
      <AppLayout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-left">
          <div className="animate-pulse space-y-8">
            <div className="h-6 w-1/4 bg-gray-200 rounded-lg" />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="aspect-square bg-gray-200 rounded-2xl" />
              <div className="space-y-6">
                <div className="h-8 w-3/4 bg-gray-200 rounded-lg" />
                <div className="h-6 w-1/2 bg-gray-200 rounded-lg" />
                <div className="h-20 bg-gray-200 rounded-2xl" />
                <div className="h-12 w-1/3 bg-gray-200 rounded-lg" />
              </div>
            </div>
          </div>
        </div>
      </AppLayout>
    );
  }

  if (error || !product) {
    return (
      <AppLayout>
        <div className="max-w-md mx-auto py-24 text-center px-4 font-sans">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-50 text-red-500 mb-4 border border-red-100">
            <X size={24} />
          </div>
          <h1 className="text-xl font-black text-gray-900">Product Not Found</h1>
          <p className="text-xs text-gray-500 mt-2">
            The agricultural input code/slug you requested is invalid or unavailable in our active database.
          </p>
          <Link
            to="/shop"
            className="mt-6 inline-flex items-center gap-2 bg-[#2D6A4F] text-white text-xs font-black uppercase tracking-wider px-5 py-2.5 rounded-xl hover:bg-[#1A5438] transition"
          >
            <ArrowLeft size={14} /> Back to Catalog
          </Link>
        </div>
      </AppLayout>
    );
  }

  const isWishlisted = wishlist.has(product.id);
  const isComparing = compareList.some((item) => item.id === product.id);

  return (
    <AppLayout>
      <div className="bg-[#FAF9F6] min-h-screen text-[#1C1917] font-sans pb-16">
        
        {/* Breadcrumb Header */}
        <div className="bg-white border-b border-stone-200/80">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between text-xs text-stone-500 font-bold">
            <div className="flex items-center gap-1.5 flex-wrap">
              <Link to="/shop" className="hover:text-[#2D6A4F] transition">Shop</Link>
              <ChevronRight size={12} className="text-stone-300" />
              <Link to="/shop" search={{ category: product.category }} className="hover:text-[#2D6A4F] transition">
                {product.category}
              </Link>
              <ChevronRight size={12} className="text-stone-300" />
              <span className="text-stone-800 line-clamp-1">{product.name}</span>
            </div>
            <Link to="/shop" className="inline-flex items-center gap-1 hover:text-[#2D6A4F] transition text-stone-600">
              <ArrowLeft size={12} /> Back to Shop
            </Link>
          </div>
        </div>

        {/* Product Details Section */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* LEFT COLUMN: Image Gallery */}
            <div className="lg:col-span-6 space-y-4">
              <div 
                ref={mainBuyPanelRef}
                className="relative bg-white border border-stone-200/80 rounded-2xl p-4 overflow-hidden aspect-square flex items-center justify-center group shadow-sm cursor-zoom-in"
                onMouseMove={handleMouseMove}
                onMouseEnter={() => setIsZoomed(true)}
                onMouseLeave={() => setIsZoomed(false)}
                onClick={() => setLightboxOpen(true)}
              >
                <img
                  src={productImages[activeImageIndex]}
                  alt={product.name}
                  className="w-full h-full object-contain rounded-xl max-h-[460px] transition-transform duration-200"
                  loading="lazy"
                />

                {/* Magnifier lens preview */}
                {isZoomed && (
                  <div
                    className="absolute inset-0 hidden md:block pointer-events-none z-10 rounded-2xl bg-white"
                    style={{
                      backgroundImage: `url(${productImages[activeImageIndex]})`,
                      backgroundPosition: `${zoomPos.x}% ${zoomPos.y}%`,
                      backgroundSize: "200%",
                      backgroundRepeat: "no-repeat"
                    }}
                  />
                )}

                {/* Magnifying Icon Badge */}
                <span className="absolute bottom-3 right-3 bg-stone-900/80 backdrop-blur-md text-white p-2 rounded-full shadow-lg group-hover:scale-105 transition duration-200">
                  <ZoomIn size={15} />
                </span>

                {/* Primary Smart badges overlay */}
                <div className="absolute top-4 left-4 flex flex-col gap-1.5 z-1">
                  {product.organic && (
                    <span className="bg-emerald-600 text-white text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md flex items-center gap-1 shadow-sm">
                      <Sparkles size={10} className="fill-white" /> Organic
                    </span>
                  )}
                  {product.badge && (
                    <span className="bg-stone-900 text-white text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md shadow-sm">
                      {product.badge}
                    </span>
                  )}
                </div>
              </div>

              {/* Thumbnails list */}
              <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin">
                {productImages.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveImageIndex(idx)}
                    className={`h-16 w-16 bg-white border rounded-xl overflow-hidden p-1 shrink-0 transition-all duration-200 ${
                      activeImageIndex === idx
                        ? "border-[#2D6A4F] ring-2 ring-[#2D6A4F]/20 scale-102"
                        : "border-stone-200 hover:border-stone-400"
                    }`}
                  >
                    <img src={img} className="h-full w-full object-contain rounded-lg" alt="product thumbnail" />
                  </button>
                ))}
              </div>
            </div>

            {/* RIGHT COLUMN: Buying Desk */}
            <div className="lg:col-span-6 bg-white border border-stone-200/80 rounded-2xl p-6 md:p-8 shadow-sm text-left font-sans">
              <div className="space-y-4">
                
                {/* Brand & badges header */}
                <div className="flex items-center justify-between gap-4 flex-wrap">
                  <span className="text-xs text-[#2D6A4F] font-extrabold uppercase tracking-widest">
                    {product.brand}
                  </span>
                  
                  <div className="flex items-center gap-1.5">
                    {product.verifiedSeller && (
                      <span className="inline-flex items-center gap-1 text-[9px] bg-emerald-50 text-[#2D6A4F] px-2 py-0.5 rounded-md font-black border border-emerald-100">
                        <CheckCircle size={10} className="fill-[#2D6A4F] text-white" /> Verified Agent
                      </span>
                    )}
                    <span className="text-[9px] bg-stone-100 text-stone-600 px-2 py-0.5 rounded-md font-extrabold">
                      SKU: MQ-{product.id}-{(product.category || "GEN").slice(0,3).toUpperCase()}
                    </span>
                  </div>
                </div>

                {/* Product Name */}
                <h1 className="text-xl sm:text-2xl font-black text-stone-900 leading-snug tracking-tight">
                  {product.name}
                </h1>

                {/* Rating score summary */}
                <div className="flex items-center gap-2.5 flex-wrap text-stone-500 text-xs font-bold border-y border-stone-100 py-3">
                  <div className="flex items-center text-amber-400 gap-0.5">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={`h-4 w-4 ${
                          i < Math.floor(product.rating)
                            ? "fill-amber-400 text-amber-400"
                            : "text-stone-200"
                        }`}
                      />
                    ))}
                    <span className="text-stone-800 font-extrabold ml-1">{product.rating}</span>
                  </div>
                  <span className="text-stone-300">|</span>
                  <span className="text-stone-600 flex items-center gap-1">
                    <Flame size={13} className="text-red-500 fill-red-500" />
                    <strong>2.4k+</strong> Sold
                  </span>
                </div>

                {/* Price block */}
                <div className="space-y-1">
                  <div className="flex items-baseline gap-2.5">
                    <span className="text-3xl font-black text-[#2D6A4F] tracking-tight">
                      KSh {activePrice.toLocaleString()}
                    </span>
                    <span className="text-xs text-stone-400 font-bold">per {activeUnit}</span>
                    {activeOriginalPrice && (
                      <span className="text-base text-stone-400 line-through font-medium">
                        KSh {activeOriginalPrice.toLocaleString()}
                      </span>
                    )}
                  </div>
                  
                  {discountPercentage > 0 && (
                    <div className="flex items-center gap-2 text-xs font-bold">
                      <span className="bg-red-50 text-red-600 border border-red-100 px-2 py-0.5 rounded-md text-[10px]">
                        Save {discountPercentage}%
                      </span>
                      <span className="text-stone-500">
                        You save <strong className="text-stone-800">KSh {savingsAmount.toLocaleString()}</strong>
                      </span>
                    </div>
                  )}
                </div>

                {/* Stock */}
                <div className="bg-stone-50 border border-stone-200/60 rounded-xl p-3.5 text-xs font-sans">
                  <div>
                    <span className="text-stone-400 block font-bold text-[10px] uppercase">Availability</span>
                    <span className={`font-black flex items-center gap-1.5 mt-0.5 ${
                      product.stock > 10 
                        ? "text-emerald-600" 
                        : (product.stock > 0 ? "text-amber-500" : "text-red-500")
                    }`}>
                      <span className={`h-2 w-2 rounded-full ${
                        product.stock > 10 
                          ? "bg-emerald-600" 
                          : (product.stock > 0 ? "bg-amber-500" : "bg-red-500")
                      }`} />
                      {product.stock > 10 ? "In Stock" : (product.stock > 0 ? `Low Stock (${product.stock} left)` : "Out of Stock")}
                    </span>
                  </div>
                </div>

                {/* Size / variation selection */}
                {product.sizes && product.sizes.length > 0 && (
                  <div className="space-y-2">
                    <span className="text-xs text-stone-500 font-bold uppercase tracking-wider">Select Bag Size / Package Variation:</span>
                    <div className="flex gap-2.5 flex-wrap">
                      {product.sizes.map((s) => (
                        <button
                          key={s.name}
                          onClick={() => setSelectedSize(s.name)}
                          className={`px-4 py-2 border rounded-xl text-xs font-black transition-all ${
                            selectedSize === s.name
                              ? "border-[#2D6A4F] bg-emerald-50 text-[#2D6A4F] ring-2 ring-[#2D6A4F]/10"
                              : "border-stone-200 bg-white hover:border-stone-400 text-stone-700"
                          }`}
                        >
                          {s.name} &middot; KSh {s.price.toLocaleString()}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Description Excerpt */}
                <p className="text-xs text-stone-500 leading-relaxed font-normal pt-1.5">
                  {product.briefDescription || ""}
                </p>

                {/* Quantity & core CTAs */}
                <div className="space-y-4 pt-4 border-t border-stone-100">
                  <div className="flex flex-wrap items-center gap-3">
                    
                    {/* Quantity selectors */}
                    <div className="flex items-center border border-stone-200 rounded-xl bg-stone-50 h-12 px-3">
                      <button
                        onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                        className="px-2 font-bold text-stone-400 hover:text-stone-800 transition text-lg"
                      >
                        -
                      </button>
                      <span className="px-4 text-xs font-black text-stone-800 min-w-[20px] text-center">{quantity}</span>
                      <button
                        onClick={() => setQuantity((q) => q + 1)}
                        className="px-2 font-bold text-stone-400 hover:text-stone-800 transition text-lg"
                      >
                        +
                      </button>
                    </div>

                    {/* Add to Cart */}
                    <button
                      onClick={() => {
                        addToCart(product, quantity, selectedSize || undefined);
                        toast.success(`Added ${quantity} units of ${product.name} to cart!`);
                      }}
                      className="flex-1 min-w-[130px] flex items-center justify-center gap-2 rounded-xl border border-[#2D6A4F] bg-white h-12 text-xs font-extrabold text-[#2D6A4F] transition hover:bg-[#2D6A4F] hover:text-white uppercase tracking-wider cursor-pointer"
                    >
                      <ShoppingCart size={15} /> Add to Cart
                    </button>

                    {/* Buy Now */}
                    <button
                      onClick={() => {
                        buyNow(product, quantity, selectedSize || undefined);
                      }}
                      className="flex-1 min-w-[130px] flex items-center justify-center gap-1.5 rounded-xl bg-[#2D6A4F] h-12 text-xs font-extrabold text-white hover:bg-[#1A5438] transition uppercase tracking-wider shadow-sm cursor-pointer"
                    >
                      Buy Now
                    </button>
                  </div>

                  {/* WhatsApp checkout & Invoice */}
                  <div className="grid grid-cols-2 gap-3">
                    <a
                      href={`https://wa.me/254700000000?text=Hi%2C%20I%20want%20to%20buy%20${quantity}%20units%20of%20${product.name}%20from%20Mqulima%20Hub.`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 h-11 bg-[#25D366] hover:bg-[#20BA56] text-white text-xs font-bold rounded-xl transition cursor-pointer"
                    >
                      <MessageSquare size={14} /> Buy via WhatsApp
                    </a>
                    
                    <button
                      onClick={handleToggleWishlist}
                      className="flex items-center justify-center gap-2 h-11 bg-white border border-stone-200 hover:bg-stone-50 text-stone-700 text-xs font-bold rounded-xl transition cursor-pointer"
                    >
                      <Heart size={14} className={isWishlisted ? "fill-red-500 text-red-500" : ""} /> 
                      {isWishlisted ? "In Wishlist" : "Add to Wishlist"}
                    </button>
                  </div>

                  {/* Share & Compare toggles */}
                  <div className="flex items-center justify-between text-xs text-stone-500 font-bold pt-2">
                    <button
                      onClick={handleToggleCompare}
                      className="inline-flex items-center gap-1.5 hover:text-[#2D6A4F] transition"
                    >
                      <Maximize2 size={13} /> {isComparing ? "Remove Compare" : "Compare Product"}
                    </button>
                    
                    <div className="relative">
                      <button
                        onClick={() => setShareOpen(!shareOpen)}
                        className="inline-flex items-center gap-1.5 hover:text-[#2D6A4F] transition"
                      >
                        <Share2 size={13} /> Share Product
                      </button>
                      {shareOpen && (
                        <div className="absolute right-0 bottom-full mb-2 bg-white border border-stone-200 rounded-xl p-3 shadow-lg z-20 min-w-[200px] text-left">
                          <p className="text-[10px] text-stone-400 uppercase font-black tracking-wider mb-2">Share via:</p>
                          <div className="space-y-1.5">
                            <button onClick={handleCopyLink} className="w-full text-left text-xs font-bold text-stone-700 hover:text-[#2D6A4F] flex items-center gap-2 py-1">
                              <Copy size={12} /> Copy Link URL
                            </button>
                            <a href={`https://wa.me/?text=${encodeURIComponent(window.location.href)}`} target="_blank" rel="noopener noreferrer" className="w-full text-left text-xs font-bold text-[#25D366] hover:opacity-80 flex items-center gap-2 py-1">
                              <MessageSquare size={12} /> WhatsApp
                            </a>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                </div>

              </div>
            </div>

          </div>


          {/* Delivery estimate & County Availability Section */}
          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6 bg-white border border-stone-200/80 rounded-2xl p-6 text-left shadow-sm font-sans">
            
            <div className="flex gap-4 items-start">
              <div className="p-3 bg-emerald-50 text-[#2D6A4F] rounded-xl shrink-0">
                <Truck size={20} />
              </div>
              <div className="space-y-1">
                <h4 className="text-xs font-black text-stone-900 uppercase">Express Delivery</h4>
                <p className="text-xs text-stone-500 font-bold leading-normal">
                  Delivered by tomorrow if ordered in the next 3 hours. Standard shipping cost is <strong className="text-stone-850">KSh 250</strong>.
                </p>
                <span className="text-[10px] bg-emerald-100 text-[#2D6A4F] font-black px-1.5 py-0.5 rounded">
                  Free over KSh 5,000
                </span>
              </div>
            </div>

            <div className="flex gap-4 items-start">
              <div className="p-3 bg-emerald-50 text-[#2D6A4F] rounded-xl shrink-0">
                <MapPin size={20} />
              </div>
              <div className="space-y-1">
                <h4 className="text-xs font-black text-stone-900 uppercase">County Coverage</h4>
                <p className="text-xs text-stone-500 font-bold leading-normal">
                  Full stock availability across all 47 counties.
                </p>
              </div>
            </div>

            <div className="flex gap-4 items-start">
              <div className="p-3 bg-emerald-50 text-[#2D6A4F] rounded-xl shrink-0">
                <Building2 size={20} />
              </div>
              <div className="space-y-1">
                <h4 className="text-xs font-black text-stone-900 uppercase">Depot Pickup</h4>
                <p className="text-xs text-stone-500 font-bold leading-normal">
                  Pickup free of charge at any Mqulima regional partner warehouse/depot.
                </p>
              </div>
            </div>

          </div>

          {/* Description Section */}
          <div className="mt-8 bg-white border border-stone-200/80 rounded-2xl p-6 md:p-8 text-left shadow-sm font-sans">
            <h3 className="text-sm font-black uppercase text-stone-900 tracking-wider mb-4">Product Description</h3>
            <p className="text-xs sm:text-sm text-stone-500 leading-relaxed max-w-4xl font-normal whitespace-pre-wrap">
              {product.description}
            </p>
          </div>


          {/* RELATED PRODUCTS */}
          {relatedProducts.length > 0 && (
            <div className="mt-12 text-left">
              <h3 className="text-sm font-black uppercase text-stone-900 tracking-wider mb-6 flex items-center gap-2">
                <BestSellerIcon size={16} className="text-[#2D6A4F]" /> Recommended Products & Similar Items
              </h3>
              
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                {relatedProducts.map((p) => {
                  const hasDiscount = !!(p.originalPrice && p.originalPrice > p.price);
                  return (
                    <Link
                      key={p.id}
                      to="/shop/product/$slug"
                      params={{ slug: p.slug || p.name.toLowerCase().replace(/[^a-z0-9]+/g, "-") || p.id }}
                      className="group bg-white border border-stone-200/80 rounded-xl p-3 hover:-translate-y-1 hover:shadow-md transition duration-300 flex flex-col justify-between"
                    >
                      <div>
                        <div className="aspect-square bg-stone-50 rounded-lg overflow-hidden flex items-center justify-center p-1 relative mb-3">
                          <img src={p.image} className="h-full w-full object-contain group-hover:scale-102 transition duration-300" />
                          {hasDiscount && (
                            <span className="absolute top-1 left-1 bg-red-500 text-white text-[8px] font-black px-1.5 py-0.2 rounded uppercase">
                              Sale
                            </span>
                          )}
                        </div>
                        <span className="text-[9px] text-[#2D6A4F] font-bold uppercase tracking-wider block mb-0.5">{p.brand}</span>
                        <h4 className="text-xs text-stone-800 font-extrabold line-clamp-2 min-h-[32px] group-hover:text-[#2D6A4F] transition-colors">{p.name}</h4>
                      </div>

                      <div className="mt-2.5 pt-2 border-t border-stone-100 flex items-baseline gap-1.5">
                        <span className="text-xs font-black text-stone-900">KSh {p.price.toLocaleString()}</span>
                        {hasDiscount && (
                          <span className="text-[10px] text-stone-400 line-through">KSh {p.originalPrice!.toLocaleString()}</span>
                        )}
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          )}

        </div>

        {/* BOTTOM / TOP FLOATING STICKY PANEL */}
        <AnimatePresence>
          {showStickyBar && (
            <motion.div
              initial={{ y: 80, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 80, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-stone-200 shadow-2xl z-30 py-3.5 px-4 block font-sans"
            >
              <div className="max-w-7xl mx-auto flex items-center justify-between gap-4 flex-wrap sm:flex-nowrap">
                <div className="flex items-center gap-3 text-left">
                  <img src={product.image} className="h-10 w-10 object-contain rounded-lg bg-stone-50 border p-0.5 shrink-0 hidden sm:block" />
                  <div className="space-y-0.5">
                    <h4 className="text-xs font-black text-stone-900 max-w-[260px] truncate">{product.name}</h4>
                    <div className="text-xs font-black text-[#2D6A4F]">
                      KSh {activePrice.toLocaleString()}{" "}
                      {activeOriginalPrice && (
                        <span className="text-[10px] text-stone-400 line-through font-normal">KSh {activeOriginalPrice.toLocaleString()}</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 w-full sm:w-auto">
                  {/* Quantity */}
                  <div className="flex items-center border border-stone-200 rounded-lg bg-stone-50 h-9 px-2 shrink-0">
                    <button onClick={() => setQuantity((q) => Math.max(1, q - 1))} className="px-1.5 font-bold text-stone-400">-</button>
                    <span className="px-2.5 text-xs font-black text-stone-800">{quantity}</span>
                    <button onClick={() => setQuantity((q) => q + 1)} className="px-1.5 font-bold text-stone-400">+</button>
                  </div>

                  <button
                    onClick={() => {
                      addToCart(product, quantity, selectedSize || undefined);
                      toast.success("Added to cart!");
                    }}
                    className="flex-1 sm:flex-initial bg-white border border-[#2D6A4F] text-[#2D6A4F] text-[10px] font-black uppercase px-4 h-9 rounded-lg transition hover:bg-[#2D6A4F] hover:text-white cursor-pointer"
                  >
                    Add to Cart
                  </button>
                  <button
                    onClick={() => {
                      buyNow(product, quantity, selectedSize || undefined);
                    }}
                    className="flex-1 sm:flex-initial bg-[#2D6A4F] hover:bg-[#1A5438] text-white text-[10px] font-black uppercase px-5 h-9 rounded-lg transition cursor-pointer shadow-sm"
                  >
                    Buy Now
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* LIGHTBOX / FULLSCREEN PREVIEW MODAL */}
        <AnimatePresence>
          {lightboxOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-stone-950/95 z-50 flex items-center justify-center p-4"
            >
              <button
                onClick={() => setLightboxOpen(false)}
                className="absolute top-4 right-4 bg-white/10 hover:bg-white/20 text-white p-2.5 rounded-full transition cursor-pointer"
              >
                <X size={20} />
              </button>

              <div className="max-w-4xl max-h-[85vh] w-full flex items-center justify-center p-2 relative">
                <img
                  src={productImages[activeImageIndex]}
                  className="max-w-full max-h-[80vh] object-contain rounded-lg shadow-2xl"
                  alt="fullscreen view"
                />
              </div>

              {/* Lightbox thumbnail selectors */}
              <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-3 overflow-x-auto px-4 pb-2">
                {productImages.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveImageIndex(idx)}
                    className={`h-12 w-12 rounded-lg overflow-hidden border p-0.5 shrink-0 ${
                      activeImageIndex === idx ? "border-[#2D6A4F] ring-2 ring-[#2D6A4F]/20" : "border-stone-700"
                    }`}
                  >
                    <img src={img} className="h-full w-full object-cover rounded" />
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </AppLayout>
  );
}
