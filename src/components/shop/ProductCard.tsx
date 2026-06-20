import { useState } from "react";
import { Heart, MapPin, Star, Eye } from "lucide-react";
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

  // Calculate discount percentage if original price is present
  const discount = product.originalPrice
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0;

  return (
    <article
      onClick={() => onSelectProduct(product)}
      className={
        isGrid
          ? "group relative flex flex-col overflow-hidden bg-white p-3 border border-[#E5E7EB] transition-all duration-300 hover:border-[#1A6B3C] cursor-pointer"
          : "group flex flex-col gap-4 overflow-hidden bg-white p-4 border border-[#E5E7EB] transition-all duration-300 hover:border-[#1A6B3C] cursor-pointer sm:flex-row"
      }
    >
      {/* Product Image Area */}
      <div
        className={
          isGrid
            ? "relative aspect-square w-full overflow-hidden bg-white"
            : "relative aspect-square w-full shrink-0 overflow-hidden bg-white sm:w-44"
        }
      >
        {!isImageLoaded && <div className="absolute inset-0 animate-shimmer" />}
        <img
          src={product.image}
          alt={product.name}
          onLoad={() => setIsImageLoaded(true)}
          className={`h-full w-full object-contain transition-all duration-500 ease-out group-hover:scale-103 ${isImageLoaded ? "opacity-100" : "opacity-0"}`}
          loading="lazy"
          decoding="async"
          width={300}
          height={300}
        />

        {/* Wishlist Heart Top-Right */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleWishlist(product.id);
          }}
          className="absolute right-2 top-2 z-10 grid h-8 w-8 place-items-center rounded-full bg-white/90 text-[#1A1A1A] shadow-[0_2px_6px_rgba(0,0,0,0.06)] backdrop-blur transition-all duration-200 hover:scale-110 active:scale-95"
          aria-label="Toggle wishlist"
        >
          <Heart
            className={`h-4.5 w-4.5 transition-colors ${
              isWishlisted ? "fill-red-500 text-red-500" : "text-[#6B7280]"
            }`}
          />
        </button>

        {/* Quick View Eye Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onQuickView(product);
          }}
          className="absolute right-2 top-12 z-10 grid h-8 w-8 place-items-center rounded-full bg-white/90 text-[#1A1A1A] shadow-[0_2px_6px_rgba(0,0,0,0.06)] backdrop-blur transition-all duration-200 hover:scale-110 active:scale-95"
          aria-label="Quick view"
        >
          <Eye className="h-4.5 w-4.5 text-[#6B7280] hover:text-[#1A6B3C]" />
        </button>

        {/* Red OFFER Tag top-left */}
        <span className="absolute left-2 top-2 z-10 rounded-sm bg-red-600 px-2 py-0.5 text-[9px] font-bold text-white uppercase tracking-wider">
          Offer
        </span>

        {/* Organic Tag if applicable */}
        {product.organic && (
          <span className="absolute left-2 top-8 z-10 rounded-sm bg-[#1A6B3C] px-2 py-0.5 text-[9px] font-bold text-white uppercase tracking-wider">
            Organic
          </span>
        )}
      </div>

      {/* Product Metadata & Info */}
      <div className="flex flex-1 flex-col pt-3 text-left">
        {/* Product Title (Bold, Black) */}
        <h3 className="font-sans font-bold text-[#1A1A1A] text-sm leading-snug transition-colors duration-200 group-hover:text-[#1A6B3C]">
          {product.name}
        </h3>

        {/* Subtitle Brand (Muted Gray) */}
        <div className="mt-1 text-xs text-[#6B7280]">
          {product.brand}
        </div>

        {/* Location county */}
        <div className="mt-1 flex items-center gap-0.5 text-[10px] text-[#6B7280]">
          <MapPin className="h-3 w-3 text-[#1A6B3C]" />
          <span>{product.county}</span>
        </div>

        {!isGrid && (
          <p className="mt-2 line-clamp-2 text-sm text-[#6B7280]">{product.description}</p>
        )}

        {/* Price display in red */}
        <div className="mt-3 flex flex-col">
          <span className="font-sans text-sm font-extrabold text-red-600">
            KSh {product.price.toLocaleString()}
          </span>
          {product.originalPrice && (
            <span className="font-sans text-[11px] text-[#6B7280] line-through mt-0.5">
              KSh {product.originalPrice.toLocaleString()}
            </span>
          )}
          <span className="text-[9px] text-[#6B7280] mt-0.5">per {product.unit}</span>
        </div>

        {/* Action Buttons */}
        <div className="mt-auto pt-4">
          {isGrid ? (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onBuyNow(product, e);
              }}
              className="w-full rounded-sm border border-[#1A6B3C] bg-white py-1.5 text-xs font-bold text-[#1A6B3C] transition-all duration-200 hover:bg-[#1A6B3C] hover:text-white uppercase tracking-wider text-center"
            >
              Buy Now
            </button>
          ) : (
            <div className="flex gap-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onQuickView(product);
                }}
                className="flex-1 rounded-sm border border-[#E5E7EB] bg-white py-1.5 text-xs font-bold text-[#6B7280] transition-all duration-200 hover:bg-[#FAFAF8] hover:text-[#1A1A1A] uppercase tracking-wider text-center"
              >
                Quick View
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onBuyNow(product, e);
                }}
                className="flex-1 rounded-sm border border-[#1A6B3C] bg-[#1A6B3C] py-1.5 text-xs font-bold text-white transition-all duration-200 hover:bg-[#155430] uppercase tracking-wider text-center"
              >
                Buy Now
              </button>
            </div>
          )}
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
          ? "relative flex flex-col overflow-hidden bg-white p-3 border border-[#E5E7EB] aspect-[3/4]"
          : "flex flex-col gap-4 overflow-hidden bg-white p-4 border border-[#E5E7EB] sm:flex-row"
      }
    >
      {/* Image Skeleton */}
      <div
        className={
          isGrid
            ? "relative aspect-square w-full animate-shimmer rounded-md"
            : "relative aspect-square w-full shrink-0 animate-shimmer rounded-md sm:w-44"
        }
      />
      {/* Info Skeleton */}
      <div className="flex flex-1 flex-col pt-3 space-y-3">
        <div className="h-4 w-3/4 animate-shimmer rounded-md" />
        <div className="h-3 w-1/2 animate-shimmer rounded-md" />
        <div className="h-3 w-1/3 animate-shimmer rounded-md" />
        <div className="h-8 w-full animate-shimmer rounded-md mt-auto" />
      </div>
    </div>
  );
}
