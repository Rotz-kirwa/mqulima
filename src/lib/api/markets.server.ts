import { createServerFn } from "@tanstack/react-start";

async function db() {
  const { getDb } = await import("../db.server");
  return getDb();
}

export type CommodityPriceEntry = {
  id: string;
  name: string;
  unit: string;
  entries: { region: string; price: number; source: string; recorded_at: string }[];
};

export const getMarketPrices = createServerFn({ method: "POST" }).handler(
  async () => {
    const sql = await db();

    // Check if prices need automatic KAMIS sync (older than 6 hours)
    try {
      const [latest] = await sql`SELECT MAX(recorded_at) as last_sync FROM commodity_price_board`;
      const lastSync = latest?.last_sync ? new Date(latest.last_sync).getTime() : 0;
      const sixHoursMs = 6 * 60 * 60 * 1000;

      if (Date.now() - lastSync > sixHoursMs) {
        const { executeKamisSync } = await import("./market-sync.server");
        await executeKamisSync();
      }
    } catch (e) {
      console.error("Auto KAMIS sync check notice:", e);
    }

    // Pull all commodities and their latest price board entries
    const rows = await sql`
      SELECT
        co.id,
        co.name,
        co.unit,
        cpb.region,
        cpb.price::float as price,
        cpb.source,
        cpb.recorded_at::text as recorded_at
      FROM commodities co
      LEFT JOIN commodity_price_board cpb ON cpb.commodity_id = co.id
      ORDER BY co.name ASC, cpb.recorded_at DESC
    `;

    // Group by commodity id
    const map: Record<string, CommodityPriceEntry> = {};
    for (const row of rows) {
      if (!map[row.id]) {
        map[row.id] = {
          id: row.id,
          name: row.name,
          unit: row.unit,
          entries: [],
        };
      }
      if (row.region) {
        map[row.id].entries.push({
          region: row.region,
          price: row.price,
          source: row.source || "",
          recorded_at: row.recorded_at || "",
        });
      }
    }

    return Object.values(map);
  }
);
