// ============================================================================
// Open-Meteo Weather Service
// Endpoint: https://api.open-meteo.com/v1/forecast
//
// This module is the SINGLE source of truth for all weather data.
// It may be imported in both server functions and client-side hooks.
// No mock data. No hardcoded values. All data comes from the Open-Meteo API.
// ============================================================================

import type {
  OpenMeteoResponse,
  WeatherViewModel,
  DailyForecast,
  HourlySnapshot,
  AgriAdvisory,
  WeatherCode,
  LocationCoords,
} from "@/lib/weather-types";

const OPEN_METEO_BASE = "https://api.open-meteo.com/v1/forecast";
const TIMEZONE = "Africa/Nairobi";
const FORECAST_DAYS = 7;
const MAX_RETRIES = 2;
const RETRY_DELAY_MS = 800;

// ------------------------------------------------------------------
// WMO Weather Code → Human-readable label
// Reference: https://open-meteo.com/en/docs (weather_code table)
// ------------------------------------------------------------------
export function wmoCodeToLabel(code: WeatherCode): string {
  if (code === 0) return "Clear Sky";
  if (code === 1) return "Mainly Clear";
  if (code === 2) return "Partly Cloudy";
  if (code === 3) return "Overcast";
  if (code === 45 || code === 48) return "Foggy";
  if (code === 51) return "Light Drizzle";
  if (code === 53) return "Moderate Drizzle";
  if (code === 55) return "Dense Drizzle";
  if (code === 61) return "Slight Rain";
  if (code === 63) return "Moderate Rain";
  if (code === 65) return "Heavy Rain";
  if (code === 71) return "Light Snow";
  if (code === 73) return "Moderate Snow";
  if (code === 75) return "Heavy Snow";
  if (code === 77) return "Snow Grains";
  if (code === 80) return "Light Showers";
  if (code === 81) return "Moderate Showers";
  if (code === 82) return "Heavy Showers";
  if (code === 85 || code === 86) return "Snow Showers";
  if (code === 95) return "Thunderstorm";
  if (code === 96 || code === 99) return "Thunderstorm w/ Hail";
  return "Unknown";
}

// ------------------------------------------------------------------
// Determine if it is currently daytime based on sunrise/sunset
// ------------------------------------------------------------------
function computeIsDay(sunrise: string, sunset: string): boolean {
  try {
    const now = new Date();
    const rise = new Date(sunrise);
    const set = new Date(sunset);
    return now >= rise && now <= set;
  } catch {
    return true;
  }
}

// ------------------------------------------------------------------
// WMO-code-based icon category for the forecast grid
// (Used for Lucide icon selection in the UI)
// ------------------------------------------------------------------
export type WeatherIconKind = "sun" | "partly" | "cloudy" | "rain" | "drizzle" | "storm" | "snow" | "fog";

export function wmoCodeToIconKind(code: WeatherCode): WeatherIconKind {
  if (code === 0 || code === 1) return "sun";
  if (code === 2) return "partly";
  if (code === 3 || code === 45 || code === 48) return "cloudy";
  if (code === 51 || code === 53 || code === 55) return "drizzle";
  if (code >= 61 && code <= 67) return "rain";
  if (code >= 71 && code <= 77) return "snow";
  if (code >= 80 && code <= 82) return "rain";
  if (code >= 85 && code <= 86) return "snow";
  if (code >= 95) return "storm";
  return "partly";
}

// ------------------------------------------------------------------
// Convert soil moisture m³/m³ → meaningful % for farmers
// Open-Meteo returns volumetric water content in m³/m³.
// Field capacity for Kenyan highland loam ≈ 0.35–0.45 m³/m³.
// Wilting point ≈ 0.10–0.14 m³/m³.
// We linearly scale 0.08 (dry) → 0.50 (saturated) to 0–100%.
// ------------------------------------------------------------------
function soilMoistureToPercent(raw: number): number {
  const DRY = 0.08;
  const SAT = 0.50;
  const pct = ((raw - DRY) / (SAT - DRY)) * 100;
  return Math.min(100, Math.max(0, Math.round(pct)));
}

// ------------------------------------------------------------------
// Growing Degree Days calculation (base temp 10°C — standard for maize)
// GDD = max(0, (Tmax + Tmin) / 2 − Tbase)
// ------------------------------------------------------------------
function calcGDD(tMax: number, tMin: number, tBase = 10): number {
  return Math.max(0, Number(((tMax + tMin) / 2 - tBase).toFixed(1)));
}

