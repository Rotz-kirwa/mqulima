import { getDrizzleDb } from "@/lib/db.server";
import { posAuthTokens, posSyncLogs, products, productVariants } from "@/db/schema/products";
import { eq, sql, and, desc } from "drizzle-orm";
import crypto from "crypto";

export interface SmoothSaleConfig {
  baseUrl: string;
  clientId: string;
  clientSecret: string;
  username: string;
  password: string;
}

export interface SyncResult {
  success: boolean;
  logId?: string;
  productsSynced?: number;
  variationsSynced?: number;
  durationMs?: number;
  error?: string;
}

function getSmoothSaleConfig(): SmoothSaleConfig {
  const clientSecret = (process.env.SMOOTH_SALE_CLIENT_SECRET || "").trim();
  const password = (process.env.SMOOTH_SALE_PASSWORD || "").trim();
  const baseUrl = (process.env.SMOOTH_SALE_BASE_URL || "https://technolake.net/smooth-sale-pos/public").replace(/\/+$/, "");
  const clientId = (process.env.SMOOTH_SALE_CLIENT_ID || "").trim();
  const username = (process.env.SMOOTH_SALE_USERNAME || "").trim();

  if (!clientSecret || !password) {
    throw new Error("[SmoothSale] SMOOTH_SALE_CLIENT_SECRET and SMOOTH_SALE_PASSWORD must be configured in environment variables.");
  }

  return {
    baseUrl,
    clientId,
    clientSecret,
    username,
    password,
  };
}

function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^\w\-]+/g, "")
    .replace(/\-\-+/g, "-")
    .replace(/^-+/, "")
    .replace(/-+$/, "");
}

export function cleanDescriptionText(raw: string | null | undefined): string {
  if (!raw) return "";
  let text = raw
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/\s+/g, " ")
    .trim();

  // Strip automatic POS sync boilerplates
  text = text
    .replace(/Certified product directly (synchronized|synced) from Smooth Sale POS\.?\s*(SKU:?\s*[\w-]+)?/gi, "")
    .replace(/Certified product directly (synchronized|synced) from POS inventory\.?\s*(SKU:?\s*[\w-]+)?/gi, "")
    .replace(/Certified product directly (synchronized|synced) from[^\.]*\.?/gi, "")
    .replace(/\bSmooth Sale POS\b/gi, "")
    .replace(/SKU:\s*[\w-]+\s*$/gi, "")
    .trim();

  return text;
}

export class SmoothSaleService {
  /**
   * Retrieves an active OAuth2 access token from database cache or authenticates with Smooth Sale POS if missing/expired.
   */
  static async getOrFetchAccessToken(forceRefresh = false): Promise<string> {
    const db = getDrizzleDb();

    const config = getSmoothSaleConfig();
    const provider = "smooth_sale_pos";

    if (!forceRefresh) {
      const existingTokens = await db
        .select()
        .from(posAuthTokens)
        .where(eq(posAuthTokens.provider, provider))
        .limit(1);

      if (existingTokens.length > 0) {
        const token = existingTokens[0];
        // 5-minute safety margin before expiry
        const bufferMs = 5 * 60 * 1000;
        if (new Date(token.expiresAt).getTime() - bufferMs > Date.now()) {
          return token.accessToken;
        }
      }
    }

    // Authenticate via OAuth2 password grant flow
    const tokenEndpoint = `${config.baseUrl}/oauth/token`;
    console.log(`[SMOOTH SALE POS] Requesting OAuth2 token from: ${tokenEndpoint}`);

    const params = new URLSearchParams({
      grant_type: "password",
      client_id: config.clientId,
      client_secret: config.clientSecret,
      username: config.username,
      password: config.password,
    });

    const response = await fetch(tokenEndpoint, {
      method: "POST",
      headers: {
        "Accept": "application/json",
        "Content-Type": "application/x-www-form-urlencoded",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36 MqulimaIntegration/1.0",
      },
      body: params.toString(),
    });

    const text = await response.text();
    let data: any;
    try {
      data = JSON.parse(text);
    } catch (e) {
      throw new Error(`Invalid non-JSON token response from Smooth Sale POS (${response.status}): ${text.slice(0, 200)}`);
    }

    if (!response.ok || !data.access_token) {
      const errMsg = data?.message || data?.error_description || data?.error || text;
      throw new Error(`Smooth Sale POS OAuth2 Authentication Failed (${response.status}): ${errMsg}`);
    }

    const accessToken = data.access_token as string;
    const expiresIn = Number(data.expires_in) || 31536000; // Default 1 year if not specified
    const expiresAt = new Date(Date.now() + expiresIn * 1000);

    // Persist token in database for caching across application restarts
    await db
      .insert(posAuthTokens)
      .values({
        id: crypto.randomUUID(),
        provider,
        accessToken,
        tokenType: data.token_type || "Bearer",
        expiresIn,
        expiresAt,
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: posAuthTokens.provider,
        set: {
          accessToken,
          tokenType: data.token_type || "Bearer",
          expiresIn,
          expiresAt,
          updatedAt: new Date(),
        },
      });

    console.log(`[SMOOTH SALE POS] OAuth2 token cached successfully. Expires in ${Math.round(expiresIn / 86400)} days.`);
    return accessToken;
  }

