import React, { useState } from "react";
import { Plus, Search, ShoppingBag, Filter } from "lucide-react";
import { SokoListing } from "../types/community.types";
import { ProductCard } from "./ProductCard";
import { communityService } from "../services/community.service";
import { toast } from "sonner";

interface Props {
  listings: SokoListing[];
  currentUser: any;
  onRefresh: () => void;
}

export const SokoMarketplace: React.FC<Props> = ({
  listings,
  currentUser,
  onRefresh,
}) => {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Listing creation form fields
  const [commodity, setCommodity] = useState("");
  const [type, setType] = useState<"crop" | "livestock" | "fruit">("crop");
  const [price, setPrice] = useState("");
  const [quantity, setQuantity] = useState("");
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const [phone, setPhone] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCreateListing = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commodity || !price || !quantity || !location) {
      toast.error("Please fill in all required commodity fields.");
      return;
    }

    setIsSubmitting(true);
    try {
      await communityService.addSokoListing({
        commodity,
        type,
        price: Number(price),
        quantity,
        location,
        description,
        phone,
      });
      toast.success("Listing posted on Mqulima Soko!");
      setCommodity("");
      setPrice("");
      setQuantity("");
      setDescription("");
      setIsModalOpen(false);
      onRefresh();
    } catch (e: any) {
      console.error(e);
      toast.error(e?.message || "Failed to post listing.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredListings = listings.filter(item => {
    const matchesSearch =
      item.commodity.toLowerCase().includes(search.toLowerCase()) ||
      item.location.toLowerCase().includes(search.toLowerCase()) ||
      item.description.toLowerCase().includes(search.toLowerCase());
    const matchesType = typeFilter === "all" || item.type === typeFilter;
    return matchesSearch && matchesType;
  });

  return (
    <div className="space-y-4">
      {/* Header controls */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-[#0C1510] p-4 rounded-2xl border border-[#1B3627]">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-white/40" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search Soko produce (e.g. Maize, Dairy Cows, Fertilizer)..."
            className="w-full pl-9 pr-4 py-2 bg-black/40 border border-[#1B3627] rounded-xl text-xs text-white placeholder-white/40 outline-none focus:border-[#4CAF50] transition-colors"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="bg-black/40 border border-[#1B3627] rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-[#4CAF50]"
          >
            <option value="all">All Produce Types</option>
            <option value="crop">Crops & Grains</option>
            <option value="livestock">Livestock & Poultry</option>
            <option value="fruit">Fruits & Vegetables</option>
          </select>

          <button
            onClick={() => setIsModalOpen(!isModalOpen)}
            className="flex items-center gap-1.5 bg-[#2D6A4F] text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-[#224f3b] transition-colors shrink-0 shadow-md"
          >
            <Plus className="h-4 w-4" />
            <span>Sell Produce</span>
          </button>
        </div>
      </div>

      {/* Modal / Inline form for creating Soko listing */}
      {isModalOpen && (
        <form onSubmit={handleCreateListing} className="bg-[#0C1510] border border-[#2D6A4F]/60 p-4 sm:p-5 rounded-2xl space-y-3">
          <h3 className="text-sm font-bold text-white">Post Commodity to Mqulima Soko</h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input
              type="text"
              placeholder="Commodity Name (e.g. Yellow Maize, Dairy Cow)"
              value={commodity}
              onChange={(e) => setCommodity(e.target.value)}
              className="bg-black/40 border border-[#1B3627] rounded-xl p-2.5 text-xs text-white outline-none focus:border-[#4CAF50]"
            />
            <select
              value={type}
              onChange={(e) => setType(e.target.value as any)}
              className="bg-black/40 border border-[#1B3627] rounded-xl p-2.5 text-xs text-white outline-none focus:border-[#4CAF50]"
            >
              <option value="crop">Crop</option>
              <option value="livestock">Livestock</option>
              <option value="fruit">Fruit / Vegetable</option>
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <input
              type="number"
              placeholder="Price (KES)"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="bg-black/40 border border-[#1B3627] rounded-xl p-2.5 text-xs text-white outline-none focus:border-[#4CAF50]"
            />
            <input
              type="text"
              placeholder="Quantity (e.g. 50 Bags, 10 Head)"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="bg-black/40 border border-[#1B3627] rounded-xl p-2.5 text-xs text-white outline-none focus:border-[#4CAF50]"
            />
            <input
              type="text"
              placeholder="Location (e.g. Eldoret)"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="bg-black/40 border border-[#1B3627] rounded-xl p-2.5 text-xs text-white outline-none focus:border-[#4CAF50]"
            />
          </div>

          <textarea
            rows={2}
            placeholder="Describe commodity grade, variety, packaging, and pickup details..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full bg-black/40 border border-[#1B3627] rounded-xl p-2.5 text-xs text-white outline-none focus:border-[#4CAF50] resize-none"
          />

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 rounded-xl text-xs text-white/70 hover:bg-white/10"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="bg-[#2D6A4F] text-white px-5 py-2 rounded-xl text-xs font-bold hover:bg-[#224f3b] disabled:opacity-50"
            >
              {isSubmitting ? "Publishing..." : "Publish Listing"}
            </button>
          </div>
        </form>
      )}

      {/* Grid of Products */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredListings.length === 0 ? (
          <div className="col-span-full bg-[#0C1510] border border-[#1B3627] rounded-2xl p-8 text-center text-white/50 text-xs">
            No marketplace items found matching your filters.
          </div>
        ) : (
          filteredListings.map((listing) => (
            <ProductCard key={listing.id} listing={listing} />
          ))
        )}
      </div>
    </div>
  );
};
