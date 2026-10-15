import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { type ShopProduct, mapToNewTaxonomy, cleanDescriptionText } from "../shop-data";
import { sendOrderConfirmedSms } from "../order-sms.server";

/**
 * Determines the category-specific Mqulima placeholder image for a product.
 * All placeholders are internal assets served from /images/placeholders/*.
 * No external stock images are used.
 */
function getCategoryPlaceholder(p: any): string {
  const tax = mapToNewTaxonomy(p);
  const cat = (tax.category || "").toLowerCase();
  const nameLower = (p.name || "").toLowerCase();

  // Animal Farming / Veterinary / Livestock
  if (
    cat.includes("animal") ||
    nameLower.includes("vet") || nameLower.includes("deworm") ||
    nameLower.includes("lick") || nameLower.includes("kupe") ||
    nameLower.includes("twigalick") || nameLower.includes("salve") ||
    nameLower.includes("milking") || nameLower.includes("pour-on") ||
    nameLower.includes("pour on") || nameLower.includes("nilzan") ||
    nameLower.includes("norbrook") || nameLower.includes("coopers") ||
    nameLower.includes("ex-kupe")
  ) {
    return "/images/placeholders/livestock.webp";
  }

  // Fertilizers / Plant Growth
  if (
    cat.includes("fertilizer") || cat.includes("growth") || cat.includes("booster") ||
    nameLower.includes("fertilizer") || nameLower.includes("npk") ||
    nameLower.includes("dap") || nameLower.includes("can ") || nameLower.includes("urea") ||
    nameLower.includes("foliar") || nameLower.includes("biosol") ||
    nameLower.includes("algreen") || nameLower.includes("diamond") ||
    nameLower.includes("unizyme") || nameLower.includes("cytomone") ||
    nameLower.includes("unigrow") || nameLower.includes("planta")
  ) {
    return "/images/placeholders/fertilizer.webp";
  }

  // Seeds & Seedlings
  if (
    cat.includes("seed") ||
    nameLower.includes("seed") || nameLower.includes("spinach") ||
    nameLower.includes("tomato") || nameLower.includes("maize") ||
    nameLower.includes("bean") || nameLower.includes("onion") ||
    nameLower.includes("cabbage") || nameLower.includes("kale") ||
    nameLower.includes("fordhook") || nameLower.includes("rio grande")
  ) {
    return "/images/placeholders/seeds.webp";
  }

  // Farm Equipment / Tools
  if (
    cat.includes("equipment") || cat.includes("tools") ||
    nameLower.includes("knapsack") || nameLower.includes("sprayer") ||
    nameLower.includes("pump") || nameLower.includes("nozzle") ||
    nameLower.includes("nozle") || nameLower.includes("hose") ||
    nameLower.includes("pipe") || nameLower.includes("trigger") ||
    nameLower.includes("panga") || nameLower.includes("hand spray")
  ) {
    return "/images/placeholders/farm_tools.webp";
  }

  // Crop Protection (Agrochemicals) — default for most POS products
  return "/images/placeholders/agrochemical.webp";
}

/**
 * Image resolution priority:
 * 1. Real Smooth Sale POS uploaded image (/uploads/img/...)
 * 2. Exact trade-name verified photo (for specific brand SKUs in DB)
 * 3. Category-specific Mqulima internal placeholder
 * 4. Generic Mqulima leaf placeholder
 *
 * NO external stock images. NO Unsplash. NO random assignment.
 */
