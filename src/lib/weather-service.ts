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
  OpenMeteoCurrentWeather,
  WeatherViewModel,
  DailyForecast,
  HourlySnapshot,
  AgriAdvisory,
  WeatherCode,
  LocationCoords,
} from "@/lib/weather-types";

const OPEN_METEO_BASE = "https://api.open-meteo.com/v1/forecast";
const OPENWEATHER_CURRENT_BASE = "https://api.openweathermap.org/data/2.5/weather";
const KENYA_METAR_URL =
  "https://aviationweather.gov/api/data/metar?ids=HKNW,HKJK,HKMO,HKKI,HKEL,HKML,HKWJ,HKGA,HKLU&format=json";
const TIMEZONE = "Africa/Nairobi";
const EAT_OFFSET_MS = 3 * 60 * 60 * 1000;
const FORECAST_DAYS = 7;
const MAX_RETRIES = 2;
const RETRY_DELAY_MS = 800;
const CACHE_TTL_MS = 15 * 60 * 1000; // 15 minutes (matches Open-Meteo 15m current cadence)
const MAX_METAR_DISTANCE_KM = 45;
const MAX_METAR_AGE_MS = 90 * 60 * 1000;

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
    const reasons: string[] = [];
    if (precipProb > 60) reasons.push(`rain risk ${precipProb}%`);
    if (windSpeed > 20) reasons.push(`wind drift ${windSpeed.toFixed(0)} km/h`);
    if (precipSum > 2) reasons.push(`daily rain ${precipSum.toFixed(1)} mm`);
    sprayWindow = "CLOSED";
    sprayWindowText = `Wash-off or drift risk (${reasons.join(", ")}). Suspend all agrochemical applications to prevent wash-off, drift, and water-table contamination.`;
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

type GroundObservation = {
  temperature_2m: number;
  relative_humidity_2m?: number;
  apparent_temperature?: number;
  wind_speed_10m?: number;
  wind_direction_10m?: number;
  cloud_cover?: number;
  precipitation?: number;
  rain?: number;
  weather_code?: WeatherCode;
  sourceLabel: string;
  observationStation: string;
  observedAt: string;
};

type MetarReport = {
  icaoId?: string;
  name?: string;
  lat?: number;
  lon?: number;
  obsTime?: number;
  reportTime?: string;
  temp?: number | null;
  dewp?: number | null;
  wdir?: number | string | null;
  wspd?: number | null;
  wxString?: string | null;
  cover?: string | null;
};

function getNairobiNowIso(offsetMs = EAT_OFFSET_MS, dateMs = Date.now()): string {
  return new Date(dateMs + offsetMs).toISOString();
}

function formatNairobiClock(ms: number): string {
  return `${getNairobiNowIso(EAT_OFFSET_MS, ms).substring(11, 16)} EAT`;
}

// ------------------------------------------------------------------
// Find the hourly index matching current local time in Africa/Nairobi
// (hourly.time from Open-Meteo is in Africa/Nairobi, NOT UTC)
// ------------------------------------------------------------------
function getCurrentHourIndex(hourlyTimes: string[], utcOffsetSeconds = 10800): number {
  const localIso = getNairobiNowIso(utcOffsetSeconds * 1000);
  const targetPrefix = localIso.substring(0, 13); // "YYYY-MM-DDTHH"
  const idx = hourlyTimes.findIndex((t) => t.startsWith(targetPrefix));
  if (idx >= 0) return idx;
  const hourFallback = parseInt(localIso.substring(11, 13), 10);
  return Math.min(Math.max(0, hourFallback), Math.max(0, hourlyTimes.length - 1));
}

function getBlendedSoilMoisture(
  hourly: OpenMeteoResponse["hourly"],
  hIdx: number
): { value: number; depthLabel: string } {
  const sm0_1 = hourly.soil_moisture_0_to_1cm?.[hIdx];
  const sm1_3 = hourly.soil_moisture_1_to_3cm?.[hIdx];
  const sm3_9 = hourly.soil_moisture_3_to_9cm?.[hIdx];
  if (typeof sm0_1 === "number" && typeof sm1_3 === "number" && typeof sm3_9 === "number") {
    return {
      value: (sm0_1 * 1 + sm1_3 * 2 + sm3_9 * 6) / 9,
      depthLabel: "Root Zone (0-9cm)",
    };
  }
  return {
    value: typeof sm0_1 === "number" ? sm0_1 : 0,
    depthLabel: "Surface (0-1cm)",
  };
}

