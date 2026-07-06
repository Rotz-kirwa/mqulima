// ============================================================================
// WeatherPanel.tsx — Live Open-Meteo Weather Intelligence Panel
//
// DISPLAY ONLY. All data comes from useWeather → fetchWeather → Open-Meteo API.
// No mock data. No hardcoded weather values. No fallback numbers.
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
  Sunset,
  Sunrise,
  Eye,
  Gauge,
  Leaf,
  Clock,
  Droplets,
} from "lucide-react";
import { useWeather, KENYA_COUNTIES, resolveLabel, type CountyName } from "@/hooks/useWeather";
import type { WeatherIconKind } from "@/lib/weather-service";
import type { DailyForecast } from "@/lib/weather-types";

// ------------------------------------------------------------------
// Icon selector based on WMO icon kind
// ------------------------------------------------------------------
function WeatherIcon({ kind, className }: { kind: WeatherIconKind; className?: string }) {
  const cls = className ?? "h-6 w-6";
  switch (kind) {
    case "sun":     return <Sun className={cls} />;
    case "partly":  return <CloudSun className={cls} />;
    case "cloudy":  return <Cloud className={cls} />;
    case "rain":    return <CloudRain className={cls} />;
    case "drizzle": return <CloudDrizzle className={cls} />;
    case "storm":   return <CloudLightning className={cls} />;
    case "snow":    return <Snowflake className={cls} />;
    case "fog":     return <Cloud className={cls} />;
    default:        return <CloudSun className={cls} />;
  }
}

// ------------------------------------------------------------------
// Wind direction from degrees → compass abbreviation
// ------------------------------------------------------------------
function windDirection(deg: number): string {
  const dirs = ["N","NNE","NE","ENE","E","ESE","SE","SSE","S","SSW","SW","WSW","W","WNW","NW","NNW"];
  return dirs[Math.round(deg / 22.5) % 16];
}

// ------------------------------------------------------------------
// Format time: "2026-07-02T06:35" → "06:35"
// ------------------------------------------------------------------
function fmtTime(iso: string): string {
  return iso?.substring(11, 16) ?? "—";
}

