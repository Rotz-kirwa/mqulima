import { useState } from "react";
import { X, MapPin, ShieldCheck, ShoppingCart, Star } from "lucide-react";
import { motion } from "framer-motion";
import { type ShopProduct } from "@/lib/shop-data";

interface QuickViewModalProps {
  product: ShopProduct;
  onClose: () => void;
  onAddToCart: (product: ShopProduct, event: React.MouseEvent) => void;
}

export function QuickViewModal({ product, onClose, onAddToCart }: QuickViewModalProps) {
  const [selectedSizeName, setSelectedSizeName] = useState<string | undefined>(
    product.sizes && product.sizes.length > 0 ? product.sizes[0].name : undefined
  );

  const activeSize = product.sizes?.find((s) => s.name === selectedSizeName);
  const activePrice = activeSize ? activeSize.price : product.price;
  const activeOriginalPrice = activeSize ? activeSize.originalPrice : product.originalPrice;
  const activeUnit = activeSize ? activeSize.unit : product.unit;
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

            {/* Size Selector */}
            {product.sizes && product.sizes.length > 0 && (
              <div className="mt-4 border-t border-[#E8ECE9] pt-4">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#6B7280]">Select Size / Volume</span>
                <div className="mt-2 flex flex-wrap gap-2">
                  {product.sizes.map((s) => (
                    <button
                      key={s.name}
                      type="button"
                      onClick={() => setSelectedSizeName(s.name)}
                      className={`px-3 py-1.5 border text-xs font-bold transition rounded-none ${
                        selectedSizeName === s.name
                          ? "bg-[#2D6A4F] text-white border-[#2D6A4F]"
                          : "bg-white text-gray-700 border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      {s.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Price & Cart Actions */}
            <div className="mt-6 border-t border-[#E8ECE9] pt-4">
              <div className="flex items-baseline gap-1.5">
                <span className="font-sans text-2xl font-black text-[#2D6A4F]">
                  KES {activePrice.toLocaleString()}
                </span>
                {activeOriginalPrice && (
                  <span className="font-sans text-sm text-[#6B7280] line-through">
                    KES {activeOriginalPrice.toLocaleString()}
                  </span>
                )}
                <span className="text-xs text-[#6B7280] ml-1">per {activeUnit}</span>
              </div>

              <button
                onClick={(e) => {
                  const sizeSuffix = selectedSizeName ? `-${selectedSizeName}` : '';
                  onAddToCart({
                    ...product,
                    id: selectedSizeName ? `${product.id}${sizeSuffix}` : product.id,
                    price: activePrice,
                    originalPrice: activeOriginalPrice,
                    unit: activeUnit,
                  }, e);
                  onClose();
                }}
                disabled={product.stock <= 0}
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-none bg-[#2D6A4F] py-3 text-xs font-bold text-white shadow-lg transition-transform hover:scale-[1.01] active:scale-98 disabled:bg-gray-300 disabled:cursor-not-allowed"
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
