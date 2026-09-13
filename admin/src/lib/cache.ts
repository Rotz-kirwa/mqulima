/**
 * Mqulima Admin — High-Performance In-Memory SWR Cache & Request Deduplication Engine
 *
 * Capabilities:
 * - 0ms Instant response for cached & stale data
 * - In-flight promise deduplication (never fire identical parallel requests)
 * - Stale-While-Revalidate (SWR): Serve cached data instantly, refetch in background
 * - Intelligent mutation-based cache invalidation
 * - Predictive prefetching on hover / focus
 */

interface CacheEntry<T = any> {
  data: T;
  timestamp: number;
  headers: Record<string, string>;
  status: number;
  statusText: string;
}

interface InFlightRequest {
  promise: Promise<any>;
  controller?: AbortController;
}

// Configurable defaults
const DEFAULT_STALE_TIME = 2 * 60 * 1000; // 2 minutes: consider data fresh
const DEFAULT_MAX_AGE = 15 * 60 * 1000; // 15 minutes: keep in memory before eviction

class AdminCacheEngine {
  private cache = new Map<string, CacheEntry>();
  private inFlight = new Map<string, InFlightRequest>();
  private subscribers = new Map<string, Set<(data: any) => void>>();

  /**
   * Normalizes URLs so timestamps or trailing slashes don't fragment the cache.
   */
  public normalizeKey(url: string): string {
    try {
      // If it's a relative URL or path
      const dummyBase = "http://cache.local";
      const parsed = new URL(url, dummyBase);
      
      // Strip anti-cache params like ?t=... or ?_=...
      parsed.searchParams.delete("t");
      parsed.searchParams.delete("_");
      parsed.searchParams.delete("_ts");
      
      // Return normalized path + query
      return `${parsed.pathname}${parsed.search ? parsed.search : ""}`;
    } catch (_) {
      return url.replace(/([?&])t=\d+&?/, "$1").replace(/[?&]$/, "");
    }
  }

  /**
   * Checks if an entry exists and is within max age.
   */
  public get<T = any>(key: string): { entry: CacheEntry<T> | null; isFresh: boolean } {
    const normKey = this.normalizeKey(key);
    const entry = this.cache.get(normKey);

    if (!entry) {
      return { entry: null, isFresh: false };
    }

    const age = Date.now() - entry.timestamp;

    // Evict if beyond max age
    if (age > DEFAULT_MAX_AGE) {
      this.cache.delete(normKey);
      return { entry: null, isFresh: false };
    }

    return {
      entry,
      isFresh: age < DEFAULT_STALE_TIME,
    };
  }

  /**
   * Sets or updates cache data.
   */
  public set(key: string, data: any, responseMeta?: { headers?: Headers; status?: number; statusText?: string }) {
    const normKey = this.normalizeKey(key);
    
    const headersObj: Record<string, string> = {
      "content-type": "application/json",
    };

    if (responseMeta?.headers) {
      responseMeta.headers.forEach((val, k) => {
        headersObj[k.toLowerCase()] = val;
      });
    }

    const entry: CacheEntry = {
      data,
      timestamp: Date.now(),
      headers: headersObj,
      status: responseMeta?.status ?? 200,
      statusText: responseMeta?.statusText ?? "OK",
    };

    this.cache.set(normKey, entry);

    // Notify listeners
    const subs = this.subscribers.get(normKey);
    if (subs) {
      subs.forEach((cb) => cb(data));
    }
  }

  /**
   * Subscribes to updates for a specific key (useful for background revalidation).
   */
  public subscribe(key: string, callback: (data: any) => void): () => void {
    const normKey = this.normalizeKey(key);
    if (!this.subscribers.has(normKey)) {
      this.subscribers.set(normKey, new Set());
    }
    this.subscribers.get(normKey)!.add(callback);

    return () => {
      const subs = this.subscribers.get(normKey);
      if (subs) {
        subs.delete(callback);
        if (subs.size === 0) {
          this.subscribers.delete(normKey);
        }
      }
    };
  }

  /**
   * Manages in-flight deduplication.
   */
  public getInFlight(key: string): Promise<any> | null {
    const normKey = this.normalizeKey(key);
    return this.inFlight.get(normKey)?.promise || null;
  }

  public setInFlight(key: string, promise: Promise<any>, controller?: AbortController) {
    const normKey = this.normalizeKey(key);
    this.inFlight.set(normKey, { promise, controller });
    promise.finally(() => {
      this.inFlight.delete(normKey);
    });
  }

  /**
   * Invalidates cache entries matching a prefix or pattern.
   * e.g. invalidate("/api/admin/products") clears all related queries.
   */
  public invalidate(pattern: string) {
    const normPattern = this.normalizeKey(pattern);
    for (const key of this.cache.keys()) {
      if (key === normPattern || key.startsWith(normPattern)) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Clears the entire cache (e.g. on logout).
   */
  public clearAll() {
    this.cache.clear();
    this.inFlight.forEach((req) => {
      try {
        req.controller?.abort();
      } catch (_) {}
    });
    this.inFlight.clear();
    this.subscribers.clear();
  }
}

export const adminCache = new AdminCacheEngine();
