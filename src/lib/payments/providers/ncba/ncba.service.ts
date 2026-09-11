/**
 * Mqulima Payment Engine — NCBA Business Service Layer
 * Isolates NCBA callback parsing, webhook signature validation, and payload processing.
 */

export interface ParsedNcbaCallback {
  isValid: boolean;
  checkoutRequestId?: string;
  merchantReference?: string;
  resultCode: number;
  resultDesc: string;
  amount?: number;
  mpesaReceiptNumber?: string;
  phoneNumber?: string;
  transactionDate?: string;
  rawPayload: any;
  error?: string;
}

export class NcbaPaymentService {
  /**
   * Validates webhook security headers, Basic Auth credentials, or Secret Key for NCBA callback endpoints.
   */
  static validateWebhookSecurity(request: Request): boolean {
    const url = new URL(request.url);
    const queryToken = url.searchParams.get("token") || url.searchParams.get("secret");
    const secretHeader = 
      request.headers.get("x-secret-key") || 
      request.headers.get("x-ncba-secret") || 
      request.headers.get("x-webhook-secret");

    const expectedSecret = (
      process.env.NCBA_WEBHOOK_SECRET || 
      process.env.NCBA_SECRET_KEY || 
      process.env.MPESA_WEBHOOK_SECRET || 
      ""
    ).trim();

    // 1. Check Secret Key (x-secret-key header or ?token= query parameter)
    if (expectedSecret) {
      if (queryToken === expectedSecret || secretHeader === expectedSecret) {
        return true;
      }
    }

    // 2. Check HTTP Basic Authentication Header (Authorization: Basic <base64(username:password)>)
    const expectedUsername = (process.env.NCBA_CALLBACK_USERNAME || "").trim();
    const expectedPassword = (process.env.NCBA_CALLBACK_PASSWORD || "").trim();

    if (expectedUsername && expectedPassword) {
      const authHeader = request.headers.get("authorization") || request.headers.get("Authorization");
      if (authHeader && authHeader.toLowerCase().startsWith("basic ")) {
        try {
          const credentials = Buffer.from(authHeader.split(" ")[1], "base64").toString("utf-8");
          const [username, password] = credentials.split(":");
          if (username === expectedUsername && password === expectedPassword) {
            return true;
          }
        } catch (e) {
          console.error("[NCBA WEBHOOK SECURITY] Failed to parse basic auth header:", e);
        }
      }
    }

    // If both expected secrets and basic auth are configured and neither matched, reject
    if (expectedSecret || (expectedUsername && expectedPassword)) {
      console.warn("[NCBA WEBHOOK SECURITY] Rejected callback request: invalid credentials or secret key.");
      return false;
    }

    // Fail-Closed Security Policy: In production, reject unauthenticated callbacks if no secrets are configured
    const isProduction = process.env.NODE_ENV === "production";
    if (isProduction) {
      console.error("[NCBA WEBHOOK SECURITY CRITICAL] Unconfigured webhook credentials in production environment. Rejecting callback.");
      return false;
    }

    console.warn("[NCBA WEBHOOK SECURITY WARNING] Webhook credentials unconfigured in development mode. Bypassing check.");
    return true;
  }

  /**
   * Normalizes and parses the incoming NCBA/M-Pesa STK Push webhook callback JSON payload.
   */
  static parseCallbackPayload(body: any): ParsedNcbaCallback {
    if (!body) {
      return {
        isValid: false,
        resultCode: -1,
        resultDesc: "Empty payload body",
        rawPayload: body,
        error: "Missing callback JSON body"
      };
    }

    // Check standard STK push structure: Body.stkCallback
    const stkCallback = body?.Body?.stkCallback || body?.stkCallback || body;

    const resultCode = typeof stkCallback.ResultCode === "number" 
      ? stkCallback.ResultCode 
      : parseInt(stkCallback.ResultCode || stkCallback.resultCode || "-1", 10);

    const resultDesc = stkCallback.ResultDesc || stkCallback.resultDesc || stkCallback.message || "No result description provided";
    const checkoutRequestId = stkCallback.CheckoutRequestID || stkCallback.checkoutRequestId || body.CheckoutRequestID;
    const merchantReference = stkCallback.MerchantRequestID || stkCallback.merchantReference || body.MerchantReference;

    let amount: number | undefined;
    let mpesaReceiptNumber: string | undefined;
    let phoneNumber: string | undefined;
    let transactionDate: string | undefined;

    // Parse CallbackMetadata items if present
    const callbackMetadata = stkCallback.CallbackMetadata || stkCallback.callbackMetadata;
    if (callbackMetadata?.Item && Array.isArray(callbackMetadata.Item)) {
      for (const item of callbackMetadata.Item) {
        const name = (item.Name || item.name || "").toString();
        const value = item.Value !== undefined ? item.Value : item.value;

        if (name === "Amount" && value !== undefined) {
          amount = parseFloat(value);
        } else if (name === "MpesaReceiptNumber" && value) {
          mpesaReceiptNumber = String(value).trim();
        } else if (name === "PhoneNumber" && value) {
          phoneNumber = String(value).trim();
        } else if (name === "TransactionDate" && value) {
          transactionDate = String(value).trim();
        }
      }
    }

    // Direct fallback fields
    if (!mpesaReceiptNumber) {
      mpesaReceiptNumber = body.receiptNumber || body.MpesaReceiptNumber;
    }
    if (!amount && body.amount) {
      amount = parseFloat(body.amount);
    }
    if (!phoneNumber && body.phoneNumber) {
      phoneNumber = String(body.phoneNumber);
    }

    return {
      isValid: true,
      checkoutRequestId,
      merchantReference,
      resultCode,
      resultDesc,
      amount,
      mpesaReceiptNumber,
      phoneNumber,
      transactionDate,
      rawPayload: body
    };
  }

  /**
   * Generates standard acknowledgement response for NCBA gateway.
   */
  static createCallbackResponse(success: boolean, message = "Callback processed"): Response {
    return new Response(
      JSON.stringify({
        ResultCode: success ? 0 : 1,
        ResultDesc: message
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" }
      }
    );
  }
}
