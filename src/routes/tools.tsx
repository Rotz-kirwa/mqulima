import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { AppLayout } from "@/components/mqulima/AppLayout";
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
  Check
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

const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
  {
    id: "weather",
    label: "Weather Radar",
    icon: CloudSun,
  },
  {
    id: "markets",
    label: "Live Markets",
    icon: TrendingUp,
  },
  {
    id: "doctor",
    label: "AI Crop Doctor",
    icon: Wrench,
  },
];
const HERO_STATS = [
  { icon: MapPin, value: "47", label: "Counties Monitored" },
  { icon: CloudSun, value: "7-Day", label: "Microclimate Forecast" },
  { icon: TrendingUp, value: "Live", label: "KAMIS Market Feeds" },
  { icon: Sparkles, value: "< 5 sec", label: "AI Diagnostics" },
];

function ToolsPage() {
  const [activeTab, setActiveTab] = useState<Tab>("weather");
  const weatherState = useWeather("Nairobi");
  const { location, selectCounty } = weatherState;

  const countyList = Object.keys(KENYA_COUNTIES) as CountyName[];
  const currentCounty = location.type === "county" ? location.county : "Nairobi";

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

          <div className="relative z-10 container-px mx-auto max-w-7xl pt-8 pb-10 md:pt-10 md:pb-12 text-left">
            <div className="max-w-3xl">
              
              {/* Top Pill Badge */}
              <div className="inline-flex items-center gap-2 rounded-full bg-white/10 backdrop-blur-md px-3.5 py-1 text-[11px] font-bold uppercase tracking-wider text-white/90 border border-white/15 mb-3">
                <Cpu className="h-3.5 w-3.5 text-[#85CC14]" />
                <span>MQULIMA AGRI-INTELLIGENCE CORE</span>
              </div>

              {/* Main Headline */}
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-white leading-[1.1] tracking-tight font-['Outfit',sans-serif]">
                Precision Farm{" "}
                <span className="text-[#D4E157] underline decoration-[#D4E157]/30 underline-offset-6">
                  Intelligence
                </span>{" "}
                & Tools
              </h1>

              {/* Subheading */}
              <p className="mt-3 text-sm sm:text-base text-white/85 leading-relaxed font-normal max-w-2xl">
                Empowering Kenyan farmers with real-time Open-Meteo weather analytics, live KAMIS wholesale commodity prices, spray suitability radar, and instant AI plant disease diagnosis.
              </p>

              {/* Action Buttons Row (Locked 1 Horizontal Row on Mobile) */}
              <div className="mt-5 flex flex-col sm:flex-row sm:items-center gap-3">
                {/* 2 Primary Buttons locked in 1 Horizontal Line */}
                <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
                  <button
                    onClick={() => {
                      const el = document.getElementById("interactive-console");
                      el?.scrollIntoView({ behavior: "smooth" });
                    }}
                    className="flex-1 sm:flex-initial px-3 sm:px-6 py-2.5 rounded-full bg-gradient-to-r from-[#85CC14] to-[#6FA810] text-[#0B2117] font-extrabold text-[11px] xs:text-xs sm:text-sm hover:brightness-110 shadow-md shadow-[#85CC14]/20 transition-all duration-200 flex items-center justify-center gap-1.5 sm:gap-2 cursor-pointer active:scale-98 whitespace-nowrap shrink-0"
                  >
                    <span>Open Control Console</span>
                    <ArrowRight className="h-3.5 w-3.5 sm:h-4 sm:w-4 stroke-[2.5] shrink-0" />
                  </button>

                  <Link
                    to="/shop"
                    className="flex-1 sm:flex-initial px-3 sm:px-6 py-2.5 rounded-full bg-white/15 backdrop-blur-md border border-white/25 text-white font-bold text-[11px] xs:text-xs sm:text-sm hover:bg-white/25 transition-all duration-200 flex items-center justify-center gap-1.5 sm:gap-2 cursor-pointer active:scale-98 whitespace-nowrap shrink-0"
                  >
                    <span>Browse Farm Supplies</span>
                  </Link>
                </div>

                {/* County Pill Selector */}
                <div className="flex items-center justify-between sm:justify-start gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white shadow-sm shrink-0 w-fit">
                  <div className="flex items-center gap-1.5">
                    <MapPin className="h-4 w-4 text-[#85CC14] shrink-0" />
                    <span className="text-xs font-bold uppercase tracking-wider text-white/90 shrink-0">County:</span>
                  </div>
                  <select
                    value={currentCounty}
                    onChange={(e) => selectCounty(e.target.value as CountyName)}
                    className="bg-transparent text-xs font-bold text-[#D4E157] outline-none cursor-pointer border-none max-w-[130px] truncate"
                  >
                    {countyList.map((c) => (
                      <option key={c} value={c} className="bg-[#0F291E] text-white">
                        {c} County
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Trust Badges Checkmark Row (2 on top, 1 below on mobile; 3 in 1 line on desktop) */}
              <div className="mt-5 pt-4 border-t border-white/10 flex flex-col sm:flex-row sm:items-center justify-between sm:justify-start gap-2.5 sm:gap-6 text-xs font-semibold text-white/90">
                {/* Top 2 Items on Mobile */}
                <div className="flex items-center justify-between sm:justify-start gap-3 sm:gap-6">
                  <div className="flex items-center gap-1.5 shrink-0">
                    <div className="p-0.5 rounded-full bg-[#85CC14]/20 text-[#85CC14] shrink-0">
                      <Check className="h-3 w-3 stroke-[3]" />
                    </div>
                    <span>Real-time Open-Meteo V3</span>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <div className="p-0.5 rounded-full bg-[#85CC14]/20 text-[#85CC14] shrink-0">
                      <Check className="h-3 w-3 stroke-[3]" />
                    </div>
                    <span>KAMIS Commodity Prices</span>
                  </div>
                </div>

                {/* 3rd Item centered below on mobile, inline on desktop */}
                <div className="flex items-center justify-center sm:justify-start gap-1.5 shrink-0 pt-0.5 sm:pt-0">
                  <div className="p-0.5 rounded-full bg-[#85CC14]/20 text-[#85CC14] shrink-0">
                    <Check className="h-3 w-3 stroke-[3]" />
                  </div>
                  <span>Instant AI Disease Doctor</span>
                </div>
              </div>

            </div>
          </div>

          {/* Stats Bar Ribbon at Bottom of Hero (Infinite Smooth Right-to-Left Marquee Carousel) */}
          <div className="relative z-10 bg-[#EDF7E2] border-t border-b border-[#D8EBC4] py-3.5 overflow-hidden">
            <div className="marquee-wrapper flex w-max items-center animate-marquee">
              {/* Track 1 */}
              <div className="flex shrink-0 items-center gap-10 sm:gap-16 pr-10 sm:pr-16">
                {[...HERO_STATS, ...HERO_STATS].map((stat, idx) => (
                  <div key={`t1-${idx}`} className="flex items-center gap-3 shrink-0">
                    <div className="p-2.5 rounded-full bg-[#85CC14]/25 text-[#2A520B] shrink-0">
                      <stat.icon className="h-5 w-5 stroke-[2]" />
                    </div>
                    <div className="text-left">
                      <span className="text-xl sm:text-2xl font-black text-[#1A380A] tracking-tight font-['Outfit',sans-serif] block leading-tight">
                        {stat.value}
                      </span>
                      <span className="text-[11px] font-semibold text-[#3D661B] whitespace-nowrap">{stat.label}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Track 2 (Identical Clone for 100% Seamless Infinite Continuous Loop) */}
              <div className="flex shrink-0 items-center gap-10 sm:gap-16 pr-10 sm:pr-16" aria-hidden="true">
                {[...HERO_STATS, ...HERO_STATS].map((stat, idx) => (
                  <div key={`t2-${idx}`} className="flex items-center gap-3 shrink-0">
                    <div className="p-2.5 rounded-full bg-[#85CC14]/25 text-[#2A520B] shrink-0">
                      <stat.icon className="h-5 w-5 stroke-[2]" />
                    </div>
                    <div className="text-left">
                      <span className="text-xl sm:text-2xl font-black text-[#1A380A] tracking-tight font-['Outfit',sans-serif] block leading-tight">
                        {stat.value}
                      </span>
                      <span className="text-[11px] font-semibold text-[#3D661B] whitespace-nowrap">{stat.label}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>


        {/* =========================================================================
            SECTION 2: FLOATING TAB SWITCHER CONSOLE (Deep Forest Green Theme)
           ========================================================================= */}
        <section id="interactive-console" className="sticky top-14 sm:top-16 z-40 py-3.5 px-2 sm:px-4 sm:container-px mx-auto max-w-7xl bg-[#FAFBF9]/90 backdrop-blur-md border-b border-slate-200/80">
          <div className="flex justify-center w-full max-w-2xl mx-auto">
            <div className="grid grid-cols-3 w-full sm:w-auto p-1.5 rounded-2xl sm:rounded-full bg-[#0B2117] border-2 border-[#85CC14]/40 shadow-lg shadow-[#0F291E]/20">
              {TABS.map(({ id, label, icon: Icon }) => {
                const isActive = activeTab === id;
                return (
                  <button
                    key={id}
                    onClick={() => setActiveTab(id)}
                    className={`flex items-center justify-center gap-1.5 sm:gap-2 px-2 sm:px-6 py-2.5 rounded-xl sm:rounded-full text-[11px] xs:text-xs sm:text-sm font-bold transition-all duration-200 ease-out whitespace-nowrap cursor-pointer active:scale-98 ${
                      isActive
                        ? "bg-[#85CC14] text-[#0B2117] font-black shadow-md shadow-[#85CC14]/25"
                        : "bg-transparent text-white/80 hover:text-white font-bold"
                    }`}
                  >
                    <Icon className={`h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0 ${isActive ? "text-[#0B2117] stroke-[2.5]" : "text-[#85CC14] stroke-[2]"}`} />
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

