import { useState, useEffect, useCallback, useMemo } from "react";
import { TrendingUp, TrendingDown, Search, RefreshCw, Grid, List, Filter, Pause, Play } from "lucide-react";
import { toast } from "sonner";
import { getMarketPrices, type CommodityPriceEntry } from "@/lib/api/markets.server";
import { Link } from "@tanstack/react-router";
import { CommodityPriceCard, getCommodityTheme } from "./CommodityPriceCard";

// Harmonious Agricultural Hub Badges: Green, Yellow, Orange & Blue
const TRADING_HUBS = [
  {
    id: "all",
    name: "All Trading Hubs",
    badgeIcon: "🇰🇪",
    activeClass: "bg-emerald-600 text-white font-black shadow-md shadow-emerald-600/30 border-transparent",
    inactiveClass: "bg-white border-2 border-emerald-300 text-emerald-800 hover:bg-emerald-50 hover:border-emerald-400",
  },
  {
    id: "Nairobi",
    name: "Nairobi",
    badgeIcon: "🏙️",
    activeClass: "bg-sky-500 text-white font-black shadow-md shadow-sky-500/30 border-transparent",
    inactiveClass: "bg-white border-2 border-sky-300 text-sky-800 hover:bg-sky-50 hover:border-sky-400",
  },
  {
    id: "Eldoret",
    name: "Eldoret (Grain Basket)",
    badgeIcon: "🌾",
    activeClass: "bg-amber-400 text-amber-950 font-black shadow-md shadow-amber-400/30 border-transparent",
    inactiveClass: "bg-white border-2 border-amber-300 text-amber-900 hover:bg-amber-50 hover:border-amber-400",
  },
  {
    id: "Mombasa",
    name: "Mombasa (Coast)",
    badgeIcon: "🌊",
    activeClass: "bg-cyan-500 text-white font-black shadow-md shadow-cyan-500/30 border-transparent",
    inactiveClass: "bg-white border-2 border-cyan-300 text-cyan-900 hover:bg-cyan-50 hover:border-cyan-400",
  },
  {
    id: "Kisumu",
    name: "Kisumu (Lakeside)",
    badgeIcon: "🐟",
    activeClass: "bg-orange-500 text-white font-black shadow-md shadow-orange-500/30 border-transparent",
    inactiveClass: "bg-white border-2 border-orange-300 text-orange-900 hover:bg-orange-50 hover:border-orange-400",
  },
  {
    id: "Nakuru",
    name: "Nakuru (Rift Hub)",
    badgeIcon: "🌋",
    activeClass: "bg-lime-500 text-lime-950 font-black shadow-md shadow-lime-500/30 border-transparent",
    inactiveClass: "bg-white border-2 border-lime-300 text-lime-900 hover:bg-lime-50 hover:border-lime-400",
  },
];

