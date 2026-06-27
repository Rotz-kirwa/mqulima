import { useState } from "react";
import { Heart, MapPin, Star, Eye, ShoppingCart } from "lucide-react";
import { type ShopProduct } from "@/lib/shop-data";

interface ProductCardProps {
  product: ShopProduct;
  isWishlisted: boolean;
  layout: "grid" | "list";
  onAddToCart: (product: ShopProduct, event: React.MouseEvent) => void;
  onToggleWishlist: (id: string) => void;
  onSelectProduct: (product: ShopProduct) => void;
  onQuickView: (product: ShopProduct) => void;
  onBuyNow: (product: ShopProduct, event: React.MouseEvent) => void;
}

export function ProductCard({
  product,
  isWishlisted,
  layout,
  onAddToCart,
  onToggleWishlist,
  onSelectProduct,
  onQuickView,
  onBuyNow,
}: ProductCardProps) {
  const isGrid = layout === "grid";
  const [isImageLoaded, setIsImageLoaded] = useState(false);
  const [particles, setParticles] = useState<{ id: number; tx: number; ty: number }[]>([]);

  const handleAddToCartWithParticles = (e: React.MouseEvent) => {
    e.stopPropagation();
    
    // Spawn 6 burst particles
    const newParticles = Array.from({ length: 6 }).map((_, i) => {
      const angle = (i * 60 * Math.PI) / 180;
      const velocity = 35 + Math.random() * 30;
      return {
        id: Math.random() + i,
        tx: Math.cos(angle) * velocity,
        ty: Math.sin(angle) * velocity - 10,
      };
    });
    
    setParticles((prev) => [...prev, ...newParticles]);
    onAddToCart(product, e);

    setTimeout(() => {
      setParticles((prev) => prev.filter((p) => !newParticles.some((np) => np.id === p.id)));
    }, 850);
  };

  // Determine badge color and render
  const badgeText = product.badge;

  return (
    <article
      onClick={() => onSelectProduct(product)}
      className={
        isGrid
          ? "group relative flex flex-col overflow-hidden rounded-none bg-[#0A1E0C] p-3 border border-[#1A3A25] transition-all duration-300 hover:border-gold cursor-pointer"
          : "group flex flex-col gap-4 overflow-hidden rounded-none bg-[#0A1E0C] p-4 border border-[#1A3A25] transition-all duration-300 hover:border-gold cursor-pointer sm:flex-row"
      }
    >
      {/* Product Image Area */}
      <div
        className={
          isGrid
            ? "relative aspect-square w-full overflow-hidden bg-[#0A1E0C] rounded-none"
            : "relative aspect-square w-full shrink-0 overflow-hidden bg-[#0A1E0C] rounded-none sm:w-44"
        }
      >
        {!isImageLoaded && <div className="absolute inset-0 animate-shimmer" />}
        <img
          src={product.image}
          alt={product.name}
          onLoad={() => setIsImageLoaded(true)}
          className={`h-full w-full object-cover transition-all duration-500 ease-out group-hover:scale-103 ${isImageLoaded ? "opacity-100" : "opacity-0"}`}
          loading="lazy"
          decoding="async"
          width={300}
          height={300}
        />

        {/* Hover Quick View Overlay */}
        <div className="absolute inset-0 flex items-center justify-center bg-black/35 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onQuickView(product);
            }}
            className="flex items-center gap-1.5 rounded-none bg-white px-4 py-2 text-xs font-extrabold text-[#1A1A1A] shadow-md transition-transform duration-300 hover:scale-105 active:scale-95"
          >
            <Eye className="h-3.5 w-3.5" />
            <span>Quick View</span>
          </button>
        </div>

        {/* Wishlist Heart Top-Right */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleWishlist(product.id);
          }}
          className="absolute right-2.5 top-2.5 z-10 grid h-8 w-8 place-items-center rounded-none bg-black/40 text-white shadow-[0_2px_8px_rgba(0,0,0,0.1)] backdrop-blur transition-all duration-200 hover:scale-110 active:scale-95"
          aria-label="Toggle wishlist"
        >
          <Heart
            className={`h-4.5 w-4.5 transition-colors ${
              isWishlisted ? "fill-red-500 text-red-500" : "text-white/60"
            }`}
          />
        </button>

        {/* Badge Pill Top-Left */}
        {badgeText && (
          <span className="absolute left-2.5 top-2.5 z-10 rounded-none bg-gold px-2.5 py-0.5 text-[9px] font-bold text-gold-foreground uppercase tracking-wider">
            {badgeText}
          </span>
        )}
      </div>

      {/* Product Metadata & Info */}
      <div className="flex flex-1 flex-col pt-3.5 text-left">
        {/* Category & Rating */}
        <div className="flex items-center justify-between text-[10px] font-bold text-gold uppercase tracking-wider mb-1">
          <span>{product.category}</span>
          <span className="flex items-center gap-1 text-gold">
            <Star className="h-3 w-3 fill-gold text-gold" />
            {product.rating}
          </span>
        </div>

        {/* Product Title (Bold, White, max 2 lines) */}
        <h3 className="font-sans font-bold text-white text-sm leading-snug transition-colors duration-200 group-hover:text-gold line-clamp-2 h-10">
          {product.name}
        </h3>

        {/* Seller name in muted small text */}
        <div className="text-[11px] text-white/60 mt-1">
          Seller: <span className="font-medium text-white">{product.brand}</span>
        </div>

        {/* Description */}
        <p className="mt-2 line-clamp-2 text-xs text-white/60 h-8">{product.description}</p>

        {/* Price in gold + unit */}
        <div className="mt-3 flex items-baseline gap-1">
          <span className="font-sans text-base font-extrabold text-gold">
            KES {product.price.toLocaleString()}
          </span>
          <span className="text-[10px] text-white/60">/{product.unit}</span>
          {product.originalPrice && (
            <span className="font-sans text-xs text-white/40 line-through ml-2">
              KES {product.originalPrice.toLocaleString()}
            </span>
          )}
        </div>

        {/* Action Buttons (Add to Cart + View side-by-side) */}
        <div className="relative mt-4 flex gap-2">
          <button
            onClick={handleAddToCartWithParticles}
            className="flex-1 bg-[#2D6A4F] hover:bg-[#224f3b] text-white py-2 text-xs font-bold uppercase tracking-wider text-center rounded-none cursor-pointer transition-colors"
          >
            Add to Cart
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onQuickView(product);
            }}
            className="flex-1 border border-[#2D6A4F] hover:bg-[#2D6A4F]/10 text-[#52B788] py-2 text-xs font-bold uppercase tracking-wider text-center rounded-none cursor-pointer transition-colors"
          >
            View
          </button>

          {/* Render particle burst */}
          {particles.map((p) => (
            <span
              key={p.id}
              className="absolute pointer-events-none w-2 h-2 rounded-none bg-[#2D6A4F] z-50"
              style={{
                left: "50%",
                top: "50%",
                "--tx": `${p.tx}px`,
                "--ty": `${p.ty}px`,
                animation: "particle-burst 0.7s forwards cubic-bezier(0.1, 0.8, 0.3, 1)",
              } as React.CSSProperties}
            />
          ))}
        </div>
      </div>
    </article>
  );
}

