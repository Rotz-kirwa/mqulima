import { fetchCountyWeather } from "../weather-service";
import { getMarketPrices, BENCHMARK_COMMODITIES } from "../api/markets.server";

export async function handleWeather(url: URL): Promise<Response> {
  try {
    const county = url.searchParams.get("county") || "Uasin Gishu";
    const weather = await fetchCountyWeather(county);

    return new Response(JSON.stringify(weather), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "public, max-age=600, s-maxage=1800",
      },
    });
  } catch (err: any) {
    return new Response(
      JSON.stringify({ success: false, error: err?.message || "Failed to fetch weather forecast" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

export async function handleMarketPrices(): Promise<Response> {
  try {
    const prices = await getMarketPrices().catch(() => BENCHMARK_COMMODITIES);

    return new Response(JSON.stringify(prices), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "public, max-age=900, s-maxage=3600",
      },
    });
  } catch (err: any) {
    return new Response(
      JSON.stringify({ success: false, error: err?.message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