// ------------------------------------------------------------------
// Ground-station observation helpers (OpenWeatherMap + Kenya METARs)
// ------------------------------------------------------------------
function withTimeoutSignal(ms: number, parent?: AbortSignal): { signal: AbortSignal; cleanup: () => void } {
  const ctrl = new AbortController();
  const onParentAbort = () => ctrl.abort();
  if (parent) {
    if (parent.aborted) ctrl.abort();
    else parent.addEventListener("abort", onParentAbort, { once: true });
  }
  const timer = setTimeout(() => ctrl.abort(), ms);
  return {
    signal: ctrl.signal,
    cleanup: () => {
      clearTimeout(timer);
      if (parent) parent.removeEventListener("abort", onParentAbort);
    },
  };
}

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function computeRhFromDewpoint(tempC: number, dewpC: number): number {
  const es = Math.exp((17.625 * tempC) / (243.04 + tempC));
  const e = Math.exp((17.625 * dewpC) / (243.04 + dewpC));
  return Math.min(100, Math.max(1, Math.round((e / es) * 100)));
}

function mapOpenWeatherIdToWmo(id?: number): WeatherCode | undefined {
  if (typeof id !== "number") return undefined;
  if (id >= 200 && id < 300) return id === 202 || id === 212 || id === 221 || id === 232 ? 96 : 95;
  if (id >= 300 && id < 400) return id === 302 || id === 312 || id === 314 ? 55 : id === 301 || id === 311 ? 53 : 51;
  if (id === 500 || id === 511) return 61;
  if (id === 501) return 63;
  if (id >= 502 && id <= 504) return 65;
  if (id === 520) return 80;
  if (id === 521) return 81;
  if (id >= 522 && id < 600) return 82;
  if (id >= 600 && id < 700) return id === 602 ? 75 : id === 601 ? 73 : 71;
  if (id >= 700 && id < 800) return 45;
  if (id === 800) return 0;
  if (id === 801) return 1;
  if (id === 802) return 2;
  if (id === 803 || id === 804) return 3;
  return undefined;
}

function mapMetarToWmo(wxString?: string | null, cover?: string | null): { code?: WeatherCode; raining: boolean } {
  const wx = (wxString || "").toUpperCase();
  if (wx.includes("TS")) return { code: wx.includes("GR") ? 96 : 95, raining: true };
  if (wx.includes("SHRA")) return { code: wx.includes("+") ? 82 : wx.includes("-") ? 80 : 81, raining: true };
  if (wx.includes("DZ")) return { code: wx.includes("+") ? 55 : wx.includes("-") ? 51 : 53, raining: true };
  if (wx.includes("RA")) return { code: wx.includes("+") ? 65 : wx.includes("-") ? 61 : 63, raining: true };
  if (wx.includes("FG") || wx.includes("BR") || wx.includes("HZ")) return { code: 45, raining: false };
  const cov = (cover || "").toUpperCase();
  if (cov === "CLR" || cov === "SKC" || cov === "CAVOK") return { code: 0, raining: false };
  if (cov === "FEW") return { code: 1, raining: false };
  if (cov === "SCT") return { code: 2, raining: false };
  if (cov === "BKN" || cov === "OVC") return { code: 3, raining: false };
  return { code: undefined, raining: false };
}

function mapMetarCloudCover(cover?: string | null): number | undefined {
  const cov = (cover || "").toUpperCase();
  if (cov === "CLR" || cov === "SKC" || cov === "CAVOK") return 5;
  if (cov === "FEW") return 20;
  if (cov === "SCT") return 45;
  if (cov === "BKN") return 75;
  if (cov === "OVC") return 95;
  return undefined;
}