export function ProductCardSkeleton({ layout = "grid" }: { layout?: "grid" | "list" }) {
  const isGrid = layout === "grid";
  return (
    <div
      className={
        isGrid
          ? "relative flex flex-col overflow-hidden rounded-none bg-[#0A1E0C] p-3 border border-[#1A3A25] aspect-[3/4]"
          : "flex flex-col gap-4 overflow-hidden rounded-none bg-[#0A1E0C] p-4 border border-[#1A3A25] sm:flex-row"
      }
    >
      {/* Image Skeleton */}
      <div
        className={
          isGrid
            ? "relative aspect-square w-full animate-pulse bg-white/5 rounded-none"
            : "relative aspect-square w-full shrink-0 animate-pulse bg-white/5 rounded-none sm:w-44"
        }
      />
      {/* Info Skeleton */}
      <div className="flex flex-1 flex-col pt-3 space-y-3">
        <div className="h-4 w-3/4 animate-pulse bg-white/5 rounded-none" />
        <div className="h-3 w-1/2 animate-pulse bg-white/5 rounded-none" />
        <div className="h-3 w-1/3 animate-pulse bg-white/5 rounded-none" />
        <div className="h-8 w-full animate-pulse bg-white/5 rounded-none mt-auto" />
      </div>
    </div>
  );
}
