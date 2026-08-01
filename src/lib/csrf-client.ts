import { generateCsrfToken } from "./csrf.server";

export function getCsrfTokenFromCookie(): string {
  if (typeof document === "undefined") return "";
  const match = document.cookie.match(/(?:^|;\s*)mq_csrf=([^;]*)/);
  if (match && match[1]) {
    return decodeURIComponent(match[1]);
  }
  return "";
}

export async function ensureCsrfToken(): Promise<string> {
  let token = getCsrfTokenFromCookie();
  if (!token) {
    try {
      const res = await generateCsrfToken();
      if (res && res.token) {
        token = res.token;
      }
    } catch (e) {
      console.warn("Failed to generate CSRF token:", e);
    }
  }
  return token || getCsrfTokenFromCookie();
}