let _metarBatchCache: { reports: MetarReport[]; expiresAt: number } | null = null;
let _metarInFlight: Promise<MetarReport[]> | null = null;

async function fetchOpenWeatherCurrent(
  lat: number,
  lon: number,
  apiKey: string,
  parentSignal?: AbortSignal
): Promise<GroundObservation | null> {
  const { signal, cleanup } = withTimeoutSignal(4500, parentSignal);
  try {
    const url = new URL(OPENWEATHER_CURRENT_BASE);
    url.searchParams.set("lat", lat.toString());
    url.searchParams.set("lon", lon.toString());
    url.searchParams.set("units", "metric");
    url.searchParams.set("appid", apiKey);
    const res = await fetch(url.toString(), { signal });
    if (!res.ok) return null;
    const owm: any = await res.json();
    if (typeof owm?.main?.temp !== "number") return null;

    const rain1h = typeof owm?.rain?.["1h"] === "number" ? owm.rain["1h"] : undefined;
    const obsMs = typeof owm?.dt === "number" ? owm.dt * 1000 : Date.now();
    return {
      temperature_2m: Number(owm.main.temp.toFixed(1)),
      relative_humidity_2m: typeof owm.main.humidity === "number" ? Math.round(owm.main.humidity) : undefined,
      apparent_temperature: typeof owm.main.feels_like === "number" ? Number(owm.main.feels_like.toFixed(1)) : undefined,
      wind_speed_10m: typeof owm?.wind?.speed === "number" ? Number((owm.wind.speed * 3.6).toFixed(1)) : undefined,
      wind_direction_10m: typeof owm?.wind?.deg === "number" ? Math.round(owm.wind.deg) : undefined,
      cloud_cover: typeof owm?.clouds?.all === "number" ? Math.round(owm.clouds.all) : undefined,
      precipitation: rain1h,
      rain: rain1h,
      weather_code: mapOpenWeatherIdToWmo(owm?.weather?.[0]?.id),
      sourceLabel: "OpenWeatherMap + Open-Meteo",
      observationStation: owm.name ? `${owm.name} (OpenWeatherMap)` : "OpenWeatherMap",
      observedAt: formatNairobiClock(obsMs),
    };
  } catch {
    return null;
  } finally {
    cleanup();
  }
}

async function fetchKenyaMetarBatch(parentSignal?: AbortSignal, forceRefresh = false): Promise<MetarReport[]> {
  if (!forceRefresh && _metarBatchCache && Date.now() < _metarBatchCache.expiresAt) {
    return _metarBatchCache.reports;
  }
  if (_metarInFlight) return _metarInFlight;

  const { signal, cleanup } = withTimeoutSignal(5000, parentSignal);
  _metarInFlight = (async () => {
    try {
      const res = await fetch(KENYA_METAR_URL, { signal });
      if (!res.ok) return _metarBatchCache?.reports ?? [];
      const data = await res.json();
      if (!Array.isArray(data)) return _metarBatchCache?.reports ?? [];
      _metarBatchCache = { reports: data as MetarReport[], expiresAt: Date.now() + CACHE_TTL_MS };
      return data as MetarReport[];
    } catch {
      return _metarBatchCache?.reports ?? [];
    } finally {
      cleanup();
      _metarInFlight = null;
    }
  })();

  return _metarInFlight;
}

