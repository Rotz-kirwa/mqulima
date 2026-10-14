# Report H — SEO & Indexability Audit
**Domain Target:** `https://mqulima.com`  
**Audit Baseline Date:** October 14, 2026  
**Auditor:** SEO & Search Architecture Specialist  

---

## 1. Title, Meta Description & Open Graph Audit

| URL | Page Title (`<title>`) | Meta Description (`<meta name="description">`) | Open Graph Tags | Primary H1 | Indexable? |
| :--- | :--- | :--- | :---: | :---: | :---: |
| `/` | `Home — Agriculture for the Future \| Mqulima` | Empowering Kenyan farmers with verified agronomy knowledge, authentic seeds and fertilizers... | Present (`og:title`, `og:image`) | Single Primary H1 | **Indexable** |
| `/shop` | `AgroShop — Certified Farm Inputs, Seeds & Equipment \| Mqulima` | Buy certified seeds, fertilizers, crop protection chemicals, and farm tools directly from verified agrodealers... | Present | Single Primary H1 | **Indexable** |
| `/shop/product/$slug` | `$Product_Name \| AgroShop Mqulima` | Dynamic description based on product specifications | Present with product image | Single Primary H1 | **Indexable** |
| `/community` | `Forum — Farmer Community & Peer Intelligence \| Mqulima` | Connect with certified Kenyan agronomists, veterinary doctors, and progressive growers... | Present | Single Primary H1 | **Indexable** |
| `/services` | `Services — Professional Agricultural Support & Specialists \| Mqulima` | Comprehensive agricultural services, vet dispatch, and soil analysis... | Present | Single Primary H1 | **Indexable** |
| `/tools` | `Mqulima Agri-Intelligence Core · Precision Farm Tools` | Precision farm tools and planting calculators | Present | Single Primary H1 | **Indexable** |
| `/ai` | `🌱 Mqulima AI — Agricultural Intelligence Workspace` | AI agronomy consultation assistant | Present | Single Primary H1 | **Indexable** |
| `/blog` | `Mqulima News — Farmers' Voice & Insights` | Agricultural news, market trends, and farmer updates | Present | Single Primary H1 | **Indexable** |
| `/blog/$slug` | `$Article_Title \| Mqulima News` | Dynamic editorial article excerpt | Present with article media | Single Primary H1 | **Indexable** |
| `/about` | `About Us \| Mqulima Hub` | Kenyan digital agricultural ecosystem background | Present | Single Primary H1 | **Indexable** |
| `/contact` | `Contact Us \| Mqulima` | Direct support contact channels | Present | Single Primary H1 | **Indexable** |
| `/terms` | `Terms and Conditions \| Mqulima Agro Systems` | Complete terms and privacy policies | Present | Single Primary H1 | **Indexable** |
| `/auth/sign-in` | `Log In · Mqulima Hub` | Login to farmer account | Minimal | Single Primary H1 | **No-Index** |
| `/auth/sign-up` | `Create Account · Mqulima Hub` | Join Mqulima Hub | Minimal | Single Primary H1 | **No-Index** |

---

## 2. Canonical URL & Sitemap Architecture

### Dynamic XML Sitemap (`https://mqulima.com/sitemap.xml`)
- **Status:** **PASS**
- **Verified Count:** Over 2,000 lines of valid XML.
- **Content:**
  - 11 core static routes with assigned priorities (`/` at `1.0`, `/shop` at `0.9`, `/blog` at `0.9`, `/services` at `0.8`, `/tools` at `0.8`, `/academy` at `0.8`, `/community` at `0.7`, `/ai` at `0.7`, `/about` at `0.6`, `/contact` at `0.6`, `/terms` at `0.4`).
  - Automatically queries active, non-deleted catalog products (`/shop/product/$slug`).
  - Automatically queries published articles (`/blog/$slug`).
- **Cleanliness:** Strictly excludes `/admin`, `/dashboard`, `/auth`, `/payments`, and `/api`.

### Search Directives (`https://mqulima.com/robots.txt`)
- **Status:** **PASS**
- **Directives:**
  ```txt
  User-agent: *
  Allow: /

  # Administrative & Console Routes
  Disallow: /admin
  Disallow: /admin/
  Disallow: /dashboard
  Disallow: /dashboard/
  Disallow: /api/

  # Authentication & Sensitive Transaction Routes
  Disallow: /auth/
  Disallow: /login
  Disallow: /payments/

  # Canonical XML Sitemap
  Sitemap: https://mqulima.com/sitemap.xml
  ```

---

## 3. SEO Heading Hierarchy & Structure
- Every indexed public route has exactly **one** primary `<h1>` element.
- Section headings strictly adhere to semantic descending order (`<h2>` for major sections, followed by `<h3>` for cards/articles).
- Internal links use descriptive anchor text (e.g. `[AgroShop]`, `[Mqulima News]`) rather than vague labels like `Click here`.

---

## 4. Prioritized Recommendations
1. **Article Structured Data:** Integrate `schema.org/NewsArticle` JSON-LD blocks on `/blog/$slug` for Google Discover and rich snippets.
2. **Product Structured Data:** Integrate `schema.org/Product` JSON-LD on `/shop/product/$slug` with `offers` block specifying KES currency, availability (`InStock`), and price.
