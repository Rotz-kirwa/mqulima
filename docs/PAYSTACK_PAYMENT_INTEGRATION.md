# Paystack Live Card Payment Integration — Mqulima Platform

## 1. Executive Summary & Architecture

The Mqulima platform features a production-grade, secure, PCI-DSS compliant **Paystack Payment Gateway Integration** for Card payments (Visa, Mastercard, Verve). 

### Security Highlights:
- **Hosted Encrypted Gateway**: Card numbers, expiry dates, and CVVs are handled directly by Paystack's PCI-DSS Level 1 certified checkout environment.
- **Server-Side Authorization**: The Mqulima backend generates the checkout session with an authoritative price from PostgreSQL and redirects the customer to Paystack.
- **Dual Verification**:
  1. **User Callback Verification**: When the user finishes 3DS verification and is redirected back to `/payments/paystack/callback`, the backend verifies the reference directly via Paystack's REST API (`https://api.paystack.co/transaction/verify/${reference}`).
  2. **Asynchronous Webhooks**: Paystack sends webhook events (`charge.success`) to `/api/payments/paystack/webhook`, validated with an HMAC-SHA512 signature using the Paystack Live Secret Key.

---

## 2. Production Credentials Configured

- **Merchant**: Kirgit Agriculture Ltd (ID: 1958561)
- **Live Secret Key**: Stored in environment variable `PAYSTACK_SECRET_KEY` (configured in `.env` and Render dashboard)
- **Live Public Key**: `pk_live_609dde8efb5286879ea47f42d8ffec749d6e750e`
- **Currency**: `KES` (Kenyan Shilling)

---

## 3. URLs to Configure in Paystack Dashboard

In the **Paystack Dashboard** under **Settings → API Keys & Webhooks → API Configuration - Live Mode**, paste the following URLs into their respective fields:

### A. Live Callback URL
```text
https://mqulima.com/payments/paystack/callback
```
*(If testing on Render domain before custom domain switch: `https://mqulima-web.onrender.com/payments/paystack/callback`)*

### B. Live Webhook URL
```text
https://mqulima.com/api/payments/paystack/webhook
```
*(If testing on Render domain before custom domain switch: `https://mqulima-web.onrender.com/api/payments/paystack/webhook`)*

---

## 4. Environment Variables (`.env`)

```env
# Paystack Payment Gateway Configuration (Production Live Mode)
PAYSTACK_SECRET_KEY=sk_live_...your_secret_key...
PAYSTACK_PUBLIC_KEY=pk_live_609dde8efb5286879ea47f42d8ffec749d6e750e
VITE_PAYSTACK_PUBLIC_KEY=pk_live_609dde8efb5286879ea47f42d8ffec749d6e750e
PAYSTACK_CALLBACK_URL=https://mqulima.com/payments/paystack/callback
PAYSTACK_WEBHOOK_URL=https://mqulima.com/api/payments/paystack/webhook
```

---

## 5. Testing & Verification

To verify that the live Paystack credentials work:
1. Go to the **Agroshop** at `https://mqulima.com/shop`.
2. Add any item to the cart and open the Cart Checkout drawer.
3. Select **Card Pay (Visa, Mastercard)**.
4. Click **Place Order**.
5. You will be redirected to Paystack's official live checkout (`https://checkout.paystack.com/...`).
6. Upon payment completion, you are redirected back to `https://mqulima.com/payments/paystack/callback`, where the server marks the order as paid in the database and updates inventory.
