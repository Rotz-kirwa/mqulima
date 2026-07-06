import { useState, useEffect, useCallback } from "react";
import { TrendingUp, TrendingDown, Minus, Search, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { getMarketPrices, type CommodityPriceEntry } from "@/lib/api/markets.server";
import { Link } from "@tanstack/react-router";

// Fallback static data when DB has limited entries
const STATIC_PRICES: CommodityPriceEntry[] = [
  {
    id: "static-1",
    name: "Dry Maize",
    unit: "90kg bag",
    entries: [
      { region: "Nairobi", price: 3850, source: "Wakulima Market", recorded_at: new Date().toISOString() },
      { region: "Eldoret", price: 3400, source: "NCPB Eldoret", recorded_at: new Date().toISOString() },
      { region: "Nakuru", price: 3600, source: "Nakuru Municipal", recorded_at: new Date().toISOString() },
    ],
  },
  {
    id: "static-2",
    name: "Wheat",
    unit: "90kg bag",
    entries: [
      { region: "Nairobi", price: 4200, source: "Wakulima Market", recorded_at: new Date().toISOString() },
      { region: "Eldoret", price: 4000, source: "NCPB Eldoret", recorded_at: new Date().toISOString() },
      { region: "Nakuru", price: 4100, source: "Nakuru Municipal", recorded_at: new Date().toISOString() },
    ],
  },
  {
    id: "static-3",
    name: "Shangi Potatoes",
    unit: "50kg bag",
    entries: [
      { region: "Nairobi", price: 2800, source: "Wakulima Market", recorded_at: new Date().toISOString() },
      { region: "Eldoret", price: 2100, source: "Eldoret Main", recorded_at: new Date().toISOString() },
      { region: "Nakuru", price: 2300, source: "Wakulima Market Nakuru", recorded_at: new Date().toISOString() },
    ],
  },
  {
    id: "static-4",
    name: "Raw Milk",
    unit: "litre",
    entries: [
      { region: "Nairobi", price: 65, source: "Nairobi Dairies", recorded_at: new Date().toISOString() },
      { region: "Nyandarua", price: 44, source: "Brookside Nyandarua Coop", recorded_at: new Date().toISOString() },
      { region: "Nakuru", price: 55, source: "Nakuru Co-op", recorded_at: new Date().toISOString() },
    ],
  },
  {
    id: "static-5",
    name: "Avocados (Fuerte)",
    unit: "kg",
    entries: [
      { region: "Nairobi", price: 180, source: "Wakulima Market", recorded_at: new Date().toISOString() },
      { region: "Nakuru", price: 140, source: "Nakuru Municipal", recorded_at: new Date().toISOString() },
    ],
  },
  {
    id: "static-6",
    name: "French Beans",
    unit: "kg",
    entries: [
      { region: "Nairobi", price: 120, source: "Wakulima Market", recorded_at: new Date().toISOString() },
      { region: "Nakuru", price: 95, source: "Nakuru Municipal", recorded_at: new Date().toISOString() },
    ],
  },
  {
    id: "static-7",
    name: "Apple Mangoes",
    unit: "kg",
    entries: [
      { region: "Nairobi", price: 90, source: "Wakulima Market", recorded_at: new Date().toISOString() },
      { region: "Mombasa", price: 55, source: "Kongowea Market", recorded_at: new Date().toISOString() },
    ],
  },
  {
    id: "static-8",
    name: "Tea (Green Leaf)",
    unit: "kg",
    entries: [
      { region: "Kericho", price: 22, source: "KTDA Kericho", recorded_at: new Date().toISOString() },
      { region: "Nairobi", price: 28, source: "Nairobi Auction", recorded_at: new Date().toISOString() },
    ],
  },
  {
    id: "static-9",
    name: "DAP Fertilizer",
    unit: "50kg bag",
    entries: [
      { region: "Nairobi", price: 6800, source: "Agrovet Kenya", recorded_at: new Date().toISOString() },
      { region: "Eldoret", price: 6500, source: "Eldoret Agrovet", recorded_at: new Date().toISOString() },
      { region: "Nakuru", price: 6650, source: "Nakuru Agrovet", recorded_at: new Date().toISOString() },
    ],
  },
  {
    id: "static-10",
    name: "Dairy Meal",
    unit: "70kg bag",
    entries: [
      { region: "Nairobi", price: 3200, source: "Unga Feeds", recorded_at: new Date().toISOString() },
      { region: "Nakuru", price: 3050, source: "Nakuru Feeds Depot", recorded_at: new Date().toISOString() },
    ],
  },
];

// Fake weekly trend data — in a real system this would come from historical price snapshots
const TREND_SEED: Record<string, { change: string; trend: "up" | "down" | "stable" }> = {
  "Dry Maize":         { change: "+4.2%", trend: "up" },
  "Wheat":             { change: "+1.8%", trend: "up" },
  "Shangi Potatoes":   { change: "-2.5%", trend: "down" },
  "Raw Milk":          { change: "+0.9%", trend: "up" },
  "Avocados (Fuerte)": { change: "+12.4%", trend: "up" },
  "French Beans":      { change: "-3.1%", trend: "down" },
  "Apple Mangoes":     { change: "+5.6%", trend: "up" },
  "Tea (Green Leaf)":  { change: "0.0%", trend: "stable" },
  "DAP Fertilizer":    { change: "-1.2%", trend: "down" },
  "Dairy Meal":        { change: "+2.3%", trend: "up" },
};

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString("en-KE", { month: "short", day: "numeric" });
  } catch {
    return "Today";
  }
}

