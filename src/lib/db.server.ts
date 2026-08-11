import { db, getDb as getDrizzleDb, getRawSql } from "../db";

// Export Drizzle ORM client instance directly for type-safe queries
export { db, getDrizzleDb };

// Backward compatible raw SQL client helper (returns postgres driver instance)
export function getDb() {
  return getRawSql();
}

export function resetDbPool() {
  const sql = getRawSql();
  if (sql) {
    try {
      sql.end();
    } catch {}
  }
}

export type Sql = ReturnType<typeof getRawSql>;
