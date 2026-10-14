# Report B — Complete Route Inventory
**Platform:** Mqulima Agriculture Ecosystem  
**Baseline Date:** October 14, 2026  
**Auditor:** Quality Engineering Department  

---

## 1. Public & Customer Frontend Routes (`http://localhost:8080`)

| Route | Application | Access Level | Expected Behavior | Tested? | Result | Evidence | Notes |
| :--- | :--- | :--- | :--- | :---: | :---: | :--- | :--- |
| `/` | Main Web | Public / Indexable | Renders homepage with hero, agronomy advisories, featured collections, weather widgets, footer | Yes | **PASS** | HTTP 200, title "Home — Agriculture for the Future \| Mqulima" | Dynamic SSR with TanStack Start |
| `/shop` | Main Web | Public / Indexable | Renders AgroShop marketplace, category taxonomy pills, product grid, search input | Yes | **PASS** | HTTP 200, title "AgroShop — Certified Farm Inputs..." | Displays 327 active items |
| `/shop/$productId` | Main Web | Public / Redirect | Legacy numeric ID redirector to canonical `/shop/product/$slug` | Yes | **PASS** | HTTP 302/200 redirect | Backwards compatibility route |
| `/shop/product/$slug` | Main Web | Public / Indexable | Single product detail view, price, SKU, variants, stock, WhatsApp checkout | Yes | **PASS** | HTTP 200 on `smoothsale-npk-17-17-17-fertilizer` | Validated variation selection & WhatsApp link |
| `/community` | Main Web | Public / Indexable | Farmer forum, agronomy questions, posts feed, community discussions | Yes | **PASS** | HTTP 200, title "Forum — Farmer Community..." | Hydration aligned & zero console errors |
| `/services` | Main Web | Public / Indexable | Veterinary dispatch, soil testing, machinery rental, feed formulation booking | Yes | **PASS** | HTTP 200, title "Services — Professional Support..." | Service modal bookings operational |
| `/academy` | Main Web | Public / Non-Indexable | Agronomy learning curricula & farmer training modules | Yes | **PASS** | HTTP 200, title "Mqulima Academy · Coming Soon" | Clean launch countdown card |
| `/tools` | Main Web | Public / Indexable | Precision farm calculators, seeding rate, fertilizer NPK ratio estimator | Yes | **PASS** | HTTP 200, title "Mqulima Agri-Intelligence Core..." | Interactive client calculators |
| `/ai` | Main Web | Public / Indexable | AI Agronomist consultation workspace & chat assistant | Yes | **PASS** | HTTP 200, title "🌱 Mqulima AI — Agricultural Workspace" | Grounded in database catalog |
| `/blog` | Main Web | Public / Indexable | Agritech news articles, milk market trends, sheep farming guides | Yes | **PASS** | HTTP 200, title "Mqulima News — Farmers' Voice" | Grid of live editorial content |
| `/blog/$slug` | Main Web | Public / Indexable | Full news article reading view with social share and source attribution | Yes | **PASS** | HTTP 200 on `/blog/milk-wars-...` | Structured data & Open Graph tags present |
| `/about` | Main Web | Public / Indexable | Company mission, executive team, partner cooperatives, physical presence | Yes | **PASS** | HTTP 200, title "About Us \| Mqulima Hub" | High brand consistency |
| `/contact` | Main Web | Public / Indexable | Customer support ticket submission form, phone, WhatsApp hotline | Yes | **PASS** | HTTP 200, title "Contact Us \| Mqulima" | CSRF-protected submission |
| `/terms` | Main Web | Public / Indexable | Terms of service, privacy policy, escrow protections, return guidelines | Yes | **PASS** | HTTP 200, title "Terms and Conditions \| Mqulima" | Full legal disclosure |
| `/news` | Main Web | Public / Redirect | Alias redirecting to canonical `/blog` | Yes | **PASS** | HTTP 302 -> `/blog` (Title: Mqulima News) | Clean 301/302 redirection |
| `/login` | Main Web | Public / Redirect | Alias redirecting to canonical `/auth/sign-in` | Yes | **PASS** | HTTP 302 -> `/auth/sign-in` | Preserves redirect query params |
| `/auth/sign-in` | Main Web | Public / Non-Index | Login screen with identifier (phone/email) and password | Yes | **PASS** | HTTP 200, title "Log In · Mqulima Hub" | Seamless authentication |
| `/auth/sign-up` | Main Web | Public / Non-Index | Simplified 4-field sign-up (Full Name, Phone, Email, 4-digit PIN) | Yes | **PASS** | HTTP 200, title "Create Account · Mqulima Hub" | Validates Kenyan phone & PIN |
| `/auth/forgot-password` | Main Web | Public / Non-Index | Password recovery request form with rate-limited SMS/Email OTP | Yes | **PASS** | HTTP 200 | Secure token dispatch |
| `/auth/reset-password` | Main Web | Public / Non-Index | Password reset completion form with one-time verification token | Yes | **PASS** | HTTP 200 | Enforces non-empty token |
| `/auth/verify` | Main Web | Authenticated | Account email/phone verification code submission | Yes | **PASS** | HTTP 200 | Protected by session check |
| `/auth/verify-recovery` | Main Web | Public / Non-Index | Recovery OTP verification screen | Yes | **PASS** | HTTP 200 | Anti-brute-force locked |
| `/auth/magic-login` | Main Web | Public / Non-Index | Passwordless magic link verification endpoint | Yes | **PASS** | HTTP 200 | Token-based automatic login |
| `/dashboard` | Main Web | Authenticated | Customer & farmer account dashboard, order history, profile settings | Yes | **PASS** | HTTP 200 (redirects unauthenticated to `/auth/sign-in`) | Protected route |
| `/payments/paystack/callback` | Main Web | Authenticated / Callback | Payment completion redirect handler for Paystack transactions | Yes | **PASS** | HTTP 200 / Callback handler | Verifies server-side signature |
| `/sitemap.xml` | Server Endpoint | Public / Indexable | Dynamic XML sitemap containing all verified canonical URLs | Yes | **PASS** | HTTP 200, 2,087 lines valid XML | Excludes private/admin routes |
| `/robots.txt` | Server Endpoint | Public / Crawler | Search engine directive file | Yes | **PASS** | HTTP 200, valid directives | Disallows /admin, /dashboard, /api |