// ------------------------------------------------------------------
// Agricultural Advisory Engine
// Generates contextual farming advice purely from real weather data.
// No hardcoded thresholds beyond agronomic best-practice constants.
// ------------------------------------------------------------------
function buildAgriAdvisory(
  windSpeed: number,
  precipProb: number,
  precipSum: number,
  humidity: number,
  uvIndex: number,
  cloudCover: number,
  temp: number,
  gdd: number
): AgriAdvisory {
  const alerts: string[] = [];
  const recommendations: string[] = [];

  // --- Spray window classification ---
  let sprayWindow: AgriAdvisory["sprayWindow"];
  let sprayWindowText: string;
  let bullets: AgriAdvisory["bullets"] = [];

  if (precipProb > 60 || windSpeed > 20 || precipSum > 2) {
    sprayWindow = "CLOSED";
    sprayWindowText = `High precipitation risk (${precipProb}%) or wind drift (${windSpeed.toFixed(0)} km/h). Suspend all agrochemical applications to prevent wash-off, drift, and water-table contamination.`;
    bullets = [
      { text: "Foliar spray: DO NOT apply", color: "red" },
      { text: "Fungicide: suspend until dry", color: "red" },
      { text: "Drainage inspection: recommended", color: "gold" },
    ];
  } else if (precipProb > 30 || windSpeed > 12) {
    sprayWindow = "UNSTABLE";
    sprayWindowText = `Moderate wind (${windSpeed.toFixed(0)} km/h) or partial precipitation risk (${precipProb}%). Limit spraying to early morning hours (06:00–09:00) or late evening when winds are calmer.`;
    bullets = [
      { text: "Early morning spray: possible", color: "gold" },
      { text: "Chemical top-dressing: risky", color: "gold" },
      { text: "Urea application: proceed carefully", color: "green" },
    ];
  } else {
    sprayWindow = "IDEAL";
    sprayWindowText = `Calm conditions — wind ${windSpeed.toFixed(0)} km/h, rain probability ${precipProb}%. Excellent window for pesticide, fungicide, and foliar fertiliser applications with minimal chemical wastage.`;
    bullets = [
      { text: "Foliar spray: ideal conditions", color: "green" },
      { text: "Pesticide application: proceed", color: "green" },
      { text: "Urea top-dressing: optimal", color: "green" },
    ];
  }

  // --- Alert generation from real data ---
  if (precipProb > 70) alerts.push(`Heavy rain risk (${precipProb}%) — open drainage furrows and prepare runoff channels.`);
  if (windSpeed > 25) alerts.push(`Gale force winds (${windSpeed.toFixed(0)} km/h) — stake nursery nets and secure greenhouse covers.`);
  if (uvIndex >= 8) alerts.push(`Very High UV Index (${uvIndex.toFixed(1)}) — field workers should use sun protection and schedule heavy tasks for early morning.`);
  if (temp > 35) alerts.push(`Heat stress alert (${temp.toFixed(0)}°C) — ensure irrigation is running and mulch exposed soils.`);
  if (temp < 8) alerts.push(`Cold stress alert (${temp.toFixed(0)}°C) — protect tender seedlings and frost-sensitive crops overnight.`);
  if (humidity > 85 && temp < 22) alerts.push(`High humidity (${humidity}%) with cool temps — increased risk of fungal disease. Inspect crops for blight, mould, and rust.`);
  if (alerts.length === 0) alerts.push("No active weather alerts. Conditions are safe for routine field operations.");

  // --- Personalised recommendations from real data ---
  if (precipProb < 20 && temp > 24) recommendations.push("Irrigation recommended — low rainfall probability and high temperature indicate soil drying.");
  if (gdd > 15) recommendations.push(`GDD accumulation (${gdd}/day) is high — crops are growing rapidly. Monitor for nutrient demand and pest pressure.`);
  if (precipProb > 40 && precipProb < 70) recommendations.push("Pre-position drainage equipment. Moderate rains expected — beneficial for rainfed crops.");
  if (cloudCover < 20 && uvIndex >= 6) recommendations.push("High solar radiation — excellent for photosynthesis. Leaf analysis this week will reflect peak crop health.");
  if (humidity > 75) recommendations.push("Elevated humidity — inspect for early signs of downy mildew and fungal leaf spots.");
  if (windSpeed > 10 && windSpeed < 18) recommendations.push("Light-moderate winds are favourable for natural pollination of open-field crops.");
  if (temp >= 18 && temp <= 28 && precipProb > 20) recommendations.push("Optimal planting conditions. Consider direct sowing or nursery transplanting this week.");

  return { sprayWindow, sprayWindowText, bullets, alerts, gdd, recommendations };
}

