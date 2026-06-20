export type WeatherData = {
  current: {
    temperature_2m: number;
    apparent_temperature: number;
    relative_humidity_2m: number;
    wind_speed_10m: number;
  };
  daily: {
    precipitation_probability_max: number[];
  };
  hourly: {
    soil_temperature_0_to_7cm: number[];
    soil_moisture_0_to_10cm: number[];
  };
};

export type WeatherField =
  | "temp"
  | "feelsLike"
  | "humidity"
  | "wind"
  | "rain"
  | "soilTemp"
  | "soilMoisture";

const fallback = {
  temp: 22.8,
  feelsLike: 21.5,
  humidity: 62,
  wind: 11.5,
  rain: 20,
  soilTemp: 19.5,
  soilMoisture: 0.38,
};

export async function fetchWeather(lat: number, lon: number): Promise<WeatherData> {
  const url = new URL("https://api.open-meteo.com/v1/forecast");
  url.searchParams.set("latitude", String(lat));
  url.searchParams.set("longitude", String(lon));
  url.searchParams.set(
    "current",
    "temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,rain,wind_speed_10m",
  );
  url.searchParams.set(
    "hourly",
    "temperature_2m,precipitation_probability,soil_temperature_0_to_7cm,soil_moisture_0_to_10cm",
  );
  url.searchParams.set(
    "daily",
    "temperature_2m_max,temperature_2m_min,precipitation_probability_max",
  );
  url.searchParams.set("timezone", "Africa/Nairobi");

  const res = await fetch(url.toString());
  if (!res.ok) {
    throw new Error(`Open-Meteo request failed: ${res.status}`);
  }
  return res.json();
}

export function getWeatherValue(data: WeatherData | null | undefined, field: WeatherField): number {
  if (!data) return fallback[field];
  switch (field) {
    case "temp":
      return data.current.temperature_2m;
    case "feelsLike":
      return data.current.apparent_temperature;
    case "humidity":
      return data.current.relative_humidity_2m;
    case "wind":
      return data.current.wind_speed_10m;
    case "rain":
      return data.daily.precipitation_probability_max[0] ?? 25;
    case "soilTemp":
      return data.hourly.soil_temperature_0_to_7cm[0] ?? 20.1;
    case "soilMoisture":
      return data.hourly.soil_moisture_0_to_10cm[0] ?? 0.4;
    default:
      return 0;
  }
}

export { fallback as weatherFallback };
