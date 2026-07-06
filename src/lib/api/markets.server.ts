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
