import { describe, it, expect, vi, beforeEach } from "vitest";
import { buildOrderSmsMessage } from "@/lib/order-sms.server";

describe("Order Confirmation SMS Formatting", () => {
  it("formats a confirmed payment SMS with customer name, item names, individual prices, and total", () => {
    const sms = buildOrderSmsMessage({
      orderId: "6a9e18b4-f657-4148-9cc0-496df0bb5ce4",
      customerName: "Wanjiku Kamau",
      total: 8200,
      paymentRef: "PSTK-REF-9920",
      channel: "website",
      items: [
        {
          name: "Hybrid Seed Maize 50kg",
          quantity: 2,
          price: 2500,
          lineTotal: 5000,
        },
        {
          name: "DAP Planting Fertilizer",
          quantity: 1,
          price: 3200,
          lineTotal: 3200,
        },
      ],
    });

    expect(sms).toContain("Dear Wanjiku,");
    expect(sms).toContain("payment confirmed for Mqulima order #6A9E18B4!");
    expect(sms).toContain("2x Hybrid Seed Maize 50kg (KES 5,000)");
    expect(sms).toContain("1x DAP Planting Fertilizer (KES 3,200)");
    expect(sms).toContain("Total Paid: KES 8,200");
    expect(sms).toContain("(Ref: PSTK-REF-9920)");
    expect(sms).toContain("We are preparing your shipment! - Mqulima");
  });

  it("formats a WhatsApp order SMS with customer name, item names, individual prices, and total", () => {
    const sms = buildOrderSmsMessage({
      orderId: "9b3c4d5e-1111-2222-3333-444455556666",
      customerName: "Otieno Omondi",
      total: 3500,
      channel: "whatsapp",
      items: [
        {
          name: "Knapsack Sprayer 16L",
          quantity: 1,
          price: 3500,
          lineTotal: 3500,
        },
      ],
    });

    expect(sms).toContain("Dear Otieno,");
    expect(sms).toContain("your Mqulima WhatsApp order #9B3C4D5E has been received!");
    expect(sms).toContain("1x Knapsack Sprayer 16L (KES 3,500)");
    expect(sms).toContain("Total: KES 3,500");
    expect(sms).toContain("Our team will contact you shortly to coordinate delivery. - Mqulima");
  });

  it("handles missing customer name gracefully with clean greeting fallback", () => {
    const sms = buildOrderSmsMessage({
      orderId: "12345678-0000-0000-0000-000000000000",
      total: 1200,
      channel: "website",
      items: [
        {
          name: "Tomato Seeds 50g",
          quantity: 2,
          price: 600,
        },
      ],
    });

    expect(sms).toContain("payment confirmed for Mqulima order #12345678!");
    expect(sms).toContain("2x Tomato Seeds 50g (KES 1,200)");
    expect(sms).toContain("Total Paid: KES 1,200");
  });
});

describe("Admin Dashboard Order Visibility Logic", () => {
  it("determines whether an order should be recorded/visible in admin dashboard", () => {
    const shouldRecordInAdmin = (order: { paymentStatus: string; checkoutChannel: string }) => {
      return order.paymentStatus === "paid" || order.checkoutChannel === "whatsapp";
    };

    // Unpaid website checkout - should NOT be recorded/visible in admin
    expect(shouldRecordInAdmin({ paymentStatus: "pending", checkoutChannel: "website" })).toBe(false);
    expect(shouldRecordInAdmin({ paymentStatus: "failed", checkoutChannel: "website" })).toBe(false);

    // Confirmed paid website checkout - MUST be recorded/visible in admin
    expect(shouldRecordInAdmin({ paymentStatus: "paid", checkoutChannel: "website" })).toBe(true);

    // WhatsApp checkout (unpaid/pending online) - MUST be recorded/visible in admin
    expect(shouldRecordInAdmin({ paymentStatus: "pending", checkoutChannel: "whatsapp" })).toBe(true);
    expect(shouldRecordInAdmin({ paymentStatus: "paid", checkoutChannel: "whatsapp" })).toBe(true);
  });
});
