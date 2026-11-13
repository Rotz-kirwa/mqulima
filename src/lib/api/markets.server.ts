import { createServerFn } from "@tanstack/react-start";
import type { CommodityPriceEntry } from "./markets-ops.server";

export type { CommodityPriceEntry };

export const getMarketPrices = createServerFn({ method: "POST" }).handler(
  async () => {
    const { queryMarketPrices } = await import("./markets-ops.server");
    return queryMarketPrices(false);
  }
);

export const refreshKamisPrices = createServerFn({ method: "POST" }).handler(
  async () => {
    const { executeKamisSync } = await import("./market-sync.server");
    const { invalidateMarketPricesCache } = await import("./markets-ops.server");
    const syncRes = await executeKamisSync();
    invalidateMarketPricesCache();
    return syncRes;
  }
);
