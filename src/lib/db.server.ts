import postgres from "postgres";
import process from "node:process";
import { getServerConfig } from "./config.server";

// Server-only PostgreSQL client.
// Uses the `postgres` (porsager) library — lightweight, no ORM overhead.
// Connection string from validated DATABASE_URL environment configuration.

let sql: ReturnType<typeof postgres> | null = null;

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
