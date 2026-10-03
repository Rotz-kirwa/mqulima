import path from "node:path";
import fs from "node:fs";
import nodemailer from "nodemailer";
import type { Transporter } from "nodemailer";
import { getServerConfig } from "./config.server";

/**
 * Ultra-lightweight inline attachment for Mqulima official brand logo (< 1.5 KB).
 * Uses memory caching and explicit inline disposition for instantaneous email rendering.
 */
let cachedLogoBuffer: Buffer | null = null;

function getEmailLogoAttachments(): { filename: string; content: Buffer; cid: string; contentType: string; contentDisposition: string }[] {
  try {
    if (!cachedLogoBuffer) {
      const logoPath = path.resolve(process.cwd(), "public/mqulima-logo.png");
      if (fs.existsSync(logoPath)) {
        cachedLogoBuffer = fs.readFileSync(logoPath);
      }
    }
    if (cachedLogoBuffer) {
      return [
        {
          filename: "mqulima-logo.png",
          content: cachedLogoBuffer,
          cid: "mqulima-logo",
          contentType: "image/png",
          contentDisposition: "inline",
        },
      ];
    }
  } catch (err) {
    console.warn("[EMAIL SERVICE] Could not attach Mqulima logo:", err);
  }
  return [];
}

export interface SendVerificationEmailOptions {
  toEmail: string;
  recipientName?: string;
  otpCode: string;
  expiresInMinutes?: number;
}

export interface SendEmailResult {
  success: boolean;
  messageId?: string;
  mocked?: boolean;
  error?: string;
}

declare global {
  var __mq_nodemailer_transporter__: Transporter | undefined;
  var __mq_nodemailer_transporter_key__: string | undefined;
}

/**
 * Resets the in-memory singleton transporter (useful when credentials change at runtime).
 */
export function resetMailTransporter(): void {
  globalThis.__mq_nodemailer_transporter__ = undefined;
  globalThis.__mq_nodemailer_transporter_key__ = undefined;
}

/**
 * Creates or reuses a singleton Nodemailer transporter configured for Hostinger SMTP.
 */
export function getMailTransporter(): Transporter | null {
  const config = getServerConfig() as any;
  const host = config.SMTP_HOST || process.env.SMTP_HOST || "smtp.hostinger.com";
  const port = Number(config.SMTP_PORT || process.env.SMTP_PORT) || 465;
  const user = config.SMTP_USER || process.env.SMTP_USER || "mqulima@mqulima.com";
  const pass = config.SMTP_PASSWORD || process.env.SMTP_PASSWORD || "Mqulima@2026";
  const secure = config.SMTP_SECURE ?? (port === 465);

  const currentKey = `${host}:${port}:${user}:${pass ? "auth" : "no_auth"}`;

  if (globalThis.__mq_nodemailer_transporter__ && globalThis.__mq_nodemailer_transporter_key__ === currentKey) {
    return globalThis.__mq_nodemailer_transporter__;
  }

  if (!pass && !config.SMTP_MOCK && config.NODE_ENV !== "test") {
    console.warn("[EMAIL SERVICE] SMTP_PASSWORD is not configured. Email dispatches will operate in simulated fallback mode.");
  }

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: {
      user,
      pass,
    },
    tls: {
      // Hostinger uses trusted certificates; allow rejectUnauthorized in production
      rejectUnauthorized: config.NODE_ENV === "production",
    },
  });

  globalThis.__mq_nodemailer_transporter__ = transporter;
  globalThis.__mq_nodemailer_transporter_key__ = currentKey;
  return transporter;
}

/**
 * Renders high-quality, responsive HTML email template with Mqulima branding.
 */
