import { getDb } from "./db.server";

export interface SendSmsOptions {
  phoneNumber: string;
  message: string;
  triggerType: "signup_welcome" | "order_confirmation" | "payment_confirmed" | "manual_test" | string;
}

export interface SendSmsResult {
  success: boolean;
  messageId?: string;
  mocked?: boolean;
  error?: string;
}

/**
 * Normalizes Kenyan phone numbers into standard format (254XXXXXXXXX).
 * Accepts: 07XXXXXXXX, 01XXXXXXXX, +2547XXXXXXXX, +2541XXXXXXXX, 2547XXXXXXXX, 2541XXXXXXXX
 */
export function normalizeKenyanPhone(phone: string): string {
  if (!phone) {
    throw new Error("Phone number is required");
  }

  // Remove whitespace, dashes, parenthetical spaces
  let cleaned = phone.replace(/[^0-9+]/g, "").trim();

  if (cleaned.startsWith("+")) {
    cleaned = cleaned.slice(1);
  }

  if (cleaned.startsWith("0")) {
    cleaned = "254" + cleaned.slice(1);
  } else if (!cleaned.startsWith("254") && (cleaned.startsWith("7") || cleaned.startsWith("1"))) {
    cleaned = "254" + cleaned;
  }

  // Kenyan mobile numbers are 12 digits total starting with 2541 or 2547
  const kenyanPhoneRegex = /^254[17][0-9]{8}$/;
  if (!kenyanPhoneRegex.test(cleaned)) {
    throw new Error(`Invalid Kenyan mobile phone number format: "${phone}". Expected format e.g. 0712345678 or 254712345678.`);
  }

  return cleaned;
}

/**
 * Normalizes Kenyan phone numbers into international E.164 format (+254XXXXXXXXX).
 */
export function formatKenyanPhoneE164(phone: string): string {
  const normalized = normalizeKenyanPhone(phone);
  return `+${normalized}`;
}

