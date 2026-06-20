import { X, MapPin, ShieldCheck, ShoppingCart, Star } from "lucide-react";
import { motion } from "framer-motion";
import { type ShopProduct } from "@/lib/shop-data";

interface QuickViewModalProps {
  product: ShopProduct;
  onClose: () => void;
  onAddToCart: (product: ShopProduct, event: React.MouseEvent) => void;
}

export function QuickViewModal({ product, onClose, onAddToCart }: QuickViewModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 backdrop-blur-md">
      {/* Background click overlay */}
      <div className="absolute inset-0" onClick={onClose} />

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className="relative z-10 w-full max-w-2xl overflow-hidden rounded-[24px] border border-[#E8ECE9] bg-white p-6 shadow-[0_20px_50px_rgba(0,0,0,0.15)] md:p-8"
      >
        <button
          onClick={onClose}
          className="absolute right-4 top-4 grid h-8 w-8 place-items-center rounded-full bg-[#FAFAF8] text-[#6B7280] transition-colors hover:bg-[#E8ECE9] hover:text-[#1A1A1A]"
          aria-label="Close"
        >
          <X className="h-4.5 w-4.5" />
        </button>

        <div className="grid gap-6 text-left md:grid-cols-2">
          {/* Product Image */}
          <div className="relative aspect-square overflow-hidden rounded-[16px] border border-[#E8ECE9] bg-[#FAFAF8]">
            <img
              src={product.image}
              alt={product.name}
              className="h-full w-full object-cover"
              loading="lazy"
            />
            {product.badge && (
              <span className="absolute left-3 top-3 z-10 rounded-full bg-[#2D6A4F] px-3 py-1 text-xs font-bold text-white shadow-sm">
                {product.badge}
              </span>
            )}
          </div>

          {/* Product Details */}
          <div className="flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#6B7280]">
                <span>{product.brand}</span>
                <span>•</span>
                <span className="text-[#2D6A4F]">{product.category}</span>
              </div>

              <h3 className="mt-2 text-xl font-bold text-[#1A1A1A] md:text-2xl">{product.name}</h3>

              <div className="mt-2.5 flex items-center gap-3">
                <div className="flex items-center gap-1 text-xs text-[#F5A623]">
                  <Star className="h-4 w-4 fill-[#F5A623] text-[#F5A623]" />
                  <span className="font-bold text-[#1A1A1A]">{product.rating}</span>
                  <span className="text-[#6B7280]">({product.reviewsCount} reviews)</span>
                </div>
                <div className="h-3 w-px bg-[#E8ECE9]" />
                <span className="flex items-center gap-0.5 text-xs text-[#2D6A4F] font-semibold">
                  <MapPin className="h-3.5 w-3.5" /> {product.county} Origin
                </span>
              </div>

              <p className="mt-4 text-xs leading-relaxed text-[#6B7280]">
                {product.description}
              </p>

              {/* Badges / Extras */}
              <div className="mt-5 space-y-2 border-t border-[#E8ECE9] pt-4">
                <div className="flex items-center gap-2 text-xs text-[#1A1A1A]">
                  <ShieldCheck className="h-4 w-4 text-[#2D6A4F]" />
                  <span>Sourced direct from verified grower <strong>{product.brand}</strong></span>
                </div>
                <div className="flex items-center gap-2 text-xs text-[#6B7280]">
                  <div className={`h-2 w-2 rounded-full ${product.stock > 10 ? 'bg-[#2D6A4F]' : 'bg-red-500'}`} />
                  <span>{product.stock > 0 ? `${product.stock} units available in stock` : 'Out of stock'}</span>
                </div>
              </div>
            </div>

            {/* Price & Cart Actions */}
            <div className="mt-6 border-t border-[#E8ECE9] pt-4">
              <div className="flex items-baseline gap-1.5">
                <span className="font-sans text-2xl font-black text-[#2D6A4F]">
                  KES {product.price.toLocaleString()}
                </span>
                {product.originalPrice && (
                  <span className="font-sans text-sm text-[#6B7280] line-through">
                    KES {product.originalPrice.toLocaleString()}
                  </span>
                )}
                <span className="text-xs text-[#6B7280] ml-1">per {product.unit}</span>
              </div>

              <button
                onClick={(e) => {
                  onAddToCart(product, e);
                  onClose();
                }}
                disabled={product.stock <= 0}
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-[8px] bg-[#2D6A4F] py-3 text-xs font-bold text-white shadow-lg transition-transform hover:scale-[1.01] active:scale-98 disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                <ShoppingCart className="h-4 w-4" /> Add to Cart
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
