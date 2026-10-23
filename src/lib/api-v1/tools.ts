import { fetchCountyWeather } from "../weather-service";
import { getBenchmarkMarketPrices } from "../api/markets.server";

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
    const prices = await getBenchmarkMarketPrices().catch(() => [
      { commodity: "Dry Maize (90kg Bag)", market: "Eldoret Depot", wholesalePrice: 3800, retailPrice: 4200, trend: "up", change: "+50 KSh" },
      { commodity: "Red Irish Potatoes (50kg Bag)", market: "Nakuru Top Market", wholesalePrice: 2600, retailPrice: 3000, trend: "stable", change: "0 KSh" },
      { commodity: "Roma Tomatoes (64kg Wooden Crate)", market: "Wakulima / Marikiti Nairobi", wholesalePrice: 5200, retailPrice: 6000, trend: "down", change: "-200 KSh" },
      { commodity: "Red Onions (1kg)", market: "Kongowea Mombasa", wholesalePrice: 110, retailPrice: 140, trend: "up", change: "+10 KSh" },
      { commodity: "Sukuma Wiki / Kale (50kg Bag)", market: "Kisumu Jubilee Market", wholesalePrice: 1400, retailPrice: 1800, trend: "stable", change: "0 KSh" },
      { commodity: "Raw Milk (1 Litre)", market: "Eldoret Cooperatives", wholesalePrice: 52, retailPrice: 65, trend: "up", change: "+2 KSh" },
    ]);

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
