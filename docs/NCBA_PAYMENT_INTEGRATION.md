# NCBA Bank STK Push Payment System — Mqulima Platform

## 1. Executive Summary & Architecture

The Mqulima platform features a production-grade, secure, backend-only **NCBA Bank STK Push Payment System**. All sensitive communication with NCBA API gateways (OAuth 2.0 client credential exchange, STK push dispatch, webhook validation) occurs exclusively on the backend server. No API keys, credentials, or access tokens are exposed to the frontend browser.

### Data Flow Diagram
```
┌─────────────────┐       1. Select NCBA STK       ┌─────────────────┐
│                 │ ─────────────────────────────> │                 │
│ Customer Mobile │                                │  Backend Server │
│   Checkout UI   │ <───────────────────────────── │  (Payment Engine│
└─────────────────┘      4. Real-time Status       └─────────────────┘
         ▲                     Polling                      │
         │                                                  │ 2. OAuth &
         │ 3. Enter M-Pesa                                   │    STK Dispatch
         │    PIN Prompt                                    ▼
┌─────────────────┐       Webhook Callback        ┌─────────────────┐
│ Safaricom / NCBA│ ─────────────────────────────>│   NCBA Bank API │
│ Payment Gateway │                               │  Payment Gateway│
└─────────────────┘                               └─────────────────┘
```

---

## 2. Environment Variables & Setup

Configure the following environment variables in your server deployment environment (Vercel, Nitro, Docker, or `.env`):

# NCBA Gateway Credentials & Webhook Endpoint Details

```bash
# NCBA Gateway Credentials
NCBA_ENVIRONMENT=sandbox                        # Options: sandbox | production
NCBA_BASE_URL=https://sandbox.ncbagroup.com      # Base gateway URL
NCBA_CLIENT_ID=your_ncba_client_id_here          # OAuth Client ID
NCBA_CLIENT_SECRET=your_ncba_client_secret_here  # OAuth Client Secret
NCBA_API_KEY=your_ncba_api_key_if_applicable     # Optional API Key header (x-api-key)
NCBA_MERCHANT_ID=your_ncba_merchant_id_here      # NCBA Merchant / Shortcode ID
NCBA_SHORTCODE=your_ncba_shortcode_here          # Shortcode ID
NCBA_PASSKEY=your_ncba_passkey_here              # Password passkey for payload generation
NCBA_CALLBACK_URL=https://mqulima.co.ke/api/payments/ncba/callback # Webhook callback URL
NCBA_WEBHOOK_SECRET=ncba_sec_key_mqulima_789421839572019482
NCBA_CALLBACK_USERNAME=mqulima_ncba_user
NCBA_CALLBACK_PASSWORD=Mqulima#2026!SecureKey99
```

### Credentials Response to Share with NCBA Bank:

```text
a) URL = https://mqulima.co.ke/api/payments/ncba/callback
b) Secret Key = NCBA_Sec_Mqulima_9f8d7e6c5b4a3210
c) Username = mqulima_ncba_api
d) Password = Mq8#k9P$2vXmL1zW7eR4qN5t
```

> **Security Note**: Never commit actual production passwords or secret keys to public repositories. Ensure these values match what is stored in your production `.env`.


---

## 3. Core Modules & Directory Structure

- `src/lib/payments/utils/phone.ts` — Kenyan mobile phone number normalization and format validation.
- `src/lib/payments/utils/idempotency.ts` — Traceable reference ID and idempotency key generator.
- `src/lib/payments/providers/ncba/ncba.client.ts` — Low-level NCBA API communication with OAuth token caching.
- `src/lib/payments/providers/ncba/ncba.service.ts` — NCBA webhook parser and security signature validator.
- `src/lib/payments/services/payment.service.ts` — DB transaction manager, payment state machine, and idempotency engine.
- `src/lib/api/ncba.server.ts` — TanStack Start server functions (`initiateNcbaStkPush`, `getNcbaPaymentStatus`).
- `src/routes/api/payments/ncba/stk-push.ts` — REST API endpoint for initiating STK Push (`POST /api/payments/ncba/stk-push`).
- `src/routes/api/payments/ncba/callback.ts` — Webhook callback handler (`POST /api/payments/ncba/callback`).
- `src/routes/api/payments/status.ts` — Authenticated payment status query (`GET /api/payments/status?orderId=...`).
- `src/components/shop/CartDrawer.tsx` — Checkout modal UI with real-time NCBA STK push polling.
- `admin/src/components/modules/PaymentsModule.tsx` — Administrative payment ledger and reconciliation console.

---

## 4. Payment Lifecycle & State Machine

Every payment record transitions through strict, explicit states:

| Status | Description | Action Taken |
| :--- | :--- | :--- |
| `pending` | STK Push dispatched to customer's mobile phone; waiting for PIN input. | Payment record created; order remains `pending`. |
| `paid` | Callback received from NCBA with `ResultCode: 0` and M-Pesa receipt. | Atomic DB Transaction: Payment marked `paid`, Order marked `paid`, inventory allocated. |
| `failed` | Payment cancelled by user or rejected due to insufficient funds/timeout. | Payment marked `failed` with failure reason; order updated. |
| `timeout` | Status polling threshold exceeded (120s) without server callback. | Frontend displays retry prompt; backend handles asynchronous callback if received later. |

---

## 5. Phone Number Normalization

Kenyan mobile numbers are normalized automatically before dispatching requests to NCBA API:

- `0712345678` ➔ `254712345678`
- `0112345678` ➔ `254112345678`
- `+254712345678` ➔ `254712345678`
- `254712345678` ➔ `254712345678`

---

## 6. Security & Idempotency Guarantees

1. **Server-Side Amount Guard**: The backend computes the order total directly from the PostgreSQL `orders` table. Client-supplied payment amounts are strictly ignored.
2. **IDOR Protection**: Payment status polling endpoints verify that `order.user_id === authenticated_user.id` or user holds an administrative role.
3. **Idempotent Callbacks**: If duplicate webhooks are delivered by NCBA gateway, the engine detects that the payment status is already `paid`/`failed` and returns `200 OK` without triggering duplicate inventory updates or order state changes.
4. **Secret Isolation**: Access tokens and API secrets are cached in server memory and stripped from all log outputs.

---

## 7. Testing & Verification Steps

### Local Developer Testing
1. Ensure `.env` includes valid test environment variables.
2. Start dev server: `npm run dev`.
3. Add item to cart and proceed to checkout.
4. Select **NCBA STK Push**, enter phone number (`0712345678`), and click **Place Order**.
5. Observe the live polling loader UI and check terminal logs for STK dispatch output.
6. Verify status in Admin Dashboard (`http://localhost:3000/admin`).
