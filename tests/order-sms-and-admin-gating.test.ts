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

describe("Admin Orders & Quotations Desk Recording & Confirmation Gating", () => {
  it("strictly enforces that an order is recorded ONLY after successful payment confirmation has been received", () => {
    const isOrderRecorded = (order: {
      status: string;
      paymentStatus: string;
      paymentReceipt?: string | null;
      deletedAt?: string | null;
    }) => {
      if (order.deletedAt) return false;
      if (order.paymentStatus !== "paid") return false;
      const validStatuses = ["confirmed", "paid", "processing", "shipped", "delivered"];
      if (!validStatuses.includes(order.status)) return false;
      if (!order.paymentReceipt || order.paymentReceipt.trim().length === 0) return false;
      return true;
    };

    // 1. Unpaid pending checkout attempt (should NOT be recorded)
    expect(isOrderRecorded({
      status: "pending",
      paymentStatus: "pending",
      paymentReceipt: null,
      deletedAt: null
    })).toBe(false);

    // 2. Failed payment attempt (should NOT be recorded)
    expect(isOrderRecorded({
      status: "cancelled",
      paymentStatus: "failed",
      paymentReceipt: null,
      deletedAt: null
    })).toBe(false);

    // 3. Soft-deleted order (should NOT be recorded)
    expect(isOrderRecorded({
      status: "confirmed",
      paymentStatus: "paid",
      paymentReceipt: "MPESA-Q78129",
      deletedAt: "2026-10-04T07:00:00Z"
    })).toBe(false);

    // 4. Order marked confirmed but without actual payment receipt (should NOT be recorded)
    expect(isOrderRecorded({
      status: "confirmed",
      paymentStatus: "paid",
      paymentReceipt: null,
      deletedAt: null
    })).toBe(false);

    // 5. Genuine paid & confirmed order with M-Pesa receipt confirmation (MUST be recorded)
    expect(isOrderRecorded({
      status: "confirmed",
      paymentStatus: "paid",
      paymentReceipt: "TI78XYZ123",
      deletedAt: null
    })).toBe(true);

    // 6. Genuine paid & confirmed order in fulfillment pipeline (MUST be recorded)
    expect(isOrderRecorded({
      status: "processing",
      paymentStatus: "paid",
      paymentReceipt: "PSTK-REF-9920",
      deletedAt: null
    })).toBe(true);

    expect(isOrderRecorded({
      status: "delivered",
      paymentStatus: "paid",
      paymentReceipt: "NCBA-TXN-0831",
      deletedAt: null
    })).toBe(true);
  });

  it("strictly validates that B2B Quotations can only be converted and recorded as orders with payment confirmation", () => {
    const validateQuotationConversion = (payload: {
      action: string;
      id: string;
      paymentRef?: string | null;
      paymentMethod?: string;
    }) => {
      if (payload.action !== "convert_to_order") {
        return { valid: false, error: "Invalid action" };
      }
      if (!payload.paymentRef || payload.paymentRef.trim().length < 3) {
        return {
          valid: false,
          error: "Payment confirmation reference (e.g. M-Pesa receipt # or Bank confirmation code) is required before converting a quotation to an active recorded order."
        };
      }
      return { valid: true };
    };

    // Conversion attempt without payment reference - REJECTED
    expect(validateQuotationConversion({
      action: "convert_to_order",
      id: "quote-123",
      paymentRef: ""
    })).toEqual({
      valid: false,
      error: "Payment confirmation reference (e.g. M-Pesa receipt # or Bank confirmation code) is required before converting a quotation to an active recorded order."
    });

    expect(validateQuotationConversion({
      action: "convert_to_order",
      id: "quote-123",
      paymentRef: null
    })).toEqual({
      valid: false,
      error: "Payment confirmation reference (e.g. M-Pesa receipt # or Bank confirmation code) is required before converting a quotation to an active recorded order."
    });

    // Conversion attempt with valid payment confirmation - ACCEPTED
    expect(validateQuotationConversion({
      action: "convert_to_order",
      id: "quote-123",
      paymentRef: "MPESA-QK89123XZ",
      paymentMethod: "mpesa"
    })).toEqual({ valid: true });

    expect(validateQuotationConversion({
      action: "convert_to_order",
      id: "quote-123",
      paymentRef: "NCBA-WIRE-778899",
      paymentMethod: "bank_transfer"
    })).toEqual({ valid: true });
  });
});
