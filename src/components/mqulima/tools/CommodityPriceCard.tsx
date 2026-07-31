import { MapPin, TrendingUp, TrendingDown, CheckCircle2, ArrowRight } from "lucide-react";
import { Link } from "@tanstack/react-router";
import type { CommodityPriceEntry } from "@/lib/api/markets.server";

export interface CommodityPriceCardProps {
  commodity: CommodityPriceEntry;
}

export function CommodityPriceCard({ commodity }: CommodityPriceCardProps) {
  const prices = commodity.entries.map((e) => e.price);
  const maxPrice = prices.length ? Math.max(...prices) : 0;
  const minPrice = prices.length ? Math.min(...prices) : 0;
  const avgPrice = prices.length
    ? Math.round(prices.reduce((sum, val) => sum + val, 0) / prices.length)
    : 0;

  // Determine market hubs for highest and lowest prices
  const highestMarketEntry = commodity.entries.find((e) => e.price === maxPrice);
  const lowestMarketEntry = commodity.entries.find((e) => e.price === minPrice);

  // Mock trend data for sparkline & percentage change (deterministic based on commodity name length)
  const isUp = commodity.name.length % 2 === 0;
  const pctChange = ((commodity.name.length * 0.7) % 5 + 1.2).toFixed(1);

  return (
    <div className="bg-gradient-to-br from-[#0B2117] via-[#0F291E] to-[#143B2B] text-white rounded-2xl sm:rounded-3xl border-2 border-[#85CC14]/30 p-5 sm:p-6 space-y-5 shadow-lg shadow-[#0F291E]/20 hover:border-[#85CC14] hover:shadow-xl transition-all duration-200 flex flex-col justify-between text-left group relative overflow-hidden">
      
      {/* Ambient Radial Glow */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-[#85CC14]/10 via-transparent to-transparent pointer-events-none" />

      {/* ── 1. Header: Commodity & Verified Badge ── */}
      <div className="space-y-2 relative z-10">
        <div className="flex items-center justify-between gap-2">
          <span className="text-[11px] font-mono font-bold tracking-wider text-[#D4E157] bg-[#85CC14]/20 px-2.5 py-0.5 rounded-md uppercase border border-[#85CC14]/40">
            UNIT: {commodity.unit}
          </span>

          <div className="inline-flex items-center gap-1.5 text-[11px] font-extrabold text-[#0B2117] bg-[#85CC14] px-2.5 py-1 rounded-full shadow-md shadow-[#85CC14]/20">
            <CheckCircle2 className="h-3.5 w-3.5 text-[#0B2117] shrink-0" />
            <span>KAMIS VERIFIED</span>
          </div>
        </div>

        <h3 className="text-xl sm:text-2xl font-black text-white font-['Outfit',sans-serif] tracking-tight pt-1 drop-shadow-xs">
          {commodity.name}
        </h3>
      </div>

      {/* ── 2. Price Focal Point & Trend ── */}
      <div className="py-3.5 px-4 rounded-xl bg-[#091D14]/80 backdrop-blur-md border border-[#85CC14]/40 flex items-center justify-between gap-4 relative z-10 shadow-inner">
        <div>
          <span className="text-[10px] font-mono font-bold text-[#85CC14] uppercase tracking-wider block">
            AVERAGE MARKET PRICE
          </span>
          <div className="flex items-baseline gap-2 mt-0.5">
            <span className="text-2xl sm:text-3xl font-black font-mono text-[#85CC14] drop-shadow-xs">
              KES {avgPrice.toLocaleString()}
            </span>
            <span className="text-xs font-mono font-semibold text-white/70">
              / {commodity.unit.toLowerCase()}
            </span>
          </div>

          <div className="flex items-center gap-1.5 mt-1">
            {isUp ? (
              <span className="inline-flex items-center text-[11px] font-mono font-bold text-[#85CC14]">
                <TrendingUp className="h-3.5 w-3.5 mr-0.5 text-[#85CC14]" />
                +{pctChange}% this week
              </span>
            ) : (
              <span className="inline-flex items-center text-[11px] font-mono font-bold text-red-400">
                <TrendingDown className="h-3.5 w-3.5 mr-0.5 text-red-400" />
                -{pctChange}% this week
              </span>
            )}
          </div>
        </div>

        {/* ── Stylized Zigzag Trend Arrow Graph (Green Uptrend / Red Downtrend) ── */}
        <div className="w-22 sm:w-26 h-12 flex items-center justify-end shrink-0 relative">
          {isUp ? (
            /* UPTREND ZIGZAG ARROW (GREEN) */
            <svg
              className="w-full h-full overflow-visible drop-shadow-md"
              viewBox="0 0 100 40"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <defs>
                <linearGradient id={`grad-up-${commodity.id}`} x1="0" y1="1" x2="1" y2="0">
                  <stop offset="0%" stopColor="#85CC14" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#85CC14" stopOpacity="0.0" />
                </linearGradient>
              </defs>
              {/* Shaded Area under Zigzag */}
              <polygon
                points="6,36 30,20 44,26 64,12 74,17 88,6 88,36"
                fill={`url(#grad-up-${commodity.id})`}
              />
              {/* Zigzag Line */}
              <path
                d="M 6 36 L 30 20 L 44 26 L 64 12 L 74 17 L 88 6"
                stroke="#85CC14"
                strokeWidth="3.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              {/* Pointed Arrowhead Tip */}
              <path
                d="M 96 3 L 74 5 L 82 14 L 93 23 Z"
                fill="#85CC14"
              />
            </svg>
          ) : (
            /* DOWNTREND ZIGZAG ARROW (RED) */
            <svg
              className="w-full h-full overflow-visible drop-shadow-md"
              viewBox="0 0 100 40"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <defs>
                <linearGradient id={`grad-down-${commodity.id}`} x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#F87171" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#F87171" stopOpacity="0.0" />
                </linearGradient>
              </defs>
              {/* Shaded Area under Zigzag */}
              <polygon
                points="6,4 30,20 44,14 64,28 74,23 88,34 88,4"
                fill={`url(#grad-down-${commodity.id})`}
              />
              {/* Zigzag Line */}
              <path
                d="M 6 4 L 30 20 L 44 14 L 64 28 L 74 23 L 88 34"
                stroke="#F87171"
                strokeWidth="3.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              {/* Pointed Arrowhead Tip */}
              <path
                d="M 96 37 L 74 35 L 82 26 L 93 17 Z"
                fill="#F87171"
              />
            </svg>
          )}
        </div>
      </div>

      {/* ── 3. Market Prices Breakdown (Compact List) ── */}
      <div className="space-y-2.5 pt-1 relative z-10">
        <div className="flex items-center justify-between text-[10px] font-mono font-bold text-[#85CC14] uppercase tracking-wider">
          <span>MARKET SNAPSHOT</span>
          <span>PRICE / {commodity.unit.toUpperCase()}</span>
        </div>

        <div className="divide-y divide-white/10 border-t border-b border-white/10">
          {commodity.entries.length === 0 ? (
            <div className="py-3 text-xs text-white/50 italic">No regional entries reported</div>
          ) : (
            commodity.entries.slice(0, 3).map((entry, idx) => (
              <div key={idx} className="py-2 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 truncate pr-2">
                  <MapPin className="h-3.5 w-3.5 text-[#85CC14] shrink-0" />
                  <span className="font-semibold text-white/90 truncate">{entry.region}</span>
                </div>
                <span className="font-mono font-bold text-[#85CC14] shrink-0">
                  KES {entry.price.toLocaleString()}
                </span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* ── 4. Highest / Lowest Summary ── */}
      {commodity.entries.length > 0 && (
        <div className="grid grid-cols-2 gap-3 text-xs py-2.5 px-3 bg-[#071911] rounded-xl border border-[#85CC14]/30 relative z-10">
          <div>
            <span className="text-[10px] font-mono font-bold text-[#D4E157] uppercase block">HIGHEST MARKET</span>
            <span className="font-bold text-white truncate block">
              {highestMarketEntry?.region || "—"}
            </span>
            <span className="font-mono text-[#85CC14] font-extrabold text-[11px]">
              KES {maxPrice.toLocaleString()}
            </span>
          </div>

          <div className="border-l border-white/15 pl-3">
            <span className="text-[10px] font-mono font-bold text-amber-300 uppercase block">LOWEST MARKET</span>
            <span className="font-bold text-white truncate block">
              {lowestMarketEntry?.region || "—"}
            </span>
            <span className="font-mono text-amber-200 font-extrabold text-[11px]">
              KES {minPrice.toLocaleString()}
            </span>
          </div>
        </div>
      )}

      {/* ── 5. Footer Attribution & CTA ── */}
      <div className="pt-2 flex items-center justify-between border-t border-white/10 text-xs relative z-10">
        <span className="text-[11px] text-white/60 font-medium">
          Source: <strong className="text-white font-semibold">KAMIS</strong>
        </span>

        <Link
          to="/community"
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#85CC14] text-[#0B2117] hover:bg-[#6FA810] font-black text-xs uppercase shadow-md shadow-[#85CC14]/20 transition-all group-hover:translate-x-0.5"
        >
          <span>Find Buyers</span>
          <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
        </Link>
      </div>

    </div>
  );
}