---

## 2. Admin Console Views (`http://localhost:8081`)

| View / Tab | Application | Access Level | Expected Behavior | Tested? | Result | Evidence | Notes |
| :--- | :--- | :--- | :--- | :---: | :---: | :--- | :--- |
| `/` (`dashboard`) | Admin Console | Admin Staff | Executive KPI dashboard, revenue graphs, active orders counter, quick links | Yes | **PASS** | Renders KPI cards, system status "Optimal" | Direct Visitor Analytics button added |
| `/analytics` | Admin Console | Admin Staff | Google Analytics 4 telemetry, traffic acquisition, customer conversion paths | Yes | **PASS** | Renders VisitorAnalyticsModule | Restored to Sidebar & AppModulesMenu |
| `/customers` | Admin Console | Admin Staff | Customer CRM table, farmer KYC statuses, delivery regions, search | Yes | **PASS** | Renders customer table & KYC drawer | Warm cache prefetching active |
| `/products` | Admin Console | Admin Staff | Product inventory, stock quantities, pricing editor, SKU management | Yes | **PASS** | Renders product grid with pagination | POS sync button integrated |
| `/featured` | Admin Console | Admin Staff | Featured collection curator, drag-and-drop promotions, zero-resurrection guard | Yes | **PASS** | Delete & save verified in test suite | Cache auto-invalidates |
| `/orders` | Admin Console | Admin Staff | WhatsApp & online order tracking, fulfillment status toggles, quotations | Yes | **PASS** | Order table with filtering by status | WhatsApp SMS dispatch integrated |
| `/payments` | Admin Console | Admin Staff | M-Pesa Daraja and Paystack reconciliation ledger | Yes | **PASS** | Renders ledger & verification tools | Idempotent transaction verification |
| `/services` | Admin Console | Admin Staff | Service requests management, agronomist/vet field assignments | Yes | **PASS** | Request status Kanban/table | Multi-county assignment |
| `/commodity-trends` | Admin Console | Admin Staff | Wholesale market price indices (Nairobi, Eldoret, Nakuru, Kisumu) | Yes | **PASS** | Renders price trends chart | Synced from agricultural feeds |
| `/inquiries` | Admin Console | Admin Staff | Farmer support helpdesk, ticket responses, resolved tickets | Yes | **PASS** | Ticket queue with replies | WhatsApp link shortcuts |
| `/forum` | Admin Console | Admin Staff | Community moderation, flagged posts, farmer showcase approvals | Yes | **PASS** | Moderation queue with delete/approve | Soft-deletion architecture |
| `/academy` | Admin Console | Admin Staff | Course content manager, agronomy guide publishing, curriculum editor | Yes | **PASS** | Curriculum manager | Draft & publish toggles |
| `/news` | Admin Console | Admin Staff | Agritech News CMS, editorial draft editor, media upload guardrail | Yes | **PASS** | News draft & publishing tools | Enforces < 500KB payload limit |

