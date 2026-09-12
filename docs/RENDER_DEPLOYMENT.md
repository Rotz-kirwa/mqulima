# Render Deployment Guide — Mqulima Platform

This guide outlines how to deploy the **Mqulima Agriculture Platform** to **Render** as a high-performance, production-ready Node.js Web Service.

---

## 1. Quick Deploy via Render Blueprint (`render.yaml`)

The repository includes a root [`render.yaml`](../render.yaml) specification. If you deploy using **Render Blueprints**:
1. Log in to [dashboard.render.com](https://dashboard.render.com).
2. Click **New +** > **Blueprint**.
3. Connect the repository: `Rotz-kirwa/mqulima`.
4. Render will automatically detect `render.yaml` and configure the service parameters.
5. Provide your production environment variables (e.g. `DATABASE_URL`, `JWT_SECRET`, etc.) and click **Apply**.

---

## 2. Manual Web Service Setup (Alternative)

If you prefer to configure a standard Web Service manually on Render:

1. In the Render Dashboard, click **New +** > **Web Service**.
2. Select your GitHub repository: `Rotz-kirwa/mqulima`.
3. Configure the settings:
   - **Name**: `mqulima-web`
   - **Language / Runtime**: `Node`
   - **Region**: `Ohio (US East)` (or your preferred region)
   - **Branch**: `main`
   - **Build Command**: `npm install --include=dev && NITRO_PRESET=node-server npm run build`
   - **Start Command**: `npm run start`
   - **Health Check Path**: `/api/health`
   - **Plan**: `Starter` (or higher)

---

## 3. Environment Variables

Configure the following environment variables in the Render Service Settings:

| Variable | Recommended / Default | Description |
| :--- | :--- | :--- |
| `NODE_ENV` | `production` | Production environment flag |
| `NITRO_PRESET` | `node-server` | Ensures Nitro compiles standalone Node server bundle |
| `PORT` | `10000` | Port assigned by Render for incoming HTTP traffic |
| `DATABASE_URL` | *Your Render PostgreSQL URI* | PostgreSQL connection string |
| `JWT_SECRET` | *32+ character random string* | Used for signing secure admin & farmer session JWTs |
| `GEMINI_API_KEY` | *Your Google AI Studio Key* | Powers Mqulima AI Crop Doctor and smart agronomy features |
| `UPSTASH_REDIS_REST_URL` | *Upstash REST URL* | Distributed rate limiting (falls back to memory if unset) |
| `UPSTASH_REDIS_REST_TOKEN` | *Upstash REST Token* | Upstash Redis authentication token |
| `NCBA_CLIENT_ID` | *NCBA Developer App Key* | NCBA Bank API Client ID |
| `NCBA_CLIENT_SECRET` | *NCBA Developer App Secret* | NCBA Bank API Client Secret |
| `NCBA_MERCHANT_CODE` | *NCBA Merchant Code* | NCBA Merchant Code |
| `NCBA_CALLBACK_SECRET` | *NCBA Webhook Secret* | Webhook verification secret |

---

## 4. Verification

After deployment finishes, test the live service:
- **Health Check**: `https://<your-render-domain>.onrender.com/api/health` (should return `{ status: "healthy" }`)
- **Main Shop**: `https://<your-render-domain>.onrender.com/shop`
- **API Products**: `https://<your-render-domain>.onrender.com/api/products`