  /**
   * Fetches raw product list from Smooth Sale POS.
   */
  static async fetchProducts(accessToken: string, perPage = 500): Promise<any[]> {
    const config = getSmoothSaleConfig();
    const url = `${config.baseUrl}/connector/api/product?type=product&per_page=${perPage}`;

    console.log(`[SMOOTH SALE POS] Fetching products from: ${url}`);
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Accept": "application/json",
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": "application/x-www-form-urlencoded",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36 MqulimaIntegration/1.0",
      },
    });

    const text = await response.text();
    let data: any;
    try {
      data = JSON.parse(text);
    } catch (e) {
      throw new Error(`Failed to parse product response from POS (${response.status}): ${text.slice(0, 200)}`);
    }

    if (response.status === 401) {
      // Clear token cache on 401 Unauthorized
      const db = getDrizzleDb();
      await db.delete(posAuthTokens).where(eq(posAuthTokens.provider, "smooth_sale_pos"));
      throw new Error("Smooth Sale POS token expired or unauthorized. Token cache cleared.");
    }

    if (!response.ok) {
      throw new Error(`Failed to fetch products from POS (${response.status}): ${data?.message || text}`);
    }

    // Support nested data structures: data array or { data: [...] } or direct array
    if (Array.isArray(data)) return data;
    if (data && Array.isArray(data.data)) return data.data;
    if (data && typeof data === "object") return Object.values(data);
    return [];
  }

  /**
   * Fetches variations for a specific product ID from Smooth Sale POS.
   */
  static async fetchVariations(accessToken: string, productId: string | number): Promise<any[]> {
    const config = getSmoothSaleConfig();
    const url = `${config.baseUrl}/connector/api/variation/${productId}`;

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Accept": "application/json",
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": "application/x-www-form-urlencoded",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36 MqulimaIntegration/1.0",
      },
    });

    const text = await response.text();
    if (!response.ok) {
      console.warn(`[SMOOTH SALE POS] Variation fetch warning for product ${productId} (${response.status}): ${text.slice(0, 150)}`);
      return [];
    }

    try {
      const data = JSON.parse(text);
      if (Array.isArray(data)) return data;
      if (data && Array.isArray(data.data)) return data.data;
      if (data && typeof data === "object") {
        if (data.product_variations && Array.isArray(data.product_variations)) return data.product_variations;
        if (data.variations && Array.isArray(data.variations)) return data.variations;
        return Object.values(data);
      }
      return [];
    } catch (e) {
      return [];
    }
  }

  /**
   * Executes full product & variation synchronization from Smooth Sale POS into Mqulima DB.
   */
  static async syncSmoothSaleProducts(options: { syncType?: string } = {}): Promise<SyncResult> {
    const startTime = Date.now();
    const db = getDrizzleDb();
    const syncType = options.syncType || "smooth_sale_cron";
    const logId = crypto.randomUUID();

    // 1. Log start of sync job
    await db.insert(posSyncLogs).values({
      id: logId,
      syncType,
      status: "in_progress",
      productsSynced: 0,
      variationsSynced: 0,
      startedAt: new Date(),
    });

    try {
      // 2. Get active OAuth2 token
      const token = await this.getOrFetchAccessToken();

      // 3. Fetch products from POS
      const posProducts = await this.fetchProducts(token, 500);
      console.log(`[SMOOTH SALE POS] Received ${posProducts.length} product(s) from POS.`);

      let productsSyncedCount = 0;
      let variationsSyncedCount = 0;

      for (const posProduct of posProducts) {
        if (!posProduct || typeof posProduct !== "object") continue;

        const extProductId = String(posProduct.id || posProduct.product_id || posProduct.sku || "").trim();
        const productName = String(posProduct.name || posProduct.product_name || "Unnamed POS Product").trim();
        if (!productName) continue;

        const rawSlug = posProduct.sku ? slugify(posProduct.sku) : slugify(productName);
        const rawDesc = posProduct.product_description || posProduct.description || "";
        const description = cleanDescriptionText(rawDesc) || "Certified genuine agricultural input for farm use.";
        
        let imageUrls: string[] = [];
        if (posProduct.image_url && typeof posProduct.image_url === "string" && !posProduct.image_url.includes("default.png")) {
          imageUrls.push(posProduct.image_url);
        }
        if (posProduct.media && Array.isArray(posProduct.media)) {
          const validMedia = posProduct.media
            .map((m: any) => m.display_url || m.url || m.path)
            .filter((u: any) => u && typeof u === "string" && !u.includes("default.png"));
          imageUrls.push(...validMedia);
        }
        if (imageUrls.length === 0) {
          imageUrls = ["https://technolake.net/smooth-sale-pos/public/img/default.png"];
        }

        let categoryName = "Inputs & Agrochemicals";
        if (typeof posProduct.category === "string" && posProduct.category && !posProduct.category.includes("[object")) {
          categoryName = posProduct.category;
        } else if (typeof posProduct.category_name === "string" && posProduct.category_name) {
          categoryName = posProduct.category_name;
        } else if (typeof posProduct.type === "string" && posProduct.type && posProduct.type !== "single") {
          categoryName = posProduct.type;
        }

        const rawBrand = posProduct.brand || posProduct.brand_name;
        const brand = (rawBrand && !rawBrand.toLowerCase().includes("smooth sale")) ? rawBrand : (categoryName || "Verified Input");

        let unit = "Piece";
        if (posProduct.unit && typeof posProduct.unit === "object") {
          unit = posProduct.unit.short_name || posProduct.unit.actual_name || "Piece";
        } else if (typeof posProduct.unit === "string" && posProduct.unit && !posProduct.unit.includes("[object")) {
          unit = posProduct.unit;
        } else if (typeof posProduct.unit_name === "string" && posProduct.unit_name) {
          unit = posProduct.unit_name;
        }

        // Check existing product in Mqulima database by externalProductId or name/slug
        const existingList = await db
          .select()
          .from(products)
          .where(
            extProductId 
              ? eq(products.externalProductId, extProductId)
              : sql`LOWER(${products.name}) = LOWER(${productName})`
          )
          .limit(1);

        let localProductId: string;

        if (existingList.length > 0) {
          localProductId = existingList[0].id;
          await db
            .update(products)
            .set({
              name: productName,
              externalProductId: extProductId || existingList[0].externalProductId,
              description,
              imageUrls,
              brand,
              unit,
              subcategory: categoryName,
              updatedAt: new Date(),
            })
            .where(eq(products.id, localProductId));
        } else {
          localProductId = crypto.randomUUID();
          const targetSlug = `${rawSlug}-${Math.floor(1000 + Math.random() * 9000)}`;

          await db.insert(products).values({
            id: localProductId,
            name: productName,
            slug: targetSlug,
            externalProductId: extProductId,
            basePrice: "0.00",
            stockQty: 0,
            status: "active",
            description,
            imageUrls,
            brand,
            seller: "Certified Agrovet Partner",
            county: "Kenya",
            unit,
            shopType: categoryName,
            subcategory: categoryName,
            isFeatured: false,
            avgRating: "5.00",
            ratingCount: 1,
            createdAt: new Date(),
            updatedAt: new Date(),
          });
        }
        productsSyncedCount++;

        // 4. Extract or fetch variations for this product
        if (extProductId) {
          let rawVariations: any[] = [];
          if (posProduct.product_variations && Array.isArray(posProduct.product_variations)) {
            for (const group of posProduct.product_variations) {
              if (group && Array.isArray(group.variations)) {
                rawVariations.push(...group.variations);
              }
            }
          }

          if (rawVariations.length === 0) {
            try {
              rawVariations = await this.fetchVariations(token, extProductId);
            } catch (err: any) {
              console.warn(`[SMOOTH SALE POS] Variation fetch fallback warning for product ${extProductId}: ${err?.message || err}`);
            }
          }
          let totalProductStock = 0;
          let minPrice = Infinity;

          for (const varItem of rawVariations) {
            if (!varItem || typeof varItem !== "object") continue;

            const extVarId = String(varItem.id || varItem.variation_id || varItem.sku || `${extProductId}-v`).trim();
            const sku = varItem.sku || varItem.sub_sku || `${extProductId}-${extVarId}`;
            const variantLabel = varItem.name || varItem.variant_label || varItem.value || varItem.variation_value || "Standard";
            const priceVal = Number(varItem.sell_price_inc_tax || varItem.default_sell_price || varItem.price || posProduct.price || 0);
            
            let stockVal = 0;
            if (varItem.variation_location_details && Array.isArray(varItem.variation_location_details)) {
              stockVal = varItem.variation_location_details.reduce((acc: number, loc: any) => acc + (Number(loc.qty_available) || 0), 0);
            } else {
              stockVal = Number(varItem.qty_available ?? varItem.stock_quantity ?? varItem.stock ?? posProduct.stock_quantity ?? 0);
            }

            let locationName = "Main Store Inventory";
            if (varItem.variation_location_details && varItem.variation_location_details.length > 0) {
              locationName = varItem.variation_location_details.map((l: any) => l.name || l.location_name).filter(Boolean).join(", ") || locationName;
            } else if (varItem.location_name || varItem.location) {
              locationName = String(varItem.location_name || varItem.location);
            }

            if (priceVal < minPrice && priceVal > 0) minPrice = priceVal;
            totalProductStock += stockVal;

            // Upsert product variant into product_variants table
            const existingVars = await db
              .select()
              .from(productVariants)
              .where(
                extVarId 
                  ? eq(productVariants.externalVariationId, extVarId)
                  : and(eq(productVariants.productId, localProductId), eq(productVariants.sku, sku))
              )
              .limit(1);

            if (existingVars.length > 0) {
              await db
                .update(productVariants)
                .set({
                  variantLabel,
                  price: priceVal.toFixed(2),
                  stockQty: stockVal,
                  sku,
                  location: locationName,
                  updatedAt: new Date(),
                })
                .where(eq(productVariants.id, existingVars[0].id));
            } else {
              await db.insert(productVariants).values({
                id: crypto.randomUUID(),
                productId: localProductId,
                variantLabel,
                price: priceVal.toFixed(2),
                stockQty: stockVal,
                sku,
                externalVariationId: extVarId,
                location: locationName,
                createdAt: new Date(),
                updatedAt: new Date(),
              });
            }
            variationsSyncedCount++;
          }

          // Update product basePrice, aggregate stockQty, and status
          const finalPrice = minPrice !== Infinity ? minPrice.toFixed(2) : Number(posProduct.price || 0).toFixed(2);

          await db
            .update(products)
            .set({
              basePrice: finalPrice,
              stockQty: totalProductStock,
              status: "active",
              updatedAt: new Date(),
            })
            .where(eq(products.id, localProductId));

        }
      }

      const durationMs = Date.now() - startTime;
      console.log(`[SMOOTH SALE POS] Sync completed cleanly in ${durationMs}ms. Products: ${productsSyncedCount}, Variations: ${variationsSyncedCount}`);

      // 5. Update sync log entry to success
      await db
        .update(posSyncLogs)
        .set({
          status: "success",
          productsSynced: productsSyncedCount,
          variationsSynced: variationsSyncedCount,
          completedAt: new Date(),
        })
        .where(eq(posSyncLogs.id, logId));

      return {
        success: true,
        logId,
        productsSynced: productsSyncedCount,
        variationsSynced: variationsSyncedCount,
        durationMs,
      };
    } catch (err: any) {
      const durationMs = Date.now() - startTime;
      const errorMsg = err?.message || String(err);
      console.error(`[SMOOTH SALE POS] Sync failed after ${durationMs}ms:`, err);

      await db
        .update(posSyncLogs)
        .set({
          status: "failed",
          errorMessage: errorMsg,
          completedAt: new Date(),
        })
        .where(eq(posSyncLogs.id, logId));

      return {
        success: false,
        logId,
        durationMs,
        error: errorMsg,
      };
    }
  }

  /**
   * Returns recent sync log records from pos_sync_logs table.
   */
  static async getRecentSyncLogs(limit = 20): Promise<any[]> {
    const db = getDrizzleDb();
    return db
      .select()
      .from(posSyncLogs)
      .orderBy(desc(posSyncLogs.startedAt))
      .limit(limit);
  }
}
