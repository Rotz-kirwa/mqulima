import { createFileRoute } from "@tanstack/react-router";
import { requireAdminAuth } from "@/lib/api/admin-auth.server";
import { ProductSyncController } from "@/controllers/productSync.controller";

export const Route = createFileRoute("/api/admin/products/sync")({
  server: {
    handlers: {
      POST: async ({ request }: { request: Request }) => {
        // Enforce administrative authentication
        const auth = await requireAdminAuth(request);
        if ("response" in auth) return auth.response;

        try {
          console.log(`[API /api/admin/products/sync] Manual POS sync triggered by admin user: ${auth.user?.email || auth.user?.id}`);
          const result = await ProductSyncController.triggerManualSync("manual_admin_trigger");

          if (!result.success) {
            return new Response(
              JSON.stringify({
                success: false,
                error: result.error || "Product synchronization encountered an error.",
                details: result,
              }),
              { status: 500, headers: { "Content-Type": "application/json" } }
            );
          }

          return new Response(
            JSON.stringify({
              success: true,
              message: `Smooth Sale POS synchronization completed successfully. Synced ${result.productsSynced ?? 0} products and ${result.variationsSynced ?? 0} variations.`,
              result,
            }),
            { status: 200, headers: { "Content-Type": "application/json" } }
          );
        } catch (err: any) {
          console.error("[API /api/admin/products/sync Error]:", err);
          return new Response(
            JSON.stringify({
              success: false,
              error: err?.message || "Internal server error occurred during product synchronization.",
            }),
            { status: 500, headers: { "Content-Type": "application/json" } }
          );
        }
      },
      GET: async ({ request }: { request: Request }) => {
        const auth = await requireAdminAuth(request);
        if ("response" in auth) return auth.response;

        try {
          const logs = await ProductSyncController.getSyncLogs(20);
          return new Response(
            JSON.stringify({
              success: true,
              logs,
            }),
            { status: 200, headers: { "Content-Type": "application/json" } }
          );
        } catch (err: any) {
          return new Response(
            JSON.stringify({ success: false, error: err?.message || "Failed to fetch sync logs" }),
            { status: 500, headers: { "Content-Type": "application/json" } }
          );
        }
      },
    },
  },
});
