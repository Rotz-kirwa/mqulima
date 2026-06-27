import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useMemo, useEffect } from "react";
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
  Send,
  Award,
  Printer,
  X,
  User,
  ThumbsUp
} from "lucide-react";
import { toast } from "sonner";
import { AppLayout } from "@/components/mqulima/AppLayout";
import { shopProducts, type ShopProduct } from "@/lib/shop-data";
import { useCart } from "@/lib/cart-context";

export const Route = createFileRoute("/shop/$productId")({
  head: ({ params }) => {
    const product = shopProducts.find((p) => String(p.id) === String(params.productId));
    return {
      meta: [
        { title: product ? `${product.name} · Mqulima` : "Product Detail · Mqulima" },
        { name: "description", content: product ? product.description : "View agricultural product details on Mqulima." }
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
};

function ProductDetailPage() {
  const { productId } = Route.useParams();
  const navigate = useNavigate();
  const { addToCart, buyNow } = useCart();
  
  const product = useMemo(() => {
    return shopProducts.find((p) => String(p.id) === String(productId));
  }, [productId]);

  const [quantity, setQuantity] = useState(1);
  const [wishlist, setWishlist] = useState<Set<string>>(new Set());

  // Size variation state (default to first size if sizes are defined)
  const [selectedSize, setSelectedSize] = useState<string | null>(null);

  // Set default size when product loads
  useEffect(() => {
    if (product && product.sizes && product.sizes.length > 0) {
      setSelectedSize(product.sizes[0].name);
    } else {
      setSelectedSize(null);
    }
  }, [product]);

  // Scroll to top and reset states when product ID changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "auto" });
    setQuantity(1);
  }, [productId]);

  // Load wishlist from localStorage
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
      activeUnit: product.unit
    };
  }, [product, selectedSize]);

  // ══════════════════════════════════════════
  // REVIEWS & RATING STATE
  // ══════════════════════════════════════════
  const [reviews, setReviews] = useState<Review[]>([]);
  const [newReviewName, setNewReviewName] = useState("");
  const [newReviewText, setNewReviewText] = useState("");
  const [newReviewRating, setNewReviewRating] = useState(5);

  // Load reviews from localStorage + defaults
  useEffect(() => {
    if (!product) return;
    try {
      const stored = localStorage.getItem(`mqulima_reviews_${product.id}`);
      if (stored) {
        setReviews(JSON.parse(stored));
      } else {
        // Seed default review
        const defaults: Review[] = [
          {
            id: "d1",
            name: "Timothy Kiprono",
            rating: 5,
            text: `Excellent product! Used this on my farm in Uasin Gishu and noticed incredible results in a short duration. Recommended.`,
            date: "June 12, 2026"
          },
          {
            id: "d2",
            name: "Jane Wambui",
            rating: 4,
            text: `High quality standard. Fast packaging, and the sales team offered professional assistance when I requested guidance.`,
            date: "June 20, 2026"
          }
        ];
        setReviews(defaults);
        localStorage.setItem(`mqulima_reviews_${product.id}`, JSON.stringify(defaults));
      }
    } catch (e) {
      console.error(e);
    }
  }, [product]);

  const handleAddReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!product) return;
    if (!newReviewName.trim() || !newReviewText.trim()) {
      toast.error("Please fill in both name and review content.");
      return;
    }
    const added: Review = {
      id: String(Date.now()),
      name: newReviewName.trim(),
      rating: newReviewRating,
      text: newReviewText.trim(),
      date: new Date().toLocaleDateString("en-US", { year: 'numeric', month: 'long', day: 'numeric' })
    };
    const updated = [added, ...reviews];
    setReviews(updated);
    localStorage.setItem(`mqulima_reviews_${product.id}`, JSON.stringify(updated));
    setNewReviewName("");
    setNewReviewText("");
    setNewReviewRating(5);
    toast.success("Review submitted! Thank you for rating this product.");
  };

  const averageRating = useMemo(() => {
    if (reviews.length === 0) return product?.rating || 5;
    const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
    return Math.round((sum / reviews.length) * 10) / 10;
  }, [reviews, product]);

  // ══════════════════════════════════════════
  // PROFORMA INVOICE / QUOTATION MODAL STATE
  // ══════════════════════════════════════════
  const [invoiceModalOpen, setInvoiceModalOpen] = useState(false);
  const [custName, setCustName] = useState("");
  const [custPhone, setCustPhone] = useState("");
  const [custLocation, setCustLocation] = useState("");
  const [custAgriType, setCustAgriType] = useState("Maize Farming");
  const [invoiceNumber] = useState(() => `MQ-PROF-${Math.floor(100000 + Math.random() * 900000)}`);
  const [invoiceDate] = useState(() => new Date().toLocaleDateString("en-US", { year: 'numeric', month: 'long', day: 'numeric' }));

  const subtotalInvoice = activePrice * quantity;
  const vatInvoice = subtotalInvoice * 0.16;
  const deliveryInvoice = subtotalInvoice > 2000 ? 0 : 250;
  const totalInvoice = subtotalInvoice + vatInvoice + deliveryInvoice;

  // ══════════════════════════════════════════
  // WHATSAPP INTEGRATION HANDLERS
  // ══════════════════════════════════════════
  const handleWhatsAppCheckout = () => {
    if (!product) return;
    const message = `Hello Mqulima Sales Agent, I'd like to place an order:
*Product:* ${product.name} ${selectedSize ? `(${selectedSize})` : ""}
*Quantity:* ${quantity}
*Price per Unit:* KSh ${activePrice.toLocaleString()}
*Delivery Location:* Please ship to my county.
*Total Amount:* KSh ${(activePrice * quantity).toLocaleString()}`;
    window.open(`https://wa.me/254700000000?text=${encodeURIComponent(message)}`, "_blank");
  };

  const handleContactAgentRetailer = () => {
    if (!product) return;
    const message = `Hello Mqulima Wholesale Agent, I am an Agro-retailer. I would like a discounted quote for:
*Product:* ${product.name}
*Expected Order Quantity:* 100+ units.
Please share the retail wholesale price sheet and quotation.`;
    window.open(`https://wa.me/254700000000?text=${encodeURIComponent(message)}`, "_blank");
  };

  const isWishlisted = useMemo(() => {
    return product ? wishlist.has(String(product.id)) : false;
  }, [product, wishlist]);

  const handleToggleWishlist = () => {
    if (!product) return;
    const id = String(product.id);
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

  // Save to recently viewed when product is loaded
  useEffect(() => {
    if (!product) return;
    try {
      const stored = localStorage.getItem("mqulima_recently_viewed");
      let list: ShopProduct[] = stored ? JSON.parse(stored) : [];
      list = list.filter((p) => String(p.id) !== String(product.id));
      const updated = [product, ...list].slice(0, 5);
      localStorage.setItem("mqulima_recently_viewed", JSON.stringify(updated));
    } catch (e) {
      console.error(e);
    }
  }, [product]);

  // Compute related products
  const relatedProducts = useMemo(() => {
    if (!product) return [];
    return shopProducts
      .filter((p) => p.category === product.category && String(p.id) !== String(product.id))
      .slice(0, 4);
  }, [product]);

  if (!product) {
    return (
      <AppLayout>
        <div className="container-px mx-auto max-w-7xl py-20 text-center">
          <span className="text-4xl">⚠️</span>
          <h2 className="mt-4 text-xl font-bold text-[#1A1A1A]">Product not found</h2>
          <p className="mt-2 text-xs text-[#6B7280]">The product you are looking for does not exist or has been removed.</p>
          <Link
            to="/shop"
            className="mt-6 inline-flex items-center gap-2 rounded-none bg-[#2D6A4F] px-5 py-2 text-xs font-bold text-white hover:bg-[#1A5438]"
          >
            <ArrowLeft className="h-4 w-4" /> Back to Shop
          </Link>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="bg-[#FAFAF8] pb-16">
        
        {/* Breadcrumbs */}
        <div className="bg-white border-b border-[#E8ECE9] py-3 text-left">
          <div className="container-px mx-auto max-w-7xl flex items-center gap-1.5 text-xs text-[#6B7280]">
            <Link to="/shop" className="hover:text-[#2D6A4F] font-medium">Shop</Link>
            <ChevronRight className="h-3 w-3 text-gray-300" />
            <span className="text-[#6B7280]">{product.category}</span>
            <ChevronRight className="h-3 w-3 text-gray-300" />
            <span className="text-[#1A1A1A] font-semibold">{product.name}</span>
          </div>
        </div>

        <div className="container-px mx-auto max-w-7xl mt-8">
          <div className="grid gap-8 md:grid-cols-2 text-left">
            
            {/* Left: Image Gallery */}
            <div className="relative aspect-square w-full overflow-hidden bg-white border border-[#E8ECE9] rounded-none p-4 shadow-sm">
              <img
                src={product.image || '/placeholder-product.png'}
                alt={product.name}
                className="h-full w-full object-cover rounded-none"
                loading="eager"
                onError={(e) => {
                  e.currentTarget.src = '/placeholder-product.png';
                }}
              />
              {product.badge && (
                <span className="absolute left-6 top-6 z-10 rounded-none bg-[#2D6A4F] px-3 py-1 text-xs font-bold text-white uppercase tracking-wider">
                  {product.badge}
                </span>
              )}
            </div>

            {/* Right: Product Details info */}
            <div className="flex flex-col justify-between bg-white border border-[#E8ECE9] rounded-none p-6 shadow-sm md:p-8">
              <div>
                <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-[#6B7280]">
                  <span>{product.category}</span>
                  <span className="flex items-center gap-0.5 text-[#2D6A4F]">
                    <MapPin className="h-3.5 w-3.5" />
                    {product.county} Origin
                  </span>
                </div>

                <h1 className="mt-3 text-2xl font-extrabold text-[#1A1A1A] md:text-3xl">{product.name}</h1>

                <div className="mt-3 flex items-center gap-4">
                  <div className="flex items-center gap-1 text-xs text-[#F5A623]">
                    <Star className="h-4 w-4 fill-[#F5A623] text-[#F5A623]" />
                    <span className="font-bold text-[#1A1A1A]">{averageRating}</span>
                    <span className="text-[#6B7280]">({reviews.length} Reviews)</span>
                  </div>
                  <div className="h-3 w-px bg-[#E8ECE9]" />
                  <span className="text-xs text-[#6B7280]">
                    Seller: <strong className="text-[#1A1A1A] font-semibold">{product.brand}</strong>
                  </span>
                </div>

                <p className="mt-6 text-sm leading-relaxed text-[#6B7280]">
                  {product.description}
                </p>

                {/* Sizes Variations Selector (Requested size feature) */}
                {product.sizes && product.sizes.length > 0 && (
                  <div className="mt-6 border-t border-[#E8ECE9] pt-6">
                    <span className="text-xs font-extrabold uppercase tracking-wider text-[#6B7280] block mb-3">
                      Select Size / Volume Variation
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {product.sizes.map((s) => (
                        <button
                          key={s.name}
                          onClick={() => setSelectedSize(s.name)}
                          className={`px-4 py-2 rounded-none border text-xs font-bold transition-all ${
                            selectedSize === s.name
                              ? "bg-[#2D6A4F] border-[#2D6A4F] text-white shadow-sm"
                              : "border-[#E8ECE9] hover:border-[#2D6A4F] text-[#6B7280] bg-[#FAFAF8]"
                          }`}
                        >
                          {s.name} — KSh {s.price.toLocaleString()}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Checklist */}
                <div className="mt-6 space-y-2 border-t border-[#E8ECE9] pt-6">
                  <div className="flex items-center gap-2 text-xs text-[#1A1A1A]">
                    <ShieldCheck className="h-4.5 w-4.5 text-[#2D6A4F]" />
                    <span>Verified cultivator: <strong>{product.brand}</strong> (Grade A Produce)</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-[#6B7280]">
                    <div className={`h-2.5 w-2.5 rounded-none ${product.stock > 10 ? 'bg-[#2D6A4F]' : 'bg-red-500'}`} />
                    <span>{product.stock > 0 ? `${product.stock} units available in warehouse` : 'Out of stock'}</span>
                  </div>
                </div>
              </div>

              {/* Price, Quantity, Buy Now */}
              <div className="mt-8 border-t border-[#E8ECE9] pt-6">
                
                {/* Dynamically adjusted price */}
                <div className="flex items-baseline gap-1.5">
                  <span className="font-sans text-3xl font-black text-[#2D6A4F]">
                    KES {activePrice.toLocaleString()}
                  </span>
                  <span className="text-xs text-[#6B7280]">per {activeUnit}</span>
                  {activeOriginalPrice && (
                    <span className="font-sans text-sm text-[#6B7280] line-through ml-2">
                      KES {activeOriginalPrice.toLocaleString()}
                    </span>
                  )}
                </div>

                {/* Interactive Purchase Row */}
                <div className="mt-6 flex flex-wrap items-center gap-3">
                  {/* Quantity selector */}
                  <div className="flex items-center border border-[#E8ECE9] rounded-none bg-[#FAFAF8] h-10 px-2">
                    <button
                      onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                      className="px-2 font-bold text-[#6B7280] hover:text-[#1A1A1A]"
                    >
                      -
                    </button>
                    <span className="px-3 text-xs font-bold text-[#1A1A1A]">{quantity}</span>
                    <button
                      onClick={() => setQuantity((q) => q + 1)}
                      className="px-2 font-bold text-[#6B7280] hover:text-[#1A1A1A]"
                    >
                      +
                    </button>
                  </div>

                  <button
                    onClick={() => {
                      addToCart(product, quantity, selectedSize || undefined);
                    }}
                    className="flex-1 min-w-[130px] flex items-center justify-center gap-1.5 rounded-none border border-[#2D6A4F] bg-white h-10 text-xs font-bold text-[#2D6A4F] transition-all hover:bg-[#2D6A4F] hover:text-white uppercase tracking-wider"
                  >
                    <ShoppingCart className="h-4 w-4" /> Add to Cart
                  </button>

                  <button
                    onClick={() => {
                      buyNow(product, selectedSize || undefined);
                    }}
                    className="flex-1 min-w-[130px] flex items-center justify-center gap-1 rounded-none bg-[#2D6A4F] h-10 text-xs font-bold text-white hover:bg-[#1A5438] transition-all uppercase tracking-wider shadow-md"
                  >
                    Buy Now
                  </button>

                  <button
                    onClick={handleToggleWishlist}
                    className="grid h-10 w-10 place-items-center rounded-none border border-[#E8ECE9] hover:bg-[#FAFAF8] transition"
                    aria-label="Toggle Wishlist"
                  >
                    <Heart className={`h-4.5 w-4.5 ${isWishlisted ? "fill-red-500 text-red-500" : "text-[#6B7280]"}`} />
                  </button>
                </div>

                {/* WhatsApp checkout + Proforma invoice generation triggers */}
                <div className="mt-4 grid grid-cols-2 gap-3">
                  <button
                    onClick={handleWhatsAppCheckout}
                    className="flex items-center justify-center gap-2 h-10 bg-[#25D366] hover:bg-[#20BA56] text-white text-xs font-bold rounded-none transition"
                  >
                    <MessageSquare className="h-4 w-4" />
                    Checkout via WhatsApp
                  </button>
                  
                  <button
                    onClick={() => setInvoiceModalOpen(true)}
                    className="flex items-center justify-center gap-2 h-10 bg-[#FAF9F5] border border-[#F5A623]/40 hover:bg-[#FAF6EA] text-[#F5A623] text-xs font-bold rounded-none transition"
                  >
                    <FileText className="h-4 w-4" />
                    Get Proforma Invoice
                  </button>
                </div>

                {/* For Retailers section */}
                <div className="mt-6 bg-[#FAF8F2] border border-[#F5A623]/25 rounded-none p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="grid h-10 w-10 shrink-0 place-items-center rounded-none bg-[#F5A623]/10 text-[#F5A623]">
                      <Award className="h-5 w-5" />
                    </div>
                    <div className="text-left">
                      <span className="text-[9px] font-bold text-[#F5A623] uppercase tracking-wider block">Retailer Portal</span>
                      <h4 className="text-xs font-extrabold text-[#1A1A1A]">Bulk wholesale discounts available</h4>
                      <p className="text-[10px] text-[#6B7280] mt-0.5">Are you an agrovet or retailer? Sales agents can share custom proforma invoices at wholesale discounts.</p>
                    </div>
                  </div>
                  <button
                    onClick={handleContactAgentRetailer}
                    className="shrink-0 bg-white border border-[#F5A623] hover:bg-[#F5A623] hover:text-white px-4 py-2 text-xs font-extrabold text-[#F5A623] rounded-none transition"
                  >
                    Contact Sales Agent
                  </button>
                </div>

              </div>
            </div>
          </div>

          {/* ══════════════════════════════════════════
              RATINGS & REVIEW INTERACTIVE WIDGET
          ══════════════════════════════════════════ */}
          <section className="mt-16 bg-white border border-[#E8ECE9] rounded-none p-6 sm:p-8 text-left shadow-sm">
            <h3 className="text-base font-extrabold text-[#1A1A1A] uppercase tracking-wider mb-6 flex items-center gap-2">
              <Star className="h-5 w-5 fill-[#F5A623] text-[#F5A623]" />
              Customer Ratings & Reviews
            </h3>

            <div className="grid gap-8 md:grid-cols-12">
              
              {/* Left Column: Aggregated Rating and Form */}
              <div className="md:col-span-5 space-y-6">
                
                {/* Aggregate Summary */}
                <div className="bg-[#FAFAF8] rounded-none p-6 text-center border border-[#E8ECE9]">
                  <div className="text-4xl font-black text-[#1A1A1A]">{averageRating}</div>
                  <div className="flex justify-center my-2">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={`h-4.5 w-4.5 ${
                          i < Math.floor(averageRating)
                            ? "fill-[#F5A623] text-[#F5A623]"
                            : "text-gray-250"
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-xs text-[#6B7280] font-medium">Based on {reviews.length} customer ratings</span>
                </div>

                {/* Interactive Review Submission Form */}
                <form onSubmit={handleAddReview} className="space-y-4">
                  <h4 className="text-xs font-bold text-[#1A1A1A] uppercase tracking-wider">Leave a Review</h4>
                  
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-[#6B7280] uppercase tracking-wider">Your Name</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Timothy Kiprono"
                      value={newReviewName}
                      onChange={(e) => setNewReviewName(e.target.value)}
                      className="w-full rounded-none border border-[#E8ECE9] bg-[#FAFAF8] px-3.5 py-2 text-xs text-[#1A1A1A] outline-none focus:border-[#2D6A4F] focus:bg-white transition"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-[#6B7280] uppercase tracking-wider block">Rating</label>
                    <div className="flex gap-1.5">
                      {[1, 2, 3, 4, 5].map((stars) => (
                        <button
                          key={stars}
                          type="button"
                          onClick={() => setNewReviewRating(stars)}
                          className="p-1 hover:scale-110 transition"
                        >
                          <Star
                            className={`h-6 w-6 ${
                              stars <= newReviewRating
                                ? "fill-[#F5A623] text-[#F5A623]"
                                : "text-gray-250"
                            }`}
                          />
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-[#6B7280] uppercase tracking-wider">Review Comments</label>
                    <textarea
                      rows={3}
                      required
                      placeholder="Share your experience with this agrovet item..."
                      value={newReviewText}
                      onChange={(e) => setNewReviewText(e.target.value)}
                      className="w-full rounded-none border border-[#E8ECE9] bg-[#FAFAF8] px-3.5 py-2 text-xs text-[#1A1A1A] outline-none focus:border-[#2D6A4F] focus:bg-white transition resize-none"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-[#2D6A4F] hover:bg-[#1A5438] text-white text-xs font-bold py-2.5 rounded-none transition-colors flex items-center justify-center gap-1.5 uppercase tracking-wider shadow-sm"
                  >
                    <Send className="h-3 w-3" />
                    Submit review
                  </button>
                </form>

              </div>

              {/* Right Column: Reviews List */}
              <div className="md:col-span-7 space-y-4 max-h-[480px] overflow-y-auto pr-2 scrollbar-thin">
                {reviews.length === 0 ? (
                  <p className="text-xs text-[#6B7280] italic">No reviews yet. Be the first to review this product!</p>
                ) : (
                  reviews.map((rev) => (
                    <div key={rev.id} className="border-b border-[#E8ECE9] pb-4 last:border-none">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="grid h-7 w-7 place-items-center rounded-none bg-[#2D6A4F]/10 text-[#2D6A4F] text-[10px] font-bold">
                            <User className="h-3.5 w-3.5" />
                          </div>
                          <div>
                            <span className="text-xs font-bold text-[#1A1A1A]">{rev.name}</span>
                            <div className="flex mt-0.5">
                              {Array.from({ length: 5 }).map((_, i) => (
                                <Star
                                  key={i}
                                  className={`h-2.5 w-2.5 ${
                                    i < rev.rating
                                      ? "fill-[#F5A623] text-[#F5A623]"
                                      : "text-gray-250"
                                  }`}
                                />
                              ))}
                            </div>
                          </div>
                        </div>
                        <span className="text-[10px] text-[#6B7280]">{rev.date}</span>
                      </div>
                      <p className="mt-3 text-xs leading-relaxed text-[#6B7280] pl-9 bg-[#FAFAF8] p-2.5 rounded-none italic">
                        "{rev.text}"
                      </p>
                      <div className="mt-2 flex items-center gap-2 pl-9">
                        <button className="flex items-center gap-1 text-[10px] text-[#6B7280] hover:text-[#2D6A4F] transition font-bold">
                          <ThumbsUp className="h-3 w-3" /> Helpfulness (0)
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

            </div>
          </section>

          {/* Related Products Strip */}
          {relatedProducts.length > 0 && (
            <section className="mt-16 text-left">
              <h3 className="text-sm font-extrabold uppercase tracking-wider text-[#1A1A1A] mb-6">Related Products</h3>
              
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 md:grid-cols-4">
                {relatedProducts.map((p) => (
                  <Link
                    key={p.id}
                    to="/shop/$productId"
                    params={{ productId: String(p.id) }}
                    className="group rounded-none bg-white p-3 border border-[#E8ECE9] hover:border-[#2D6A4F] hover:shadow-md transition duration-300"
                  >
                    <div className="aspect-square w-full overflow-hidden bg-[#FAFAF8] rounded-none">
                      <img
                        src={p.image || '/placeholder-product.png'}
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-103"
                        alt={p.name}
                        onError={(e) => {
                          e.currentTarget.src = '/placeholder-product.png';
                        }}
                      />
                    </div>
                    <h4 className="line-clamp-1 text-xs font-bold text-[#1A1A1A] mt-3 group-hover:text-[#2D6A4F]">{p.name}</h4>
                    <div className="font-sans text-xs font-extrabold text-[#2D6A4F] mt-1">KES {p.price.toLocaleString()}</div>
                  </Link>
                ))}
              </div>
            </section>
          )}

        </div>
      </div>

      {/* ══════════════════════════════════════════
          PROFORMA INVOICE GENERATOR PRINTABLE MODAL
      ══════════════════════════════════════════ */}
      {invoiceModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto font-sans flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs text-[#1A1A1A]">
          <div className="bg-white rounded-none max-w-2xl w-full p-6 shadow-2xl relative border border-gray-100 flex flex-col text-left max-h-[90vh] overflow-y-auto">
            
            {/* Header info */}
            <div className="flex justify-between items-center border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="h-6 w-6 rounded-none bg-[#2D6A4F] text-white flex items-center justify-center font-bold text-sm">M</div>
                <h3 className="text-sm font-extrabold text-[#1A1A1A] uppercase tracking-wider">Proforma Invoice Generator</h3>
              </div>
              <button 
                onClick={() => setInvoiceModalOpen(false)}
                className="p-1 hover:bg-gray-100 rounded-full transition text-[#6B7280] hover:text-[#1A1A1A]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Input Billing Info Form */}
            <div className="bg-[#FAF9F5] rounded-none p-4 border border-[#F5A623]/20 grid gap-3 grid-cols-2 text-xs mt-4">
              <div className="col-span-2">
                <span className="text-[10px] font-bold text-[#6B7280] uppercase tracking-wider">Fill Buyer Details to populate Invoice</span>
              </div>
              <div className="space-y-1 col-span-2 sm:col-span-1">
                <span className="text-[9px] font-bold text-[#6B7280] uppercase">Customer Full Name</span>
                <input
                  type="text"
                  placeholder="e.g. Timothy Kiprono"
                  value={custName}
                  onChange={(e) => setCustName(e.target.value)}
                  className="w-full bg-white border border-[#E8ECE9] rounded-none px-3 py-1.5 outline-none focus:border-[#2D6A4F]"
                />
              </div>
              <div className="space-y-1 col-span-2 sm:col-span-1">
                <span className="text-[9px] font-bold text-[#6B7280] uppercase">Mobile Number</span>
                <input
                  type="tel"
                  placeholder="e.g. 0712345678"
                  value={custPhone}
                  onChange={(e) => setCustPhone(e.target.value)}
                  className="w-full bg-white border border-[#E8ECE9] rounded-none px-3 py-1.5 outline-none focus:border-[#2D6A4F]"
                />
              </div>
              <div className="space-y-1 col-span-2 sm:col-span-1">
                <span className="text-[9px] font-bold text-[#6B7280] uppercase">Delivery Location / County</span>
                <input
                  type="text"
                  placeholder="e.g. Eldoret, Uasin Gishu"
                  value={custLocation}
                  onChange={(e) => setCustLocation(e.target.value)}
                  className="w-full bg-white border border-[#E8ECE9] rounded-none px-3 py-1.5 outline-none focus:border-[#2D6A4F]"
                />
              </div>
              <div className="space-y-1 col-span-2 sm:col-span-1">
                <span className="text-[9px] font-bold text-[#6B7280] uppercase">Nature of Agriculture</span>
                <select
                  value={custAgriType}
                  onChange={(e) => setCustAgriType(e.target.value)}
                  className="w-full bg-white border border-[#E8ECE9] rounded-none px-3 py-1.5 outline-none focus:border-[#2D6A4F] font-semibold text-[#1A1A1A] cursor-pointer"
                >
                  <option value="Dairy Farming">Dairy Farming</option>
                  <option value="Maize Cultivation">Maize Cultivation</option>
                  <option value="Horticulture / Vegetables">Horticulture / Vegetables</option>
                  <option value="Poultry Production">Poultry Production</option>
                  <option value="Mixed farming">Mixed Farming</option>
                </select>
              </div>
            </div>

            {/* Printable Proforma Document Layout */}
            <div id="printable-proforma" className="mt-6 border border-gray-200 rounded-none p-6 bg-white space-y-6 text-xs text-[#1A1A1A]">
              
              {/* Invoice Header */}
              <div className="flex justify-between items-start border-b border-gray-100 pb-4">
                <div className="text-left">
                  <h4 className="text-sm font-black text-[#2D6A4F] uppercase">MQULIMA ECOSYSTEM</h4>
                  <p className="text-[10px] text-[#6B7280] mt-0.5">Agriculture for the future</p>
                  <p className="text-[10px] text-[#6B7280]">P.O Box 100-20100, Nakuru, Kenya</p>
                  <p className="text-[10px] text-[#6B7280]">Email: sales@mqulima.com | Phone: +254700000000</p>
                </div>
                <div className="text-right">
                  <h3 className="text-sm font-black text-[#1A1A1A] uppercase tracking-wider">PROFORMA INVOICE</h3>
                  <p className="text-[10px] font-bold text-[#2D6A4F] mt-1">{invoiceNumber}</p>
                  <p className="text-[10px] text-[#6B7280]">Date: {invoiceDate}</p>
                  <p className="text-[10px] text-[#6B7280]">Validity: 14 Days</p>
                </div>
              </div>

              {/* Customer Detail block */}
              <div className="grid grid-cols-2 gap-4">
                <div className="text-left">
                  <span className="text-[9px] font-bold text-[#6B7280] uppercase tracking-wider block">PREPARED FOR:</span>
                  <strong className="text-xs text-[#1A1A1A] block mt-1">{custName || "Valued Mqulima Partner"}</strong>
                  <p className="text-[10px] text-[#6B7280]">Phone: {custPhone || "N/A"}</p>
                  <p className="text-[10px] text-[#6B7280]">Location: {custLocation || "N/A"}</p>
                  <p className="text-[10px] text-[#6B7280]">Farming type: {custAgriType}</p>
                </div>
                <div className="text-left bg-gray-50 p-3 rounded-none border border-gray-150">
                  <span className="text-[9px] font-bold text-[#6B7280] uppercase tracking-wider block">DELIVERY NOTE:</span>
                  <p className="text-[10px] text-[#1A1A1A] mt-1">Deliver to {custLocation || "[Not Specified]"}.</p>
                  <p className="text-[10px] text-[#6B7280] mt-0.5">Shipping carrier: Mqulima Logistical Dispatch Services.</p>
                </div>
              </div>

              {/* Items Table */}
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-gray-200 text-[#6B7280] font-bold">
                    <th className="py-2">Product Details</th>
                    <th className="py-2 text-center">Qty</th>
                    <th className="py-2 text-right">Unit Price</th>
                    <th className="py-2 text-right">Total Amount</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-gray-100">
                    <td className="py-2.5">
                      <strong className="text-xs text-[#1A1A1A]">{product.name}</strong>
                      {selectedSize && <span className="text-[10px] text-[#6B7280] block">Size: {selectedSize}</span>}
                    </td>
                    <td className="py-2.5 text-center font-bold">{quantity}</td>
                    <td className="py-2.5 text-right font-mono">KES {activePrice.toLocaleString()}</td>
                    <td className="py-2.5 text-right font-mono font-bold">KES {subtotalInvoice.toLocaleString()}</td>
                  </tr>
                </tbody>
              </table>

              {/* Total calculations */}
              <div className="flex justify-end pt-4">
                <div className="w-[220px] space-y-1.5 text-right text-xs">
                  <div className="flex justify-between text-[#6B7280]">
                    <span>Subtotal:</span>
                    <span className="font-mono text-[#1A1A1A]">KES {subtotalInvoice.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-[#6B7280]">
                    <span>VAT (16%):</span>
                    <span className="font-mono text-[#1A1A1A]">KES {vatInvoice.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-[#6B7280]">
                    <span>Delivery Fee:</span>
                    <span className="font-mono text-[#1A1A1A]">
                      {deliveryInvoice === 0 ? "FREE" : `KES ${deliveryInvoice}`}
                    </span>
                  </div>
                  <div className="h-px bg-gray-200 my-1" />
                  <div className="flex justify-between text-sm font-black text-[#2D6A4F]">
                    <span>GRAND TOTAL:</span>
                    <span className="font-mono">KES {totalInvoice.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Payment conditions terms */}
              <div className="border-t border-gray-100 pt-4 text-left">
                <span className="text-[9px] font-bold text-[#6B7280] uppercase tracking-wider block">INSTRUCTIONS & TERMS:</span>
                <ol className="list-decimal pl-4 mt-1 text-[9px] text-[#6B7280] space-y-0.5">
                  <li>Payment must be completed in full before delivery dispatch.</li>
                  <li>Payments can be cleared via M-Pesa Lipa na Kopo or direct bank deposit.</li>
                  <li>Verify products upon receipt. Returns are processed within 48 hours.</li>
                </ol>
              </div>

            </div>

            {/* Print Action Buttons */}
            <div className="mt-6 flex justify-between gap-3 border-t border-gray-100 pt-4">
              <span className="text-[10px] text-[#6B7280] italic flex items-center">
                *This is a computer generated document. No signature required.
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setInvoiceModalOpen(false)}
                  className="px-4 py-2 border border-gray-300 rounded-none text-xs font-bold text-[#6B7280] hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    toast.success("Initiating printing dialogue...");
                    setTimeout(() => window.print(), 300);
                  }}
                  className="px-4 py-2 bg-[#2D6A4F] hover:bg-[#1A5438] rounded-none text-xs font-bold text-white transition flex items-center gap-1.5 shadow-sm"
                >
                  <Printer className="h-3.5 w-3.5" />
                  Print / Download Invoice
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

    </AppLayout>
  );
}