// ------------------------------------------------------------------
// Find the hourly index that best matches the current local hour
// ------------------------------------------------------------------
function getCurrentHourIndex(hourlyTimes: string[]): number {
  const nowStr = new Date().toISOString().substring(0, 13); // "2026-07-02T15"
  const idx = hourlyTimes.findIndex((t) => t.startsWith(nowStr));
  return idx >= 0 ? idx : 0;
}

// ------------------------------------------------------------------
// Build full WeatherViewModel from raw Open-Meteo response
// ------------------------------------------------------------------
export function buildViewModel(raw: OpenMeteoResponse): WeatherViewModel {
  const { current, daily, hourly } = raw;

  // Find current-hour index in hourly arrays
  const hIdx = getCurrentHourIndex(hourly.time);

  // --- Hourly snapshot at current hour ---
  const hourlySnapshot: HourlySnapshot = {
    soilTemperature:   hourly.soil_temperature_0cm[hIdx] ?? 0,
    soilMoisturePct:   soilMoistureToPercent(hourly.soil_moisture_0_to_1cm[hIdx] ?? 0),
    shortwaveRadiation: hourly.shortwave_radiation[hIdx] ?? 0,
    et0Hourly:         hourly.et0_fao_evapotranspiration[hIdx] ?? 0,
    precipProbability: hourly.precipitation_probability[hIdx] ?? 0,
  };

  // --- GDD from today's forecast ---
  const todayMax = daily.temperature_2m_max[0] ?? 0;
  const todayMin = daily.temperature_2m_min[0] ?? 0;
  const gdd = calcGDD(todayMax, todayMin);

  // --- Daily forecasts ---
  const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const daily7: DailyForecast[] = daily.time.map((dateStr, idx) => {
    const date = new Date(`${dateStr}T12:00:00`);
    const dayLabel = idx === 0 ? "Today" : DAY_NAMES[date.getDay()];
    const code = daily.weather_code[idx] as WeatherCode;
    return {
      date: dateStr,
      dayLabel,
      weatherCode: code,
      conditionLabel: wmoCodeToLabel(code),
      tempMax: Math.round(daily.temperature_2m_max[idx] ?? 0),
      tempMin: Math.round(daily.temperature_2m_min[idx] ?? 0),
      precipitationSum: Number((daily.precipitation_sum[idx] ?? 0).toFixed(1)),
      precipitationProbMax: daily.precipitation_probability_max[idx] ?? 0,
      sunrise: daily.sunrise[idx] ?? "",
      sunset: daily.sunset[idx] ?? "",
      uvIndexMax: Number((daily.uv_index_max[idx] ?? 0).toFixed(1)),
      windSpeedMax: Number((daily.wind_speed_10m_max[idx] ?? 0).toFixed(1)),
      et0: Number((daily.et0_fao_evapotranspiration[idx] ?? 0).toFixed(2)),
    };
  });

  const isDay = daily7[0]
    ? computeIsDay(daily7[0].sunrise, daily7[0].sunset)
    : true;

  // --- Agricultural advisory from today's real data ---
  const advisory = buildAgriAdvisory(
    current.wind_speed_10m,
    hourlySnapshot.precipProbability,
    daily7[0]?.precipitationSum ?? 0,
    current.relative_humidity_2m,
    daily7[0]?.uvIndexMax ?? 0,
    current.cloud_cover,
    current.temperature_2m,
    gdd
  );

  return {
    raw,
    current,
    conditionLabel: wmoCodeToLabel(current.weather_code),
    isDay,
    gdd,
    daily: daily7,
    hourlySnapshot,
    advisory,
    fetchedAt: Date.now(),
  };
}

