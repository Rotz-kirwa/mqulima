import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { PaymentService } from "../payments/services/payment.service";

export const initiateNcbaStkPush = createServerFn({ method: "POST" })
  .inputValidator(z.object({
    orderId: z.string().uuid("Invalid order ID format"),
    phone: z.string().min(1, "Phone number is required"),
  }))
  .handler(async ({ data }) => {
    const { orderId, phone } = data;

    // 1. User authentication check
    const { getCurrentUser, getCurrentAdminUser } = await import("../auth-server");
    const user = (await getCurrentUser()) || (await getCurrentAdminUser());

    if (!user) {
      throw new Error("Unauthorized: Please log in to initiate payment.");
    }

    const isAdmin = user.role === "admin" || user.role === "super_admin";

    // 2. Delegate to Payment Engine
    const result = await PaymentService.initiateNcbaPayment({
      orderId,
      userId: user.id,
      phone,
      isAdmin,
    });

    return result;
  });

export const getNcbaPaymentStatus = createServerFn({ method: "GET" })
  .inputValidator(z.object({
    orderId: z.string().uuid("Invalid order ID format"),
  }))
  .handler(async ({ data }) => {
    const { orderId } = data;

    // 1. User authentication check
    const { getCurrentUser, getCurrentAdminUser } = await import("../auth-server");
    const user = (await getCurrentUser()) || (await getCurrentAdminUser());

    if (!user) {
      throw new Error("Unauthorized: Authentication required to view payment status.");
    }

    const isAdmin = user.role === "admin" || user.role === "super_admin";

    // 2. Retrieve payment status
    const status = await PaymentService.getPaymentStatus(orderId, user.id, isAdmin);

    return {
      status: status?.status || "pending",
      receiptNumber: status?.receiptNumber || null,
      resultDescription: status?.resultDescription || null,
      amount: status?.amount || 0,
      currency: status?.currency || "KES",
      providerRef: status?.providerRef || null,
      completedAt: status?.completedAt || null,
    };
  });