export function renderVerificationEmailHtml(params: {
  otpCode: string;
  recipientName?: string;
  expiresInMinutes?: number;
}): string {
  const { otpCode, recipientName, expiresInMinutes = 10 } = params;
  const nameGreeting = recipientName ? `Hello <strong>${recipientName}</strong>,` : "Hello,";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Verify your Mqulima account</title>
</head>
<body style="margin: 0; padding: 0; background-color: #F4F6F0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased; color: #1C201D;">
  <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #F4F6F0; padding: 40px 15px;">
    <tr>
      <td align="center">
        <!-- Main Container Card -->
        <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 580px; background-color: #FFFFFF; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 30px rgba(5, 107, 58, 0.08); border: 1px solid #E2E8D8;">
          
          <!-- Header Banner -->
          <tr>
            <td style="background-color: #056B3A; padding: 36px 30px; text-align: center;">
              <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0">
                <tr>
                  <td align="center">
                    <!-- Mqulima Official Logo Badge -->
                    <table role="presentation" border="0" cellspacing="0" cellpadding="0" style="margin: 0 auto 6px auto;">
                      <tr>
                        <td align="center" valign="middle" style="background-color: #FFFFFF; width: 56px; height: 56px; border-radius: 16px; text-align: center; vertical-align: middle; box-shadow: 0 4px 12px rgba(0,0,0,0.14); padding: 6px;">
                          <img src="cid:mqulima-logo" alt="Mqulima Logo" width="44" height="44" style="display: block; width: 44px; height: 44px; max-width: 44px; border: 0; outline: none; margin: 0 auto;" />
                        </td>
                      </tr>
                    </table>
                    <h1 style="color: #FFFFFF; font-size: 24px; font-weight: 900; letter-spacing: 0.5px; margin: 12px 0 4px 0; text-transform: uppercase;">
                      MQULIMA<span style="color: #80E6A7;">HUB</span>
                    </h1>
                    <p style="color: #D1E7DD; font-size: 13px; margin: 0; font-weight: 500;">
                      Kenya's Agricultural Community & Marketplace
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Body Content -->
          <tr>
            <td style="padding: 35px 35px 25px 35px; background-color: #FFFFFF;">
              <h2 style="color: #0F2D1F; font-size: 20px; font-weight: 800; margin-top: 0; margin-bottom: 14px;">
                Verify Your Email Address
              </h2>
              
              <p style="font-size: 14px; line-height: 22px; color: #4A5568; margin-bottom: 22px;">
                ${nameGreeting}<br><br>
                Thank you for registering with <strong>Mqulima</strong>. Please use the 6-digit verification code below to complete your registration and activate your account:
              </p>

              <!-- OTP Highlight Box -->
              <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="margin: 25px 0;">
                <tr>
                  <td align="center" style="background-color: #FAF8F0; border: 2px dashed #056B3A; border-radius: 14px; padding: 22px 10px;">
                    <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 1.5px; color: #056B3A; font-weight: 800; margin-bottom: 8px;">
                      Your One-Time Verification Code
                    </div>
                    <div style="font-family: 'Courier New', Courier, monospace; font-size: 38px; font-weight: 900; letter-spacing: 10px; color: #0F2D1F; padding-left: 10px;">
                      ${otpCode}
                    </div>
                    <div style="font-size: 12px; color: #718096; margin-top: 8px; font-weight: 600;">
                      ⏱️ Expires in <strong>${expiresInMinutes} minutes</strong>
                    </div>
                  </td>
                </tr>
              </table>

              <!-- Security Notice -->
              <div style="background-color: #FEF3C7; border-left: 4px solid #F59E0B; padding: 14px 16px; border-radius: 6px; margin: 24px 0 15px 0;">
                <p style="margin: 0; font-size: 12px; line-height: 18px; color: #92400E; font-weight: 600;">
                  ⚠️ <strong>Security Notice:</strong> Never share this verification code with anyone. Mqulima staff and agents will never ask for your code.
                </p>
              </div>

              <p style="font-size: 13px; line-height: 20px; color: #718096; margin-top: 22px; margin-bottom: 0;">
                If you did not attempt to register on Mqulima, you can safely ignore this email. No changes will be made to your contact details.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #F8FAF6; border-top: 1px solid #EAEFE6; padding: 24px 30px; text-align: center;">
              <p style="font-size: 12px; color: #718096; margin: 0 0 6px 0;">
                Smart Farming. Better Decisions.
              </p>
              <p style="font-size: 11px; color: #A0AEC0; margin: 0;">
                © ${new Date().getFullYear()} Mqulima Hub Kenya. All rights reserved.<br>
                Official communication from <strong>mqulima@mqulima.com</strong>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/**
 * Renders plain-text fallback version for mail clients that do not render HTML.
 */
export function renderVerificationEmailText(params: {
  otpCode: string;
  recipientName?: string;
  expiresInMinutes?: number;
}): string {
  const { otpCode, recipientName, expiresInMinutes = 10 } = params;
  const nameGreeting = recipientName ? `Hello ${recipientName},` : "Hello,";

  return `${nameGreeting}

Thank you for registering with Mqulima Hub.

Your 6-digit email verification code is:
=========================================
               ${otpCode}
=========================================

This code is valid for ${expiresInMinutes} minutes.

SECURITY WARNING:
Never share this code with anyone. Mqulima staff will never ask for your verification code.

If you did not request this verification code, please ignore this email.

--
Mqulima Hub Kenya
Smart Farming. Better Decisions.
Official Contact: mqulima@mqulima.com`;
}

/**
 * Dispatches the 6-digit registration OTP verification email via Hostinger SMTP.
 * Never leaks the plaintext OTP to logs and never throws uncaught exceptions to caller.
 */
export async function sendVerificationOtpEmail(
  options: SendVerificationEmailOptions
): Promise<SendEmailResult> {
  const { toEmail, recipientName, otpCode, expiresInMinutes = 10 } = options;

  if (!toEmail || !toEmail.includes("@")) {
    return { success: false, error: "Invalid recipient email address" };
  }

  if (!otpCode || otpCode.length !== 6) {
    return { success: false, error: "Invalid 6-digit OTP code supplied" };
  }

  const config = getServerConfig();
  const pass = config.SMTP_PASSWORD || process.env.SMTP_PASSWORD || "Mqulima@2026";
  const isMockMode =
    config.SMTP_MOCK ||
    config.NODE_ENV === "test" ||
    !pass;

  const senderAddress = `Mqulima <${config.SMTP_USER || "mqulima@mqulima.com"}>`;
  const subject = "Verify your Mqulima account";

  if (isMockMode) {
    // Redact OTP in log for safety
    const maskedEmail = toEmail.replace(/^(.)(.*)(@.*)$/, (_, first, middle, rest) => `${first}***${rest}`);
    console.log(`[EMAIL SERVICE MOCK] Verification email simulated to ${maskedEmail}. Code: [REDACTED]. Expiry: ${expiresInMinutes}m.`);
    return {
      success: true,
      mocked: true,
      messageId: `mock_email_${Date.now()}_${Math.floor(Math.random() * 10000)}`,
    };
  }

  try {
    const transporter = getMailTransporter();
    if (!transporter) {
      throw new Error("SMTP Transporter could not be initialized");
    }

    const html = renderVerificationEmailHtml({ otpCode, recipientName, expiresInMinutes });
    const text = renderVerificationEmailText({ otpCode, recipientName, expiresInMinutes });

    const info = await transporter.sendMail({
      from: senderAddress,
      to: toEmail,
      subject,
      text,
      html,
      attachments: getEmailLogoAttachments(),
    });

    const maskedEmail = toEmail.replace(/^(.)(.*)(@.*)$/, (_, first, middle, rest) => `${first}***${rest}`);
    console.log(`[EMAIL SERVICE] Verification email dispatched to ${maskedEmail}. Message ID: ${info.messageId}`);

    return {
      success: true,
      messageId: info.messageId,
    };
  } catch (err: any) {
    const maskedEmail = toEmail.replace(/^(.)(.*)(@.*)$/, (_, first, middle, rest) => `${first}***${rest}`);
    console.error(`[EMAIL SERVICE] Failed to dispatch verification email to ${maskedEmail}:`, err?.message || err);
    return {
      success: false,
      error: err?.message || "Failed to dispatch verification email",
    };
  }
}

export interface ServiceBookingEmailParams {
  toEmail: string;
  recipientName: string;
  reference: string;
  serviceName: string;
  subserviceName: string;
  scheduledDate: string;
  location: string;
  farmScale: string;
  contactPhone: string;
  estimatedCost: number;
  notes?: string;
  channel?: string;
}

/**
 * Formats date into human-readable Kenyan locale format (e.g. Monday, 12 Oct 2026).
 */
function formatHumanDate(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    if (!isNaN(d.getTime())) {
      return d.toLocaleDateString("en-KE", {
        weekday: "short",
        day: "numeric",
        month: "short",
        year: "numeric",
      });
    }
  } catch {
    // fallback
  }
  return dateStr;
}

