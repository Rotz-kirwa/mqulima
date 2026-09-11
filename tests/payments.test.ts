import { describe, it, expect, beforeEach } from "vitest";

describe("Phase 1 Payments & Financial Integrity Tests", () => {
  describe("1. Server-Authoritative Price and Total Calculations", () => {
    // Simulate database catalog
    const mockDbProducts: Record<string, { id: string; base_price: number; stock_qty: number; status: string; deleted_at: null | string }> = {
      "prod-1": { id: "prod-1", base_price: 1500, stock_qty: 25, status: "active", deleted_at: null },
      "prod-2": { id: "prod-2", base_price: 3200, stock_qty: 10, status: "active", deleted_at: null },
      "prod-deleted": { id: "prod-deleted", base_price: 500, stock_qty: 5, status: "archived", deleted_at: "2026-09-01" },
    };

    function serverCalculateOrder(input: {
      items: { id: string; price?: number; quantity: number }[];
      couponCode?: string;
      shippingOption?: string;
    }) {
      let subtotal = 0;
      const orderItems = [];

      for (const item of input.items) {
        if (!Number.isInteger(item.quantity) || item.quantity <= 0) {
          throw new Error("Invalid quantity: Must be positive integer.");
        }

        const dbProduct = mockDbProducts[item.id];
        if (!dbProduct || dbProduct.deleted_at !== null || dbProduct.status !== "active") {
          throw new Error(`Product ${item.id} is unavailable or archived.`);
        }

        if (dbProduct.stock_qty < item.quantity) {
          throw new Error(`Insufficient stock for product ${item.id}.`);
        }

        // Authoritative price comes ONLY from DB
        const authoritativePrice = dbProduct.base_price;
        const lineTotal = authoritativePrice * item.quantity;
        subtotal += lineTotal;

        orderItems.push({
          productId: dbProduct.id,
          unitPrice: authoritativePrice,
          quantity: item.quantity,
          lineTotal,
        });
      }

      // Authoritative coupon check
      let discountAmount = 0;
      if (input.couponCode) {
        const code = input.couponCode.toUpperCase().trim();
        if (code === "MKULIMA10") {
          discountAmount = Math.round(subtotal * 0.10);
        } else if (code === "WELCOME20") {
          discountAmount = Math.min(200, Math.round(subtotal * 0.20));
        } else {
          throw new Error("Invalid or expired coupon code.");
        }
      }

      const shippingCost = input.shippingOption === "express" ? 500 : 250;
      const total = Math.max(0, subtotal - discountAmount + shippingCost);

      return {
        subtotal,
        discountAmount,
        shippingCost,
        total,
        orderItems,
      };
    }

    it("should ignore client-supplied unit prices and recalculate using DB prices", () => {
      const clientPayload = {
        items: [
          // Malicious client claims price is 1 KSh instead of 1500 KSh
          { id: "prod-1", price: 1, quantity: 2 },
        ],
      };

      const calculated = serverCalculateOrder(clientPayload);

      // Line total must be 1500 * 2 = 3000 KSh, not 2 KSh
      expect(calculated.orderItems[0].unitPrice).toBe(1500);
      expect(calculated.orderItems[0].lineTotal).toBe(3000);
      expect(calculated.subtotal).toBe(3000);
      expect(calculated.total).toBe(3250); // 3000 + 250 shipping
    });

    it("should reject deleted or archived products submitted by the client", () => {
      const clientPayload = {
        items: [
          { id: "prod-deleted", quantity: 1 },
        ],
      };

      expect(() => serverCalculateOrder(clientPayload)).toThrow(/unavailable or archived/);
    });

    it("should reject negative or zero item quantities", () => {
      expect(() => serverCalculateOrder({ items: [{ id: "prod-1", quantity: 0 }] })).toThrow(/Must be positive integer/);
      expect(() => serverCalculateOrder({ items: [{ id: "prod-1", quantity: -3 }] })).toThrow(/Must be positive integer/);
    });

    it("should reject invalid coupon codes and compute authentic discounts on the server", () => {
      expect(() =>
        serverCalculateOrder({
          items: [{ id: "prod-1", quantity: 1 }],
          couponCode: "FAKE_99_OFF",
        })
      ).toThrow(/Invalid or expired coupon/);

      const validOrder = serverCalculateOrder({
        items: [{ id: "prod-1", quantity: 2 }], // 3000 KSh
        couponCode: "MKULIMA10", // 10% = 300 KSh
        shippingOption: "standard", // 250 KSh
      });

      expect(validOrder.subtotal).toBe(3000);
      expect(validOrder.discountAmount).toBe(300);
      expect(validOrder.total).toBe(2950); // 3000 - 300 + 250
    });
  });

  describe("2. M-Pesa STK Push Payment Integrity", () => {
    type MockOrder = {
      id: string;
      userId: string;
      total: number;
      status: string;
      paymentStatus: string;
    };

    const ordersDb: Record<string, MockOrder> = {
      "ord-100": {
        id: "ord-100",
        userId: "user-abc",
        total: 4500,
        status: "pending",
        paymentStatus: "unpaid",
      },
      "ord-paid": {
        id: "ord-paid",
        userId: "user-abc",
        total: 2000,
        status: "completed",
        paymentStatus: "paid",
      },
    };

    const idempotencyCache = new Map<string, { timestamp: number; checkoutRequestId: string }>();

    beforeEach(() => {
      idempotencyCache.clear();
    });

    function validateAndInitiatePayment(params: {
      callerUserId: string;
      orderId: string;
      clientAmount?: number;
    }) {
      const order = ordersDb[params.orderId];
      if (!order) {
        throw new Error("Order not found.");
      }

      // Prevent unauthorized payment
      if (order.userId !== params.callerUserId) {
        throw new Error("Unauthorized order access.");
      }

      // Prevent charging already-paid orders
      if (order.paymentStatus === "paid") {
        throw new Error("This order has already been paid.");
      }

      // Idempotency check (60-second window)
      const now = Date.now();
      const cached = idempotencyCache.get(params.orderId);
      if (cached && now - cached.timestamp < 60000) {
        return {
          idempotent: true,
          checkoutRequestId: cached.checkoutRequestId,
          amountCharged: order.total,
        };
      }

      // Authoritative charge amount: MUST be order.total, NEVER clientAmount
      const amountToCharge = order.total;

      const checkoutRequestId = `ws_CO_${now}_mock`;
      idempotencyCache.set(params.orderId, { timestamp: now, checkoutRequestId });

      return {
        idempotent: false,
        checkoutRequestId,
        amountCharged: amountToCharge,
      };
    }

    it("should charge the exact database order.total regardless of client amount", () => {
      const res = validateAndInitiatePayment({
        callerUserId: "user-abc",
        orderId: "ord-100",
        clientAmount: 1, // Malicious client tried to send 1 KSh
      });

      expect(res.amountCharged).toBe(4500); // Charged DB order.total
    });

    it("should reject payment attempts for already-paid orders", () => {
      expect(() =>
        validateAndInitiatePayment({
          callerUserId: "user-abc",
          orderId: "ord-paid",
        })
      ).toThrow(/already been paid/);
    });

    it("should enforce idempotency protection within 60 seconds", () => {
      const first = validateAndInitiatePayment({
        callerUserId: "user-abc",
        orderId: "ord-100",
      });

      expect(first.idempotent).toBe(false);

      // Duplicate immediate call
      const duplicate = validateAndInitiatePayment({
        callerUserId: "user-abc",
        orderId: "ord-100",
      });

      expect(duplicate.idempotent).toBe(true);
      expect(duplicate.checkoutRequestId).toBe(first.checkoutRequestId);
    });
  });
});