async function fetchNearestKenyaMetar(
  lat: number,
  lon: number,
  parentSignal?: AbortSignal,
  forceRefresh = false
): Promise<GroundObservation | null> {
  const reports = await fetchKenyaMetarBatch(parentSignal, forceRefresh);
  const now = Date.now();
  let best: { report: MetarReport; dist: number; obsMs: number } | null = null;

  for (const r of reports) {
    if (typeof r.lat !== "number" || typeof r.lon !== "number" || typeof r.temp !== "number") continue;
    const obsMs = typeof r.obsTime === "number" ? r.obsTime * 1000 : Date.parse(r.reportTime || "");
    if (!Number.isFinite(obsMs) || now - obsMs > MAX_METAR_AGE_MS) continue;
    const dist = haversineKm(lat, lon, r.lat, r.lon);
    if (dist <= MAX_METAR_DISTANCE_KM && (!best || dist < best.dist)) {
      best = { report: r, dist, obsMs };
    }
  }

  if (!best) return null;
  const { report, obsMs } = best;
  const { code, raining } = mapMetarToWmo(report.wxString, report.cover);
  const rh = typeof report.dewp === "number" ? computeRhFromDewpoint(report.temp!, report.dewp) : undefined;
  const windKmh = typeof report.wspd === "number" ? Number((report.wspd * 1.852).toFixed(1)) : undefined;

  return {
    temperature_2m: Number(report.temp!.toFixed(1)),
    relative_humidity_2m: rh,
    wind_speed_10m: windKmh,
    wind_direction_10m: typeof report.wdir === "number" ? Math.round(report.wdir) : undefined,
    cloud_cover: mapMetarCloudCover(report.cover),
    precipitation: raining ? undefined : 0,
    rain: raining ? undefined : 0,
    weather_code: code,
    sourceLabel: `${report.icaoId} Airport + Open-Meteo`,
    observationStation: report.name ? `${report.name} (${report.icaoId})` : `${report.icaoId} Airport`,
    observedAt: formatNairobiClock(obsMs),
  };
}

async function fetchGroundObservation(
  lat: number,
  lon: number,
  parentSignal?: AbortSignal,
  forceRefresh = false
): Promise<GroundObservation | null> {
  const owmKey = (typeof process !== "undefined" ? process.env?.OPENWEATHER_API_KEY : undefined)?.trim();
  if (owmKey) {
    const owmObs = await fetchOpenWeatherCurrent(lat, lon, owmKey, parentSignal);
    if (owmObs) return owmObs;
  }
  return fetchNearestKenyaMetar(lat, lon, parentSignal, forceRefresh);
}

