import { createFileRoute } from "@tanstack/react-router";
import { db } from "@/lib/db.server";
import { users } from "@/db/schema/users";
import { profiles } from "@/db/schema/profiles";
import { orders } from "@/db/schema/orders";
import { eq, desc, sql } from "drizzle-orm";
import { logAdminAction } from "@/lib/audit.server";
import { requireAdminAuth, hasPermission } from "@/lib/api/admin-auth.server";

export const Route = createFileRoute("/api/admin/customers")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const auth = await requireAdminAuth(request, "customers.read");
        if ("response" in auth) return auth.response;
        try {
          // Fetch users merged with profiles and lifetime order totals
          const userList = await db
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
              lifetimeValue: sql<number>`COALESCE(SUM(CASE WHEN ${orders.paymentStatus} = 'paid' OR ${orders.checkoutChannel} = 'whatsapp' THEN CAST(${orders.total} AS NUMERIC) ELSE 0 END), 0)`,
              ordersCount: sql<number>`COUNT(DISTINCT CASE WHEN ${orders.paymentStatus} = 'paid' OR ${orders.checkoutChannel} = 'whatsapp' THEN ${orders.id} ELSE NULL END)`,
            })
            .from(users)
            .leftJoin(profiles, eq(users.id, profiles.id))
            .leftJoin(orders, eq(users.id, orders.userId))
            .groupBy(
              users.id,
              users.firstName,
              users.lastName,
              users.email,
              users.phoneNumber,
              users.nationalId,
              users.county,
              users.deliveryLocation,
              users.farmingType,
              users.status,
              users.isVerified,
              users.createdAt,
              profiles.id,
              profiles.fullName,
              profiles.phone,
              profiles.idNumber,
              profiles.countyRegion,
              profiles.deliveryAddress,
              profiles.farmingInterests,
              profiles.crops,
              profiles.livestock,
              profiles.natureOfAgriculture,
              profiles.yearsFarming,
              profiles.role,
              profiles.status,
              profiles.isVerified,
              profiles.isRetailer,
              profiles.retailerDiscountPct,
              profiles.bio
            )
            .orderBy(desc(users.createdAt))
            .limit(100);

          // Also query profiles standalone in case some users signed up directly into profiles
          const profileList = await db
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
            .orderBy(desc(profiles.createdAt))
            .limit(100);

          const existingEmails = new Set(userList.map((u) => u.email.toLowerCase()));

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

          // Add any customer profiles that were not matched by email in users
          const extraProfiles = profileList
            .filter((p) => !existingEmails.has(p.email.toLowerCase()) && p.role !== "admin" && p.role !== "super_admin")
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

          return new Response(
            JSON.stringify({
              success: true,
              customers: combinedCustomers,
            }),
            { headers: { "Content-Type": "application/json" } }
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

            const { getDb } = await import("@/lib/db.server");
            const sql = getDb();
            await sql.begin(async (tx: any) => {
              // Delete order payments and items
              await tx`DELETE FROM payments WHERE order_id IN (SELECT id FROM orders WHERE user_id = ${id})`;
              await tx`DELETE FROM order_items WHERE order_id IN (SELECT id FROM orders WHERE user_id = ${id})`;
              await tx`DELETE FROM orders WHERE user_id = ${id}`;

              // Delete community forum interactions & posts
              await tx`DELETE FROM show_likes WHERE user_id = ${id} OR post_id IN (SELECT id FROM show_posts WHERE user_id = ${id})`;
              await tx`DELETE FROM show_bookmarks WHERE user_id = ${id} OR post_id IN (SELECT id FROM show_posts WHERE user_id = ${id})`;
              await tx`DELETE FROM show_comments WHERE user_id = ${id} OR post_id IN (SELECT id FROM show_posts WHERE user_id = ${id})`;
              await tx`DELETE FROM show_posts WHERE user_id = ${id}`;

              // Delete marketplace listings & service requests & diagnoses
              await tx`DELETE FROM commodity_listings WHERE user_id = ${id}`;
              await tx`DELETE FROM service_requests WHERE user_id = ${id}`;
              await tx`DELETE FROM crop_diagnoses WHERE user_id = ${id}`;
              await tx`DELETE FROM forum_reports WHERE reporter_id = ${id}`;

              // Delete user session & audit records
              await tx`DELETE FROM user_sessions WHERE user_id = ${id}`;
              await tx`DELETE FROM user_logs WHERE user_id = ${id}`;
              await tx`DELETE FROM user_activity_logs WHERE user_id = ${id}`;
              await tx`DELETE FROM notifications WHERE user_id = ${id}`;

              // Delete primary user profile and identity
              await tx`DELETE FROM profiles WHERE id = ${id}`;
              await tx`DELETE FROM users WHERE id = ${id}`;
            });

            await logAdminAction({
              actorId: auth.user.id,
              action: "DELETE_CUSTOMER",
              entity: "users",
              entityId: id,
              diff: { deleted: true },
            });

            return new Response(
              JSON.stringify({ success: true, message: "Customer account permanently deleted." }),
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
