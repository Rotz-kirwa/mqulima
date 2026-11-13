import { describe, it, expect, vi, beforeEach } from "vitest";
import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import * as jose from "jose";

type ProfileRow = {
  id: string;
  email: string;
  username: string;
  full_name: string;
  phone: string | null;
  role: string;
  status: string;
  deleted_at: string | null;
  password_hash: string;
  county_region: string | null;
  years_farming: number;
  crops: string[];
  livestock: string[];
  avatar_url: string | null;
};

type RecoveryTokenRow = {
  id: string;
  user_id: string;
  code_hash: string;
  token_hash: string;
  attempts: number;
  max_attempts: number;
  expires_at: string;
  used_at: string | null;
};

type OrderRow = {
  id: string;
  user_id: string;
  total: string;
  status: string;
  payment_status: string;
  deleted_at: string | null;
};

type PaymentRow = {
  id: string;
  order_id: string;
  provider: string;
  provider_ref: string;
  merchant_reference: string;
  status: string;
  receipt_number: string | null;
  result_code: string | null;
  result_description: string | null;
  failure_reason: string | null;
  amount: string;
  created_at: string;
  updated_at: string;
};

const state = vi.hoisted(() => ({
  profiles: [] as ProfileRow[],
  recoveryTokens: [] as RecoveryTokenRow[],
  orders: [] as (OrderRow & { payment_method?: string; items?: any[] })[],
  payments: [] as PaymentRow[],
  products: [] as { id: string; stock_qty: number }[],
  recoveryRateLimitAllowed: true,
  sentRecoveryCodes: [] as string[],
  sentEmailCodes: [] as string[],
  sentSmsCodes: [] as string[],
}));