// ------------------------------------------------------------------
// Build full WeatherViewModel from Open-Meteo + live ground observation
// ------------------------------------------------------------------
export function buildViewModel(
  raw: OpenMeteoResponse,
  observation: GroundObservation | null = null,
  fetchedAt = Date.now()
): WeatherViewModel {
  const { current, daily, hourly } = raw;

  // Find current-hour index in local Africa/Nairobi hourly arrays
  const hIdx = getCurrentHourIndex(hourly.time, raw.utc_offset_seconds ?? 10800);
  const soil = getBlendedSoilMoisture(hourly, hIdx);

  // --- Hourly snapshot at current Kenya hour ---
  const hourlySnapshot: HourlySnapshot = {
    soilTemperature:   hourly.soil_temperature_0cm[hIdx] ?? 0,
    soilMoisturePct:   soilMoistureToPercent(soil.value),
    shortwaveRadiation: hourly.shortwave_radiation[hIdx] ?? 0,
    et0Hourly:         hourly.et0_fao_evapotranspiration[hIdx] ?? 0,
    precipProbability: hourly.precipitation_probability[hIdx] ?? 0,
  };

  // Overlay live station / OpenWeatherMap current conditions if available
  const mergedCurrent: OpenMeteoCurrentWeather = observation
    ? {
        ...current,
        temperature_2m: observation.temperature_2m,
        relative_humidity_2m: observation.relative_humidity_2m ?? current.relative_humidity_2m,
        apparent_temperature: observation.apparent_temperature ?? current.apparent_temperature,
        wind_speed_10m: observation.wind_speed_10m ?? current.wind_speed_10m,
        wind_direction_10m: observation.wind_direction_10m ?? current.wind_direction_10m,
        cloud_cover: observation.cloud_cover ?? current.cloud_cover,
        precipitation: observation.precipitation ?? current.precipitation,
        rain: observation.rain ?? current.rain,
        weather_code: observation.weather_code ?? current.weather_code,
      }
    : current;

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

  const isDay = mergedCurrent.is_day !== undefined
    ? mergedCurrent.is_day === 1
    : daily7[0]
    ? computeIsDay(daily7[0].sunrise, daily7[0].sunset)
    : true;

  // --- Agricultural advisory from synchronized live data ---
  const advisory = buildAgriAdvisory(
    mergedCurrent.wind_speed_10m,
    hourlySnapshot.precipProbability,
    daily7[0]?.precipitationSum ?? 0,
    mergedCurrent.relative_humidity_2m,
    daily7[0]?.uvIndexMax ?? 0,
    mergedCurrent.cloud_cover,
    mergedCurrent.temperature_2m,
    gdd
  );

  const openMeteoClock = current.time ? `${current.time.substring(11, 16)} EAT` : formatNairobiClock(fetchedAt);

  return {
    raw,
    current: mergedCurrent,
    conditionLabel: wmoCodeToLabel(mergedCurrent.weather_code),
    isDay,
    gdd,
    daily: daily7,
    hourlySnapshot,
    advisory,
    fetchedAt,
    sourceLabel: observation?.sourceLabel ?? "Open-Meteo Live",
    observationStation: observation?.observationStation ?? "Open-Meteo Grid",
    observedAt: observation?.observedAt ?? openMeteoClock,
    soilDepthLabel: soil.depthLabel,
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
    "is_day",
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
    "weather_code",
    "is_day",
    "soil_temperature_0cm",
    "soil_moisture_0_to_1cm",
    "soil_moisture_1_to_3cm",
    "soil_moisture_3_to_9cm",
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
// Server-side in-memory cache (15-min TTL per coordinate; recomputes
// Africa/Nairobi hour index dynamically on read so hourly values never lag)
// ------------------------------------------------------------------
type CacheEntry = {
  raw: OpenMeteoResponse;
  observation: GroundObservation | null;
  fetchedAt: number;
  expiresAt: number;
};
const _cache: Map<string, CacheEntry> = new Map();

function cacheKey(lat: number, lon: number): string {
  return `${lat.toFixed(2)}_${lon.toFixed(2)}`;
}

function getCached(lat: number, lon: number): CacheEntry | null {
  const entry = _cache.get(cacheKey(lat, lon));
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    _cache.delete(cacheKey(lat, lon));
    return null;
  }
  return entry;
}

function setCache(lat: number, lon: number, raw: OpenMeteoResponse, observation: GroundObservation | null, fetchedAt: number): void {
  _cache.set(cacheKey(lat, lon), {
    raw,
    observation,
    fetchedAt,
    expiresAt: fetchedAt + CACHE_TTL_MS,
  });
}

// ------------------------------------------------------------------
// Primary public API — fetch and build full WeatherViewModel
// ------------------------------------------------------------------
export async function fetchOpenMeteoWeather(
  coords: LocationCoords,
  signal?: AbortSignal,
  options?: { forceRefresh?: boolean }
): Promise<WeatherViewModel> {
  const { lat, lon } = coords;

  // 1. Return freshly indexed view from 15m cache unless forceRefresh requested
  if (!options?.forceRefresh) {
    const cached = getCached(lat, lon);
    if (cached) return buildViewModel(cached.raw, cached.observation, cached.fetchedAt);
  }

  // 2. Fetch Open-Meteo forecast & live ground observation in parallel
  const url = buildForecastUrl(lat, lon);
  const obsPromise = fetchGroundObservation(lat, lon, signal, Boolean(options?.forceRefresh));

  let lastError: Error | null = null;
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      if (attempt > 0) {
        await new Promise((r) => setTimeout(r, RETRY_DELAY_MS * attempt));
      }
      const raw = await fetchWithRetry(url, signal, attempt);
      const observation = await obsPromise;
      const now = Date.now();
      setCache(lat, lon, raw, observation, now);
      return buildViewModel(raw, observation, now);
    } catch (err: any) {
      if (err?.name === "AbortError") throw err; // do not retry on cancellation
      lastError = err;
      console.error(`[OpenMeteo] attempt ${attempt + 1} failed:`, err.message);
    }
  }

  throw lastError ?? new Error("Open-Meteo fetch failed after retries");
}