export function resolveFastProductImage(p: any): string {
  const images = (Array.isArray(p.image_urls) && p.image_urls.length > 0)
    ? p.image_urls
    : ((Array.isArray(p.imageUrls) && p.imageUrls.length > 0) ? p.imageUrls : []);

  const firstImg = images[0] || "";

  // PRIORITY 1: Valid POS-uploaded image
  const isPosUpload =
    firstImg &&
    typeof firstImg === "string" &&
    !firstImg.includes("default.png") &&
    !firstImg.includes("/placeholder") &&
    !firstImg.includes("dummy") &&
    !firstImg.includes("unsplash") &&
    !firstImg.includes("pexels") &&
    (firstImg.startsWith("https://") || firstImg.startsWith("http://") || firstImg.startsWith("/uploads/"));

  if (isPosUpload) {
    return firstImg;
  }

  const nameLower = (p.name || "").toLowerCase();

  // PRIORITY 2: Exact trade-name verified photos (specific brand-to-image mapping)
  if (nameLower.includes("duduthrin")) {
    return "/images/services/crop_production.webp";
  }
  if (nameLower.includes("lambda")) {
    return "/images/products/lambda-cyhalothrin.webp";
  }
  if (nameLower.includes("pembe")) {
    return "/images/products/actellic-gold-dust.webp";
  }
  if (nameLower.includes("unga feed") || nameLower.includes("unga layer") || nameLower.includes("unga chick")) {
    return "/images/products/roundup-turbo.webp";
  }
  if (nameLower.includes("knapsack") && !nameLower.includes("hand")) {
    return "/images/services/machinery_rental.webp";
  }

  // PRIORITY 3: Category-specific Mqulima internal placeholder
  return getCategoryPlaceholder(p);
}



function mapDbProduct(p: any): ShopProduct {
  const tax = mapToNewTaxonomy(p);
  const categoryName = tax.category;
  const subcategoryName = tax.subcategory;
  const primaryImage = resolveFastProductImage(p);

  const rawDesc = cleanDescriptionText(p.brief_description || p.description) || "Certified genuine agricultural input.";
  const cleanDesc = rawDesc.length > 80 ? rawDesc.slice(0, 77) + "..." : rawDesc;
  const cleanUnit = (p.unit && !p.unit.includes("[object")) ? p.unit : "Piece";

  return {
    id: p.id,
    name: p.name,
    slug: p.slug || p.id,
    description: cleanDesc,
    briefDescription: cleanDesc,
    price: Number(p.base_price || p.basePrice || 0),
    originalPrice: p.original_price ? Number(p.original_price) : null,
    stock: p.status === 'draft' ? 0 : Math.max(0, Number(p.stock_qty ?? p.stockQty ?? 0)),
    image: primaryImage,
    category: categoryName,
    badge: p.badge || (p.is_featured || p.isFeatured ? "Featured" : ""),
    brand: p.brand || "Mqulima Direct",
    seller: p.seller || "Mqulima Verified",
    county: p.county || "Kenya",
    organic: !!p.organic,
    verifiedSeller: true,
    unit: cleanUnit,
    sellerScore: p.seller_score || 98,
    condition: p.condition || "New",
    shopType: "Agrovet",
    field: categoryName,
    subcategory: subcategoryName,
    rating: Number(p.avg_rating || 4.8),
    reviewsCount: Number(p.rating_count || 14),
    isFeatured: !!(p.is_featured || p.isFeatured),
    externalProductId: p.external_product_id || p.externalProductId
  };
}

export const getShopFields = createServerFn({ method: "GET" })
  .handler(async () => {
    const { getDb } = await import("../db.server");
    const sql = getDb();
    const active = "active";
    const fields = await sql`
      SELECT sf.*, 
        COUNT(DISTINCT p.id)::int as product_count
      FROM shop_fields sf
      LEFT JOIN products p ON p.field_id = sf.id 
        AND p.status = ${active} AND p.deleted_at IS NULL AND p.external_product_id IS NOT NULL
      GROUP BY sf.id
      ORDER BY sf.sort_order
    `;
    return fields.map((f: any) => ({
      id: f.id,
      name: f.name,
      slug: f.slug,
      shopType: f.shop_type === "agrovet" ? "Agrovet" : (f.shop_type === "specialist" ? "Specialist Shop" : "For Retailers"),
      icon: f.icon || "ti-plant-2",
      productCount: f.product_count || 0
    }));
  });

