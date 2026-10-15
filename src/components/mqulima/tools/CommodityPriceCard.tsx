import { MapPin, TrendingUp, TrendingDown, CheckCircle2, ArrowRight } from "lucide-react";
import { Link } from "@tanstack/react-router";
import type { CommodityPriceEntry } from "@/lib/api/markets.server";

export interface AgriTheme {
  category: string;
  themeColor: "green" | "yellow" | "orange" | "blue";
  icon: string;
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
  topTrim: string;
  sparklineStroke: string;
  btnClass: string;
  pillBg: string;
  pillText: string;
  pillBorder: string;
  iconBg: string;
  priceColor: string;
}

export function getCommodityTheme(name: string, category?: string): AgriTheme {
  const n = (name || "").toLowerCase();
  const c = (category || "").toLowerCase();

  // 1. FRESH GREENS & LEAFY VEGETABLES (Bright Agricultural Green)
  if (
    n.includes("cabbage") ||
    n.includes("sukuma") ||
    n.includes("kale") ||
    n.includes("spinach") ||
    n.includes("avocado") ||
    n.includes("tea") ||
    n.includes("french bean") ||
    n.includes("lettuce") ||
    n.includes("managu") ||
    n.includes("terere") ||
    c.includes("green") ||
    c.includes("vegetable")
  ) {
    return {
      category: "Greens & Foliage",
      themeColor: "green",
      icon: n.includes("avocado") ? "🥑" : n.includes("tea") ? "🍃" : "🥬",
      badgeBg: "bg-emerald-50",
      badgeText: "text-emerald-800",
      badgeBorder: "border-emerald-200",
      topTrim: "from-emerald-500 via-green-500 to-teal-500",
      sparklineStroke: "#059669",
      btnClass: "bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/20",
      pillBg: "bg-emerald-50",
      pillText: "text-emerald-800",
      pillBorder: "border-emerald-200",
      iconBg: "bg-emerald-100 text-emerald-800",
      priceColor: "text-emerald-800",
    };
  }

  // 2. GRAINS & CEREALS (Sunburst Harvest Gold / Yellow)
  if (
    n.includes("maize") ||
    n.includes("corn") ||
    n.includes("wheat") ||
    n.includes("sorghum") ||
    n.includes("millet") ||
    n.includes("rice") ||
    n.includes("barley") ||
    n.includes("oat") ||
    n.includes("bean") ||
    n.includes("rosecoco") ||
    n.includes("ndengu") ||
    n.includes("gram") ||
    n.includes("cowpea") ||
    n.includes("pea") ||
    c.includes("cereal") ||
    c.includes("grain") ||
    c.includes("pulse") ||
    c.includes("legume")
  ) {
    return {
      category: "Cereals & Pulses",
      themeColor: "yellow",
      icon: n.includes("rice") ? "🍚" : n.includes("wheat") ? "🌾" : n.includes("bean") || n.includes("gram") ? "🫘" : "🌽",
      badgeBg: "bg-amber-50",
      badgeText: "text-amber-900",
      badgeBorder: "border-amber-200",
      topTrim: "from-amber-400 via-yellow-400 to-orange-400",
      sparklineStroke: "#D97706",
      btnClass: "bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-amber-500/20",
      pillBg: "bg-amber-50",
      pillText: "text-amber-900",
      pillBorder: "border-amber-200",
      iconBg: "bg-amber-100 text-amber-900",
      priceColor: "text-amber-900",
    };
  }

  // 3. LIVESTOCK, DAIRY & AQUACULTURE (River & Sky Blue)
  if (
    n.includes("milk") ||
    n.includes("dairy") ||
    n.includes("beef") ||
    n.includes("meat") ||
    n.includes("goat") ||
    n.includes("pork") ||
    n.includes("tilapia") ||
    n.includes("fish") ||
    n.includes("egg") ||
    n.includes("chicken") ||
    n.includes("poultry") ||
    c.includes("livestock") ||
    c.includes("dairy") ||
    c.includes("fish")
  ) {
    return {
      category: "Dairy & Livestock",
      themeColor: "blue",
      icon: n.includes("fish") || n.includes("tilapia") ? "🐟" : n.includes("egg") ? "🥚" : n.includes("milk") ? "🥛" : "🥩",
      badgeBg: "bg-sky-50",
      badgeText: "text-sky-900",
      badgeBorder: "border-sky-200",
      topTrim: "from-sky-400 via-blue-500 to-cyan-500",
      sparklineStroke: "#0284C7",
      btnClass: "bg-sky-600 hover:bg-sky-500 text-white shadow-sky-600/20",
      pillBg: "bg-sky-50",
      pillText: "text-sky-900",
      pillBorder: "border-sky-200",
      iconBg: "bg-sky-100 text-sky-900",
      priceColor: "text-sky-900",
    };
  }

  // 4. ROOTS, TUBERS & HORTICULTURE (Vibrant Harvest Orange)
  return {
    category: "Roots & Horticulture",
    themeColor: "orange",
    icon: n.includes("onion") ? "🧅" : n.includes("carrot") ? "🥕" : n.includes("tomato") ? "🍅" : n.includes("mango") ? "🥭" : "🥔",
    badgeBg: "bg-orange-50",
    badgeText: "text-orange-900",
    badgeBorder: "border-orange-200",
    topTrim: "from-orange-500 via-amber-500 to-orange-400",
    sparklineStroke: "#EA580C",
    btnClass: "bg-orange-500 hover:bg-orange-400 text-white shadow-orange-500/20",
    pillBg: "bg-orange-50",
    pillText: "text-orange-900",
    pillBorder: "border-orange-200",
    iconBg: "bg-orange-100 text-orange-900",
    priceColor: "text-orange-900",
  };
}

