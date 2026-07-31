// ============================================================================
// WeatherPanel.tsx — Live Open-Meteo Weather Intelligence Panel
// Bright Light Theme — Fresh Greens, Crisp Whites, Sun Yellow Accents
// ============================================================================

import { useState, useEffect } from "react";
import { wmoCodeToIconKind } from "@/lib/weather-service";

import {
  Sun,
  CloudSun,
  Cloud,
  CloudRain,
  CloudDrizzle,
  CloudLightning,
  Snowflake,
  AlertTriangle,
  Navigation,
  RefreshCw,
  MapPin,
  Clock,
  Droplets,
  Wind,
  Zap,
  Leaf,
  Calendar
} from "lucide-react";
import { useWeather, KENYA_COUNTIES, resolveLabel, type CountyName, type UseWeatherState } from "@/hooks/useWeather";
import type { WeatherIconKind } from "@/lib/weather-service";
import type { DailyForecast } from "@/lib/weather-types";

function WeatherIcon({ kind, className, inverted }: { kind: WeatherIconKind; className?: string; inverted?: boolean }) {
  const cls = className ?? "h-6 w-6";
  if (inverted) {
    switch (kind) {
      case "sun":     return <Sun className={`${cls} text-[#FBBF24] animate-pulse drop-shadow-md`} />;
      case "partly":  return <CloudSun className={`${cls} text-sky-100 drop-shadow-md`} />;
      case "cloudy":  return <Cloud className={`${cls} text-sky-200 drop-shadow-md`} />;
      case "rain":    return <CloudRain className={`${cls} text-[#38BDF8] animate-bounce drop-shadow-md`} />;
      case "drizzle": return <CloudDrizzle className={`${cls} text-[#38BDF8] drop-shadow-md`} />;
      case "storm":   return <CloudLightning className={`${cls} text-[#FBBF24] animate-pulse drop-shadow-md`} />;
      case "snow":    return <Snowflake className={`${cls} text-sky-100 drop-shadow-md`} />;
      case "fog":     return <Cloud className={`${cls} text-sky-200 drop-shadow-md`} />;
      default:        return <CloudSun className={`${cls} text-sky-100 drop-shadow-md`} />;
    }
  }
  switch (kind) {
    case "sun":     return <Sun className={`${cls} text-[#F5A623] animate-pulse`} />;
    case "partly":  return <CloudSun className={`${cls} text-[#0284C7]`} />;
    case "cloudy":  return <Cloud className={`${cls} text-[#64748B]`} />;
    case "rain":    return <CloudRain className={`${cls} text-[#0284C7] animate-bounce`} />;
    case "drizzle": return <CloudDrizzle className={`${cls} text-[#0284C7]`} />;
    case "storm":   return <CloudLightning className={`${cls} text-[#F5A623] animate-pulse`} />;
    case "snow":    return <Snowflake className={`${cls} text-[#0284C7]`} />;
    case "fog":     return <Cloud className={`${cls} text-[#64748B]`} />;
    default:        return <CloudSun className={`${cls} text-[#0284C7]`} />;
  }
}

function windDirection(deg: number): string {
  const dirs = ["N","NNE","NE","ENE","E","ESE","SE","SSE","S","SSW","SW","WSW","W","WNW","NW","NNW"];
  return dirs[Math.round(deg / 22.5) % 16];
}

function fmtTime(iso: string): string {
  return iso?.substring(11, 16) ?? "—";
}

function useClock() {
  const [mounted, setMounted] = useState(false);
  const [now, setNow] = useState<Date>(() => new Date());

  useEffect(() => {
    setMounted(true);
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  if (!mounted) {
    return { mounted: false, timeStr: "--:--:--", dateStr: "...", dateShort: "..." };
  }

  const timeStr = now.toLocaleTimeString("en-KE", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
    timeZone: "Africa/Nairobi",
  });

  const dateStr = now.toLocaleDateString("en-KE", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "Africa/Nairobi",
  });

  return { mounted: true, timeStr, dateStr };
}

