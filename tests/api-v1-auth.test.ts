import { describe, it, expect, vi } from "vitest";
import { handleAuthRegister, handleAuthLogin, handleAuthMe, corsOptionsResponse } from "../src/lib/api-v1/auth";

describe("API v1 Auth REST Endpoints (Mobile App Integration)", () => {
  it("should return correct CORS preflight headers on OPTIONS request", async () => {
    const res = corsOptionsResponse();
    expect(res.status).toBe(204);
    expect(res.headers.get("Access-Control-Allow-Origin")).toBe("*");
    expect(res.headers.get("Access-Control-Allow-Methods")).toContain("POST");
    expect(res.headers.get("Access-Control-Allow-Methods")).toContain("GET");
    expect(res.headers.get("Access-Control-Allow-Headers")).toContain("Authorization");
  });

  it("should reject registration requests with missing required fields", async () => {
    const req = new Request("http://localhost:3000/api/v1/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fullName: "Test User" }), // Missing email, password
    });

    const res = await handleAuthRegister(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.success).toBe(false);
    expect(data.error).toBeDefined();
  });

  it("should reject login requests with missing credentials", async () => {
    const req = new Request("http://localhost:3000/api/v1/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ identifier: "" }),
    });

    const res = await handleAuthLogin(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.success).toBe(false);
    expect(data.error).toBe("Validation failed");
  });

  it("should reject session verification requests missing an Authorization header", async () => {
    const req = new Request("http://localhost:3000/api/v1/auth/me", {
      method: "GET",
    });

    const res = await handleAuthMe(req);
    expect(res.status).toBe(401);
    const data = await res.json();
    expect(data.success).toBe(false);
    expect(data.error).toBe("Unauthorized. Please sign in to continue.");
  });

  it("should reject session verification with an invalid JWT token", async () => {
    const req = new Request("http://localhost:3000/api/v1/auth/me", {
      method: "GET",
      headers: {
        Authorization: "Bearer invalid.jwt.token",
      },
    });

    const res = await handleAuthMe(req);
    expect(res.status).toBe(401);
    const data = await res.json();
    expect(data.success).toBe(false);
    expect(data.error).toBe("Unauthorized. Please sign in to continue.");
  });
});
