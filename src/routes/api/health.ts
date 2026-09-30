import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/health")({
  server: {
    handlers: {
      GET: async ({ request }: { request: Request }) => {
        const url = new URL(request.url, "http://localhost:8080");
        const checkDb = url.searchParams.get("db") !== "0";
        const checkRedis = url.searchParams.get("redis") !== "0";
        const isStrict = url.searchParams.get("strict") === "1";

        let dbStatus = "not_checked";
        let dbLatencyMs = 0;

        if (checkDb) {
          try {
            const start = performance.now();
            const { getDb } = await import("@/lib/db.server");
            const sql = getDb();
            const dbPromise = sql`SELECT 1`;
            const dbTimeout = new Promise((_, reject) =>
              setTimeout(() => reject(new Error("Database ping timed out (3000ms)")), 3000)
            );
            await Promise.race([dbPromise, dbTimeout]);
            dbLatencyMs = Math.round(performance.now() - start);
            dbStatus = "connected";
          } catch (e: any) {
            dbStatus = `error: ${e.message}`;
          }
        }

        let redisStatus = "not_checked";
        let redisLatencyMs = 0;

        if (checkRedis) {
          const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
          const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;
          if (!redisUrl || !redisToken) {
            redisStatus = "unconfigured";
          } else {
            try {
              const rStart = performance.now();
              const { Redis } = await import("@upstash/redis");
              const client = new Redis({ url: redisUrl, token: redisToken });
              const pingPromise = client.ping();
              const pingTimeout = new Promise((_, reject) =>
                setTimeout(() => reject(new Error("Redis ping timed out (3000ms)")), 3000)
              );
              await Promise.race([pingPromise, pingTimeout]);
              redisLatencyMs = Math.round(performance.now() - rStart);
              redisStatus = "connected";
            } catch (err: any) {
              redisStatus = `error: ${err.message}`;
            }
          }
        }

        const mem = process.memoryUsage();
        const dbOk = dbStatus === "connected" || dbStatus === "not_checked";
        const redisOk = redisStatus === "connected" || redisStatus === "not_checked" || redisStatus === "unconfigured";
        const isHealthy = dbOk && redisOk;
        const httpStatus = !isHealthy && isStrict ? 503 : 200;

        return new Response(
          JSON.stringify({
            status: isHealthy ? "healthy" : "degraded",
            timestamp: new Date().toISOString(),
            uptimeSeconds: Math.round(process.uptime()),
            service: "mqulima-platform",
            environment: process.env.NODE_ENV || "development",
            memory: {
              rssMb: Math.round(mem.rss / (1024 * 1024)),
              heapUsedMb: Math.round(mem.heapUsed / (1024 * 1024)),
            },
            database: {
              status: dbStatus,
              latencyMs: dbLatencyMs,
            },
            redis: {
              status: redisStatus,
              latencyMs: redisLatencyMs,
            },
          }),
          {
            status: httpStatus,
            headers: {
              "Content-Type": "application/json",
              "Cache-Control": "no-store, no-cache, must-revalidate",
            },
          }
        );
      },
    },
  },
});
