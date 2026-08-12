import { getCookie } from "@tanstack/react-start/server";
import crypto from "crypto";

export function validateCsrfToken(requestToken: string | undefined): void {
  const isProduction = process.env.NODE_ENV === "production";
  
  // Dev/test bypass is strictly prohibited in production environments
  const allowBypass = !isProduction && (process.env.NODE_ENV === "test" || process.env.ALLOW_DEV_CSRF_BYPASS === "true");

  if (allowBypass && (!requestToken || requestToken === "mock-csrf-token")) {
    return;
  }

  const rawCookieToken = getCookie("mq_csrf");
  
  // Safely extract string values if getCookie or requestToken is passed as an Array or object
  const cookieStr = Array.isArray(rawCookieToken) ? String(rawCookieToken[0] || "") : (typeof rawCookieToken === "string" ? rawCookieToken : String(rawCookieToken || ""));
  const requestStr = Array.isArray(requestToken) ? String(requestToken[0] || "") : (typeof requestToken === "string" ? requestToken : String(requestToken || ""));

  if (!cookieStr || !requestStr) {
    if (allowBypass) {
      console.warn("[CSRF WARNING] CSRF token missing in test/development environment. Bypassing.");
      return;
    }
    console.error("[SECURITY ALERT] CSRF validation failed: Token missing or unavailable.");
    throw new Error("Forbidden: CSRF token missing or invalid");
  }

  const bufA = Buffer.from(cookieStr, "utf-8");
  const bufB = Buffer.from(requestStr, "utf-8");

  if (bufA.length !== bufB.length || !crypto.timingSafeEqual(bufA, bufB)) {
    if (allowBypass) {
      console.warn("[CSRF WARNING] CSRF token mismatch in test/development environment. Bypassing.");
      return;
    }
    console.error("[SECURITY ALERT] CSRF validation failed: Token mismatch.");
    throw new Error("Forbidden: CSRF token invalid");
  }
}


