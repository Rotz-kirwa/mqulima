# Google Analytics 4 (GA4) & Admin Analytics Dashboard Integration Guide

This guide details how to configure, verify, deploy, and maintain the visitor tracking and server-side reporting system for **Mqulima** across production, preview, and local development environments.

---

## Architecture Overview

Mqulima uses a modern, privacy-first analytics architecture:
1. **Client-Side Tracking (`src/lib/analytics/`)**:
   - Google Tag (`gtag.js`) loaded asynchronously in the browser only with `send_page_view: false`.
   - **Google Consent Mode v2** defaults to `denied` for optional storage until the user provides consent via the `<AnalyticsConsentBanner />`.
   - TanStack Router client-side route tracking via `<AnalyticsRouteTracker />` prevents duplicate page views and double-counting during client-side navigation.
   - Deep PII Sanitizer strips emails, Kenyan phone numbers (`+254...`, `07...`), auth tokens, passwords, OTPs, and national IDs from all events before emitting.
   - Microsoft Clarity integration loaded optionally, separate from GA4, and strictly consent-governed.
2. **Server-Side Reporting (`src/lib/server/ga4-reporting.server.ts` & `/api/admin/visitor-analytics`)**:
   - Uses the official Google Analytics Data API (`@google-analytics/data` `BetaAnalyticsDataClient`).
   - Authenticated with a Google Cloud Service Account possessing read-only "Viewer" rights on the GA4 property.
   - Protected by Mqulima Admin RBAC (`adminFetch`, session cookie, and `analytics.read` permission).
   - In-memory 5-minute cache with rate-limit and quota awareness.
   - Graceful fallback: If credentials are not yet configured, returns a helpful setup wizard rather than crashing or showing fabricated data.
3. **Admin Dashboard (`admin/src/components/modules/VisitorAnalyticsModule.tsx`)**:
   - Integrated directly into the Mqulima Admin Console (`#0F3D3C` / `#278C7B` design system).
   - Real-time KPIs, daily trend charts, traffic acquisition channels, top pages, geographic/device breakdown, and custom agricultural domain events.

---

## 1. Google Analytics 4 Property Setup

