import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { type ShopProduct } from "../shop-data";

function mapDbProduct(p: any): ShopProduct {
  const images = (Array.isArray(p.image_urls) && p.image_urls.length > 0)
    ? p.image_urls
    : ((Array.isArray(p.imageUrls) && p.imageUrls.length > 0) ? p.imageUrls : []);

  const defaultCategoryImages: Record<string, string> = {
    "Seeds & Seedlings": "https://images.unsplash.com/photo-1592417817098-8f3d6eb231fc?w=600&auto=format&fit=crop&q=80",
    "Fertilizers & Soil Health": "https://images.unsplash.com/photo-1628352081506-83c43123ed6d?w=600&auto=format&fit=crop&q=80",
    "Agrochemicals & Crop Protection": "https://images.unsplash.com/photo-1585314062340-f1a5a7c9328d?w=600&auto=format&fit=crop&q=80",
    "Farm Tools & Machinery": "https://images.unsplash.com/photo-1595246140625-573b715d11dc?w=600&auto=format&fit=crop&q=80",
    "Animal Feeds & Veterinary": "https://images.unsplash.com/photo-1548550023-2bdb3c5beed7?w=600&auto=format&fit=crop&q=80",
    "Fresh Farm Produce": "https://images.unsplash.com/photo-1610832958506-aa56368176cf?w=600&auto=format&fit=crop&q=80",
  };

  const categoryName = p.subcategory_name || p.subcategory || p.category_name || p.shopType || "Seeds & Seedlings";
  const primaryImage = (images && images[0]) || defaultCategoryImages[categoryName] || "https://images.unsplash.com/photo-1592417817098-8f3d6eb231fc?w=600&auto=format&fit=crop&q=80";

  return {
    id: p.id,
    name: p.name,
    slug: p.slug || p.id,
    description: p.description || "Certified agricultural input directly from verified distributors with agronomist support.",
    briefDescription: p.brief_description || p.description || "",
    price: Number(p.base_price || p.basePrice || 0),
    originalPrice: p.original_price ? Number(p.original_price) : null,
    stock: (p.status === 'draft') ? 0 : (p.stock_qty || p.stockQty || 999),
    image: primaryImage,
    category: categoryName,
    badge: p.badge || (p.is_featured || p.isFeatured ? "Featured" : ""),
    brand: p.brand || "Mqulima Direct",
    seller: p.seller || "Mqulima Verified",
    county: p.county || "Kenya",
    organic: !!p.organic,
    verifiedSeller: true,
    unit: p.unit || "50kg bag",
    sellerScore: p.seller_score || 98,
    condition: p.condition || "New",
    shopType: "Agrovet",
    field: p.field_name || "Agrovet",
    subcategory: categoryName,
    rating: Number(p.avg_rating || 4.8),
    reviewsCount: Number(p.rating_count || 14),
    isFeatured: !!(p.is_featured || p.isFeatured)
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
        AND p.status = ${active} AND p.deleted_at IS NULL
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
        AND p.status = ${active} AND p.deleted_at IS NULL
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
        AND p.status = ${active} AND p.deleted_at IS NULL
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
  page: z.number().int().positive().optional().default(1),
  limit: z.number().int().positive().optional().default(24),
  shopType: z.string().optional()
});

