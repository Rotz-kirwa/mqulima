import { getCookie } from "@tanstack/react-start/server";
import crypto from "crypto";

export function validateCsrfToken(requestToken: string | undefined): void {
  const isProduction = process.env.NODE_ENV === "production";
  
  // Dev/test bypass is strictly prohibited in production environments
  const allowBypass = !isProduction && (process.env.NODE_ENV === "test" || process.env.ALLOW_DEV_CSRF_BYPASS === "true");

  if (allowBypass && (!requestToken || requestToken === "mock-csrf-token")) {
    return;
  }

  const cookieToken = getCookie("mq_csrf");
  if (!cookieToken || !requestToken) {
    if (allowBypass) {
      console.warn("[CSRF WARNING] CSRF token missing in test/development environment. Bypassing.");
      return;
    }
    console.error("[SECURITY ALERT] CSRF validation failed: Token missing or unavailable.");
    throw new Error("Forbidden: CSRF token missing or invalid");
  }

  const bufA = Buffer.from(cookieToken);
  const bufB = Buffer.from(requestToken);

  if (bufA.length !== bufB.length || !crypto.timingSafeEqual(bufA, bufB)) {
    if (allowBypass) {
      console.warn("[CSRF WARNING] CSRF token mismatch in test/development environment. Bypassing.");
      return;
    }
    console.error("[SECURITY ALERT] CSRF validation failed: Token mismatch.");
    throw new Error("Forbidden: CSRF token invalid");
  }
}


