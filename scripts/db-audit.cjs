const fs = require("fs");
const postgres = require("postgres");

function loadEnv() {
  if (fs.existsSync(".env")) {
    fs.readFileSync(".env", "utf8").split("\n").forEach(l => {
      const trimmed = l.trim();
      if (!trimmed || trimmed.startsWith("#")) return;
      const [k, ...v] = trimmed.split("=");
      if (k && v.length) process.env[k] = v.join("=").trim().replace(/^["\x27]|["\x27]$/g, "");
    });
  }
}
loadEnv();

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL not found in .env");
  process.exit(1);
}

const sql = postgres(process.env.DATABASE_URL, { ssl: "require", max: 3, idle_timeout: 10 });

async function audit() {
  const report = {};
  console.log("=== STARTING READ-ONLY POSTGRESQL AUDIT ===");

  // 1. Connection & Provider & Region
  const urlObj = new URL(process.env.DATABASE_URL);
  report.provider = "Render PostgreSQL";
  report.host = urlObj.host;
  report.database = urlObj.pathname.replace(/^\//, "");
  report.region = "Ohio (us-east-2)";

  // Measure roundtrip latency (5 samples)
  const latencies = [];
  for (let i = 0; i < 5; i++) {
    const t0 = process.hrtime.bigint();
    await sql`SELECT 1`;
    const t1 = process.hrtime.bigint();
    latencies.push(Number(t1 - t0) / 1e6);
  }
  latencies.sort((a, b) => a - b);
  report.latency_ms = {
    min: latencies[0].toFixed(2),
    median: latencies[2].toFixed(2),
    max: latencies[4].toFixed(2),
  };

  // Postgres version & settings
  const [v] = await sql`SELECT version()`;
  report.version = v.version;

  const [settings] = await sql`
    SELECT
      current_setting('max_connections') as max_connections,
      current_setting('shared_buffers') as shared_buffers,
      current_setting('work_mem') as work_mem,
      current_setting('statement_timeout') as statement_timeout,
      current_setting('lock_timeout') as lock_timeout,
      current_setting('idle_in_transaction_session_timeout') as idle_in_transaction_session_timeout
  `;
  report.settings = settings;

  const [dbSize] = await sql`SELECT pg_size_pretty(pg_database_size(current_database())) as size`;
  report.db_size = dbSize.size;

  const [activeConn] = await sql`
    SELECT count(*) as total,
           count(*) FILTER (WHERE state = 'active') as active,
           count(*) FILTER (WHERE state = 'idle') as idle
    FROM pg_stat_activity
    WHERE datname = current_database()
  `;
  report.connections = activeConn;

  // Cache hit ratio
  const [cacheHit] = await sql`
    SELECT
      sum(heap_blks_read) as heap_read,
      sum(heap_blks_hit)  as heap_hit,
      round(sum(heap_blks_hit) / nullif(sum(heap_blks_hit) + sum(heap_blks_read), 0) * 100, 2) as hit_ratio
    FROM pg_statio_user_tables;
  `;
  report.cache_hit_ratio = cacheHit;

  // 2. All tables with row count, table size, index size, total size, dead tuples, vacuum/analyze
  const tables = await sql`
    SELECT
      c.relname as table_name,
      c.reltuples::bigint as estimated_rows,
      pg_size_pretty(pg_table_size(c.oid)) as table_size,
      pg_size_pretty(pg_indexes_size(c.oid)) as index_size,
      pg_size_pretty(pg_total_relation_size(c.oid)) as total_size,
      pg_total_relation_size(c.oid) as total_bytes,
      s.n_dead_tup as dead_tuples,
      s.n_live_tup as live_tuples,
      s.last_vacuum,
      s.last_autovacuum,
      s.last_analyze,
      s.last_autoanalyze
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    LEFT JOIN pg_stat_user_tables s ON s.relid = c.oid
    WHERE n.nspname = 'public' AND c.relkind = 'r'
    ORDER BY pg_total_relation_size(c.oid) DESC;
  `;

  // Get exact row counts for public tables
  for (const t of tables) {
    try {
      const [cnt] = await sql`SELECT count(*) FROM ${sql(t.table_name)}`;
      t.exact_rows = Number(cnt.count);
    } catch (e) {
      t.exact_rows = t.estimated_rows;
    }
  }
  report.tables = tables;

  // 3. Foreign Keys
  const foreignKeys = await sql`
    SELECT
      tc.table_name,
      kcu.column_name,
      ccu.table_name AS foreign_table_name,
      ccu.column_name AS foreign_column_name,
      rc.update_rule,
      rc.delete_rule
    FROM information_schema.table_constraints AS tc
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.referential_constraints AS rc
      ON tc.constraint_name = rc.constraint_name
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
    WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_schema = 'public'
    ORDER BY tc.table_name, kcu.column_name;
  `;
  report.foreign_keys = foreignKeys;

  // 4. Indexes & Unused Indexes
  const allIndexes = await sql`
    SELECT
      schemaname,
      relname as table_name,
      indexrelname as index_name,
      pg_size_pretty(pg_relation_size(indexrelid)) as index_size,
      idx_scan,
      idx_tup_read,
      idx_tup_fetch
    FROM pg_stat_user_indexes
    ORDER BY idx_scan ASC, pg_relation_size(indexrelid) DESC;
  `;
  report.indexes = allIndexes;
  report.unused_indexes = allIndexes.filter(i => Number(i.idx_scan) === 0);

  // 5. pg_stat_statements check
  try {
    const [ext] = await sql`SELECT * FROM pg_extension WHERE extname = 'pg_stat_statements'`;
    if (ext) {
      report.pg_stat_statements_installed = true;
      const topTotal = await sql`
        SELECT query, calls, round(total_exec_time::numeric, 2) as total_ms,
               round(mean_exec_time::numeric, 2) as mean_ms, rows
        FROM pg_stat_statements
        WHERE query NOT LIKE '%pg_stat%'
        ORDER BY total_exec_time DESC
        LIMIT 20;
      `;
      const topMean = await sql`
        SELECT query, calls, round(total_exec_time::numeric, 2) as total_ms,
               round(mean_exec_time::numeric, 2) as mean_ms, rows
        FROM pg_stat_statements
        WHERE query NOT LIKE '%pg_stat%'
        ORDER BY mean_exec_time DESC
        LIMIT 20;
      `;
      report.top_queries_by_total_time = topTotal;
      report.top_queries_by_mean_time = topMean;
    } else {
      report.pg_stat_statements_installed = false;
      report.pg_stat_statements_note = "Extension pg_stat_statements is not currently loaded in shared_preload_libraries or created.";
    }
  } catch (e) {
    report.pg_stat_statements_installed = false;
    report.pg_stat_statements_error = e.message;
  }

  // 6. Check Bloat & Dead Tuples
  const bloatInfo = await sql`
    SELECT
      relname,
      n_live_tup,
      n_dead_tup,
      round((n_dead_tup::numeric / nullif(n_live_tup + n_dead_tup, 0)) * 100, 2) as dead_tup_pct
    FROM pg_stat_user_tables
    ORDER BY n_dead_tup DESC;
  `;
  report.dead_tuples_summary = bloatInfo;

  // Output intermediate JSON report
  fs.writeFileSync("scripts/db-audit-output.json", JSON.stringify(report, null, 2));
  console.log("=== DB AUDIT STEP 1 PARTIAL WRITTEN TO scripts/db-audit-output.json ===");
  await sql.end();
}

audit().catch(console.error);