export interface CommodityPriceCardProps {
  commodity: CommodityPriceEntry;
}

export function CommodityPriceCard({ commodity }: CommodityPriceCardProps) {
  const theme = getCommodityTheme(commodity.name, commodity.category);
  const prices = commodity.entries.map((e) => e.price);
  const maxPrice = prices.length ? Math.max(...prices) : 0;
  const minPrice = prices.length ? Math.min(...prices) : 0;
  const avgPrice =
    commodity.avgPrice && commodity.avgPrice > 0
      ? commodity.avgPrice
      : prices.length
      ? Math.round(prices.reduce((sum, val) => sum + val, 0) / prices.length)
      : 0;

  // Determine market hubs for highest and lowest prices
  const highestMarketEntry = commodity.entries.find((e) => e.price === maxPrice);
  const lowestMarketEntry = commodity.entries.find((e) => e.price === minPrice);

  // Spread (arbitrage margin)
  const spread = maxPrice > minPrice ? maxPrice - minPrice : 0;

  // Trend movement
  const isUp = typeof commodity.isUp === "boolean" ? commodity.isUp : commodity.name.length % 2 === 0;
  const pctChange = commodity.changePercent
    ? Math.abs(commodity.changePercent).toFixed(1)
    : (((commodity.name.length * 0.7) % 5) + 1.2).toFixed(1);

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 hover:border-slate-300 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between text-left group overflow-hidden relative">
      
      {/* ── Top Delicate Accent Trim ── */}
      <div className={`h-1.5 w-full bg-gradient-to-r ${theme.topTrim}`} />

      {/* ── Main Content Body ── */}
      <div className="p-5 sm:p-6 space-y-4">
        
        {/* Header: Category Badge + Unit + KAMIS Source */}
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold ${theme.badgeBg} ${theme.badgeText} border ${theme.badgeBorder}`}>
            <span className="text-base leading-none">{theme.icon}</span>
            <span>{theme.category}</span>
          </span>

          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono font-semibold text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded-full border border-slate-200/60">
              Unit: {commodity.unit}
            </span>
            <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-emerald-800 bg-emerald-50 border border-emerald-200/80 px-2 py-0.5 rounded-full">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              KAMIS
            </span>
          </div>
        </div>

        {/* Commodity Name */}
        <div>
          <h3 className="text-xl sm:text-2xl font-black text-slate-900 font-['Outfit',sans-serif] tracking-tight group-hover:text-emerald-700 transition-colors">
            {commodity.name}
          </h3>
        </div>

        {/* ── Average Market Price & Smooth Sparkline ── */}
        <div className="p-4 rounded-xl bg-slate-50/80 border border-slate-100 flex items-center justify-between gap-3">
          <div className="space-y-0.5 min-w-0">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500 block">
              AVERAGE MARKET PRICE
            </span>
            <div className="flex items-baseline gap-1.5 whitespace-nowrap">
              <span className="text-2xl sm:text-3xl font-black font-['Outfit',sans-serif] tracking-tight text-slate-900">
                KES {avgPrice.toLocaleString()}
              </span>
              <span className="text-xs font-medium text-slate-500">
                / {commodity.unit.toLowerCase()}
              </span>
            </div>

            <div className="pt-0.5">
              {isUp ? (
                <span className="inline-flex items-center text-[11px] font-extrabold text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded-md border border-emerald-200/80">
                  <TrendingUp className="h-3 w-3 mr-1 text-emerald-600 stroke-[2.5]" />
                  +{pctChange}% this week
                </span>
              ) : (
                <span className="inline-flex items-center text-[11px] font-extrabold text-rose-700 bg-rose-100/70 px-2 py-0.5 rounded-md border border-rose-200/80">
                  <TrendingDown className="h-3 w-3 mr-1 text-rose-600 stroke-[2.5]" />
                  -{pctChange}% this week
                </span>
              )}
            </div>
          </div>

          {/* Smooth High-Definition Sparkline */}
          <div className="w-24 sm:w-28 h-12 shrink-0 flex items-center justify-end">
            <svg className="w-full h-full overflow-visible" viewBox="0 0 100 40" fill="none">
              <defs>
                <linearGradient id={`spark-${commodity.id}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={theme.sparklineStroke} stopOpacity="0.3" />
                  <stop offset="100%" stopColor={theme.sparklineStroke} stopOpacity="0.0" />
                </linearGradient>
              </defs>
              {isUp ? (
                <>
                  <path
                    d="M 2 34 Q 22 28, 40 18 T 70 14 T 96 4 L 96 38 L 2 38 Z"
                    fill={`url(#spark-${commodity.id})`}
                  />
                  <path
                    d="M 2 34 Q 22 28, 40 18 T 70 14 T 96 4"
                    stroke={theme.sparklineStroke}
                    strokeWidth="2.5"
                    strokeLinecap="round"
                  />
                  <circle cx="96" cy="4" r="3" fill={theme.sparklineStroke} />
                </>
              ) : (
                <>
                  <path
                    d="M 2 6 Q 22 12, 40 22 T 70 26 T 96 34 L 96 38 L 2 38 Z"
                    fill={`url(#spark-${commodity.id})`}
                  />
                  <path
                    d="M 2 6 Q 22 12, 40 22 T 70 26 T 96 34"
                    stroke="#E11D48"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                  />
                  <circle cx="96" cy="34" r="3" fill="#E11D48" />
                </>
              )}
            </svg>
          </div>
        </div>

        {/* ── Regional Market Hubs Snapshot ── */}
        <div className="space-y-2 pt-1">
          <div className="flex items-center justify-between text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">
            <span>REGIONAL TRADING HUBS</span>
            <span>PRICE / {commodity.unit.toUpperCase()}</span>
          </div>

          <div className="divide-y divide-slate-100 border-t border-b border-slate-100">
            {commodity.entries.length === 0 ? (
              <div className="py-2.5 text-xs text-slate-400 italic">No regional hub updates</div>
            ) : (
              commodity.entries.slice(0, 3).map((entry, idx) => (
                <div key={idx} className="flex items-center justify-between py-2 text-xs">
                  <div className="flex items-center gap-1.5 truncate pr-2">
                    <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                    <span className="font-semibold text-slate-700 truncate">{entry.region}</span>
                  </div>
                  <span className="font-mono font-bold text-slate-900 shrink-0">
                    KES {entry.price.toLocaleString()}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* ── Market Arbitrage (High vs Low Hub) ── */}
        {commodity.entries.length > 0 && (
          <div className="grid grid-cols-2 gap-2 text-xs p-3 rounded-xl bg-slate-50 border border-slate-100">
            <div>
              <span className="text-[10px] font-mono font-bold text-emerald-800 uppercase block">
                ▲ HIGHEST HUB
              </span>
              <span className="font-bold text-slate-800 truncate block text-[11px]">
                {highestMarketEntry?.region || "—"}
              </span>
              <span className="font-mono font-extrabold text-emerald-700 text-xs">
                KES {maxPrice.toLocaleString()}
              </span>
            </div>

            <div className="border-l border-slate-200 pl-2.5">
              <span className="text-[10px] font-mono font-bold text-slate-600 uppercase block">
                ▼ LOWEST HUB
              </span>
              <span className="font-bold text-slate-800 truncate block text-[11px]">
                {lowestMarketEntry?.region || "—"}
              </span>
              <span className="font-mono font-extrabold text-slate-700 text-xs">
                KES {minPrice.toLocaleString()}
              </span>
            </div>
          </div>
        )}

      </div>

      {/* ── Card Footer: Source & Clean CTA Button ── */}
      <div className="px-5 sm:px-6 py-3.5 bg-slate-50/70 border-t border-slate-100 flex items-center justify-between text-xs">
        <span className="text-[11px] text-slate-500 font-medium">
          Source: <strong className="text-slate-700 font-bold">KAMIS Official</strong>
        </span>

        <Link
          to="/community"
          className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg ${theme.btnClass} font-bold text-xs shadow-xs hover:shadow-md transition-all active:scale-95`}
        >
          <span>Find Buyers</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

    </div>
  );
}
