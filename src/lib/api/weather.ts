// ============================================================================
// weather.ts — TanStack Start server function for Open-Meteo weather
//
// This is the ONLY server entrypoint for weather data.
// It wraps the weather-service.ts module (which does the actual fetching).
// No mock data. No hardcoded values. Pure Open-Meteo API.
// ============================================================================

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { fetchOpenMeteoWeather } from "@/lib/weather-service";
import type { WeatherViewModel } from "@/lib/weather-types";

const CoordsSchema = z.object({
  lat: z.number().min(-90).max(90),
  lon: z.number().min(-180).max(180),
  forceRefresh: z.boolean().optional(),
});

/**
 * Server function — fetches live weather from Open-Meteo + live ground stations.
 * Includes 15-minute server-side cache keyed by rounded coordinates.
 * Never returns mock data.
 */
export const fetchWeather = createServerFn({ method: "POST" })
  .inputValidator((val: unknown) => CoordsSchema.parse(val))
  .handler(async ({ data }): Promise<WeatherViewModel> => {
    return fetchOpenMeteoWeather(
      { lat: data.lat, lon: data.lon },
      undefined,
      { forceRefresh: data.forceRefresh }
    );
  });

// Re-export types for consumers
export type { WeatherViewModel } from "@/lib/weather-types";
export { wmoCodeToLabel, wmoCodeToIconKind } from "@/lib/weather-service";