function buildFakeSql() {
  const exec = async (strings: TemplateStringsArray, ...values: any[]) => {
    const query = strings.join(" ").replace(/\s+/g, " ").trim();

    // Login profile lookup by email
    if (query.includes("SELECT id, email, password_hash, full_name, role, county_region, phone FROM profiles WHERE LOWER(email)")) {
      const [cleanEmail] = values;
      const found = state.profiles.find((p) => p.email.toLowerCase() === String(cleanEmail || "").toLowerCase() && !p.deleted_at);
      return found ? [found] : [];
    }

    // Increment failed attempts on active token when wrong code submitted
    if (query.startsWith("UPDATE recovery_tokens SET attempts = attempts + 1")) {
      const ident = String(values[0] || "").toLowerCase();
      const prof = state.profiles.find((p) => p.email.toLowerCase() === ident);
      if (prof) {
        const latest = [...state.recoveryTokens].reverse().find((r) => r.user_id === prof.id && !r.used_at);
        if (latest) latest.attempts += 1;
      }
      return [];
    }

    // Lock exceeded-attempt token (without RETURNING id)
    if (query.startsWith("UPDATE recovery_tokens SET used_at = NOW() WHERE id =") && !query.includes("RETURNING id")) {
      const [id] = values;
      const rt = state.recoveryTokens.find((r) => r.id === id);
      if (rt) rt.used_at = new Date().toISOString();
      return [];
    }

    // Profile auth lookup by id or email
    if (query.includes("FROM profiles p") && query.includes("p.deleted_at IS NULL")) {
      const [id, email] = values;
      const found = state.profiles.find(
        (p) =>
          (p.id === id || p.email.toLowerCase() === String(email || "").toLowerCase()) &&
          !p.deleted_at &&
          p.status !== "deleted"
      );
      return found ? [{ ...found, first_name: found.full_name, last_name: "", county: found.county_region, phone_number: found.phone }] : [];
    }

    // Fallback users lookup
    if (query.includes("FROM users") && query.includes("deleted_at IS NULL")) {
      return [];
    }

    // Recovery request lookup by email or phone
    if (query.includes("SELECT id, email, phone, full_name, role, status FROM profiles")) {
      const ident = String(values[0] || "").toLowerCase();
      const found = state.profiles.find(
        (p) =>
          (p.email.toLowerCase() === ident || (p.phone && values.includes(p.phone))) &&
          !p.deleted_at &&
          !["admin", "super_admin"].includes(p.role)
      );
      return found ? [found] : [];
    }

    // Invalidate existing unused recovery tokens
    if (query.startsWith("UPDATE recovery_tokens SET used_at = NOW() WHERE user_id =")) {
      const [userId] = values;
      for (const rt of state.recoveryTokens) {
        if (rt.user_id === userId && !rt.used_at) rt.used_at = new Date().toISOString();
      }
      return [];
    }

    // Insert recovery token
    if (query.startsWith("INSERT INTO recovery_tokens")) {
      const [user_id, code_hash, token_hash, expires_at] = values;
      state.recoveryTokens.push({
        id: `rt-${state.recoveryTokens.length + 1}`,
        user_id,
        code_hash,
        token_hash,
        attempts: 0,
        max_attempts: 5,
        expires_at,
        used_at: null,
      });
      return [];
    }

    // Lookup recovery token for reset
    if (query.includes("FROM recovery_tokens rt JOIN profiles p ON p.id = rt.user_id")) {
      const [codeHash] = values;
      const rt = state.recoveryTokens.find(
        (r) => r.code_hash === codeHash && !r.used_at && new Date(r.expires_at).getTime() > Date.now()
      );
      if (!rt) return [];
      const profile = state.profiles.find((p) => p.id === rt.user_id && !p.deleted_at);
      if (!profile) return [];
      return [{
        id: rt.id,
        user_id: rt.user_id,
        attempts: rt.attempts,
        max_attempts: rt.max_attempts,
        email: profile.email,
        phone: profile.phone,
        full_name: profile.full_name,
        role: profile.role,
      }];
    }

    // Consume single-use recovery token
    if (query.includes("UPDATE recovery_tokens SET used_at = NOW() WHERE id =") && query.includes("RETURNING id")) {
      const [id] = values;
      const rt = state.recoveryTokens.find((r) => r.id === id && !r.used_at);
      if (!rt) return [];
      rt.used_at = new Date().toISOString();
      return [{ id: rt.id }];
    }

    // Password reset update on profiles
    if (query.startsWith("UPDATE profiles SET password_hash =")) {
      const [password_hash, userId] = values;
      const p = state.profiles.find((row) => row.id === userId);
      if (p) p.password_hash = password_hash;
      return [];
    }

    // Account deletion profile lock & update
    if (query.startsWith("SELECT id, role, deleted_at FROM profiles WHERE id =")) {
      const [userId] = values;
      const p = state.profiles.find((row) => row.id === userId);
      return p ? [{ id: p.id, role: p.role, deleted_at: p.deleted_at }] : [];
    }

    if (query.startsWith("UPDATE profiles SET email =")) {
      const [email, username, password_hash, userId] = values;
      const p = state.profiles.find((row) => row.id === userId);
      if (p) {
        p.email = email;
        p.username = username;
        p.full_name = "Deleted User";
        p.phone = null;
        p.avatar_url = null;
        p.crops = [];
        p.livestock = [];
        p.password_hash = password_hash;
        p.status = "deleted";
        p.deleted_at = new Date().toISOString();
      }
      return [];
    }

    if (query.startsWith("DELETE FROM recovery_tokens WHERE user_id =")) {
      const [userId] = values;
      state.recoveryTokens = state.recoveryTokens.filter((r) => r.user_id !== userId);
      return [];
    }

    // Order status & ownership query
    if (query.startsWith("SELECT id, user_id, status, payment_status FROM orders WHERE id =")) {
      const [orderId] = values;
      const o = state.orders.find((row) => row.id === orderId && !row.deleted_at);
      return o ? [o] : [];
    }

    if (query.includes("FROM payments WHERE order_id =")) {
      const [orderId] = values;
      const p = state.payments.find((row) => row.order_id === orderId);
      return p ? [p] : [];
    }

    if (query.includes("FROM payments p JOIN orders o ON o.id = p.order_id")) {
      const [ref1, ref2] = values;
      const pay = state.payments.find((p) => p.provider === "paystack" && (p.provider_ref === ref1 || p.merchant_reference === ref2));
      if (!pay) return [];
      const order = state.orders.find((o) => o.id === pay.order_id);
      return order ? [{ id: order.id, user_id: order.user_id }] : [];
    }

    // M-Pesa callback lookup & reconciliation queries
    if (query.startsWith("SELECT id, order_id, amount FROM payments WHERE provider_ref =")) {
      const [ref] = values;
      const p = state.payments.find((row) => row.provider_ref === ref);
      return p ? [{ id: p.id, order_id: p.order_id, amount: p.amount }] : [];
    }

    if (query.startsWith("SELECT id, order_id, amount, status FROM payments WHERE id =")) {
      const [id] = values;
      const p = state.payments.find((row) => row.id === id);
      return p ? [{ id: p.id, order_id: p.order_id, amount: p.amount, status: p.status }] : [];
    }

    if (query.startsWith("UPDATE payments SET status =") && query.includes("M-Pesa Daraja")) {
      const [status, providerRef, receiptNumber, _rawPayload, id] = values;
      const p = state.payments.find((row) => row.id === id);
      if (p) {
        p.status = status;
        p.provider_ref = providerRef;
        p.receipt_number = receiptNumber;
        p.result_code = "0";
      }
      return [];
    }

    if (query.startsWith("UPDATE orders SET payment_status =") && query.includes("status = 'confirmed'")) {
      const [paymentStatus, orderId] = values;
      const o = state.orders.find((row) => row.id === orderId);
      if (o) {
        o.payment_status = paymentStatus;
        o.status = "confirmed";
      }
      return [];
    }

    if (query.startsWith("UPDATE payments SET status = 'failed'")) {
      const [resultCode, resultDesc, failureReason, _rawPayload, id] = values;
      const p = state.payments.find((row) => row.id === id);
      if (p) {
        p.status = "failed";
        p.result_code = resultCode;
        p.result_description = resultDesc;
        p.failure_reason = failureReason;
      }
      return [];
    }

    if (query.startsWith("SELECT id, items, status, payment_status FROM orders WHERE id =")) {
      const [orderId] = values;
      const o = state.orders.find((row) => row.id === orderId);
      return o ? [o] : [];
    }

    if (query.startsWith("UPDATE orders SET status = 'cancelled', payment_status = 'failed'")) {
      const [orderId] = values;
      const o = state.orders.find((row) => row.id === orderId);
      if (o) {
        o.status = "cancelled";
        o.payment_status = "failed";
      }
      return [];
    }

    if (query.startsWith("UPDATE products SET stock_qty = stock_qty +")) {
      const [qty, productId] = values;
      const prod = state.products.find((row) => row.id === productId);
      if (prod) prod.stock_qty += Number(qty);
      return [];
    }

    // Paystack verify & webhook reconciliation queries
    if (query.includes("FROM payments WHERE provider = 'paystack'")) {
      const [ref1, ref2] = values;
      const p = state.payments.find((row) => row.provider === "paystack" && (row.provider_ref === ref1 || row.merchant_reference === ref2));
      return p ? [p] : [];
    }

    if (query.startsWith("SELECT id, total, status, payment_status FROM orders WHERE id =")) {
      const [orderId] = values;
      const o = state.orders.find((row) => row.id === orderId && !row.deleted_at);
      return o ? [o] : [];
    }

    if (query.includes("SET status = 'paid', customer_email =")) {
      const [_email, _gw, _raw, id] = values;
      const p = state.payments.find((row) => row.id === id);
      if (p) p.status = "paid";
      return [];
    }

    if (query.includes("SET status = 'paid', payment_status = 'paid', payment_method = 'paystack'")) {
      const [orderId] = values;
      const o = state.orders.find((row) => row.id === orderId);
      if (o) {
        o.status = "paid";
        o.payment_status = "paid";
        o.payment_method = "paystack";
      }
      return [];
    }

    return [];
  };

  (exec as any).begin = async (cb: (tx: any) => Promise<any>) => cb(exec);
  return exec;
}

