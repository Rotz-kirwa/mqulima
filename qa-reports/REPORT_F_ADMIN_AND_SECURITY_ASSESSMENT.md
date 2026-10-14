# Report F — Admin & Security Assessment
**Platform:** Mqulima Agriculture Marketplace & Admin Platform  
**Auditor:** Quality & Security Engineering  
**Baseline Date:** October 14, 2026  

---

## 1. Authentication & Authorization Matrix

| User Role | Public Catalog | Customer Dashboard | Post Listings | Orders & Checkout | Admin Executive KPI | Admin CRM & KYC | Admin Analytics (GA4) | Forum Moderation |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **Anonymous Visitor** | Allowed | Denied (302) | Denied (302) | WhatsApp / Guest | Denied (401) | Denied (401) | Denied (401) | Denied (401) |
| **Registered Farmer / Customer** | Allowed | Allowed | Denied (Seller req) | Allowed (M-Pesa/Paystack) | Denied (401) | Denied (401) | Denied (401) | Denied (401) |
| **Verified Seller / Partner** | Allowed | Allowed | Allowed | Allowed | Denied (401) | Denied (401) | Denied (401) | Denied (401) |
| **Admin: Content Editor** | Allowed | Allowed | Allowed | Allowed | Allowed | Allowed (Read) | Allowed (Read) | Allowed (Full) |
| **Admin: Sales Agent** | Allowed | Allowed | Allowed | Allowed | Allowed | Allowed (Read/Update)| Allowed (Read) | Denied |
| **Admin: Executive Admin** | Allowed | Allowed | Allowed | Allowed | Allowed | Allowed (Full) | Allowed (Full) | Allowed (Full) |
| **Admin: Super Admin** | Allowed | Allowed | Allowed | Allowed | Allowed | Allowed (Full) | Allowed (Full) | Allowed (Full) |

---

## 2. Server-Side Protected API Verification
All administrative endpoints strictly invoke `requireAdminAuth(request, requiredPermission)` from `src/lib/api/admin-auth.server.ts`. 

Live endpoint probes without valid admin session tokens confirm consistent enforcement:
- `GET /api/admin/analytics`: **HTTP 401 Unauthorized** (Confirmed step 1263)
- `GET /api/admin/customers`: **HTTP 401 Unauthorized** (Confirmed step 1265)
- `GET /api/admin/orders`: **HTTP 401 Unauthorized** (Confirmed step 1267)
- `GET /api/admin/visitor-analytics`: **HTTP 401 Unauthorized**
- `POST /api/admin/products`: **HTTP 401 Unauthorized**

Frontend route redirection is never relied upon as the security boundary; server handlers validate JWT signatures and database profile permissions on every request.

---

## 3. Session Handling & Token Storage
- **Admin Authentication:** Issued via `POST /api/admin/login` using HS256 JWT tokens. Tokens are transmitted over HTTP-Only cookie (`mq_session`) or `Authorization: Bearer <token>` header.
- **In-Memory Cache:** `adminSessionCache` caches validated tokens for 60 seconds with LRU eviction (cap of 200 items), preventing database DOS during heavy administrative use.
- **Expiration & Logout:** Calling `/api/admin/logout` or clearing session triggers cookie invalidation (`Expires=Thu, 01 Jan 1970 00:00:00 GMT`), local storage cleanup, and immediate redirect to login.

---

## 4. Input Validation & Injection Defenses
- **SQL Injection Defense:** All queries utilize Drizzle ORM parameterization or `postgres` tagged template literals (e.g. `sql`SELECT ... WHERE id = ${userId}``). No dynamic string concatenation of raw user input into SQL exists.
- **UUID Validation:** Product query parameter `id` enforces regex validation (`/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i`) before querying UUID columns, preventing PostgreSQL type-cast runtime crashes.
- **XSS Sanitization:** Rich text descriptions and blog HTML are sanitized via DOMPurify / server-side HTML escape helpers (`sanitizeBlogHtml`) prior to rendering.

---

## 5. File Uploads & Storage Gating
- **Presigned URLs (`/api/upload/presign`):** File uploads to S3/storage buckets require authenticated sessions and validate MIME types (`image/jpeg`, `image/png`, `image/webp`).
- **News Media Size Guardrail:** `tests/news-lifecycle-and-guardrails.test.ts` validates that base64 payloads exceeding 500KB are rejected with HTTP 413 Payload Too Large. All existing records in `agritech_news` comply with this size threshold.

---

## 6. PII Protection & Logging Redaction
- **SMS & Logging Guardrails (`redactSensitiveMessage`):** Passwords, tokens, national IDs, and customer phone numbers are automatically redacted from system logs and outbound SMS notifications (`[REDACTED]`).
- **Telemetry Sanitizer:** `src/lib/analytics/sanitizer.ts` scrubs email addresses, Kenyan phone numbers (`+254...`, `07...`), and sensitive dictionary keys before dispatch to Google Analytics.

---

## 7. CSRF, Rate Limiting & Brute Force Protections
- **CSRF Verification:** State-changing customer endpoints require CSRF tokens issued via `ensureCsrfToken()`.
- **Admin Login Rate Limiting:** IP-based sliding window (`checkLoginRateLimit`) and account lockout (`checkBruteForceAccountLockout`) prevent credential stuffing.

---

## 8. Tests Not Performed & Safe Boundaries
- **Denial-of-Service / Volumetric Stress:** High-volume traffic floods were omitted to protect local process stability and container health.
- **Production Secret Extraction:** Live production secrets and API keys were never printed or inspected.