export const getCategoriesByField = createServerFn({ method: "GET" })
  .inputValidator(z.string())
  .handler(async ({ data: fieldId }) => {
    const { getDb } = await import("../db.server");
    const sql = getDb();
    const active = "active";
    const categories = await sql`
      SELECT sc.*,
        COUNT(DISTINCT p.id)::int as product_count
      FROM shop_categories sc
      LEFT JOIN products p ON p.category_id = sc.id 
        AND p.status = ${active} AND p.deleted_at IS NULL AND p.external_product_id IS NOT NULL
      WHERE sc.field_id = ${fieldId}
      GROUP BY sc.id
      ORDER BY sc.sort_order
    `;
    return categories.map((c: any) => ({
      id: c.id,
      fieldId: c.field_id,
      name: c.name,
      slug: c.slug,
      productCount: c.product_count || 0
    }));
  });

export const getSubcategoriesByCategory = createServerFn({ method: "GET" })
  .inputValidator(z.string())
  .handler(async ({ data: categoryId }) => {
    const { getDb } = await import("../db.server");
    const sql = getDb();
    const active = "active";
    const subcategories = await sql`
      SELECT ss.*,
        COUNT(DISTINCT p.id)::int as product_count
      FROM shop_subcategories ss
      LEFT JOIN products p ON p.subcategory_id = ss.id 
        AND p.status = ${active} AND p.deleted_at IS NULL AND p.external_product_id IS NOT NULL
      WHERE ss.category_id = ${categoryId}
      GROUP BY ss.id
      ORDER BY ss.sort_order
    `;
    return subcategories.map((s: any) => ({
      id: s.id,
      categoryId: s.category_id,
      name: s.name,
      slug: s.slug,
      productCount: s.product_count || 0
    }));
  });

const ProductsInputSchema = z.object({
  fieldId: z.string().optional(),
  categoryId: z.string().optional(),
  subcategoryId: z.string().optional(),
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(1000).optional().default(1000),
  shopType: z.string().optional(),
  q: z.string().optional(),
  sort: z.string().optional()
});

// PERF: stale-while-revalidate cache. Do not revert to hard expiry — see PERFORMANCE.md.
const productsCache = new Map<string, { data: any; expiry: number; staleUntil: number }>();
const productsInflight = new Map<string, Promise<any>>();
const PRODUCTS_CACHE_TTL = 60 * 1000; // fresh for 60s
const PRODUCTS_CACHE_STALE = 10 * 60 * 1000; // may be served stale for 10 min while refreshing

export function invalidateProductsCache() {
  productsCache.clear();
}

export const getProducts = createServerFn({ method: "GET" })
  .inputValidator((val: any) => {
    const payload = val?.data || val || {};
    return ProductsInputSchema.parse(payload);
  })
  .handler(async ({ data }) => {
    const cacheKey = JSON.stringify(data || {});
    const now = Date.now();
    const cached = productsCache.get(cacheKey);
    if (cached && cached.expiry > now) {
      return cached.data;
    }

    const refresh = () => {
      let p = productsInflight.get(cacheKey);
      if (!p) {
        p = loadProductsUncached(data)
          .then((result) => {
            const t = Date.now();
            productsCache.set(cacheKey, { data: result, expiry: t + PRODUCTS_CACHE_TTL, staleUntil: t + PRODUCTS_CACHE_STALE });
            if (productsCache.size > 150) {
              const first = productsCache.keys().next().value;
              if (first) productsCache.delete(first);
            }
            return result;
          })
          .finally(() => productsInflight.delete(cacheKey));
        productsInflight.set(cacheKey, p);
      }
      return p;
    };

    if (cached && cached.staleUntil > now) {
      refresh().catch((e) => console.error("[getProducts] background refresh failed:", e));
      return cached.data;
    }
    return refresh();
  });

