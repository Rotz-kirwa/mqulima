import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Sun,
  Cloud,
  CloudRain,
  CloudSun,
  Wind,
  Droplets,
  Thermometer,
  MapPin,
  Search,
  Calendar,
  ShieldAlert,
  Brain,
  Activity,
  Bell,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import { AppLayout } from "@/components/mqulima/AppLayout";
import { useWeather, getWeatherValue } from "@/hooks/useWeather";
import { type WeatherField } from "@/lib/api/weather";

export const Route = createFileRoute("/climate")({
  head: () => ({
    meta: [
      { title: "Climate Intelligence Command — Mqulima" },
      {
        name: "description",
        content:
          "Real-time agricultural weather forecast, soil moisture, evapotranspiration, and AI planting calendars.",
      },
    ],
  }),
  component: ClimatePage,
});

interface Region {
  id: string;
  name: string;
  lat: number;
  lon: number;
  svgPath: string;
  cropSuitability: { crop: string; score: number; reason: string }[];
  pestRisk: { type: string; level: "Low" | "Medium" | "High"; pct: number }[];
}

const regions: Region[] = [
  {
    id: "rift",
    name: "Rift Valley (Eldoret / Nakuru)",
    lat: 0.5143,
    lon: 35.2698,
    svgPath: "M 20 80 Q 40 40 60 90 T 100 130 T 70 200 Z",
    cropSuitability: [
      { crop: "Maize", score: 95, reason: "Excellent soil moisture and rainfall windows." },
      { crop: "Potatoes", score: 88, reason: "Cool highland temperatures are optimal." },
      { crop: "Avocados", score: 90, reason: "Consistent humidity profile." },
    ],
    pestRisk: [
      { type: "Fall Armyworm", level: "Low", pct: 15 },
      { type: "Late Blight", level: "Medium", pct: 45 },
    ],
  },
  {
    id: "central",
    name: "Central Highlands (Nyeri / Kiambu)",
    lat: -0.4201,
    lon: 36.9476,
    svgPath: "M 110 110 Q 130 90 150 120 T 140 180 Z",
    cropSuitability: [
      { crop: "Coffee", score: 94, reason: "Altitude and misting layers fit perfectly." },
      { crop: "Tea", score: 97, reason: "Acidic soil profile and temperature range." },
      { crop: "Vegetables", score: 85, reason: "Good irrigation opportunities." },
    ],
    pestRisk: [
      { type: "Stem Borer", level: "Medium", pct: 35 },
      { type: "Fungal Spot", level: "High", pct: 78 },
    ],
  },
  {
    id: "eastern",
    name: "Eastern Zone (Meru / Machakos)",
    lat: -1.5177,
    lon: 37.2634,
    svgPath: "M 160 110 Q 200 100 210 160 T 170 210 Z",
    cropSuitability: [
      { crop: "Beans", score: 90, reason: "Soil temperatures ideal for rapid germination." },
      { crop: "Mangoes", score: 92, reason: "Warm sunshine hours boost sugar levels." },
      { crop: "Pasture", score: 65, reason: "Limited moisture; requires rotational grazing." },
    ],
    pestRisk: [
      { type: "Locusts", level: "Low", pct: 8 },
      { type: "Aphids", level: "High", pct: 82 },
    ],
  },
  {
    id: "nyanza",
    name: "Nyanza Lake Basin (Kisumu / Kisii)",
    lat: -0.1022,
    lon: 34.7617,
    svgPath: "M 5 110 Q 30 110 35 150 T 15 180 Z",
    cropSuitability: [
      {
        crop: "Sugar Cane",
        score: 96,
        reason: "High heat units and humidity support stalk growth.",
      },
      { crop: "Maize", score: 78, reason: "Risk of waterlogging in lowland clay soils." },
      { crop: "Sweet Potatoes", score: 89, reason: "Stable night temperatures." },
    ],
    pestRisk: [
      { type: "Striga Weed", level: "High", pct: 85 },
      { type: "Armyworm", level: "Medium", pct: 55 },
    ],
  },
  {
    id: "coast",
    name: "Coastal Strip (Mombasa / Kilifi)",
    lat: -4.0544,
    lon: 39.6635,
    svgPath: "M 220 230 Q 250 250 270 280 T 230 330 Z",
    cropSuitability: [
      { crop: "Coconuts", score: 98, reason: "High humidity and salt tolerance match perfectly." },
      { crop: "Cashew Nuts", score: 93, reason: "Warm season allows excellent setting." },
      { crop: "Vegetables", score: 55, reason: "High heat stress; shading recommended." },
    ],
    pestRisk: [
      { type: "Whitefly", level: "High", pct: 90 },
      { type: "Root Rot", level: "Medium", pct: 50 },
    ],
  },
];

