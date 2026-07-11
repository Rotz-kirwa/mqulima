import "./lib/error-capture";

import { consumeLastCapturedError } from "./lib/error-capture";
import { renderErrorPage } from "./lib/error-page";

type ServerEntry = {
  fetch: (request: Request, env: unknown, ctx: unknown) => Promise<Response> | Response;
};

let serverEntryPromise: Promise<ServerEntry> | undefined;

async function getServerEntry(): Promise<ServerEntry> {
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

const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(",").map((o) => o.trim().replace(/\/$/, ""))
  : [
      "https://www.mqulima.com",
      "https://mqulima.vercel.app",
      "https://mqulima-admin-tawny.vercel.app",
      "http://localhost:3000",
      "http://localhost:8080",
      "http://localhost:8081",
    ];

export default {
  async fetch(request: Request, env: unknown, ctx: unknown) {
    const origin = request.headers.get("origin") || "";
    const normalizedOrigin = origin.replace(/\/$/, "");
    const isAllowed = ALLOWED_ORIGINS.includes(normalizedOrigin);

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

      if (isAllowed) {
        const newHeaders = new Headers(normalizedResponse.headers);
        newHeaders.set("Access-Control-Allow-Origin", normalizedOrigin);
        newHeaders.set("Access-Control-Allow-Credentials", "true");
        if (!newHeaders.has("Access-Control-Allow-Headers")) {
          newHeaders.set("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With, Cookie");
        }

        return new Response(normalizedResponse.body, {
          status: normalizedResponse.status,
          statusText: normalizedResponse.statusText,
          headers: newHeaders,
        });
      }

      return normalizedResponse;
    } catch (error) {
      console.error(error);
      const errorHeaders = new Headers({ "content-type": "text/html; charset=utf-8" });
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
