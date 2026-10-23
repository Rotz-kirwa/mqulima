import { getDb } from "../db.server";
import { authenticateRequest } from "./auth-helper";
import { invalidateForumSnapshotCache } from "../api/community.server";

export async function handleAdminOverview(request: Request): Promise<Response> {
  const user = await authenticateRequest(request);
  if (!user || (user.role !== "admin" && user.role !== "super_admin")) {
    return new Response(JSON.stringify({ error: "Forbidden. Admin access required." }), {
      status: 403,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const sql = getDb();

    const [
      ordersStats,
      reqStats,
      prodStats,
      userStats,
      lowStockStats,
      recentOrdersRows,
      recentActivityRows,
    ] = await Promise.all([
      sql`
        SELECT 
          COUNT(*)::int AS total_orders,
          COUNT(CASE WHEN status NOT IN ('delivered', 'cancelled') THEN 1 END)::int AS open_orders,
          COALESCE(SUM(CASE WHEN status != 'cancelled' THEN total::numeric ELSE 0 END), 0)::float AS order_value
        FROM orders
        WHERE deleted_at IS NULL
      `,
      sql`
        SELECT COUNT(*)::int AS open_requests
        FROM service_requests
        WHERE status != 'completed' AND status != 'cancelled'
      `,
      sql`
        SELECT COUNT(*)::int AS published_products
        FROM products
        WHERE status = 'active' AND deleted_at IS NULL
      `,
      sql`
        SELECT COUNT(*)::int AS total_users
        FROM users
      `,
      sql`
        SELECT COUNT(*)::int AS low_stock
        FROM products
        WHERE status = 'active' AND stock_qty <= 5 AND deleted_at IS NULL
      `,
      sql`
        SELECT 
          o.id,
          COALESCE(u.first_name || ' ' || u.last_name, p.full_name, 'Farmer') AS name,
          COALESCE(u.county, p.county_region, 'Kenya') AS county,
          o.total::float AS total,
          o.status
        FROM orders o
        LEFT JOIN profiles p ON p.id = o.user_id
        LEFT JOIN users u ON u.id = o.user_id
        WHERE o.deleted_at IS NULL AND o.status NOT IN ('delivered', 'cancelled')
        ORDER BY o.created_at DESC
        LIMIT 5
      `,
      sql`
        SELECT
          sp.id,
          'NEW_DISCUSSION' AS action,
          'forum' AS resource,
          sp.title AS label,
          sp.created_at
        FROM show_posts sp
        WHERE sp.deleted_at IS NULL
        ORDER BY sp.created_at DESC
        LIMIT 5
      `,
    ]);

    const oStat = ordersStats[0] || {};
    const rStat = reqStats[0] || {};
    const pStat = prodStats[0] || {};
    const uStat = userStats[0] || {};
    const lStat = lowStockStats[0] || {};

    const overview = {
      order_value: oStat.order_value || 0,
      open_orders: oStat.open_orders || 0,
      open_requests: rStat.open_requests || 0,
      published_products: pStat.published_products || 0,
      customers: uStat.total_users || 0,
      low_stock: lStat.low_stock || 0,
      open_messages: 0,
      recent_orders: recentOrdersRows || [],
      recent_activity: recentActivityRows || [],
      updated_at: new Date().toISOString(),
    };

    return new Response(JSON.stringify(overview), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("[API/V1/ADMIN/OVERVIEW ERROR]:", err);
    return new Response(JSON.stringify({ error: err?.message || "Failed to load admin overview" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

export async function handleAdminResourceList(
  resource: string,
  request: Request,
  url: URL
): Promise<Response> {
  const user = await authenticateRequest(request);
  if (!user || (user.role !== "admin" && user.role !== "super_admin")) {
    return new Response(JSON.stringify({ error: "Forbidden. Admin access required." }), {
      status: 403,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const q = url.searchParams.get("q") || "";
    const status = url.searchParams.get("status") || "all";
    const page = Math.max(1, parseInt(url.searchParams.get("page") || "1", 10));
    const limit = 20;
    const offset = (page - 1) * limit;

    const sql = getDb();

    if (resource === "orders") {
      let where = sql`o.deleted_at IS NULL`;
      if (q.trim()) {
        const term = `%${q.trim()}%`;
        where = sql`${where} AND (o.id::text ILIKE ${term} OR o.delivery_address ILIKE ${term})`;
      }
      if (status !== "all") {
        where = sql`${where} AND o.status = ${status}`;
      }

      const [rows, count] = await Promise.all([
        sql`
          SELECT 
            o.id, o.user_id, o.items, o.subtotal::float, o.total::float,
            o.status, o.payment_method, o.payment_status, o.delivery_address,
            o.created_at, o.updated_at,
            COALESCE(u.first_name || ' ' || u.last_name, p.full_name, 'Farmer') AS customer_name,
            COALESCE(u.phone_number, p.phone, '') AS customer_phone
          FROM orders o
          LEFT JOIN profiles p ON p.id = o.user_id
          LEFT JOIN users u ON u.id = o.user_id
          WHERE ${where}
          ORDER BY o.created_at DESC
          LIMIT ${limit} OFFSET ${offset}
        `,
        sql`SELECT COUNT(*)::int as count FROM orders o WHERE ${where}`,
      ]);

      const total = count[0]?.count || 0;
      return new Response(
        JSON.stringify({
          items: rows.map((r: any) => ({
            id: r.id,
            name: r.customer_name,
            phone: r.customer_phone,
            status: r.status,
            total: r.total,
            date: r.created_at,
            items: r.items,
            delivery: r.delivery_address,
          })),
          total,
          page,
          pages: Math.ceil(total / limit) || 1,
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }

    if (resource === "products") {
      let where = sql`p.deleted_at IS NULL`;
      if (q.trim()) {
        const term = `%${q.trim()}%`;
        where = sql`${where} AND (p.name ILIKE ${term} OR p.description ILIKE ${term})`;
      }
      if (status === "low-stock") {
        where = sql`${where} AND p.stock_qty <= 5`;
      } else if (status !== "all") {
        where = sql`${where} AND p.status = ${status}`;
      }

      const [rows, count] = await Promise.all([
        sql`
          SELECT 
            p.id, p.name, p.slug, p.base_price::float AS price,
            p.stock_qty AS stock, p.status, p.field, p.subcategory,
            p.image_urls, p.is_featured, p.created_at
          FROM products p
          WHERE ${where}
          ORDER BY p.created_at DESC
          LIMIT ${limit} OFFSET ${offset}
        `,
        sql`SELECT COUNT(*)::int as count FROM products p WHERE ${where}`,
      ]);

      const total = count[0]?.count || 0;
      return new Response(
        JSON.stringify({
          items: rows.map((r: any) => ({
            id: r.id,
            name: r.name,
            price: r.price,
            stock: r.stock,
            status: r.status,
            category: r.subcategory || r.field || "General",
            image: (Array.isArray(r.image_urls) && r.image_urls[0]) || "",
            featured: Boolean(r.is_featured),
          })),
          total,
          page,
          pages: Math.ceil(total / limit) || 1,
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }

    if (resource === "users") {
      let where = sql`1=1`;
      if (q.trim()) {
        const term = `%${q.trim()}%`;
        where = sql`${where} AND (u.first_name ILIKE ${term} OR u.last_name ILIKE ${term} OR u.email ILIKE ${term} OR u.phone_number ILIKE ${term})`;
      }

      const [rows, count] = await Promise.all([
        sql`
          SELECT 
            u.id, u.first_name, u.last_name, u.email, u.phone_number,
            u.county, u.farming_type, u.created_at,
            p.role, p.status, p.reputation_score
          FROM users u
          LEFT JOIN profiles p ON p.id = u.id
          WHERE ${where}
          ORDER BY u.created_at DESC
          LIMIT ${limit} OFFSET ${offset}
        `,
        sql`SELECT COUNT(*)::int as count FROM users u WHERE ${where}`,
      ]);

      const total = count[0]?.count || 0;
      return new Response(
        JSON.stringify({
          items: rows.map((r: any) => ({
            id: r.id,
            name: `${r.first_name || ""} ${r.last_name || ""}`.trim() || r.email,
            email: r.email,
            phone: r.phone_number,
            county: r.county || "Kenya",
            role: r.role || "farmer",
            status: r.status || "active",
            farmingType: r.farming_type,
            date: r.created_at,
          })),
          total,
          page,
          pages: Math.ceil(total / limit) || 1,
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }

    if (resource === "requests") {
      const [rows, count] = await Promise.all([
        sql`
          SELECT 
            sr.id, sr.user_id, sr.status, sr.location, sr.notes,
            sr.scheduled_date, sr.contact_name, sr.contact_phone, sr.created_at,
            s.name AS service_name
          FROM service_requests sr
          LEFT JOIN services s ON s.id = sr.service_id
          ORDER BY sr.created_at DESC
          LIMIT ${limit} OFFSET ${offset}
        `,
        sql`SELECT COUNT(*)::int as count FROM service_requests`,
      ]);

      const total = count[0]?.count || 0;
      return new Response(
        JSON.stringify({
          items: rows.map((r: any) => ({
            id: r.id,
            name: r.contact_name || "Farmer",
            phone: r.contact_phone || "",
            service: r.service_name || "Agricultural Service",
            location: r.location || "Kenya",
            status: r.status,
            date: r.scheduled_date || r.created_at,
            notes: r.notes || "",
          })),
          total,
          page,
          pages: Math.ceil(total / limit) || 1,
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }

    if (resource === "forum") {
      let where = sql`1=1`;
      if (q.trim()) {
        const term = `%${q.trim()}%`;
        where = sql`${where} AND (p.title ILIKE ${term} OR p.body ILIKE ${term})`;
      }
      if (status === "hidden") {
        where = sql`${where} AND p.deleted_at IS NOT NULL`;
      } else if (status === "visible") {
        where = sql`${where} AND p.deleted_at IS NULL`;
      }

      const [rows, count] = await Promise.all([
        sql`
          SELECT 
            p.id, p.title, p.body, p.type, p.created_at,
            (p.deleted_at IS NOT NULL) AS hidden,
            COALESCE(u.first_name || ' ' || u.last_name, prof.full_name, 'Farmer') AS author,
            COALESCE(u.county, prof.county_region, 'Kenya') AS county,
            (SELECT COUNT(*)::int FROM show_comments c WHERE c.post_id = p.id) AS comments_count
          FROM show_posts p
          LEFT JOIN profiles prof ON prof.id = p.user_id
          LEFT JOIN users u ON u.id = p.user_id
          WHERE ${where}
          ORDER BY p.created_at DESC
          LIMIT ${limit} OFFSET ${offset}
        `,
        sql`SELECT COUNT(*)::int as count FROM show_posts p WHERE ${where}`,
      ]);

      const total = count[0]?.count || 0;
      return new Response(
        JSON.stringify({
          items: rows.map((r: any) => ({
            id: r.id,
            title: r.title || "Discussion",
            text: r.body,
            author: r.author,
            county: r.county,
            hidden: r.hidden,
            comments_count: r.comments_count,
            date: r.created_at,
          })),
          total,
          page,
          pages: Math.ceil(total / limit) || 1,
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }

    if (resource === "articles") {
      let where = sql`1=1`;
      if (q.trim()) {
        const term = `%${q.trim()}%`;
        where = sql`${where} AND (title ILIKE ${term} OR summary ILIKE ${term})`;
      }

      const [rows, count] = await Promise.all([
        sql`
          SELECT id, title, slug, summary, category, author_name, image_url, published_at, is_featured
          FROM agritech_news
          WHERE ${where}
          ORDER BY published_at DESC
          LIMIT ${limit} OFFSET ${offset}
        `,
        sql`SELECT COUNT(*)::int as count FROM agritech_news WHERE ${where}`,
      ]);

      const total = count[0]?.count || 0;
      return new Response(
        JSON.stringify({
          items: rows.map((r: any) => ({
            id: r.id,
            title: r.title,
            category: r.category,
            author: r.author_name,
            date: r.published_at,
            image: r.image_url,
            featured: Boolean(r.is_featured),
            status: "published",
          })),
          total,
          page,
          pages: Math.ceil(total / limit) || 1,
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ items: [], total: 0, page: 1, pages: 1 }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    console.error(`[API/V1/ADMIN/${resource} ERROR]:`, err);
    return new Response(JSON.stringify({ error: err?.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

export async function handleAdminGetRecord(
  resource: string,
  id: string,
  request: Request
): Promise<Response> {
  const user = await authenticateRequest(request);
  if (!user || (user.role !== "admin" && user.role !== "super_admin")) {
    return new Response(JSON.stringify({ error: "Forbidden. Admin access required." }), {
      status: 403,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const sql = getDb();

    if (resource === "orders") {
      const rows = await sql`
        SELECT 
          o.id, o.user_id, o.items, o.subtotal::float, o.total::float,
          o.status, o.payment_method, o.payment_status, o.payment_reference,
          o.delivery_address, o.notes, o.created_at, o.updated_at,
          COALESCE(u.first_name || ' ' || u.last_name, p.full_name, 'Farmer') AS customer_name,
          COALESCE(u.phone_number, p.phone, '') AS customer_phone,
          u.email AS customer_email
        FROM orders o
        LEFT JOIN profiles p ON p.id = o.user_id
        LEFT JOIN users u ON u.id = o.user_id
        WHERE o.id = ${id}
        LIMIT 1
      `;
      if (!rows.length) {
        return new Response(JSON.stringify({ error: "Order not found" }), {
          status: 404,
          headers: { "Content-Type": "application/json" },
        });
      }
      const r = rows[0];
      return new Response(
        JSON.stringify({
          item: {
            id: r.id,
            status: r.status,
            items: Array.isArray(r.items) ? r.items : [],
            subtotal: r.subtotal || 0,
            delivery: Math.max(0, (r.total || 0) - (r.subtotal || 0)),
            total: r.total || 0,
            payment_status: r.payment_status || "Pending",
            payment_reference: r.payment_reference || "",
            contact: r.customer_phone || r.customer_email || "",
            notes: r.notes || "",
            created_at: r.created_at,
          },
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }

    if (resource === "products") {
      const rows = await sql`
        SELECT 
          p.id, p.name, p.slug, p.description, p.base_price::float AS price,
          p.stock_qty AS stock, p.status, p.field, p.subcategory,
          p.image_urls, p.is_featured, p.metadata
        FROM products p
        WHERE p.id = ${id}
        LIMIT 1
      `;
      if (!rows.length) {
        return new Response(JSON.stringify({ error: "Product not found" }), {
          status: 404,
          headers: { "Content-Type": "application/json" },
        });
      }
      const r = rows[0];
      return new Response(
        JSON.stringify({
          item: {
            id: r.id,
            name: r.name,
            category: r.subcategory || r.field || "Seeds",
            price: r.price,
            stock: r.stock,
            description: r.description || "",
            featured: Boolean(r.is_featured),
            status: r.status || "draft",
            image: (Array.isArray(r.image_urls) && r.image_urls[0]) || "",
            variants: r.metadata?.variants || [],
          },
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }

    if (resource === "requests") {
      const rows = await sql`
        SELECT 
          sr.id, sr.user_id, sr.status, sr.location, sr.notes,
          sr.scheduled_date, sr.contact_name, sr.contact_phone, sr.created_at,
          sr.assigned_to, sr.specialist_contact,
          s.name AS service_name
        FROM service_requests sr
        LEFT JOIN services s ON s.id = sr.service_id
        WHERE sr.id = ${id}
        LIMIT 1
      `;
      if (!rows.length) {
        return new Response(JSON.stringify({ error: "Request not found" }), {
          status: 404,
          headers: { "Content-Type": "application/json" },
        });
      }
      const r = rows[0];
      return new Response(
        JSON.stringify({
          item: {
            id: r.id,
            status: r.status,
            name: r.contact_name,
            contact: r.contact_phone,
            assigned_to: r.assigned_to || "",
            specialist_contact: r.specialist_contact || "",
            service: r.service_name || "Specialist Service",
            location: r.location || "",
            notes: r.notes || "",
            created_at: r.created_at,
          },
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }

    if (resource === "forum") {
      const postRows = await sql`
        SELECT 
          p.id, p.title, p.body, p.type, p.created_at,
          (p.deleted_at IS NOT NULL) AS hidden,
          COALESCE(u.first_name || ' ' || u.last_name, prof.full_name, 'Farmer') AS author,
          COALESCE(u.county, prof.county_region, 'Kenya') AS county
        FROM show_posts p
        LEFT JOIN profiles prof ON prof.id = p.user_id
        LEFT JOIN users u ON u.id = p.user_id
        WHERE p.id = ${id}
        LIMIT 1
      `;
      if (!postRows.length) {
        return new Response(JSON.stringify({ error: "Post not found" }), {
          status: 404,
          headers: { "Content-Type": "application/json" },
        });
      }
      const p = postRows[0];

      const commentRows = await sql`
        SELECT 
          c.id, c.body, c.created_at, c.parent_id,
          (c.deleted_at IS NOT NULL) AS hidden,
          COALESCE(u.first_name || ' ' || u.last_name, prof.full_name, 'Farmer') AS author
        FROM show_comments c
        LEFT JOIN profiles prof ON prof.id = c.user_id
        LEFT JOIN users u ON u.id = c.user_id
        WHERE c.post_id = ${id}
        ORDER BY c.created_at ASC
      `;

      return new Response(
        JSON.stringify({
          item: {
            id: p.id,
            title: p.title || "Community discussion",
            text: p.body,
            author: p.author,
            county: p.county,
            hidden: p.hidden,
            created_at: p.created_at,
            comments: commentRows.map((c: any) => ({
              id: c.id,
              author: c.author,
              text: c.body,
              hidden: c.hidden,
              parent_id: c.parent_id,
            })),
          },
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }

    if (resource === "articles") {
      const rows = await sql`
        SELECT id, title, slug, summary, content, category, author_name, image_url, published_at, is_featured
        FROM agritech_news
        WHERE id = ${id}
        LIMIT 1
      `;
      if (!rows.length) {
        return new Response(JSON.stringify({ error: "Article not found" }), {
          status: 404,
          headers: { "Content-Type": "application/json" },
        });
      }
      const a = rows[0];
      return new Response(
        JSON.stringify({
          item: {
            id: a.id,
            title: a.title,
            excerpt: a.summary || "",
            category: a.category || "Agronomy",
            group: a.category || "Agronomy & Farm Tips",
            readTime: "4 min read",
            date: a.published_at,
            body: typeof a.content === "string" ? a.content.split("\n\n") : [],
            featured: Boolean(a.is_featured),
            image: a.image_url || "",
            status: "published",
          },
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }

    return new Response(JSON.stringify({ item: { id } }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err?.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

export async function handleAdminSaveRecord(
  resource: string,
  id: string,
  request: Request
): Promise<Response> {
  const user = await authenticateRequest(request);
  if (!user || (user.role !== "admin" && user.role !== "super_admin")) {
    return new Response(JSON.stringify({ error: "Forbidden. Admin access required." }), {
      status: 403,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const body = await request.json();
    const sql = getDb();

    if (resource === "products") {
      const { name, category, price, stock, description, featured, image, status, variants } = body;
      const slug = (name || "product").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
      const imageUrls = image ? [image] : [];
      const metadata = variants ? { variants } : {};

      if (id === "new") {
        const [inserted] = await sql`
          INSERT INTO products (
            name, slug, description, base_price, stock_qty, status,
            subcategory, image_urls, is_featured, metadata, created_at, updated_at
          ) VALUES (
            ${name || "New Product"}, ${slug + "-" + Date.now().toString(36)},
            ${description || ""}, ${Number(price) || 0}, ${Number(stock) || 0},
            ${status || "draft"}, ${category || "General"}, ${imageUrls},
            ${Boolean(featured)}, ${metadata}, NOW(), NOW()
          )
          RETURNING id
        `;
        return new Response(JSON.stringify({ success: true, item: { ...body, id: inserted.id } }), {
          status: 201,
          headers: { "Content-Type": "application/json" },
        });
      } else {
        await sql`
          UPDATE products
          SET 
            name = COALESCE(${name}, name),
            description = COALESCE(${description}, description),
            base_price = COALESCE(${Number(price) || null}, base_price),
            stock_qty = COALESCE(${Number(stock) || null}, stock_qty),
            status = COALESCE(${status}, status),
            subcategory = COALESCE(${category}, subcategory),
            image_urls = CASE WHEN ${image !== undefined} THEN ${imageUrls} ELSE image_urls END,
            is_featured = COALESCE(${featured}, is_featured),
            metadata = COALESCE(${metadata}, metadata),
            updated_at = NOW()
          WHERE id = ${id}
        `;
        return new Response(JSON.stringify({ success: true, item: { ...body, id } }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }
    }

    if (resource === "articles") {
      const { title, excerpt, category, body: articleBody, image, featured } = body;
      const content = Array.isArray(articleBody) ? articleBody.join("\n\n") : String(articleBody || "");
      const slug = (title || "article").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

      if (id === "new") {
        const [inserted] = await sql`
          INSERT INTO agritech_news (
            title, slug, summary, content, category, author_name,
            image_url, is_featured, published_at, created_at
          ) VALUES (
            ${title || "New Article"}, ${slug + "-" + Date.now().toString(36)},
            ${excerpt || ""}, ${content}, ${category || "Agronomy"},
            ${user.name || "Mqulima Editorial"}, ${image || ""},
            ${Boolean(featured)}, NOW(), NOW()
          )
          RETURNING id
        `;
        return new Response(JSON.stringify({ success: true, item: { ...body, id: inserted.id } }), {
          status: 201,
          headers: { "Content-Type": "application/json" },
        });
      } else {
        await sql`
          UPDATE agritech_news
          SET 
            title = COALESCE(${title}, title),
            summary = COALESCE(${excerpt}, summary),
            content = COALESCE(${content}, content),
            category = COALESCE(${category}, category),
            image_url = COALESCE(${image}, image_url),
            is_featured = COALESCE(${featured}, is_featured),
            updated_at = NOW()
          WHERE id = ${id}
        `;
        return new Response(JSON.stringify({ success: true, item: { ...body, id } }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }
    }

    return new Response(JSON.stringify({ success: true, item: { ...body, id: id === "new" ? Date.now().toString() : id } }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err?.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

export async function handleAdminStateUpdate(
  resource: string,
  id: string,
  request: Request
): Promise<Response> {
  const user = await authenticateRequest(request);
  if (!user || (user.role !== "admin" && user.role !== "super_admin")) {
    return new Response(JSON.stringify({ error: "Forbidden. Admin access required." }), {
      status: 403,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const body = await request.json();
    const sql = getDb();

    if (resource === "orders") {
      const nextStatus = body.status;
      await sql`
        UPDATE orders
        SET status = ${nextStatus}, updated_at = NOW()
        WHERE id = ${id}
      `;
      return new Response(JSON.stringify({ success: true, item: { id, status: nextStatus } }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (resource === "products") {
      const { status: nextStatus, stock: nextStock } = body;
      if (nextStock !== undefined) {
        await sql`
          UPDATE products
          SET stock_qty = ${nextStock}, updated_at = NOW()
          WHERE id = ${id}
        `;
      }
      if (nextStatus) {
        await sql`
          UPDATE products
          SET status = ${nextStatus}, updated_at = NOW()
          WHERE id = ${id}
        `;
      }
      return new Response(JSON.stringify({ success: true, item: { id, ...body } }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (resource === "requests") {
      const nextStatus = body.status;
      await sql`
        UPDATE service_requests
        SET status = ${nextStatus}, updated_at = NOW()
        WHERE id = ${id}
      `;
      return new Response(JSON.stringify({ success: true, item: { id, status: nextStatus } }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err?.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

export async function handleAdminForumModeration(
  postId: string,
  request: Request,
  commentId?: string
): Promise<Response> {
  const user = await authenticateRequest(request);
  if (!user || (user.role !== "admin" && user.role !== "super_admin")) {
    return new Response(JSON.stringify({ error: "Forbidden. Admin access required." }), {
      status: 403,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const body = await request.json();
    const { hidden } = body;
    const sql = getDb();

    if (commentId) {
      if (hidden) {
        await sql`UPDATE show_comments SET deleted_at = NOW() WHERE id = ${commentId}`;
      } else {
        await sql`UPDATE show_comments SET deleted_at = NULL WHERE id = ${commentId}`;
      }
      return new Response(JSON.stringify({ success: true, item: { id: commentId, hidden } }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (hidden) {
      await sql`UPDATE show_posts SET deleted_at = NOW() WHERE id = ${postId}`;
    } else {
      await sql`UPDATE show_posts SET deleted_at = NULL WHERE id = ${postId}`;
    }

    try {
      invalidateForumSnapshotCache();
    } catch {}

    return new Response(JSON.stringify({ success: true, item: { id: postId, hidden } }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err?.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
