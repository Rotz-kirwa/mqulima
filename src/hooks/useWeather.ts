// ============================================================================
// useWeather — React hook for Open-Meteo weather data
//
// Manages: location state, loading, error, GPS detection, and fetch lifecycle.
// Supports: county presets, GPS auto-detect, manual lat/lon override.
// Uses AbortController to cancel in-flight requests on location change.
// ============================================================================

import { useState, useEffect, useRef, useCallback } from "react";
import { toast } from "sonner";
import { fetchWeather } from "@/lib/api/weather";
import type { WeatherViewModel, LocationCoords } from "@/lib/weather-types";

// ------------------------------------------------------------------
// Kenya county coordinate registry
// Coordinates verified against official Kenya GIS data
// ------------------------------------------------------------------
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

export type CountyName = keyof typeof KENYA_COUNTIES;

export type WeatherLocation =
  | { type: "county"; county: CountyName }
  | { type: "gps"; coords: LocationCoords; label: string }
  | { type: "manual"; coords: LocationCoords };

export type UseWeatherState = {
  data: WeatherViewModel | null;
  loading: boolean;
  error: string | null;
  location: WeatherLocation;
  lastFetchedAt: number | null;
  // Actions
  selectCounty: (county: CountyName) => void;
  detectGPS: () => void;
  setManualCoords: (lat: number, lon: number) => void;
  refresh: () => void;
};

function resolveCoords(location: WeatherLocation): LocationCoords {
  if (location.type === "county") {
    return KENYA_COUNTIES[location.county] ?? KENYA_COUNTIES["Nairobi"];
  }
  return location.coords;
}

function resolveLabel(location: WeatherLocation): string {
  if (location.type === "county") return `${location.county} County, Kenya`;
  if (location.type === "gps") return location.label;
  const c = location.coords;
  return `${Math.abs(c.lat).toFixed(3)}°${c.lat >= 0 ? "N" : "S"} ${Math.abs(c.lon).toFixed(3)}°${c.lon >= 0 ? "E" : "W"}`;
}

export function useWeather(defaultCounty: CountyName = "Nairobi"): UseWeatherState {
  const [location, setLocation] = useState<WeatherLocation>({
    type: "county",
    county: defaultCounty,
  });
  const [data, setData] = useState<WeatherViewModel | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastFetchedAt, setLastFetchedAt] = useState<number | null>(null);

  // AbortController ref — cancelled on each new location change
  const abortRef = useRef<AbortController | null>(null);

  const doFetch = useCallback(async (loc: WeatherLocation) => {
    // Cancel any in-flight request
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;

    setLoading(true);
    setError(null);

    const coords = resolveCoords(loc);

    try {
      const vm = await fetchWeather({ data: coords });
      if (ctrl.signal.aborted) return; // location changed mid-flight
      setData(vm);
      setLastFetchedAt(vm.fetchedAt);
    } catch (err: any) {
      if (err?.name === "AbortError") return;
      const message =
        err?.message?.includes("Open-Meteo API error")
          ? "Open-Meteo API is temporarily unavailable. Please try again shortly."
          : "Could not load weather data. Check your connection and retry.";
      setError(message);
      toast.error(message);
    } finally {
      if (!ctrl.signal.aborted) setLoading(false);
    }
  }, []);

  // Re-fetch whenever location changes
  useEffect(() => {
    doFetch(location);
    return () => { abortRef.current?.abort(); };
  }, [location, doFetch]);

  const selectCounty = useCallback((county: CountyName) => {
    setLocation({ type: "county", county });
  }, []);

  const detectGPS = useCallback(() => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser.");
      return;
    }
    toast.info("Requesting GPS location...");
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        const { latitude, longitude } = coords;
        const label = `GPS · ${Math.abs(latitude).toFixed(4)}°${latitude >= 0 ? "N" : "S"}, ${Math.abs(longitude).toFixed(4)}°${longitude >= 0 ? "E" : "W"}`;
        setLocation({ type: "gps", coords: { lat: latitude, lon: longitude }, label });
        toast.success(`Location acquired: ${label}`);
      },
      (err) => {
        console.error("GPS error:", err);
        toast.error("GPS acquisition failed. Please select a county manually.");
      },
      { enableHighAccuracy: true, timeout: 10_000 }
    );
  }, []);

  const setManualCoords = useCallback((lat: number, lon: number) => {
    setLocation({ type: "manual", coords: { lat, lon } });
  }, []);

  const refresh = useCallback(() => {
    doFetch(location);
  }, [location, doFetch]);

  return {
    data,
    loading,
    error,
    location,
    lastFetchedAt,
    selectCounty,
    detectGPS,
    setManualCoords,
    refresh,
  };
}

export { resolveLabel };
