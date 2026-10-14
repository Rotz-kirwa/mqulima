// ESM Shims for CommonJS dependencies (prevents ReferenceError: __dirname is not defined in ES module scope)
if (typeof globalThis !== "undefined") {
  if (typeof (globalThis as any).__dirname === "undefined") {
    (globalThis as any).__dirname = process.cwd();
  }
  if (typeof (globalThis as any).__filename === "undefined") {
    (globalThis as any).__filename = process.cwd() + "/server.mjs";
  }
}

import "./lib/error-capture";

import { consumeLastCapturedError } from "./lib/error-capture";
import { renderErrorPage } from "./lib/error-page";
import crypto from "node:crypto";

import { initProductSyncJob } from "./jobs/productSync.job";

type ServerEntry = {
  fetch: (request: Request, env: unknown, ctx: unknown) => Promise<Response> | Response;
};

// Initialize Smooth Sale POS 30-minute background sync job (only on dedicated persistent servers, not ephemeral serverless lambdas)
if (!process.env.VERCEL && !process.env.AWS_LAMBDA_FUNCTION_NAME) {
  try {
    initProductSyncJob();
  } catch (e) {
    console.error("[SERVER] Failed to initialize product sync background job:", e);
  }
}

let serverEntryPromise: Promise<ServerEntry> | undefined;


async function getServerEntry(): Promise<ServerEntry> {
  if (import.meta.env.DEV) {
    return import("@tanstack/react-start/server-entry").then(
      (m) => (m.default ?? m) as ServerEntry,
    );
  }
  if (!serverEntryPromise) {
    serverEntryPromise = import("@tanstack/react-start/server-entry").then(
      (m) => (m.default ?? m) as ServerEntry,
    );
  }
  return serverEntryPromise;
}

// h3 swallows in-handler throws into a normal 500 Response with body
// {"unhandled":true,"message":"HTTPError"} — try/catch alone never fires for those.
async function normalizeCatastrophicSsrResponse(response: Response): Promise<Response> {
  if (response.status < 500) return response;
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) return response;

  const body = await response.clone().text();
  if (!body.includes('"unhandled":true') || !body.includes('"message":"HTTPError"')) {
    return response;
  }

  const captured = consumeLastCapturedError();
  const capturedStr = captured instanceof Error ? (captured.stack || captured.message) : String(captured || "");
  console.error(captured ?? new Error(`h3 swallowed SSR error: ${body}`));
  return new Response(renderErrorPage(), {
    status: 500,
    headers: {
      "content-type": "text/html; charset=utf-8",
      "x-ssr-body": Buffer.from(body.slice(0, 300)).toString("base64"),
      "x-ssr-captured": Buffer.from(capturedStr.slice(0, 300)).toString("base64"),
    },
  });
}

const DEFAULT_ALLOWED_ORIGINS = [
  "https://www.mqulimaadmin.org",
  "https://mqulimaadmin.org",
  "https://www.mqulima.com",
  "https://mqulima.com",
  "https://www.mqulima.co.ke",
  "https://mqulima.co.ke",
  "https://admin.mqulima.com",
  "https://admin.mqulima.co.ke",
  "https://mqulima.vercel.app",
  "https://mqulima-admin-tawny.vercel.app",
  "http://localhost:3000",
  "http://localhost:8080",
  "http://localhost:8081",
];

const envOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(",").map((o) => o.trim().replace(/\/$/, ""))
  : [];

const ALLOWED_ORIGINS = [...new Set([...DEFAULT_ALLOWED_ORIGINS, ...envOrigins])];

function isOriginAllowed(origin: string): boolean {
  if (!origin) return false;
  const normalized = origin.replace(/\/$/, "");
  if (ALLOWED_ORIGINS.includes(normalized)) return true;
  // Allow any mqulimaadmin or mqulima domain (e.g. www.mqulimaadmin.org, admin.mqulima.com, etc.)
  if (/^https?:\/\/([a-zA-Z0-9_-]+\.)*(mqulimaadmin\.org|mqulimaadmin\.[a-z]{2,}|mqulima\.com|mqulima\.co.ke|mqulima\.org)$/i.test(normalized)) return true;
  // Allow any Render or Vercel preview/production deployment
  if (/^https:\/\/[a-zA-Z0-9_-]+\.onrender\.com$/.test(normalized)) return true;
  if (/^https:\/\/[a-zA-Z0-9_-]+\.vercel\.app$/.test(normalized)) return true;
  if (/^http:\/\/localhost(:[0-9]+)?$/.test(normalized)) return true;
  if (/^http:\/\/127\.0\.0\.1(:[0-9]+)?$/.test(normalized)) return true;
  return false;
}

