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

export async function adminFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const token = getAdminToken();
  const headers = new Headers(init?.headers || {});
  if (token && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  let finalUrl = input;
  if (typeof input === "string") {
    finalUrl = getApiUrl(input);
  }

  const response = await fetch(finalUrl, {
    ...init,
    headers,
    credentials: "include",
  });

  if (response.status === 401 && typeof window !== "undefined") {
    console.warn("[adminFetch] 401 Unauthorized received. Session expired or missing token.");
    window.dispatchEvent(new CustomEvent("admin_unauthorized"));
  }

  return response;
}

