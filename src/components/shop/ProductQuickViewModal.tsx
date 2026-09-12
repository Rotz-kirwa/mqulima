import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Check, ShoppingBag, ShieldCheck, MapPin, Store, Tag, Sparkles, AlertCircle, Layers } from "lucide-react";
import { useCart } from "@/lib/cart-context";
import { toast } from "sonner";
import { cleanDescriptionText } from "@/lib/shop-data";

export interface Variation {
  id: string;
  externalVariationId?: string;
  variantLabel: string;
  sku: string;
  price: number;
  stockQuantity: number;
  location?: string;
}

export interface ProductDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: {
    id: string;
    externalProductId?: string;
    name: string;
    slug?: string;
    description: string;
    price: number;
    basePrice?: number;
    stockQuantity: number;
    availability?: string;
    category?: string;
    subcategory?: string;
    brand?: string;
    badge?: string;
    unit?: string;
    imageUrl?: string;
    images?: string[];
    variations?: Variation[];
  } | null;
}

export function ProductQuickViewModal({ isOpen, onClose, product }: ProductDetailModalProps) {
  const { addToCart } = useCart();
  const [selectedVariation, setSelectedVariation] = useState<Variation | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState<string>("");

  useEffect(() => {
    if (product) {
      const vars = product.variations || [];
      if (vars.length > 0) {
        setSelectedVariation(vars[0]);
      } else {
        setSelectedVariation(null);
      }
      setQuantity(1);
      const img = product.imageUrl || (product.images && product.images[0]) || "/placeholder-product.png";
      setSelectedImage(img);
    }
  }, [product]);

  if (!isOpen || !product) return null;

  const rawBrand = product.brand || "";
  const cleanBrand = (!rawBrand || /smooth\s*sale|pos\s*direct/i.test(rawBrand)) ? (product.subcategory || product.category || "Verified Input") : rawBrand;

  const currentPrice = selectedVariation ? selectedVariation.price : (product.price || product.basePrice || 0);
  const currentStock = selectedVariation ? selectedVariation.stockQuantity : product.stockQuantity;
  const currentSku = selectedVariation ? selectedVariation.sku : (product.externalProductId ? `SKU-${product.externalProductId}` : "N/A");
  const currentLocation = selectedVariation?.location || "Main Agrovet Store";
  const isOutOfStock = currentStock <= 0;

  const handleAddToCart = () => {
    if (isOutOfStock) {
      toast.error("This item variation is currently out of stock.");
      return;
    }

    const itemLabel = selectedVariation ? `${product.name} (${selectedVariation.variantLabel})` : product.name;

    const shopProd = {
      id: selectedVariation ? `${product.id}_${selectedVariation.id}` : product.id,
      name: itemLabel,
      slug: product.slug || product.id,
      description: cleanDescriptionText(product.description || "") || "Certified genuine agricultural input for farm use.",
      price: currentPrice,
      stock: currentStock,
      image: selectedImage || product.imageUrl || "/placeholder-product.png",
      category: product.category || "General Inputs",
      badge: (product.badge && !/pos\s*sync/i.test(product.badge) ? product.badge : "") as any,
      brand: cleanBrand,
      seller: "Mqulima Verified",
      county: "Kenya",
      organic: false,
      verifiedSeller: true,
      unit: product.unit || "unit",
      sellerScore: 98,
      condition: "Certified Organic" as any,
      shopType: "Agrovet",
      field: "Agrovet",
      subcategory: product.category || "General Inputs",
      rating: 4.8,
      reviewsCount: 12,
      isFeatured: false
    };

    addToCart(shopProd, quantity);
    onClose();
  };


  const imagesList = product.images && product.images.length > 0 ? product.images : [selectedImage];

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="relative w-full max-w-3xl bg-white rounded-3xl shadow-2xl overflow-hidden text-left max-h-[90vh] flex flex-col"
        >
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-10 p-2 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-full transition cursor-pointer"
          >
            <X size={18} />
          </button>

          <div className="overflow-y-auto p-6 sm:p-8 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
              
              {/* Left Column: Images */}
              <div className="space-y-4">
                <div className="relative aspect-square w-full rounded-2xl bg-gray-50 border border-gray-100 overflow-hidden shadow-inner">
                  <img
                    src={selectedImage || "/placeholder-product.png"}
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Additional Thumbnails */}
                {imagesList.length > 1 && (
                  <div className="flex items-center gap-2 overflow-x-auto pb-1">
                    {imagesList.map((img, idx) => (
                      <button
                        key={idx}
                        onClick={() => setSelectedImage(img)}
                        className={`w-16 h-16 rounded-xl border-2 overflow-hidden transition cursor-pointer shrink-0 ${
                          selectedImage === img ? "border-[#2D6A4F] shadow-sm" : "border-gray-200 opacity-70 hover:opacity-100"
                        }`}
                      >
                        <img src={img} alt="Thumbnail" className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Right Column: Product Telemetry & Details */}
              <div className="space-y-5">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-bold text-[#2D6A4F] uppercase tracking-wider">
                      {product.category || "General Inputs"}
                    </span>
                    <span className="text-gray-300">•</span>
                    <span className="text-xs font-semibold text-gray-500">{cleanBrand}</span>
                  </div>

                  <h2 className="text-2xl font-black text-gray-900 tracking-tight leading-snug">
                    {product.name}
                  </h2>
                </div>

                {/* Pricing & Stock Status */}
                <div className="bg-emerald-50/60 border border-emerald-100 p-4 rounded-2xl flex items-center justify-between">
                  <div>
                    <span className="text-xs text-gray-500 font-semibold block">Price / Unit</span>
                    <span className="text-2xl font-extrabold text-[#2D6A4F]">
                      {currentPrice > 0 ? (
                        `KSh ${currentPrice.toLocaleString("en-KE", { minimumFractionDigits: 2 })}`
                      ) : (
                        <span className="text-amber-700 text-lg">Price on Request</span>
                      )}
                    </span>
                  </div>

                  <div className="text-right">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                      isOutOfStock ? "bg-rose-100 text-rose-700" : "bg-emerald-100 text-emerald-800"
                    }`}>
                      {isOutOfStock ? (
                        <>
                          <AlertCircle size={12} /> Out of Stock
                        </>
                      ) : (
                        <>
                          <Check size={12} /> In Stock ({currentStock} available)
                        </>
                      )}
                    </span>
                  </div>
                </div>

                {/* SKU & Location Stock Telemetry */}
                <div className="grid grid-cols-2 gap-3 text-xs bg-gray-50 p-3.5 rounded-xl border border-gray-150">
                  <div>
                    <span className="text-gray-400 font-semibold block flex items-center gap-1">
                      <Tag size={12} /> Product SKU
                    </span>
                    <span className="font-mono font-bold text-gray-800">{currentSku}</span>
                  </div>

                  <div>
                    <span className="text-gray-400 font-semibold block flex items-center gap-1">
                      <MapPin size={12} className="text-emerald-600" /> Location Stock
                    </span>
                    <span className="font-bold text-gray-800 truncate block">{currentLocation}</span>
                  </div>
                </div>

                {/* Variations Selector */}
                {product.variations && product.variations.length > 0 && (
                  <div className="space-y-2">
                    <label className="text-xs font-extrabold text-gray-900 uppercase tracking-wider flex items-center justify-between">
                      <span className="flex items-center gap-1">
                        <Layers size={13} className="text-[#2D6A4F]" /> Select Product Variation:
                      </span>
                      {selectedVariation && (
                        <span className="text-gray-500 font-normal">
                          {selectedVariation.stockQuantity} in stock
                        </span>
                      )}
                    </label>

                    <div className="grid grid-cols-1 gap-2">
                      {product.variations.map((v) => {
                        const isSelected = selectedVariation?.id === v.id;
                        return (
                          <button
                            key={v.id}
                            onClick={() => setSelectedVariation(v)}
                            className={`p-3 rounded-xl border text-left flex items-center justify-between transition cursor-pointer ${
                              isSelected
                                ? "border-[#2D6A4F] bg-[#2D6A4F]/5 ring-1 ring-[#2D6A4F]"
                                : "border-gray-200 hover:border-gray-300 bg-white"
                            }`}
                          >
                            <div>
                              <span className="font-bold text-xs text-gray-900 block">{v.variantLabel}</span>
                              <span className="text-[10px] text-gray-400 font-mono">SKU: {v.sku} • {v.location || "Main Store"}</span>
                            </div>
                            <div className="text-right">
                              <span className="font-extrabold text-xs text-[#2D6A4F] block">
                                KSh {v.price.toLocaleString()}
                              </span>
                              <span className={`text-[10px] font-bold ${v.stockQuantity > 0 ? "text-emerald-600" : "text-rose-500"}`}>
                                {v.stockQuantity > 0 ? `${v.stockQuantity} in stock` : "Out of stock"}
                              </span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Description */}
                <div>
                  <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider mb-1">Description</h4>
                  <p className="text-xs text-gray-600 leading-relaxed line-clamp-3">
                    {cleanDescriptionText(product.description || "") || "Certified genuine agricultural input for farm use."}
                  </p>
                </div>

                {/* Quantity & Add to Cart */}
                <div className="pt-2 flex items-center gap-4">
                  <div className="flex items-center border border-gray-200 rounded-xl bg-gray-50 p-1">
                    <button
                      onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                      disabled={quantity <= 1 || isOutOfStock}
                      className="w-8 h-8 flex items-center justify-center text-gray-600 hover:bg-white rounded-lg transition disabled:opacity-40"
                    >
                      -
                    </button>
                    <span className="w-10 text-center font-bold text-sm text-gray-900">{quantity}</span>
                    <button
                      onClick={() => setQuantity((q) => Math.min(currentStock, q + 1))}
                      disabled={quantity >= currentStock || isOutOfStock}
                      className="w-8 h-8 flex items-center justify-center text-gray-600 hover:bg-white rounded-lg transition disabled:opacity-40"
                    >
                      +
                    </button>
                  </div>

                  <button
                    onClick={() => {
                      if (currentPrice <= 0) {
                        window.open(
                          `https://wa.me/254723346134?text=${encodeURIComponent(
                            `Hi Mqulima, I would like to inquire about the price and availability of ${product.name} (SKU: ${currentSku})`
                          )}`,
                          "_blank"
                        );
                        return;
                      }
                      handleAddToCart();
                    }}
                    disabled={isOutOfStock && currentPrice > 0}
                    className={`flex-1 py-3.5 px-6 rounded-xl font-bold text-sm shadow-md hover:shadow-lg transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer ${
                      currentPrice <= 0
                        ? "bg-amber-600 hover:bg-amber-700 text-white"
                        : "bg-[#2D6A4F] hover:bg-[#1B4332] text-white"
                    }`}
                  >
                    <ShoppingBag size={18} />
                    {currentPrice <= 0
                      ? "Inquire via WhatsApp"
                      : (isOutOfStock ? "Out of Stock" : `Add to Cart • KSh ${(currentPrice * quantity).toLocaleString()}`)}
                  </button>
                </div>

                <div className="flex items-center justify-center gap-4 text-[11px] text-gray-400 pt-1">
                  <span className="flex items-center gap-1">
                    <ShieldCheck size={13} className="text-emerald-600" /> Certified Quality Verified
                  </span>
                  <span>•</span>
                  <span>Instant Dispatch</span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