export const KENYA_COUNTIES: Record<string, LocationCoords> = {
  "Baringo":         { lat: 0.4833,  lon: 35.7333 },
  "Bomet":           { lat: -0.7833, lon: 35.3500 },
  "Bungoma":         { lat: 0.5635,  lon: 34.5606 },
  "Busia":           { lat: 0.4608,  lon: 34.1115 },
  "Elgeyo-Marakwet": { lat: 0.8000,  lon: 35.5000 },
  "Embu":            { lat: -0.5311, lon: 37.4506 },
  "Garissa":         { lat: -0.4532, lon: 39.6461 },
  "Homa Bay":        { lat: -0.5298, lon: 34.4534 },
  "Isiolo":          { lat: 0.3546,  lon: 37.5822 },
  "Kajiado":         { lat: -1.8500, lon: 36.7833 },
  "Kakamega":        { lat: 0.2827,  lon: 34.7519 },
  "Kericho":         { lat: -0.3689, lon: 35.2863 },
  "Kiambu":          { lat: -1.1736, lon: 36.8356 },
  "Kilifi":          { lat: -3.6307, lon: 39.8499 },
  "Kirinyaga":       { lat: -0.4980, lon: 37.3150 },
  "Kisii":           { lat: -0.6817, lon: 34.7717 },
  "Kisumu":          { lat: -0.1022, lon: 34.7617 },
  "Kitui":           { lat: -1.3683, lon: 38.0106 },
  "Kwale":           { lat: -4.1737, lon: 39.4521 },
  "Laikipia":        { lat: 0.3667,  lon: 36.7833 },
  "Lamu":            { lat: -2.2717, lon: 40.9020 },
  "Machakos":        { lat: -1.5177, lon: 37.2634 },
  "Makueni":         { lat: -1.8041, lon: 37.6203 },
  "Mandera":         { lat: 3.9367,  lon: 41.8569 },
  "Marsabit":        { lat: 2.3369,  lon: 37.9904 },
  "Meru":            { lat: 0.0463,  lon: 37.6559 },
  "Migori":          { lat: -1.0634, lon: 34.4731 },
  "Mombasa":         { lat: -4.0547, lon: 39.6636 },
  "Murang'a":        { lat: -0.7210, lon: 37.1500 },
  "Nairobi":         { lat: -1.2921, lon: 36.8219 },
  "Nakuru":          { lat: -0.3031, lon: 36.0800 },
  "Nandi":           { lat: 0.1833,  lon: 35.1000 },
  "Narok":           { lat: -1.0836, lon: 35.8712 },
  "Nyamira":         { lat: -0.5633, lon: 34.9358 },
  "Nyandarua":       { lat: -0.4285, lon: 36.3767 },
  "Nyeri":           { lat: -0.4167, lon: 36.9500 },
  "Samburu":         { lat: 1.2500,  lon: 36.8000 },
  "Siaya":           { lat: -0.0607, lon: 34.2882 },
  "Taita-Taveta":    { lat: -3.3161, lon: 38.4850 },
  "Tana River":      { lat: -1.4827, lon: 40.0130 },
  "Tharaka-Nithi":   { lat: -0.2996, lon: 37.8979 },
  "Trans Nzoia":     { lat: 1.0181,  lon: 35.0022 },
  "Turkana":         { lat: 3.1167,  lon: 35.6000 },
  "Uasin Gishu":     { lat: 0.5143,  lon: 35.2698 },
  "Vihiga":          { lat: 0.0833,  lon: 34.7167 },
  "Wajir":           { lat: 1.7471,  lon: 40.0573 },
  "West Pokot":      { lat: 1.5000,  lon: 35.1167 }
};

export async function fetchCountyWeather(
  county: string,
  signal?: AbortSignal,
  options?: { forceRefresh?: boolean }
): Promise<WeatherViewModel> {
  const norm = (county || "").trim();
  const matchedKey = Object.keys(KENYA_COUNTIES).find(
    (k) => k.toLowerCase() === norm.toLowerCase() || norm.toLowerCase().includes(k.toLowerCase())
  );
  const coords = matchedKey ? KENYA_COUNTIES[matchedKey] : KENYA_COUNTIES["Uasin Gishu"];
  return fetchOpenMeteoWeather(coords, signal, options);
}

