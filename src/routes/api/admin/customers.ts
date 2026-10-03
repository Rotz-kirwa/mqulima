import { createFileRoute } from "@tanstack/react-router";
import { db } from "@/lib/db.server";
import { users } from "@/db/schema/users";
import { profiles } from "@/db/schema/profiles";
import { orders } from "@/db/schema/orders";
import { eq, desc, sql } from "drizzle-orm";
import { logAdminAction } from "@/lib/audit.server";
import { requireAdminAuth, hasPermission } from "@/lib/api/admin-auth.server";

// High-performance in-memory server cache for customer listings
interface CustomersCacheEntry {
  payload: {
    success: boolean;
    totalCount: number;
    customers: any[];
  };
  timestamp: number;
}

let serverCustomersCache: CustomersCacheEntry | null = null;
const SERVER_CUSTOMERS_CACHE_TTL = 60 * 1000; // 60 seconds

export function invalidateCustomersServerCache() {
  serverCustomersCache = null;
}

export const Route = createFileRoute("/api/admin/customers")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const auth = await requireAdminAuth(request, "customers.read");
        if ("response" in auth) return auth.response;
        try {
          const url = new URL(request.url);
          const forceRefresh = url.searchParams.get("refresh") === "true" || request.headers.get("x-bypass-cache") === "true";

          if (!forceRefresh && serverCustomersCache && Date.now() - serverCustomersCache.timestamp < SERVER_CUSTOMERS_CACHE_TTL) {
            return new Response(JSON.stringify(serverCustomersCache.payload), {
              headers: {
                "Content-Type": "application/json",
                "X-Server-Cache": "HIT",
                "Cache-Control": "private, no-cache",
              },
            });
          }

          // Fetch users merged with profiles and lifetime order totals in parallel
          // Using correlated subqueries on orders avoids massive cartesian joins and expensive 27-column GROUP BY
          const userListPromise = db
            .select({
              id: users.id,
              firstName: users.firstName,
              lastName: users.lastName,
              email: users.email,
              phoneNumber: users.phoneNumber,
              nationalId: users.nationalId,
              county: users.county,
              deliveryLocation: users.deliveryLocation,
              farmingType: users.farmingType,
              status: users.status,
              isVerified: users.isVerified,
              createdAt: users.createdAt,
              // Profile details
              profileId: profiles.id,
              profileFullName: profiles.fullName,
              profilePhone: profiles.phone,
              profileIdNumber: profiles.idNumber,
              profileCounty: profiles.countyRegion,
              profileDeliveryAddress: profiles.deliveryAddress,
              profileFarmingInterests: profiles.farmingInterests,
              profileCrops: profiles.crops,
              profileLivestock: profiles.livestock,
              profileNatureOfAgriculture: profiles.natureOfAgriculture,
              profileYearsFarming: profiles.yearsFarming,
              profileRole: profiles.role,
              profileStatus: profiles.status,
              profileIsVerified: profiles.isVerified,
              profileIsRetailer: profiles.isRetailer,
              profileRetailerDiscountPct: profiles.retailerDiscountPct,
              profileBio: profiles.bio,
              lifetimeValue: sql<number>`COALESCE((
                SELECT SUM(CAST(o.total AS NUMERIC))
                FROM orders o
                WHERE o.user_id = ${users.id}
                  AND o.deleted_at IS NULL
                  AND (o.payment_status = 'paid' OR o.checkout_channel = 'whatsapp')
              ), 0)`,
              ordersCount: sql<number>`COALESCE((
                SELECT COUNT(o.id)
                FROM orders o
                WHERE o.user_id = ${users.id}
                  AND o.deleted_at IS NULL
                  AND (o.payment_status = 'paid' OR o.checkout_channel = 'whatsapp')
              ), 0)`,
            })
            .from(users)
            .leftJoin(profiles, eq(users.id, profiles.id))
            .where(sql`${users.deletedAt} IS NULL AND (${profiles.role} IS NULL OR ${profiles.role}::text NOT IN ('admin', 'super_admin', 'sales_agent', 'content_editor'))`)
            .orderBy(desc(users.createdAt))
            .limit(200);

          // Query profiles concurrently in case some customer users signed up directly into profiles
          const profileListPromise = db
            .select({
              id: profiles.id,
              email: profiles.email,
              fullName: profiles.fullName,
              phone: profiles.phone,
              idNumber: profiles.idNumber,
              countyRegion: profiles.countyRegion,
              deliveryAddress: profiles.deliveryAddress,
              farmingInterests: profiles.farmingInterests,
              crops: profiles.crops,
              livestock: profiles.livestock,
              natureOfAgriculture: profiles.natureOfAgriculture,
              yearsFarming: profiles.yearsFarming,
              role: profiles.role,
              status: profiles.status,
              isVerified: profiles.isVerified,
              isRetailer: profiles.isRetailer,
              retailerDiscountPct: profiles.retailerDiscountPct,
              bio: profiles.bio,
              createdAt: profiles.createdAt,
            })
            .from(profiles)
            .where(sql`${profiles.deletedAt} IS NULL AND ${profiles.role}::text NOT IN ('admin', 'super_admin', 'sales_agent', 'content_editor')`)
            .orderBy(desc(profiles.createdAt))
            .limit(200);

          const [userList, profileList] = await Promise.all([userListPromise, profileListPromise]);

          const existingEmails = new Set(
            userList
              .map((u) => u.email?.trim().toLowerCase())
              .filter(Boolean)
          );

          const mappedUsers = userList.map((c) => {
            const rawNationalId = (c.nationalId && c.nationalId.trim()) || (c.profileIdNumber && c.profileIdNumber.trim()) || "Not Recorded";
            const rawFarmingType = (c.farmingType && c.farmingType.trim()) || (c.profileNatureOfAgriculture && c.profileNatureOfAgriculture.trim()) || "General Agriculture";
            const rawDelivery = (c.deliveryLocation && c.deliveryLocation.trim()) || (c.profileDeliveryAddress && c.profileDeliveryAddress.trim()) || "Local Town Center";
            const rawNature = (c.profileNatureOfAgriculture && c.profileNatureOfAgriculture.trim()) || (c.farmingType && c.farmingType.trim()) || "Commercial Farming";

            return {
              id: c.id,
              name: `${c.firstName || ""} ${c.lastName || ""}`.trim() || c.profileFullName || "Farmer Account",
              email: c.email,
              phone: c.phoneNumber || c.profilePhone || "N/A",
              nationalId: rawNationalId,
              county: c.county || c.profileCounty || "Kenya",
              deliveryLocation: rawDelivery,
              farmingType: rawFarmingType,
              natureOfAgriculture: rawNature,
              farmingInterests: c.profileFarmingInterests || [],
              crops: c.profileCrops || [],
              livestock: c.profileLivestock || [],
              yearsFarming: c.profileYearsFarming || 0,
              role: c.profileRole || "farmer",
              isRetailer: c.profileIsRetailer || false,
              retailerDiscountPct: c.profileRetailerDiscountPct || "0.00",
              bio: c.profileBio || "No special bio notes provided.",
              createdAt: c.createdAt,
              lifetimeValueKsh: Number(c.lifetimeValue) || 0,
              ordersCount: Number(c.ordersCount) || 0,
              isVerified: Boolean(c.isVerified ?? c.profileIsVerified ?? false),
              status: c.status || c.profileStatus || "active",
            };
          });

          // Add any customer profiles that were not matched by email in users (excluding all admin/staff roles)
          const extraProfiles = profileList
            .filter((p) => {
              if (!p.email) return false;
              const cleanEmail = p.email.trim().toLowerCase();
              return !existingEmails.has(cleanEmail) && !["admin", "super_admin", "sales_agent", "content_editor"].includes(p.role);
            })
            .map((p) => {
              const rawNationalId = (p.idNumber && p.idNumber.trim()) || "Not Recorded";
              const rawFarmingType = (p.natureOfAgriculture && p.natureOfAgriculture.trim()) || "General Agriculture";
              const rawDelivery = (p.deliveryAddress && p.deliveryAddress.trim()) || "Local Town Center";
              const rawNature = (p.natureOfAgriculture && p.natureOfAgriculture.trim()) || "Commercial Farming";

              return {
                id: p.id,
                name: p.fullName || "Farmer Account",
                email: p.email,
                phone: p.phone || "N/A",
                nationalId: rawNationalId,
                county: p.countyRegion || "Kenya",
                deliveryLocation: rawDelivery,
                farmingType: rawFarmingType,
                natureOfAgriculture: rawNature,
                farmingInterests: p.farmingInterests || [],
                crops: p.crops || [],
                livestock: p.livestock || [],
                yearsFarming: p.yearsFarming || 0,
                role: p.role || "farmer",
                isRetailer: p.isRetailer || false,
                retailerDiscountPct: p.retailerDiscountPct || "0.00",
                bio: p.bio || "No special bio notes provided.",
                createdAt: p.createdAt,
                lifetimeValueKsh: 0,
                ordersCount: 0,
                isVerified: Boolean(p.isVerified ?? false),
                status: p.status || "active",
              };
            });

          const combinedCustomers = [...mappedUsers, ...extraProfiles];

          const payload = {
            success: true,
            totalCount: combinedCustomers.length,
            customers: combinedCustomers,
          };

          // Store in high-performance server cache for sub-millisecond repeated responses
          serverCustomersCache = {
            payload,
            timestamp: Date.now(),
          };

          return new Response(
            JSON.stringify(payload),
            { 
              headers: { 
                "Content-Type": "application/json",
                "X-Server-Cache": "MISS",
                "Cache-Control": "private, no-cache",
              } 
            }
          );
        } catch (error: any) {
          console.error("Fetch customers error:", error);
          return new Response(JSON.stringify({ success: false, error: error.message }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
          });
        }
      },
      POST: async ({ request }) => {
        const auth = await requireAdminAuth(request);
        if ("response" in auth) return auth.response;
        try {
          const body = await request.json();
          const { id, action, status, notes, actorId = "system-admin" } = body;

          if (!id || !action) {
            return new Response(JSON.stringify({ success: false, error: "Missing required parameters" }), {
              status: 400,
              headers: { "Content-Type": "application/json" },
            });
          }

          if (action === "update_status") {
            if (!hasPermission(auth.user.role, "customers.update")) {
              return new Response(JSON.stringify({ success: false, error: `Forbidden: role '${auth.user.role}' cannot update customer status.` }), {
                status: 403,
                headers: { "Content-Type": "application/json" },
              });
            }

            const allowedStatuses = ["active", "suspended", "inactive"];
            if (!status || !allowedStatuses.includes(status)) {
              return new Response(JSON.stringify({ success: false, error: "Invalid status value. Allowed: active, suspended, inactive" }), {
                status: 400,
                headers: { "Content-Type": "application/json" },
              });
            }

            const { getDb } = await import("@/lib/db.server");
            const sql = getDb();
            let updatedCount = 0;

            await sql.begin(async (tx: any) => {
              const userRes = await tx`
                UPDATE users 
                SET status = ${status} 
                WHERE id = ${id}
                RETURNING id
              `;
              const profileRes = await tx`
                UPDATE profiles 
                SET status = ${status} 
                WHERE id = ${id}
                RETURNING id
              `;
              updatedCount = userRes.length + profileRes.length;
              if (updatedCount === 0) {
                throw new Error("Customer not found");
              }

              await logAdminAction({
                actorId: auth.user?.id || actorId,
                action: `CUSTOMER_STATUS_${status.toUpperCase()}`,
                entity: "users",
                entityId: id,
                diff: { status, notes },
              });
            });

            invalidateCustomersServerCache();

            return new Response(
              JSON.stringify({ success: true, message: `Customer status updated to ${status}` }),
              { headers: { "Content-Type": "application/json" } }
            );
          }

          if (action === "verify_kyc") {
            if (!hasPermission(auth.user.role, "customers.update")) {
              return new Response(JSON.stringify({ success: false, error: `Forbidden: role '${auth.user.role}' cannot verify customer KYC.` }), {
                status: 403,
                headers: { "Content-Type": "application/json" },
              });
            }

            const isVerified = body.isVerified !== undefined ? Boolean(body.isVerified) : true;
            const { getDb } = await import("@/lib/db.server");
            const sql = getDb();
            let updatedCount = 0;

            await sql.begin(async (tx: any) => {
              const userRes = await tx`
                UPDATE users 
                SET is_verified = ${isVerified} 
                WHERE id = ${id}
                RETURNING id
              `;
              const profileRes = await tx`
                UPDATE profiles 
                SET is_verified = ${isVerified} 
                WHERE id = ${id}
                RETURNING id
              `;
              updatedCount = userRes.length + profileRes.length;
              if (updatedCount === 0) {
                throw new Error("Customer not found");
              }

              await logAdminAction({
                actorId: auth.user?.id || actorId,
                action: isVerified ? "CUSTOMER_KYC_VERIFIED" : "CUSTOMER_KYC_UNVERIFIED",
                entity: "users",
                entityId: id,
                diff: { isVerified },
              });
            });

            invalidateCustomersServerCache();

            return new Response(
              JSON.stringify({ success: true, message: `Customer KYC verification set to ${isVerified}` }),
              { headers: { "Content-Type": "application/json" } }
            );
          }

          if (action === "delete_customer") {
            if (!hasPermission(auth.user.role, "customers.delete")) {
              return new Response(JSON.stringify({ success: false, error: `Forbidden: role '${auth.user.role}' cannot delete customers.` }), {
                status: 403,
                headers: { "Content-Type": "application/json" },
              });
            }

            if (!id || typeof id !== "string") {
              return new Response(JSON.stringify({ success: false, error: "Invalid customer ID provided." }), {
                status: 400,
                headers: { "Content-Type": "application/json" },
              });
            }

            const safeId = id.trim();
            const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
            if (!uuidRegex.test(safeId)) {
              return new Response(JSON.stringify({ success: false, error: "Invalid customer UUID format." }), {
                status: 400,
                headers: { "Content-Type": "application/json" },
              });
            }

            const { getDb } = await import("@/lib/db.server");
            const sql = getDb();

            // Prevent deleting system administrators
            const [targetProfile] = await sql`
              SELECT role, email FROM profiles WHERE id = ${safeId}
            `;
            if (targetProfile && ["admin", "super_admin"].includes(targetProfile.role)) {
              return new Response(JSON.stringify({ 
                success: false, 
                error: "System Security Policy: Administrator accounts cannot be deleted from Customer Management." 
              }), {
                status: 403,
                headers: { "Content-Type": "application/json" },
              });
            }

            await sql.begin(async (tx: any) => {
              // Execute all dependent cleanups in a single, high-performance atomic block with direct index lookups
              await tx.unsafe(`
                DO $delete_customer_block$
                DECLARE
                  uid UUID := '${safeId}'::UUID;
                BEGIN
                  -- 1. Clean order items, payments, and orders
                  DELETE FROM payments WHERE order_id IN (SELECT id FROM orders WHERE user_id = uid);
                  DELETE FROM order_items WHERE order_id IN (SELECT id FROM orders WHERE user_id = uid);
                  DELETE FROM orders WHERE user_id = uid;

                  -- 2. Clean community forum likes, bookmarks, comments, and posts (split for direct B-tree index scans)
                  DELETE FROM show_likes WHERE user_id = uid;
                  DELETE FROM show_bookmarks WHERE user_id = uid;
                  DELETE FROM show_comments WHERE user_id = uid;
                  DELETE FROM show_likes WHERE post_id IN (SELECT id FROM show_posts WHERE user_id = uid);
                  DELETE FROM show_bookmarks WHERE post_id IN (SELECT id FROM show_posts WHERE user_id = uid);
                  DELETE FROM show_comments WHERE post_id IN (SELECT id FROM show_posts WHERE user_id = uid);
                  DELETE FROM show_posts WHERE user_id = uid;

                  -- 3. Clean user commodity listings, service requests, diagnoses, and reports
                  DELETE FROM commodity_listings WHERE user_id = uid;
                  DELETE FROM service_requests WHERE user_id = uid;
                  DELETE FROM crop_diagnoses WHERE user_id = uid;
                  DELETE FROM forum_reports WHERE reporter_id = uid;

                  -- 4. Clean direct messages, sessions, logs, activity, notifications (resilient against table variations)
                  BEGIN
                    DELETE FROM direct_messages WHERE sender_id = uid OR recipient_id = uid;
                  EXCEPTION WHEN undefined_table THEN NULL;
                  END;

                  BEGIN
                    DELETE FROM user_sessions WHERE user_id = uid;
                  EXCEPTION WHEN undefined_table THEN NULL;
                  END;

                  BEGIN
                    DELETE FROM user_logs WHERE user_id = uid;
                  EXCEPTION WHEN undefined_table THEN NULL;
                  END;

                  BEGIN
                    DELETE FROM user_activity_logs WHERE user_id = uid;
                  EXCEPTION WHEN undefined_table THEN NULL;
                  END;

                  BEGIN
                    DELETE FROM notifications WHERE user_id = uid;
                  EXCEPTION WHEN undefined_table THEN NULL;
                  END;

                  -- 5. Delete core profile and user records
                  DELETE FROM profiles WHERE id = uid;
                  DELETE FROM users WHERE id = uid;
                END $delete_customer_block$;
              `);
            });

            await logAdminAction({
              actorId: auth.user.id,
              action: "DELETE_CUSTOMER",
              entity: "users",
              entityId: safeId,
              diff: { deleted: true },
            });

            invalidateCustomersServerCache();

            return new Response(
              JSON.stringify({ success: true, message: "Customer account permanently deleted from Mqulima database." }),
              { headers: { "Content-Type": "application/json" } }
            );
          }

          return new Response(JSON.stringify({ success: false, error: "Invalid action" }), {
            status: 400,
            headers: { "Content-Type": "application/json" },
          });
        } catch (error: any) {
          return new Response(JSON.stringify({ success: false, error: error.message }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
          });
        }
      },
    },
  },
});