async function loadProductsUncached(data: z.infer<typeof ProductsInputSchema>) {
    const { fieldId, categoryId, subcategoryId, page = 1, limit = 1000, shopType, q, sort } = data;
    const { getDb } = await import("../db.server");
    const sql = getDb();
    const offset = (page - 1) * limit;
    const active = "active";

    let whereClause = sql`p.status = ${active} AND p.deleted_at IS NULL AND p.external_product_id IS NOT NULL`;

    if (fieldId) {
      whereClause = sql`${whereClause} AND p.field_id = ${fieldId}`;
    }
    if (categoryId && categoryId !== "All") {
      whereClause = sql`${whereClause} AND (p.field ILIKE ${categoryId} OR p.subcategory ILIKE ${categoryId} OR p.category_id = ${categoryId} OR sc.name ILIKE ${categoryId} OR pc.name ILIKE ${categoryId})`;
    }
    if (subcategoryId && subcategoryId !== "All") {
      whereClause = sql`${whereClause} AND (p.subcategory ILIKE ${subcategoryId} OR p.subcategory_id = ${subcategoryId} OR ss.name ILIKE ${subcategoryId})`;
    }
    if (q && q.trim()) {
      const searchTerm = `%${q.trim()}%`;
      whereClause = sql`${whereClause} AND (p.name ILIKE ${searchTerm} OR p.description ILIKE ${searchTerm} OR p.brand ILIKE ${searchTerm})`;
    }

    let orderByClause = sql`p.is_featured DESC, (p.stock_qty > 0) DESC, p.created_at DESC`;
    if (sort === "Price Low to High") {
      orderByClause = sql`CASE WHEN p.base_price > 0 THEN 0 ELSE 1 END, p.base_price ASC, p.id`;
    } else if (sort === "Price High to Low") {
      orderByClause = sql`p.base_price DESC, p.id`;
    } else if (sort === "Highest Rated") {
      orderByClause = sql`p.avg_rating DESC, p.id`;
    } else if (sort === "Category") {
      orderByClause = sql`p.field ASC, p.name ASC`;
    }

    const [productsRes, totalCountRes] = await Promise.all([
      sql`
        SELECT p.*, 
               COALESCE(sc.name, pc.name, p.subcategory) AS category_name, 
               sf.name AS field_name, 
               ss.name AS subcategory_name
        FROM products p
        LEFT JOIN shop_fields sf ON p.field_id = sf.id
        LEFT JOIN shop_categories sc ON p.category_id = sc.id
        LEFT JOIN shop_subcategories ss ON p.subcategory_id = ss.id
        LEFT JOIN product_categories pc ON p.category_id = pc.id
        WHERE ${whereClause}
        ORDER BY ${orderByClause}
        LIMIT ${limit} OFFSET ${offset}
      `,
      sql`
        SELECT COUNT(*)::int as count
        FROM products p
        LEFT JOIN shop_categories sc ON p.category_id = sc.id
        LEFT JOIN product_categories pc ON p.category_id = pc.id
        WHERE ${whereClause}
      `
    ]);

    const total = totalCountRes[0]?.count || 0;
    const totalPages = Math.ceil(total / limit) || 1;

    const result = {
      products: productsRes.map(mapDbProduct),
      total,
      page,
      totalPages
    };

    return result;
}

const CreateShopOrderSchema = z.object({
  items: z.array(z.object({
    id: z.string(),
    name: z.string().optional(),
    price: z.number().optional(),
    quantity: z.number().int().positive("Item quantity must be a positive integer"),
    image: z.string().optional()
  })).min(1, "Order must contain at least one item"),
  subtotal: z.number().optional(),
  total: z.number().optional(),
  deliveryFee: z.number().optional().default(0),
  couponCode: z.string().optional(),
  fullName: z.string().min(1, "Full name is required"),
  phone: z.string().min(1, "Phone number is required"),
  email: z.string().optional(),
  nationalId: z.string().optional().default("N/A"),
  county: z.string().min(1, "County is required"),
  town: z.string().min(1, "Town is required"),
  village: z.string().optional(),
  instructions: z.string().optional(),
  paymentMethod: z.string(),
  shippingOption: z.string().optional().default("standard"),
  checkoutChannel: z.enum(["website", "whatsapp"]).optional().default("website"),
  csrfToken: z.string().min(1, "CSRF token is required")
});