vi.mock("../src/lib/db.server", () => ({
  getDb: () => buildFakeSql(),
}));

vi.mock("../src/db", () => ({
  getRawSql: () => buildFakeSql(),
}));

vi.mock("../src/lib/payments/providers/paystack/paystack.api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../src/lib/payments/providers/paystack/paystack.api")>();
  return {
    ...actual,
    verifyPaystackTransactionApi: async (reference: string) => ({
      success: true,
      paid: true,
      amount: 4500,
      currency: "KES",
      customerEmail: "farmer@mqulima.com",
      gatewayResponse: "Successful",
      paidAt: new Date().toISOString(),
      rawResponse: { data: { reference, amount: 450000, currency: "KES", metadata: { order_id: "ord-other-2" } } },
    }),
  };
});

vi.mock("../src/lib/order-sms.server", () => ({
  sendOrderPaymentConfirmedSmsById: async () => ({ success: true }),
}));

vi.mock("../src/lib/rate-limit.server", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../src/lib/rate-limit.server")>();
  return {
    ...actual,
    getClientIp: () => "198.51.100.10",
    checkRecoveryRequestRateLimit: async () =>
      state.recoveryRateLimitAllowed
        ? { success: true }
        : { success: false, error: "Too many password recovery requests. Try again in 1 hour." },
    checkRecoveryAttemptRateLimit: async () => ({ success: true }),
  };
});

vi.mock("../src/lib/email-service.server", () => ({
  sendPasswordRecoveryEmail: async ({ otpCode }: { otpCode: string }) => {
    state.sentRecoveryCodes.push(otpCode);
    state.sentEmailCodes.push(otpCode);
    return { success: true };
  },
  sendRecoverySecurityNoticeEmail: async () => ({ success: true }),
}));

vi.mock("../src/lib/sms-service.server", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../src/lib/sms-service.server")>();
  return {
    ...actual,
    sendRecoverySms: async (_phone: string, otpCode: string) => {
      state.sentRecoveryCodes.push(otpCode);
      state.sentSmsCodes.push(otpCode);
      return { success: true };
    },
    sendRecoverySecurityNoticeSms: async () => ({ success: true }),
  };
});

vi.mock("../src/lib/audit.server", () => ({
  writeAuditLog: async () => {},
}));

vi.mock("../src/jobs/productSync.job", () => ({
  initProductSyncJob: () => {},
}));

import { handleApiV1Request } from "../src/lib/api-v1/router";
import server from "../src/server";
import { signUserToken } from "../src/lib/api-v1/auth-helper";
import { handleMpesaCallback, getMpesaWebhookSecret } from "../src/lib/mpesa-helpers.server";
import { PaystackService } from "../src/lib/payments/providers/paystack/paystack.service";
import { PaymentService } from "../src/lib/payments/services/payment.service";