function ClimatePage() {
  const [selectedRegion, setSelectedRegion] = useState<Region>(regions[0]);
  const [searchQuery, setSearchQuery] = useState("");
  const [subscribeEmail, setSubscribeEmail] = useState("");
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);
  const {
    data: weatherData,
    isLoading: loading,
    isError,
  } = useWeather(selectedRegion.lat, selectedRegion.lon);

  const getVal = (field: WeatherField) => getWeatherValue(weatherData, field);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    const query = searchQuery.toLowerCase();
    const matched = regions.find((r) => r.name.toLowerCase().includes(query));
    if (matched) {
      setSelectedRegion(matched);
      toast.success(`Coordinates locked to: ${matched.name}`);
    } else {
      const fallback = regions.find((r) => r.id === "rift") ?? regions[0];
      setSelectedRegion(fallback);
      toast.error(`Location not matched. Defaulting to ${fallback.name}.`);
    }
  };

  const handleAlertSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subscribeEmail.trim()) return;
    toast.success(`Subscribed ${subscribeEmail} to severe climate alert reports!`);
    setSubscribeEmail("");
  };

  const handleRetry = () => {
    setSelectedRegion((r) => ({ ...r }));
  };

  // Sowing rating calculation helper
  const getSowingRating = (idx: number) => {
    const rainProb = 10 + ((idx * 17) % 80);
    if (rainProb > 60) return { label: "Optimal Sowing", color: "bg-emerald-500 text-white" };
    if (rainProb > 30) return { label: "Favorable Sowing", color: "bg-amber-500 text-white" };
    return { label: "Delay Sowing (Dry)", color: "bg-rose-500/80 text-white" };
  };

  return (
    <AppLayout>
      <div className="bg-background text-foreground min-h-screen py-10 font-sans selection:bg-primary/20 selection:text-primary">
        <div className="container-px mx-auto max-w-7xl">
          {/* Header section with telemetry badge */}
          <div className="flex flex-col md:flex-row items-center justify-between border-b border-border/80 pb-6 gap-4">
            <div className="text-center md:text-left">
              <span className="inline-flex items-center gap-1.5 rounded bg-primary/10 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-primary">
                <Activity className="h-3 w-3 animate-pulse" /> Live Agro-Meteorological Intel
              </span>
              <h1 className="mt-2.5 text-3xl font-extrabold tracking-tight text-forest md:text-4xl">
                Climate Intelligence Dashboard
              </h1>
              <p className="text-xs text-muted-foreground mt-0.5">
                Simple, real-time agricultural telemetry designed for everyday farm decisions.
              </p>
            </div>

            {/* Station Search */}
            <form
              onSubmit={handleSearchSubmit}
              className="flex w-full max-w-md items-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5 shadow-elegant"
            >
              <Search className="h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search County (e.g. Rift, Central, Eastern)..."
                className="flex-1 bg-transparent text-xs outline-none text-foreground placeholder:text-muted-foreground"
              />
              <button
                type="submit"
                className="rounded bg-gold px-3.5 py-1 text-[10px] font-bold text-gold-foreground hover:scale-105 transition shadow-gold"
              >
                Lock Coordinates
              </button>
            </form>
          </div>

          {/* Main Bento Grid */}
          <div className="mt-8 grid gap-6 lg:grid-cols-3">
            {/* Box 1: Interactive SVG Map */}
            <div className="rounded-3xl border border-border/60 bg-card p-6 flex flex-col justify-between shadow-elegant lg:col-span-1">
              <div>
                <h3 className="text-xs font-bold text-foreground tracking-wider uppercase border-b border-border pb-3 flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-primary" /> Region Selector Map
                </h3>
                <p className="text-[11px] text-muted-foreground mt-2">
                  Click an agricultural region to sync live soil, moisture, and sowing data.
                </p>
              </div>

              {/* Map Canvas */}
              <div className="my-8 flex justify-center items-center relative">
                <svg viewBox="0 0 280 340" className="w-full max-w-[230px] h-auto drop-shadow-md">
                  {regions.map((reg) => (
                    <path
                      key={reg.id}
                      d={reg.svgPath}
                      onClick={() => setSelectedRegion(reg)}
                      className={`cursor-pointer transition-all duration-300 stroke-border stroke-2 hover:fill-primary/20 ${
                        selectedRegion.id === reg.id
                          ? "fill-primary/10 stroke-primary"
                          : "fill-secondary/60"
                      }`}
                    />
                  ))}

                  {/* Glowing Radar beacon at selected station */}
                  {selectedRegion && (
                    <circle
                      cx={
                        selectedRegion.id === "rift"
                          ? 60
                          : selectedRegion.id === "central"
                            ? 130
                            : selectedRegion.id === "eastern"
                              ? 180
                              : selectedRegion.id === "nyanza"
                                ? 25
                                : 240
                      }
                      cy={
                        selectedRegion.id === "rift"
                          ? 110
                          : selectedRegion.id === "central"
                            ? 130
                            : selectedRegion.id === "eastern"
                              ? 150
                              : selectedRegion.id === "nyanza"
                                ? 140
                                : 270
                      }
                      r="6"
                      className="fill-gold stroke-card stroke-2 animate-pulse"
                    />
                  )}
                </svg>
              </div>

              {/* Locked Coordinates details */}
              <div className="rounded-2xl bg-secondary/40 border border-border p-4 text-xs font-mono">
                <div className="text-muted-foreground">Locked Station:</div>
                <div className="text-foreground font-bold mt-1">{selectedRegion.name}</div>
                <div className="text-primary mt-0.5 font-bold">
                  LAT {selectedRegion.lat.toFixed(4)} | LON {selectedRegion.lon.toFixed(4)}
                </div>
              </div>
            </div>

            {/* Box 2: Telemetry Dashboard & AI Advisor */}
            <div className="lg:col-span-2 flex flex-col justify-between gap-6">
              {/* Telemetry Grid */}
              <div className="rounded-3xl border border-border/60 bg-card p-6 shadow-elegant flex-1">
                <div className="flex items-center justify-between border-b border-border pb-4">
                  <div>
                    <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">
                      Live Telemetry Metrics
                    </span>
                    <h2 className="text-lg font-bold text-foreground mt-0.5">
                      {selectedRegion.name} Station
                    </h2>
                  </div>
                  {loading ? (
                    <span className="flex items-center gap-1.5 text-xs text-primary font-semibold">
                      <RefreshCw className="h-3.5 w-3.5 animate-spin" /> Querying API...
                    </span>
                  ) : (
                    <span className="text-[10px] bg-emerald-500/10 text-emerald-600 px-2 py-0.5 rounded font-bold uppercase">
                      Online
                    </span>
                  )}
                </div>

                <div className="mt-6 grid gap-4 grid-cols-2 sm:grid-cols-3">
                  <div className="rounded-2xl border border-border/60 bg-secondary/25 p-4 flex flex-col justify-between">
                    <div className="flex items-center justify-between text-muted-foreground">
                      <span className="text-[9px] uppercase font-bold tracking-wider">
                        Air Temp
                      </span>
                      <Thermometer className="h-4 w-4 text-primary" />
                    </div>
                    <div className="text-2xl font-black font-mono mt-3 text-foreground">
                      {getVal("temp")}°C
                    </div>
                    <div className="text-[9px] text-muted-foreground mt-1">
                      Apparent: {getVal("feelsLike")}°C
                    </div>
                  </div>

                  <div className="rounded-2xl border border-border/60 bg-secondary/25 p-4 flex flex-col justify-between">
                    <div className="flex items-center justify-between text-muted-foreground">
                      <span className="text-[9px] uppercase font-bold tracking-wider">
                        Rain Prob
                      </span>
                      <CloudRain className="h-4 w-4 text-primary" />
                    </div>
                    <div className="text-2xl font-black font-mono mt-3 text-foreground">
                      {getVal("rain")}%
                    </div>
                    <div className="text-[9px] text-muted-foreground mt-1">
                      Daily peak likelihood
                    </div>
                  </div>

                  <div className="rounded-2xl border border-border/60 bg-secondary/25 p-4 flex flex-col justify-between">
                    <div className="flex items-center justify-between text-muted-foreground">
                      <span className="text-[9px] uppercase font-bold tracking-wider">
                        Soil Temp
                      </span>
                      <Thermometer className="h-4 w-4 text-primary" />
                    </div>
                    <div className="text-2xl font-black font-mono mt-3 text-foreground">
                      {getVal("soilTemp")}°C
                    </div>
                    <div className="text-[9px] text-muted-foreground mt-1">At depth 0-7cm</div>
                  </div>

                  <div className="rounded-2xl border border-border/60 bg-secondary/25 p-4 flex flex-col justify-between">
                    <div className="flex items-center justify-between text-muted-foreground">
                      <span className="text-[9px] uppercase font-bold tracking-wider">
                        Humidity
                      </span>
                      <Droplets className="h-4 w-4 text-primary" />
                    </div>
                    <div className="text-2xl font-black font-mono mt-3 text-foreground">
                      {getVal("humidity")}%
                    </div>
                    <div className="text-[9px] text-muted-foreground mt-1">
                      Relative air moisture
                    </div>
                  </div>

                  <div className="rounded-2xl border border-border/60 bg-secondary/25 p-4 flex flex-col justify-between">
                    <div className="flex items-center justify-between text-muted-foreground">
                      <span className="text-[9px] uppercase font-bold tracking-wider">
                        Wind Velocity
                      </span>
                      <Wind className="h-4 w-4 text-primary" />
                    </div>
                    <div className="text-2xl font-black font-mono mt-3 text-foreground">
                      {getVal("wind")} km/h
                    </div>
                    <div className="text-[9px] text-muted-foreground mt-1">
                      Directional flow: East
                    </div>
                  </div>

                  {/* Soil Moisture Gauge */}
                  <div className="rounded-2xl border border-border/60 bg-secondary/25 p-4 flex flex-col justify-between">
                    <div className="flex items-center justify-between text-muted-foreground">
                      <span className="text-[9px] uppercase font-bold tracking-wider">
                        Soil Moisture
                      </span>
                      <Droplets className="h-4 w-4 text-primary" />
                    </div>
                    <div className="text-2xl font-black font-mono mt-3 text-foreground">
                      {getVal("soilMoisture")} m³/m³
                    </div>
                    <div className="mt-2 h-1.5 w-full bg-secondary rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full transition-all duration-500"
                        style={{ width: `${getVal("soilMoisture") * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* AI Sowing Advisor */}
              <div className="rounded-3xl border border-primary/20 bg-primary/5 p-6 shadow-elegant">
                <div className="flex items-center gap-2">
                  <Brain className="h-5 w-5 text-primary" />
                  <h3 className="text-xs font-bold text-primary tracking-wider uppercase">
                    AI Agronomist Insights
                  </h3>
                </div>
                <p className="mt-3 text-xs text-foreground/80 leading-relaxed font-medium">
                  "Soil moisture levels are currently at {getVal("soilMoisture")} m³/m³, which is
                  ideal for sowing and root development. With rain probability peaking at{" "}
                  {getVal("rain")}% within 48 hours, it is optimal to plant now. Postpone direct
                  nitrogen fertilization for 2 days to avoid runoff."
                </p>
              </div>
            </div>
          </div>

          {/* Sowing Forecast Strip */}
          <section className="mt-8">
            <div className="rounded-3xl border border-border bg-card p-6 shadow-elegant">
              <h3 className="text-sm font-bold text-foreground flex items-center gap-2 border-b border-border pb-4">
                <Calendar className="h-4.5 w-4.5 text-primary" /> Actionable 7-Day Sowing Calendar
              </h3>

              <div className="mt-6 grid gap-4 grid-cols-2 sm:grid-cols-4 lg:grid-cols-7">
                {Array.from({ length: 7 }).map((_, idx) => {
                  const day = new Date();
                  day.setDate(day.getDate() + idx);
                  const isEven = idx % 2 === 0;
                  const tempMax = Math.round(21 + (idx % 3));
                  const tempMin = Math.round(13 - (idx % 2));
                  const rating = getSowingRating(idx);

                  return (
                    <div
                      key={idx}
                      className="rounded-2xl border border-border/60 bg-secondary/15 p-4 text-center hover:border-primary/45 transition duration-300"
                    >
                      <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                        {mounted
                          ? day.toLocaleDateString("en-US", { weekday: "short", day: "numeric" })
                          : "--"}
                      </div>
                      {idx % 3 === 0 ? (
                        <CloudRain className="mx-auto my-3 h-8 w-8 text-primary" />
                      ) : isEven ? (
                        <CloudSun className="mx-auto my-3 h-8 w-8 text-primary" />
                      ) : (
                        <Sun className="mx-auto my-3 h-8 w-8 text-primary" />
                      )}
                      <div className="text-xs font-bold text-foreground font-mono">
                        {tempMax}°C / {tempMin}°C
                      </div>

                      <span
                        className={`mt-3 inline-block rounded-full px-2 py-0.5 text-[8px] font-bold ${rating.color}`}
                      >
                        {rating.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>

          {/* Suitability & Pest Risk Engine */}
          <div className="mt-8 grid gap-6 md:grid-cols-2">
            {/* Suitability */}
            <div className="rounded-3xl border border-border bg-card p-6 shadow-elegant">
              <h3 className="text-xs font-bold text-foreground tracking-wider uppercase border-b border-border pb-3 flex items-center gap-2">
                <Brain className="h-4 w-4 text-primary" /> Regional Crop Suitability Index
              </h3>
              <div className="mt-5 space-y-4">
                {selectedRegion.cropSuitability.map((suit, idx) => (
                  <div key={idx} className="rounded-2xl border border-border bg-secondary/10 p-4">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-foreground text-xs">{suit.crop}</span>
                      <span className="font-mono text-xs font-bold text-primary">
                        {suit.score}% Suitable
                      </span>
                    </div>
                    <p className="mt-1.5 text-[11px] text-muted-foreground leading-relaxed">
                      {suit.reason}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Disease & Pest risks */}
            <div className="rounded-3xl border border-border bg-card p-6 shadow-elegant">
              <h3 className="text-xs font-bold text-foreground tracking-wider uppercase border-b border-border pb-3 flex items-center gap-2">
                <ShieldAlert className="h-4 w-4 text-primary" /> Disease & Pest Outbreak Risks
              </h3>
              <div className="mt-5 space-y-5">
                {selectedRegion.pestRisk.map((pest, idx) => (
                  <div
                    key={idx}
                    className="rounded-2xl border border-border bg-secondary/10 p-4 flex flex-col justify-between"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-foreground font-bold">{pest.type} Risk</span>
                      <span
                        className={`font-bold ${
                          pest.level === "High"
                            ? "text-rose-600"
                            : pest.level === "Medium"
                              ? "text-amber-600"
                              : "text-emerald-600"
                        }`}
                      >
                        {pest.level} ({pest.pct}%)
                      </span>
                    </div>
                    <div className="mt-2.5 h-1.5 w-full bg-secondary rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          pest.level === "High"
                            ? "bg-rose-500"
                            : pest.level === "Medium"
                              ? "bg-amber-500"
                              : "bg-emerald-500"
                        }`}
                        style={{ width: `${pest.pct}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Simple Crop Alerts Signup form */}
          <section className="mt-8">
            <div className="rounded-3xl border border-border bg-card p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-elegant">
              <div className="max-w-md text-left">
                <h3 className="text-base font-extrabold text-foreground flex items-center gap-2">
                  <Bell className="h-4.5 w-4.5 text-primary" /> Sowing Alerts & Severe Weather
                  Updates
                </h3>
                <p className="mt-1.5 text-xs text-muted-foreground">
                  Get instant crop weather advisory reports, severe storm warnings, and planting
                  windows delivered to your inbox.
                </p>
              </div>

              <form onSubmit={handleAlertSubscribe} className="flex w-full max-w-md gap-2">
                <input
                  type="email"
                  value={subscribeEmail}
                  onChange={(e) => setSubscribeEmail(e.target.value)}
                  placeholder="Enter your email address"
                  className="flex-1 rounded-xl border border-border bg-background px-4 py-2.5 text-xs text-foreground outline-none focus:border-primary"
                  required
                />
                <button
                  type="submit"
                  className="rounded-xl bg-gold px-5 py-2.5 text-xs font-bold text-gold-foreground shadow-gold hover:scale-105 transition"
                >
                  Subscribe
                </button>
              </form>
            </div>
          </section>
        </div>
      </div>
    </AppLayout>
  );
}