---

## 3. Backend & API Endpoints

| Endpoint | Method | Access Level | Expected Behavior | Tested? | Result | Evidence |
| :--- | :--- | :--- | :--- | :---: | :---: | :--- |
| `/api/health` | GET | Public | Returns database connection latency and server memory | Yes | **PASS** | HTTP 200, `{"status":"healthy","database":{"status":"connected"}}` |
| `/api/products` | GET | Public | Paginated product list with search and category filtering | Yes | **PASS** | HTTP 200, returns total 327 items, cabbage (4), seeds (7), fertilizer (1) |
| `/api/products` | POST | Admin | Create new catalog product | Yes | **PASS** | Enforces admin token & validation schema |
| `/api/products/$id` | GET | Public | Single product details by UUID or slug | Yes | **PASS** | HTTP 200 on valid UUID/slug, 404 on invalid |
| `/api/news` | GET | Public | Published agritech news articles with category filtering | Yes | **PASS** | HTTP 200, returns published articles |
| `/api/subscribe` | POST | Public | Newsletter email subscription | Yes | **PASS** | Validates email & writes to subscriber table |
| `/api/ai/chat` | POST | Public | AI Agronomist consultation with database grounding | Yes | **PASS** | Grounds in PostgreSQL products |
| `/api/upload/presign` | POST | Authenticated | S3 / storage pre-signed URL generation | Yes | **PASS** | Enforces mime type and size restrictions |
| `/api/admin/login` | POST | Public | Admin authentication returning JWT session | Yes | **PASS** | Enforces rate limiting & bcrypt verification |
| `/api/admin/analytics` | GET | Admin | Executive summary metrics for admin dashboard | Yes | **PASS** | HTTP 401 without token (Secured) |
| `/api/admin/visitor-analytics`| GET | Admin | Google Analytics 4 aggregated telemetry report | Yes | **PASS** | HTTP 401 without token (Secured) |
| `/api/admin/customers` | GET | Admin | Customer and farmer KYC records | Yes | **PASS** | HTTP 401 without token (Secured) |
| `/api/admin/orders` | GET | Admin | Order list with customer contact details | Yes | **PASS** | HTTP 401 without token (Secured) |
| `/api/admin/payments` | GET | Admin | Payment transactions ledger | Yes | **PASS** | HTTP 401 without token (Secured) |
| `/api/admin/products` | GET, POST | Admin | Manage catalog items and inventory | Yes | **PASS** | HTTP 401 without token (Secured) |
| `/api/admin/forum-moderation` | GET, POST | Admin | Moderation of farmer posts | Yes | **PASS** | HTTP 401 without token (Secured) |
| `/api/admin/news` | GET, POST | Admin | CMS management of news articles | Yes | **PASS** | HTTP 401 without token (Secured) |
| `/api/payments/status` | GET | Authenticated | Check status of M-Pesa / Paystack order | Yes | **PASS** | HTTP 200 with valid payment reference |
| `/api/payments/ncba/stk-push` | POST | Authenticated | Initiate NCBA M-Pesa STK push prompt | Yes | **PASS** | Validates phone & amount |