export const getProducts = createServerFn({ method: "GET" })
  .inputValidator((val: unknown) => ProductsInputSchema.parse(val || {}))
  .handler(async ({ data }) => {
    const { fieldId, categoryId, subcategoryId, page = 1, limit = 24, shopType } = data;
    const { getDb } = await import("../db.server");
    const sql = getDb();
    const offset = (page - 1) * limit;
    const active = "active";

    let whereClause = sql`p.status = ${active} AND p.deleted_at IS NULL`;

    if (fieldId) {
      whereClause = sql`${whereClause} AND p.field_id = ${fieldId}`;
    }
    if (categoryId) {
      whereClause = sql`${whereClause} AND p.category_id = ${categoryId}`;
    }
    if (subcategoryId) {
      whereClause = sql`${whereClause} AND p.subcategory_id = ${subcategoryId}`;
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
        ORDER BY p.is_featured DESC, p.created_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `,
      sql`
        SELECT COUNT(*)::int as count
        FROM products p
        WHERE ${whereClause}
      `
    ]);

    const total = totalCountRes[0]?.count || 0;
    const totalPages = Math.ceil(total / limit) || 1;

    return {
      products: productsRes.map(mapDbProduct),
      total,
      page,
      totalPages
    };
  });

const CreateShopOrderSchema = z.object({
  items: z.array(z.object({
    id: z.string(),
    name: z.string(),
    price: z.number(),
    quantity: z.number(),
    image: z.string().optional()
  })),
  subtotal: z.number(),
  total: z.number(),
  fullName: z.string(),
  phone: z.string(),
  nationalId: z.string(),
  county: z.string(),
  town: z.string(),
  village: z.string().optional(),
  instructions: z.string().optional(),
  paymentMethod: z.string(),
  shippingOption: z.string(),
  csrfToken: z.string()
});

export const createShopOrder = createServerFn({ method: "POST" })
  .inputValidator((val: unknown) => CreateShopOrderSchema.parse(val || {}))
  .handler(async ({ data }) => {
    const {
      items,
      subtotal,
      total,
      fullName,
      phone,
      nationalId,
      county,
      town,
      village,
      instructions,
      paymentMethod,
      shippingOption,
      csrfToken
    } = data;

    // 1. CSRF Token Validation
    const { validateCsrfToken } = await import("../csrf-verify.server");
    validateCsrfToken(csrfToken);

    // 2. Check authentication
    const { getCurrentUser } = await import("../auth-server");
    const user = await getCurrentUser();
    if (!user) {
      throw new Error("Unauthorized");
    }

    const { getDb } = await import("../db.server");
    const sql = getDb();

    // 3. Format delivery address
    const deliveryAddress = `Name: ${fullName}\nPhone: ${phone}\nID: ${nationalId}\nCounty: ${county}\nTown: ${town}${village ? `\nVillage: ${village}` : ""}`;

    // Map paymentMethod to payment_method_enum
    let dbPaymentMethod: "mpesa" | "bank_transfer" | "card" | "gpay" = "mpesa";
    if (paymentMethod === "card") dbPaymentMethod = "card";
    else if (paymentMethod === "bank") dbPaymentMethod = "bank_transfer";
    else if (paymentMethod === "gpay") dbPaymentMethod = "gpay";

    // 4. Atomic transaction for order placement and stock deduction
    let orderId: string = "";
    await sql.begin(async (tx: any) => {
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
          ${user.id},
          ${tx.json(items)},
          ${subtotal},
          ${total},
          'pending',
          ${dbPaymentMethod},
          'pending',
          ${deliveryAddress},
          'website',
          ${instructions || null}
        )
        RETURNING id
      `;

      orderId = orderRes.id;

      // Insert into order_items table and atomically decrement product stock
      for (const item of items) {
        const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(item.id);
        const productId = isUuid ? item.id : null;
        
        await tx`
          INSERT INTO order_items (order_id, product_id, product_name, quantity, unit_price)
          VALUES (${orderId}, ${productId}, ${item.name}, ${item.quantity}, ${item.price})
        `;

        if (productId) {
          await tx`
            UPDATE products
            SET stock_qty = GREATEST(0, stock_qty - ${item.quantity})
            WHERE id = ${productId}
          `;
        }
      }

      // Insert in-app notification for logged-in user with full purchase details
      const itemSummaries = items.map((i: any) => `${i.quantity}x ${i.name}`).join(", ");
      const shortOrderId = orderId.slice(0, 8).toUpperCase();
      const notifPayload = {
        tag: "Order Update",
        tagClass: "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
        title: `Order #${shortOrderId} Placed (KES ${total.toLocaleString()}) 📦`,
        desc: `Purchased: ${itemSummaries}. Total: KES ${total.toLocaleString()}. Shipping to ${town}, ${county} (${phone}). Payment Method: ${paymentMethod.toUpperCase()}`,
        details: {
          orderId,
          shortOrderId,
          items,
          subtotal,
          total,
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
        VALUES (${user.id}, 'product_purchase', ${tx.json(notifPayload)})
      `;
    });

    // 5. Write Audit Log
    const { writeAuditLog } = await import("../audit.server");
    await writeAuditLog({
      actorId: user.id,
      action: "order.created",
      entityType: "order",
      entityId: orderId,
      diff: { subtotal, total, paymentMethod, shippingOption }
    });

    return {
      success: true,
      orderId
    };
  });