export default {
  async fetch(request: Request, env: unknown, ctx: unknown) {
    const requestId = request.headers.get("x-request-id") || crypto.randomUUID();
    const requestStart = performance.now();
    const url = new URL(request.url);
    if (url.pathname === "/favicon.ico") {
      return new Response(null, {
        status: 204,
        headers: {
          "Content-Type": "image/x-icon",
          "Cache-Control": "public, max-age=86400",
        },
      });
    }

    // Intercept WordPress / PHP probe scans early to prevent expensive SSR 500 mutation errors
    if (
      url.pathname === "/xmlrpc.php" ||
      url.pathname === "/wp/xmlrpc.php" ||
      url.pathname === "/wp-login.php" ||
      url.pathname.startsWith("/wp-admin") ||
      url.pathname.startsWith("/wp-content") ||
      url.pathname.startsWith("/wp-includes") ||
      url.pathname === "/.env" ||
      url.pathname.startsWith("/.env.") ||
      url.pathname.startsWith("/.git")
    ) {
      return new Response("Not Found", {
        status: 404,
        headers: {
          "Content-Type": "text/plain; charset=utf-8",
          "Cache-Control": "public, max-age=86400",
        },
      });
    }

    if (url.pathname === "/robots.txt") {
      const robotsContent = `User-agent: *
Allow: /

# Administrative & Console Routes
Disallow: /admin
Disallow: /admin/
Disallow: /dashboard
Disallow: /dashboard/
Disallow: /api/

# Authentication & Sensitive Transaction Routes
Disallow: /auth/
Disallow: /login
Disallow: /payments/

# Canonical XML Sitemaps
Sitemap: https://mqulima.com/sitemap.xml
Sitemap: https://mqulima.com/sitemap-index.xml
`;
      return new Response(robotsContent, {
        status: 200,
        headers: {
          "Content-Type": "text/plain; charset=utf-8",
          "Cache-Control": "public, max-age=86400, s-maxage=86400",
        },
      });
    }

    if (url.pathname === "/sitemap.xml") {
      try {
        const { generateSitemapXml } = await import("./lib/sitemap.server");
        const sitemapXml = await generateSitemapXml();
        return new Response(sitemapXml, {
          status: 200,
          headers: {
            "Content-Type": "application/xml; charset=utf-8",
            "Cache-Control": "public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400",
          },
        });
      } catch (err) {
        console.error("[SERVER] Error generating sitemap.xml:", err);
        // Explicit failure: Return 503 Service Unavailable so search engines retain indexes rather than de-indexing
        return new Response(
          `<?xml version="1.0" encoding="UTF-8"?>\n<error><code>DATABASE_UNAVAILABLE</code><message>Sitemap generation temporarily unavailable. Please retry in 120 seconds.</message></error>`,
          {
            status: 503,
            headers: {
              "Content-Type": "application/xml; charset=utf-8",
              "Retry-After": "120",
              "Cache-Control": "no-cache, no-store, must-revalidate",
              "X-Sitemap-Error": "DatabaseUnavailable",
            },
          }
        );
      }
    }

    if (url.pathname === "/sitemap-index.xml") {
      const { generateSitemapIndexXml } = await import("./lib/sitemap.server");
      const indexXml = generateSitemapIndexXml();
      return new Response(indexXml, {
        status: 200,
        headers: {
          "Content-Type": "application/xml; charset=utf-8",
          "Cache-Control": "public, max-age=86400, s-maxage=86400",
        },
      });
    }

    if (url.pathname === "/sitemap-pages.xml") {
      const { generateSitemapPagesXml } = await import("./lib/sitemap.server");
      const pagesXml = generateSitemapPagesXml();
      return new Response(pagesXml, {
        status: 200,
        headers: {
          "Content-Type": "application/xml; charset=utf-8",
          "Cache-Control": "public, max-age=86400, s-maxage=86400",
        },
      });
    }

    if (url.pathname === "/sitemap-products.xml") {
      try {
        const { generateSitemapProductsXml } = await import("./lib/sitemap.server");
        const productsXml = await generateSitemapProductsXml();
        return new Response(productsXml, {
          status: 200,
          headers: {
            "Content-Type": "application/xml; charset=utf-8",
            "Cache-Control": "public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400",
          },
        });
      } catch (err) {
        return new Response(
          `<?xml version="1.0" encoding="UTF-8"?>\n<error><code>DATABASE_UNAVAILABLE</code><message>Products sitemap temporarily unavailable.</message></error>`,
          {
            status: 503,
            headers: {
              "Content-Type": "application/xml; charset=utf-8",
              "Retry-After": "120",
              "Cache-Control": "no-cache, no-store, must-revalidate",
            },
          }
        );
      }
    }

    if (url.pathname === "/sitemap-blog.xml") {
      try {
        const { generateSitemapBlogXml } = await import("./lib/sitemap.server");
        const blogXml = await generateSitemapBlogXml();
        return new Response(blogXml, {
          status: 200,
          headers: {
            "Content-Type": "application/xml; charset=utf-8",
            "Cache-Control": "public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400",
          },
        });
      } catch (err) {
        return new Response(
          `<?xml version="1.0" encoding="UTF-8"?>\n<error><code>DATABASE_UNAVAILABLE</code><message>Blog sitemap temporarily unavailable.</message></error>`,
          {
            status: 503,
            headers: {
              "Content-Type": "application/xml; charset=utf-8",
              "Retry-After": "120",
              "Cache-Control": "no-cache, no-store, must-revalidate",
            },
          }
        );
      }
    }

    if (url.pathname === "/admin" || (url.pathname.startsWith("/admin/") && !url.pathname.startsWith("/api/"))) {
      const adminBase = process.env.ADMIN_URL || (import.meta.env.DEV ? "http://localhost:8081" : "https://www.mqulimaadmin.org");
      const subPath = url.pathname.replace(/^\/admin/, "") || "/";
      return Response.redirect(`${adminBase}${subPath}${url.search}`, 302);
    }

    const origin = request.headers.get("origin") || "";
    const normalizedOrigin = origin.replace(/\/$/, "");
    const isAllowed = isOriginAllowed(normalizedOrigin);

    if (request.method === "OPTIONS") {
      if (isAllowed) {
        const reqHeaders = request.headers.get("access-control-request-headers");
        const defaultHeaders =
          "Content-Type, Authorization, X-Requested-With, Cookie, Cache-Control, Pragma, Accept, Origin, X-Bypass-Cache, X-Request-Id, Range";
        const allowHeaders = reqHeaders
          ? `${reqHeaders}, ${defaultHeaders}`
          : defaultHeaders;

        return new Response(null, {
          status: 204,
          headers: {
            "Access-Control-Allow-Origin": normalizedOrigin,
            "Access-Control-Allow-Methods": "GET, HEAD, POST, PUT, DELETE, OPTIONS, PATCH",
            "Access-Control-Allow-Headers": allowHeaders,
            "Access-Control-Allow-Credentials": "true",
            "Access-Control-Max-Age": "86400",
          },
        });
      }
    }

    try {
      const handler = await getServerEntry();
      const response = await handler.fetch(request, env, ctx);
      const normalizedResponse = await normalizeCatastrophicSsrResponse(response);

      const newHeaders = new Headers(normalizedResponse.headers);
      const existingVary = newHeaders.get("Vary");
      if (!existingVary) {
        newHeaders.set("Vary", "Accept-Encoding");
      } else if (!existingVary.includes("Accept-Encoding")) {
        newHeaders.set("Vary", `${existingVary}, Accept-Encoding`);
      }

      if (isAllowed) {
        newHeaders.set("Access-Control-Allow-Origin", normalizedOrigin);
        newHeaders.set("Access-Control-Allow-Credentials", "true");
        newHeaders.set(
          "Access-Control-Allow-Headers",
          "Content-Type, Authorization, X-Requested-With, Cookie, Cache-Control, Pragma, Accept, Origin, X-Bypass-Cache, X-Request-Id, Range"
        );
        newHeaders.set(
          "Access-Control-Expose-Headers",
          "Content-Length, Content-Range, X-Request-Id, X-Cache"
        );
      }

      const durationMs = Math.round(performance.now() - requestStart);
      newHeaders.set("X-Request-Id", requestId);

      if (durationMs > 500 && !url.pathname.includes("/assets/")) {
        console.warn(`[SLOW REQUEST] [${requestId}] ${request.method} ${url.pathname} completed in ${durationMs}ms`);
      }
      if (normalizedResponse.status >= 400 && request.method !== "GET" && request.method !== "HEAD") {
        console.error(`[MUTATION ERROR] [${requestId}] ${request.method} ${url.pathname} failed with HTTP ${normalizedResponse.status}`);
      }

      return new Response(normalizedResponse.body, {
        status: normalizedResponse.status,
        statusText: normalizedResponse.statusText,
        headers: newHeaders,
      });
    } catch (error) {
      const durationMs = Math.round(performance.now() - requestStart);
      const errMsg = (error as Error)?.stack || (error as Error)?.message || String(error);
      console.error(`[SERVER ERROR] [${requestId}] ${request.method} ${url.pathname} threw after ${durationMs}ms:`, error);
      const errorHeaders = new Headers({ 
        "content-type": "text/html; charset=utf-8",
        "X-Request-Id": requestId,
        "x-ssr-threw": Buffer.from(errMsg.slice(0, 300)).toString("base64"),
      });
      if (isAllowed) {
        errorHeaders.set("Access-Control-Allow-Origin", normalizedOrigin);
        errorHeaders.set("Access-Control-Allow-Credentials", "true");
      }
      return new Response(renderErrorPage(), {
        status: 500,
        headers: errorHeaders,
      });
    }
  },
};
