/**
 * Mqulima Payment Engine — NCBA API Low-Level Client
 * Handles OAuth 2.0 Authentication, Token Caching, and Direct API Communication
 * SECURITY: Secrets & Tokens are NEVER logged to console or client.
 */

import { maskPhoneNumber } from "../../utils/phone";

export interface NcbaConfig {
  baseUrl: string;
  clientId: string;
  clientSecret: string;
  apiKey?: string;
  merchantId: string;
  shortcode: string;
  passkey?: string;
  callbackUrl: string;
  environment: "sandbox" | "production";
}

export interface NcbaStkPushParams {
  phoneNumber: string;
  amount: number;
  merchantReference: string;
  orderId: string;
  description?: string;
  callbackUrl?: string;
}

export interface NcbaStkPushResult {
  success: boolean;
  checkoutRequestId?: string;
  merchantReference?: string;
  responseCode?: string;
  responseDescription?: string;
  rawResponse?: any;
  error?: string;
}

interface CachedToken {
  token: string;
  expiresAt: number;
}

// In-memory server-side token cache
let cachedNcbaToken: CachedToken | null = null;

/**
 * Loads NCBA API environment configuration and validates presence of required keys.
 */
export function getNcbaConfig(): NcbaConfig {
  const environment = (process.env.NCBA_ENVIRONMENT || "sandbox").toLowerCase() === "production" ? "production" : "sandbox";
  
  const baseUrl = (process.env.NCBA_BASE_URL || (environment === "production" 
    ? "https://api.ncbagroup.com" 
    : "https://sandbox.ncbagroup.com")).replace(/\/$/, "");
    
  const clientId = (process.env.NCBA_CLIENT_ID || "").trim();
  const clientSecret = (process.env.NCBA_CLIENT_SECRET || "").trim();
  const apiKey = (process.env.NCBA_API_KEY || "").trim();
  const merchantId = (process.env.NCBA_MERCHANT_ID || process.env.NCBA_SHORTCODE || "").trim();
  const shortcode = (process.env.NCBA_SHORTCODE || process.env.NCBA_MERCHANT_ID || "").trim();
  const passkey = (process.env.NCBA_PASSKEY || "").trim();

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.VITE_APP_URL || "https://mqulima.com";
  const defaultCallback = `${appUrl.replace(/\/$/, "")}/api/payments/ncba/callback`;
  const callbackUrl = (process.env.NCBA_CALLBACK_URL || defaultCallback).trim();

  if (!clientId || !clientSecret) {
    throw new Error("[NCBA CONFIG ERROR] NCBA_CLIENT_ID or NCBA_CLIENT_SECRET is missing from environment variables.");
  }

  if (!merchantId && !shortcode) {
    throw new Error("[NCBA CONFIG ERROR] NCBA_MERCHANT_ID or NCBA_SHORTCODE is missing from environment variables.");
  }

  return {
    baseUrl,
    clientId,
    clientSecret,
    apiKey,
    merchantId,
    shortcode,
    passkey,
    callbackUrl,
    environment
  };
}

/**
 * Obtains an OAuth 2.0 access token from NCBA token endpoint.
 * Caches tokens server-side with automatic expiration tracking.
 */
export async function getNcbaAccessToken(forceRefresh = false): Promise<string> {
  const now = Date.now();

  // Reuse cached token if valid (with 60-second buffer)
  if (!forceRefresh && cachedNcbaToken && cachedNcbaToken.expiresAt > now + 60000) {
    return cachedNcbaToken.token;
  }

  const config = getNcbaConfig();
  const tokenEndpoint = `${config.baseUrl}/oauth/v2/token`;
  const authHeader = Buffer.from(`${config.clientId}:${config.clientSecret}`).toString("base64");

  const headers: Record<string, string> = {
    Authorization: `Basic ${authHeader}`,
    "Content-Type": "application/x-www-form-urlencoded",
  };

  if (config.apiKey) {
    headers["x-api-key"] = config.apiKey;
  }

  try {
    console.log(`[NCBA AUTH] Requesting OAuth access token from NCBA Gateway (${config.environment})...`);

    const response = await fetch(tokenEndpoint, {
      method: "POST",
      headers,
      body: new URLSearchParams({
        grant_type: "client_credentials"
      })
    });

    const responseText = await response.text();
    let data: any;
    try {
      data = JSON.parse(responseText);
    } catch {
      data = { responseText };
    }

    if (!response.ok || !data.access_token) {
      const errorMsg = data.error_description || data.message || data.error || `HTTP ${response.status} failed to obtain access token`;
      throw new Error(`NCBA OAuth Authentication Failed: ${errorMsg}`);
    }

    const expiresInSeconds = parseInt(data.expires_in || "3600", 10);
    cachedNcbaToken = {
      token: data.access_token,
      expiresAt: now + expiresInSeconds * 1000
    };

    console.log(`[NCBA AUTH] Access token successfully acquired. Valid for ${expiresInSeconds}s.`);
    return cachedNcbaToken.token;
  } catch (err: any) {
    console.error("[NCBA AUTH ERROR]:", err?.message || err);
    throw new Error(err?.message || "Failed to authenticate with NCBA payment gateway.");
  }
}

