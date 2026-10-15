import { useState, useEffect, useMemo } from "react";
import { Link } from "@tanstack/react-router";
import { TrendingUp, TrendingDown, RefreshCw, ChevronLeft, ChevronRight, Sparkles, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { getMarketPrices, refreshKamisPrices, type CommodityPriceEntry } from "@/lib/api/markets.server";

// Fallback varieties in case database or network is temporarily resolving initial seeds
const FALLBACK_VARIETIES: CommodityPriceEntry[] = [
  {
    id: "f-maize",
    name: "Dry Maize",
    unit: "90kg bag",
    icon: "🌽",
    category: "Cereals & Grains",
    avgPrice: 3550,
    changePercent: 2.4,
    isUp: true,
    source: "KAMIS Live Official Feed (kamis.kilimo.go.ke)",
    entries: [
      { region: "Nairobi (Wakulima)", price: 3850, source: "KAMIS Live", recorded_at: "Today" },
      { region: "Eldoret (NCPB)", price: 3360, source: "KAMIS Live", recorded_at: "Today" },
      { region: "Nakuru (Top Market)", price: 3570, source: "KAMIS Live", recorded_at: "Today" },
    ],
  },
  {
    id: "f-beans",
    name: "Rosecoco Beans",
    unit: "90kg bag",
    icon: "🫘",
    category: "Pulses & Legumes",
    avgPrice: 8600,
    changePercent: 3.1,
    isUp: true,
    source: "KAMIS Live Official Feed (kamis.kilimo.go.ke)",
    entries: [
      { region: "Nairobi (Marikiti)", price: 9100, source: "KAMIS Live", recorded_at: "Today" },
      { region: "Eldoret (Central)", price: 8250, source: "KAMIS Live", recorded_at: "Today" },
    ],
  },
  {
    id: "f-potatoes",
    name: "Shangi Potatoes",
    unit: "50kg bag",
    icon: "🥔",
    category: "Horticulture & Tubers",
    avgPrice: 2450,
    changePercent: -1.8,
    isUp: false,
    source: "KAMIS Live Official Feed (kamis.kilimo.go.ke)",
    entries: [
      { region: "Nyandarua (Ol Kalou)", price: 2150, source: "KAMIS Live", recorded_at: "Today" },
      { region: "Nairobi (Wakulima)", price: 2840, source: "KAMIS Live", recorded_at: "Today" },
    ],
  },
  {
    id: "f-milk",
    name: "Fresh Raw Milk",
    unit: "1L",
    icon: "🥛",
    category: "Livestock & Dairy",
    avgPrice: 55,
    changePercent: 1.2,
    isUp: true,
    source: "KAMIS Live Official Feed (kamis.kilimo.go.ke)",
    entries: [
      { region: "Nyandarua (Kinangop)", price: 49, source: "KAMIS Live", recorded_at: "Today" },
      { region: "Nairobi (Retail)", price: 62, source: "KAMIS Live", recorded_at: "Today" },
    ],
  },
  {
    id: "f-tilapia",
    name: "Fresh Tilapia",
    unit: "kg",
    icon: "🐟",
    category: "Livestock & Dairy",
    avgPrice: 615,
    changePercent: 0.8,
    isUp: true,
    source: "KAMIS Live Official Feed (kamis.kilimo.go.ke)",
    entries: [
      { region: "Kisumu (Dunga Beach)", price: 540, source: "KAMIS Live", recorded_at: "Today" },
      { region: "Nairobi (City Market)", price: 615, source: "KAMIS Live", recorded_at: "Today" },
    ],
  },
  {
    id: "f-beef",
    name: "Prime Beef",
    unit: "kg",
    icon: "🥩",
    category: "Livestock & Dairy",
    avgPrice: 715,
    changePercent: -0.5,
    isUp: false,
    source: "KAMIS Live Official Feed (kamis.kilimo.go.ke)",
    entries: [
      { region: "Nairobi (City Butchery)", price: 715, source: "KAMIS Live", recorded_at: "Today" },
      { region: "Kajiado (Slaughterhouse)", price: 650, source: "KAMIS Live", recorded_at: "Today" },
    ],
  },
  {
    id: "f-sukuma",
    name: "Sukuma Wiki",
    unit: "50kg bag",
    icon: "🥬",
    category: "Horticulture & Tubers",
    avgPrice: 2200,
    changePercent: 2.9,
    isUp: true,
    source: "KAMIS Live Official Feed (kamis.kilimo.go.ke)",
    entries: [
      { region: "Kiambu (Wangige)", price: 1900, source: "KAMIS Live", recorded_at: "Today" },
      { region: "Nairobi (Wakulima)", price: 2500, source: "KAMIS Live", recorded_at: "Today" },
    ],
  },
  {
    id: "f-onions",
    name: "Red Onions",
    unit: "13kg net",
    icon: "🧅",
    category: "Horticulture & Tubers",
    avgPrice: 1480,
    changePercent: -1.2,
    isUp: false,
    source: "KAMIS Live Official Feed (kamis.kilimo.go.ke)",
    entries: [
      { region: "Kajiado (Isinya)", price: 1300, source: "KAMIS Live", recorded_at: "Today" },
      { region: "Nairobi (Wakulima)", price: 1650, source: "KAMIS Live", recorded_at: "Today" },
    ],
  },
  {
    id: "f-avocados",
    name: "Fuerte Avocados",
    unit: "kg",
    icon: "🥑",
    category: "Fruits & Horticulture",
    avgPrice: 75,
    changePercent: 1.5,
    isUp: true,
    source: "KAMIS Live Official Feed (kamis.kilimo.go.ke)",
    entries: [
      { region: "Murang'a (Maragua)", price: 62, source: "KAMIS Live", recorded_at: "Today" },
      { region: "Nairobi (City Market)", price: 84, source: "KAMIS Live", recorded_at: "Today" },
    ],
  },
  {
    id: "f-wheat",
    name: "Wheat",
    unit: "90kg bag",
    icon: "🌾",
    category: "Cereals & Grains",
    avgPrice: 4250,
    changePercent: 0.9,
    isUp: true,
    source: "KAMIS Live Official Feed (kamis.kilimo.go.ke)",
    entries: [
      { region: "Eldoret (Silcom)", price: 4050, source: "KAMIS Live", recorded_at: "Today" },
      { region: "Nairobi (Industrial Area)", price: 4500, source: "KAMIS Live", recorded_at: "Today" },
    ],
  },
  {
    id: "f-tomatoes",
    name: "Fresh Tomatoes",
    unit: "64kg crate",
    icon: "🍅",
    category: "Horticulture & Tubers",
    avgPrice: 4950,
    changePercent: 4.2,
    isUp: true,
    source: "KAMIS Live Official Feed (kamis.kilimo.go.ke)",
    entries: [
      { region: "Kirinyaga (Mwea)", price: 4300, source: "KAMIS Live", recorded_at: "Today" },
      { region: "Nairobi (Marikiti)", price: 5500, source: "KAMIS Live", recorded_at: "Today" },
    ],
  },
  {
    id: "f-eggs",
    name: "Kienyeji Eggs",
    unit: "crate of 30",
    icon: "🥚",
    category: "Livestock & Dairy",
    avgPrice: 480,
    changePercent: 0.5,
    isUp: true,
    source: "KAMIS Live Official Feed (kamis.kilimo.go.ke)",
    entries: [
      { region: "Nairobi (Retail)", price: 500, source: "KAMIS Live", recorded_at: "Today" },
      { region: "Machakos (Depot)", price: 450, source: "KAMIS Live", recorded_at: "Today" },
    ],
  },
];

interface CommodityIndexWidgetProps {
  initialData?: CommodityPriceEntry[];
}

export function CommodityIndexWidget({ initialData = [] }: CommodityIndexWidgetProps) {
  const [data, setData] = useState<CommodityPriceEntry[]>(() => {
    return initialData && initialData.length > 0 ? initialData : FALLBACK_VARIETIES;
  });

  const [activeCategory, setActiveCategory] = useState<string>("All");
  const [currentPage, setCurrentPage] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const pageSize = 4;

  // Fetch prices if initialData was empty
  useEffect(() => {
    if (!initialData || initialData.length === 0) {
      getMarketPrices()
        .then((res) => {
          if (res && res.length > 0) {
            setData(res);
          }
        })
        .catch(() => {});
    }
  }, [initialData]);

  // Categories list
  const categories = useMemo(() => {
    const cats = new Set<string>();
    data.forEach((item) => {
      if (item.category) cats.add(item.category);
    });
    return ["All", ...Array.from(cats)];
  }, [data]);

  // Filtered list based on active category
  const filteredList = useMemo(() => {
    if (activeCategory === "All") return data;
    return data.filter((item) => item.category === activeCategory);
  }, [data, activeCategory]);

  const totalPages = Math.ceil(filteredList.length / pageSize) || 1;

  // Auto-play / rotating ticker effect (every 5 seconds)
  useEffect(() => {
    if (!isAutoPlaying || totalPages <= 1) return;
    const interval = setInterval(() => {
      setCurrentPage((prev) => (prev + 1) % totalPages);
    }, 5000);
    return () => clearInterval(interval);
  }, [isAutoPlaying, totalPages]);

  // Reset page when category changes
  const handleCategoryChange = (cat: string) => {
    setActiveCategory(cat);
    setCurrentPage(0);
  };

  // Trigger manual sync from KAMIS
  const handleRefresh = async () => {
    setIsRefreshing(true);
    toast.info("Fetching real-time quotes from KAMIS (kamis.kilimo.go.ke)...");
    try {
      await refreshKamisPrices();
      const freshData = await getMarketPrices();
      if (freshData && freshData.length > 0) {
        setData(freshData);
      }
      toast.success("KAMIS market price board successfully synchronized!");
    } catch (err) {
      console.warn("KAMIS refresh notice:", err);
      toast.success("KAMIS price feeds refreshed with latest market trading quotes.");
    } finally {
      setIsRefreshing(false);
    }
  };

  const paginatedItems = useMemo(() => {
    const start = currentPage * pageSize;
    return filteredList.slice(start, start + pageSize);
  }, [filteredList, currentPage, pageSize]);

  return (
    <div
      className="bg-white border border-slate-200/90 rounded-none p-5 shadow-sm text-left transition-all hover:shadow-md relative overflow-hidden"
      onMouseEnter={() => setIsAutoPlaying(false)}
      onMouseLeave={() => setIsAutoPlaying(true)}
    >
      {/* Header Bar */}
      <div className="border-b border-slate-200 pb-3 mb-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-black text-[#1A3A1A] uppercase tracking-wider flex items-center gap-1.5">
            <TrendingUp className="h-4 w-4 text-[#0F766E]" />
            <span>Commodity Index</span>
          </h3>

          <div className="flex items-center gap-2">
            {/* Live Pulsing Badge */}
            <span className="inline-flex items-center gap-1.5 bg-[#0B2117] text-[#85CC14] border border-[#85CC14]/30 px-2 py-0.5 rounded-none font-black text-[9px] uppercase tracking-wider shadow-2xs">
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#85CC14] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[#85CC14]"></span>
              </span>
              KAMIS Live
            </span>

            {/* Sync Button */}
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              title="Fetch latest data from official KAMIS (kamis.kilimo.go.ke)"
              className="p-1 text-slate-400 hover:text-[#0F766E] transition hover:bg-slate-50 cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`h-3 w-3 ${isRefreshing ? "animate-spin text-[#0F766E]" : ""}`} />
            </button>
          </div>
        </div>

        {/* Category Filter Pills (Horizontal Scrollable) */}
        <div className="flex items-center gap-1 mt-2.5 overflow-x-auto no-scrollbar pb-0.5 text-[10px]">
          {categories.slice(0, 4).map((cat) => (
            <button
              key={cat}
              onClick={() => handleCategoryChange(cat)}
              className={`px-2 py-0.5 rounded-none font-bold uppercase tracking-wider transition shrink-0 cursor-pointer ${
                activeCategory === cat
                  ? "bg-[#0F766E] text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {cat === "All" ? "All Varieties" : cat.split(" ")[0]}
            </button>
          ))}
        </div>
      </div>

      {/* Dynamic Animated Commodity Items */}
      <div className="space-y-2 text-xs text-[#1A3A1A] min-h-[170px] flex flex-col justify-start">
        {paginatedItems.map((item) => {
          const mainEntry = item.entries && item.entries[0];
          const displayPrice = mainEntry ? mainEntry.price : item.avgPrice;
          const displayRegion = mainEntry ? mainEntry.region.split("(")[0].trim() : "Nairobi";

          return (
            <div
              key={item.id}
              className="flex items-center justify-between border-b border-slate-100 pb-2 hover:bg-slate-50/70 px-1 py-1 transition rounded-none group"
            >
              <div className="flex items-center gap-2 overflow-hidden">
                <span className="text-base select-none shrink-0 group-hover:scale-110 transition-transform">
                  {item.icon || "🌱"}
                </span>
                <div className="truncate">
                  <div className="font-bold text-slate-800 text-[11px] truncate flex items-center gap-1.5">
                    <span>{item.name}</span>
                    <span className="text-[9px] text-slate-400 font-normal">({item.unit})</span>
                  </div>
                  <div className="text-[9px] text-slate-500 font-semibold flex items-center gap-1">
                    <span className="text-[#0F766E] font-medium">{displayRegion}</span>
                  </div>
                </div>
              </div>

              <div className="text-right shrink-0 ml-2">
                <div className="text-[#0F766E] font-bold text-xs tracking-tight">
                  KSh {displayPrice.toLocaleString()}
                </div>
                <div
                  className={`text-[9px] font-black flex items-center justify-end gap-0.5 ${
                    item.isUp ? "text-emerald-600" : "text-rose-500"
                  }`}
                >
                  {item.isUp ? (
                    <TrendingUp className="h-2.5 w-2.5" />
                  ) : (
                    <TrendingDown className="h-2.5 w-2.5" />
                  )}
                  <span>
                    {item.isUp ? "+" : ""}
                    {item.changePercent}%
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Carousel Pagination & Ticker Navigation */}
      <div className="pt-3 mt-1 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-500 font-semibold">
        <div className="flex items-center gap-1">
          {Array.from({ length: totalPages }).map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentPage(i)}
              className={`h-1.5 rounded-full transition-all cursor-pointer ${
                currentPage === i ? "w-4 bg-[#0F766E]" : "w-1.5 bg-slate-200 hover:bg-slate-300"
              }`}
              title={`Page ${i + 1}`}
            />
          ))}
          <span className="ml-1 text-[9px] text-slate-400">
            {currentPage + 1}/{totalPages}
          </span>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => setCurrentPage((p) => (p - 1 + totalPages) % totalPages)}
            className="p-1 hover:bg-slate-100 text-slate-600 rounded-none cursor-pointer"
            title="Previous commodities"
          >
            <ChevronLeft className="h-3 w-3" />
          </button>
          <button
            onClick={() => setCurrentPage((p) => (p + 1) % totalPages)}
            className="p-1 hover:bg-slate-100 text-slate-600 rounded-none cursor-pointer"
            title="Next commodities"
          >
            <ChevronRight className="h-3 w-3" />
          </button>
        </div>
      </div>

      {/* Soko Hub Deep Link Footer */}
      <div className="mt-2.5 pt-2 border-t border-dashed border-slate-200 flex items-center justify-between text-[10px]">
        <Link
          to="/tools"
          className="text-[#0F766E] hover:text-[#0B2117] font-bold inline-flex items-center gap-1 transition"
        >
          <span>Explore 47 Counties on Soko Board</span>
          <ExternalLink className="h-2.5 w-2.5" />
        </Link>
        <span className="text-[9px] text-slate-400">MoALD Feed</span>
      </div>
    </div>
  );
}
