import { SmoothSaleService, SyncResult } from "@/services/smoothSale.service";

export class ProductSyncController {
  /**
   * Manually triggers product synchronization from Smooth Sale POS.
   */
  static async triggerManualSync(syncType = "manual_admin"): Promise<SyncResult> {
    console.log(`[PRODUCT SYNC CONTROLLER] Manual product sync triggered (Type: ${syncType})`);
    return SmoothSaleService.syncSmoothSaleProducts({ syncType });
  }

  /**
   * Fetches recent synchronization logs for monitoring and audit displays.
   */
  static async getSyncLogs(limit = 20) {
    return SmoothSaleService.getRecentSyncLogs(limit);
  }
}
