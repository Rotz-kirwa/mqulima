# Mqulima — Google Analytics 4 (GA4) Integration Reference

## 1. Web Stream & Production Details
- **Platform**: Mqulima — Africa's 360° agriculture ecosystem
- **Production Domain**: `https://mqulima.com`
- **GA4 Measurement ID**: `G-G1QQTG8YJT`
- **GA4 Web Stream Name**: `Mqulima Website`
- **GA4 Web Stream ID**: `16122564617`
- **Default Currency**: `KES` (Kenyan Shilling)
- **Timezone**: `Africa/Nairobi` (EAT / UTC+3)

---

## 2. Initialization & Lifecycle
- **Entrypoint**: `src/lib/analytics/ga4.ts`
- **Google Tag**: Official `gtag.js` asynchronously injected via `https://www.googletagmanager.com/gtag/js?id=G-G1QQTG8YJT`.
- **SSR Safety**: Guards against server-side rendering (`typeof window === "undefined"` and `typeof document === "undefined"`).
- **Duplicate Prevention**:
  - Global singleton flag `isGaInitialized` ensures `gtag.js` is injected only once.
  - Initial configuration sets `send_page_view: false` to disable automatic initial page-views that would clash with TanStack Router.
- **Environment Gating**:
  - In automated test runs (`MODE === "test"`), script injection is suppressed to keep test runners isolated.
  - On `localhost` / `127.0.0.1`, hits are paused by default to prevent development activity from polluting production stream `16122564617`.
  - Local developers can opt in to live testing using `VITE_ENABLE_DEV_ANALYTICS=true` in `.env` or appending `?ga_debug=true` to the URL to view events in GA4 DebugView.
  - In production (`mqulima.com`), tracking is active automatically.

---

## 3. Client-Side Route Tracking
- **Component**: `src/components/analytics/AnalyticsRouteTracker.tsx` (mounted in `src/routes/__root.tsx`).
- **Router Hook**: Uses `@tanstack/react-router` `useLocation()` to track internal route transitions.
- **Deduplication**: `lastTrackedKeyRef` tracks `pathname` changes and ignores React Strict Mode remounts and hash-only fragments.
- **URL Sanitization**: `sanitizeUrl()` strips sensitive query parameters (e.g., `token`, `auth`, `otp`, `password`, `email`, `phone`) while preserving standard UTM marketing campaign tags (`utm_source`, `utm_medium`, `utm_campaign`, `utm_term`, `utm_content`, `ref`).
- **Payload Emitted**:
  - `page_path`: Normalized canonical route (e.g. `/shop`, `/services`, `/tools`).
  - `page_title`: Document title or fallback (`Mqulima Hub`).
  - `page_location`: Sanitized browser location URL.
  - `page_category`: First path segment (e.g. `shop`, `services`, `academy`).

---

## 4. Google Consent Mode v2 & Privacy Safeguards
- **Consent Manager**: `src/lib/analytics/consent.ts` & `src/components/analytics/AnalyticsConsentBanner.tsx`.
- **Consent Mode v2 Defaults**:
  ```javascript
  gtag('consent', 'default', {
    'analytics_storage': 'denied',
    'ad_storage': 'denied',
    'ad_user_data': 'denied',
    'ad_personalization': 'denied',
    'wait_for_update': 500
  });
  ```
- **User Actions**:
  - **Accept All**: Grants `analytics_storage` and `ad_storage`.
  - **Reject Optional**: Keeps optional cookies denied. No custom events or page views are dispatched to `gtag`.
  - **Customize**: Granular choice for Analytics vs. Marketing cookies.
  - **Reopen Preferences**: A floating shield icon allows visitors to update their consent choices at any time.
- **PII Scrubbing**: `src/lib/analytics/sanitizer.ts` recursively strips:
  - Email addresses (`[REDACTED_EMAIL]`)
  - Kenyan phone numbers (`+254...`, `07...`) -> (`[REDACTED_PHONE]`)
  - Auth tokens, JWTs, and Bearer tokens (`[REDACTED_TOKEN]`)
  - Passwords, OTP codes, and national IDs (`[REDACTED_ID]`)

---

## 5. Event Taxonomy & Features Instrumented

Mqulima instruments real platform features using both official GA4 recommended event names and custom domain events:

