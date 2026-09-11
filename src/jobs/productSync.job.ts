import { ProductSyncController } from "@/controllers/productSync.controller";

declare global {
  var __pos_sync_job_interval__: NodeJS.Timeout | undefined;
  var __pos_sync_job_initialized__: boolean | undefined;
}

const SYNC_INTERVAL_MS = 30 * 60 * 1000; // 30 minutes

export function initProductSyncJob() {
  if (globalThis.__pos_sync_job_initialized__) {
    console.log("[PRODUCT SYNC JOB] Background sync job is already active.");
    return;
  }

  globalThis.__pos_sync_job_initialized__ = true;
  console.log(`[PRODUCT SYNC JOB] Initializing Smooth Sale POS background sync job (Interval: 30 minutes)...`);

  // Optionally execute initial sync check 10 seconds after server start
  setTimeout(async () => {
    try {
      console.log("[PRODUCT SYNC JOB] Executing initial startup inventory sync check...");
      await ProductSyncController.triggerManualSync("smooth_sale_startup");
    } catch (err) {
      console.error("[PRODUCT SYNC JOB] Initial startup sync error:", err);
    }
  }, 10000);

  // Set recurring 30-minute interval
  globalThis.__pos_sync_job_interval__ = setInterval(async () => {
    try {
      console.log("[PRODUCT SYNC JOB] Executing 30-minute scheduled inventory sync with Smooth Sale POS...");
      const result = await ProductSyncController.triggerManualSync("smooth_sale_cron_30m");
      console.log(`[PRODUCT SYNC JOB] 30-minute sync finished. Success: ${result.success}, Synced: ${result.productsSynced ?? 0} products`);
    } catch (err) {
      console.error("[PRODUCT SYNC JOB] Recurring 30-minute sync error:", err);
    }
  }, SYNC_INTERVAL_MS);

  if (typeof process !== "undefined" && process.on) {
    process.on("SIGINT", stopProductSyncJob);
    process.on("SIGTERM", stopProductSyncJob);
  }
}

export function stopProductSyncJob() {
  if (globalThis.__pos_sync_job_interval__) {
    clearInterval(globalThis.__pos_sync_job_interval__);
    globalThis.__pos_sync_job_interval__ = undefined;
    globalThis.__pos_sync_job_initialized__ = false;
    console.log("[PRODUCT SYNC JOB] Stopped background sync timer.");
  }
}