// ------------------------------------------------------------------
// Live clock hook — ticks every second, formatted as EAT
// ------------------------------------------------------------------
function useClock() {
  const [mounted, setMounted] = useState(false);
  const [now, setNow] = useState<Date>(() => new Date());

  useEffect(() => {
    setMounted(true);
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  if (!mounted) {
    return {
      timeStr: "--:--:--",
      dateStr: "...",
      dateShort: "...",
    };
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

  const dateShort = now.toLocaleDateString("en-KE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "Africa/Nairobi",
  });

  return { timeStr, dateStr, dateShort };
}

// ------------------------------------------------------------------
// Skeleton block for loading state
// ------------------------------------------------------------------
function Skel({ className }: { className: string }) {
  return <div className={`bg-[#2D6A4F]/20 animate-pulse rounded-none ${className}`} />;
}

// ------------------------------------------------------------------
// Daily forecast card
// ------------------------------------------------------------------
function ForecastCard({ day }: { day: DailyForecast }) {
  const kind: WeatherIconKind = wmoCodeToIconKind(day.weatherCode);
  return (
    <div className="bg-[#112F20]/40 border border-[#1C462C]/60 p-4 text-center space-y-3 flex flex-col items-center justify-between hover:border-[#F5A623]/30 transition">
      <span className="text-[9px] font-bold text-[#A2AAA0] uppercase block tracking-wider">
        {day.dayLabel}
      </span>
      <div className="h-8 w-8 text-[#F5A623] flex items-center justify-center">
        <WeatherIcon kind={kind} className="h-6 w-6 stroke-[2]" />
      </div>
      <div className="space-y-1">
        <span className="text-[10px] text-[#FAF9F5] font-bold block">{day.conditionLabel}</span>
        <strong className="text-xs text-[#FAF9F5] block font-mono">
          {day.tempMax}°/{day.tempMin}°
        </strong>
        <span className="text-[9px] text-[#A2AAA0] block font-mono">
          {day.precipitationProbMax}% rain
        </span>
      </div>
    </div>
  );
}

// ------------------------------------------------------------------
// Main WeatherPanel component
// ------------------------------------------------------------------
import type { UseWeatherState } from "@/hooks/useWeather";

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
  const { timeStr, dateStr, dateShort } = useClock();

  const lastUpdated = lastFetchedAt
    ? new Date(lastFetchedAt).toLocaleTimeString("en-KE", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      })
    : null;

  return (
    <div className="space-y-6 animate-fadeIn">

      {/* ── Header row: title + controls ─────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#2D6A4F]/20 pb-4">
        <div className="space-y-0.5">
          <h3 className="text-lg font-black uppercase tracking-wider text-[#FFD166] font-serif">
            Agro-Meteorological Advisory Core
          </h3>

          {/* Live clock strip */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1.5">
              <Clock className="h-3 w-3 text-[#52B788]" />
              <span suppressHydrationWarning className="text-sm font-black text-[#FAF9F5] font-mono tracking-widest">
                {timeStr}
              </span>
              <span className="text-[10px] font-bold text-[#F5A623] font-mono">EAT</span>
            </div>
            <span className="text-[#2D6A4F]">/</span>
            <span suppressHydrationWarning className="text-[10px] font-semibold text-[#A2AAA0] font-mono">
              {dateShort}
            </span>
          </div>

          {lastUpdated && (
            <p className="text-[9px] text-[#A2AAA0]/60 font-mono">
              Data synced {lastUpdated} · Open-Meteo
            </p>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* GPS button */}
          <button
            onClick={detectGPS}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 border border-[#2D6A4F]/40 bg-[#091D13] text-[10px] uppercase font-bold text-[#52B788] hover:bg-[#112E22] transition rounded-none disabled:opacity-40"
          >
            <Navigation className="h-3 w-3" />
            GPS
          </button>

          {/* Refresh button */}
          <button
            onClick={refresh}
            disabled={loading}
            className="h-7 w-7 flex items-center justify-center border border-[#2D6A4F]/40 bg-[#091D13] text-[#52B788] hover:bg-[#112E22] transition disabled:opacity-40 rounded-none"
            title="Refresh weather"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
          </button>

          <span className="text-xs font-bold text-[#F5A623] uppercase">County:</span>
          <select
            value={currentCounty}
            onChange={(e) => selectCounty(e.target.value as CountyName)}
            className="bg-[#091D13] border border-[#2D6A4F]/30 text-xs rounded-none px-3 py-1.5 text-[#FAF9F5] outline-none focus:border-[#F5A623] font-bold cursor-pointer"
          >
            {location.type === "gps" && (
              <option value="" disabled>📍 GPS Location</option>
            )}
            {countyList.map((c) => (
              <option key={c} value={c} className="bg-[#112F20]">
                {c} County
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* ── Error state ───────────────────────────────────── */}
      {error && !loading && (
        <div className="border border-red-900/60 bg-red-950/30 p-5 flex items-start gap-3 text-sm">
          <AlertTriangle className="h-5 w-5 text-red-400 shrink-0 mt-0.5" />
          <div>
            <strong className="text-red-400 font-bold block text-xs uppercase tracking-wider">
              Weather data unavailable
            </strong>
            <p className="text-[#A2AAA0] mt-1 text-xs leading-relaxed">{error}</p>
          </div>
        </div>
      )}

      {/* ── Loading skeleton ──────────────────────────────── */}
      {loading && (
        <div className="space-y-6">
          <div className="grid gap-6 md:grid-cols-12">
            <div className="md:col-span-8 bg-[#091D13]/60 border border-[#1C462C] p-6 space-y-6">
              <Skel className="h-4 w-40" />
              <div className="flex items-baseline gap-4 mt-4">
                <Skel className="h-20 w-28" />
                <div className="space-y-2">
                  <Skel className="h-6 w-32" />
                  <Skel className="h-3 w-40" />
                </div>
              </div>
              <div className="grid grid-cols-4 gap-4 border-t border-[#2D6A4F]/20 pt-4">
                {[1,2,3,4].map(i => (
                  <div key={i} className="space-y-1">
                    <Skel className="h-2 w-16" />
                    <Skel className="h-6 w-12" />
                  </div>
                ))}
              </div>
            </div>
            <div className="md:col-span-4 bg-[#091D13]/60 border border-[#1C462C] p-6 space-y-4">
              <Skel className="h-3 w-24" />
              <Skel className="h-5 w-36" />
              <Skel className="h-16 w-full" />
              <div className="space-y-2 pt-2">
                {[1,2,3].map(i => <Skel key={i} className="h-3 w-full" />)}
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
            {[1,2,3,4,5,6,7].map(i => (
              <div key={i} className="bg-[#091D13]/60 border border-[#1C462C] p-4 space-y-3">
                <Skel className="h-2 w-8 mx-auto" />
                <Skel className="h-8 w-8 mx-auto" />
                <Skel className="h-3 w-12 mx-auto" />
                <Skel className="h-3 w-10 mx-auto" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Live data panels ──────────────────────────────── */}
      {!loading && data && (
        <>
          {/* Primary metrics + advisory */}
          <div className="grid gap-6 md:grid-cols-12">

            {/* Current conditions card */}
            <div className="md:col-span-8 bg-[#091D13]/60 border border-[#1C462C] p-6 flex flex-col justify-between relative overflow-hidden">
              <div className="absolute right-0 top-0 h-40 w-40 rounded-full bg-[#FAF9F5]/3 blur-[50px] pointer-events-none" />

              <div>
                {/* Location + live indicator */}
                <div className="flex items-center gap-2 text-xs font-semibold text-[#A2AAA0]">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse block" />
                  <MapPin className="h-3 w-3" />
                  <span>{locationLabel} · LIVE METEOROLOGY</span>
                </div>

                {/* Date display */}
                <div className="mt-2 text-[10px] font-semibold text-[#F5A623]/80 font-mono uppercase tracking-widest">
                  {dateStr}
                </div>

                {/* Temperature hero */}
                <div className="flex items-end gap-6 mt-6 flex-wrap">
                  <h1 className="text-7xl font-extrabold font-serif tracking-tight text-[#FAF9F5] leading-none">
                    {Math.round(data.current.temperature_2m)}°
                  </h1>
                  <div>
                    <div className="text-xl font-bold text-[#FAF9F5] font-serif">
                      {data.conditionLabel}
                    </div>
                    <div className="text-xs text-[#A2AAA0] mt-1 font-mono">
                      Feels like {Math.round(data.current.apparent_temperature)}° ·
                      Soil {data.hourlySnapshot.soilTemperature.toFixed(1)}°C
                    </div>
                    <div className="text-xs text-[#A2AAA0] font-mono">
                      Elev. {Math.round(data.raw.elevation)} m asl ·
                      Pressure {data.current.surface_pressure.toFixed(0)} hPa
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom metrics grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-8 border-t border-[#2D6A4F]/20 pt-6">
                <div>
                  <span className="text-[9px] font-bold uppercase tracking-wider text-[#A2AAA0] block">
                    Humidity
                  </span>
                  <strong className="text-lg font-black text-[#FAF9F5] mt-1 block font-mono">
                    {data.current.relative_humidity_2m}%
                  </strong>
                </div>
                <div>
                  <span className="text-[9px] font-bold uppercase tracking-wider text-[#A2AAA0] block">
                    Wind
                  </span>
                  <strong className="text-lg font-black text-[#FAF9F5] mt-1 block font-mono">
                    {data.current.wind_speed_10m.toFixed(0)} km/h
                  </strong>
                  <span className="text-[9px] text-[#A2AAA0] font-mono">
                    {windDirection(data.current.wind_direction_10m)}
                  </span>
                </div>
                <div>
                  <span className="text-[9px] font-bold uppercase tracking-wider text-[#A2AAA0] block">
                    Rain Probability
                  </span>
                  <strong className="text-lg font-black text-[#FAF9F5] mt-1 block font-mono">
                    {data.hourlySnapshot.precipProbability}%
                  </strong>
                </div>
                <div>
                  <span className="text-[9px] font-bold uppercase tracking-wider text-[#A2AAA0] block">
                    GDD Today
                  </span>
                  <strong className="text-lg font-black text-[#FAF9F5] mt-1 block font-mono">
                    {data.gdd}
                  </strong>
                  <span className="text-[9px] text-[#A2AAA0] font-mono">base 10°C</span>
                </div>
              </div>

              {/* Sunrise / Sunset row */}
              {data.daily[0] && (
                <div className="flex gap-4 mt-4 border-t border-[#2D6A4F]/20 pt-4 text-xs">
                  <div className="flex items-center gap-1.5 text-[#A2AAA0]">
                    <Sunrise className="h-4 w-4 text-amber-400" />
                    <span>Sunrise: <strong className="text-[#FAF9F5] font-mono">{fmtTime(data.daily[0].sunrise)}</strong></span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[#A2AAA0]">
                    <Sunset className="h-4 w-4 text-orange-400" />
                    <span>Sunset: <strong className="text-[#FAF9F5] font-mono">{fmtTime(data.daily[0].sunset)}</strong></span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[#A2AAA0]">
                    <Eye className="h-4 w-4 text-sky-400" />
                    <span>Cloud cover: <strong className="text-[#FAF9F5] font-mono">{data.current.cloud_cover}%</strong></span>
                  </div>
                </div>
              )}
            </div>

            {/* Spray advisory card */}
            <div className="md:col-span-4 bg-[#091D13]/60 border border-[#1C462C] p-6 space-y-5 flex flex-col justify-between">
              <div className="space-y-3 text-left">
                <span className="text-[9px] font-black uppercase tracking-widest text-[#F5A623] block">
                  Spray Suitability
                </span>
                <h4 className="text-base font-extrabold font-serif text-[#FAF9F5] uppercase tracking-wide">
                  {data.advisory.sprayWindow === "IDEAL" && "Spray window: IDEAL"}
                  {data.advisory.sprayWindow === "UNSTABLE" && "Spray window: UNSTABLE"}
                  {data.advisory.sprayWindow === "CLOSED" && "Spray window: CLOSED"}
                </h4>
                <p className="text-xs text-[#A2AAA0] leading-relaxed">
                  {data.advisory.sprayWindowText}
                </p>
              </div>

              <ul className="space-y-2 text-xs border-t border-[#2D6A4F]/20 pt-4 text-left">
                {data.advisory.bullets.map((b, i) => (
                  <li key={i} className="flex items-center gap-2">
                    <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${
                      b.color === "green" ? "bg-emerald-500 shadow-[0_0_6px_#10b981]"
                      : b.color === "gold" ? "bg-[#F5A623] shadow-[0_0_6px_#f5a623]"
                      : "bg-red-500 shadow-[0_0_6px_#ef4444]"
                    }`} />
                    <span className="text-[#FAF9F5] font-semibold">{b.text}</span>
                  </li>
                ))}
              </ul>

              {/* Active alert strip */}
              <div className={`border p-3 text-[10px] leading-relaxed ${
                data.advisory.alerts[0].startsWith("No active")
                  ? "border-emerald-900/40 bg-emerald-950/20 text-emerald-400"
                  : "border-amber-900/50 bg-amber-950/20 text-amber-400"
              }`}>
                <AlertTriangle className="h-3 w-3 inline mr-1.5" />
                {data.advisory.alerts[0]}
              </div>
            </div>
          </div>

          {/* Agricultural metrics strip */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                label: "UV Index (max today)",
                value: data.daily[0] ? `${data.daily[0].uvIndexMax}` : "—",
                sub: data.daily[0]
                  ? data.daily[0].uvIndexMax >= 8 ? "Very High"
                  : data.daily[0].uvIndexMax >= 6 ? "High"
                  : data.daily[0].uvIndexMax >= 3 ? "Moderate" : "Low"
                  : "",
                icon: <Sun className="h-5 w-5 text-[#F5A623]" />,
              },
              {
                label: "Solar radiation",
                value: `${data.hourlySnapshot.shortwaveRadiation.toFixed(0)} W/m²`,
                sub: "shortwave at current hour",
                icon: <Gauge className="h-5 w-5 text-sky-400" />,
              },
              {
                label: "ET₀ (daily reference)",
                value: `${data.daily[0]?.et0.toFixed(2) ?? "—"} mm`,
                sub: "FAO-56 Penman-Monteith",
                icon: <Droplets className="h-5 w-5 text-blue-400" />,
              },
              {
                label: "Soil moisture",
                value: `${data.hourlySnapshot.soilMoisturePct}%`,
                sub: "0–1 cm volumetric",
                icon: <Leaf className="h-5 w-5 text-emerald-400" />,
              },
            ].map(({ label, value, sub, icon }) => (
              <div key={label} className="bg-[#091D13]/60 border border-[#1C462C] p-4 flex items-center justify-between">
                <div>
                  <span className="text-[9px] font-bold uppercase tracking-wider text-[#A2AAA0] block">
                    {label}
                  </span>
                  <strong className="text-lg font-black text-[#FAF9F5] mt-0.5 block font-mono">
                    {value}
                  </strong>
                  {sub && <span className="text-[9px] text-[#A2AAA0]/70">{sub}</span>}
                </div>
                {icon}
              </div>
            ))}
          </div>

          {/* Agronomic recommendations */}
          {data.advisory.recommendations.length > 0 && (
            <div className="bg-[#091D13]/60 border border-[#1C462C] p-5 space-y-3">
              <span className="text-[9px] font-black uppercase tracking-widest text-[#52B788] block">
                AI Agronomic Recommendations
              </span>
              <ul className="space-y-1.5">
                {data.advisory.recommendations.map((rec, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-[#A2AAA0]">
                    <span className="text-[#52B788] font-black shrink-0 mt-0.5">→</span>
                    {rec}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* 7-Day forecast */}
          <div className="bg-[#091D13]/60 border border-[#1C462C] p-6 space-y-5">
            <div className="flex justify-between items-center border-b border-[#2D6A4F]/20 pb-3">
              <h4 className="text-sm font-bold uppercase tracking-wider text-[#FAF9F5] font-serif">
                7-day outlook
              </h4>
              <span className="text-[8px] font-bold text-[#A2AAA0] tracking-widest font-mono">
                OPEN-METEO · EAT (GMT+3)
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
              {data.daily.map((day) => (
                <ForecastCard key={day.date} day={day} />
              ))}
            </div>
          </div>

          {/* Soil details panel */}
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="bg-[#091D13]/60 border border-[#1C462C] p-4">
              <span className="text-[9px] font-bold uppercase tracking-wider text-[#A2AAA0] block">
                Surface soil temperature (0 cm)
              </span>
              <strong className="text-xl font-black text-[#FAF9F5] mt-1 block font-mono">
                {data.hourlySnapshot.soilTemperature.toFixed(1)}°C
              </strong>
              <p className="text-[10px] text-[#A2AAA0]/70 mt-1">
                Direct surface measurement — critical for seed germination
              </p>
            </div>
            <div className="bg-[#091D13]/60 border border-[#1C462C] p-4">
              <span className="text-[9px] font-bold uppercase tracking-wider text-[#A2AAA0] block">
                Wind max today
              </span>
              <strong className="text-xl font-black text-[#FAF9F5] mt-1 block font-mono">
                {data.daily[0]?.windSpeedMax.toFixed(0)} km/h
              </strong>
              <p className="text-[10px] text-[#A2AAA0]/70 mt-1">
                {data.daily[0]?.windSpeedMax ?? 0 > 18
                  ? "High drift risk — delay aerial spraying."
                  : "Acceptable for field operations."}
              </p>
            </div>
            <div className="bg-[#091D13]/60 border border-[#1C462C] p-4">
              <span className="text-[9px] font-bold uppercase tracking-wider text-[#A2AAA0] block">
                Precipitation today
              </span>
              <strong className="text-xl font-black text-[#FAF9F5] mt-1 block font-mono">
                {data.daily[0]?.precipitationSum.toFixed(1)} mm
              </strong>
              <p className="text-[10px] text-[#A2AAA0]/70 mt-1">
                {(data.daily[0]?.precipitationSum ?? 0) >= 5
                  ? "Significant rainfall — delay fertiliser application."
                  : "Low rainfall — supplement irrigation as needed."}
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