export function redactSensitiveMessage(msg: string): string {
  if (!msg) return "";
  return msg
    .replace(/(["']?(?:your password is|password|passwd|pwd)["']?\s*[:=]?\s*["']?)([^"',;}\s]+)(["']?)/gi, "$1[REDACTED]$3")
    .replace(/(["']?(?:token|secret|pin)["']?\s*[:=]\s*["']?)([^"',;}\s]+)(["']?)/gi, "$1[REDACTED]$3");
}

/**
 * Helper to log SMS attempt asynchronously to sms_logs table without throwing errors.
 */
async function logSmsAttempt(
  recipient: string,
  message: string,
  triggerType: string,
  status: "success" | "failed" | "mocked",
  responsePayload: any
): Promise<void> {
  try {
    const sql = getDb();
    const sanitizedMsg = redactSensitiveMessage(message);
    const payloadStr = typeof responsePayload === "string" ? responsePayload : JSON.stringify(responsePayload || {});
    await sql`
      INSERT INTO sms_logs (recipient, message, trigger_type, status, response_payload)
      VALUES (
        ${recipient},
        ${sanitizedMsg},
        ${triggerType},
        ${status},
        ${payloadStr}
      )
    `;
  } catch (err: any) {
    console.error("[SMS SERVICE] Failed to record log to sms_logs table:", err?.message || err);
  }
}

/**
 * Executes an HTTP fetch request with a timeout and 1 retry.
 */
async function postSmsRequestWithRetry(url: string, payload: any, timeoutMs = 5000): Promise<{ response: Response; bodyText: string }> {
  let attempt = 0;
  let lastError: any = null;

  while (attempt < 2) {
    attempt++;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      clearTimeout(timer);
      const bodyText = await response.text();
      return { response, bodyText };
    } catch (err: any) {
      clearTimeout(timer);
      lastError = err;
      console.warn(`[SMS SERVICE] Fetch attempt ${attempt} failed: ${err.message || err}. Retrying if possible...`);
      if (attempt < 2) {
        await new Promise((res) => setTimeout(res, 500)); // wait 500ms before retry
      }
    }
  }

  throw lastError || new Error("Network request failed after 2 attempts");
}

/**
 * Core function to send transactional SMS using TextSMS Kenya Bulk SMS API.
 * Never throws exceptions to caller — returns a SendSmsResult object and logs all output.
 */
export async function sendSms(options: SendSmsOptions): Promise<SendSmsResult> {
  const { phoneNumber, message, triggerType } = options;

  let normalizedPhone: string;
  try {
    normalizedPhone = normalizeKenyanPhone(phoneNumber);
  } catch (err: any) {
    console.error("[SMS SERVICE] Phone normalization error:", err.message);
    const result = { success: false, error: err.message };
    await logSmsAttempt(phoneNumber || "invalid", message, triggerType, "failed", result);
    return result;
  }

  const isMockMode =
    process.env.TEXTSMS_MOCK_MODE === "true" ||
    process.env.TEXTSMS_MOCK_MODE === "1" ||
    process.env.NODE_ENV === "test";

  if (isMockMode) {
    console.log(`[SMS SERVICE MOCK] Simulated SMS to ${normalizedPhone} (${triggerType}): "${message}"`);
    const mockResult = {
      success: true,
      mocked: true,
      messageId: `mock_${Date.now()}_${Math.floor(Math.random() * 10000)}`,
    };
    await logSmsAttempt(normalizedPhone, message, triggerType, "mocked", mockResult);
    return mockResult;
  }

  // Check if Africa's Talking is configured
  const atApiKey = process.env.AT_API_KEY;
  if (atApiKey && atApiKey !== "your_at_api_key_here") {
    return sendAfricasTalkingSms(`+${normalizedPhone}`, message, triggerType);
  }

  const apiKey = process.env.TEXTSMS_API_KEY || "82b5401f7d2d708f19d78f405cb4acab";
  const partnerId = process.env.TEXTSMS_PARTNER_ID || "16948";
  const senderId = process.env.TEXTSMS_SENDER_ID || "KIRGIT_AGRI";
  const apiUrl = process.env.TEXTSMS_API_URL || "https://sms.textsms.co.ke/api/services/sendsms/";

  if (!apiKey || apiKey === "your_textsms_api_key_here") {
    const errorMsg = "TEXTSMS_API_KEY is not configured in environment";
    console.error("[SMS SERVICE] Error:", errorMsg);
    const result = { success: false, error: errorMsg };
    await logSmsAttempt(normalizedPhone, message, triggerType, "failed", result);
    return result;
  }

  const payload = {
    apikey: apiKey,
    partnerID: partnerId,
    shortcode: senderId,
    mobile: normalizedPhone,
    message: message,
  };

  try {
    console.log(`[SMS SERVICE] Dispatching SMS to ${normalizedPhone} via TextSMS API (Sender: ${senderId})...`);
    const { response, bodyText } = await postSmsRequestWithRetry(apiUrl, payload, 5000);

    let data: any = {};
    try {
      data = JSON.parse(bodyText);
    } catch {
      data = { rawText: bodyText };
    }

    // TextSMS API response check (note "respose-code" field name in TextSMS API spec)
    const firstResponse = data.responses?.[0];
    const responseCode = firstResponse?.["respose-code"] ?? firstResponse?.["response-code"] ?? data.code;
    const isSuccess = response.ok && (responseCode === 200 || responseCode === "200");

    if (isSuccess) {
      const messageId = String(firstResponse?.messageid || Date.now());
      console.log(`[SMS SERVICE] SMS delivered successfully to ${normalizedPhone}. Message ID: ${messageId}`);
      const result: SendSmsResult = { success: true, messageId };
      await logSmsAttempt(normalizedPhone, message, triggerType, "success", data);
      return result;
    } else {
      const errorMsg = firstResponse?.["response-description"] || data.message || `API returned status ${response.status} / code ${responseCode}`;
      console.error(`[SMS SERVICE] TextSMS API rejected dispatch to ${normalizedPhone}:`, errorMsg);
      const result: SendSmsResult = { success: false, error: errorMsg };
      await logSmsAttempt(normalizedPhone, message, triggerType, "failed", data);
      return result;
    }
  } catch (err: any) {
    const errorMsg = err?.message || "Failed to reach TextSMS API after retries";
    console.error(`[SMS SERVICE] Exception during SMS dispatch to ${normalizedPhone}:`, errorMsg);
    const result: SendSmsResult = { success: false, error: errorMsg };
    await logSmsAttempt(normalizedPhone, message, triggerType, "failed", { error: errorMsg });
    return result;
  }
}

export interface SendServiceBookingSmsParams {
  phoneNumber: string;
  recipientName?: string;
  reference: string;
  subserviceName: string;
  scheduledDate: string;
  location: string;
  estimatedCost?: number;
}

/**
 * Builds standard SMS confirmation text for service booking.
 */
export function buildServiceBookingSmsMessage(params: SendServiceBookingSmsParams): string {
  const { recipientName, reference, subserviceName, scheduledDate, location } = params;
  const namePart = recipientName && recipientName !== "Guest Farmer" ? `Habari ${recipientName}, ` : "Habari, ";
  
  let formattedDate = scheduledDate;
  try {
    const d = new Date(scheduledDate);
    if (!isNaN(d.getTime())) {
      formattedDate = d.toLocaleDateString("en-KE", {
        day: "numeric",
        month: "short",
        year: "numeric"
      });
    }
  } catch {
    // fallback
  }

  return `${namePart}your Mqulima booking for ${subserviceName} is confirmed! Ref: ${reference}. Date: ${formattedDate}. Location: ${location}. Our officer will contact you shortly to coordinate. Helpline: 0723346134 / mqulima.com`;
}

/**
 * Dispatches service booking SMS confirmation to farmer's phone via TextSMS Kenya.
 */
export async function sendServiceBookingConfirmationSms(
  params: SendServiceBookingSmsParams
): Promise<SendSmsResult> {
  const message = buildServiceBookingSmsMessage(params);
  return sendSms({
    phoneNumber: params.phoneNumber,
    message,
    triggerType: "service_booking_confirmation",
  });
}

/**
 * Dispatches transactional SMS via Africa's Talking API.
 */
async function sendAfricasTalkingSms(
  e164Phone: string,
  message: string,
  triggerType: string
): Promise<SendSmsResult> {
  const apiKey = process.env.AT_API_KEY!;
  const username = process.env.AT_USERNAME || "sandbox";
  const senderId = process.env.AT_SENDER_ID;
  const isSandbox = username.toLowerCase() === "sandbox";
  const apiUrl = isSandbox
    ? "https://api.sandbox.africastalking.com/version1/messaging"
    : "https://api.africastalking.com/version1/messaging";

  const formParams = new URLSearchParams();
  formParams.append("username", username);
  formParams.append("to", e164Phone);
  formParams.append("message", message);
  if (senderId) {
    formParams.append("from", senderId);
  }

  try {
    console.log(`[SMS SERVICE] Dispatching SMS to ${e164Phone} via Africa's Talking (Username: ${username})...`);
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        apiKey: apiKey,
        Accept: "application/json",
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: formParams.toString(),
    });

    const bodyText = await response.text();
    let data: any = {};
    try {
      data = JSON.parse(bodyText);
    } catch {
      data = { rawText: bodyText };
    }

    const recipientData = data.SMSMessageData?.Recipients?.[0];
    const isSuccess =
      response.ok &&
      recipientData?.status &&
      ["success", "sent"].includes(String(recipientData.status).toLowerCase());

    if (isSuccess) {
      const messageId = String(recipientData?.messageId || Date.now());
      console.log(`[SMS SERVICE] Africa's Talking SMS delivered to ${e164Phone}. ID: ${messageId}`);
      const result: SendSmsResult = { success: true, messageId };
      await logSmsAttempt(e164Phone, message, triggerType, "success", data);
      return result;
    } else {
      const errorMsg =
        recipientData?.status ||
        data.SMSMessageData?.Message ||
        `Africa's Talking returned HTTP ${response.status}`;
      console.error(`[SMS SERVICE] Africa's Talking rejected dispatch to ${e164Phone}:`, errorMsg);
      const result: SendSmsResult = { success: false, error: errorMsg };
      await logSmsAttempt(e164Phone, message, triggerType, "failed", data);
      return result;
    }
  } catch (err: any) {
    const errorMsg = err?.message || "Failed to reach Africa's Talking API";
    console.error(`[SMS SERVICE] Africa's Talking exception for ${e164Phone}:`, errorMsg);
    const result: SendSmsResult = { success: false, error: errorMsg };
    await logSmsAttempt(e164Phone, message, triggerType, "failed", { error: errorMsg });
    return result;
  }
}

/**
 * Dispatches 6-digit recovery code SMS strictly matching required template:
 * "Mqulima: your code is 123456. Valid 10 min. Never share it."
 */
export async function sendRecoverySms(
  phoneNumber: string,
  code: string,
  shortLink?: string
): Promise<SendSmsResult> {
  const linkPart = shortLink ? ` Link: ${shortLink}` : "";
  const message = `Mqulima: your code is ${code}. Valid 10 min. Never share it.${linkPart}`;
  return sendSms({
    phoneNumber,
    message,
    triggerType: "password_recovery_otp",
  });
}

/**
 * Dispatches security notice SMS after account is accessed via recovery.
 */
export async function sendRecoverySecurityNoticeSms(
  phoneNumber: string
): Promise<SendSmsResult> {
  const message = "Mqulima: Your account was accessed via password recovery. If this wasn't you, contact support.";
  return sendSms({
    phoneNumber,
    message,
    triggerType: "recovery_security_notice",
  });
}

