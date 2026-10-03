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

const sql = postgres(process.env.DATABASE_URL, { ssl: "require", max: 1 });

async function applyIndexes() {
  console.log("=== APPLYING MISSING INDEXES CONCURRENTLY ===");

  // 1. Missing composite index for /shop catalog
  console.log("1. Creating idx_products_catalog_sort...");
  try {
    await sql.unsafe(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_products_catalog_sort
      ON public.products (status, is_featured DESC, (stock_qty > 0) DESC, created_at DESC)
      WHERE (deleted_at IS NULL);
    `);
    console.log("✓ Created idx_products_catalog_sort");
  } catch (e) {
    console.error("idx_products_catalog_sort error:", e.message);
  }

  // 2. Functional unique index for users LOWER(email)
  console.log("2. Creating idx_users_lower_email...");
  try {
    await sql.unsafe(`
      CREATE UNIQUE INDEX CONCURRENTLY IF NOT EXISTS idx_users_lower_email
      ON public.users (LOWER(email));
    `);
    console.log("✓ Created idx_users_lower_email");
  } catch (e) {
    console.error("idx_users_lower_email error:", e.message);
  }

  // 3. Functional unique index for profiles LOWER(email)
  console.log("3. Creating idx_profiles_lower_email...");
  try {
    await sql.unsafe(`
      CREATE UNIQUE INDEX CONCURRENTLY IF NOT EXISTS idx_profiles_lower_email
      ON public.profiles (LOWER(email))
      WHERE (deleted_at IS NULL);
    `);
    console.log("✓ Created idx_profiles_lower_email");
  } catch (e) {
    console.error("idx_profiles_lower_email error:", e.message);
  }

  // 4. Composite index for community feed
  console.log("4. Creating idx_show_posts_feed...");
  try {
    await sql.unsafe(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_show_posts_feed
      ON public.show_posts (created_at DESC)
      WHERE (deleted_at IS NULL AND (status IS NULL OR status IN ('published', 'active')));
    `);
    console.log("✓ Created idx_show_posts_feed");
  } catch (e) {
    console.error("idx_show_posts_feed error:", e.message);
  }

  // 5. Drop duplicate indexes to reduce write amplification
  console.log("\n=== DROPPING REDUNDANT DUPLICATE INDEXES ===");
  const duplicateIndexes = [
    "idx_products_slug",
    "idx_order_items_order_id",
    "idx_profiles_user_id",
    "idx_profiles_email",
    "idx_profiles_username"
  ];

  for (const idxName of duplicateIndexes) {
    try {
      await sql.unsafe(`DROP INDEX CONCURRENTLY IF EXISTS public.${idxName};`);
      console.log(`✓ Dropped duplicate index: ${idxName}`);
    } catch (e) {
      console.error(`Error dropping ${idxName}:`, e.message);
    }
  }

  // 6. Run VACUUM (ANALYZE) to reclaim TOAST bloat on agritech_news & update catalog statistics
  console.log("\n=== RUNNING VACUUM (ANALYZE) ===");
  try {
    console.log("Vacuuming agritech_news...");
    await sql.unsafe(`VACUUM (ANALYZE) public.agritech_news;`);
    console.log("✓ Vacuumed agritech_news");

    console.log("Vacuuming products...");
    await sql.unsafe(`VACUUM (ANALYZE) public.products;`);
    console.log("✓ Vacuumed products");

    console.log("Vacuuming pos_sync_logs...");
    await sql.unsafe(`VACUUM (ANALYZE) public.pos_sync_logs;`);
    console.log("✓ Vacuumed pos_sync_logs");
  } catch (e) {
    console.error("Vacuum error:", e.message);
  }

  console.log("\n=== CHECKING NEW TABLE & TOAST SIZES ===");
  const [newsSizes] = await sql`
    SELECT
      c.relname,
      pg_size_pretty(pg_relation_size(c.oid)) as heap_size,
      pg_size_pretty(pg_total_relation_size(c.reltoastrelid)) as toast_size,
      pg_size_pretty(pg_total_relation_size(c.oid)) as total_size
    FROM pg_class c
    WHERE c.relname = 'agritech_news';
  `;
  console.log("agritech_news sizes after VACUUM:", newsSizes);

  await sql.end();
}

applyIndexes().catch(console.error);
