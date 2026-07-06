import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

// Schema for contact form validation
const ContactSchema = z.object({
  fullName: z.string().min(1, "Full Name is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().min(1, "Phone number is required"),
  userType: z.string().min(1),
  subject: z.string().optional(),
  message: z.string().min(10, "Message must be at least 10 characters long"),
  csrfToken: z.string()
});

// Schema for partnership application validation
const PartnershipSchema = z.object({
  orgName: z.string().min(1, "Organization name is required"),
  fullName: z.string().min(1, "Full name is required"),
  role: z.string().min(1, "Role is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().min(1, "Phone number is required"),
  orgType: z.string().min(1),
  tierInterest: z.string().min(1),
  countries: z.array(z.string()),
  goal: z.string().min(20, "Goal must be at least 20 characters long"),
  referralSource: z.string(),
  csrfToken: z.string()
});

export const submitContactForm = createServerFn({ method: "POST" })
  .inputValidator(ContactSchema)
  .handler(async ({ data }) => {
    const { fullName, email, phone, userType, subject, message, csrfToken } = data;

    // 1. CSRF Token Validation
    const { validateCsrfToken } = await import("../csrf-verify.server");
    validateCsrfToken(csrfToken);

    // 2. Rate Limiting Check
    const { getClientIp, checkApiRateLimit } = await import("../rate-limit.server");
    const ip = getClientIp();
    await checkApiRateLimit(ip);

    const { getDb } = await import("../db.server");
    const sql = getDb();
    const formattedMessage = `Subject: ${subject || "No Subject"}\nUser Type: ${userType}\nPhone: ${phone}\n\nMessage:\n${message}`;

    await sql`
      INSERT INTO contact_submissions (name, email, message)
      VALUES (${fullName}, ${email}, ${formattedMessage})
    `;

    return { success: true };
  });

export const submitPartnershipApplication = createServerFn({ method: "POST" })
  .inputValidator(PartnershipSchema)
  .handler(async ({ data }) => {
    const { orgName, email, fullName, role, phone, orgType, tierInterest, countries, goal, referralSource, csrfToken } = data;

    // 1. CSRF Token Validation
    const { validateCsrfToken } = await import("../csrf-verify.server");
    validateCsrfToken(csrfToken);

    // 2. Rate Limiting Check
    const { getClientIp, checkApiRateLimit } = await import("../rate-limit.server");
    const ip = getClientIp();
    await checkApiRateLimit(ip);

    const { getDb } = await import("../db.server");
    const sql = getDb();

    const details = {
      contact_name: fullName,
      role,
      phone,
      org_type: orgType,
      tier_interest: tierInterest,
      countries,
      goal,
      referral_source: referralSource,
    };

    await sql`
      INSERT INTO partnership_applications (org_name, contact_email, details)
      VALUES (${orgName}, ${email}, ${sql.json(details)})
    `;

    return { success: true };
  });
