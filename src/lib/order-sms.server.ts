import { sendSms } from "./sms-service.server";

export interface OrderItemSummary {
  name?: string;
  product_name?: string;
  quantity?: number;
  price?: number;
  unit_price?: number;
  lineTotal?: number;
}

export interface BuildOrderSmsParams {
  orderId: string;
  total: number;
  items: OrderItemSummary[];
  customerName?: string | null;
  paymentRef?: string | null;
  channel?: "website" | "whatsapp";
}

export interface SendOrderConfirmedSmsParams extends BuildOrderSmsParams {
  phoneNumber: string;
}

/**
 * Builds a clear, professional SMS message containing:
 * - Customer's name
 * - List of ordered item names, quantities, and their price amounts
 * - Total amount
 * - Order reference code
 */
export function buildOrderSmsMessage(params: BuildOrderSmsParams): string {
  const shortOrderId = (params.orderId || "").slice(0, 8).toUpperCase();
  const firstName = params.customerName ? params.customerName.trim().split(" ")[0] : "";
  const greeting = firstName ? `Dear ${firstName}, ` : "";

  // Format each ordered item: "2x Hybrid Maize 50kg (KES 4,800)"
  const itemEntries = (params.items || []).map((item) => {
    const name = (item.name || item.product_name || "Item").trim();
    const qty = Number(item.quantity) || 1;
    const unitPrice = Number(item.price ?? item.unit_price ?? 0);
    const lineTotal = item.lineTotal !== undefined ? Number(item.lineTotal) : unitPrice * qty;
    return `${qty}x ${name} (KES ${lineTotal.toLocaleString()})`;
  });

  const itemsSummary = itemEntries.length > 0 ? itemEntries.join(", ") : "Ordered Items";
  const totalStr = `KES ${Number(params.total || 0).toLocaleString()}`;

  if (params.channel === "whatsapp") {
    return `${greeting}your Mqulima WhatsApp order #${shortOrderId} has been received! Items: ${itemsSummary}. Total: ${totalStr}. Our team will contact you shortly to coordinate delivery. - Mqulima`;
  }

  const refSnippet = params.paymentRef ? ` (Ref: ${params.paymentRef})` : "";
  return `${greeting}payment confirmed for Mqulima order #${shortOrderId}! Items: ${itemsSummary}. Total Paid: ${totalStr}${refSnippet}. We are preparing your shipment! - Mqulima`;
}

/**
 * Dispatches the order SMS safely in the background.
 */
export async function sendOrderConfirmedSms(params: SendOrderConfirmedSmsParams) {
  try {
    if (!params.phoneNumber) {
      console.warn(`[ORDER SMS] Skipping SMS for order ${params.orderId} - no phone number provided.`);
      return;
    }

    const message = buildOrderSmsMessage(params);
    const triggerType = params.channel === "whatsapp" ? "order_confirmation" : "payment_confirmed";

    await sendSms({
      phoneNumber: params.phoneNumber,
      message,
      triggerType,
    });
    console.log(`[ORDER SMS SENT] Sent to ${params.phoneNumber} for order ${params.orderId}`);
  } catch (err) {
    console.error(`[ORDER SMS ERROR] Failed to send SMS for order ${params.orderId}:`, err);
  }
}

/**
 * Resolves order details, user name, phone, and items from the database,
 * then dispatches the payment confirmed SMS.
 */
export async function sendOrderPaymentConfirmedSmsById(
  orderId: string,
  paymentRef?: string,
  providedPhone?: string,
  providedName?: string
) {
  try {
    const { getDb } = await import("./db.server");
    const sql = getDb();

    const [order] = await sql`
      SELECT o.id, o.items, o.total, o.delivery_address, o.checkout_channel,
             u.first_name, u.last_name, u.phone_number,
             p.full_name, p.phone as profile_phone
      FROM orders o
      LEFT JOIN users u ON u.id = o.user_id
      LEFT JOIN profiles p ON p.id = o.user_id
      WHERE o.id = ${orderId}
      LIMIT 1
    `;

    if (!order) {
      console.warn(`[ORDER SMS] Order ${orderId} not found in DB.`);
      return;
    }

    let phone = providedPhone || order.phone_number || order.profile_phone || "";
    let customerName = providedName || order.full_name || (order.first_name ? `${order.first_name} ${order.last_name || ""}`.trim() : "");

    // If still missing, parse delivery_address string
    if (order.delivery_address) {
      if (!phone) {
        const phoneMatch = order.delivery_address.match(/Phone:\s*([^\n]+)/i);
        if (phoneMatch) phone = phoneMatch[1].trim();
      }
      if (!customerName) {
        const nameMatch = order.delivery_address.match(/Name:\s*([^\n]+)/i);
        if (nameMatch) customerName = nameMatch[1].trim();
      }
    }

    if (!phone) {
      console.warn(`[ORDER SMS] Could not find phone number for order ${orderId}`);
      return;
    }

    let items: OrderItemSummary[] = [];
    if (Array.isArray(order.items)) {
      items = order.items;
    } else if (typeof order.items === "string") {
      try {
        items = JSON.parse(order.items);
      } catch (e) {
        items = [];
      }
    }

    // Fallback to order_items table if JSON items array is empty
    if (!items || items.length === 0) {
      const dbItems = await sql`
        SELECT product_name as name, quantity, unit_price as price
        FROM order_items
        WHERE order_id = ${orderId}
      `;
      items = dbItems;
    }

    await sendOrderConfirmedSms({
      orderId: order.id,
      total: parseFloat(order.total) || 0,
      items,
      customerName,
      phoneNumber: phone,
      paymentRef,
      channel: order.checkout_channel || "website"
    });
  } catch (err) {
    console.error(`[ORDER SMS ERROR] Error in sendOrderPaymentConfirmedSmsById:`, err);
  }
}
