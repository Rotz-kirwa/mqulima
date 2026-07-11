import postgres from "postgres";
import process from "node:process";

// Server-only PostgreSQL client.
// Uses the `postgres` (porsager) library — lightweight, no ORM overhead.
// Connection string from DATABASE_URL env var.

let sql: ReturnType<typeof postgres>;

export function getDb() {
  if (!sql) {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error(
        "DATABASE_URL is not set. Add it to .env:\n" +
          "DATABASE_URL=postgresql://mqulima:password@localhost:5433/mqulima_dev"
      );
    }
    const isLocal = connectionString.includes("localhost") || connectionString.includes("127.0.0.1") || connectionString.includes("::1");
    sql = postgres(connectionString, {
      max: 10,
      idle_timeout: 20,
      connect_timeout: 10,
      ssl: isLocal ? false : "require",
    });
  }
  return sql;
}

// Re-export the sql tagged template type for use in server functions
export type Sql = ReturnType<typeof postgres>;