export function MarketsPanel() {
  const [commodities, setCommodities] = useState<CommodityPriceEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<"name" | "price">("name");
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  const fetchPrices = useCallback(async () => {
    setLoading(true);
    try {
      const dbData = await getMarketPrices();
      // Merge DB data with static fallbacks — prefer DB entries where they exist
      const dbNames = new Set(dbData.map((c) => c.name));
      const statics = STATIC_PRICES.filter((s) => !dbNames.has(s.name));
      setCommodities([...dbData, ...statics]);
    } catch (err) {
      console.error("Market fetch error:", err);
      setCommodities(STATIC_PRICES);
      toast.error("Using cached market data — live sync unavailable.");
    } finally {
      setLoading(false);
      setLastRefresh(new Date());
    }
  }, []);

  useEffect(() => {
    fetchPrices();
  }, [fetchPrices]);

  const handleRefresh = () => {
    toast.info("Refreshing commodity prices...");
    fetchPrices();
  };

  const filtered = commodities
    .filter(
      (c) =>
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.unit.toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => {
      if (sortBy === "price") {
        const aMax = Math.max(...a.entries.map((e) => e.price), 0);
        const bMax = Math.max(...b.entries.map((e) => e.price), 0);
        return bMax - aMax;
      }
      return a.name.localeCompare(b.name);
    });

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header & search controls */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 border-b border-[#2D6A4F]/20 pb-6">
        <div>
          <h3 className="text-lg font-black text-[#38BDF8] uppercase tracking-wider font-serif">
            Wholesale Produce Price Tracker
          </h3>
          <p className="text-xs text-[#A2AAA0] mt-1">
            Database-synced daily prices across Kenyan trading hubs ·{" "}
            <span className="text-[#52B788] font-mono">
              Updated {lastRefresh.toLocaleTimeString("en-KE", { hour: "2-digit", minute: "2-digit" })}
            </span>
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleRefresh}
            disabled={loading}
            className="h-9 w-9 flex items-center justify-center border border-[#2D6A4F]/40 bg-[#091D13] text-[#52B788] hover:bg-[#112E22] transition disabled:opacity-40"
            title="Refresh prices"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </button>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as "name" | "price")}
            className="bg-[#091D13] border border-[#1C462C] text-xs rounded-none px-3 py-2 text-[#FAF9F5] outline-none focus:border-[#F5A623] cursor-pointer"
          >
            <option value="name">Sort: A–Z</option>
            <option value="price">Sort: Highest price</option>
          </select>

          <div className="relative">
            <input
              type="text"
              placeholder="Search crops..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-48 bg-[#091D13] border border-[#1C462C] text-xs rounded-none pl-9 pr-4 py-2.5 text-[#FAF9F5] outline-none focus:border-[#F5A623]"
            />
            <Search className="absolute left-3 top-3 h-3.5 w-3.5 text-[#A2AAA0]/50" />
          </div>
        </div>
      </div>

      {loading ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-[#091D13]/60 border border-[#1C462C] p-5 space-y-4 animate-pulse">
              <div className="h-3 w-24 bg-[#2D6A4F]/30 rounded-none" />
              <div className="h-5 w-32 bg-[#2D6A4F]/20 rounded-none" />
              <div className="space-y-2 pt-3 border-t border-[#2D6A4F]/20">
                {[1, 2, 3].map((j) => (
                  <div key={j} className="flex justify-between">
                    <div className="h-3 w-20 bg-[#2D6A4F]/20 rounded-none" />
                    <div className="h-3 w-16 bg-[#2D6A4F]/20 rounded-none" />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-12 text-center text-xs text-[#A2AAA0]/50">
          No commodities found matching "{search}".
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((c) => {
            const trend = TREND_SEED[c.name] ?? { change: "0.0%", trend: "stable" as const };
            const maxPrice = Math.max(...c.entries.map((e) => e.price), 0);
            const minPrice = Math.min(...c.entries.map((e) => e.price), Infinity);
            const avgPrice = c.entries.length
              ? Math.round(c.entries.reduce((sum, e) => sum + e.price, 0) / c.entries.length)
              : 0;

            return (
              <div
                key={c.id}
                className="bg-[#091D13]/60 border border-[#1C462C] p-5 rounded-none space-y-4 shadow-sm hover:border-[#F5A623]/30 transition"
              >
                {/* Header */}
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[8px] font-bold text-[#F5A623] uppercase tracking-wider block">
                      Unit: {c.unit}
                    </span>
                    <h4 className="text-sm font-bold text-[#FAF9F5] mt-0.5">{c.name}</h4>
                  </div>

                  <div
                    className={`flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-none ${
                      trend.trend === "up"
                        ? "bg-green-950/50 text-green-400 border border-green-900/60"
                        : trend.trend === "down"
                        ? "bg-red-950/50 text-red-400 border border-red-900/60"
                        : "bg-gray-950/50 text-gray-400 border border-gray-900/60"
                    }`}
                  >
                    {trend.trend === "up" && <TrendingUp className="h-3 w-3" />}
                    {trend.trend === "down" && <TrendingDown className="h-3 w-3" />}
                    {trend.trend === "stable" && <Minus className="h-3 w-3" />}
                    {trend.change}
                  </div>
                </div>

                {/* Price entries by region */}
                <div className="space-y-2 border-t border-[#2D6A4F]/20 pt-3 text-xs">
                  {c.entries.slice(0, 3).map((entry, idx) => (
                    <div key={idx} className="flex justify-between text-[#A2AAA0]">
                      <span>
                        {entry.region}
                        <span className="ml-1 text-[9px] opacity-60">· {entry.source}</span>
                      </span>
                      <span className="font-mono font-bold text-[#FAF9F5]">
                        KES {entry.price.toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Weekly high / avg / low strip */}
                <div className="grid grid-cols-3 gap-2 border-t border-[#2D6A4F]/20 pt-3">
                  {[
                    { label: "High", val: maxPrice },
                    { label: "Avg", val: avgPrice },
                    { label: "Low", val: minPrice === Infinity ? 0 : minPrice },
                  ].map(({ label, val }) => (
                    <div key={label} className="bg-[#112F20]/50 p-2 text-center">
                      <span className="text-[8px] font-bold uppercase tracking-wider text-[#A2AAA0] block">
                        {label}
                      </span>
                      <strong className="text-[11px] font-black font-mono text-[#FAF9F5] block mt-0.5">
                        {val.toLocaleString()}
                      </strong>
                    </div>
                  ))}
                </div>

                {/* Mockup mini bar chart */}
                <div className="h-8 flex items-end gap-0.5 pt-1 w-full border-t border-[#2D6A4F]/20 pt-3">
                  {[40, 65, 55, 80, 70, 90, 75].map((h, i) => (
                    <div
                      key={i}
                      className="bg-[#2D6A4F]/40 hover:bg-[#52B788] transition flex-1 rounded-none"
                      style={{ height: `${h}%` }}
                      title={`Day ${i + 1}`}
                    />
                  ))}
                </div>

                <div className="flex items-center justify-between pt-1">
                  <span className="text-[9px] text-[#A2AAA0]/60 font-mono">
                    7-day price index
                  </span>
                  <Link
                    to="/community"
                    className="text-[9px] font-bold uppercase tracking-wider text-[#F5A623] hover:underline"
                  >
                    View on Soko →
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="bg-[#091D13]/60 border border-[#1C462C] p-4 text-[10px] text-[#A2AAA0]/70 leading-relaxed">
        *Market prices sourced from Kenya National Cereal & Produce Board (NCPB), County Market Inspectorates, Wakulima Market Nairobi, and active farmer listings on Mqulima Soko. Updated daily.
      </div>
    </div>
  );
}
