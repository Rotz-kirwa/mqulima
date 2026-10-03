const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");
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

const dbUrl = process.env.DATABASE_URL;
if (!dbUrl) {
  console.error("Missing DATABASE_URL");
  process.exit(1);
}

const backupsDir = path.resolve("backups");
if (!fs.existsSync(backupsDir)) {
  fs.mkdirSync(backupsDir, { recursive: true });
}

const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
const customDumpFile = `mqulima_backup_${timestamp}.dump`;
const schemaDumpFile = `mqulima_schema_${timestamp}.sql`;

const customDumpPath = path.join(backupsDir, customDumpFile);
const schemaDumpPath = path.join(backupsDir, schemaDumpFile);

async function main() {
  console.log("=== STEP 7: BACKUP & RESTORE VERIFICATION ===");

  // 1. Produce schema-only dump
  console.log("1. Generating schema-only dump via PostgreSQL 18 container...");
  const tSchemaStart = Date.now();
  execSync(`docker run --rm --network host postgres:18 pg_dump "${dbUrl}" --schema-only > "${schemaDumpPath}"`, {
    stdio: "inherit"
  });
  const schemaDuration = ((Date.now() - tSchemaStart) / 1000).toFixed(2);
  const schemaSize = fs.statSync(schemaDumpPath).size;
  console.log(`Schema dump created: ${schemaDumpFile} (${(schemaSize / 1024).toFixed(1)} kB) in ${schemaDuration}s`);

  // 2. Produce real custom-format pg_dump (-Fc)
  console.log("2. Generating custom-format (-Fc) pg_dump via PostgreSQL 18 container...");
  const tDumpStart = Date.now();
  execSync(`docker run --rm --network host -v "${backupsDir}:/backups" postgres:18 pg_dump "${dbUrl}" -Fc -f "/backups/${customDumpFile}"`, {
    stdio: "inherit"
  });
  const dumpDuration = ((Date.now() - tDumpStart) / 1000).toFixed(2);
  const dumpSize = fs.statSync(customDumpPath).size;
  console.log(`Custom-format dump created: ${customDumpFile} (${(dumpSize / 1024).toFixed(1)} kB) in ${dumpDuration}s`);

  // 3. Get authoritative row counts from live database
  console.log("3. Fetching live database row counts...");
  const liveSql = postgres(dbUrl, { ssl: "require", max: 1 });
  const liveTables = await liveSql`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
    ORDER BY table_name
  `;
  const liveCounts = {};
  for (const t of liveTables) {
    const [c] = await liveSql`SELECT count(*)::int as count FROM ${liveSql(t.table_name)}`;
    liveCounts[t.table_name] = c.count;
  }
  await liveSql.end();

  // 4. Spin up local scratch PostgreSQL 18 container
  console.log("4. Starting local scratch PostgreSQL 18 container...");
  try {
    execSync("docker rm -f mqulima-scratch 2>/dev/null || true");
  } catch (_) {}

  execSync(`docker run -d --name mqulima-scratch -e POSTGRES_PASSWORD=secret -e POSTGRES_DB=scratch_mq -p 5439:5432 -v "${backupsDir}:/backups" postgres:18`);

  console.log("Waiting for scratch database to accept connections...");
  let ready = false;
  for (let i = 0; i < 30; i++) {
    try {
      execSync("docker exec mqulima-scratch pg_isready -U postgres");
      ready = true;
      break;
    } catch (_) {
      Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 500);
    }
  }
  if (!ready) throw new Error("Scratch container failed to become ready");

  // 5. Restore the custom-format dump into the scratch database
  console.log("5. Restoring dump into scratch database...");
  const tRestoreStart = Date.now();
  let restoreExitCode = 0;
  try {
    execSync(`docker exec mqulima-scratch pg_restore -U postgres -d scratch_mq --no-owner --no-privileges "/backups/${customDumpFile}"`, {
      stdio: "inherit"
    });
  } catch (e) {
    // pg_restore returns exit code 1 if warnings (e.g. relation already exists or minor notices)
    console.log("pg_restore finished (with non-fatal notices/warnings)");
  }
  const restoreDuration = ((Date.now() - tRestoreStart) / 1000).toFixed(2);
  console.log(`Restore completed in ${restoreDuration}s`);

  // 6. Verify row counts in scratch database
  console.log("6. Verifying restored row counts in scratch database...");
  const scratchSql = postgres("postgres://postgres:secret@127.0.0.1:5439/scratch_mq", { max: 1 });
  const restoredCounts = {};
  const discrepancies = [];

  for (const t of liveTables) {
    try {
      const [c] = await scratchSql`SELECT count(*)::int as count FROM ${scratchSql(t.table_name)}`;
      restoredCounts[t.table_name] = c.count;
      if (c.count !== liveCounts[t.table_name]) {
        discrepancies.push({
          table: t.table_name,
          live: liveCounts[t.table_name],
          restored: c.count
        });
      }
    } catch (e) {
      discrepancies.push({
        table: t.table_name,
        live: liveCounts[t.table_name],
        error: e.message
      });
    }
  }
  await scratchSql.end();

  // 7. Cleanup scratch container
  console.log("7. Cleaning up scratch container...");
  execSync("docker rm -f mqulima-scratch");

  const results = {
    customDumpFile,
    customDumpSizeKb: (dumpSize / 1024).toFixed(1),
    schemaDumpFile,
    schemaDumpSizeKb: (schemaSize / 1024).toFixed(1),
    dumpDurationSeconds: dumpDuration,
    restoreDurationSeconds: restoreDuration,
    totalTablesChecked: liveTables.length,
    discrepanciesCount: discrepancies.length,
    discrepancies,
    sampleVerifiedTables: Object.entries(liveCounts)
      .filter(([_, count]) => count > 0)
      .map(([table, count]) => ({ table, liveRows: count, restoredRows: restoredCounts[table] }))
  };

  fs.writeFileSync("scripts/backup-restore-results.json", JSON.stringify(results, null, 2));
  console.log("\n=== BACKUP & RESTORE VERIFICATION SUMMARY ===");
  console.log(`Custom Dump File: ${customDumpFile} (${results.customDumpSizeKb} kB)`);
  console.log(`Schema Dump File: ${schemaDumpFile} (${results.schemaDumpSizeKb} kB)`);
  console.log(`Restore Duration: ${restoreDuration}s`);
  console.log(`Discrepancies: ${discrepancies.length}`);
  if (discrepancies.length === 0) {
    console.log("SUCCESS: 100% of tables and row counts match between live DB and restored dump!");
  } else {
    console.error("Discrepancies detected:", discrepancies);
  }
}

main().catch(err => {
  console.error("Backup & restore failed:", err);
  try { execSync("docker rm -f mqulima-scratch 2>/dev/null || true"); } catch (_) {}
  process.exit(1);
});
