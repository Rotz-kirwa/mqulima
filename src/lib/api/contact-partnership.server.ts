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

const StockSourcingSchema = z.object({
  productName: z.string().min(1, "Product name is required"),
  preferredBrand: z.string().optional(),
  contactName: z.string().optional(),
  contactPhone: z.string().optional(),
  contactEmail: z.string().optional(),
  csrfToken: z.string().optional()
});

export const submitStockSourcingRequest = createServerFn({ method: "POST" })
  .inputValidator(StockSourcingSchema)
  .handler(async ({ data }) => {
    const { productName, preferredBrand, contactName, contactPhone, contactEmail } = data;

    const { getDb } = await import("../db.server");
    const sql = getDb();

    // Ensure table exists
    await sql`
      CREATE TABLE IF NOT EXISTS stock_sourcing_requests (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        product_name varchar(255) NOT NULL,
        preferred_brand varchar(255),
        contact_name varchar(255),
        contact_phone varchar(50),
        contact_email varchar(255),
        status varchar(50) DEFAULT 'open',
        assigned_staff varchar(100) DEFAULT 'Unassigned',
        admin_notes text,
        created_at timestamp with time zone DEFAULT now()
      );
    `;

    const inserted = await sql`
      INSERT INTO stock_sourcing_requests (
        product_name, preferred_brand, contact_name, contact_phone, contact_email
      )
      VALUES (
        ${productName},
        ${preferredBrand || null},
        ${contactName || "Farmer Client"},
        ${contactPhone || "+254 700 000 000"},
        ${contactEmail || "farmer@mkulima.co.ke"}
      )
      RETURNING id
    `;

    return { success: true, id: inserted[0]?.id };
  });

