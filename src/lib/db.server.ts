import { db, getDb as getDrizzleDb, getRawSql, resetRawSql } from "../db";

// Export Drizzle ORM client instance directly for type-safe queries
export { db, getDrizzleDb };

// Backward compatible raw SQL client helper (returns postgres driver instance)
export function getDb() {
  return getRawSql();
}

export function resetDbPool() {
  resetRawSql();
}

export type Sql = ReturnType<typeof getRawSql>;

function isTransientDbError(err: unknown): boolean {
  const msg = String((err as any)?.message || (err as any)?.code || "").toUpperCase();
  return (
    msg.includes("CONNECT_TIMEOUT") ||
    msg.includes("CONNECTION_ENDED") ||
    msg.includes("CONNECTION_DESTROYED") ||
    msg.includes("CONNECTION_CLOSED") ||
    msg.includes("ECONNRESET") ||
    msg.includes("ETIMEDOUT") ||
    msg.includes("EPIPE") ||
    msg.includes("TERMINATED")
  );
}

/** Runs a query callback and retries once with a reset pool on transient connection drops. */
export async function withDbRetry<T>(fn: (sql: Sql) => Promise<T>): Promise<T> {
  try {
    return await fn(getDb());
  } catch (err) {
    if (!isTransientDbError(err)) throw err;
    resetDbPool();
    return await fn(getDb());
  }
}
