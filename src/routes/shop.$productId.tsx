import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useMemo, useEffect } from "react";
import { ChevronRight, Star, Heart, ShoppingCart, ShieldCheck, MapPin, ArrowLeft } from "lucide-react";
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

function ProductDetailPage() {
  const { productId } = Route.useParams();
  const navigate = useNavigate();
  const { addToCart, buyNow } = useCart();
  
  const product = useMemo(() => {
    return shopProducts.find((p) => String(p.id) === String(productId));
  }, [productId]);

  const [quantity, setQuantity] = useState(1);

  // Scroll to top when product ID changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "auto" });
    setQuantity(1);
  }, [productId]);
  const [wishlist, setWishlist] = useState<Set<string>>(new Set());

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
            className="mt-6 inline-flex items-center gap-2 rounded-[8px] bg-[#2D6A4F] px-5 py-2 text-xs font-bold text-white hover:bg-[#1A5438]"
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
            <Link to="/shop" className="hover:text-[#2D6A4F]">Shop</Link>
            <ChevronRight className="h-3 w-3 text-gray-300" />
            <span className="hover:text-[#2D6A4F]">{product.category}</span>
            <ChevronRight className="h-3 w-3 text-gray-300" />
            <span className="text-[#1A1A1A] font-semibold">{product.name}</span>
          </div>
        </div>

        <div className="container-px mx-auto max-w-7xl mt-8">
          <div className="grid gap-8 md:grid-cols-2 text-left">
            {/* Left: Image Gallery */}
            <div className="relative aspect-square w-full overflow-hidden bg-white border border-[#E8ECE9] rounded-[16px] p-4 shadow-sm">
              <img
                src={product.image || '/placeholder-product.png'}
                alt={product.name}
                className="h-full w-full object-cover rounded-[12px]"
                loading="eager"
                onError={(e) => {
                  e.currentTarget.src = '/placeholder-product.png';
                }}
              />
              {product.badge && (
                <span className="absolute left-6 top-6 z-10 rounded-full bg-[#2D6A4F] px-3 py-1 text-xs font-bold text-white uppercase tracking-wider">
                  {product.badge}
                </span>
              )}
            </div>

            {/* Right: Product Details info */}
            <div className="flex flex-col justify-between bg-white border border-[#E8ECE9] rounded-[16px] p-6 shadow-sm md:p-8">
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
                    <span className="font-bold text-[#1A1A1A]">{product.rating}</span>
                    <span className="text-[#6B7280]">({product.reviewsCount} Reviews)</span>
                  </div>
                  <div className="h-3 w-px bg-[#E8ECE9]" />
                  <span className="text-xs text-[#6B7280]">
                    Seller: <strong className="text-[#1A1A1A] font-semibold">{product.brand}</strong>
                  </span>
                </div>

                <p className="mt-6 text-sm leading-relaxed text-[#6B7280]">
                  {product.description}
                </p>

                {/* Checklist */}
                <div className="mt-6 space-y-2 border-t border-[#E8ECE9] pt-6">
                  <div className="flex items-center gap-2 text-xs text-[#1A1A1A]">
                    <ShieldCheck className="h-4.5 w-4.5 text-[#2D6A4F]" />
                    <span>Verified cultivator: <strong>{product.brand}</strong> (Grade A Produce)</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-[#6B7280]">
                    <div className={`h-2.5 w-2.5 rounded-full ${product.stock > 10 ? 'bg-[#2D6A4F]' : 'bg-red-500'}`} />
                    <span>{product.stock > 0 ? `${product.stock} units available in warehouse` : 'Out of stock'}</span>
                  </div>
                </div>
              </div>

              {/* Price, Quantity, Buy Now */}
              <div className="mt-8 border-t border-[#E8ECE9] pt-6">
                <div className="flex items-baseline gap-1.5">
                  <span className="font-sans text-3xl font-black text-[#2D6A4F]">
                    KES {product.price.toLocaleString()}
                  </span>
                  <span className="text-xs text-[#6B7280]">per {product.unit}</span>
                  {product.originalPrice && (
                    <span className="font-sans text-sm text-[#6B7280] line-through ml-2">
                      KES {product.originalPrice.toLocaleString()}
                    </span>
                  )}
                </div>

                <div className="mt-6 flex flex-wrap items-center gap-4">
                  {/* Quantity selector */}
                  <div className="flex items-center border border-[#E8ECE9] rounded-[8px] bg-[#FAFAF8] h-10 px-2">
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
                      addToCart(product, quantity);
                    }}
                    className="flex-1 min-w-[140px] flex items-center justify-center gap-2 rounded-[8px] border border-[#2D6A4F] bg-white h-10 text-xs font-bold text-[#2D6A4F] transition-all hover:bg-[#2D6A4F] hover:text-white uppercase tracking-wider"
                  >
                    <ShoppingCart className="h-4 w-4" /> Add to Cart
                  </button>

                  <button
                    onClick={() => {
                      buyNow(product);
                    }}
                    className="flex-1 min-w-[140px] flex items-center justify-center gap-1.5 rounded-[8px] bg-[#2D6A4F] h-10 text-xs font-bold text-white hover:bg-[#1A5438] transition-all uppercase tracking-wider shadow-md"
                  >
                    Buy Now
                  </button>

                  <button
                    onClick={handleToggleWishlist}
                    className="grid h-10 w-10 place-items-center rounded-[8px] border border-[#E8ECE9] hover:bg-[#FAFAF8] transition"
                    aria-label="Toggle Wishlist"
                  >
                    <Heart className={`h-4.5 w-4.5 ${isWishlisted ? "fill-red-500 text-red-500" : "text-[#6B7280]"}`} />
                  </button>
                </div>
              </div>
            </div>
          </div>

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
                    className="group rounded-[12px] bg-white p-3 border border-[#E8ECE9] hover:border-[#2D6A4F] hover:shadow-md transition duration-300"
                  >
                    <div className="aspect-square w-full overflow-hidden bg-[#FAFAF8] rounded-[8px]">
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
    </AppLayout>
  );
}
