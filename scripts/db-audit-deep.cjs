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

const sql = postgres(process.env.DATABASE_URL, { ssl: "require", max: 3, idle_timeout: 10 });

async function deepAudit() {
  const result = {};

  console.log("1. Checking pg_stat_statements creation ability...");
  try {
    await sql`CREATE EXTENSION IF NOT EXISTS pg_stat_statements`;
    const [ext] = await sql`SELECT extname, extversion FROM pg_extension WHERE extname = 'pg_stat_statements'`;
    result.pg_stat_statements = { success: true, details: ext };
  } catch (e) {
    result.pg_stat_statements = { success: false, error: e.message };
  }

  console.log("2. Inspecting agritech_news 9.3MB size breakdown...");
  try {
    const newsCols = await sql`
      SELECT id, title, octet_length(title) as title_bytes,
             octet_length(summary) as summary_bytes,
             octet_length(content) as content_bytes,
             octet_length(image_url) as image_bytes,
             substring(image_url from 1 for 50) as image_sample,
             substring(content from 1 for 80) as content_sample
      FROM agritech_news;
    `;
    result.agritech_news_bloat = newsCols;
  } catch (e) {
    result.agritech_news_bloat = { error: e.message };
  }

  console.log("3. Inspecting all tables and checking code references...");
  const tables = await sql`
    SELECT c.relname as table_name,
           c.reltuples::bigint as est_rows,
           pg_size_pretty(pg_total_relation_size(c.oid)) as total_size,
           pg_total_relation_size(c.oid) as total_bytes,
           s.n_dead_tup, s.n_live_tup
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    LEFT JOIN pg_stat_user_tables s ON s.relid = c.oid
    WHERE n.nspname = 'public' AND c.relkind = 'r'
    ORDER BY c.relname ASC;
  `;
  result.all_tables = tables;

  console.log("4. Running EXPLAIN (ANALYZE, BUFFERS) on core queries...");
  result.explain_plans = {};

  // /shop list query
  try {
    const p1 = await sql`
      EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON)
      SELECT p.id, p.name, p.slug, p.base_price, p.stock_qty, p.is_featured, p.status, p.image_urls
      FROM products p
      WHERE p.status = 'active' AND p.deleted_at IS NULL
      ORDER BY p.is_featured DESC, (p.stock_qty > 0) DESC, p.created_at DESC
      LIMIT 24;
    `;
    result.explain_plans.shop_list = p1[0]["QUERY PLAN"][0];
  } catch (e) { result.explain_plans.shop_list = { error: e.message }; }

  // /shop category filter query
  try {
    const p2 = await sql`
      EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON)
      SELECT p.id, p.name, p.slug, p.base_price, p.stock_qty, p.subcategory
      FROM products p
      WHERE p.status = 'active' AND p.deleted_at IS NULL AND p.subcategory = 'Fertilizers'
      ORDER BY p.created_at DESC
      LIMIT 24;
    `;
    result.explain_plans.shop_category = p2[0]["QUERY PLAN"][0];
  } catch (e) { result.explain_plans.shop_category = { error: e.message }; }

  // /shop search query (typical ILIKE pattern)
  try {
    const p3 = await sql`
      EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON)
      SELECT p.id, p.name, p.slug, p.base_price
      FROM products p
      WHERE p.status = 'active' AND p.deleted_at IS NULL
        AND (p.name ILIKE '%maize%' OR p.description ILIKE '%maize%')
      LIMIT 20;
    `;
    result.explain_plans.shop_search = p3[0]["QUERY PLAN"][0];
  } catch (e) { result.explain_plans.shop_search = { error: e.message }; }

  // /shop single product by slug
  try {
    const p4 = await sql`
      EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON)
      SELECT * FROM products WHERE slug = '20l-heavy-duty-knapsack-sprayer' LIMIT 1;
    `;
    result.explain_plans.product_by_slug = p4[0]["QUERY PLAN"][0];
  } catch (e) { result.explain_plans.product_by_slug = { error: e.message }; }

  // /blog list query
  try {
    const b1 = await sql`
      EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON)
      SELECT id, title, slug, summary, category, read_time, published_at, view_count, is_featured
      FROM agritech_news
      WHERE is_published = true
      ORDER BY is_featured DESC NULLS LAST, published_at DESC NULLS LAST
      LIMIT 12;
    `;
    result.explain_plans.blog_list = b1[0]["QUERY PLAN"][0];
  } catch (e) { result.explain_plans.blog_list = { error: e.message }; }

  // /community threads list
  try {
    const c1 = await sql`
      EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON)
      SELECT f.id, f.title, f.slug, f.category, f.upvotes_count, f.views_count, f.created_at, f.author_id
      FROM forum_threads f
      WHERE f.deleted_at IS NULL
      ORDER BY f.created_at DESC
      LIMIT 20;
    `;
    result.explain_plans.community_threads = c1[0]["QUERY PLAN"][0];
  } catch (e) { result.explain_plans.community_threads = { error: e.message }; }

  // /academy courses
  try {
    const a1 = await sql`
      EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON)
      SELECT id, title, slug, category, level, duration_weeks, enrolled_count
      FROM courses
      ORDER BY created_at DESC
      LIMIT 20;
    `;
    result.explain_plans.academy_courses = a1[0]["QUERY PLAN"][0];
  } catch (e) { result.explain_plans.academy_courses = { error: e.message }; }

  // /services listings
  try {
    const s1 = await sql`
      EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON)
      SELECT id, name, slug, category, base_rate, unit, is_active
      FROM services
      WHERE is_active = true
      ORDER BY created_at DESC
      LIMIT 20;
    `;
    result.explain_plans.services_list = s1[0]["QUERY PLAN"][0];
  } catch (e) { result.explain_plans.services_list = { error: e.message }; }

  // Auth: user lookup by email
  try {
    const u1 = await sql`
      EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON)
      SELECT u.id, u.email, u.role, u.password_hash, p.full_name, p.phone
      FROM users u
      LEFT JOIN profiles p ON p.user_id = u.id
      WHERE LOWER(u.email) = 'admin@mqulima.com'
      LIMIT 1;
    `;
    result.explain_plans.auth_lookup = u1[0]["QUERY PLAN"][0];
  } catch (e) { result.explain_plans.auth_lookup = { error: e.message }; }

  console.log("5. Running DRY RUN audit for junk data (STEP 3)...");
  result.junk_audit = {};

  // 5a. Orphaned rows
  result.junk_audit.orphans = {};
  try {
    const [orphanComments] = await sql`
      SELECT count(*) as count
      FROM forum_comments c
      LEFT JOIN forum_threads t ON t.id = c.thread_id
      WHERE t.id IS NULL;
    `;
    result.junk_audit.orphans.forum_comments_without_thread = Number(orphanComments.count);
  } catch (e) { result.junk_audit.orphans.forum_comments_without_thread = e.message; }

  try {
    const [orphanOrderItems] = await sql`
      SELECT count(*) as count
      FROM order_items oi
      LEFT JOIN orders o ON o.id = oi.order_id
      WHERE o.id IS NULL;
    `;
    result.junk_audit.orphans.order_items_without_order = Number(orphanOrderItems.count);
  } catch (e) { result.junk_audit.orphans.order_items_without_order = e.message; }

  try {
    const [orphanReviews] = await sql`
      SELECT count(*) as count
      FROM product_reviews r
      LEFT JOIN products p ON p.id = r.product_id
      WHERE p.id IS NULL;
    `;
    result.junk_audit.orphans.reviews_without_product = Number(orphanReviews.count);
  } catch (e) { result.junk_audit.orphans.reviews_without_product = e.message; }

  try {
    const [orphanProfiles] = await sql`
      SELECT count(*) as count
      FROM profiles p
      LEFT JOIN users u ON u.id = p.user_id
      WHERE u.id IS NULL;
    `;
    result.junk_audit.orphans.profiles_without_user = Number(orphanProfiles.count);
  } catch (e) { result.junk_audit.orphans.profiles_without_user = e.message; }

  try {
    const [orphanVariants] = await sql`
      SELECT count(*) as count
      FROM product_variants pv
      LEFT JOIN products p ON p.id = pv.product_id
      WHERE p.id IS NULL;
    `;
    result.junk_audit.orphans.variants_without_product = Number(orphanVariants.count);
  } catch (e) { result.junk_audit.orphans.variants_without_product = e.message; }

  // 5b. Duplicate rows
  result.junk_audit.duplicates = {};
  try {
    const dupSlugs = await sql`
      SELECT slug, count(*) as count
      FROM products
      WHERE slug IS NOT NULL AND slug != '' AND deleted_at IS NULL
      GROUP BY slug
      HAVING count(*) > 1;
    `;
    result.junk_audit.duplicates.duplicate_product_slugs = dupSlugs;
  } catch (e) { result.junk_audit.duplicates.duplicate_product_slugs = e.message; }

  try {
    const dupEmails = await sql`
      SELECT LOWER(email) as email, count(*) as count
      FROM users
      GROUP BY LOWER(email)
      HAVING count(*) > 1;
    `;
    result.junk_audit.duplicates.duplicate_user_emails = dupEmails;
  } catch (e) { result.junk_audit.duplicates.duplicate_user_emails = e.message; }

  try {
    const dupSubs = await sql`
      SELECT email, count(*) as count
      FROM newsletter_subscribers
      GROUP BY email
      HAVING count(*) > 1;
    `;
    result.junk_audit.duplicates.duplicate_newsletter_subscribers = dupSubs;
  } catch (e) { result.junk_audit.duplicates.duplicate_newsletter_subscribers = e.message; }

  // 5c. Stale / Expired data
  result.junk_audit.stale_data = {};
  try {
    const [oldVerifs] = await sql`
      SELECT count(*) as count
      FROM email_verifications
      WHERE expires_at < NOW() - INTERVAL '30 days' OR verified = true;
    `;
    result.junk_audit.stale_data.expired_email_verifications_30d = Number(oldVerifs.count);
  } catch (e) { result.junk_audit.stale_data.expired_email_verifications_30d = e.message; }

  try {
    const [oldPosLogs] = await sql`
      SELECT count(*) as count
      FROM pos_sync_logs
      WHERE synced_at < NOW() - INTERVAL '90 days';
    `;
    result.junk_audit.stale_data.pos_sync_logs_90d = Number(oldPosLogs.count);
  } catch (e) { result.junk_audit.stale_data.pos_sync_logs_90d = e.message; }

  // 5d. Test & Seed Data
  result.junk_audit.test_data = {};
  try {
    const testProducts = await sql`
      SELECT id, name, slug, base_price, created_at
      FROM products
      WHERE name ILIKE '%test%' OR name ILIKE '%demo%' OR name ILIKE '%dummy%'
         OR slug ILIKE '%test%' OR slug ILIKE '%dummy%';
    `;
    result.junk_audit.test_data.test_products = testProducts;
  } catch (e) { result.junk_audit.test_data.test_products = e.message; }

  try {
    const testUsers = await sql`
      SELECT id, email, role, created_at
      FROM users
      WHERE email ILIKE '%test%' OR email ILIKE '%example%' OR email ILIKE '%dummy%';
    `;
    result.junk_audit.test_data.test_users = testUsers;
  } catch (e) { result.junk_audit.test_data.test_users = e.message; }

  // 5e. Soft-deleted rows > 90 days
  result.junk_audit.soft_deleted_90d = {};
  try {
    const [delProds] = await sql`
      SELECT count(*) as count
      FROM products
      WHERE deleted_at IS NOT NULL AND deleted_at < NOW() - INTERVAL '90 days';
    `;
    result.junk_audit.soft_deleted_90d.products_deleted_90d = Number(delProds.count);
  } catch (e) { result.junk_audit.soft_deleted_90d.products_deleted_90d = e.message; }

  try {
    const [delThreads] = await sql`
      SELECT count(*) as count
      FROM forum_threads
      WHERE deleted_at IS NOT NULL AND deleted_at < NOW() - INTERVAL '90 days';
    `;
    result.junk_audit.soft_deleted_90d.threads_deleted_90d = Number(delThreads.count);
  } catch (e) { result.junk_audit.soft_deleted_90d.threads_deleted_90d = e.message; }

  // 5f. Empty or null-heavy rows
  result.junk_audit.empty_rows = {};
  try {
    const emptyProds = await sql`
      SELECT id, name, base_price, status
      FROM products
      WHERE name IS NULL OR TRIM(name) = '' OR base_price IS NULL OR base_price <= 0;
    `;
    result.junk_audit.empty_rows.products_empty_or_zero_price = emptyProds;
  } catch (e) { result.junk_audit.empty_rows.products_empty_or_zero_price = e.message; }

  // 5g. Broken / Hotlinked image URLs (e.g. pinimg)
  result.junk_audit.hotlinked_images = {};
  try {
    const pinimgProds = await sql`
      SELECT id, name, image_urls
      FROM products
      WHERE array_to_string(image_urls, ',') ILIKE '%pinimg.com%';
    `;
    result.junk_audit.hotlinked_images.products_pinimg = pinimgProds.map(p => ({ id: p.id, name: p.name, images: p.image_urls }));
  } catch (e) { result.junk_audit.hotlinked_images.products_pinimg = e.message; }

  try {
    const pinimgNews = await sql`
      SELECT id, title, image_url
      FROM agritech_news
      WHERE image_url ILIKE '%pinimg.com%';
    `;
    result.junk_audit.hotlinked_images.news_pinimg = pinimgNews;
  } catch (e) { result.junk_audit.hotlinked_images.news_pinimg = e.message; }

  // 5h. Base64 / Oversized data stored in columns
  result.junk_audit.base64_blobs = {};
  try {
    const base64Prods = await sql`
      SELECT id, name
      FROM products
      WHERE array_to_string(image_urls, ',') LIKE 'data:%';
    `;
    result.junk_audit.base64_blobs.products_base64 = base64Prods;
  } catch (e) { result.junk_audit.base64_blobs.products_base64 = e.message; }

  try {
    const base64News = await sql`
      SELECT id, title, octet_length(image_url) as img_len, octet_length(content) as content_len
      FROM agritech_news
      WHERE image_url LIKE 'data:%' OR content LIKE '%data:image%';
    `;
    result.junk_audit.base64_blobs.news_base64 = base64News;
  } catch (e) { result.junk_audit.base64_blobs.news_base64 = e.message; }

  fs.writeFileSync("scripts/db-audit-deep-output.json", JSON.stringify(result, null, 2));
  console.log("=== DEEP AUDIT WRITTEN TO scripts/db-audit-deep-output.json ===");

  await sql.end();
}

deepAudit().catch(console.error);
