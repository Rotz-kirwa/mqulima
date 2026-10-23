import { getDb } from "../db.server";
import { authenticateRequest } from "./auth-helper";
import { sendOrderConfirmedSms } from "../order-sms.server";

export async function handleCreateOrder(request: Request): Promise<Response> {
  const user = await authenticateRequest(request);
  if (!user) {
    return new Response(
      JSON.stringify({ success: false, error: "Unauthorized. Please sign in to place an order." }),
      { status: 401, headers: { "Content-Type": "application/json" } }
    );
  }

  try {
    const body = await request.json();
    const {
      items,
      name,
      phone,
      county,
      subcounty,
      town,
      location,
      paymentMethod = "mpesa",
      instructions,
    } = body;

    if (!Array.isArray(items) || items.length === 0) {
      return new Response(
        JSON.stringify({ success: false, error: "Order must contain at least one item." }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const sql = getDb();
    const deliveryAddress = `Name: ${name || user.name}\nPhone: ${phone || user.phone}\nCounty: ${county}\nSub-County/Town: ${subcounty || town || ""}\nLocation: ${location || ""}\nInstructions: ${instructions || ""}`.trim();

    let orderId: string = "";
    let finalSubtotal: number = 0;
    let finalTotal: number = 0;
    let savedItems: any[] = [];

    // Atomic transaction: lock items, check stock, compute authoritative total
    await sql.begin(async (tx: any) => {
      const itemIds = items.map((i: any) => i.productId || i.id);
      const dbProducts = await tx`
        SELECT id, name, base_price, stock_qty, status, deleted_at, image_urls
        FROM products
        WHERE id = ANY(${itemIds})
        FOR UPDATE
      `;

      const prodMap = new Map<string, any>(dbProducts.map((p: any) => [p.id, p]));

      let authoritativeSubtotal = 0;
      savedItems = items.map((i: any) => {
        const pid = i.productId || i.id;
        const p = prodMap.get(pid);
        if (!p || p.deleted_at !== null || p.status !== "active") {
          throw new Error(`Product "${i.name || pid}" is currently unavailable in the catalog.`);
        }
        const qty = Math.max(1, parseInt(i.qty || i.quantity || 1, 10));
        if (p.stock_qty < qty) {
          throw new Error(`Insufficient stock for "${p.name}". Available: ${p.stock_qty}, Requested: ${qty}`);
        }

        const unitPrice = parseFloat(p.base_price) || 0;
        const lineTotal = unitPrice * qty;
        authoritativeSubtotal += lineTotal;

        return {
          productId: p.id,
          name: p.name,
          variant: i.variant || null,
          price: unitPrice,
          qty,
          lineTotal,
          image: (Array.isArray(p.image_urls) && p.image_urls[0]) || i.image || "",
        };
      });

      // Free delivery >= 5,000 KSh, else 300 KSh
      const deliveryFee = authoritativeSubtotal >= 5000 ? 0 : 300;
      const authoritativeTotal = authoritativeSubtotal + deliveryFee;

      finalSubtotal = authoritativeSubtotal;
      finalTotal = authoritativeTotal;

      // Reserve stock in atomic transaction
      for (const item of savedItems) {
        await tx`
          UPDATE products
          SET stock_qty = GREATEST(0, stock_qty - ${item.qty}),
              updated_at = NOW()
          WHERE id = ${item.productId}
        `;
      }

      // Insert order into orders table
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
          ${JSON.stringify(savedItems)}::jsonb,
          ${authoritativeSubtotal},
          ${authoritativeTotal},
          'pending',
          ${paymentMethod === "card" || paymentMethod === "paystack" ? "paystack" : "mpesa"},
          'pending',
          ${deliveryAddress},
          'website',
          ${`Mobile App Order via ${paymentMethod.toUpperCase()}`}
        )
        RETURNING id, created_at
      `;

      orderId = orderRes.id;

      // Also populate relational order_items table for admin console reporting
      for (const item of savedItems) {
        await tx`
          INSERT INTO order_items (
            order_id,
            product_id,
            quantity,
            unit_price,
            total_price
          )
          VALUES (
            ${orderId},
            ${item.productId},
            ${item.qty},
            ${item.price},
            ${item.lineTotal}
          )
        `;
      }
    });

    // Fire confirmation SMS via TextSMS Kenya in background
    const customerPhone = phone || user.phone;
    if (customerPhone) {
      sendOrderConfirmedSms({
        orderId,
        orderTotal: finalTotal,
        customerName: name || user.name,
        customerPhone,
      }).catch((e) => console.warn("[ORDER CONFIRMED SMS ERROR]:", e));
    }

    return new Response(
      JSON.stringify({
        success: true,
        order: {
          id: orderId,
          orderId,
          subtotal: finalSubtotal,
          delivery: finalSubtotal >= 5000 ? 0 : 300,
          total: finalTotal,
          status: "Processing",
          paymentStatus: "Pending",
          paymentMethod,
          items: savedItems,
          phone: customerPhone,
          county,
          location: location || town || county,
          date: new Date().toISOString(),
        },
      }),
      { status: 201, headers: { "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    console.error("[API/V1/CREATE-ORDER ERROR]:", err);
    return new Response(
      JSON.stringify({ success: false, error: err?.message || "Failed to create order." }),
      { status: 409, headers: { "Content-Type": "application/json" } }
    );
  }
}

export async function handleGetMyOrders(request: Request): Promise<Response> {
  const user = await authenticateRequest(request);
  if (!user) {
    return new Response(
      JSON.stringify({ success: false, error: "Unauthorized." }),
      { status: 401, headers: { "Content-Type": "application/json" } }
    );
  }

  try {
    const sql = getDb();
    const rows = await sql`
      SELECT 
        o.id, o.subtotal, o.total, o.status, o.payment_status, 
        o.payment_method, o.delivery_address, o.items, o.created_at,
        p.provider_ref AS "mpesaReceipt"
      FROM orders o
      LEFT JOIN payments p ON p.order_id = o.id AND p.status = 'paid'
      WHERE o.user_id = ${user.id} AND o.deleted_at IS NULL
      ORDER BY o.created_at DESC
      LIMIT 100
    `;

    const orders = rows.map((r: any) => ({
      id: r.id,
      date: r.created_at,
      subtotal: Number(r.subtotal) || 0,
      delivery: Math.max(0, (Number(r.total) || 0) - (Number(r.subtotal) || 0)),
      total: Number(r.total) || 0,
      status: r.status,
      paymentStatus: r.payment_status,
      paymentMethod: r.payment_method,
      items: typeof r.items === "string" ? JSON.parse(r.items) : (r.items || []),
      deliveryAddress: r.delivery_address,
      receiptNumber: r.mpesaReceipt || null,
    }));

    return new Response(JSON.stringify(orders), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err: any) {
    return new Response(
      JSON.stringify({ success: false, error: err?.message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
