import { createFileRoute } from "@tanstack/react-router";
import { getDb } from "@/lib/db.server";
import { executeKamisSync } from "@/lib/api/market-sync.server";
import { logAdminAction } from "@/lib/audit.server";
import { requireAdminAuth } from "@/lib/api/admin-auth.server";

export const Route = createFileRoute("/api/admin/market-prices")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const auth = await requireAdminAuth(request);
        if ("response" in auth) return auth.response;
        try {
          const sql = getDb();

          // 1. Trigger background Kamis sync if empty without blocking the request
          sql`SELECT COUNT(*)::int as count FROM commodity_price_board`
            .then(([res]) => {
              if (!res || res.count === 0) {
                executeKamisSync().catch((e) => console.warn("[market-prices] background sync error:", e));
              }
            })
            .catch(() => {});

          // 2. Fetch commodities and overrides concurrently
          const [dbCommodities, overrides] = await Promise.all([
            sql`
              SELECT 
                c.id,
                c.name AS "commodityName",
                c.unit,
                COALESCE(ROUND(AVG(cpb.price::numeric)), 0) AS "officialPriceKsh"
              FROM commodities c
              LEFT JOIN commodity_price_board cpb ON cpb.commodity_id = c.id
              GROUP BY c.id, c.name, c.unit
              ORDER BY c.name ASC
            `,
            sql`
              SELECT id, commodity_name, official_price_ksh, admin_override_price_ksh, unit, notes
              FROM market_price_overrides
            `.catch(() => []),
          ]);

          const overrideMap: Record<string, any> = {};
          for (const o of overrides) {
            if (o.commodity_name) overrideMap[o.commodity_name.toLowerCase()] = o;
            if (o.id) overrideMap[o.id] = o;
          }

          // 3. Combine DB commodities with any override records
          const resultList = dbCommodities.map((c: any) => {
            const match = overrideMap[c.id] || overrideMap[c.commodityName.toLowerCase()];
            return {
              id: c.id,
              commodityName: c.commodityName,
              unit: c.unit || "90kg bag",
              officialPriceKsh: parseFloat(c.officialPriceKsh) || 0,
              adminOverridePriceKsh: match?.admin_override_price_ksh ? parseFloat(match.admin_override_price_ksh) : null,
              notes: match?.notes || null,
            };
          });

          return new Response(JSON.stringify({ success: true, commodities: resultList }), {
            headers: {
              "Content-Type": "application/json",
              "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
              Pragma: "no-cache",
            },
          });
        } catch (error: any) {
          console.error("Error fetching admin market prices:", error);
          return new Response(JSON.stringify({ success: false, error: error.message }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
          });
        }
      },

      POST: async ({ request }) => {
        const auth = await requireAdminAuth(request);
        if ("response" in auth) return auth.response;
        try {
          const body = await request.json();
          const { id, commodityName, officialPriceKsh, adminOverridePriceKsh, notes, actorId = "system-admin" } = body;
          const sql = getDb();

          // Upsert into market_price_overrides
          const [existing] = await sql`
            SELECT id FROM market_price_overrides 
            WHERE id = ${id} OR LOWER(commodity_name) = LOWER(${commodityName})
          `;

          if (existing) {
            await sql`
              UPDATE market_price_overrides
              SET 
                admin_override_price_ksh = ${adminOverridePriceKsh ? Number(adminOverridePriceKsh) : null},
                notes = ${notes || null},
                updated_at = NOW()
              WHERE id = ${existing.id}
            `;
          } else {
            await sql`
              INSERT INTO market_price_overrides (id, commodity_name, official_price_ksh, admin_override_price_ksh, unit, notes, updated_at)
              VALUES (
                ${id},
                ${commodityName},
                ${Number(officialPriceKsh) || 0},
                ${adminOverridePriceKsh ? Number(adminOverridePriceKsh) : null},
                'unit',
                ${notes || null},
                NOW()
              )
            `;
          }

          await logAdminAction({
            actorId,
            action: "MARKET_PRICE_OVERRIDE_SET",
            entity: "market_price_overrides",
            entityId: id,
            diff: { adminOverridePriceKsh, notes },
          });

          return new Response(JSON.stringify({ success: true, message: "Market price override updated successfully" }), {
            headers: { "Content-Type": "application/json" },
          });
        } catch (error: any) {
          return new Response(JSON.stringify({ success: false, error: error.message }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
          });
        }
      },
    },
  },
});