function ForecastCard({ day, isToday }: { day: DailyForecast; isToday?: boolean }) {
  const kind: WeatherIconKind = wmoCodeToIconKind(day.weatherCode);
  return (
    <div
      className={`flex flex-col rounded-2xl overflow-hidden border-2 transition-all duration-300 shadow-sm hover:shadow-md group ${
        isToday
          ? "border-[#85CC14] ring-2 ring-[#85CC14]/30 shadow-[#85CC14]/20 scale-[1.02]"
          : "border-[#D8EBC4] hover:border-[#85CC14]/70"
      }`}
    >
      {/* 1. Day Header Banner */}
      <div className={`py-2 px-1 text-center font-mono font-extrabold text-xs uppercase tracking-wider ${
        isToday ? "bg-[#85CC14] text-[#0B2117] shadow-xs" : "bg-[#0F291E] text-white/90"
      }`}>
        {isToday ? "TODAY" : day.dayLabel}
      </div>

      {/* 2. Visual Weather Condition Body */}
      <div className="flex-1 p-2 sm:p-3 bg-gradient-to-b from-[#0F291E] via-[#143B2B] to-[#0A2118] flex flex-col items-center justify-between space-y-2 text-center min-h-[120px] sm:min-h-[135px]">
        <div className="h-10 w-10 sm:h-12 sm:w-12 flex items-center justify-center group-hover:scale-110 transition-transform filter drop-shadow-sm">
          <WeatherIcon kind={kind} className="h-8 w-8 sm:h-9 sm:w-9" inverted />
        </div>

        <div className="space-y-1 w-full">
          <span className="text-[10px] sm:text-[11px] font-bold text-white block truncate leading-tight drop-shadow-xs">
            {day.conditionLabel}
          </span>

          <div className="w-full bg-[#071911] rounded-full h-1.5 overflow-hidden mt-1 border border-[#85CC14]/30">
            <div
              className="bg-[#85CC14] h-full rounded-full transition-all duration-500 shadow-xs"
              style={{ width: `${day.precipitationProbMax}%` }}
            />
          </div>
          <span className="text-[9px] font-mono font-bold text-[#D4E157] block pt-0.5">
            {day.precipitationProbMax}% rain
          </span>
        </div>
      </div>

      {/* 3. High Temperature Block (Lime Agriculture Green Bar) */}
      <div className="bg-[#85CC14] text-[#0B2117] py-1.5 px-1 text-center font-mono font-black text-sm sm:text-base flex items-center justify-center gap-0.5 shadow-xs">
        <span>{day.tempMax}°</span>
        <span className="text-[9px] font-extrabold uppercase text-[#0B2117]/80">HI</span>
      </div>

      {/* 4. Low Temperature Block (Dark Forest Emerald Bar) */}
      <div className="bg-[#0A2118] text-[#D4E157] py-1.5 px-1 text-center font-mono font-bold text-xs sm:text-sm border-t border-emerald-900/60 flex items-center justify-center gap-0.5">
        <span>{day.tempMin}°</span>
        <span className="text-[8px] font-bold uppercase text-emerald-300/70">LO</span>
      </div>
    </div>
  );
}

interface WeatherPanelProps {
  weatherState?: UseWeatherState;
}

