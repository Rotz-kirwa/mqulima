import { createFileRoute } from '@tanstack/react-router'
import { handleMpesaCallback } from "@/lib/mpesa-helpers.server";

export const Route = createFileRoute("/api/mpesa/callback")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const body = await request.json();
          await handleMpesaCallback(body, request);
          return new Response(JSON.stringify({ ResultCode: 0, ResultDesc: "Success" }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          });
        } catch (error: any) {
          console.error("M-Pesa Callback Endpoint Error:", error);
          const msg = String(error?.message || "Internal error");
          const isUnauthorized = /Unauthorized M-Pesa callback/i.test(msg);
          // Reject unauthenticated callbacks with 401; acknowledge Safaricom payload validation failures with 200
          return new Response(JSON.stringify({ ResultCode: 1, ResultDesc: msg }), {
            status: isUnauthorized ? 401 : 200,
            headers: { "Content-Type": "application/json" },
          });
        }
      },
    },
  },
});