describe("API v1 Production Security Hardening Regressions", () => {
  beforeEach(async () => {
    process.env.JWT_SECRET = "test-jwt-secret-key-at-least-32-chars-long";
    state.recoveryTokens = [];
    state.sentRecoveryCodes = [];
    state.sentEmailCodes = [];
    state.sentSmsCodes = [];
    state.recoveryRateLimitAllowed = true;
    state.products = [{ id: "prod-1", stock_qty: 10 }];

    const hash = await bcrypt.hash("OldPassword123!", 10);
    state.profiles = [
      {
        id: "11111111-1111-4111-8111-111111111111",
        email: "farmer@mqulima.com",
        username: "mqulima_farmer1",
        full_name: "Mary Wanjiku",
        phone: "0712345678",
        role: "farmer",
        status: "active",
        deleted_at: null,
        password_hash: hash,
        county_region: "Kiambu",
        years_farming: 5,
        crops: ["Maize"],
        livestock: [],
        avatar_url: null,
      },
      {
        id: "22222222-2222-4222-8222-222222222222",
        email: "admin@mqulima.com",
        username: "mqulima_admin1",
        full_name: "Admin User",
        phone: "0700000001",
        role: "admin",
        status: "active",
        deleted_at: null,
        password_hash: hash,
        county_region: "Nairobi",
        years_farming: 0,
        crops: [],
        livestock: [],
        avatar_url: null,
      },
    ];
    state.orders = [
      {
        id: "ord-farmer-1",
        user_id: "11111111-1111-4111-8111-111111111111",
        total: "2500.00",
        status: "paid",
        payment_status: "paid",
        deleted_at: null,
      },
      {
        id: "ord-other-2",
        user_id: "99999999-9999-4999-8999-999999999999",
        total: "4500.00",
        status: "pending",
        payment_status: "pending",
        deleted_at: null,
      },
    ];
    state.payments = [
      {
        id: "pay-1",
        order_id: "ord-farmer-1",
        provider: "mpesa",
        provider_ref: "ws_CO_123456",
        merchant_reference: "MR-1",
        status: "paid",
        receipt_number: "QWE123RTY4",
        result_code: "0",
        result_description: "Success",
        failure_reason: null,
        amount: "2500.00",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: "pay-other",
        order_id: "ord-other-2",
        provider: "paystack",
        provider_ref: "MQ_PAY_OTHER_REF",
        merchant_reference: "MQ_PAY_OTHER_REF",
        status: "pending",
        receipt_number: null,
        result_code: null,
        result_description: null,
        failure_reason: null,
        amount: "4500.00",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ];
  });

  describe("1. Explicit CORS Origin Enforcement", () => {
    it("allows trusted Mqulima web origins and blocks evil origins", async () => {
      const okUrl = new URL("https://www.mqulima.com/api/v1/auth/me");
      const okRes = await handleApiV1Request(
        new Request(okUrl, { method: "OPTIONS", headers: { Origin: "https://www.mqulima.com" } }),
        okUrl
      );
      expect(okRes.status).toBe(204);
      expect(okRes.headers.get("Access-Control-Allow-Origin")).toBe("https://www.mqulima.com");
      expect(okRes.headers.get("Vary")).toContain("Origin");

      const evilRes = await handleApiV1Request(
        new Request(okUrl, { method: "GET", headers: { Origin: "https://evil.example.com" } }),
        okUrl
      );
      expect(evilRes.status).toBe(401);
      expect(evilRes.headers.get("Access-Control-Allow-Origin")).toBeNull();

      // Native mobile client requests without Origin header never emit wildcard "*"
      const nativeRes = await handleApiV1Request(new Request(okUrl, { method: "GET" }), okUrl);
      expect(nativeRes.headers.get("Access-Control-Allow-Origin")).toBeNull();

      // Vercel preview deployment admits its own exact preview origin, while production ignores VERCEL_URL
      const prevEnv = process.env.VERCEL_ENV;
      const prevUrl = process.env.VERCEL_URL;
      const prevBranchUrl = process.env.VERCEL_BRANCH_URL;
      try {
        process.env.VERCEL_URL = "mqulima-preview-123.vercel.app";
        process.env.VERCEL_BRANCH_URL = "mqulima-git-feature.vercel.app";

        process.env.VERCEL_ENV = "preview";
        const previewRes = await handleApiV1Request(
          new Request(okUrl, { method: "OPTIONS", headers: { Origin: "https://mqulima-git-feature.vercel.app" } }),
          okUrl
        );
        expect(previewRes.status).toBe(204);
        expect(previewRes.headers.get("Access-Control-Allow-Origin")).toBe("https://mqulima-git-feature.vercel.app");

        process.env.VERCEL_ENV = "production";
        const prodRejectRes = await handleApiV1Request(
          new Request(okUrl, { method: "OPTIONS", headers: { Origin: "https://mqulima-git-feature.vercel.app" } }),
          okUrl
        );
        expect(prodRejectRes.status).toBe(403);
        expect(prodRejectRes.headers.get("Access-Control-Allow-Origin")).toBeNull();
      } finally {
        if (prevEnv === undefined) delete process.env.VERCEL_ENV;
        else process.env.VERCEL_ENV = prevEnv;
        if (prevUrl === undefined) delete process.env.VERCEL_URL;
        else process.env.VERCEL_URL = prevUrl;
        if (prevBranchUrl === undefined) delete process.env.VERCEL_BRANCH_URL;
        else process.env.VERCEL_BRANCH_URL = prevBranchUrl;
      }
    });

    it("enforces strict CORS through top-level server.fetch for allowed, unauthorized, and credentialed requests", async () => {
      const meUrl = "https://www.mqulima.com/api/v1/auth/me";
      const farmerToken = await signUserToken("11111111-1111-4111-8111-111111111111", "farmer@mqulima.com", "farmer");

      for (const allowedOrigin of ["https://www.mqulima.com", "https://www.mqulimaadmin.org"]) {
        const preflight = await server.fetch(
          new Request(meUrl, {
            method: "OPTIONS",
            headers: { Origin: allowedOrigin },
          }),
          {},
          {}
        );
        expect(preflight.status).toBe(204);
        expect(preflight.headers.get("Access-Control-Allow-Origin")).toBe(allowedOrigin);
        expect(preflight.headers.get("Access-Control-Allow-Credentials")).toBe("true");

        const credGet = await server.fetch(
          new Request(meUrl, {
            method: "GET",
            headers: {
              Origin: allowedOrigin,
              Cookie: `mq_session=${farmerToken}`,
            },
          }),
          {},
          {}
        );
        expect(credGet.status).toBe(200);
        expect(credGet.headers.get("Access-Control-Allow-Origin")).toBe(allowedOrigin);
        expect(credGet.headers.get("Access-Control-Allow-Credentials")).toBe("true");
      }

      for (const evilOrigin of [
        "https://evil.example.com",
        "https://mqulima-attacker.vercel.app",
        "https://mqulima-clone.onrender.com",
      ]) {
        const blockedPreflight = await server.fetch(
          new Request(meUrl, {
            method: "OPTIONS",
            headers: { Origin: evilOrigin },
          }),
          {},
          {}
        );
        expect(blockedPreflight.status).toBe(403);
        expect(blockedPreflight.headers.get("Access-Control-Allow-Origin")).toBeNull();
        expect(blockedPreflight.headers.get("Access-Control-Allow-Credentials")).toBeNull();

        const blockedCredGet = await server.fetch(
          new Request(meUrl, {
            method: "GET",
            headers: {
              Origin: evilOrigin,
              Cookie: `mq_session=${farmerToken}`,
            },
          }),
          {},
          {}
        );
        expect(blockedCredGet.status).toBe(200);
        expect(blockedCredGet.headers.get("Access-Control-Allow-Origin")).toBeNull();
        expect(blockedCredGet.headers.get("Access-Control-Allow-Credentials")).toBeNull();
      }

      // Native mobile client request without Origin header must never receive wildcard or credentials headers
      const nativeGet = await server.fetch(
        new Request(meUrl, {
          method: "GET",
          headers: { Authorization: `Bearer ${farmerToken}` },
        }),
        {},
        {}
      );
      expect(nativeGet.status).toBe(200);
      expect(nativeGet.headers.get("Access-Control-Allow-Origin")).toBeNull();
      expect(nativeGet.headers.get("Access-Control-Allow-Credentials")).toBeNull();
    });
  });

  describe("2. DELETE /api/v1/account Deletion, Anonymization & Session Revocation", () => {
    it("requires authentication and blocks admin self-deletion", async () => {
      const url = new URL("https://www.mqulima.com/api/v1/account");
      const unauth = await handleApiV1Request(new Request(url, { method: "DELETE" }), url);
      expect(unauth.status).toBe(401);

      const adminToken = await signUserToken("22222222-2222-4222-8222-222222222222", "admin@mqulima.com", "admin");
      const adminDel = await handleApiV1Request(
        new Request(url, { method: "DELETE", headers: { Authorization: `Bearer ${adminToken}` } }),
        url
      );
      expect(adminDel.status).toBe(403);
    });

    it("anonymizes PII, preserves statutory order records, clears cookie, and revokes JWT", async () => {
      const farmerToken = await signUserToken("11111111-1111-4111-8111-111111111111", "farmer@mqulima.com", "farmer");
      const accountUrl = new URL("https://www.mqulima.com/api/v1/account");

      const delRes = await handleApiV1Request(
        new Request(accountUrl, { method: "DELETE", headers: { Authorization: `Bearer ${farmerToken}` } }),
        accountUrl
      );
      expect(delRes.status).toBe(200);
      const body = await delRes.json();
      expect(body.deleted).toBe(true);
      expect(delRes.headers.get("Set-Cookie")).toContain("Max-Age=0");

      // PII anonymized while order & payment ledger records remain intact
      const profile = state.profiles[0];
      expect(profile.status).toBe("deleted");
      expect(profile.deleted_at).not.toBeNull();
      expect(profile.email).toMatch(/^deleted_.*@deleted\.mqulima\.local$/);
      expect(profile.username).toMatch(/^mqulima_deleted_/);
      expect(profile.phone).toBeNull();
      expect(state.orders.find((o) => o.id === "ord-farmer-1")).toBeDefined();
      expect(state.payments.find((p) => p.id === "pay-1")).toBeDefined();

      // Existing JWT is immediately revoked on subsequent authenticated requests
      const meUrl = new URL("https://www.mqulima.com/api/v1/auth/me");
      const meAfterDelete = await handleApiV1Request(
        new Request(meUrl, { method: "GET", headers: { Authorization: `Bearer ${farmerToken}` } }),
        meUrl
      );
      expect(meAfterDelete.status).toBe(401);
    });
  });

  describe("3. Password Recovery Anti-Enumeration, Rate Limits & Single-Use Tokens", () => {
    it("returns identical response for existing and non-existent accounts and completes single-use reset", async () => {
      const forgotUrl = new URL("https://www.mqulima.com/api/v1/auth/forgot-password");
      const existingRes = await handleApiV1Request(
        new Request(forgotUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ identifier: "farmer@mqulima.com" }),
        }),
        forgotUrl
      );
      const unknownRes = await handleApiV1Request(
        new Request(forgotUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ identifier: "nonexistent@example.com" }),
        }),
        forgotUrl
      );

      expect(existingRes.status).toBe(200);
      expect(unknownRes.status).toBe(200);
      const existingData = await existingRes.json();
      const unknownData = await unknownRes.json();
      expect(existingData).toEqual(unknownData);
      expect(state.recoveryTokens).toHaveLength(1);
      expect(state.sentRecoveryCodes.length).toBeGreaterThanOrEqual(1);

      const otpCode = state.sentRecoveryCodes[0];
      const resetUrl = new URL("https://www.mqulima.com/api/v1/auth/reset-password");
      const resetRes = await handleApiV1Request(
        new Request(resetUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            identifier: "farmer@mqulima.com",
            code: otpCode,
            newPassword: "NewSecurePassword2026!",
          }),
        }),
        resetUrl
      );
      expect(resetRes.status).toBe(200);
      expect(await bcrypt.compare("NewSecurePassword2026!", state.profiles[0].password_hash)).toBe(true);

      // Reusing the same OTP must fail
      const replayRes = await handleApiV1Request(
        new Request(resetUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            identifier: "farmer@mqulima.com",
            code: otpCode,
            newPassword: "AnotherPassword2026!",
          }),
        }),
        resetUrl
      );
      expect(replayRes.status).toBe(400);
    });

    it("returns 429 when password recovery rate limit is exceeded", async () => {
      state.recoveryRateLimitAllowed = false;
      const forgotUrl = new URL("https://www.mqulima.com/api/v1/auth/forgot-password");
      const res = await handleApiV1Request(
        new Request(forgotUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ identifier: "farmer@mqulima.com" }),
        }),
        forgotUrl
      );
      expect(res.status).toBe(429);
    });
  });

  describe("4. Payment Polling Auth & Provider Webhook Verification", () => {
    it("enforces authentication and ownership on payment status polling and Paystack verification", async () => {
      const statusUrl = new URL("https://www.mqulima.com/api/v1/payments/status/ord-farmer-1");
      const unauthStatus = await handleApiV1Request(new Request(statusUrl, { method: "GET" }), statusUrl);
      expect(unauthStatus.status).toBe(401);

      const farmerToken = await signUserToken("11111111-1111-4111-8111-111111111111", "farmer@mqulima.com", "farmer");
      const ownStatus = await handleApiV1Request(
        new Request(statusUrl, { method: "GET", headers: { Authorization: `Bearer ${farmerToken}` } }),
        statusUrl
      );
      expect(ownStatus.status).toBe(200);
      const ownJson = await ownStatus.json();
      expect(ownJson.paid).toBe(true);
      expect(ownJson.receiptNumber).toBe("QWE123RTY4");

      const otherStatusUrl = new URL("https://www.mqulima.com/api/v1/payments/status/ord-other-2");
      const crossUserStatus = await handleApiV1Request(
        new Request(otherStatusUrl, { method: "GET", headers: { Authorization: `Bearer ${farmerToken}` } }),
        otherStatusUrl
      );
      expect(crossUserStatus.status).toBe(403);

      const verifyUrl = new URL("https://www.mqulima.com/api/v1/payments/paystack/verify");
      const unauthVerify = await handleApiV1Request(
        new Request(verifyUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ reference: "MQ_PAY_OTHER_REF" }),
        }),
        verifyUrl
      );
      expect(unauthVerify.status).toBe(401);

      const crossUserVerify = await handleApiV1Request(
        new Request(verifyUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${farmerToken}` },
          body: JSON.stringify({ reference: "MQ_PAY_OTHER_REF" }),
        }),
        verifyUrl
      );
      expect(crossUserVerify.status).toBe(403);
    });

    it("rejects unauthorized Safaricom M-Pesa callbacks and tampered Paystack signatures", async () => {
      await expect(
        handleMpesaCallback(
          { Body: { stkCallback: { CheckoutRequestID: "ws_CO_123", ResultCode: 0 } } },
          new Request("https://www.mqulima.com/api/mpesa/callback", { method: "POST" })
        )
      ).rejects.toThrow(/Unauthorized M-Pesa callback/i);

      await expect(
        handleMpesaCallback(
          { Body: { stkCallback: { CheckoutRequestID: "ws_CO_123", ResultCode: 0 } } },
          new Request("https://www.mqulima.com/api/mpesa/callback?token=wrong-secret", { method: "POST" })
        )
      ).rejects.toThrow(/Unauthorized M-Pesa callback/i);

      expect(getMpesaWebhookSecret()).toHaveLength(32);

      const testKey = "sk_test_0000000000000000000000000000000000000000";
      process.env.PAYSTACK_SECRET_KEY = testKey;
      const rawBody = JSON.stringify({ event: "charge.success", data: { reference: "REF_123", amount: 150000 } });
      const validSig = crypto.createHmac("sha512", testKey).update(rawBody).digest("hex");

      expect(PaystackService.verifyWebhookSignature(rawBody, validSig)).toBe(true);
      expect(PaystackService.verifyWebhookSignature(rawBody, "0".repeat(validSig.length))).toBe(false);
      expect(PaystackService.verifyWebhookSignature(rawBody + " ", validSig)).toBe(false);
      expect(PaystackService.verifyWebhookSignature(rawBody, null)).toBe(false);
    });

    it("handles OTP delivery across email+SMS, wrong OTP attempts, expiration, password login, and post-delete login rejection", async () => {
      const forgotUrl = new URL("https://www.mqulima.com/api/v1/auth/forgot-password");
      const reqRes = await handleApiV1Request(
        new Request(forgotUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ identifier: "farmer@mqulima.com" }),
        }),
        forgotUrl
      );
      expect(reqRes.status).toBe(200);
      expect(state.sentEmailCodes).toHaveLength(1);
      expect(state.sentSmsCodes).toHaveLength(1);
      expect(state.sentEmailCodes[0]).toBe(state.sentSmsCodes[0]);
      const realOtp = state.sentEmailCodes[0];

      // Incorrect OTP increments attempt count & fails cleanly
      const resetUrl = new URL("https://www.mqulima.com/api/v1/auth/reset-password");
      const badOtpRes = await handleApiV1Request(
        new Request(resetUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            identifier: "farmer@mqulima.com",
            code: realOtp === "000000" ? "111111" : "000000",
            newPassword: "NewSecurePassword2026!",
          }),
        }),
        resetUrl
      );
      expect(badOtpRes.status).toBe(400);
      expect(state.recoveryTokens[0].attempts).toBe(1);

      // Expired OTP is rejected without altering password
      state.recoveryTokens[0].expires_at = new Date(Date.now() - 60_000).toISOString();
      const expiredRes = await handleApiV1Request(
        new Request(resetUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            identifier: "farmer@mqulima.com",
            code: realOtp,
            newPassword: "NewSecurePassword2026!",
          }),
        }),
        resetUrl
      );
      expect(expiredRes.status).toBe(400);

      // Fresh OTP resets password, invalidates old password, and allows login with new password
      state.recoveryTokens[0].expires_at = new Date(Date.now() + 600_000).toISOString();
      const validResetRes = await handleApiV1Request(
        new Request(resetUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            identifier: "farmer@mqulima.com",
            code: realOtp,
            newPassword: "NewSecurePassword2026!",
          }),
        }),
        resetUrl
      );
      expect(validResetRes.status).toBe(200);

      const loginUrl = new URL("https://www.mqulima.com/api/v1/auth/login");
      const oldPwLogin = await handleApiV1Request(
        new Request(loginUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ identifier: "farmer@mqulima.com", password: "OldPassword123!" }),
        }),
        loginUrl
      );
      expect(oldPwLogin.status).toBe(401);

      const newPwLogin = await handleApiV1Request(
        new Request(loginUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ identifier: "farmer@mqulima.com", password: "NewSecurePassword2026!" }),
        }),
        loginUrl
      );
      expect(newPwLogin.status).toBe(200);
      const loginJson = await newPwLogin.json();
      expect(loginJson.token).toBeTruthy();

      // Account deletion revokes token AND prevents future logins while keeping financial orders/payments
      const delUrl = new URL("https://www.mqulima.com/api/v1/account");
      const delRes = await handleApiV1Request(
        new Request(delUrl, { method: "DELETE", headers: { Authorization: `Bearer ${loginJson.token}` } }),
        delUrl
      );
      expect(delRes.status).toBe(200);

      const postDeleteLogin = await handleApiV1Request(
        new Request(loginUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ identifier: "farmer@mqulima.com", password: "NewSecurePassword2026!" }),
        }),
        loginUrl
      );
      expect(postDeleteLogin.status).toBe(401);
      expect(state.orders.find((o) => o.id === "ord-farmer-1")).toBeDefined();
      expect(state.payments.find((p) => p.id === "pay-1")).toBeDefined();
    });

    it("reconciles valid M-Pesa success/failure callbacks (with stock restore) and Paystack webhook reconciliation", async () => {
      const mpesaSecret = getMpesaWebhookSecret();
      state.orders.push(
        {
          id: "ord-mpesa-ok",
          user_id: "11111111-1111-4111-8111-111111111111",
          total: "1200.00",
          status: "pending",
          payment_status: "pending",
          deleted_at: null,
        },
        {
          id: "ord-mpesa-fail",
          user_id: "11111111-1111-4111-8111-111111111111",
          total: "800.00",
          status: "pending",
          payment_status: "pending",
          deleted_at: null,
          items: [{ productId: "prod-1", qty: 3 }],
        }
      );
      state.payments.push(
        {
          id: "pay-mpesa-ok",
          order_id: "ord-mpesa-ok",
          provider: "mpesa",
          provider_ref: "ws_CO_TEST_OK",
          merchant_reference: "MR-OK",
          status: "pending",
          receipt_number: null,
          result_code: null,
          result_description: null,
          failure_reason: null,
          amount: "1200.00",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          id: "pay-mpesa-fail",
          order_id: "ord-mpesa-fail",
          provider: "mpesa",
          provider_ref: "ws_CO_TEST_FAIL",
          merchant_reference: "MR-FAIL",
          status: "pending",
          receipt_number: null,
          result_code: null,
          result_description: null,
          failure_reason: null,
          amount: "800.00",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }
      );

      // 1. Authorized M-Pesa STK success callback reconciles payment & order
      await handleMpesaCallback(
        {
          Body: {
            stkCallback: {
              CheckoutRequestID: "ws_CO_TEST_OK",
              ResultCode: 0,
              ResultDesc: "The service request is processed successfully.",
              CallbackMetadata: {
                Item: [
                  { Name: "Amount", Value: 1200 },
                  { Name: "MpesaReceiptNumber", Value: "MPESA998877" },
                ],
              },
            },
          },
        },
        new Request(`https://www.mqulima.com/api/mpesa/callback?token=${mpesaSecret}`, { method: "POST" })
      );
      expect(state.payments.find((p) => p.id === "pay-mpesa-ok")?.status).toBe("paid");
      expect(state.payments.find((p) => p.id === "pay-mpesa-ok")?.receipt_number).toBe("MPESA998877");
      expect(state.orders.find((o) => o.id === "ord-mpesa-ok")?.payment_status).toBe("paid");

      // 2. Authorized M-Pesa failure callback cancels order & restores stock
      await handleMpesaCallback(
        {
          Body: {
            stkCallback: {
              CheckoutRequestID: "ws_CO_TEST_FAIL",
              ResultCode: 1032,
              ResultDesc: "Request cancelled by user",
            },
          },
        },
        new Request(`https://www.mqulima.com/api/mpesa/callback?token=${mpesaSecret}`, { method: "POST" })
      );
      expect(state.payments.find((p) => p.id === "pay-mpesa-fail")?.status).toBe("failed");
      expect(state.orders.find((o) => o.id === "ord-mpesa-fail")?.status).toBe("cancelled");
      expect(state.products.find((pr) => pr.id === "prod-1")?.stock_qty).toBe(13);

      // 3. Valid Paystack webhook reconciles ord-other-2 & pay-other atomically
      const testKey = "sk_test_0000000000000000000000000000000000000000";
      process.env.PAYSTACK_SECRET_KEY = testKey;
      const webhookPayload = {
        event: "charge.success",
        data: { reference: "MQ_PAY_OTHER_REF", amount: 450000, currency: "KES", status: "success" },
      };
      const rawWebhook = JSON.stringify(webhookPayload);
      const validWebhookSig = crypto.createHmac("sha512", testKey).update(rawWebhook).digest("hex");

      const hookRes = await PaymentService.handlePaystackWebhook(rawWebhook, validWebhookSig, webhookPayload);
      expect(hookRes.success).toBe(true);
      expect(state.payments.find((p) => p.id === "pay-other")?.status).toBe("paid");
      expect(state.orders.find((o) => o.id === "ord-other-2")?.payment_status).toBe("paid");
    });
  });
});

