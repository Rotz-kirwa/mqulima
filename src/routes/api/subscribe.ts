import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { getDb } from "@/lib/db.server";

const SubscribeSchema = z.object({
  email: z.string().email("Please provide a valid email address."),
});

export const Route = createFileRoute("/api/subscribe")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const body = await request.json().catch(() => ({}));
          const validation = SubscribeSchema.safeParse(body);

          if (!validation.success) {
            return new Response(
              JSON.stringify({
                success: false,
                error: validation.error.issues[0]?.message || "Invalid email address",
              }),
              {
                status: 400,
                headers: { "Content-Type": "application/json" },
              }
            );
          }

          const { email } = validation.data;
          const normalizedEmail = email.toLowerCase().trim();

          const sql = getDb();

          // Upsert into newsletter_subscribers
          try {
            await sql`
              INSERT INTO newsletter_subscribers (email, status, subscribed_at)
              VALUES (${normalizedEmail}, 'active', NOW())
              ON CONFLICT (email) 
              DO UPDATE SET status = 'active', subscribed_at = NOW()
            `;
          } catch (dbErr: any) {
            // If unique constraint is missing on email or fallback needed:
            const existing = await sql`
              SELECT id FROM newsletter_subscribers WHERE LOWER(email) = ${normalizedEmail} LIMIT 1
            `;
            if (existing.length === 0) {
              await sql`
                INSERT INTO newsletter_subscribers (email, status, subscribed_at)
                VALUES (${normalizedEmail}, 'active', NOW())
              `;
            } else {
              await sql`
                UPDATE newsletter_subscribers
                SET status = 'active', subscribed_at = NOW()
                WHERE LOWER(email) = ${normalizedEmail}
              `;
            }
          }

          // Automatically record into centralized subscription system
          try {
            const { recordSubscription } = await import("@/lib/services/subscriptions.server");
            await recordSubscription({
              email: normalizedEmail,
              category: "news",
              serviceName: "Weekly Agritech Digest & Intelligence Bulletin",
              planCode: "newsletter_free",
              subscriptionType: "free",
              status: "active",
              billingCycle: "none",
              priceKes: 0,
              paymentStatus: "waived",
              actorType: "user",
              actorEmail: normalizedEmail,
              notes: "Subscribed via public newsletter subscription form",
            });
          } catch (syncErr) {
            console.error("[SUBSCRIBE] Failed to record in centralized subscriptions table:", syncErr);
          }

          return new Response(
            JSON.stringify({
              success: true,
              message: "Subscribed successfully! Weekly digest will be delivered to your inbox.",
            }),
            {
              status: 200,
              headers: { "Content-Type": "application/json" },
            }
          );
        } catch (error: any) {
          console.error("[SUBSCRIBE] Failed to process subscription:", error);
          return new Response(
            JSON.stringify({
              success: false,
              error: "An unexpected error occurred. Please try again.",
            }),
            {
              status: 500,
              headers: { "Content-Type": "application/json" },
            }
          );
        }
      },
    },
  },
});
