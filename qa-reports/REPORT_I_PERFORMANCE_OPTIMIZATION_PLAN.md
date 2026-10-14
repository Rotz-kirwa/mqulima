# Report I — Performance Optimization Plan
**Project:** Mqulima Agriculture Ecosystem  
**Audit Baseline:** October 14, 2026  
**Auditor:** Quality & Performance Engineering  

---

## 1. Baseline Performance Measurements & Latency

| Endpoint / Page | Type | Cold Response Time | Warm Response Time | Throughput Bottleneck |
| :--- | :---: | :---: | :---: | :--- |
| `GET /api/products` | REST API | ~85 ms | **22 ms** | Database JSON serialization for 327 items |
| `GET /api/products?category=Fertilizers` | REST API | ~45 ms | **18 ms** | SQL taxonomy filter |
| `GET /api/news` | REST API | ~52 ms | **18 ms** | Database query for editorial articles |
| `GET /api/health` | REST API | ~14 ms | **10 ms** | DB ping latency |
| `/shop` (Marketplace) | SSR Page | ~180 ms | **62 ms** | Initial hydration of product cards |
| `/community` (Forum) | SSR Page | ~160 ms | **55 ms** | Post feeds rendering |
| `/blog` (News) | SSR Page | ~120 ms | **48 ms** | News card layout |
| `/` (Homepage) | SSR Page | ~140 ms | **45 ms** | Featured banners & weather components |

---

## 2. Completed Performance Optimizations (Before vs After)

### A. Elimination of N+1 Product Variant Queries
- **Before:** `/api/products` queried `product_variants` table individually for each product in a loop ($1 + N$ queries, where $N \le 50$), resulting in response times $> 280\text{ms}$.
- **After:** Implemented single batched query using `inArray(productVariants.productId, productIds)` with in-memory Map aggregation.
- **Result:** Latency dropped from $280\text{ms} \to 22\text{ms}$ (**92% improvement**).

### B. In-Memory SWR Caching on Products & News APIs
- **Before:** Uncached queries hit PostgreSQL on every page navigation and filter switch.
- **After:** Configured in-memory SWR (Stale-While-Revalidate) cache with a 60-second fresh window and 10-minute stale window, auto-invalidated on admin mutations or POS sync events.
- **Result:** Warm API hits respond in under $20\text{ms}$.

### C. Admin Module Lazy-Loading (`React.lazy`)
- **Before:** Admin console loaded all 13 heavy modules (Customer CRM, Payments Ledger, PDF generator, Charts) into a single initial bundle.
- **After:** Modules are split into independent chunks via dynamic `import()` and `React.lazy`, accompanied by route-based prefetching (`onMouseEnter`).
- **Result:** Admin initial payload reduced by $> 65\%$.

---

## 3. Top 5 Future Evidence-Backed Optimizations

| Rank | Optimization | Target Component | Expected Impact | Implementation Complexity |
| :---: | :--- | :--- | :---: | :---: |
| **1** | **Edge Redis Caching for Product Catalog** | `/api/products` | Near-zero DB load during marketing campaigns; response $< 10\text{ms}$ | Low (Upstash Redis integration) |
| **2** | **Image CDN Format Negotiation** | Remote POS images (`technolake.net`) | Auto AVIF/WebP conversion, reducing image transfer size by 40% | Low (ImageKit / Cloudflare Polish) |
| **3** | **PostgreSQL Full-Text Search Vector (`tsvector`)** | `products` table | Sub-5ms search on 100,000+ items replacing `LIKE %term%` | Medium (Add GIN index on `name_tsvector`) |
| **4** | **Virtual Scrolling for Admin CRM Table** | `CustomersModule.tsx` | Eliminates DOM bloat when viewing thousands of farmers | Low (`@tanstack/react-virtual`) |
| **5** | **Pre-Computed Category Facets** | `/shop` | Instant category pill count updates without full table scan | Low (Postgres trigger on category change) |