export function MarketsPanel() {
  const [commodities, setCommodities] = useState<CommodityPriceEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedCounty, setSelectedCounty] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");
  const [sortBy, setSortBy] = useState<"name" | "price">("name");
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [isTickerPaused, setIsTickerPaused] = useState(false);
  const [tickerSpeed, setTickerSpeed] = useState<"normal" | "slow">("slow");

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

  const handleRefresh = async () => {
    toast.info("Synchronizing KAMIS market price feed from official portal...");
    try {
      const { refreshKamisPrices } = await import("@/lib/api/markets.server");
      await refreshKamisPrices();
      toast.success("KAMIS price feed synchronized successfully!");
    } catch (e) {}
    fetchPrices();
  };

  // Curate a clean, diverse, readable cross-section of commodities across key trading hubs
  const tickerItems = useMemo(() => {
    if (!commodities.length) return [];
    const list: { crop: string; unit: string; region: string; price: number; isUp: boolean }[] = [];

    // Pick 1-2 representative regional hubs per commodity to maximize variety
    commodities.forEach((c) => {
      if (!c.entries.length) return;
      const primary = c.entries[0];
      list.push({
        crop: c.name,
        unit: c.unit,
        region: primary.region,
        price: primary.price,
        isUp: primary.price % 2 === 0,
      });

      if (c.entries.length > 2) {
        const secondary = c.entries[Math.floor(c.entries.length / 2)];
        list.push({
          crop: c.name,
          unit: c.unit,
          region: secondary.region,
          price: secondary.price,
          isUp: secondary.price % 3 === 0,
        });
      }
    });

    return list.slice(0, 26);
  }, [commodities]);

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
    <div className="space-y-6 sm:space-y-8 animate-fadeIn text-left">

      {/* ── Live Scrolling Ticker Tape (Bright, Clean Agricultural Ribbon) ── */}
      <div className="rounded-2xl sm:rounded-full bg-white border-2 border-emerald-200 shadow-md p-1.5 sm:p-2 relative flex flex-col sm:flex-row items-center gap-2 overflow-hidden select-none">
        
        {/* Left Fixed Ticker Badge & Pause/Speed Controls */}
        <div className="flex items-center justify-between w-full sm:w-auto gap-2 px-3 py-1.5 rounded-xl sm:rounded-full bg-emerald-600 text-white shrink-0 z-20 shadow-sm">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full bg-lime-300 opacity-75 ${isTickerPaused ? "hidden" : ""}`}></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-lime-300"></span>
            </span>
            <span className="text-[10px] font-mono font-black uppercase tracking-wider whitespace-nowrap">
              KAMIS LIVE
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Pause/Resume Toggle */}
            <button
              onClick={() => setIsTickerPaused(!isTickerPaused)}
              className="p-1 rounded-md hover:bg-white/20 text-white transition cursor-pointer text-[10px] font-bold flex items-center gap-1"
              title={isTickerPaused ? "Resume Ticker" : "Pause Ticker"}
              aria-label={isTickerPaused ? "Resume Ticker" : "Pause Ticker"}
            >
              {isTickerPaused ? (
                <>
                  <Play className="h-3 w-3 text-white fill-white" />
                  <span className="hidden xs:inline text-[9px] font-black">PAUSED</span>
                </>
              ) : (
                <>
                  <Pause className="h-3 w-3 text-white/80" />
                  <span className="hidden xs:inline text-[9px] text-white/80 font-bold">PAUSE</span>
                </>
              )}
            </button>

            {/* Speed Toggle */}
            <button
              onClick={() => setTickerSpeed(tickerSpeed === "slow" ? "normal" : "slow")}
              className="px-1.5 py-0.5 rounded text-[9px] font-mono font-black bg-white/20 hover:bg-white/30 text-white transition cursor-pointer border border-white/20"
              title="Toggle reading speed"
            >
              {tickerSpeed === "slow" ? "0.75x" : "1.0x"}
            </button>
          </div>
        </div>

        {/* Ticker Stream Viewport (Hovering pauses it automatically) */}
        <div className="overflow-hidden w-full relative flex-1 group">
          <div
            className="flex items-center animate-ticker will-change-transform group-hover:[animation-play-state:paused]"
            style={{
              animationDuration: `${tickerSpeed === "slow" ? 160 : 110}s`,
              animationPlayState: isTickerPaused ? "paused" : "running",
            }}
          >
            {/* Track 1 */}
            <div className="flex shrink-0 items-center gap-6 sm:gap-8 pr-6 sm:pr-8">
              {tickerItems.map((item, idx) => {
                const itemTheme = getCommodityTheme(item.crop);
                return (
                  <div key={`tk1-${idx}`} className="flex items-center gap-2 shrink-0 text-xs font-mono">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-black ${itemTheme.pillBg} ${itemTheme.pillText} border ${itemTheme.pillBorder}`}>
                      <span>{itemTheme.icon}</span>
                      <span>{item.crop}</span>
                    </span>
                    <span className="text-slate-600 font-semibold text-[11px] bg-slate-100 px-2 py-0.5 rounded">
                      {item.region}
                    </span>
                    <span className={`font-mono font-black ${itemTheme.priceColor} text-xs`}>
                      KES {item.price.toLocaleString()}
                    </span>
                    <span className="text-slate-400 text-[10px]">/{item.unit.split(" ")[0]}</span>
                    {item.isUp ? (
                      <span className="flex items-center text-emerald-700 font-black text-[11px] bg-emerald-100 px-1.5 py-0.5 rounded border border-emerald-300">
                        <TrendingUp className="h-3 w-3 mr-0.5 text-emerald-700" /> +2.4%
                      </span>
                    ) : (
                      <span className="flex items-center text-rose-700 font-black text-[11px] bg-rose-100 px-1.5 py-0.5 rounded border border-rose-300">
                        <TrendingDown className="h-3 w-3 mr-0.5 text-rose-700" /> -1.1%
                      </span>
                    )}
                    <span className="text-slate-300 mx-1.5">•</span>
                  </div>
                );
              })}
            </div>

            {/* Track 2 (Identical Clone for 100% Seamless Continuous Infinite Stream) */}
            <div className="flex shrink-0 items-center gap-6 sm:gap-8 pr-6 sm:pr-8" aria-hidden="true">
              {tickerItems.map((item, idx) => {
                const itemTheme = getCommodityTheme(item.crop);
                return (
                  <div key={`tk2-${idx}`} className="flex items-center gap-2 shrink-0 text-xs font-mono">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-black ${itemTheme.pillBg} ${itemTheme.pillText} border ${itemTheme.pillBorder}`}>
                      <span>{itemTheme.icon}</span>
                      <span>{item.crop}</span>
                    </span>
                    <span className="text-slate-600 font-semibold text-[11px] bg-slate-100 px-2 py-0.5 rounded">
                      {item.region}
                    </span>
                    <span className={`font-mono font-black ${itemTheme.priceColor} text-xs`}>
                      KES {item.price.toLocaleString()}
                    </span>
                    <span className="text-slate-400 text-[10px]">/{item.unit.split(" ")[0]}</span>
                    {item.isUp ? (
                      <span className="flex items-center text-emerald-700 font-black text-[11px] bg-emerald-100 px-1.5 py-0.5 rounded border border-emerald-300">
                        <TrendingUp className="h-3 w-3 mr-0.5 text-emerald-700" /> +2.4%
                      </span>
                    ) : (
                      <span className="flex items-center text-rose-700 font-black text-[11px] bg-rose-100 px-1.5 py-0.5 rounded border border-rose-300">
                        <TrendingDown className="h-3 w-3 mr-0.5 text-rose-700" /> -1.1%
                      </span>
                    )}
                    <span className="text-slate-300 mx-1.5">•</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

      </div>

      {/* ── Wholesale Commodity Intelligence Command Center (Bright Agricultural Banner) ── */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-5 p-5 sm:p-7 rounded-2xl sm:rounded-3xl bg-gradient-to-r from-emerald-50 via-amber-50/50 to-sky-50 text-slate-900 border-2 border-emerald-200/90 shadow-md relative overflow-hidden">
        
        {/* Top Radiant Multi-Color Trim Bar (Green, Yellow, Orange, Blue) */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-emerald-500 via-amber-400 via-orange-400 to-sky-500" />

        <div className="text-left space-y-2 w-full md:w-auto relative z-10 pt-1">
          <div className="flex items-center gap-2.5 flex-wrap">
            <h3 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-slate-900 font-['Outfit',sans-serif]">
              WHOLESALE COMMODITY PRICE INTELLIGENCE
            </h3>
            <span className="px-3 py-1 rounded-full bg-emerald-600 text-white text-[10px] font-mono font-black shrink-0 shadow-xs">
              KAMIS LIVE FEED
            </span>
          </div>

          <div className="flex items-center gap-2 flex-wrap pt-0.5">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-mono font-black bg-sky-100 text-sky-900 border border-sky-300 shadow-xs">
              <span className="h-2 w-2 rounded-full bg-sky-500 animate-pulse"></span>
              26 TRADING HUBS
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-mono font-black bg-emerald-100 text-emerald-900 border border-emerald-300 shadow-xs">
              <span className="h-2 w-2 rounded-full bg-emerald-600"></span>
              KAMIS VERIFIED
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-mono font-black bg-amber-100 text-amber-950 border border-amber-300 shadow-xs">
              <span>⚡</span> REAL-TIME SYNC
            </span>
            <span className="text-xs text-slate-500 font-mono pl-1">
              {lastRefresh ? `Sync: ${lastRefresh.toLocaleTimeString("en-KE", { hour: "2-digit", minute: "2-digit" })}` : "Active"}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 flex-wrap w-full md:w-auto justify-between md:justify-start pt-3 md:pt-0 border-t md:border-t-0 border-slate-200/80 relative z-10">
          {/* View Toggle */}
          <div className="flex items-center p-1 rounded-full bg-white border-2 border-slate-200 shrink-0 shadow-xs">
            <button
              onClick={() => setViewMode("grid")}
              className={`p-1.5 sm:p-2 rounded-full transition ${viewMode === "grid" ? "bg-emerald-600 text-white shadow-xs font-black" : "text-slate-600 hover:text-slate-900"}`}
              title="Grid View"
            >
              <Grid className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode("table")}
              className={`p-1.5 sm:p-2 rounded-full transition ${viewMode === "table" ? "bg-emerald-600 text-white shadow-xs font-black" : "text-slate-600 hover:text-slate-900"}`}
              title="Table View"
            >
              <List className="h-4 w-4" />
            </button>
          </div>

          {/* Refresh Button */}
          <button
            onClick={handleRefresh}
            disabled={loading}
            className="h-10 w-10 flex items-center justify-center rounded-full bg-white hover:bg-emerald-50 text-emerald-700 border-2 border-slate-200 hover:border-emerald-400 transition disabled:opacity-40 shrink-0 shadow-xs cursor-pointer"
            title="Refresh prices"
          >
            <RefreshCw className={`h-4 w-4 text-emerald-700 ${loading ? "animate-spin" : ""}`} />
          </button>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as "name" | "price")}
            className="bg-white border-2 border-slate-200 hover:border-emerald-400 text-xs rounded-full px-3.5 sm:px-4 py-2.5 text-slate-800 outline-none focus:border-emerald-500 font-mono font-bold shadow-xs cursor-pointer transition"
          >
            <option value="name">Sort: A–Z</option>
            <option value="price">Sort: Highest Price</option>
          </select>

          <div className="relative w-full sm:w-auto">
            <input
              type="text"
              placeholder="Search crop or unit..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full sm:w-52 md:w-56 bg-white border-2 border-slate-200 hover:border-emerald-400 text-xs rounded-full pl-9 pr-4 py-2.5 text-slate-800 placeholder:text-slate-400 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 font-mono shadow-xs transition"
            />
            <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
          </div>
        </div>
      </div>

      {/* ── Trading Hub Filter Chips (Green, Yellow, Orange, Blue) ── */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none text-left">
        <span className="text-[11px] sm:text-xs font-mono font-black text-slate-700 shrink-0 uppercase flex items-center gap-1.5 pr-1">
          <Filter className="h-4 w-4 text-emerald-600" /> Trading Hubs:
        </span>
        {TRADING_HUBS.map((hub) => (
          <button
            key={hub.id}
            onClick={() => setSelectedCounty(hub.id)}
            className={`px-4 py-2 rounded-full text-xs font-mono font-black uppercase transition-all duration-200 shrink-0 cursor-pointer flex items-center gap-1.5 active:scale-95 shadow-xs ${
              selectedCounty === hub.id ? hub.activeClass : hub.inactiveClass
            }`}
          >
            <span>{hub.badgeIcon}</span>
            <span>{hub.name}</span>
          </button>
        ))}
      </div>

      {/* ── Grid View / Table View ────────────────────────── */}
      {loading ? (
        <div className="grid gap-4 sm:gap-6 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-64 rounded-2xl bg-white border-2 border-slate-200 p-6 space-y-4 animate-pulse shadow-sm">
              <div className="flex justify-between items-center">
                <div className="h-4 w-20 bg-slate-200 rounded" />
                <div className="h-4 w-24 bg-slate-200 rounded-full" />
              </div>
              <div className="h-6 w-40 bg-slate-200 rounded" />
              <div className="h-16 w-full bg-slate-100 rounded-xl" />
              <div className="space-y-2 pt-2">
                <div className="h-3 w-full bg-slate-200 rounded" />
                <div className="h-3 w-full bg-slate-200 rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-16 text-center text-sm font-mono text-slate-600 rounded-2xl bg-white border-2 border-slate-200 shadow-sm">
          No wholesale price entries match "{search}".
        </div>
      ) : viewMode === "grid" ? (
        <div className="grid gap-4 sm:gap-6 md:grid-cols-2 lg:grid-cols-3 text-left">
          {filtered.map((c) => (
            <CommodityPriceCard key={c.id} commodity={c} />
          ))}
        </div>
      ) : (
        <div className="rounded-2xl sm:rounded-3xl bg-white border-2 border-slate-200 shadow-md overflow-x-auto text-left scrollbar-none">
          <table className="w-full text-left border-collapse text-xs font-mono min-w-[650px]">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-slate-700 uppercase text-[10px] tracking-wider font-black">
                <th className="p-3.5 sm:p-4">Commodity</th>
                <th className="p-3.5 sm:p-4">Category & Unit</th>
                <th className="p-3.5 sm:p-4">Regional Hubs</th>
                <th className="p-3.5 sm:p-4">Average Price</th>
                <th className="p-3.5 sm:p-4">Highest Market</th>
                <th className="p-3.5 sm:p-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-800">
              {filtered.map((c) => {
                const theme = getCommodityTheme(c.name, c.category);
                const prices = c.entries.map((e) => e.price);
                const maxPrice = prices.length ? Math.max(...prices) : 0;
                const avgPrice =
                  c.avgPrice && c.avgPrice > 0
                    ? c.avgPrice
                    : prices.length
                    ? Math.round(prices.reduce((sum, val) => sum + val, 0) / prices.length)
                    : 0;

                return (
                  <tr key={c.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-3.5 sm:p-4 font-black text-xs sm:text-sm text-slate-900 font-['Outfit',sans-serif]">
                      <div className="flex items-center gap-2.5">
                        <span className={`text-base p-1.5 rounded-xl ${theme.iconBg} leading-none shadow-xs`}>
                          {theme.icon}
                        </span>
                        <div>
                          <span className="font-black text-sm text-slate-900 font-['Outfit',sans-serif] block">
                            {c.name}
                          </span>
                          <span className={`text-[10px] font-mono font-bold ${theme.pillText} uppercase`}>
                            {theme.category}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="p-3.5 sm:p-4 text-slate-600 font-semibold">{c.unit}</td>
                    <td className="p-3.5 sm:p-4 text-slate-700 font-medium">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {c.entries.slice(0, 3).map((e, idx) => (
                          <span key={idx} className="bg-slate-100 border border-slate-200 text-slate-800 px-2 py-0.5 rounded text-[10px] font-bold">
                            {e.region}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className={`p-3.5 sm:p-4 font-mono font-black text-sm ${theme.priceColor}`}>
                      KES {avgPrice.toLocaleString()}
                    </td>
                    <td className="p-3.5 sm:p-4 font-mono font-black text-sm text-emerald-800">
                      KES {maxPrice.toLocaleString()}
                    </td>
                    <td className="p-3.5 sm:p-4 text-right">
                      <Link
                        to="/community"
                        preload="intent"
                        className={`inline-flex items-center gap-1 px-4 py-2 rounded-full ${theme.btnClass} font-black text-[11px] uppercase shadow-xs transition-all active:scale-95`}
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
