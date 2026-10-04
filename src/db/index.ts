import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { getServerConfig } from "../lib/config.server";
import * as schema from "./schema";

declare global {
  var __mq_raw_sql__: ReturnType<typeof postgres> | undefined;
  var __mq_drizzle_db__: ReturnType<typeof drizzle<typeof schema>> | undefined;
}

export function getRawSql() {
  if (!globalThis.__mq_raw_sql__) {
    const config = getServerConfig();
    const connectionString = config.DATABASE_URL;

    if (!connectionString) {
      throw new Error("[FATAL] Unable to initialize PostgreSQL connection: DATABASE_URL is unconfigured.");
    }

    const isLocal = connectionString.includes("localhost") || connectionString.includes("127.0.0.1") || connectionString.includes("::1");
    const requiresSsl = !isLocal || connectionString.includes("sslmode=require");
    const isServerless = process.env.VERCEL === "1" || process.env.AWS_LAMBDA_FUNCTION_NAME !== undefined;
    globalThis.__mq_raw_sql__ = postgres(connectionString, {
      max: isServerless ? 2 : 5,
      idle_timeout: 10,
      connect_timeout: 10,
      ssl: requiresSsl ? { rejectUnauthorized: false } : false,
      onnotice: () => {},
    });
  }
  return globalThis.__mq_raw_sql__;
}

export function getDb() {
  if (!globalThis.__mq_drizzle_db__) {
    const sql = getRawSql();
    globalThis.__mq_drizzle_db__ = drizzle(sql, { schema });
    // Restore postgres date serializers overridden by drizzle-orm
    const dateSerializer = (x: any) => (x instanceof Date ? x : new Date(x)).toISOString();
    for (const type of ["1184", "1082", "1083", "1114", "1182", "1185", "1115", "1231"]) {
      if ((sql as any)?.options?.serializers) {
        (sql as any).options.serializers[type] = dateSerializer;
      }
    }
  }
  return globalThis.__mq_drizzle_db__;
}

export const db = new Proxy({} as ReturnType<typeof drizzle<typeof schema>>, {
  get(_target, prop) {
    const instance = getDb();
    const value = (instance as any)[prop];
    return typeof value === "function" ? value.bind(instance) : value;
  },
});

export * from "./schema";
