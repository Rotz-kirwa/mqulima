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
  const response = await fetch(input, {
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

