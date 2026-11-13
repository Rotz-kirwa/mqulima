const DEFAULT_ALLOWED_ORIGINS = [
  "https://www.mqulima.com",
  "https://mqulima.com",
  "https://admin.mqulima.com",
  "https://www.mqulimaadmin.org",
  "https://mqulimaadmin.org",
  "https://mqulima.onrender.com",
];

const LOCAL_DEV_ORIGIN_RE = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d{1,5})?$/i;

function normalizeOrigin(origin: string): string {
  return origin.trim().replace(/\/$/, "");
}

export function getAllowedCorsOrigins(): Set<string> {
  const allowed = new Set<string>(DEFAULT_ALLOWED_ORIGINS);
  const previewHosts =
    process.env.VERCEL_ENV === "preview"
      ? [process.env.VERCEL_URL || "", process.env.VERCEL_BRANCH_URL || ""]
          .map((host) => host.trim())
          .filter(Boolean)
          .map((host) => (host.startsWith("http") ? host : `https://${host}`))
      : [];

  const envOrigins = [
    process.env.ALLOWED_ORIGINS || "",
    process.env.APP_URL || "",
    ...previewHosts,
  ]
    .join(",")
    .split(",")
    .map((o) => normalizeOrigin(o))
    .filter((o) => o && o !== "*");

  for (const origin of envOrigins) {
    try {
      allowed.add(new URL(origin).origin);
    } catch {
      // Ignore malformed origin entries from env
    }
  }
  return allowed;
}

export function resolveAllowedCorsOrigin(request?: Request): string | null {
  const originHeader = request?.headers.get("origin");
  if (!originHeader) return null;

  const clean = normalizeOrigin(originHeader);
  if (!clean) return null;

  if (getAllowedCorsOrigins().has(clean)) {
    return clean;
  }

  if (process.env.NODE_ENV !== "production" && LOCAL_DEV_ORIGIN_RE.test(clean)) {
    return clean;
  }

  return null;
}

export function buildCorsHeaders(
  request?: Request,
  extraHeaders?: Record<string, string>
): Record<string, string> {
  const allowedOrigin = resolveAllowedCorsOrigin(request);
  const headers: Record<string, string> = {
    "Access-Control-Allow-Methods": "GET, HEAD, POST, PUT, DELETE, OPTIONS, PATCH",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Requested-With, Cache-Control, Accept, Range",
    "Access-Control-Max-Age": "86400",
    Vary: "Origin",
  };

  if (allowedOrigin) {
    headers["Access-Control-Allow-Origin"] = allowedOrigin;
    headers["Access-Control-Allow-Credentials"] = "true";
  }

  if (extraHeaders) {
    Object.assign(headers, extraHeaders);
  }
  return headers;
}

export function applyCorsHeaders(response: Response, request?: Request): Response {
  const headers = new Headers(response.headers);
  const corsHeaders = buildCorsHeaders(request);

  for (const [k, v] of Object.entries(corsHeaders)) {
    if (k.toLowerCase() === "vary") {
      const existing = headers.get("Vary");
      if (!existing) {
        headers.set("Vary", v);
      } else if (!existing.split(",").map((x) => x.trim().toLowerCase()).includes("origin")) {
        headers.set("Vary", `${existing}, Origin`);
      }
      continue;
    }
    headers.set(k, v);
  }

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

export function corsJsonResponse(
  payload: unknown,
  status = 200,
  request?: Request,
  extraHeaders?: Record<string, string>
): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: buildCorsHeaders(request, {
      "Content-Type": "application/json",
      ...extraHeaders,
    }),
  });
}

export function corsOptionsResponse(request?: Request): Response {
  const originHeader = request?.headers.get("origin");
  const allowedOrigin = resolveAllowedCorsOrigin(request);
  // Reject explicit cross-origin preflight from disallowed origins cleanly without ACAO header
  const status = originHeader && !allowedOrigin ? 403 : 204;

  return new Response(null, {
    status,
    headers: buildCorsHeaders(request),
  });
}