| Event Name | GA4 Standard | Trigger Action & File | Parameters |
|---|---|---|---|
| `page_view` | `page_view` | Initial load & TanStack Router navigation (`AnalyticsRouteTracker.tsx`) | `page_path`, `page_title`, `page_location`, `page_category` |
| `site_search` | `search` | Header search bar submission (`Navbar.tsx`) | `search_term`, `search_type` |
| `navigation_clicked` | Custom | Header & mobile menu clicks (`Navbar.tsx`) | `link_name`, `destination_url`, `menu_location` |
| `sign_up_started` | Custom | User starts registration (`auth.sign-up.tsx`) | `method` |
| `sign_up_completed` | `sign_up` | Account registration success (`auth.sign-up.tsx`) | `method: "credentials" \| "phone"` |
| `login_completed` | `login` | Successful authentication (`auth.sign-in.tsx`) | `method: "credentials"` |
| `logout_completed` | Custom | User signs out (`src/lib/auth.tsx`) | None |
| `password_reset_requested` | Custom | Forgot password code requested (`auth.forgot-password.tsx`) | `recovery_channel: "sms" \| "email"` |
| `marketplace_opened` | `view_item_list` | Visitor opens AgroShop (`shop/index.tsx`) | `item_list_name: "AgroShop Catalog"` |
| `product_viewed` | `view_item` | Product modal or page viewed (`ProductQuickViewModal.tsx`, `shop/product.$slug.tsx`) | `items: [{ item_id, item_name, item_category, price }]`, `currency: "KES"`, `value` |
| `product_category_selected` | `view_item_list` | Category pill clicked (`shop/index.tsx`) | `item_list_name`, `category` |
| `product_search_performed` | `search` | Search query in shop catalog (`shop/index.tsx`) | `search_term` |
| `add_to_cart` | `add_to_cart` | Item added to cart (`cart-context.tsx`) | `items: [{ item_id, item_name, price, quantity }]`, `currency: "KES"`, `value` |
| `checkout_started` | `begin_checkout` | Checkout drawer opens (`CartDrawer.tsx`) | `items`, `currency: "KES"`, `value: cart_total` |
| `purchase_completed` | `purchase` | Payment success callback (`payments.paystack.callback.tsx`, `CartDrawer.tsx`) | `transaction_id`, `value`, `currency: "KES"`, `items` |
| `contact_form_started` | Custom | Contact form field focused (`ContactForm.tsx`) | None |
| `contact_form_submitted` | `generate_lead` | Contact inquiry sent (`ContactForm.tsx`) | `lead_type`, `user_type`, `subject_category` |
| `contact_form_failed` | Custom | Contact form submission error (`ContactForm.tsx`) | `error_reason` |
| `quotation_requested` | `generate_lead` | Service quotation requested (`services.tsx`) | `service_name`, `destination_county`, `currency` |
| `agricultural_service_viewed` | `service_request` | Agricultural service card viewed (`services.tsx`) | `service_id`, `service_name`, `service_category` |
| `weather_forecast_viewed` | `weather_view` | Weather tool opened (`tools.tsx`) | `county`, `region` |
| `market_price_viewed` | `market_prices_view` | Wholesale commodity prices viewed (`tools.tsx`) | `commodity_category: "wholesale_kamis"` |
| `ai_assistant_used` | `ai_assistant_use` | Crop Doctor / chat prompt sent (`FloatingAIChat.tsx`, `ai.tsx`) | `feature_name: "crop_doctor" \| "chat_prompt"` |
| `academy_course_viewed` | `academy_content_view` | Academy lesson viewed (`academy.tsx`) | `course_id`, `course_title`, `course_category` |
| `community_post_viewed` | `community_interaction` | Community forum post viewed (`community.tsx`) | `post_id`, `post_category`, `interaction_type` |

---

## 6. Environment Variables

### Client-Side (Vite / Public)
```env
# Public GA4 Measurement ID for Mqulima Website
VITE_GA_MEASUREMENT_ID=G-G1QQTG8YJT

# Local testing flag (set to true to test hits from localhost, defaults to false)
VITE_ENABLE_DEV_ANALYTICS=false

# Optional Microsoft Clarity Session Recording
# VITE_CLARITY_PROJECT_ID=
```

### Server-Side (Admin Reporting at `/admin/analytics` via Google Analytics Data API)
```env
# Numeric Property ID from Google Analytics Admin -> Property Details
GA4_PROPERTY_ID=

# Service Account Credentials (select one):
# Option A: Inlined credentials (recommended for Vercel)
GOOGLE_SERVICE_ACCOUNT_EMAIL=
GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY=

# Option B: Local file path (development)
GOOGLE_APPLICATION_CREDENTIALS=
```

---

## 7. Verification & Testing

### A. Testing Locally with DebugView
1. Start the local server:
   ```bash
   npm run dev
   ```
2. Navigate in browser with the debug query parameter:
   ```
   http://localhost:3000?ga_debug=true
   ```
3. Accept the Cookie Consent Banner.
4. In Google Analytics, navigate to **Admin** -> **DebugView**.
5. Observe events streaming in real-time (`page_view`, `view_item`, `search`, etc.).

### B. Testing in Production (GA4 Realtime)
1. Deploy the application to Vercel.
2. Visit `https://mqulima.com`.
3. Accept cookie consent on the banner.
4. Open **Google Analytics** -> **Reports** -> **Realtime**.
5. You will see active users on `mqulima.com` with their page locations and events.

### C. Running Automated Checks
Run the test suite:
```bash
npx vitest run tests/analytics.test.ts
```
Expected output: 18 passing tests covering PII sanitization, URL stripping, consent preferences, RBAC permissions, and event dispatching.
