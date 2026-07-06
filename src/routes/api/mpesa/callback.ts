import { createFileRoute } from '@tanstack/react-router'
import { handleMpesaCallback } from "@/lib/mpesa-helpers.server";

export const Route = createFileRoute("/api/mpesa/callback")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const body = await request.json();
          await handleMpesaCallback(body);
          return new Response(JSON.stringify({ ResultCode: 0, ResultDesc: "Success" }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          });
        } catch (error: any) {
          console.error("M-Pesa Callback Endpoint Error:", error);
          // Safaricom expects a 200 OK with ResultCode != 0 for validation failures to acknowledge callback delivery
          return new Response(JSON.stringify({ ResultCode: 1, ResultDesc: error.message || "Internal error" }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          });
        }
      },
    },
  },
});
