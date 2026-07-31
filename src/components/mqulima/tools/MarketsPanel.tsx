import { useState, useEffect, useCallback } from "react";
import { TrendingUp, TrendingDown, Search, RefreshCw, Grid, List, Filter } from "lucide-react";
import { toast } from "sonner";
import { getMarketPrices, type CommodityPriceEntry } from "@/lib/api/markets.server";
import { Link } from "@tanstack/react-router";
import { CommodityPriceCard } from "./CommodityPriceCard";

export function MarketsPanel() {
  const [commodities, setCommodities] = useState<CommodityPriceEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedCounty, setSelectedCounty] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");
  const [sortBy, setSortBy] = useState<"name" | "price">("name");
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  const fetchPrices = useCallback(async () => {
    setLoading(true);
    try {
      const dbData = await getMarketPrices();
      setCommodities(dbData || []);
    } catch (err) {
      console.error("KAMIS market fetch error:", err);
      toast.error("Unable to load KAMIS market prices. Please refresh.");
      setCommodities([]);
    } finally {
      setLoading(false);
      setLastRefresh(new Date());
    }
  }, []);

  useEffect(() => {
    fetchPrices();
  }, [fetchPrices]);

  const handleRefresh = () => {
    toast.info("Synchronizing KAMIS market price feed...");
    fetchPrices();
  };

  const tickerItems = commodities.flatMap((c) =>
    c.entries.map((e) => ({
      crop: c.name,
      unit: c.unit,
      region: e.region,
      price: e.price,
      isUp: e.price % 2 === 0,
    }))
  );

  const filtered = commodities
    .filter((c) => {
      const matchesSearch =
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.unit.toLowerCase().includes(search.toLowerCase());
      const matchesCounty =
        selectedCounty === "all" ||
        c.entries.some((e) => e.region.toLowerCase().includes(selectedCounty.toLowerCase()));
      return matchesSearch && matchesCounty;
    })
    .sort((a, b) => {
      if (sortBy === "price") {
        const aMax = Math.max(...a.entries.map((e) => e.price), 0);
        const bMax = Math.max(...b.entries.map((e) => e.price), 0);
        return bMax - aMax;
      }
      return a.name.localeCompare(b.name);
    });

  return (
    <div className="space-y-8 animate-fadeIn text-left">

      {/* ── Live Scrolling Ticker Tape (Deep Forest Green Banner) ── */}
      <div className="overflow-hidden rounded-full bg-[#0B2117] border-2 border-[#85CC14]/30 shadow-md py-2.5 px-4 relative">
        <div className="flex items-center gap-4 animate-ticker">
          {tickerItems.concat(tickerItems).map((item, idx) => (
            <div key={idx} className="flex items-center gap-2 shrink-0 px-4 text-xs font-mono">
              <span className="text-[#D4E157] font-black">{item.crop}</span>
              <span className="text-white/60">({item.region})</span>
              <span className="text-white font-bold">KES {item.price.toLocaleString()}</span>
              {item.isUp ? (
                <span className="flex items-center text-[#85CC14] font-bold">
                  <TrendingUp className="h-3 w-3 mr-0.5 text-[#85CC14]" /> +2.4%
                </span>
              ) : (
                <span className="flex items-center text-red-400 font-bold">
                  <TrendingDown className="h-3 w-3 mr-0.5 text-red-400" /> -1.1%
                </span>
              )}
              <span className="text-[#85CC14]/40 mx-2">•</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Header Controls (Deep Forest Green Aesthetic) ── */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-5 sm:p-7 rounded-2xl sm:rounded-3xl bg-gradient-to-br from-[#0B2117] via-[#0F291E] to-[#143B2B] text-white border-2 border-[#85CC14]/30 shadow-xl shadow-[#0F291E]/20 relative overflow-hidden">
        
        {/* Ambient Glow */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-[#85CC14]/10 via-transparent to-transparent pointer-events-none" />

        <div className="text-left space-y-1 w-full md:w-auto relative z-10">
          <div className="flex items-center gap-2.5 flex-wrap">
            <h3 className="text-lg sm:text-xl font-black uppercase tracking-wider text-white font-['Outfit',sans-serif]">
              WHOLESALE COMMODITY PRICE INTELLIGENCE
            </h3>
            <span className="px-3 py-0.5 rounded-full bg-[#85CC14] text-[#0B2117] text-[10px] font-mono font-black shrink-0 shadow-md">
              KAMIS LIVE FEED
            </span>
          </div>
          <p className="text-xs text-white/80">
            Direct database sync across Kenyan trading hubs •{" "}
            <span className="text-[#D4E157] font-mono font-bold">
              {lastRefresh ? `Updated ${lastRefresh.toLocaleTimeString("en-KE", { hour: "2-digit", minute: "2-digit" })}` : "KAMIS Sync Active"}
            </span>
          </p>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 flex-wrap w-full md:w-auto justify-between md:justify-start pt-2 md:pt-0 border-t md:border-t-0 border-white/10 relative z-10">
          {/* View Toggle */}
          <div className="flex items-center p-1 rounded-full bg-[#091D14] border border-[#85CC14]/40 shrink-0">
            <button
              onClick={() => setViewMode("grid")}
              className={`p-1.5 sm:p-2 rounded-full transition ${viewMode === "grid" ? "bg-[#85CC14] text-[#0B2117] shadow-sm font-bold" : "text-white/70 hover:text-white"}`}
              title="Grid View"
            >
              <Grid className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode("table")}
              className={`p-1.5 sm:p-2 rounded-full transition ${viewMode === "table" ? "bg-[#85CC14] text-[#0B2117] shadow-sm font-bold" : "text-white/70 hover:text-white"}`}
              title="Table View"
            >
              <List className="h-4 w-4" />
            </button>
          </div>

          {/* Refresh Button */}
          <button
            onClick={handleRefresh}
            disabled={loading}
            className="h-9 w-9 flex items-center justify-center rounded-full bg-[#091D14] hover:bg-[#85CC14]/20 text-[#85CC14] border border-[#85CC14]/40 transition disabled:opacity-40 shrink-0 shadow-xs"
            title="Refresh prices"
          >
            <RefreshCw className={`h-4 w-4 text-[#85CC14] ${loading ? "animate-spin" : ""}`} />
          </button>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as "name" | "price")}
            className="bg-[#091D14] border border-[#85CC14]/40 text-xs rounded-full px-3 sm:px-4 py-2 text-white outline-none focus:border-[#85CC14] font-mono font-bold shadow-xs cursor-pointer"
          >
            <option value="name" className="bg-[#0B2117] text-white">Sort: A–Z</option>
            <option value="price" className="bg-[#0B2117] text-white">Sort: Highest Price</option>
          </select>

          <div className="relative w-full sm:w-auto">
            <input
              type="text"
              placeholder="Search crop..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full sm:w-52 md:w-56 bg-[#091D14] border border-[#85CC14]/40 text-xs rounded-full pl-9 pr-4 py-2 text-white placeholder:text-white/40 outline-none focus:border-[#85CC14] font-mono shadow-xs"
            />
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-white/50" />
          </div>
        </div>
      </div>

      {/* ── County Filter Chips ────────────────────────────── */}
      <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto pb-2 scrollbar-none text-left">
        <span className="text-[11px] sm:text-xs font-mono font-bold text-[#85CC14] shrink-0 uppercase flex items-center gap-1 pr-1">
          <Filter className="h-3.5 w-3.5" /> Hubs:
        </span>
        {["all", "Nairobi", "Eldoret", "Mombasa", "Kisumu", "Nakuru"].map((county) => (
          <button
            key={county}
            onClick={() => setSelectedCounty(county)}
            className={`px-3.5 py-1.5 rounded-full text-[11px] sm:text-xs font-mono font-extrabold uppercase transition shrink-0 ${
              selectedCounty === county
                ? "bg-[#85CC14] text-[#0B2117] border border-[#85CC14] shadow-md"
                : "bg-[#0B2117] border border-[#85CC14]/30 text-white/80 hover:bg-[#143B2B] hover:text-white shadow-xs"
            }`}
          >
            {county === "all" ? "All Trading Hubs" : county}
          </button>
        ))}
      </div>

      {/* ── Grid View / Table View ────────────────────────── */}
      {loading ? (
        <div className="grid gap-4 sm:gap-6 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-64 rounded-2xl bg-[#0F291E] border-2 border-[#85CC14]/30 p-6 space-y-4 animate-pulse">
              <div className="flex justify-between items-center">
                <div className="h-4 w-20 bg-[#85CC14]/20 rounded" />
                <div className="h-4 w-24 bg-[#85CC14]/30 rounded-full" />
              </div>
              <div className="h-6 w-40 bg-[#85CC14]/20 rounded" />
              <div className="h-16 w-full bg-[#0B2117] rounded-xl" />
              <div className="space-y-2 pt-2">
                <div className="h-3 w-full bg-white/10 rounded" />
                <div className="h-3 w-full bg-white/10 rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-16 text-center text-sm font-mono text-white/70 rounded-2xl bg-[#0F291E] border-2 border-[#85CC14]/30">
          No wholesale price entries match "{search}".
        </div>
      ) : viewMode === "grid" ? (
        <div className="grid gap-4 sm:gap-6 md:grid-cols-2 lg:grid-cols-3 text-left">
          {filtered.map((c) => (
            <CommodityPriceCard key={c.id} commodity={c} />
          ))}
        </div>
      ) : (
        <div className="rounded-2xl sm:rounded-3xl bg-gradient-to-br from-[#0B2117] via-[#0F291E] to-[#143B2B] border-2 border-[#85CC14]/30 shadow-xl overflow-x-auto text-left scrollbar-none">
          <table className="w-full text-left border-collapse text-xs font-mono min-w-[600px]">
            <thead>
              <tr className="border-b border-[#85CC14]/30 bg-[#091D14] text-[#85CC14] uppercase text-[10px] tracking-wider font-extrabold">
                <th className="p-3 sm:p-4">Commodity</th>
                <th className="p-3 sm:p-4">Unit</th>
                <th className="p-3 sm:p-4">Regional Hubs</th>
                <th className="p-3 sm:p-4">Average Price</th>
                <th className="p-3 sm:p-4">High Price</th>
                <th className="p-3 sm:p-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10 text-white">
              {filtered.map((c) => {
                const prices = c.entries.map((e) => e.price);
                const maxPrice = prices.length ? Math.max(...prices) : 0;
                const avgPrice = prices.length
                  ? Math.round(prices.reduce((sum, val) => sum + val, 0) / prices.length)
                  : 0;

                return (
                  <tr key={c.id} className="hover:bg-[#143B2B]/60 transition">
                    <td className="p-3 sm:p-4 font-black text-xs sm:text-sm text-white font-['Outfit',sans-serif]">{c.name}</td>
                    <td className="p-3 sm:p-4 text-white/60">{c.unit}</td>
                    <td className="p-3 sm:p-4 text-[#D4E157] font-medium">
                      {c.entries.map((e) => e.region).join(", ")}
                    </td>
                    <td className="p-3 sm:p-4 font-black text-[#85CC14]">KES {avgPrice.toLocaleString()}</td>
                    <td className="p-3 sm:p-4 font-black text-[#85CC14]">KES {maxPrice.toLocaleString()}</td>
                    <td className="p-3 sm:p-4 text-right">
                      <Link
                        to="/community"
                        className="px-3.5 py-1.5 rounded-full bg-[#85CC14] text-[#0B2117] hover:bg-[#6FA810] font-black text-[10px] uppercase shadow-md shadow-[#85CC14]/20 transition"
                      >
                        Find Buyers
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

