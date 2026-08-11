import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { getServerConfig } from "../lib/config.server";
import * as schema from "./schema";

let sqlInstance: ReturnType<typeof postgres> | null = null;
let dbInstance: ReturnType<typeof drizzle<typeof schema>> | null = null;

export function getRawSql() {
  if (!sqlInstance) {
    const config = getServerConfig();
    const connectionString = config.DATABASE_URL;

    if (!connectionString) {
      throw new Error("[FATAL] Unable to initialize PostgreSQL connection: DATABASE_URL is unconfigured.");
    }

    const isLocal = connectionString.includes("localhost") || connectionString.includes("127.0.0.1") || connectionString.includes("::1");
    sqlInstance = postgres(connectionString, {
      max: 10,
      idle_timeout: 20,
      connect_timeout: 10,
      ssl: isLocal ? false : { rejectUnauthorized: false },
      onnotice: () => {},
    });
  }
  return sqlInstance;
}

export function getDb() {
  if (!dbInstance) {
    const sql = getRawSql();
    dbInstance = drizzle(sql, { schema });
  }
  return dbInstance;
}

export const db = new Proxy({} as ReturnType<typeof drizzle<typeof schema>>, {
  get(_target, prop) {
    const instance = getDb();
    const value = (instance as any)[prop];
    return typeof value === "function" ? value.bind(instance) : value;
  },
});

export * from "./schema";
