import postgres from "postgres";
import process from "node:process";

let sql: ReturnType<typeof postgres>;

export function getDb() {
  console.log("[SERVER] getDb() called. DATABASE_URL = ", process.env.DATABASE_URL);
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
      ssl: isLocal ? false : { rejectUnauthorized: false },
    });
  }
  return sql;
}

export function getDbDebugInfo() {
  const connectionString = process.env.DATABASE_URL || "";
  const isLocal = connectionString.includes("localhost") || connectionString.includes("127.0.0.1") || connectionString.includes("::1");
  return {
    hasConnectionString: !!connectionString,
    isLocal,
    maskedUrl: connectionString.replace(/:[^:@]+@/, ":****@")
  };
}

export type Sql = ReturnType<typeof postgres>;
