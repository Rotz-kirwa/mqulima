import postgres from "postgres";
import process from "node:process";
import { getServerConfig } from "./config.server";

// Server-only PostgreSQL client.
// Uses the `postgres` (porsager) library — lightweight, no ORM overhead.
// Connection string from validated DATABASE_URL environment configuration.

let sql: ReturnType<typeof postgres> | null = null;
let schemaPatched = false;

async function autoPatchSchema(sqlInstance: ReturnType<typeof postgres>) {
  if (schemaPatched) return;
  schemaPatched = true;
  try {
    await sqlInstance`
      ALTER TABLE profiles 
        ADD COLUMN IF NOT EXISTS bio TEXT,
        ADD COLUMN IF NOT EXISTS website TEXT,
        ADD COLUMN IF NOT EXISTS cover_image TEXT,
        ADD COLUMN IF NOT EXISTS farming_activities TEXT,
        ADD COLUMN IF NOT EXISTS farming_photos TEXT[] DEFAULT '{}';
    `;
  } catch (err) {
    console.warn("[WARN] Auto-patch schema notice:", err);
  }
}

export function getDb() {
  if (!sql) {
    const config = getServerConfig();
    const connectionString = config.DATABASE_URL;

    if (!connectionString) {
      throw new Error("[FATAL] Unable to initialize PostgreSQL database pool: DATABASE_URL is missing or unconfigured.");
    }

    const isLocal = connectionString.includes("localhost") || connectionString.includes("127.0.0.1") || connectionString.includes("::1");
    sql = postgres(connectionString, {
      max: 10,
      idle_timeout: 20,
      connect_timeout: 10,
      ssl: isLocal ? false : { rejectUnauthorized: false },
      onnotice: () => {},
    });

    autoPatchSchema(sql).catch(() => {});
  }
  return sql;
}

export function resetDbPool() {
  if (sql) {
    try {
      sql.end();
    } catch {}
    sql = null;
  }
}

// Re-export the sql tagged template type for use in server functions
export type Sql = ReturnType<typeof postgres>;
