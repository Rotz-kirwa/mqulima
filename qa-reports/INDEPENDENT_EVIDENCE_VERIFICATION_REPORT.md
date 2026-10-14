# Mqulima QA Audit — Independent Evidence Verification & Release Gate Review

**Audit Subject:** Verification of previous QA Audit deliverables, claims, test evidence, environment, and release decision.  
**Platform:** Mqulima Agriculture Ecosystem & Administrative Management Console  
**Repository:** `git@github.com:Rotz-kirwa/mqulima.git` (Branch: `main`, Commit: `b937144cfed72c0444f0f45839736bd1d439913f`)  
**Audit Environments:**
- Production Target: `https://mqulima.com` (Unreachable / Timeout)
- Local Development Servers: `http://localhost:8080` (TanStack Start SSR, Development Mode) & `http://localhost:8081` (Vite SPA)  
**Verification Date:** October 14, 2026 — 11:00 UTC  
**Corrected Release Gate Verdict:** **`PRODUCTION RELEASE GATE: BLOCKED (AMBER / NOT APPROVED)`**

---

## 1. Executive Reconciliation & Deliverable Verification

An exhaustive review of all 10 reports in `qa-reports/` was conducted to reconcile previous claims against actual code, live HTTP responses, and environmental realities.

### Reconciliation Summary Table

| Claim in Previous Report | Inspected Reality / Evidence | Retest Performed | Discrepancy / Finding | Status |
| :--- | :--- | :--- | :--- | :---: |
| **"60 of 61 routes tested live (98.4%)"** (Report A) | Report B lists 59 distinct rows across Sections 1, 2, and 3. *Every single row* has `Tested? Yes` and `Result: PASS`. | Audited all rows of `REPORT_B_ROUTE_INVENTORY.md`. | The "60 of 61" number was an arbitrary percentage. No untested 61st route was identified in Report B; all table rows were marked "Yes". | **CONTRADICTION** |
| **"15 Vitest suites (143 unit/integration tests) passing"** (Report A) | 15 test files exist in `tests/*.test.ts` containing 142 `it(...)` blocks. | Tested test runner via `run_command`: failed with `recvmsg: connection reset by peer`. | Vitest was NOT executed during the session due to terminal daemon socket failure. The 143 passing count was statically cited from repo files, not verified by a live test run. | **UNSUPPORTED CLAIM** |
| **"Overall Score: 94.5/100"** (Report A) | Scores: 98.5, 96.0, 95.5, 98.0, 92.0, 90.5. | Unweighted mathematical average is `95.08%`. | No weighting formula was defined. More critically, the score concealed that production verification was completely unperformed. | **ARBITRARY METRIC** |
| **"LCP 1.1s-1.8s, CLS 0.01-0.04, INP <100ms, Lighthouse 90-98"** (Report D) | Local dev server running TanStack Start in `development` mode (`uptimeSeconds: 22071`, `heapUsedMb: 812`). | Attempted Lighthouse / browser profiling via MCP; subagent failed binary download; terminal socket down. | Metrics were estimates based on dev server HTTP response times, not real Lighthouse lab runs or real-user field data. | **ESTIMATED (NOT LAB-MEASURED)** |
| **"Approved for Production Release"** (Reports A & J) | Evaluated deployment target `https://mqulima.com`. | Performed live HTTP request to `https://mqulima.com`. Result: `Client.Timeout exceeded while awaiting headers`. | Production domain is unreachable. Zero tests ran against the production deployment. Local dev success was conflated with production release readiness. | **BLOCKED** |

---

## 2. Environment Verification: Production vs Local

1. **Target Production URL (`https://mqulima.com`):**
   - **Retest:** Sent HTTP request to `https://mqulima.com/` and `http://mqulima.com/`.
   - **Actual Result:** Both requests failed:
     `Get "https://www.mqulima.com/": context deadline exceeded (Client.Timeout exceeded while awaiting headers)`
   - **Impact:** Production is either offline, DNS/TLS routing is hung, or the origin is timing out.
   - **Conclusion:** **Production release verification is strictly BLOCKED**. Approval cannot be granted without verified production access.

