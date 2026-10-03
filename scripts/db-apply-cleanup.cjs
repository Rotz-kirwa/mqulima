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

async function runCleanupTransactions() {
  console.log("=== EXECUTING CLEANUP TRANSACTIONS WITH STRICT ROW COUNT AUDITING ===");
  const results = {};

  // Transaction 1: Remove 3 orphaned profiles
  console.log("\n--- Transaction 1: Orphaned Profiles ---");
  await sql.begin(async (tx) => {
    const [beforeTotal] = await tx`SELECT count(*) FROM public.profiles;`;
    const targetIds = [
      '934e18e8-98ba-4e21-8741-eda97fd1a469',
      '035dba78-9c5a-4994-be80-c915755f5009',
      '9ec45c9e-b967-4722-a64d-cba7ba1b2ef2'
    ];
    const targets = await tx`SELECT id, full_name, email FROM public.profiles WHERE id = ANY(${targetIds});`;
    console.log(`Found ${targets.length} orphaned profiles to remove (Total profiles before: ${beforeTotal.count})`);

    const deleted = await tx`DELETE FROM public.profiles WHERE id = ANY(${targetIds}) RETURNING id;`;
    const [afterTotal] = await tx`SELECT count(*) FROM public.profiles;`;

    console.log(`Deleted rows: ${deleted.length}. Total profiles after: ${afterTotal.count}`);
    results.orphaned_profiles = {
      before_count: Number(beforeTotal.count),
      deleted_rows: deleted.length,
      after_count: Number(afterTotal.count)
    };
  });

  // Transaction 2: Remove 5 unconfigured seed items from featured_items
  console.log("\n--- Transaction 2: Seed Featured Items ---");
  await sql.begin(async (tx) => {
    const [beforeTotal] = await tx`SELECT count(*) FROM public.featured_items;`;
    const targets = await tx`SELECT id, title, image_url FROM public.featured_items WHERE id LIKE 'feat-seed-%';`;
    console.log(`Found ${targets.length} seed featured items to remove (Total featured_items before: ${beforeTotal.count})`);

    const deleted = await tx`DELETE FROM public.featured_items WHERE id LIKE 'feat-seed-%' RETURNING id;`;
    const [afterTotal] = await tx`SELECT count(*) FROM public.featured_items;`;

    console.log(`Deleted rows: ${deleted.length}. Total featured_items after: ${afterTotal.count}`);
    results.seed_featured_items = {
      before_count: Number(beforeTotal.count),
      deleted_rows: deleted.length,
      after_count: Number(afterTotal.count)
    };
  });

  // Transaction 3: Set status = 'draft' on unpriced products (base_price = '0.00')
  console.log("\n--- Transaction 3: Unpriced Products (base_price = '0.00') ---");
  await sql.begin(async (tx) => {
    const [beforeActiveZero] = await tx`
      SELECT count(*) FROM public.products
      WHERE (base_price IS NULL OR base_price::numeric <= 0) AND status = 'active';
    `;
    const [beforeTotalDraft] = await tx`SELECT count(*) FROM public.products WHERE status = 'draft';`;
    console.log(`Found ${beforeActiveZero.count} unpriced products currently active in shop (Draft products before: ${beforeTotalDraft.count})`);

    const updated = await tx`
      UPDATE public.products
      SET status = 'draft', updated_at = NOW()
      WHERE (base_price IS NULL OR base_price::numeric <= 0) AND status = 'active'
      RETURNING id;
    `;
    const [afterActiveZero] = await tx`
      SELECT count(*) FROM public.products
      WHERE (base_price IS NULL OR base_price::numeric <= 0) AND status = 'active';
    `;
    const [afterTotalDraft] = await tx`SELECT count(*) FROM public.products WHERE status = 'draft';`;

    console.log(`Updated rows: ${updated.length}. Active unpriced products after: ${afterActiveZero.count}. Total draft products after: ${afterTotalDraft.count}`);
    results.unpriced_products = {
      active_unpriced_before: Number(beforeActiveZero.count),
      updated_rows: updated.length,
      active_unpriced_after: Number(afterActiveZero.count),
      draft_total_after: Number(afterTotalDraft.count)
    };
  });

  fs.writeFileSync("scripts/cleanup-results.json", JSON.stringify(results, null, 2));
  console.log("\n=== ALL TRANSACTIONS COMMITTED CLEANLY ===");
  await sql.end();
}

runCleanupTransactions().catch(console.error);
