import postgres from "postgres";

const localDbUrl = "postgresql://mqulima:password@localhost:5432/mqulima_dev";
const prodDbUrl = "postgresql://mqulima_db_user:NqL9Sdlti39Oa5aILYm944MjvJV9cEB4@dpg-d95kng28qa3s73e4sue0-a.ohio-postgres.render.com/mqulima_db";

async function purgeMockData(url, label) {
  console.log(`\n🧹 Purging mock data on ${label} database...`);
  const sql = postgres(url, { ssl: url.includes("render") ? { rejectUnauthorized: false } : false });

  try {
    await sql`DELETE FROM order_items`;
    console.log("✓ Cleared order_items");

    await sql`DELETE FROM orders`;
    console.log("✓ Cleared orders");

    await sql`DELETE FROM service_requests`;
    console.log("✓ Cleared service_requests");

    await sql`DELETE FROM payments`;
    console.log("✓ Cleared payments");

    await sql`DELETE FROM show_likes`;
    await sql`DELETE FROM show_comments`;
    await sql`DELETE FROM show_posts`;
    console.log("✓ Cleared community show posts");

    // Clear mock profiles while keeping super_admin accounts
    await sql`
      DELETE FROM profiles 
      WHERE role NOT IN ('super_admin') 
         OR email IN ('john.kipchirchir@mqulima.co.ke', 'mary.wanjiku@mqulima.co.ke', 'david.kiprono@mqulima.co.ke', 'grace.mutiso@mqulima.co.ke', 'peter.mwangi@mqulima.co.ke')
    `;
    console.log("✓ Cleared mock farmer and retailer profiles");

    const [ordersCount] = await sql`SELECT count(*)::int as count FROM orders`;
    const [servicesCount] = await sql`SELECT count(*)::int as count FROM service_requests`;
    const [profilesCount] = await sql`SELECT count(*)::int as count FROM profiles`;

    console.log(`✅ ${label} DB Cleaned: Orders: ${ordersCount.count}, Service Requests: ${servicesCount.count}, Remaining Admin Profiles: ${profilesCount.count}`);
  } catch (err) {
    console.error(`❌ Error purging ${label} database:`, err);
  } finally {
    await sql.end();
  }
}

async function main() {
  await purgeMockData(localDbUrl, "LOCAL");
  await purgeMockData(prodDbUrl, "PRODUCTION");
  process.exit(0);
}

main();
