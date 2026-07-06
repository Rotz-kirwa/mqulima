// ============================================================================
// Open-Meteo Weather Types
// Official API: https://api.open-meteo.com/v1/forecast
// Variable names are EXACT as returned by the Open-Meteo API.
// ============================================================================

/** WMO Weather interpretation codes (WW) */
export type WeatherCode =
  | 0   // Clear sky
  | 1 | 2 | 3                  // Mainly clear, partly cloudy, overcast
  | 45 | 48                    // Fog
  | 51 | 53 | 55               // Drizzle
  | 61 | 63 | 65               // Rain
  | 71 | 73 | 75               // Snow
  | 77                         // Snow grains
  | 80 | 81 | 82               // Rain showers
  | 85 | 86                    // Snow showers
  | 95                         // Thunderstorm
  | 96 | 99                    // Thunderstorm with hail
  | number;

export interface OpenMeteoCurrentWeather {
  time: string;
  interval: number;
  temperature_2m: number;
  relative_humidity_2m: number;
  apparent_temperature: number;
  precipitation: number;
  rain: number;
  wind_speed_10m: number;
  wind_direction_10m: number;
  cloud_cover: number;
  surface_pressure: number;
  weather_code: WeatherCode;
}

export interface OpenMeteoHourly {
  time: string[];
  temperature_2m: number[];
  precipitation_probability: number[];
  soil_temperature_0cm: number[];
  soil_moisture_0_to_1cm: number[];
  shortwave_radiation: number[];
  et0_fao_evapotranspiration: number[];
}

export interface OpenMeteoDaily {
  time: string[];
  temperature_2m_max: number[];
  temperature_2m_min: number[];
  precipitation_sum: number[];
  precipitation_probability_max: number[];
  weather_code: WeatherCode[];
  sunrise: string[];
  sunset: string[];
  uv_index_max: number[];
  wind_speed_10m_max: number[];
  et0_fao_evapotranspiration: number[];
}

export interface OpenMeteoResponse {
  latitude: number;
  longitude: number;
  elevation: number;
  generationtime_ms: number;
  utc_offset_seconds: number;
  timezone: string;
  timezone_abbreviation: string;
  current: OpenMeteoCurrentWeather;
  hourly: OpenMeteoHourly;
  daily: OpenMeteoDaily;
}

// ============================================================================
// Derived types used in UI components
// ============================================================================

export interface DailyForecast {
  date: string;           // ISO date string "2026-07-02"
  dayLabel: string;       // "Today", "Thu", "Fri", etc.
  weatherCode: WeatherCode;
  conditionLabel: string; // human-readable from WMO code
  tempMax: number;
  tempMin: number;
  precipitationSum: number;   // mm
  precipitationProbMax: number; // %
  sunrise: string;        // ISO datetime
  sunset: string;         // ISO datetime
  uvIndexMax: number;
  windSpeedMax: number;   // km/h
  et0: number;            // mm — daily evapotranspiration
}

export interface HourlySnapshot {
  soilTemperature: number;    // °C at 0cm
  soilMoisturePct: number;    // % relative (scaled from m³/m³)
  shortwaveRadiation: number; // W/m²
  et0Hourly: number;          // mm (current hour)
  precipProbability: number;  // %
}

export interface AgriAdvisory {
  sprayWindow: "IDEAL" | "UNSTABLE" | "CLOSED";
  sprayWindowText: string;
  bullets: { text: string; color: "green" | "gold" | "red" }[];
  alerts: string[];
  gdd: number;   // Growing Degree Days (base 10°C)
  recommendations: string[];
}

export interface WeatherViewModel {
  raw: OpenMeteoResponse;
  current: OpenMeteoCurrentWeather;
  conditionLabel: string;      // from WMO code
  isDay: boolean;
  gdd: number;
  daily: DailyForecast[];
  hourlySnapshot: HourlySnapshot;
  advisory: AgriAdvisory;
  fetchedAt: number;           // timestamp
}

export type LocationCoords = {
  lat: number;
  lon: number;
};
