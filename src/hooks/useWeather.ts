import { useQuery } from "@tanstack/react-query";
import { fetchWeather, getWeatherValue, type WeatherField } from "@/lib/api/weather";

const STALE_TIME = 5 * 60 * 1000; // 5 minutes

export function useWeather(lat: number, lon: number) {
  return useQuery({
    queryKey: ["weather", lat, lon],
    queryFn: () => fetchWeather(lat, lon),
    staleTime: STALE_TIME,
    retry: 2,
  });
}

export { getWeatherValue, type WeatherField };
