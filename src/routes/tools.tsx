import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { AppLayout } from "@/components/mqulima/AppLayout";
import {
  CloudSun,
  TrendingUp,
  Wrench,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import toolsHero from "@/assets/mqulima_tools_hero.png";

// Modular sub-panels
import { WeatherPanel } from "@/components/mqulima/tools/WeatherPanel";
import { MarketsPanel } from "@/components/mqulima/tools/MarketsPanel";
import { CropDoctor } from "@/components/mqulima/tools/CropDoctor";

export const Route = createFileRoute("/tools")({
  head: () => ({
    meta: [
      { title: "Mqulima Tools · Advanced Agricultural Intelligence" },
      {
        name: "description",
        content:
          "Access real-time weather analytics, wholesale market prices, soil/climate advisories, and instant AI crop disease diagnosis.",
      },
    ],
  }),
  component: ToolsPage,
});

type Tab = "weather" | "markets" | "doctor";

const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: "weather", label: "Weather",       icon: CloudSun },
  { id: "markets", label: "Markets",       icon: TrendingUp },
  { id: "doctor",  label: "AI Crop Doctor",icon: Wrench },
];

import { useWeather } from "@/hooks/useWeather";

function ToolsPage() {
  const [activeTab, setActiveTab] = useState<Tab>("weather");
  const weatherState = useWeather("Nairobi");

  return (
    <AppLayout>
      <div className="bg-[#FAF9F5] text-[#0A1E0C] min-h-screen font-sans">

        {/* ══════════════════════════════════════════
            HERO BANNER
        ══════════════════════════════════════════ */}
        <section className="relative overflow-hidden border-b border-[#0A1E0C]/5 bg-[#F4F8F5] py-10 lg:py-14">
          <div className="absolute left-1/4 top-1/4 h-[250px] w-[250px] rounded-full bg-[#52B788]/10 blur-[100px] pointer-events-none" />
          <div className="absolute right-1/4 bottom-1/4 h-[200px] w-[200px] rounded-full bg-[#F5A623]/8 blur-[80px] pointer-events-none" />

          <div className="container-px mx-auto max-w-7xl relative z-10">
            <div className="grid gap-8 lg:grid-cols-12 lg:items-center">

              {/* Left Column */}
              <div className="lg:col-span-7 text-left space-y-4">
                <div className="inline-flex items-center gap-2 rounded-full bg-[#52B788]/15 px-3 py-0.5 text-[9px] font-bold uppercase tracking-wider text-[#409c71]">
                  <Sparkles className="h-3 w-3" />
                  Mqulima AI-Core Active
                </div>

                <h1 className="text-3xl font-extrabold tracking-tight sm:text-5xl text-[#0A1E0C] font-serif uppercase leading-tight">
                  Advanced <br />
                  <span className="bg-gradient-to-r from-[#2D6A4F] via-[#52B788] to-[#F5A623] bg-clip-text text-transparent">
                    Agri-Tools
                  </span>
                </h1>

                <p className="text-sm text-[#2D3A2F]/90 max-w-xl leading-relaxed">
                  Empowering Kenyan growers with next-generation technology. Instantly scan
                  crops for pests, monitor live local weather, map commodity price shifts, and
                  calculate precision soil fertiliser plans.
                </p>

                <div className="flex flex-wrap gap-2.5 pt-1">
                  <button
                    onClick={() => {
                      document.getElementById("dashboard-control")?.scrollIntoView({ behavior: "smooth" });
                    }}
                    className="h-10 px-5 bg-[#F5A623] hover:bg-[#e09520] text-white font-extrabold text-xs uppercase tracking-wider rounded-none transition flex items-center gap-2 shadow-sm shadow-[#F5A623]/25"
                  >
                    Open Control Console
                    <ChevronRight className="h-3.5 w-3.5" />
                  </button>
                  <Link
                    to="/shop"
                    className="h-10 px-5 border border-[#0A1E0C]/20 bg-[#0A1E0C]/5 hover:bg-[#0A1E0C]/10 text-[#0A1E0C] font-bold text-xs uppercase tracking-wider rounded-none transition flex items-center justify-center"
                  >
                    Browse Supplies
                  </Link>
                </div>

                {/* Stat pills */}
                <div className="flex flex-wrap gap-3 pt-2">
                  {[
                    { label: "Live Weather", val: "Open-Meteo" },
                    { label: "Market Prices", val: "DB Synced" },
                    { label: "AI Diagnoses", val: "History Saved" },
                    { label: "Counties", val: "5 Regions" },
                  ].map(({ label, val }) => (
                    <div key={label} className="bg-white/60 border border-[#0A1E0C]/10 px-3 py-1.5 text-center">
                      <div className="text-[8px] font-bold uppercase tracking-wider text-[#2D3A2F]/60">{label}</div>
                      <div className="text-[10px] font-black text-[#2D6A4F] mt-0.5">{val}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right Column Image */}
              <div className="lg:col-span-5 relative flex justify-center">
                <div className="relative group max-w-xs sm:max-w-sm w-full">
                  <div className="absolute -inset-1 rounded-none bg-gradient-to-r from-[#52B788] to-[#F5A623] opacity-20 blur-lg group-hover:opacity-35 transition duration-500" />
                  <div className="relative rounded-none border border-[#0A1E0C]/10 bg-white p-1.5 overflow-hidden shadow-md">
                    <img
                      src={toolsHero}
                      alt="Mqulima AI Control Center Dashboard"
                      className="w-full object-cover rounded-none aspect-square scale-98 group-hover:scale-100 transition-transform duration-500"
                    />
                    <div className="absolute inset-x-0 h-0.5 bg-[#22C55E]/80 shadow-[0_0_10px_#22C55E] top-1/2 animate-bounce pointer-events-none" />
                  </div>
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════
            TABBED INTERACTIVE CONSOLE
        ══════════════════════════════════════════ */}
        <section id="dashboard-control" className="py-16 container-px mx-auto max-w-[95%] xl:max-w-[90%] 2xl:max-w-[1600px]">

          {/* Tab selector */}
          <div className="flex flex-wrap border-b border-[#2D6A4F]/40 bg-[#091D13] p-1">
            {TABS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`flex items-center gap-2 px-4 sm:px-6 py-4 text-xs font-extrabold uppercase tracking-wider rounded-none transition border-b-2 ${
                  activeTab === id
                    ? "border-[#F5A623] text-[#FAF9F5] bg-[#112F20]"
                    : "border-transparent text-[#FAF9F5]/60 hover:text-[#FAF9F5] hover:bg-[#112F20]/30"
                }`}
              >
                <Icon className="h-4 w-4 text-[#F5A623]" />
                {label}
              </button>
            ))}
          </div>

          {/* Tab panels */}
          <div className="bg-[#112F20] border-x border-b border-[#2D6A4F]/40 p-6 sm:p-8 text-left shadow-lg text-[#FAF9F5]">
            {activeTab === "weather" && <WeatherPanel weatherState={weatherState} />}
            {activeTab === "markets" && <MarketsPanel />}
            {activeTab === "doctor"  && <CropDoctor weatherState={weatherState} />}
          </div>

        </section>

      </div>
    </AppLayout>
  );
}
