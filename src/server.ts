import "./lib/error-capture";

import { consumeLastCapturedError } from "./lib/error-capture";
import { renderErrorPage } from "./lib/error-page";
import crypto from "node:crypto";

import { initProductSyncJob } from "./jobs/productSync.job";

type ServerEntry = {
  fetch: (request: Request, env: unknown, ctx: unknown) => Promise<Response> | Response;
};

// Initialize Smooth Sale POS 30-minute background sync job
try {
  initProductSyncJob();
} catch (e) {
  console.error("[SERVER] Failed to initialize product sync background job:", e);
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

  console.error(consumeLastCapturedError() ?? new Error(`h3 swallowed SSR error: ${body}`));
  return new Response(renderErrorPage(), {
    status: 500,
    headers: { "content-type": "text/html; charset=utf-8" },
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

    if (url.pathname === "/sitemap.xml") {
      try {
        const { generateSitemapXml } = await import("./lib/sitemap.server");
        const sitemapXml = await generateSitemapXml();
        return new Response(sitemapXml, {
          status: 200,
          headers: {
            "Content-Type": "application/xml; charset=utf-8",
            "Cache-Control": "public, max-age=3600, s-maxage=3600",
          },
        });
      } catch (err) {
        console.error("[SERVER] Error generating sitemap.xml:", err);
        return new Response("<?xml version=\"1.0\" encoding=\"UTF-8\"?><urlset xmlns=\"http://www.sitemaps.org/schemas/sitemap/0.9\"><url><loc>https://www.mqulima.com/</loc></urlset>", {
          status: 200,
          headers: { "Content-Type": "application/xml; charset=utf-8" },
        });
      }
    }

    const origin = request.headers.get("origin") || "";
    const normalizedOrigin = origin.replace(/\/$/, "");
    const isAllowed = isOriginAllowed(normalizedOrigin);

    if (request.method === "OPTIONS") {
      if (isAllowed) {
        return new Response(null, {
          status: 204,
          headers: {
            "Access-Control-Allow-Origin": normalizedOrigin,
            "Access-Control-Allow-Methods": "GET, HEAD, POST, PUT, DELETE, OPTIONS, PATCH",
            "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Requested-With, Cookie",
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
        if (!newHeaders.has("Access-Control-Allow-Headers")) {
          newHeaders.set("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With, Cookie");
        }
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
      console.error(`[SERVER ERROR] [${requestId}] ${request.method} ${url.pathname} threw after ${durationMs}ms:`, error);
      const errorHeaders = new Headers({ 
        "content-type": "text/html; charset=utf-8",
        "X-Request-Id": requestId,
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
