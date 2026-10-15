import { useState, useEffect, useRef, useMemo } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { AppLayout } from "@/components/mqulima/AppLayout";
import { trackEvent } from "@/lib/events";
import {
  CloudSun,
  TrendingUp,
  Wrench,
  ChevronRight,
  Sparkles,
  MapPin,
  Cpu,
  Zap,
  Activity,
  ArrowRight,
  ShieldCheck,
  Check,
  ShoppingBag
} from "lucide-react";
import "@/styles/mqulima-tools.css";

// Modular sub-panels
import { WeatherPanel } from "@/components/mqulima/tools/WeatherPanel";
import { MarketsPanel } from "@/components/mqulima/tools/MarketsPanel";
import { CropDoctor } from "@/components/mqulima/tools/CropDoctor";
import { useWeather, KENYA_COUNTIES, type CountyName } from "@/hooks/useWeather";

export const Route = createFileRoute("/tools")({
  head: () => ({
    meta: [
      { title: "Mqulima Agri-Intelligence Core · Precision Farm Tools" },
      {
        name: "description",
        content:
          "Next-generation precision agriculture command center. Real-time Open-Meteo weather analytics, live KAMIS market prices, spray suitability radar, and AI plant disease diagnostics.",
      },
    ],
  }),
  component: ToolsPage,
});

type Tab = "weather" | "markets" | "doctor";

type TabConfig = {
  id: Tab;
  label: string;
  icon: React.ElementType;
  activeClass: string;
  inactiveClass: string;
  iconActive: string;
  iconInactive: string;
};

const TABS: TabConfig[] = [
  {
    id: "weather",
    label: "Weather Radar",
    icon: CloudSun,
    activeClass:
      "bg-gradient-to-r from-[#0284C7] via-[#0EA5E9] to-[#38BDF8] text-white font-black shadow-lg shadow-sky-500/35 border-2 border-sky-200 ring-2 ring-sky-400/30 scale-[1.02]",
    inactiveClass:
      "bg-[#082F49]/80 text-sky-200 font-bold border-2 border-sky-500/40 hover:bg-[#0C4A6E] hover:border-sky-300 hover:text-white shadow-md shadow-sky-950/40",
    iconActive: "text-white stroke-[2.5]",
    iconInactive: "text-[#38BDF8] stroke-[2]",
  },
  {
    id: "markets",
    label: "Live Markets",
    icon: TrendingUp,
    activeClass:
      "bg-gradient-to-r from-[#F59E0B] via-[#EA580C] to-[#D97706] text-white font-black shadow-lg shadow-amber-500/35 border-2 border-amber-200 ring-2 ring-amber-400/30 scale-[1.02]",
    inactiveClass:
      "bg-[#451A03]/80 text-amber-200 font-bold border-2 border-amber-500/40 hover:bg-[#78350F] hover:border-amber-300 hover:text-white shadow-md shadow-amber-950/40",
    iconActive: "text-white stroke-[2.5]",
    iconInactive: "text-[#FBBF24] stroke-[2]",
  },
  {
    id: "doctor",
    label: "AI Crop Doctor",
    icon: Wrench,
    activeClass:
      "bg-gradient-to-r from-[#85CC14] via-[#65A30D] to-[#16A34A] text-[#081C13] font-black shadow-lg shadow-lime-500/35 border-2 border-[#BEF264] ring-2 ring-lime-400/30 scale-[1.02]",
    inactiveClass:
      "bg-[#143E23]/80 text-emerald-200 font-bold border-2 border-emerald-500/40 hover:bg-[#166534] hover:border-emerald-300 hover:text-white shadow-md shadow-emerald-950/40",
    iconActive: "text-[#081C13] stroke-[2.5]",
    iconInactive: "text-[#A3E635] stroke-[2]",
  },
];
const HERO_STATS = [
  { icon: MapPin, value: "47", label: "Counties Monitored" },
  { icon: CloudSun, value: "7-Day", label: "Microclimate Forecast" },
  { icon: TrendingUp, value: "Live", label: "KAMIS Market Feeds" },
  { icon: Sparkles, value: "< 5 sec", label: "AI Diagnostics" },
];