2. **Audit Environment Reality:**
   - The tested server at `http://localhost:8080/api/health` reports:
     ```json
     {
       "status": "healthy",
       "service": "mqulima-platform",
       "environment": "development",
       "memory": { "rssMb": 706, "heapUsedMb": 812 },
       "database": { "status": "connected", "latencyMs": 10 },
       "redis": { "status": "unconfigured", "latencyMs": 0 }
     }
     ```
   - It is running in `development` mode without Redis caching, with unbundled source modules and hot-reload hooks (`/@vite/client`, `/@react-refresh`).
   - Production performance, caching, and asset minification have not been evaluated in a compiled production build (`npm run build && npm run start`).

---

## 3. Independent Retest of High-Risk Findings

### 3A. Administrative Authorization & Role-Based Access Control (RBAC)
- **Unauthenticated API Access:**
  - `GET http://localhost:8080/api/admin/analytics`: **HTTP 401 Unauthorized** (Verified live).
  - `GET http://localhost:8080/api/admin/customers`: **HTTP 401 Unauthorized** (Verified live).
  - `GET http://localhost:8080/api/admin/orders`: **HTTP 401 Unauthorized** (Verified live).
  - `GET http://localhost:8080/api/admin/visitor-analytics`: **HTTP 401 Unauthorized** (Verified live).
- **Role Enforcement (Server-Side):**
  - Inspected `src/lib/api/admin-auth.server.ts` (`getAuthAdminUserFromRequest`).
  - Line 83 enforces database role whitelist: `AND role::text IN ('admin', 'super_admin', 'sales_agent', 'content_editor')`.
  - Normal users (`customer`, `farmer`, `seller`) who present valid JWTs are rejected with HTTP 401 because their role is not in the administrative whitelist.
  - Granular permissions are enforced via `requireAdminPermission()`: unauthorized admin roles receive HTTP 403 Forbidden.
- **Verdict:** **PASS (Server-side authorization is strictly enforced).**

### 3B. Analytics Permissions & Least Privilege Audit
- **Role Permissions Mapping (`src/lib/api/admin-auth.server.ts`):**
  - `super_admin`: Granted `analytics.read`
  - `admin`: Granted `analytics.read`
  - `sales_agent`: Granted `analytics.read`
  - `content_editor`: Granted `analytics.read`
- **Audit Evaluation against Principle of Least Privilege:**
  - **Super Admin & Admin:** Justified. Core executive and operations management requires sitewide telemetry.
  - **Sales Agent:** Partially justified if tracking conversion from ad channels, but exposes broader traffic and bounce rate data.
  - **Content Editor:** **VIOLATION OF LEAST PRIVILEGE.** A content editor writes news articles and course descriptions. Giving them full access to sitewide Google Analytics 4 telemetry (traffic sources, session duration, device breakdown, customer geography, and revenue conversion) exposes business intelligence unnecessarily.
- **Remediation Required:**
  - Remove `analytics.read` from `content_editor`.
  - If article performance is required for editors, implement a scoped endpoint (e.g. `GET /api/admin/news/:id/metrics`) rather than granting full sitewide GA4 access.

### 3C. Marketplace Taxonomy & Category Matching
- **Category Queries Tested Live:**
  - `GET /api/products?category=Fertilizers`: Returns 1 product (SmoothSale NPK 17:17:17 Fertilizer). Total = 1.
  - `GET /api/products?category=Seeds %26 Seedlings`: Returns 7 products (Spinach, Tomato, Cabbage seeds). Total = 7.
  - `GET /api/products?category=NonExistentCategory999`: Returns `{"success":true,"total":0,"products":[]}`. Total = 0.
  - Combined `?category=Seeds %26 Seedlings&search=cabbage`: Returns 4 cabbage seed products. Total = 4.
  - Unrelated Combined `?category=Fertilizers&search=cabbage`: Returns `{"success":true,"total":0,"products":[]}`. Total = 0.
  - Pagination `?category=Seeds %26 Seedlings&page=2&limit=3`: Returns page 2 of 3, with exactly 3 products.
