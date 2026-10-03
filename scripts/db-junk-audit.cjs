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

async function junkAudit() {
  const report = {};

  console.log("=== RUNNING DRY-RUN JUNK DATA AUDIT ===");

  // 1. Orphaned Rows
  report.orphans = {};

  // 1a. show_comments without show_posts
  try {
    const orphanComments = await sql`
      SELECT c.id, c.post_id, c.body, c.created_at
      FROM show_comments c
      LEFT JOIN show_posts p ON p.id = c.post_id
      WHERE p.id IS NULL;
    `;
    report.orphans.show_comments = { count: orphanComments.length, samples: orphanComments.slice(0, 3) };
  } catch (e) { report.orphans.show_comments = { error: e.message }; }

  // 1b. show_likes without show_posts
  try {
    const orphanLikes = await sql`
      SELECT l.id, l.post_id, l.user_id
      FROM show_likes l
      LEFT JOIN show_posts p ON p.id = l.post_id
      WHERE p.id IS NULL;
    `;
    report.orphans.show_likes = { count: orphanLikes.length, samples: orphanLikes.slice(0, 3) };
  } catch (e) { report.orphans.show_likes = { error: e.message }; }

  // 1c. order_items without orders
  try {
    const orphanOrderItems = await sql`
      SELECT oi.id, oi.order_id, oi.product_name, oi.unit_price
      FROM order_items oi
      LEFT JOIN orders o ON o.id = oi.order_id
      WHERE o.id IS NULL;
    `;
    report.orphans.order_items = { count: orphanOrderItems.length, samples: orphanOrderItems.slice(0, 3) };
  } catch (e) { report.orphans.order_items = { error: e.message }; }

  // 1d. product_reviews without products
  try {
    const orphanReviews = await sql`
      SELECT r.id, r.product_id, r.comment, r.rating
      FROM product_reviews r
      LEFT JOIN products p ON p.id = r.product_id
      WHERE p.id IS NULL;
    `;
    report.orphans.product_reviews = { count: orphanReviews.length, samples: orphanReviews.slice(0, 3) };
  } catch (e) { report.orphans.product_reviews = { error: e.message }; }

  // 1e. product_variants without products
  try {
    const orphanVariants = await sql`
      SELECT pv.id, pv.product_id, pv.variant_label
      FROM product_variants pv
      LEFT JOIN products p ON p.id = pv.product_id
      WHERE p.id IS NULL;
    `;
    report.orphans.product_variants = { count: orphanVariants.length, samples: orphanVariants.slice(0, 3) };
  } catch (e) { report.orphans.product_variants = { error: e.message }; }

  // 1f. chapter_lessons without course_chapters
  try {
    const orphanLessons = await sql`
      SELECT cl.id, cl.chapter_id, cl.title
      FROM chapter_lessons cl
      LEFT JOIN course_chapters cc ON cc.id = cl.chapter_id
      WHERE cc.id IS NULL;
    `;
    report.orphans.chapter_lessons = { count: orphanLessons.length, samples: orphanLessons.slice(0, 3) };
  } catch (e) { report.orphans.chapter_lessons = { error: e.message }; }

  // 1g. profiles without users
  try {
    const orphanProfiles = await sql`
      SELECT p.id, p.full_name, p.email, p.created_at
      FROM profiles p
      LEFT JOIN users u ON u.id = p.id
      WHERE u.id IS NULL;
    `;
    report.orphans.profiles = { count: orphanProfiles.length, samples: orphanProfiles.slice(0, 3) };
  } catch (e) { report.orphans.profiles = { error: e.message }; }

  // 2. Duplicate Rows
  report.duplicates = {};

  // 2a. Duplicate products by slug
  try {
    const dupSlugs = await sql`
      SELECT slug, count(*) as count, array_agg(id) as ids, array_agg(name) as names
      FROM products
      WHERE slug IS NOT NULL AND slug != '' AND deleted_at IS NULL
      GROUP BY slug
      HAVING count(*) > 1;
    `;
    report.duplicates.duplicate_product_slugs = { count: dupSlugs.length, samples: dupSlugs };
  } catch (e) { report.duplicates.duplicate_product_slugs = { error: e.message }; }

  // 2b. Duplicate products by name
  try {
    const dupNames = await sql`
      SELECT LOWER(TRIM(name)) as name, count(*) as count, array_agg(id) as ids
      FROM products
      WHERE name IS NOT NULL AND deleted_at IS NULL
      GROUP BY LOWER(TRIM(name))
      HAVING count(*) > 1;
    `;
    report.duplicates.duplicate_product_names = { count: dupNames.length, samples: dupNames.slice(0, 5) };
  } catch (e) { report.duplicates.duplicate_product_names = { error: e.message }; }

  // 2c. Duplicate user emails
  try {
    const dupEmails = await sql`
      SELECT LOWER(TRIM(email)) as email, count(*) as count, array_agg(id) as ids
      FROM users
      GROUP BY LOWER(TRIM(email))
      HAVING count(*) > 1;
    `;
    report.duplicates.duplicate_user_emails = { count: dupEmails.length, samples: dupEmails };
  } catch (e) { report.duplicates.duplicate_user_emails = { error: e.message }; }

  // 2d. Duplicate newsletter subscribers
  try {
    const dupSubs = await sql`
      SELECT email, count(*) as count, array_agg(id) as ids
      FROM newsletter_subscribers
      GROUP BY email
      HAVING count(*) > 1;
    `;
    report.duplicates.duplicate_newsletter_subscribers = { count: dupSubs.length, samples: dupSubs };
  } catch (e) { report.duplicates.duplicate_newsletter_subscribers = { error: e.message }; }

  // 3. Expired or Stale Data
  report.stale_data = {};

  // 3a. Expired email verifications
  try {
    const expiredVerifs = await sql`
      SELECT id, email, expires_at, created_at
      FROM email_verifications
      WHERE expires_at < NOW() - INTERVAL '30 days';
    `;
    report.stale_data.expired_email_verifications = { count: expiredVerifs.length, samples: expiredVerifs.slice(0, 3) };
  } catch (e) { report.stale_data.expired_email_verifications = { error: e.message }; }

  // 3b. Stale pos_sync_logs older than 90 days
  try {
    const oldPosLogs = await sql`
      SELECT id, sync_type, status, started_at
      FROM pos_sync_logs
      WHERE started_at < NOW() - INTERVAL '90 days';
    `;
    report.stale_data.pos_sync_logs_90d = { count: oldPosLogs.length, samples: oldPosLogs.slice(0, 3) };
  } catch (e) { report.stale_data.pos_sync_logs_90d = { error: e.message }; }

  // 3c. Old notifications older than 90 days
  try {
    const oldNotifs = await sql`
      SELECT id, user_id, type, created_at
      FROM notifications
      WHERE created_at < NOW() - INTERVAL '90 days';
    `;
    report.stale_data.notifications_90d = { count: oldNotifs.length, samples: oldNotifs.slice(0, 3) };
  } catch (e) { report.stale_data.notifications_90d = { error: e.message }; }

  // 4. Test & Seed Data
  report.test_data = {};

  // 4a. Products with dummy / test / demo names or SKUs
  try {
    const testProducts = await sql`
      SELECT id, name, slug, base_price, created_at
      FROM products
      WHERE name ILIKE '%test%' OR name ILIKE '%demo%' OR name ILIKE '%dummy%' OR name ILIKE '%lorem%' OR name ILIKE '%asdf%'
         OR slug ILIKE '%test%' OR slug ILIKE '%demo%' OR slug ILIKE '%dummy%';
    `;
    report.test_data.test_products = { count: testProducts.length, samples: testProducts };
  } catch (e) { report.test_data.test_products = { error: e.message }; }

  // 4b. Users with fake emails
  try {
    const testUsers = await sql`
      SELECT id, email, first_name, last_name, role, created_at
      FROM users
      WHERE email ILIKE '%test%' OR email ILIKE '%example.com%' OR email ILIKE '%dummy%' OR email ILIKE '%demo%';
    `;
    report.test_data.test_users = { count: testUsers.length, samples: testUsers };
  } catch (e) { report.test_data.test_users = { error: e.message }; }

  // 4c. Featured items seed records
  try {
    const seedFeatured = await sql`
      SELECT id, title, image_url, link_url
      FROM featured_items
      WHERE id LIKE 'feat-seed-%';
    `;
    report.test_data.seed_featured_items = { count: seedFeatured.length, samples: seedFeatured };
  } catch (e) { report.test_data.seed_featured_items = { error: e.message }; }

  // 5. Soft-deleted rows older than 90 days
  report.soft_deleted_90d = {};
  try {
    const delProds = await sql`
      SELECT id, name, deleted_at
      FROM products
      WHERE deleted_at IS NOT NULL AND deleted_at < NOW() - INTERVAL '90 days';
    `;
    report.soft_deleted_90d.products = { count: delProds.length, samples: delProds };
  } catch (e) { report.soft_deleted_90d.products = { error: e.message }; }

  try {
    const delProfiles = await sql`
      SELECT id, full_name, email, deleted_at
      FROM profiles
      WHERE deleted_at IS NOT NULL AND deleted_at < NOW() - INTERVAL '90 days';
    `;
    report.soft_deleted_90d.profiles = { count: delProfiles.length, samples: delProfiles };
  } catch (e) { report.soft_deleted_90d.profiles = { error: e.message }; }

  try {
    const delPosts = await sql`
      SELECT id, title, deleted_at
      FROM show_posts
      WHERE deleted_at IS NOT NULL AND deleted_at < NOW() - INTERVAL '90 days';
    `;
    report.soft_deleted_90d.show_posts = { count: delPosts.length, samples: delPosts };
  } catch (e) { report.soft_deleted_90d.show_posts = { error: e.message }; }

  // 6. Empty or Null-heavy Rows
  report.empty_rows = {};
  try {
    const emptyProducts = await sql`
      SELECT id, name, slug, base_price, status
      FROM products
      WHERE (name IS NULL OR TRIM(name) = '')
         OR (base_price IS NULL OR base_price::numeric <= 0);
    `;
    report.empty_rows.products_empty_or_zero_price = { count: emptyProducts.length, samples: emptyProducts.slice(0, 5) };
  } catch (e) { report.empty_rows.products_empty_or_zero_price = { error: e.message }; }

  // 7. Broken / Hotlinked Images (e.g. pinimg.com)
  report.hotlinked_images = {};
  try {
    const pinimgProducts = await sql`
      SELECT id, name, image_urls
      FROM products
      WHERE array_to_string(image_urls, ',') ILIKE '%pinimg.com%';
    `;
    report.hotlinked_images.products = { count: pinimgProducts.length, samples: pinimgProducts.slice(0, 3) };
  } catch (e) { report.hotlinked_images.products = { error: e.message }; }

  try {
    const pinimgNews = await sql`
      SELECT id, title, media_url
      FROM agritech_news
      WHERE media_url ILIKE '%pinimg.com%';
    `;
    report.hotlinked_images.news = { count: pinimgNews.length, samples: pinimgNews.slice(0, 3) };
  } catch (e) { report.hotlinked_images.news = { error: e.message }; }

  // 8. Forum Spam
  report.forum_spam = {};
  try {
    const spamPosts = await sql`
      SELECT id, user_id, title, caption, created_at
      FROM show_posts
      WHERE caption ILIKE '%http://%' OR caption ILIKE '%https://%'
         OR length(caption) < 5
         OR title ILIKE '%crypto%' OR title ILIKE '%casino%';
    `;
    report.forum_spam.posts = { count: spamPosts.length, samples: spamPosts };
  } catch (e) { report.forum_spam.posts = { error: e.message }; }

  // 9. Base64 / Oversized Blobs in Columns
  report.base64_blobs = {};
  try {
    const base64Prods = await sql`
      SELECT id, name
      FROM products
      WHERE array_to_string(image_urls, ',') LIKE '%data:image%';
    `;
    report.base64_blobs.products = { count: base64Prods.length, samples: base64Prods };
  } catch (e) { report.base64_blobs.products = { error: e.message }; }

  try {
    const base64News = await sql`
      SELECT id, title, octet_length(content) as content_len, octet_length(media_url) as media_len
      FROM agritech_news
      WHERE media_url LIKE '%data:image%' OR content LIKE '%data:image%';
    `;
    report.base64_blobs.news = { count: base64News.length, samples: base64News };
  } catch (e) { report.base64_blobs.news = { error: e.message }; }

  fs.writeFileSync("scripts/junk-audit-report.json", JSON.stringify(report, null, 2));
  console.log("=== JUNK AUDIT REPORT WRITTEN TO scripts/junk-audit-report.json ===");
  await sql.end();
}

junkAudit().catch(console.error);
