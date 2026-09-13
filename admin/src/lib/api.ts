import { adminCache } from "./cache";

const API_BASE = ((import.meta as any).env?.VITE_API_URL || "").replace(/\/$/, "");

export function getApiUrl(path: string): string {
  if (!API_BASE || path.startsWith("http://") || path.startsWith("https://")) {
    return path;
  }
  return `${API_BASE}${path.startsWith("/") ? path : `/${path}`}`;
}

export function getAdminToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("mqulima_admin_token") || sessionStorage.getItem("mqulima_admin_token");
}

export interface AdminFetchOptions extends RequestInit {
  bypassCache?: boolean;
}

/**
 * High-performance adminFetch client featuring:
 * 1. 0ms instant cached responses (SWR)
 * 2. In-flight request deduplication
 * 3. Automatic cache invalidation on mutations (POST/PUT/DELETE/PATCH)
 * 4. Background revalidation
 */
export async function adminFetch(
  input: RequestInfo | URL,
  init?: AdminFetchOptions
): Promise<Response> {
  const token = getAdminToken();
  const headers = new Headers(init?.headers || {});
  if (token && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  let finalUrl = input;
  if (typeof input === "string") {
    finalUrl = getApiUrl(input);
  }

  const method = (init?.method || "GET").toUpperCase();
  const isGet = method === "GET";
  const urlString = typeof finalUrl === "string" ? finalUrl : finalUrl.toString();

  // 1. Handle GET requests with Smart SWR Caching & Deduplication
  if (isGet && !init?.bypassCache) {
    const { entry, isFresh } = adminCache.get(urlString);

    // If we have a fresh cache hit, return immediately (0ms)
    if (entry && isFresh) {
      return new Response(JSON.stringify(entry.data), {
        status: entry.status,
        statusText: entry.statusText,
        headers: new Headers({
          ...entry.headers,
          "x-cache": "HIT",
        }),
      });
    }

    // If we have a stale entry, serve it immediately while refetching in background (Stale-While-Revalidate)
    if (entry && !isFresh) {
      // Trigger background revalidation if not already in-flight
      triggerBackgroundRevalidation(urlString, { ...init, headers, credentials: "include" });

      return new Response(JSON.stringify(entry.data), {
        status: entry.status,
        statusText: entry.statusText,
        headers: new Headers({
          ...entry.headers,
          "x-cache": "STALE",
        }),
      });
    }

    // If an identical request is already in-flight, deduplicate and share the promise
    const existingPromise = adminCache.getInFlight(urlString);
    if (existingPromise) {
      const data = await existingPromise;
      return new Response(JSON.stringify(data), {
        status: 200,
        statusText: "OK",
        headers: new Headers({ "content-type": "application/json", "x-cache": "DEDUPED" }),
      });
    }
  }

  // 2. Perform Network Request
  const controller = new AbortController();
  const signal = init?.signal || controller.signal;

  const fetchPromise = (async () => {
    const response = await fetch(finalUrl, {
      ...init,
      headers,
      credentials: "include",
      signal,
    });

    if (response.status === 401 && typeof window !== "undefined") {
      console.warn("[adminFetch] 401 Unauthorized received. Session expired or missing token.");
      window.dispatchEvent(new CustomEvent("admin_unauthorized"));
    }

    // If GET and successful JSON response, cache the parsed body
    if (isGet && response.ok) {
      const cloned = response.clone();
      try {
        const contentType = cloned.headers.get("content-type") || "";
        if (contentType.includes("application/json")) {
          const jsonData = await cloned.json();
          adminCache.set(urlString, jsonData, {
            headers: response.headers,
            status: response.status,
            statusText: response.statusText,
          });
          return jsonData;
        }
      } catch (_) {}
    }

    // Auto-invalidate cache on successful mutations
    if (!isGet && response.ok) {
      invalidateRelatedCaches(urlString);
    }

    return response;
  })();

  if (isGet) {
    adminCache.setInFlight(urlString, fetchPromise, controller);
  }

  const result = await fetchPromise;
  if (result instanceof Response) {
    return result;
  }

  // If fetchPromise resolved to data (from cache write), synthesize response
  return new Response(JSON.stringify(result), {
    status: 200,
    headers: new Headers({ "content-type": "application/json" }),
  });
}

/**
 * Background silent refetch for Stale-While-Revalidate
 */
async function triggerBackgroundRevalidation(url: string, init: RequestInit) {
  if (adminCache.getInFlight(url)) return;

  try {
    const res = await fetch(url, init);
    if (res.ok) {
      const contentType = res.headers.get("content-type") || "";
      if (contentType.includes("application/json")) {
        const data = await res.json();
        adminCache.set(url, data, {
          headers: res.headers,
          status: res.status,
          statusText: res.statusText,
        });
      }
    }
  } catch (_) {
    // Ignore background revalidation network errors
  }
}

/**
 * Intelligently invalidates related caches based on mutation endpoints
 */
function invalidateRelatedCaches(url: string) {
  const norm = adminCache.normalizeKey(url);

  if (norm.includes("/products")) {
    adminCache.invalidate("/api/admin/products");
    adminCache.invalidate("/api/admin/analytics");
  } else if (norm.includes("/orders") || norm.includes("/quotations")) {
    adminCache.invalidate("/api/admin/orders");
    adminCache.invalidate("/api/admin/quotations");
    adminCache.invalidate("/api/admin/analytics");
  } else if (norm.includes("/customers")) {
    adminCache.invalidate("/api/admin/customers");
    adminCache.invalidate("/api/admin/analytics");
  } else if (norm.includes("/payments")) {
    adminCache.invalidate("/api/admin/payments");
    adminCache.invalidate("/api/admin/analytics");
  } else if (norm.includes("/featured")) {
    adminCache.invalidate("/api/admin/featured");
  } else if (norm.includes("/news")) {
    adminCache.invalidate("/api/admin/news");
  } else if (norm.includes("/services")) {
    adminCache.invalidate("/api/admin/services");
    adminCache.invalidate("/api/admin/analytics");
  } else if (norm.includes("/forum-moderation")) {
    adminCache.invalidate("/api/admin/forum-moderation");
  } else if (norm.includes("/inquiries")) {
    adminCache.invalidate("/api/admin/inquiries");
  } else if (norm.includes("/market-prices") || norm.includes("/commodity-trends")) {
    adminCache.invalidate("/api/admin/market-prices");
    adminCache.invalidate("/api/admin/commodity-trends");
  } else {
    // Fallback: invalidate the exact endpoint
    adminCache.invalidate(norm);
  }
}

/**
 * Prefetches data into the cache ahead of navigation
 */
export function prefetchAdminData(path: string): void {
  const fullUrl = getApiUrl(path);
  // Avoid re-fetching if already fresh in cache or in flight
  const { isFresh } = adminCache.get(fullUrl);
  if (isFresh || adminCache.getInFlight(fullUrl)) return;

  adminFetch(fullUrl).catch(() => {
    // Silent fail for prefetch
  });
}

/**
 * Explicit cache invalidation
 */
export function invalidateAdminCache(pattern: string): void {
  adminCache.invalidate(pattern);
}

/**
 * Clears all admin caches
 */
export function clearAdminCache(): void {
  adminCache.clearAll();
}