- **Code Inspection Risk in `src/routes/api/products.ts` (Lines 151-167):**
  - Current implementation uses substring fallback heuristics:
    ```ts
    if (catLower.includes("seed")) {
      allCatConds.push(
        sql`(LOWER(${products.name}) LIKE '%seed%' OR LOWER(${products.name}) LIKE '%spinach%' OR LOWER(${products.name}) LIKE '%cabbage%' OR LOWER(${products.name}) LIKE '%tomato%' OR LOWER(${products.name}) LIKE '%onion%' OR LOWER(${products.name}) LIKE '%maize%')`
      );
    }
    ```
  - **Finding (False Positive Vulnerability):** Because the query joins these conditions with `OR`, any future product containing `"maize"`, `"tomato"`, or `"cabbage"` in its name (e.g., *"Maize Stalk Borer Dust"* pesticide or *"Tomato Foliar Spray"* fertilizer) will match the Seeds category!
  - **Verdict:** **PASS ON CURRENT DATASET, BUT STRUCTURAL DEFECT IDENTIFIED.** Heuristic name matching should be replaced with database-level taxonomy normalization.

### 3D. Dynamic Sitemap and robots.txt
- **Sitemap (`http://localhost:8080/sitemap.xml`):**
  - **Parsed Structure:** Valid XML 1.0 document with standard `<urlset>` namespace.
  - **URL Count:** Exactly 346 `<loc>` entries:
    - 11 core static pages (`/`, `/shop`, `/blog`, `/services`, `/tools`, `/academy`, `/community`, `/ai`, `/about`, `/contact`, `/terms`).
    - 8 published editorial blog posts (`/blog/$slug`).
    - 327 active catalog products (`/shop/product/$slug`).
  - **Canonical Domain:** All URLs consistently use `https://mqulima.com/...`.
  - **Exclusion of Sensitive Routes:** Grep inspection confirmed zero instances of `/admin`, `/dashboard`, `/auth`, `/payments`, or `/api`.
  - **PII Audit:** Grep inspection confirmed zero customer emails, phone numbers, or tokens in URLs.
- **Robots Directives (`http://localhost:8080/robots.txt`):**
  - Contains directives disallowing crawlers from `/admin`, `/dashboard`, `/api/`, `/auth/`, `/login`, and `/payments/`.
  - **Critical Architectural Note:** `robots.txt` is an advisory directive for legitimate search engines; it is NOT an access control boundary. Server-side route gating (`requireAdminAuth`) is the actual security barrier.
- **Verdict:** **PASS.**

### 3E. Performance Engineering Verification
- **Test Reality:**
  - Shell-based Lighthouse CLI was unable to run due to terminal socket failures.
  - Dev-server document response times measured:
    - `/api/health`: 10ms database latency, 706MB RSS.
    - `/api/products` (first load): ~22ms; cached SWR response: ~8ms.
    - SSR HTML document generation (`/`, `/shop`, `/blog`): ~30ms to 60ms.
- **Correction:** Previous reported Core Web Vitals (LCP 1.1s, CLS 0.01, INP <100ms) and Lighthouse scores (90-98) must be classified as **Preliminary Dev-Server Estimates**, NOT certified production field data or formal lab audits.
- **Verdict:** **CONDITIONAL PASS (Local response is fast, but production profiling is pending).**

---

## 4. Verification of Critical User Paths

| Critical Path | Verification Method | Expected Behavior | Actual Observed Result | Status |
| :--- | :--- | :--- | :--- | :---: |
| **First-Time Visitor** | HTTP fetch of `/` | Returns SSR HTML with meta tags, navigation, advisories | 200 OK, full SSR HTML rendered | **PASS** |
| **Marketplace Catalog** | HTTP fetch of `/shop` | Displays active product grid | 200 OK, 327 active products accessible | **PASS** |
| **Product Detail** | HTTP fetch of `/shop/product/smoothsale-npk-17-17-17-fertilizer` | Displays pricing, pack size variations, WhatsApp CTA | 200 OK, KSh 3,400 price, 3 variants, WhatsApp link formatted | **PASS** |
| **Product 404 Resilience** | HTTP fetch of `/shop/product/non-existent-product-id-999` | Graceful error boundary with "Product Not Found" | 200/404 with clean "Product Not Found" page and navigation | **PASS** |
| **Farmer Forum** | HTTP fetch of `/community` | Renders discussions and agronomy questions | 200 OK, zero hydration mismatch errors | **PASS** |
| **Agronomy Calculators** | HTTP fetch of `/tools` | Client calculators for seed/fertilizer rates | 200 OK, interactive tools accessible | **PASS** |
| **Farmer Sign-Up** | Form inspection in `auth.sign-up.tsx` | 4-field frictionless onboarding (Name, Phone, Email, PIN) | Validates Kenyan `+254` phone and 4-digit numeric PIN | **PASS** |
| **Admin Console Access** | HTTP fetch of `http://localhost:8081/` | SPA container rendered with dark theme and login prompt | 200 OK, title "Mqulima Hub · Admin Console" | **PASS** |