/**
 * Clears the cached token in case of authentication rejection.
 */
export function clearNcbaTokenCache(): void {
  cachedNcbaToken = null;
}

/**
 * Sends an STK Push payment prompt request to the NCBA API gateway.
 */
export async function sendNcbaStkPush(params: NcbaStkPushParams): Promise<NcbaStkPushResult> {
  const config = getNcbaConfig();
  let token = await getNcbaAccessToken();

  const timestamp = new Date().toISOString().replace(/[^0-9]/g, "").slice(0, 14);
  const password = config.passkey 
    ? Buffer.from(`${config.shortcode}${config.passkey}${timestamp}`).toString("base64")
    : undefined;

  const callbackUrl = params.callbackUrl || config.callbackUrl;

  const payload: Record<string, any> = {
    BusinessShortCode: config.shortcode || config.merchantId,
    MerchantID: config.merchantId,
    Amount: Math.ceil(params.amount),
    PartyA: params.phoneNumber,
    PartyB: config.shortcode || config.merchantId,
    PhoneNumber: params.phoneNumber,
    CallBackURL: callbackUrl,
    AccountReference: params.merchantReference,
    MerchantReference: params.merchantReference,
    TransactionDesc: (params.description || `Order ${params.orderId.slice(0, 8)}`).slice(0, 30),
    Timestamp: timestamp,
  };

  if (password) {
    payload.Password = password;
  }

  const endpoint = `${config.baseUrl}/mpesa/stkpush/v1/processrequest`;
  const maskedPhone = maskPhoneNumber(params.phoneNumber);

  console.log(`[NCBA STK] Dispatching STK Push request to ${maskedPhone} for amount KES ${payload.Amount}`);

  const makeRequest = async (accessToken: string) => {
    const headers: Record<string, string> = {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json"
    };

    if (config.apiKey) {
      headers["x-api-key"] = config.apiKey;
    }

    const res = await fetch(endpoint, {
      method: "POST",
      headers,
      body: JSON.stringify(payload)
    });

    const text = await res.text();
    let body: any;
    try {
      body = JSON.parse(text);
    } catch {
      body = { raw: text };
    }
    return { status: res.status, ok: res.ok, body };
  };

  try {
    let result = await makeRequest(token);

    // Force token refresh if rejected for auth reasons
    if (result.status === 401 || result.body?.errorCode === "404.001.03" || result.body?.errorMessage?.includes("Invalid Access Token")) {
      console.warn("[NCBA STK] Access token rejected. Requesting fresh token and retrying STK Push...");
      clearNcbaTokenCache();
      token = await getNcbaAccessToken(true);
      result = await makeRequest(token);
    }

    const body = result.body;
    const isSuccess = result.ok && (body.ResponseCode === "0" || body.status === "SUCCESS" || body.statusCode === "00");

    if (!isSuccess) {
      const errorMsg = body.ResponseDescription || body.errorMessage || body.message || `STK Push rejected with HTTP ${result.status}`;
      return {
        success: false,
        responseCode: body.ResponseCode || String(result.status),
        responseDescription: errorMsg,
        rawResponse: body,
        error: errorMsg
      };
    }

    const checkoutRequestId = body.CheckoutRequestID || body.checkoutRequestId || body.transactionId || body.requestId;

    return {
      success: true,
      checkoutRequestId,
      merchantReference: params.merchantReference,
      responseCode: body.ResponseCode || "0",
      responseDescription: body.ResponseDescription || "Success",
      rawResponse: body
    };
  } catch (err: any) {
    console.error("[NCBA STK DISPATCH ERROR]:", err?.message || err);
    return {
      success: false,
      error: err?.message || "Failed to communicate with NCBA payment gateway."
    };
  }
}