// Replicated 8 times = 32 items per track (>6,000px wide).
// Guarantees Track 1 and Track 2 are far wider than any monitor (including 4K/ultrawide displays),
// ensuring the marquee loop is 100% gapless, seamless, and never seen restarting or ending.
const MARQUEE_STATS = [
  ...HERO_STATS,
  ...HERO_STATS,
  ...HERO_STATS,
  ...HERO_STATS,
  ...HERO_STATS,
  ...HERO_STATS,
  ...HERO_STATS,
  ...HERO_STATS,
];

function ToolsPage() {
  const [activeTab, setActiveTab] = useState<Tab>("weather");
  const weatherState = useWeather("Nairobi");
  const { location, selectCounty } = weatherState;

  const countyList = useMemo(
    () => (Object.keys(KENYA_COUNTIES) as CountyName[]).sort((a, b) => a.localeCompare(b)),
    []
  );
  const currentCounty = location.type === "county" ? location.county : "Nairobi";

  const lastTrackedTabRef = useRef<string | null>(null);
  useEffect(() => {
    const key = `${activeTab}_${currentCounty}`;
    if (lastTrackedTabRef.current !== key) {
      lastTrackedTabRef.current = key;
      if (activeTab === "weather") {
        trackEvent("weather_forecast_viewed", { county: currentCounty });
      } else if (activeTab === "markets") {
        trackEvent("market_price_viewed", { commodity_category: "wholesale_kamis" });
      } else if (activeTab === "doctor") {
        trackEvent("ai_assistant_used", { feature_name: "crop_doctor" });
      }
    }
  }, [activeTab, currentCounty]);

  return (
    <AppLayout>
      <div className="bg-[#FAFBF9] text-[#1A261C] min-h-screen font-['Plus_Jakarta_Sans',sans-serif] antialiased selection:bg-[#85CC14] selection:text-white">

        {/* =========================================================================
            SECTION 1: HERO BANNER (Pixel-matched to Services Page Theme)
           ========================================================================= */}
        <section className="relative overflow-hidden bg-[#0F291E] text-white">
          {/* High-res panoramic agricultural background image with dark overlay */}
          <div className="absolute inset-0 z-0">
            <img
              src="https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=2000&q=85"
              alt="Lush agricultural green fields"
              className="w-full h-full object-cover object-center opacity-40 mix-blend-luminosity scale-105"
            />
            {/* Subtle radial green glow gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-r from-[#0B2117] via-[#0F291E]/90 to-[#123828]/80" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0B2117] via-transparent to-transparent" />
          </div>

          <div className="relative z-10 container-px mx-auto max-w-7xl pt-4 pb-4 md:pt-5 md:pb-5 text-left">
            <div className="max-w-4xl">
              
              {/* Top Pill Badge */}
              <div className="inline-flex items-center gap-1.5 rounded-full bg-white/10 backdrop-blur-md px-3 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white/90 border border-white/15 mb-1.5">
                <Cpu className="h-3 w-3 text-[#85CC14]" />
                <span>MQULIMA AGRI-INTELLIGENCE CORE</span>
              </div>

              {/* Main Headline — Compact & Impactful */}
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white leading-tight tracking-tight font-['Outfit',sans-serif]">
                Precision Farm{" "}
                <span className="text-[#D4E157] underline decoration-[#D4E157]/30 underline-offset-4">
                  Intelligence
                </span>{" "}
                & Tools
              </h1>

              {/* Compact Subheading */}
              <p className="mt-1.5 text-xs sm:text-sm text-white/80 leading-relaxed font-normal max-w-2xl">
                Real-time Open-Meteo telemetry, live KAMIS commodity market feeds, spray suitability radar, and instant AI plant disease diagnosis.
              </p>

              {/* Action Buttons & County Selector Row */}
              <div className="mt-3 flex flex-wrap items-center gap-2 sm:gap-2.5">
                {/* 1. Open Control Console - Vibrant Lime Green */}
                <button
                  onClick={() => {
                    const el = document.getElementById("interactive-console");
                    el?.scrollIntoView({ behavior: "smooth" });
                  }}
                  className="px-3.5 py-1.5 rounded-full bg-gradient-to-r from-[#85CC14] to-[#65A30D] text-[#081C13] font-black text-xs hover:brightness-110 shadow-md shadow-[#85CC14]/30 border border-[#A3E635]/60 transition-all duration-200 flex items-center justify-center gap-1.5 cursor-pointer active:scale-98 whitespace-nowrap shrink-0"
                >
                  <span>Open Control Console</span>
                  <ArrowRight className="h-3.5 w-3.5 stroke-[2.5] shrink-0" />
                </button>

                {/* 2. Browse Farm Supplies - Warm Amber / Harvest Gold */}
                <Link
                  to="/shop"
                  className="px-3.5 py-1.5 rounded-full bg-gradient-to-r from-[#F59E0B] via-[#EA580C] to-[#D97706] text-white font-extrabold text-xs hover:brightness-110 shadow-md shadow-amber-500/30 border border-amber-300/40 transition-all duration-200 flex items-center justify-center gap-1.5 cursor-pointer active:scale-98 whitespace-nowrap shrink-0"
                >
                  <ShoppingBag className="h-3.5 w-3.5 shrink-0 text-amber-100" />
                  <span>Browse Farm Supplies</span>
                </Link>

                {/* 3. County Pill Selector - Vibrant Cyan / Deep Sapphire Teal Glass */}
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-[#0369A1]/60 to-[#0F766E]/70 backdrop-blur-md border border-[#38BDF8]/60 text-white shadow-md shadow-sky-950/40 hover:border-[#38BDF8] transition-all duration-200 shrink-0">
                  <MapPin className="h-3.5 w-3.5 text-[#38BDF8] shrink-0 animate-pulse" />
                  <span className="text-[11px] font-bold uppercase tracking-wider text-sky-200/90 shrink-0">County:</span>
                  <select
                    value={currentCounty}
                    onChange={(e) => selectCounty(e.target.value as CountyName)}
                    className="bg-transparent text-xs font-black text-white drop-shadow-xs outline-none cursor-pointer border-none max-w-[150px] truncate"
                    aria-label="Select Kenyan County (All 47 Counties)"
                  >
                    {countyList.map((c) => (
                      <option key={c} value={c} className="bg-[#0B2117] text-white py-1">
                        {c} County
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Inline Trust Badges Row */}
              <div className="mt-2.5 pt-2 border-t border-white/10 flex flex-wrap items-center gap-x-5 gap-y-1 text-[11px] font-medium text-white/80">
                <div className="flex items-center gap-1.5 shrink-0">
                  <div className="p-0.5 rounded-full bg-[#85CC14]/20 text-[#85CC14] shrink-0">
                    <Check className="h-2.5 w-2.5 stroke-[3]" />
                  </div>
                  <span>Real-time Open-Meteo V3</span>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <div className="p-0.5 rounded-full bg-[#85CC14]/20 text-[#85CC14] shrink-0">
                    <Check className="h-2.5 w-2.5 stroke-[3]" />
                  </div>
                  <span>KAMIS Commodity Prices</span>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <div className="p-0.5 rounded-full bg-[#85CC14]/20 text-[#85CC14] shrink-0">
                    <Check className="h-2.5 w-2.5 stroke-[3]" />
                  </div>
                  <span>Instant AI Disease Doctor</span>
                </div>
              </div>

            </div>
          </div>

          {/* Stats Bar Ribbon at Bottom of Hero (Slimmer Marquee Strip - Truly Continuous) */}
          <div className="relative z-10 bg-[#EDF7E2] border-t border-b border-[#D8EBC4] py-2 overflow-hidden select-none">
            <div
              className="marquee-wrapper flex w-max items-center animate-marquee will-change-transform"
              style={{ animationDuration: "75s" }}
            >
              {/* Track 1 */}
              <div className="flex shrink-0 items-center gap-8 sm:gap-12 pr-8 sm:pr-12">
                {MARQUEE_STATS.map((stat, idx) => (
                  <div key={`t1-${idx}`} className="flex items-center gap-2.5 shrink-0">
                    <div className="p-1.5 rounded-full bg-[#85CC14]/25 text-[#2A520B] shrink-0">
                      <stat.icon className="h-4 w-4 stroke-[2]" />
                    </div>
                    <div className="text-left">
                      <span className="text-base sm:text-lg font-black text-[#1A380A] tracking-tight font-['Outfit',sans-serif] block leading-none">
                        {stat.value}
                      </span>
                      <span className="text-[10px] font-semibold text-[#3D661B] whitespace-nowrap">{stat.label}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Track 2 (Identical Clone for 100% Seamless Infinite Continuous Loop) */}
              <div className="flex shrink-0 items-center gap-8 sm:gap-12 pr-8 sm:pr-12" aria-hidden="true">
                {MARQUEE_STATS.map((stat, idx) => (
                  <div key={`t2-${idx}`} className="flex items-center gap-2.5 shrink-0">
                    <div className="p-1.5 rounded-full bg-[#85CC14]/25 text-[#2A520B] shrink-0">
                      <stat.icon className="h-4 w-4 stroke-[2]" />
                    </div>
                    <div className="text-left">
                      <span className="text-base sm:text-lg font-black text-[#1A380A] tracking-tight font-['Outfit',sans-serif] block leading-none">
                        {stat.value}
                      </span>
                      <span className="text-[10px] font-semibold text-[#3D661B] whitespace-nowrap">{stat.label}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>


        {/* =========================================================================
            SECTION 2: FLOATING TAB SWITCHER CONSOLE (Multi-Color Tactile Buttons)
           ========================================================================= */}
        <section id="interactive-console" className="sticky top-14 sm:top-16 z-40 py-2.5 sm:py-3 px-2 sm:px-4 sm:container-px mx-auto max-w-7xl bg-[#FAFBF9]/95 backdrop-blur-md border-b border-slate-200/80">
          <div className="flex justify-center w-full max-w-3xl mx-auto">
            <div className="grid grid-cols-3 gap-2 sm:gap-3 w-full sm:w-auto p-1.5 sm:p-2 rounded-2xl sm:rounded-full bg-[#071B12]/95 backdrop-blur-xl border border-white/15 shadow-xl shadow-slate-900/15">
              {TABS.map(({ id, label, icon: Icon, activeClass, inactiveClass, iconActive, iconInactive }) => {
                const isActive = activeTab === id;
                return (
                  <button
                    key={id}
                    onClick={() => setActiveTab(id)}
                    className={`flex items-center justify-center gap-1.5 sm:gap-2 px-2.5 sm:px-6 py-2 sm:py-2.5 rounded-xl sm:rounded-full text-[11px] xs:text-xs sm:text-sm font-black transition-all duration-200 ease-out whitespace-nowrap cursor-pointer active:scale-95 ${
                      isActive ? activeClass : inactiveClass
                    }`}
                  >
                    <Icon className={`h-4 w-4 shrink-0 ${isActive ? iconActive : iconInactive}`} />
                    <span>{label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        {/* =========================================================================
            SECTION 3: TAB PANELS DISPLAY
           ========================================================================= */}
        <main className="py-8 px-3 sm:container-px mx-auto max-w-7xl relative z-10">
          <div className="transition-all duration-300">
            {activeTab === "weather" && <WeatherPanel weatherState={weatherState} />}
            {activeTab === "markets" && <MarketsPanel />}
            {activeTab === "doctor"  && <CropDoctor weatherState={weatherState} />}
          </div>
        </main>

      </div>
    </AppLayout>
  );
}

