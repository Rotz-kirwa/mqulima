import crypto from "node:crypto";
import { getDb } from "./db.server";
import { writeAuditLog } from "./audit.server";

/**
 * Permanently anonymizes personal user data while retaining anonymized
 * statutory financial records, matching mobile and web account deletion rules.
 */
export async function anonymizeUserAccount(userId: string, ipAddress?: string | null) {
  const sql = getDb();
  const anonSuffix = `${userId.replace(/[^a-f0-9]/gi, "").slice(0, 12)}_${Date.now()}`;
  const anonymizedEmail = `deleted_${anonSuffix}@deleted.mqulima.local`;
  const anonymizedUsername = `mqulima_deleted_${anonSuffix}`;
  const revokedPasswordSentinel = `$2b$10$revoked${crypto.randomBytes(24).toString("hex")}`;

  await sql.begin(async (tx: any) => {
    const [profileRow] = await tx`
      SELECT id, role, deleted_at
      FROM profiles
      WHERE id = ${userId}
      FOR UPDATE
    `;

    if (profileRow) {
      if (profileRow.role === "admin" || profileRow.role === "super_admin") {
        const forbiddenErr = new Error("Administrator accounts cannot be self-deleted.") as Error & { status?: number };
        forbiddenErr.status = 403;
        throw forbiddenErr;
      }
      if (profileRow.deleted_at) {
        const goneErr = new Error("Account has already been deleted.") as Error & { status?: number };
        goneErr.status = 404;
        throw goneErr;
      }

      await tx`
        UPDATE profiles
        SET email = ${anonymizedEmail},
            username = ${anonymizedUsername},
            full_name = 'Deleted User',
            phone = NULL,
            id_number = NULL,
            delivery_address = NULL,
            avatar_url = NULL,
            whatsapp_number = NULL,
            bio = NULL,
            website = NULL,
            cover_image = NULL,
            crops = '{}',
            livestock = '{}',
            password_hash = ${revokedPasswordSentinel},
            status = 'deleted',
            deleted_at = NOW(),
            updated_at = NOW()
        WHERE id = ${userId}
      `;
    }

    await tx`
      UPDATE users
      SET email = ${anonymizedEmail},
          first_name = 'Deleted',
          last_name = 'User',
          phone_number = NULL,
          national_id = NULL,
          delivery_location = 'Deleted',
          landmark = NULL,
          password_hash = ${revokedPasswordSentinel},
          status = 'deleted',
          deleted_at = NOW()
      WHERE id = ${userId}
    `.catch(() => {});

    await tx`DELETE FROM recovery_tokens WHERE user_id = ${userId}`.catch(() => {});
    await tx`DELETE FROM email_verifications WHERE user_id = ${userId}`.catch(() => {});
  });

  await writeAuditLog({
    actorId: userId,
    action: "account.deleted",
    ipAddress: ipAddress || "unknown",
    entityType: "profile",
    entityId: userId,
    diff: { anonymized: true, retainedFinancialRecords: true },
  }).catch(() => {});
}