// ------------------------------------------------------------------
// Build the official Open-Meteo forecast URL with all required params
// ------------------------------------------------------------------
function buildForecastUrl(lat: number, lon: number): string {
  const url = new URL(OPEN_METEO_BASE);
  url.searchParams.set("latitude",      lat.toString());
  url.searchParams.set("longitude",     lon.toString());
  url.searchParams.set("timezone",      TIMEZONE);
  url.searchParams.set("forecast_days", FORECAST_DAYS.toString());

  // Current variables — exact names from Open-Meteo docs
  url.searchParams.set("current", [
    "temperature_2m",
    "relative_humidity_2m",
    "apparent_temperature",
    "precipitation",
    "rain",
    "wind_speed_10m",
    "wind_direction_10m",
    "cloud_cover",
    "surface_pressure",
    "weather_code",
  ].join(","));

  // Hourly variables — exact names from Open-Meteo docs
  url.searchParams.set("hourly", [
    "temperature_2m",
    "precipitation_probability",
    "soil_temperature_0cm",
    "soil_moisture_0_to_1cm",
    "shortwave_radiation",
    "et0_fao_evapotranspiration",
  ].join(","));

  // Daily variables — exact names from Open-Meteo docs
  url.searchParams.set("daily", [
    "temperature_2m_max",
    "temperature_2m_min",
    "precipitation_sum",
    "precipitation_probability_max",
    "weather_code",
    "sunrise",
    "sunset",
    "uv_index_max",
    "wind_speed_10m_max",
    "et0_fao_evapotranspiration",
  ].join(","));

  return url.toString();
}

// ------------------------------------------------------------------
// Fetch with retry + AbortController for cancellation
// ------------------------------------------------------------------
async function fetchWithRetry(
  url: string,
  signal?: AbortSignal,
  attempt = 0
): Promise<OpenMeteoResponse> {
  const res = await fetch(url, { signal });

  if (!res.ok) {
    const errBody = await res.text().catch(() => "");
    throw new Error(`Open-Meteo API error ${res.status}: ${errBody}`);
  }

  const json = await res.json();

  // The Open-Meteo API returns { error: true, reason: "..." } for bad params
  if (json.error) {
    throw new Error(`Open-Meteo parameter error: ${json.reason}`);
  }

  return json as OpenMeteoResponse;
}

// ------------------------------------------------------------------
// Server-side in-memory cache (1-hour TTL per coordinate)
// Key is rounded to 2 decimal places (≈1.1 km precision) to allow
// nearby locations to share cache entries.
// ------------------------------------------------------------------
type CacheEntry = { viewModel: WeatherViewModel; expiresAt: number };
const _cache: Map<string, CacheEntry> = new Map();
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

function cacheKey(lat: number, lon: number): string {
  return `${lat.toFixed(2)}_${lon.toFixed(2)}`;
}

function getCached(lat: number, lon: number): WeatherViewModel | null {
  const entry = _cache.get(cacheKey(lat, lon));
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    _cache.delete(cacheKey(lat, lon));
    return null;
  }
  return entry.viewModel;
}

function setCache(lat: number, lon: number, vm: WeatherViewModel): void {
  _cache.set(cacheKey(lat, lon), {
    viewModel: vm,
    expiresAt: Date.now() + CACHE_TTL_MS,
  });
}

// ------------------------------------------------------------------
// Primary public API — fetch and build full WeatherViewModel
// ------------------------------------------------------------------
export async function fetchOpenMeteoWeather(
  coords: LocationCoords,
  signal?: AbortSignal
): Promise<WeatherViewModel> {
  const { lat, lon } = coords;

  // 1. Return from cache if fresh
  const cached = getCached(lat, lon);
  if (cached) return cached;

  // 2. Build URL and fetch with retries
  const url = buildForecastUrl(lat, lon);

  let lastError: Error | null = null;
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      if (attempt > 0) {
        await new Promise((r) => setTimeout(r, RETRY_DELAY_MS * attempt));
      }
      const raw = await fetchWithRetry(url, signal, attempt);
      const viewModel = buildViewModel(raw);
      setCache(lat, lon, viewModel);
      return viewModel;
    } catch (err: any) {
      if (err?.name === "AbortError") throw err; // do not retry on cancellation
      lastError = err;
      console.error(`[OpenMeteo] attempt ${attempt + 1} failed:`, err.message);
    }
  }

  throw lastError ?? new Error("Open-Meteo fetch failed after retries");
}