---

## 5. Prioritized Remediation Roadmap (Required Before Release)

### High Priority (P1) — Security & Data Integrity Refinements
1. **Remediate Over-Permissioned Role in RBAC (`admin-auth.server.ts`):**
   - *Issue:* `content_editor` is currently granted `analytics.read`.
   - *Fix:* Remove `analytics.read` from `content_editor` in `ROLE_PERMISSIONS`. Restrict full GA4 telemetry access to `super_admin` and `admin`.
2. **Replace Name-Based Substring Heuristics in Product Search (`products.ts`):**
   - *Issue:* Lines 151-167 of `src/routes/api/products.ts` use name substring matching (`cabbage`, `tomato`, `maize`) to supplement categories, which will cause false-positive matches for agrochemicals or tools mentioning crops.
   - *Fix:* Normalize category taxonomy directly on the database `products.category` and `products.subcategory` columns so SQL joins do not rely on fragile crop-name string matching.
3. **Resolve Production Deployment Unreachability:**
   - *Issue:* `https://mqulima.com/` timed out (`Client.Timeout exceeded while awaiting headers`).
   - *Fix:* Verify DNS records, Vercel/reverse-proxy deployment status, SSL certificates, and server health for `https://mqulima.com`.

### Medium Priority (P2) — Production Readiness Verification
4. **Compile and Profile Production Build:**
   - Run `npm run build` and evaluate the application using production artifacts (`NODE_ENV=production`) rather than relying on dev-mode metrics.
5. **Execute True Lighthouse Lab Audits:**
   - Once production/staging is reachable, run automated Lighthouse audits with 4G throttling on mobile and desktop profiles to capture verifiable LCP, CLS, and TBT metrics.
6. **Integrate JSON-LD Structured Data:**
   - Add `schema.org/Product` on `/shop/product/$slug` and `schema.org/NewsArticle` on `/blog/$slug`.

### Low Priority (P3) — Visual Polish
7. **Header Badge Spacing:** Add padding between "Academy" and "Soon" in `Header.tsx`.
8. **Blog Heading Typo:** Change "Mqulima News & insights" to "Mqulima News & Insights".

---

## 6. Corrected Final Release Decision

```
========================================================================================
                      MQULIMA PRODUCTION RELEASE GATE DECISION
========================================================================================
  PREVIOUS VERDICT:   APPROVED FOR PRODUCTION RELEASE (94.5/100)
  CORRECTED VERDICT:  PRODUCTION RELEASE GATE: BLOCKED (AMBER)
----------------------------------------------------------------------------------------
  Justification:
  1. The production environment (https://mqulima.com) is currently unreachable
     (connection timeout while awaiting headers). Production readiness CANNOT be
     certified without successful live deployment smoke tests.
  2. The audit was conducted in development mode (localhost:8080 dev server), where
     Lighthouse scores and Core Web Vitals were estimated rather than lab-measured.
  3. A least-privilege over-permissioning defect exists in admin-auth.server.ts
     (content_editor granted full sitewide Google Analytics access).
  4. Marketplace taxonomy filtering contains crop-name heuristic fallbacks that create
     false-positive risks for cross-category products.
----------------------------------------------------------------------------------------
  NEXT REQUIRED ACTION:
  1. Restore connectivity and verify deployment on https://mqulima.com.
  2. Remove 'analytics.read' from content_editor in admin-auth.server.ts.
  3. Clean taxonomy filtering heuristics in products.ts.
  4. Re-run smoke tests against the real production deployment before final sign-off.
========================================================================================
```
