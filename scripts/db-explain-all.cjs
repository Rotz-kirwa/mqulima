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

const sql = postgres(process.env.DATABASE_URL, { ssl: "require", max: 2 });

async function runExplains() {
  const plans = [];

  async function explain(name, queryFn) {
    try {
      const res = await queryFn();
      const plan = res[0]["QUERY PLAN"][0];
      const execMs = plan["Execution Time"];
      const planMs = plan["Planning Time"];
      const nodeType = plan["Plan"]["Node Type"];
      const sharedHit = plan["Plan"]["Shared Hit Blocks"] || 0;
      const sharedRead = plan["Plan"]["Shared Read Blocks"] || 0;

      // Check if sequential scan occurred
      function findSeqScans(node, list = []) {
        if (node["Node Type"] === "Seq Scan") {
          list.push(node["Relation Name"]);
        }
        if (node["Plans"]) {
          node["Plans"].forEach(child => findSeqScans(child, list));
        }
        return list;
      }
      const seqScans = findSeqScans(plan["Plan"]);

      plans.push({
        flow: name,
        execution_time_ms: execMs,
        planning_time_ms: planMs,
        root_node: nodeType,
        shared_hit_blocks: sharedHit,
        shared_read_blocks: sharedRead,
        seq_scans: seqScans,
        full_plan: plan
      });
    } catch (e) {
      plans.push({ flow: name, error: e.message });
    }
  }

  // 1. /shop Catalog Listing
  await explain("/shop (Catalog List)", () => sql`
    EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON)
    SELECT p.id, p.name, p.slug, p.base_price, p.stock_qty, p.is_featured, p.status, p.image_urls
    FROM products p
    WHERE (p.status = 'active' OR p.status IS NULL) AND p.deleted_at IS NULL
    ORDER BY p.is_featured DESC, (p.stock_qty > 0) DESC, p.created_at DESC
    LIMIT 24;
  `);

  // 2. /shop Category Filter
  await explain("/shop (Category Filter)", () => sql`
    EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON)
    SELECT p.id, p.name, p.slug, p.base_price, p.stock_qty, p.subcategory
    FROM products p
    WHERE (p.status = 'active' OR p.status IS NULL) AND p.deleted_at IS NULL AND p.subcategory = 'Fertilizers'
    ORDER BY p.created_at DESC
    LIMIT 24;
  `);

  // 3. /shop Search (ILIKE)
  await explain("/shop (Search term: 'maize')", () => sql`
    EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON)
    SELECT p.id, p.name, p.slug, p.base_price
    FROM products p
    WHERE (p.status = 'active' OR p.status IS NULL) AND p.deleted_at IS NULL
      AND (p.name ILIKE '%maize%' OR p.description ILIKE '%maize%')
    LIMIT 20;
  `);

  // 4. /shop Product Details by Slug
  await explain("/shop/product/:slug", () => sql`
    EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON)
    SELECT *
    FROM products
    WHERE slug = 'high-protein-dairy-meal'
    LIMIT 1;
  `);

  // 5. /blog Article List
  await explain("/blog (Articles List)", () => sql`
    EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON)
    SELECT id, title, slug, summary AS excerpt, media_url, category, published_at, view_count, status
    FROM agritech_news
    WHERE status = 'published'
    ORDER BY published_at DESC NULLS LAST
    LIMIT 12;
  `);

  // 6. /blog Article Detail by Slug
  await explain("/blog/:slug", () => sql`
    EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON)
    SELECT id, title, slug, summary, content, media_type, media_url, category, status, published_at, view_count
    FROM agritech_news
    WHERE slug = 'why-sheep-farming-is-kenyas-sleeping-giant'
    LIMIT 1;
  `);

  // 7. /community Forum Snapshot (Posts with author join)
  await explain("/community (Forum Feed)", () => sql`
    EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON)
    SELECT
      sp.id, sp.type, sp.title, sp.caption, sp.media_urls, sp.like_count, sp.comment_count, sp.created_at,
      p.full_name, p.avatar_url, u.email
    FROM show_posts sp
    LEFT JOIN profiles p ON p.id = sp.user_id
    LEFT JOIN users u ON u.id = sp.user_id
    WHERE (sp.status IS NULL OR sp.status IN ('published', 'active')) AND sp.deleted_at IS NULL
    ORDER BY sp.created_at DESC
    LIMIT 12;
  `);

  // 8. /academy Course Listing with Aggregated Lessons
  await explain("/academy (Courses List)", () => sql`
    EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON)
    SELECT 
      c.id, c.title, c.description, c.cover_image_url, c.level, c.price::float as price,
      c.duration_minutes, c.category, c.is_published,
      COUNT(DISTINCT cc.id)::int as chapter_count,
      COUNT(DISTINCT cl.id)::int as lesson_count
    FROM courses c
    LEFT JOIN course_chapters cc ON cc.course_id = c.id
    LEFT JOIN chapter_lessons cl ON cl.chapter_id = cc.id
    WHERE c.is_published = true AND c.deleted_at IS NULL
    GROUP BY c.id
    ORDER BY c.sort_order ASC, c.created_at DESC
    LIMIT 20;
  `);

  // 9. /services Catalog Listing
  await explain("/services (Active Services)", () => sql`
    EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON)
    SELECT id, category_id, name, slug, description, base_price, price_unit, price_type, is_featured, is_active
    FROM services
    WHERE is_active = true
    ORDER BY is_featured DESC, sort_order ASC, name ASC;
  `);

  // 10. Auth Sign In (LOWER email lookup)
  await explain("auth (User Lookup by LOWER email)", () => sql`
    EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON)
    SELECT id, first_name, last_name, email, phone_number, password_hash
    FROM users
    WHERE LOWER(email) = 'admin@mqulima.com'
    LIMIT 1;
  `);

  // 11. Cart / Checkout: Order details with items
  await explain("checkout (Order with Items)", () => sql`
    EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON)
    SELECT o.id, o.user_id, o.status, o.total, oi.product_id, oi.quantity, oi.unit_price
    FROM orders o
    JOIN order_items oi ON oi.order_id = o.id
    WHERE o.id = 'ord-sample-1'
    LIMIT 20;
  `);

  fs.writeFileSync("scripts/explain-results.json", JSON.stringify(plans, null, 2));
  console.log("=== ALL EXPLAIN ANALYZE COMPLETED ===");
  await sql.end();
}

runExplains().catch(console.error);
