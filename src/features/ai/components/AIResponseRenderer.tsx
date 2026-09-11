import React, { useMemo } from "react";
import { Volume2, VolumeX, ShoppingCart, ExternalLink, CheckCircle2, Sparkles } from "lucide-react";
import { useCart } from "@/lib/cart-context";
import { toast } from "sonner";

interface ProductRecommendation {
  productId: string;
  slug: string;
  name: string;
  price: number;
  imageUrl?: string;
  category?: string;
  inStock?: boolean;
  reason?: string;
  relevanceScore?: number;
}

interface Props {
  content: string;
  isSpeaking: boolean;
  onToggleSpeech: () => void;
}

export const AIResponseRenderer: React.FC<Props> = ({
  content,
  isSpeaking,
  onToggleSpeech,
}) => {
  const { addToCart } = useCart();

  // Extract structured recommendations block if present
  const { cleanContent, recommendations } = useMemo(() => {
    if (!content) return { cleanContent: "", recommendations: [] };

    const startTag = "<!--MKULIMA_RECOMMENDATIONS_START-->";
    const endTag = "<!--MKULIMA_RECOMMENDATIONS_END-->";

    const startIndex = content.indexOf(startTag);
    const endIndex = content.indexOf(endTag);

    if (startIndex !== -1 && endIndex !== -1 && endIndex > startIndex) {
      const textBefore = content.substring(0, startIndex);
      const jsonText = content.substring(startIndex + startTag.length, endIndex).trim();
      const textAfter = content.substring(endIndex + endTag.length);

      let recs: ProductRecommendation[] = [];
      try {
        recs = JSON.parse(jsonText);
        if (!Array.isArray(recs)) recs = [];
      } catch (e) {
        console.warn("Failed to parse AI product recommendations JSON:", e);
      }

      return {
        cleanContent: `${textBefore.trim()}\n${textAfter.trim()}`.trim(),
        recommendations: recs,
      };
    }

    return { cleanContent: content, recommendations: [] };
  }, [content]);

  const handleAddToCart = (rec: ProductRecommendation) => {
    addToCart({
      id: rec.productId,
      name: rec.name,
      slug: rec.slug,
      price: rec.price,
      image: rec.imageUrl || "/placeholder-product.png",
      category: rec.category || "Inputs & Agrochemicals",
      stock: 100,
      unit: "Unit",
    } as any);
    toast.success(`Added ${rec.name} to your cart!`);
  };

  const renderFormattedContent = (rawText: string) => {
    if (!rawText) return null;

    const lines = rawText.split("\n");
    return lines.map((line, idx) => {
      let formattedLine: React.ReactNode = line;
      if (line.includes("**")) {
        const parts = line.split("**");
        formattedLine = parts.map((part, i) =>
          i % 2 === 1 ? (
            <strong key={i} className="text-[#4CAF50] font-semibold">
              {part}
            </strong>
          ) : (
            part
          )
        );
      }

      if (line.startsWith("### ")) {
        return (
          <h3 key={idx} className="text-base font-bold text-[#4CAF50] mt-3 mb-1">
            {line.replace("### ", "")}
          </h3>
        );
      }
      if (line.startsWith("## ")) {
        return (
          <h2 key={idx} className="text-lg font-bold text-emerald-400 mt-4 mb-2">
            {line.replace("## ", "")}
          </h2>
        );
      }
      if (line.startsWith("# ")) {
        return (
          <h1 key={idx} className="text-xl font-extrabold text-emerald-300 mt-4 mb-2">
            {line.replace("# ", "")}
          </h1>
        );
      }
      if (line.startsWith("- ") || line.startsWith("* ")) {
        return (
          <li key={idx} className="ml-4 list-disc text-xs text-white/90 my-0.5">
            {formattedLine}
          </li>
        );
      }

      return (
        <p key={idx} className="text-xs text-white/90 leading-relaxed my-1">
          {formattedLine}
        </p>
      );
    });
  };

  return (
    <div className="relative group">
      <div className="pr-8 space-y-1">{renderFormattedContent(cleanContent)}</div>

      {/* Authoritative Mkulima Product Recommendation Cards */}
      {recommendations.length > 0 && (
        <div className="mt-4 pt-3 border-t border-emerald-900/40">
          <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-400 mb-2.5">
            <Sparkles className="h-3.5 w-3.5 text-[#85CC14]" />
            <span>Verified Store Catalog Recommendations</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {recommendations.map((rec) => (
              <div
                key={rec.productId || rec.slug}
                className="flex flex-col justify-between p-3 rounded-xl bg-gradient-to-br from-[#0D2419] to-[#08150E] border border-emerald-500/20 hover:border-emerald-500/40 shadow-sm transition-all text-white"
              >
                <div>
                  <div className="flex items-start gap-2.5 mb-2">
                    <img
                      src={rec.imageUrl || "/placeholder-product.png"}
                      alt={rec.name}
                      className="w-12 h-12 rounded-lg object-cover bg-black/40 border border-white/10 shrink-0"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = "/placeholder-product.png";
                      }}
                    />
                    <div className="min-w-0 flex-1">
                      <h4 className="text-xs font-bold text-white truncate" title={rec.name}>
                        {rec.name}
                      </h4>
                      <p className="text-[11px] text-emerald-400 font-semibold mt-0.5">
                        KES {Number(rec.price || 0).toLocaleString()}
                      </p>
                      <div className="flex items-center gap-1 mt-1">
                        <CheckCircle2 className="h-3 w-3 text-emerald-400 shrink-0" />
                        <span className="text-[10px] text-white/70">In Stock on Mkulima</span>
                      </div>
                    </div>
                  </div>

                  {rec.reason && (
                    <p className="text-[11px] text-white/80 line-clamp-2 italic mb-3 bg-white/5 p-1.5 rounded border border-white/5">
                      "{rec.reason}"
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <a
                    href={`/shop/product/${rec.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 flex items-center justify-center gap-1 py-1.5 px-2 rounded-lg bg-white/10 hover:bg-white/20 text-white text-[11px] font-medium transition-colors"
                  >
                    <span>View Product</span>
                    <ExternalLink className="h-3 w-3 text-white/70" />
                  </a>

                  <button
                    onClick={() => handleAddToCart(rec)}
                    className="flex items-center justify-center gap-1 py-1.5 px-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-semibold transition-colors shadow"
                    title="Add to cart"
                  >
                    <ShoppingCart className="h-3 w-3" />
                    <span>Add</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <button
        onClick={onToggleSpeech}
        title={isSpeaking ? "Stop Speaking" : "Listen to Response"}
        className="absolute top-0 right-0 p-1 rounded-md text-white/40 hover:text-emerald-400 hover:bg-white/5 transition-colors"
      >
        {isSpeaking ? (
          <VolumeX className="h-3.5 w-3.5 text-amber-400 animate-pulse" />
        ) : (
          <Volume2 className="h-3.5 w-3.5" />
        )}
      </button>
    </div>
  );
};
