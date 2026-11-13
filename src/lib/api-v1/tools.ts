import { fetchCountyWeather } from "../weather-service";
import { queryMarketPrices, BENCHMARK_COMMODITIES } from "../api/markets-ops.server";

export async function handleWeather(url: URL): Promise<Response> {
  try {
    const county = url.searchParams.get("county") || "Uasin Gishu";
    const forceRefresh =
      url.searchParams.get("refresh") === "1" ||
      url.searchParams.get("refresh") === "true" ||
      url.searchParams.get("force") === "1";
    const weather = await fetchCountyWeather(county, undefined, { forceRefresh });

    return new Response(JSON.stringify(weather), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": forceRefresh ? "no-store" : "public, max-age=180, s-maxage=900",
      },
    });
  } catch (err: any) {
    return new Response(
      JSON.stringify({ success: false, error: err?.message || "Failed to fetch weather forecast" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

export async function handleMarketPrices(url?: URL): Promise<Response> {
  try {
    const forceRefresh =
      url?.searchParams.get("refresh") === "1" ||
      url?.searchParams.get("refresh") === "true" ||
      url?.searchParams.get("force") === "1";
    const prices = await queryMarketPrices(forceRefresh).catch(() => BENCHMARK_COMMODITIES);

    return new Response(JSON.stringify(prices), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": forceRefresh ? "no-store" : "public, max-age=180, s-maxage=900",
      },
    });
  } catch (err: any) {
    return new Response(
      JSON.stringify({ success: false, error: err?.message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
