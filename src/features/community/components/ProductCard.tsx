import React from "react";
import { MapPin, Phone, ShoppingBag, ShieldCheck } from "lucide-react";
import { SokoListing } from "../types/community.types";
import { resolveAvatar } from "@/shared/utils/avatar.utils";
import { toast } from "sonner";

interface Props {
  listing: SokoListing;
}

export const ProductCard: React.FC<Props> = React.memo(({ listing }) => {
  const handleContactSeller = () => {
    const phone = listing.phone || listing.author.phone;
    if (phone) {
      window.open(`https://wa.me/${phone.replace(/[^0-9]/g, "")}`, "_blank");
    } else {
      toast.info(`Contacting seller ${listing.author.name} via Mqulima Konnekt...`);
    }
  };

  return (
    <div className="flex flex-col justify-between rounded-2xl border border-[#1B3627] bg-[#0C1510] p-4 shadow-lg hover:border-[#2D6A4F]/60 transition-all">
      <div>
        {listing.images && listing.images.length > 0 ? (
          <img
            src={listing.images[0]}
            alt={listing.commodity}
            className="h-44 w-full object-cover rounded-xl border border-white/10 mb-3"
          />
        ) : (
          <div className="h-44 w-full bg-white/5 rounded-xl border border-white/10 flex items-center justify-center text-white/30 text-xs mb-3">
            No image preview
          </div>
        )}

        <div className="flex items-start justify-between gap-2">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
              {listing.type}
            </span>
            <h3 className="text-sm font-bold text-white mt-1.5">{listing.commodity}</h3>
          </div>
          <span className="text-sm font-extrabold text-[#4CAF50]">
            KES {listing.price.toLocaleString()}
          </span>
        </div>

        <p className="text-xs text-white/70 mt-2 line-clamp-2 leading-relaxed">{listing.description}</p>
      </div>

      <div className="mt-4 pt-3 border-t border-[#1B3627] space-y-2">
        <div className="flex items-center justify-between text-[11px] text-white/60">
          <span className="flex items-center gap-1">
            <MapPin className="h-3 w-3 text-emerald-400" />
            {listing.location}
          </span>
          <span className="font-semibold text-white/80">{listing.quantity} available</span>
        </div>

        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-2">
            <img
              src={resolveAvatar(listing.author.avatarUrl, listing.author.name)}
              alt={listing.author.name}
              className="h-6 w-6 rounded-full object-cover"
            />
            <span className="text-xs text-white/80 truncate max-w-[100px]">{listing.author.name}</span>
          </div>

          <button
            onClick={handleContactSeller}
            className="flex items-center gap-1 bg-[#2D6A4F] text-white px-3 py-1.5 rounded-xl text-xs font-bold hover:bg-[#224f3b] transition-colors"
          >
            <Phone className="h-3 w-3" />
            Contact
          </button>
        </div>
      </div>
    </div>
  );
});
ProductCard.displayName = "ProductCard";