/**
 * Renders an aesthetically rich, branded HTML confirmation email for agricultural service bookings.
 */
export function renderServiceBookingEmailHtml(params: ServiceBookingEmailParams): string {
  const {
    recipientName,
    reference,
    serviceName,
    subserviceName,
    scheduledDate,
    location,
    farmScale,
    contactPhone,
    estimatedCost,
    notes,
  } = params;

  const formattedDate = formatHumanDate(scheduledDate);
  const formattedCost = Number(estimatedCost || 0).toLocaleString();
  const nameGreeting = recipientName ? `Hello <strong>${recipientName}</strong>,` : "Hello,";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Service Booking Confirmed - ${reference}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #F4F6F0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased; color: #1C201D;">
  <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #F4F6F0; padding: 40px 15px;">
    <tr>
      <td align="center">
        <!-- Main Container Card -->
        <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 620px; background-color: #FFFFFF; border-radius: 20px; overflow: hidden; box-shadow: 0 12px 35px rgba(5, 107, 58, 0.08); border: 1px solid #E2E8D8;">
          
          <!-- Header Banner -->
          <tr>
            <td style="background-color: #056B3A; padding: 36px 30px; text-align: center;">
              <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0">
                <tr>
                  <td align="center">
                    <!-- Mqulima Official Logo Badge -->
                    <table role="presentation" border="0" cellspacing="0" cellpadding="0" style="margin: 0 auto 6px auto;">
                      <tr>
                        <td align="center" valign="middle" style="background-color: #FFFFFF; width: 56px; height: 56px; border-radius: 16px; text-align: center; vertical-align: middle; box-shadow: 0 4px 12px rgba(0,0,0,0.14); padding: 6px;">
                          <img src="cid:mqulima-logo" alt="Mqulima Logo" width="44" height="44" style="display: block; width: 44px; height: 44px; max-width: 44px; border: 0; outline: none; margin: 0 auto;" />
                        </td>
                      </tr>
                    </table>
                    <h1 style="color: #FFFFFF; font-size: 24px; font-weight: 900; letter-spacing: 0.5px; margin: 12px 0 4px 0; text-transform: uppercase;">
                      MQULIMA<span style="color: #80E6A7;">HUB</span>
                    </h1>
                    <p style="color: #D1E7DD; font-size: 13px; margin: 0; font-weight: 500;">
                      Kenya's Agricultural Community & Marketplace
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Confirmation Hero Ribbon -->
          <tr>
            <td style="background-color: #EBF8F0; padding: 18px 30px; border-bottom: 1px solid #D5EEDD; text-align: center;">
              <span style="display: inline-block; background-color: #056B3A; color: #FFFFFF; font-size: 11px; font-weight: 800; letter-spacing: 1px; text-transform: uppercase; padding: 4px 12px; border-radius: 9999px; margin-bottom: 6px;">
                ✓ REQUEST CONFIRMED
              </span>
              <div style="font-size: 13px; color: #166534; font-weight: 600;">
                Your agricultural service booking has been successfully scheduled
              </div>
            </td>
          </tr>

          <!-- Body Content -->
          <tr>
            <td style="padding: 35px 35px 25px 35px; background-color: #FFFFFF;">
              
              <p style="font-size: 15px; line-height: 24px; color: #374151; margin-top: 0; margin-bottom: 20px;">
                ${nameGreeting}<br><br>
                Thank you for scheduling a service with <strong>Mqulima Hub</strong>. We have logged your request for <strong>${subserviceName}</strong>. Our certified agricultural team and regional field officers have received your booking details and will coordinate your visit.
              </p>

              <!-- Reference Highlight Box -->
              <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="margin: 22px 0;">
                <tr>
                  <td align="center" style="background-color: #FAFBF9; border: 2px dashed #056B3A; border-radius: 14px; padding: 18px 15px;">
                    <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 1.5px; color: #056B3A; font-weight: 800; margin-bottom: 4px;">
                      Official Booking Reference
                    </div>
                    <div style="font-family: 'Courier New', Courier, monospace; font-size: 30px; font-weight: 900; letter-spacing: 3px; color: #0F2D1F;">
                      ${reference}
                    </div>
                    <div style="font-size: 12px; color: #6B7280; margin-top: 6px; font-weight: 500;">
                      Please quote this reference number in all inquiries
                    </div>
                  </td>
                </tr>
              </table>

              <!-- Booking Details Card -->
              <div style="background-color: #F8FAF6; border: 1px solid #E5EBE0; border-radius: 14px; padding: 20px; margin: 25px 0;">
                <h3 style="font-size: 14px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.8px; color: #056B3A; margin: 0 0 16px 0; border-bottom: 2px solid #E2E8D8; padding-bottom: 8px;">
                  📋 Booking Details Summary
                </h3>

                <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="font-size: 14px; color: #374151;">
                  <tr>
                    <td style="padding: 7px 0; color: #6B7280; width: 40%; font-weight: 500;">Service Category:</td>
                    <td style="padding: 7px 0; font-weight: 700; color: #111827;">${serviceName}</td>
                  </tr>
                  <tr>
                    <td style="padding: 7px 0; color: #6B7280; font-weight: 500;">Specific Subservice:</td>
                    <td style="padding: 7px 0; font-weight: 700; color: #056B3A;">${subserviceName}</td>
                  </tr>
                  <tr>
                    <td style="padding: 7px 0; color: #6B7280; font-weight: 500;">Scheduled Date:</td>
                    <td style="padding: 7px 0; font-weight: 700; color: #111827;">📅 ${formattedDate}</td>
                  </tr>
                  <tr>
                    <td style="padding: 7px 0; color: #6B7280; font-weight: 500;">Farm Location:</td>
                    <td style="padding: 7px 0; font-weight: 700; color: #111827;">📍 ${location}</td>
                  </tr>
                  <tr>
                    <td style="padding: 7px 0; color: #6B7280; font-weight: 500;">Farm Scale / Size:</td>
                    <td style="padding: 7px 0; font-weight: 700; color: #111827;">🌾 ${farmScale || "Standard"}</td>
                  </tr>
                  <tr>
                    <td style="padding: 7px 0; color: #6B7280; font-weight: 500;">Contact Phone:</td>
                    <td style="padding: 7px 0; font-weight: 700; color: #111827;">📞 ${contactPhone}</td>
                  </tr>
                  <tr>
                    <td style="padding: 7px 0; color: #6B7280; font-weight: 500;">Estimated Cost:</td>
                    <td style="padding: 7px 0; font-weight: 800; color: #056B3A; font-size: 15px;">KES ${formattedCost}</td>
                  </tr>
                  ${notes ? `
                  <tr>
                    <td style="padding: 7px 0; color: #6B7280; font-weight: 500; vertical-align: top;">Notes / Instructions:</td>
                    <td style="padding: 7px 0; font-weight: 500; color: #4B5563; font-style: italic;">"${notes}"</td>
                  </tr>` : ""}
                </table>
              </div>

              <!-- What Happens Next Section -->
              <div style="background-color: #FAF5E9; border-left: 4px solid #D97706; padding: 18px 20px; border-radius: 8px; margin: 25px 0;">
                <h4 style="margin: 0 0 10px 0; font-size: 14px; font-weight: 800; color: #92400E; text-transform: uppercase; letter-spacing: 0.5px;">
                  🌾 What Happens Next?
                </h4>
                <ol style="margin: 0; padding-left: 20px; font-size: 13px; line-height: 20px; color: #78350F;">
                  <li style="margin-bottom: 6px;"><strong>Agronomist Assignment:</strong> Our regional coordinator assigns an agronomy or technical specialist in your area.</li>
                  <li style="margin-bottom: 6px;"><strong>Phone Coordination:</strong> Our specialist will call you on <strong>${contactPhone}</strong> prior to the visit to confirm directions and access.</li>
                  <li style="margin-bottom: 6px;"><strong>On-Site Execution:</strong> On <strong>${formattedDate}</strong>, our team arrives at <strong>${location}</strong> equipped to conduct the service.</li>
                  <li><strong>Report & Receipts:</strong> Official recommendations, laboratory results, and digital receipts will be delivered to your account.</li>
                </ol>
              </div>

              <!-- Action Link -->
              <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="margin: 28px 0 15px 0;">
                <tr>
                  <td align="center">
                    <a href="https://mqulima.com/services" target="_blank" style="display: inline-block; background-color: #056B3A; color: #FFFFFF; font-size: 14px; font-weight: 700; text-decoration: none; padding: 14px 32px; border-radius: 10px; box-shadow: 0 4px 12px rgba(5, 107, 58, 0.25);">
                      View Booking on Mqulima Hub →
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Need Help Notice -->
              <p style="font-size: 13px; line-height: 20px; color: #6B7280; text-align: center; margin-top: 25px; margin-bottom: 0;">
                Need to modify your appointment or have questions?<br>
                Reply directly to this email, reach us at <a href="mailto:mqulima@mqulima.com" style="color: #056B3A; font-weight: 600;">mqulima@mqulima.com</a>, or call/WhatsApp Helpline <a href="tel:0723346134" style="color: #056B3A; font-weight: 700;">0723346134</a>.
              </p>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #F8FAF6; border-top: 1px solid #EAEFE6; padding: 24px 30px; text-align: center;">
              <p style="font-size: 12px; color: #6B7280; margin: 0 0 6px 0; font-weight: 600;">
                Smart Farming. Better Decisions.
              </p>
              <p style="font-size: 11px; color: #9CA3AF; margin: 0;">
                © ${new Date().getFullYear()} Mqulima Hub Kenya. All rights reserved.<br>
                Official service confirmation dispatched from <strong>mqulima@mqulima.com</strong>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/**
 * Renders plain-text fallback version for service booking confirmations.
 */
export function renderServiceBookingEmailText(params: ServiceBookingEmailParams): string {
  const {
    recipientName,
    reference,
    serviceName,
    subserviceName,
    scheduledDate,
    location,
    farmScale,
    contactPhone,
    estimatedCost,
    notes,
  } = params;

  const formattedDate = formatHumanDate(scheduledDate);
  const formattedCost = Number(estimatedCost || 0).toLocaleString();
  const nameGreeting = recipientName ? `Hello ${recipientName},` : "Hello,";

  return `${nameGreeting}

Thank you for booking an agricultural service with Mqulima Hub.
Your service request has been confirmed!

BOOKING REFERENCE: ${reference}
==================================================
Service Category:     ${serviceName}
Subservice / Task:    ${subserviceName}
Scheduled Date:       ${formattedDate}
Farm Location:        ${location}
Farm Scale / Size:    ${farmScale || "Standard"}
Contact Person:       ${recipientName || "Valued Farmer"}
Contact Phone:        ${contactPhone}
Estimated Cost:       KES ${formattedCost}
${notes ? `Special Notes:        ${notes}\n` : ""}==================================================

WHAT HAPPENS NEXT:
1. An agronomy or machinery specialist in your region is assigned to your request.
2. Our specialist will call you on ${contactPhone} prior to the visit to confirm coordinates and directions.
3. On ${formattedDate}, our team will arrive at ${location} to perform ${subserviceName}.
4. Full digital reports, soil recommendations, and official receipts will be issued.

Need assistance or wish to reschedule?
Email: mqulima@mqulima.com
Helpline: 0723346134
Website: https://mqulima.com/services

--
Mqulima Hub Kenya
Smart Farming. Better Decisions.
Official Contact: mqulima@mqulima.com`;
}

/**
 * Dispatches an automated service booking confirmation email via Hostinger SMTP.
 * Never throws uncaught exceptions to caller.
 */
export async function sendServiceBookingConfirmationEmail(
  params: ServiceBookingEmailParams
): Promise<SendEmailResult> {
  const { toEmail, reference, subserviceName } = params;

  if (!toEmail || !toEmail.includes("@")) {
    return { success: false, error: "Invalid recipient email address" };
  }

  const config = getServerConfig() as any;
  const pass = config.SMTP_PASSWORD || process.env.SMTP_PASSWORD || "Mqulima@2026";
  const isMockMode =
    config.SMTP_MOCK ||
    config.NODE_ENV === "test" ||
    !pass;

  const senderAddress = `Mqulima Hub <${config.SMTP_USER || process.env.SMTP_USER || "mqulima@mqulima.com"}>`;
  const subject = `Service Booking Confirmed: ${subserviceName} [Ref: ${reference}]`;

  if (isMockMode) {
    const maskedEmail = toEmail.replace(/^(.)(.*)(@.*)$/, (_, first, middle, rest) => `${first}***${rest}`);
    console.log(`[EMAIL SERVICE MOCK] Service booking confirmation email simulated to ${maskedEmail} [Ref: ${reference}].`);
    return {
      success: true,
      mocked: true,
      messageId: `mock_booking_${Date.now()}_${Math.floor(Math.random() * 10000)}`,
    };
  }

  try {
    const transporter = getMailTransporter();
    if (!transporter) {
      throw new Error("SMTP Transporter could not be initialized");
    }

    const html = renderServiceBookingEmailHtml(params);
    const text = renderServiceBookingEmailText(params);

    const info = await transporter.sendMail({
      from: senderAddress,
      to: toEmail,
      subject,
      text,
      html,
      attachments: getEmailLogoAttachments(),
    });

    const maskedEmail = toEmail.replace(/^(.)(.*)(@.*)$/, (_, first, middle, rest) => `${first}***${rest}`);
    console.log(`[EMAIL SERVICE] Service booking confirmation email dispatched to ${maskedEmail} [Ref: ${reference}]. Message ID: ${info.messageId}`);

    return {
      success: true,
      messageId: info.messageId,
    };
  } catch (err: any) {
    const maskedEmail = toEmail.replace(/^(.)(.*)(@.*)$/, (_, first, middle, rest) => `${first}***${rest}`);
    console.error(`[EMAIL SERVICE] Failed to dispatch booking email to ${maskedEmail}:`, err?.message || err);
    return {
      success: false,
      error: err?.message || "Failed to dispatch booking confirmation email",
    };
  }
}