export function WeatherPanel({ weatherState }: WeatherPanelProps = {}) {
  const localState = useWeather("Nairobi");
  const state = weatherState ?? localState;
  const {
    data,
    loading,
    error,
    location,
    lastFetchedAt,
    selectCounty,
    detectGPS,
    refresh,
  } = state;

  const locationLabel = resolveLabel(location);
  const countyList = Object.keys(KENYA_COUNTIES) as CountyName[];
  const currentCounty = location.type === "county" ? location.county : "";
  const { mounted, timeStr, dateStr } = useClock();

  const lastUpdated = mounted && lastFetchedAt
    ? new Date(lastFetchedAt).toLocaleTimeString("en-KE", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      })
    : null;

  const tempVal = data?.current.temperature_2m ?? 22;

  return (
    <div className="space-y-8 animate-fadeIn">

      {/* ── Top Header Controls (Deep Forest Green Theme) ─────────────────────────── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 sm:p-6 rounded-2xl sm:rounded-3xl bg-gradient-to-br from-[#0B2117] via-[#0F291E] to-[#143B2B] border-2 border-[#85CC14]/30 shadow-xl shadow-[#0F291E]/20 text-white relative overflow-hidden">
        {/* Subtle Ambient Radial Glow */}
        <div className="absolute -top-12 -left-12 w-48 h-48 bg-[#85CC14]/10 rounded-full blur-2xl pointer-events-none" />

        <div className="space-y-1.5 text-left w-full sm:w-auto relative z-10">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-lg sm:text-xl font-black uppercase tracking-wider text-white font-['Outfit',sans-serif]">
              AGRO-METEOROLOGICAL COMMAND CORE
            </h3>
            <span className="px-2.5 py-0.5 rounded-full bg-[#85CC14]/20 border border-[#85CC14]/40 text-[10px] font-mono font-extrabold text-[#85CC14] shrink-0">
              OPEN-METEO V3
            </span>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 flex-wrap text-xs text-white/80">
            <div className="flex items-center gap-1.5">
              <Clock className="h-4 w-4 text-[#85CC14] shrink-0" />
              <span suppressHydrationWarning className="font-black text-white font-mono tracking-widest text-xs sm:text-sm">
                {timeStr}
              </span>
              <span className="text-[10px] font-bold text-[#D4E157] font-mono">EAT</span>
            </div>
            <span className="hidden xs:inline text-[#85CC14]/40">•</span>
            <span suppressHydrationWarning className="font-mono text-xs text-white/90">
              {dateStr}
            </span>
            {lastUpdated && (
              <>
                <span className="hidden sm:inline text-[#85CC14]/40">•</span>
                <span className="text-[10px] text-white/60 font-mono block sm:inline">
                  Synced at {lastUpdated}
                </span>
              </>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 flex-wrap w-full sm:w-auto justify-between sm:justify-start pt-2 sm:pt-0 border-t sm:border-t-0 border-[#85CC14]/20 relative z-10">
          {/* GPS Detect Action Button */}
          <button
            onClick={detectGPS}
            disabled={loading}
            className="flex items-center gap-1.5 sm:gap-2 px-3.5 sm:px-4 py-2 rounded-full bg-[#85CC14] hover:bg-[#72b310] text-[#0B2117] text-[11px] sm:text-xs font-mono font-extrabold shadow-md shadow-[#85CC14]/20 transition disabled:opacity-40 border border-[#85CC14]/50 cursor-pointer active:scale-95"
          >
            <Navigation className="h-3.5 w-3.5 shrink-0 text-[#0B2117]" />
            <span>GPS DETECT</span>
          </button>

          {/* Refresh Button */}
          <button
            onClick={refresh}
            disabled={loading}
            className="h-9 w-9 flex items-center justify-center rounded-full bg-[#091D14] border-2 border-[#85CC14]/50 text-[#85CC14] hover:bg-[#85CC14] hover:text-[#0B2117] transition disabled:opacity-40 shadow-sm shrink-0 cursor-pointer active:scale-95"
            title="Refresh weather"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </button>

          {/* County Dropdown */}
          <div className="flex items-center gap-1.5 sm:gap-2 bg-[#091D14] border border-[#85CC14]/40 rounded-full px-3.5 sm:px-4 py-1.5 text-white">
            <span className="text-xs font-mono font-bold text-[#D4E157] uppercase shrink-0">County:</span>
            <select
              value={currentCounty}
              onChange={(e) => selectCounty(e.target.value as CountyName)}
              className="bg-transparent text-xs font-mono font-bold text-white outline-none cursor-pointer max-w-[120px] sm:max-w-none truncate"
            >
              {countyList.map((c) => (
                <option key={c} value={c} className="bg-[#0B2117] text-white">
                  {c} County
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* ── Error state ───────────────────────────────────── */}
      {error && !loading && (
        <div className="rounded-2xl sm:rounded-3xl border border-red-300 bg-red-50 p-4 sm:p-6 flex items-start gap-3 sm:gap-4 text-[#0F172A]">
          <AlertTriangle className="h-5 w-5 sm:h-6 sm:w-6 text-red-600 shrink-0 mt-0.5" />
          <div className="text-left space-y-1">
            <strong className="text-red-700 font-bold text-xs sm:text-sm uppercase tracking-wider block">
              Weather Telemetry Interrupted
            </strong>
            <p className="text-xs text-red-600 leading-relaxed">{error}</p>
          </div>
        </div>
      )}

      {/* ── Live Weather Visualizations (Bright Light Cards) ── */}
      {!loading && data && (
        <>
          {/* Main Weather Hero Card — Deep Forest Green Aesthetic */}
          <div className="rounded-2xl sm:rounded-3xl bg-gradient-to-br from-[#0B2117] via-[#0F291E] to-[#143B2B] text-white border-2 border-[#85CC14]/30 p-5 xs:p-7 sm:p-9 relative overflow-hidden shadow-xl shadow-[#0F291E]/20">
            
            {/* Ambient Radial Green Glow */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-[#85CC14]/15 via-transparent to-transparent pointer-events-none" />

            <div className="grid gap-6 sm:gap-8 lg:grid-cols-12 items-center relative z-10">

              {/* Left Column — Temperature & Weather Icon Display (Deep Inner Card) */}
              <div className="lg:col-span-6 flex flex-col items-center justify-center text-center p-6 rounded-2xl bg-[#091D14]/80 backdrop-blur-md border-2 border-[#85CC14]/40 shadow-inner">
                
                {/* Weather Symbol Beside Temperature */}
                <div className="flex items-center justify-center gap-4 sm:gap-6 py-2">
                  <div className="p-3.5 sm:p-4 rounded-2xl bg-gradient-to-br from-[#85CC14]/25 to-[#6FA810]/35 border border-[#85CC14]/50 flex items-center justify-center shrink-0 shadow-md">
                    <WeatherIcon
                      kind={wmoCodeToIconKind(data.current.weather_code)}
                      className="h-12 w-12 sm:h-16 sm:w-16 text-[#85CC14] filter drop-shadow-md"
                      inverted
                    />
                  </div>

                  <div className="text-left space-y-1.5">
                    <div className="flex items-baseline gap-1">
                      <span className="text-4xl xs:text-5xl sm:text-6xl font-black font-mono tracking-tight text-white leading-none drop-shadow-sm">
                        {Math.round(data.current.temperature_2m)}°
                      </span>
                      <span className="text-xl sm:text-2xl font-bold font-mono text-[#D4E157]">C</span>
                    </div>

                    <span className="inline-block text-xs sm:text-sm font-extrabold text-[#0B2117] uppercase tracking-wider bg-gradient-to-r from-[#85CC14] to-[#6FA810] px-3.5 py-1 rounded-full shadow-md shadow-[#85CC14]/20">
                      {data.conditionLabel}
                    </span>
                  </div>
                </div>

                {/* Location Badge */}
                <div className="mt-4 flex items-center gap-1.5 sm:gap-2 text-xs font-mono text-white/90 bg-white/10 backdrop-blur-md py-2 px-4 rounded-full border border-white/20">
                  <MapPin className="h-4 w-4 text-[#85CC14] shrink-0" />
                  <span className="font-bold text-white">{locationLabel}</span>
                  <span className="text-white/40">•</span>
                  <span className="text-[#D4E157]">Elev. {Math.round(data.raw.elevation)}m asl</span>
                </div>
              </div>

              {/* Right Column — Key Microclimate Parameters */}
              <div className="lg:col-span-6 space-y-4 sm:space-y-5 text-left">
                <div>
                  <span className="text-[10px] sm:text-xs font-mono font-bold text-[#85CC14] uppercase tracking-widest block">
                    CURRENT MICROCLIMATE PARAMETERS
                  </span>
                  <h2 className="text-2xl sm:text-3xl font-black text-white font-['Outfit',sans-serif] uppercase mt-0.5 sm:mt-1 drop-shadow-xs">
                    {data.conditionLabel} Advisory
                  </h2>
                  <p className="text-xs sm:text-sm text-white/80 mt-1 leading-relaxed">
                    Feels like {Math.round(data.current.apparent_temperature)}°C. Soil surface temperature 
                    is {data.hourlySnapshot.soilTemperature.toFixed(1)}°C. Barometric pressure {data.current.surface_pressure.toFixed(0)} hPa.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2.5 sm:gap-3.5">
                  <div className="p-3.5 sm:p-4 rounded-xl sm:rounded-2xl bg-gradient-to-br from-[#123828] to-[#0B2117] border border-[#85CC14]/30 shadow-md hover:border-[#85CC14] transition-all space-y-0.5 sm:space-y-1">
                    <span className="text-[9px] sm:text-[10px] font-mono text-[#D4E157] uppercase block font-bold">Soil Temp</span>
                    <strong className="text-base sm:text-xl font-mono font-black text-white block">
                      {data.hourlySnapshot.soilTemperature.toFixed(1)}°C
                    </strong>
                    <span className="text-[8px] sm:text-[9px] text-white/60 font-medium block truncate">Surface measurement</span>
                  </div>

                  <div className="p-3.5 sm:p-4 rounded-xl sm:rounded-2xl bg-gradient-to-br from-[#123828] to-[#0B2117] border border-[#85CC14]/30 shadow-md hover:border-[#85CC14] transition-all space-y-0.5 sm:space-y-1">
                    <span className="text-[9px] sm:text-[10px] font-mono text-[#D4E157] uppercase block font-bold">Pressure</span>
                    <strong className="text-base sm:text-xl font-mono font-black text-white block">
                      {data.current.surface_pressure.toFixed(0)} hPa
                    </strong>
                    <span className="text-[8px] sm:text-[9px] text-white/60 font-medium block truncate">Surface level</span>
                  </div>

                  <div className="p-3.5 sm:p-4 rounded-xl sm:rounded-2xl bg-gradient-to-br from-[#123828] to-[#0B2117] border border-amber-400/40 shadow-md hover:border-amber-400 transition-all space-y-0.5 sm:space-y-1">
                    <span className="text-[9px] sm:text-[10px] font-mono text-amber-300 uppercase block font-bold">Sunrise / Sunset</span>
                    <strong className="text-xs sm:text-sm font-mono font-bold text-amber-200 block truncate">
                      🌅 {fmtTime(data.daily[0]?.sunrise || "")} • 🌇 {fmtTime(data.daily[0]?.sunset || "")}
                    </strong>
                    <span className="text-[8px] sm:text-[9px] text-white/60 font-medium block truncate">EAT daylight horizon</span>
                  </div>

                  <div className="p-3.5 sm:p-4 rounded-xl sm:rounded-2xl bg-gradient-to-br from-[#123828] to-[#0B2117] border border-[#85CC14]/30 shadow-md hover:border-[#85CC14] transition-all space-y-0.5 sm:space-y-1">
                    <span className="text-[9px] sm:text-[10px] font-mono text-[#D4E157] uppercase block font-bold">Cloud Cover</span>
                    <strong className="text-base sm:text-xl font-mono font-black text-white block">
                      {data.current.cloud_cover}%
                    </strong>
                    <span className="text-[8px] sm:text-[9px] text-white/60 font-medium block truncate">Overhead fraction</span>
                  </div>
                </div>

              </div>
            </div>
          </div>

          {/* ── Spray Suitability Radar Banner — Deep Forest Green Theme ──────────────── */}
          <div className="rounded-2xl sm:rounded-3xl bg-gradient-to-br from-[#0B2117] via-[#0F291E] to-[#143B2B] text-white border-2 border-[#85CC14]/30 p-5 sm:p-7 md:p-8 relative overflow-hidden shadow-xl shadow-[#0F291E]/20">
            
            {/* Ambient Radial Green Glow */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-[#85CC14]/15 via-transparent to-transparent pointer-events-none" />

            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sm:gap-6 relative z-10 text-left">
              <div className="flex items-start sm:items-center gap-3 sm:gap-4">
                
                {/* Radar Sweep Icon Box */}
                <div className="relative h-12 w-12 sm:h-16 sm:w-16 rounded-full bg-[#091D14] border-2 border-[#85CC14] flex items-center justify-center shrink-0 shadow-md">
                  <div className="absolute inset-1 rounded-full border border-dashed border-[#85CC14]/50 animate-radar pointer-events-none" />
                  <Zap className="h-5 w-5 sm:h-7 sm:w-7 text-[#85CC14] animate-pulse" />
                </div>

                <div className="space-y-0.5 sm:space-y-1">
                  <span className="text-[9px] sm:text-[10px] font-mono font-bold uppercase tracking-widest text-[#85CC14] block">
                    CHEMICAL & FERTILISER APPLICATION WINDOW
                  </span>
                  <h3 className="text-lg sm:text-2xl font-black text-white font-['Outfit',sans-serif] uppercase drop-shadow-sm">
                    SPRAY WINDOW: {data.advisory.sprayWindow}
                  </h3>
                  <p className="text-xs text-white/80 max-w-xl leading-relaxed">
                    {data.advisory.sprayWindowText}
                  </p>
                </div>
              </div>

              {/* Status Rail Badges */}
              <div className="flex flex-wrap gap-2 shrink-0">
                <span className={`px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-full font-mono text-[11px] sm:text-xs font-black uppercase tracking-wider ${
                  data.advisory.sprayWindow === "IDEAL"
                    ? "bg-[#85CC14] text-[#0B2117] shadow-md shadow-[#85CC14]/25"
                    : data.advisory.sprayWindow === "UNSTABLE"
                    ? "bg-[#F5A623] text-[#0B2117] shadow-md shadow-amber-500/25"
                    : "bg-red-500 text-white shadow-md shadow-red-500/25"
                }`}>
                  ● {data.advisory.sprayWindow} STATUS
                </span>
              </div>
            </div>

            {/* Spray Suitability Fill Rails */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mt-5 sm:mt-6 border-t border-[#85CC14]/25 pt-4 sm:pt-6 text-left relative z-10">
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-white/90 font-bold">Foliar Nutrition</span>
                  <span className="text-[#85CC14] font-extrabold">IDEAL</span>
                </div>
                <div className="w-full bg-[#071911] rounded-full h-2.5 overflow-hidden border border-[#85CC14]/30">
                  <div className="bg-[#85CC14] h-full rounded-full w-full" />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-white/90 font-bold">Systemic Fungicides</span>
                  <span className="text-[#F5A623] font-extrabold">MODERATE</span>
                </div>
                <div className="w-full bg-[#071911] rounded-full h-2.5 overflow-hidden border border-amber-500/30">
                  <div className="bg-[#F5A623] h-full rounded-full w-3/4" />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-white/90 font-bold">Urea / Top Dress</span>
                  <span className="text-[#38BDF8] font-extrabold">GOOD</span>
                </div>
                <div className="w-full bg-[#071911] rounded-full h-2.5 overflow-hidden border border-sky-400/30">
                  <div className="bg-[#38BDF8] h-full rounded-full w-4/5" />
                </div>
              </div>
            </div>
          </div>

          {/* ── Agronomic Telemetry Bento Grid (Deep Forest Green Theme) ── */}
          <div className="space-y-3 sm:space-y-4 text-left">
            <h3 className="text-base sm:text-lg font-black uppercase tracking-tight text-[#0B2117] font-['Outfit',sans-serif] flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-[#85CC14]" />
              <span>AGRONOMIC TELEMETRY BENTO GRID</span>
            </h3>

            <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              
              {/* Card 1: Wind Velocity */}
              <div className="rounded-2xl sm:rounded-3xl bg-gradient-to-br from-[#0B2117] via-[#0F291E] to-[#143B2B] border-2 border-[#85CC14]/30 p-4 sm:p-6 space-y-3 sm:space-y-4 shadow-lg text-left hover:border-[#85CC14] hover:shadow-xl hover:shadow-[#85CC14]/15 transition-all duration-300 relative overflow-hidden group">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono font-extrabold text-[#D4E157] uppercase tracking-wider">WIND VELOCITY</span>
                  <div className="p-2 rounded-full bg-[#85CC14]/20 border border-[#85CC14]/40 text-[#85CC14] group-hover:scale-110 transition-transform">
                    <Wind className="h-4 w-4 text-[#85CC14]" />
                  </div>
                </div>
                <div>
                  <h4 className="text-2xl sm:text-3xl font-black font-mono text-white">
                    {data.current.wind_speed_10m.toFixed(0)} <span className="text-xs sm:text-sm font-normal text-[#85CC14]">km/h</span>
                  </h4>
                  <span className="text-[11px] sm:text-xs font-mono font-bold text-[#D4E157] mt-1 block">
                    Dir: {windDirection(data.current.wind_direction_10m)} ({data.current.wind_direction_10m}°)
                  </span>
                </div>
                <p className="text-[11px] text-white/70 leading-relaxed">
                  {data.current.wind_speed_10m > 15 ? "High drift risk — delay spray application." : "Optimal breeze for field scouting & spray."}
                </p>
              </div>

              {/* Card 2: UV Index Max */}
              <div className="rounded-2xl sm:rounded-3xl bg-gradient-to-br from-[#0B2117] via-[#0F291E] to-[#143B2B] border-2 border-[#85CC14]/30 p-4 sm:p-6 space-y-3 sm:space-y-4 shadow-lg text-left hover:border-[#85CC14] hover:shadow-xl hover:shadow-[#85CC14]/15 transition-all duration-300 relative overflow-hidden group">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono font-extrabold text-[#D4E157] uppercase tracking-wider">UV INDEX MAX</span>
                  <div className="p-2 rounded-full bg-[#85CC14]/20 border border-[#85CC14]/40 text-[#85CC14] group-hover:scale-110 transition-transform">
                    <Sun className="h-4 w-4 text-[#85CC14]" />
                  </div>
                </div>
                <div>
                  <h4 className="text-2xl sm:text-3xl font-black font-mono text-white">
                    {data.daily[0]?.uvIndexMax ?? "—"} <span className="text-xs sm:text-sm font-normal text-[#85CC14]">/ 12</span>
                  </h4>
                  <span className="text-[11px] sm:text-xs font-mono font-bold text-[#D4E157] mt-1 block">
                    {data.daily[0] && data.daily[0].uvIndexMax >= 8 ? "High Exposure Level" : "Moderate Solar Level"}
                  </span>
                </div>
                <p className="text-[11px] text-white/70 leading-relaxed">
                  Evapotranspiration risk increases under direct high solar radiation.
                </p>
              </div>

              {/* Card 3: Growing Degree Days */}
              <div className="rounded-2xl sm:rounded-3xl bg-gradient-to-br from-[#0B2117] via-[#0F291E] to-[#143B2B] border-2 border-[#85CC14]/30 p-4 sm:p-6 space-y-3 sm:space-y-4 shadow-lg text-left hover:border-[#85CC14] hover:shadow-xl hover:shadow-[#85CC14]/15 transition-all duration-300 relative overflow-hidden group">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono font-extrabold text-[#D4E157] uppercase tracking-wider">GDD TODAY</span>
                  <div className="p-2 rounded-full bg-[#85CC14]/20 border border-[#85CC14]/40 text-[#85CC14] group-hover:scale-110 transition-transform">
                    <Leaf className="h-4 w-4 text-[#85CC14]" />
                  </div>
                </div>
                <div>
                  <h4 className="text-2xl sm:text-3xl font-black font-mono text-white">
                    {data.gdd} <span className="text-xs sm:text-sm font-normal text-[#85CC14]">units</span>
                  </h4>
                  <span className="text-[11px] sm:text-xs font-mono font-bold text-[#D4E157] mt-1 block">
                    Base 10°C thermal accumulation
                  </span>
                </div>
                <p className="text-[11px] text-white/70 leading-relaxed">
                  Thermal heat unit score for accurate crop maturity & harvest tracking.
                </p>
              </div>

              {/* Card 4: Daily ET0 */}
              <div className="rounded-2xl sm:rounded-3xl bg-gradient-to-br from-[#0B2117] via-[#0F291E] to-[#143B2B] border-2 border-[#85CC14]/30 p-4 sm:p-6 space-y-3 sm:space-y-4 shadow-lg text-left hover:border-[#85CC14] hover:shadow-xl hover:shadow-[#85CC14]/15 transition-all duration-300 relative overflow-hidden group">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono font-extrabold text-[#D4E157] uppercase tracking-wider">DAILY ET0</span>
                  <div className="p-2 rounded-full bg-[#85CC14]/20 border border-[#85CC14]/40 text-[#85CC14] group-hover:scale-110 transition-transform">
                    <Droplets className="h-4 w-4 text-[#85CC14]" />
                  </div>
                </div>
                <div>
                  <h4 className="text-2xl sm:text-3xl font-black font-mono text-white">
                    {data.daily[0]?.et0.toFixed(2) ?? "—"} <span className="text-xs sm:text-sm font-normal text-[#85CC14]">mm</span>
                  </h4>
                  <span className="text-[11px] sm:text-xs font-mono font-bold text-[#D4E157] mt-1 block">
                    FAO-56 Penman-Monteith
                  </span>
                </div>
                <p className="text-[11px] text-white/70 leading-relaxed">
                  Reference crop water loss rate for precise drip fertigation scheduling.
                </p>
              </div>

            </div>
          </div>

          {/* ── AI Meteorological Recommendations ─────────── */}
          {data.advisory.recommendations.length > 0 && (
            <div className="rounded-2xl sm:rounded-3xl bg-emerald-50 border-l-4 border-l-[#16A34A] border border-emerald-200 p-4 sm:p-6 md:p-8 text-left shadow-sm">
              <div className="space-y-3 sm:space-y-4">
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-[#16A34A] animate-ping" />
                  <span className="text-xs font-mono font-bold text-[#16A34A] uppercase tracking-widest">
                    ⚡ AI METEOROLOGICAL ADVISORY ENGINE
                  </span>
                </div>

                <ul className="space-y-2.5 sm:space-y-3">
                  {data.advisory.recommendations.map((rec, i) => (
                    <li key={i} className="flex items-start gap-2.5 sm:gap-3 text-xs sm:text-sm text-[#0A2E16] font-medium">
                      <span className="text-[#16A34A] font-mono font-black shrink-0 mt-0.5">⚡ AI →</span>
                      <span className="leading-relaxed">{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* ── 7-Day Broadcast Meteorological Graphic Tower ────────── */}
          <div className="rounded-2xl sm:rounded-3xl bg-[#FAFBF9] border-2 border-[#D8EBC4] p-4 sm:p-6 space-y-4 text-left shadow-sm">
            <div className="flex items-center justify-between border-b border-[#D8EBC4] pb-3">
              <h3 className="text-base sm:text-lg font-black uppercase tracking-tight text-[#0F291E] font-['Outfit',sans-serif] flex items-center gap-2">
                <Calendar className="h-5 w-5 text-[#85CC14] shrink-0" />
                <span>7-DAY METEOROLOGICAL BROADCAST</span>
              </h3>
              <span className="text-[10px] sm:text-xs font-mono font-bold text-[#1A380A] bg-[#EDF7E2] px-3.5 py-1 rounded-full border border-[#D8EBC4] uppercase tracking-wider">
                LIVE GRAPHIC TOWER
              </span>
            </div>

            {/* Broadcast Grid Container (Responsive grid wrapping all 7 days on mobile screens) */}
            <div className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-4 md:grid-cols-7 gap-2.5 sm:gap-3 pt-1">
              {data.daily.map((day, idx) => (
                <ForecastCard key={day.date} day={day} isToday={idx === 0} />
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