### Step 1.1: Create a GA4 Property
1. Navigate to the [Google Analytics Admin Console](https://analytics.google.com/).
2. Click **Admin** (gear icon in the bottom-left corner).
3. In the *Account* column, select your organisation or click **Create Account** (e.g. `Mqulima Technologies Ltd`).
4. In the *Property* column, click **Create Property**:
   - **Property Name**: `Mqulima Production` (or `Mqulima Agriculture Platform`).
   - **Reporting Timezone**: `Kenya (GMT+03:00)`.
   - **Currency**: `Kenyan Shilling (KES)` or `USD ($)`.
5. Select your industry category (e.g. `Agriculture` / `Business & Industrial`) and business size, then click **Create**.

### Step 1.2: Obtain the GA4 Measurement ID (`G-XXXXXXXXXX`)
1. In the property column, navigate to **Data Streams** > **Web**.
2. Enter your primary domain:
   - **Website URL**: `https://mqulima.com` (or your production domain).
   - **Stream Name**: `Mqulima Web App`.
3. Under **Enhanced Measurement**, click the gear icon:
   - **Important**: Because Mqulima is a Single Page Application (SPA) with TanStack Router, client-side route navigation is handled explicitly by `<AnalyticsRouteTracker />`. 
   - Under Enhanced Measurement -> *Page views*, ensure *Page changes based on browser history events* is disabled or left default, as our client tracker passes canonical route paths directly to `gtag("event", "page_view", ...)`.
4. Click **Create Stream**.
5. Copy the **Measurement ID** displayed in the upper-right corner (format: `G-XXXXXXXXXX`).
   - Set this in your environment as:
     ```env
     VITE_GA_MEASUREMENT_ID=G-XXXXXXXXXX
     ```

### Step 1.3: Locate the Numeric GA4 Property ID
1. In GA4 Admin, under the *Property* column, click **Property Settings** (or **Property Details**).
2. Look at the upper-right corner or the **Property ID** field.
3. Copy the numeric ID (e.g. `482910482`). This is **NOT** the `G-` string; it consists solely of numbers.
   - Set this in your environment as:
     ```env
     GA4_PROPERTY_ID=482910482
     ```

---

## 2. Google Cloud Service Account Setup

To allow the Mqulima Admin Console to fetch aggregate visitor analytics securely without exposing API keys to the browser, configure a Google Cloud Service Account with read-only access.

### Step 2.1: Create or Select a Google Cloud Project
1. Open the [Google Cloud Console](https://console.cloud.google.com/).
2. Create a new project or select an existing project (e.g. `mqulima-production`).

### Step 2.2: Enable the Google Analytics Data API v1
1. Navigate to **APIs & Services** > **Library**.
2. Search for `Google Analytics Data API`.
3. Click on **Google Analytics Data API** and click **Enable**.

### Step 2.3: Create a Dedicated Service Account
1. Go to **IAM & Admin** > **Service Accounts**.
2. Click **+ Create Service Account**:
   - **Service Account Name**: `mqulima-ga4-reporter`
   - **Service Account ID**: `mqulima-ga4-reporter`
   - **Description**: `Read-only GA4 reporting service for Mqulima Admin Analytics`.
3. Click **Create and Continue**.
4. (Optional) You do not need to assign project-level IAM roles since access will be granted directly inside the GA4 property. Click **Continue** then **Done**.
5. Copy the generated service account email address (format: `mqulima-ga4-reporter@<project-id>.iam.gserviceaccount.com`).

### Step 2.4: Generate a Private Key
1. Click on the newly created service account in the list.
2. Select the **Keys** tab > **Add Key** > **Create New Key**.
3. Choose **JSON** format and click **Create**.
4. A JSON file will download to your local machine (e.g., `mqulima-ga4-reporter-key.json`).
5. **Security Caution**: Never commit this file to Git! It is already added to `.gitignore`.

### Step 2.5: Grant the Service Account Access in Google Analytics
1. Return to the [Google Analytics Admin Console](https://analytics.google.com/).
2. Under the *Property* column, click **Property Access Management**.
3. Click the blue **+** button in the top-right corner and select **Add users**.
4. Paste the Service Account email address:
   `mqulima-ga4-reporter@<project-id>.iam.gserviceaccount.com`
5. Under **Direct roles and data restrictions**, select **Viewer** (read-only). Do NOT grant Administrator or Editor permissions.
6. Uncheck "Notify new users by email" (service accounts do not receive email).
7. Click **Add**.

---

## 3. Environment Variable Configuration

### Local Development (`.env`)
In your local root `.env` file, configure the following:

```env
# Client-side (Public)
VITE_GA_MEASUREMENT_ID=G-XXXXXXXXXX
# Optional Clarity session recording
VITE_CLARITY_PROJECT_ID=

# Server-side (Private to backend)
GA4_PROPERTY_ID=482910482

# Option A: Reference the local JSON key file path
GOOGLE_APPLICATION_CREDENTIALS=/absolute/path/to/mqulima-ga4-reporter-key.json

# OR Option B: Direct key and email values
# GOOGLE_SERVICE_ACCOUNT_EMAIL=mqulima-ga4-reporter@<project-id>.iam.gserviceaccount.com
# GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvgIB...\n-----END PRIVATE KEY-----\n"
```

### Vercel Deployment (Production & Preview)
On Vercel, serverless functions run in ephemeral environments where saving credential files to disk is discouraged. Use **Option B** or **Option C**:

1. In the Vercel Dashboard, go to your Mqulima project > **Settings** > **Environment Variables**.
2. Add the following variables:

| Variable Name | Environment | Value Description |
|---|---|---|
| `VITE_GA_MEASUREMENT_ID` | Production (and Preview if desired) | `G-XXXXXXXXXX` |
| `GA4_PROPERTY_ID` | Production (and Preview if desired) | Numeric Property ID (e.g., `482910482`) |
| `GOOGLE_SERVICE_ACCOUNT_EMAIL` | Production, Preview | The service account email address |
| `GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY` | Production, Preview | The exact `private_key` string from the downloaded JSON, including `\n` linebreaks |
| `GOOGLE_SERVICE_ACCOUNT_KEY_BASE64` | Alternative (Single secret) | Base64-encoded string of the entire downloaded JSON file |

> **Tip for Vercel Private Keys**:
> If setting `GOOGLE_SERVICE_ACCOUNT_KEY_BASE64`, simply encode the key file locally using:
> ```bash
> base64 -w 0 mqulima-ga4-reporter-key.json
> ```
> And paste the output string directly into Vercel. Mqulima's server reporting automatically decodes Base64 keys if provided.

---

## 4. Testing & Verification

### 4.1 Test Client-Side Tracking with GA4 Realtime & DebugView
1. Install the [Google Analytics Debugger Chrome Extension](https://chromewebstore.google.com/detail/google-analytics-debugger/jnkmfdileelkgflhpibkgmgblapmpjac) or open your site with `?debug_mode=true`.
2. Open Mqulima in your browser (`http://localhost:8080` or production URL).
3. The **Cookie & Analytics Consent Banner** will appear at the bottom of the screen.
4. Click **"Accept All"**.
5. Open Developer Tools Console:
   - Notice the log: `[GA4 Consent] Synchronized consent mode: granted`.
   - Subsequent route navigations will log: `[GA4 Event] page_view: /shop`, `[GA4 Event] marketplace_opened`, etc.
6. In Google Analytics, navigate to **Reports** > **Realtime**:
   - Verify that your active session appears within 30 seconds.
   - Click on your user profile in Realtime to observe incoming events (`page_view`, `marketplace_opened`, `add_to_cart`).
7. Navigate to **Admin** > **DebugView** to inspect real-time parameter payloads and verify that zero PII (phone numbers, emails) is sent.

### 4.2 Test Admin Analytics Dashboard
1. Log in to Mqulima Admin (`http://localhost:8081` or `/admin/login`).
2. Ensure you are logged in with an account having `admin` or `super_admin` permissions.
3. In the left navigation sidebar under **OPERATIONS HOME**, click **Visitor Analytics**.
4. If GA4 credentials are configured:
   - The Overview KPI cards will display live User counts, Sessions, Page Views, Engagement Rate, and Conversions.
   - The interactive SVG trend chart will plot daily visitors over the selected date range.
   - Tabs allow toggling between:
     - **Acquisition Channels**: Organic Search, Direct, Referral, Social, Paid.
     - **Page Views**: Top landing pages and most-viewed paths.
     - **Geo & Devices**: Country distribution, desktop vs mobile breakdown, and browsers.
     - **Domain Events**: Agricultural feature engagement (`ai_assistant_used`, `weather_forecast_viewed`, `quotation_requested`, etc.).
5. If GA4 is **not yet configured**:
   - The dashboard displays a friendly, 3-step **Setup Assistant Modal** with one-click links to Google Analytics and Google Cloud Console.

---

## 5. Tracked Domain Events Reference

All events follow standardized lowercase `snake_case` naming and are sanitised to scrub sensitive PII:

| Event Name | Trigger Location | Key Parameters |
|---|---|---|
| `page_view` | Every TanStack Router route transition | `page_path`, `page_title` |
| `login_completed` | Successful sign-in (`auth.sign-in.tsx`) | `method` (`phone` / `email`) |
| `sign_up_started` | User initiates registration (`auth.sign-up.tsx`) | `step: "started"` |
| `sign_up_completed` | User finishes registration | `role`, `has_profile` |
| `logout_completed` | User logs out (`auth.tsx`) | `feature_name: "auth"` |
| `password_reset_requested` | Password reset requested (`auth.forgot-password.tsx`) | `feature_name: "auth"` |
| `contact_form_started` | User focuses contact form | `form_id: "general_contact"` |
| `contact_form_submitted` | Verified contact message sent | `subject_category` |
| `contact_form_failed` | Contact form error | `error_type` |
| `marketplace_opened` | User opens `/shop` directory | `catalog_view: "grid"` |
| `product_viewed` | User views product details (`/shop/product/$slug`) | `product_id`, `category` |
| `product_category_selected`| Category filter clicked in shop | `category` |
| `add_to_cart` | Item added to cart drawer | `product_id`, `quantity`, `value` |
| `checkout_started` | Checkout initiated from cart drawer | `cart_total`, `item_count` |
| `purchase_completed` | Verified Paystack/M-Pesa payment callback | `transaction_id`, `value`, `currency: "KES"` |
| `weather_forecast_viewed` | Weather tool opened in `/tools` | `tool_name: "weather"` |
| `market_price_viewed` | Market commodity prices viewed | `tool_name: "market_prices"` |
| `agricultural_service_viewed`| Services directory opened (`/services`) | `service_category` |
| `quotation_requested` | Service quotation form submitted | `service_name` |
| `academy_course_viewed` | Agronomy course viewed (`/academy`) | `course_id`, `course_title` |
| `community_post_viewed` | Community topic read (`/community`) | `post_id`, `post_category` |
| `ai_assistant_used` | Agronomy AI query run (`/ai` or Crop Doctor) | `feature_type`, `prompt_length` |

---

## 6. Privacy & Consent Compliance

Mqulima complies with the Kenya Data Protection Act (KDPA 2019) and global privacy standards (GDPR):
- **Default State**: In accordance with Google Consent Mode v2, all analytics and marketing storage states are initialized as `denied`.
- **Consent Persistence**: Preferences are saved locally in `localStorage` under `mqulima_analytics_consent_v2`.
- **Revocation**: Users can modify or revoke consent at any time using the persistent floating **"Cookie Preferences"** button located at the bottom-right of the screen.
- **Zero Fingerprinting**: No canvas fingerprinting, IP matching, or covert tracking mechanisms are employed.
- **PII Scrubbing**: All user emails, Kenyan national ID numbers, Kenyan phone numbers, passwords, OTPs, and JWTs are stripped before events are dispatched to `gtag`.

---

## 7. Troubleshooting Guide

### Issue 1: "GA4 Data API Unconfigured" in Admin Console
- **Cause**: The server has not found valid Google credentials.
- **Fix**: Check your `.env` or Vercel environment variables. Ensure `GA4_PROPERTY_ID` is set and either `GOOGLE_APPLICATION_CREDENTIALS` (file path) or `GOOGLE_SERVICE_ACCOUNT_EMAIL` + `GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY` are provided.

### Issue 2: Error 403: "User does not have sufficient permissions for this property"
- **Cause**: The service account email has not been added as a **Viewer** to the GA4 property.
- **Fix**: In GA4 Admin > Property Access Management, add `mqulima-ga4-reporter@<project>.iam.gserviceaccount.com` with the **Viewer** role.

### Issue 3: Missing or Zero Data for "Today"
- **Cause**: GA4 standard reports have a processing latency of 24–48 hours. Realtime data is available immediately, but standard date reports can take time to aggregate new properties.
- **Fix**: Check **Realtime** in GA4 to confirm data ingestion. For recent events, select "Today" or "Last 7 days" after initial traffic is recorded.

### Issue 4: Rate Limiting & Quota Limits
- **Cause**: Excessive calls to the Google Analytics Data API.
- **Fix**: Mqulima's server-side reporting service implements an automated in-memory 5-minute cache per date range. Avoid forcing repeated refreshes within short intervals.