export const createShopOrder = createServerFn({ method: "POST" })
  .inputValidator((val: unknown) => CreateShopOrderSchema.parse(val || {}))
  .handler(async ({ data }) => {
    try {
      const {
        items,
        couponCode,
        fullName,
        phone,
        nationalId = "N/A",
        county,
        town,
        village,
        instructions,
        paymentMethod,
        shippingOption = "standard",
        checkoutChannel = "website",
        csrfToken
      } = data;

      // 1. CSRF Token Validation
      const { validateCsrfToken } = await import("../csrf-verify.server");
      validateCsrfToken(csrfToken);

      // 2. Strict Authentication Requirement (No unauthenticated purchases or account spoofing)
      const { getCurrentUser } = await import("../auth-server");
      const user = await getCurrentUser();
      if (!user || !user.id) {
        return {
          success: false,
          error: "Authentication required to place an order. Please sign in or create a free Mqulima account to complete your purchase."
        };
      }
      const userId = user.id;

      const { getDb } = await import("../db.server");
      const sql = getDb();

      // 3. Format delivery address
      const deliveryAddress = `Name: ${fullName}\nPhone: ${phone}\nID: ${nationalId}\nCounty: ${county}\nTown: ${town}${village ? `\nVillage: ${village}` : ""}`;

      // Map paymentMethod to payment_method_enum
      let dbPaymentMethod: "mpesa" | "bank_transfer" | "card" | "gpay" | "ncba" | "paystack" | "airtel_money" = "mpesa";
      if (paymentMethod === "card" || paymentMethod === "visa" || paymentMethod === "mastercard") dbPaymentMethod = "card";
      else if (paymentMethod === "airtel" || paymentMethod === "airtel_money") dbPaymentMethod = "airtel_money";
      else if (paymentMethod === "mpesa" || paymentMethod === "mpesa_till") dbPaymentMethod = "mpesa";
      else if (paymentMethod === "paystack") dbPaymentMethod = "paystack";
      else if (paymentMethod === "ncba") dbPaymentMethod = "ncba";
      else if (paymentMethod === "bank" || paymentMethod === "bank_transfer" || paymentMethod === "pesalink") dbPaymentMethod = "bank_transfer";
      else if (paymentMethod === "gpay") dbPaymentMethod = "gpay";

      // 4. Atomic transaction: Verify products, calculate server prices, check inventory, insert order
      let orderId: string = "";
      let finalSubtotal: number = 0;
      let finalTotal: number = 0;
      let savedItems: any[] = [];

      await sql.begin(async (tx: any) => {
        // Query active products from PostgreSQL to establish authoritative prices and inventory
        const itemIds = items.map((i) => i.id);
        const dbProducts = await tx`
          SELECT id, name, base_price, stock_qty, status, deleted_at
          FROM products
          WHERE id = ANY(${itemIds})
          FOR UPDATE
        `;

        const productMap = new Map<string, any>(dbProducts.map((p: any) => [p.id, p]));

        // Validate each item
        let authoritativeSubtotal = 0;
        savedItems = items.map((item) => {
          const dbProd = productMap.get(item.id);
          if (!dbProd || dbProd.deleted_at !== null || dbProd.status !== "active") {
            throw new Error(`Product "${item.name || item.id}" is unavailable or inactive in catalog.`);
          }
          if (dbProd.stock_qty < item.quantity) {
            throw new Error(`Insufficient stock for "${dbProd.name}". Available: ${dbProd.stock_qty}, Requested: ${item.quantity}`);
          }

          const unitPrice = parseFloat(dbProd.base_price);
          const lineTotal = unitPrice * item.quantity;
          authoritativeSubtotal += lineTotal;

          return {
            id: dbProd.id,
            productId: dbProd.id,
            name: dbProd.name,
            price: unitPrice,
            quantity: item.quantity,
            lineTotal,
            image: item.image || "/placeholder-product.png"
          };
        });

        // Server-side coupon discount calculation
        let discountPct = 0;
        const normalizedCoupon = (couponCode || "").trim().toUpperCase();
        if (normalizedCoupon === "MUSEMBI10" || normalizedCoupon === "SHULAMITE10") {
          discountPct = 0.10;
        } else if (normalizedCoupon === "WELCOME5") {
          discountPct = 0.05;
        }
        const discountAmount = Math.round(authoritativeSubtotal * discountPct);

        // Server-side shipping fee calculation
        let shippingFee = 350;
        if (shippingOption === "express") shippingFee = 600;
        else if (shippingOption === "pickup" || shippingOption === "free") shippingFee = 0;
        else shippingFee = 350;

        // Authoritative order total
        const authoritativeTotal = Math.max(0, authoritativeSubtotal - discountAmount + shippingFee);
        finalSubtotal = authoritativeSubtotal;
        finalTotal = authoritativeTotal;

        const [orderRes] = await tx`
          INSERT INTO orders (
            user_id,
            items,
            subtotal,
            total,
            status,
            payment_method,
            payment_status,
            delivery_address,
            checkout_channel,
            notes
          )
          VALUES (
            ${userId},
            ${JSON.stringify(savedItems)}::jsonb,
            ${authoritativeSubtotal},
            ${authoritativeTotal},
            'pending',
            ${dbPaymentMethod},
            'pending',
            ${deliveryAddress},
            ${checkoutChannel === "whatsapp" ? "whatsapp" : "website"},
            ${instructions || null}
          )
          RETURNING id
        `;

        orderId = orderRes.id;

        // Insert into order_items table and atomically decrement product stock
        for (const item of savedItems) {
          await tx`
            INSERT INTO order_items (order_id, product_id, product_name, quantity, unit_price)
            VALUES (${orderId}, ${item.id}, ${item.name}, ${item.quantity}, ${item.price})
          `;

          await tx`
            UPDATE products
            SET stock_qty = GREATEST(0, stock_qty - ${item.quantity}), updated_at = NOW()
            WHERE id = ${item.id}
          `;
        }

        // Insert in-app notification for logged-in user with full purchase details
        if (userId) {
          const itemSummaries = savedItems.map((i: any) => `${i.quantity}x ${i.name}`).join(", ");
          const shortOrderId = orderId.slice(0, 8).toUpperCase();
          const notifPayload = {
            tag: "Order Update",
            tagClass: "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
            title: `Order #${shortOrderId} Placed (KES ${finalTotal.toLocaleString()}) 📦`,
            desc: `Purchased: ${itemSummaries}. Total: KES ${finalTotal.toLocaleString()}. Shipping to ${town}, ${county} (${phone}). Payment Method: ${paymentMethod.toUpperCase()}`,
            details: {
              orderId,
              shortOrderId,
              items: savedItems,
              subtotal: finalSubtotal,
              total: finalTotal,
              fullName,
              phone,
              nationalId,
              county,
              town,
              village,
              instructions,
              paymentMethod,
              shippingOption,
              deliveryAddress,
              placedAt: new Date().toISOString()
            },
            time: "Just now",
            link: "/shop"
          };

          await tx`
            INSERT INTO notifications (user_id, type, payload)
            VALUES (${userId}, 'product_purchase', ${JSON.stringify(notifPayload)}::jsonb)
          `;
        }
      });

      // 5. Write Audit Log
      const { writeAuditLog } = await import("../audit.server");
      await writeAuditLog({
        actorId: userId || "guest-shopper",
        action: "order.created",
        entityType: "order",
        entityId: orderId,
        diff: { subtotal: finalSubtotal, total: finalTotal, paymentMethod, shippingOption }
      });

      // 6. Fire Order Confirmation SMS for WhatsApp orders ONLY (non-blocking)
      // Website orders receive confirmation SMS exclusively after payment confirmation is recorded.
      if (checkoutChannel === "whatsapp") {
        sendOrderConfirmedSms({
          orderId,
          total: finalTotal,
          items: savedItems,
          customerName: fullName,
          phoneNumber: phone,
          channel: "whatsapp"
        }).catch((err) => console.error("[SHOP ORDER] WhatsApp Order SMS background dispatch error:", err));
      }

      // Invalidate cache so stock counts and order deductions are fresh
      invalidateProductsCache();

      return {
        success: true,
        orderId,
        subtotal: finalSubtotal,
        total: finalTotal
      };
    } catch (err: any) {
      console.error("[CREATE SHOP ORDER ERROR]:", err);
      return {
        success: false,
        error: err?.message || "Failed to create order due to a server error."
      };
    }
  });
