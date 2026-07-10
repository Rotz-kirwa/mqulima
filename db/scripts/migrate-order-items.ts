import fs from "fs";
import path from "path";
import postgres from "postgres";

// Load .env file manually only if DATABASE_URL is not set
if (!process.env.DATABASE_URL) {
  const envPath = path.resolve(process.cwd(), ".env");
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, "utf-8");
    for (const line of envContent.split("\n")) {
      const parts = line.split("=");
      if (parts.length >= 2) {
        const key = parts[0].trim();
        const val = parts.slice(1).join("=").trim().replace(/^['"]|['"]$/g, "");
        process.env[key] = val;
      }
    }
  }
}

const dbUrl = process.env.DATABASE_URL;
if (!dbUrl) {
  console.error("Error: DATABASE_URL is not set in environment or .env file");
  process.exit(1);
}

// Encode special characters in connection string password programmatically
const parsedDbUrl = dbUrl.includes("Mq@Hub#Dev2026!")
  ? dbUrl.replace("Mq@Hub#Dev2026!", "Mq%40Hub%23Dev2026%21")
  : dbUrl;

// Helper to check if string is a valid UUID
function isUuid(str: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(str);
}

async function run() {
  console.log("Connecting to PostgreSQL...");
  const sql = postgres(parsedDbUrl, { max: 1 });

  try {
    // 1. Fetch products to map them to order items
    console.log("Fetching products for reference mapping...");
    const dbProducts = await sql`SELECT id, name, base_price, unit FROM products`;
    const productByName = new Map<string, any>();
    const productById = new Map<string, any>();

    for (const p of dbProducts) {
      productByName.set(p.name.toLowerCase().trim(), p);
      productById.set(p.id, p);
    }

    // 2. Fetch orders containing items
    console.log("Fetching orders...");
    const orders = await sql`
      SELECT id, items FROM orders 
      WHERE items IS NOT NULL AND jsonb_typeof(items) = 'array' AND jsonb_array_length(items) > 0
    `;

    console.log(`Found ${orders.length} orders to migrate.`);
    let migratedItemsCount = 0;

    for (const order of orders) {
      const itemsList = order.items;
      console.log(`Migrating order ${order.id} (${itemsList.length} items)...`);

      for (const item of itemsList) {
        let productId: string | null = null;
        let productName = item.name || "Unknown Product";
        let unitPrice = parseFloat(item.price || item.unit_price || 0);
        let quantity = parseInt(item.quantity || 1, 10);
        if (isNaN(quantity) || quantity <= 0) {
          quantity = 1;
        }

        // Try to resolve product by ID (if it's a valid UUID)
        if (item.id && isUuid(item.id)) {
          if (productById.has(item.id)) {
            productId = item.id;
            const prod = productById.get(item.id);
            productName = prod.name;
            if (unitPrice === 0) {
              unitPrice = parseFloat(prod.base_price || 0);
            }
          }
        }

        // Try fallback lookup by product name
        if (!productId && item.name) {
          const match = productByName.get(item.name.toLowerCase().trim());
          if (match) {
            productId = match.id;
            if (unitPrice === 0) {
              unitPrice = parseFloat(match.base_price || 0);
            }
          }
        }

        // If we still don't have unitPrice, make sure it's 0 rather than NaN
        if (isNaN(unitPrice)) {
          unitPrice = 0;
        }

        // Insert into order_items
        await sql`
          INSERT INTO order_items (order_id, product_id, product_name, quantity, unit_price)
          VALUES (${order.id}, ${productId}, ${productName}, ${quantity}, ${unitPrice})
        `;
        migratedItemsCount++;
      }
    }

    console.log(`Successfully migrated ${migratedItemsCount} order items across ${orders.length} orders!`);
  } catch (error) {
    console.error("Migration failed:", error);
  } finally {
    await sql.end();
  }
}

run();
