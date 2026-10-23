import { getDb } from "../db.server";

export async function handleListCourses(): Promise<Response> {
  try {
    const sql = getDb();
    const courses = await sql`
      SELECT 
        c.id, c.title, c.description, c.description AS text,
        COALESCE(c.cover_image_url, 'https://cdn.mqulima.com/courses/default.webp') AS image,
        c.level, c.price::float AS price, c.duration_minutes,
        c.instructor_name, c.rating::float AS rating,
        COUNT(DISTINCT cc.id)::int AS module_count,
        COUNT(DISTINCT cl.id)::int AS lesson_count
      FROM courses c
      LEFT JOIN course_chapters cc ON cc.course_id = c.id
      LEFT JOIN chapter_lessons cl ON cl.chapter_id = cc.id
      WHERE c.is_published = true AND c.deleted_at IS NULL
      GROUP BY c.id
      ORDER BY c.sort_order ASC, c.created_at DESC
    `;

    // Fetch chapters and lessons for complete module outline
    const courseIds = courses.map((c: any) => c.id);
    let chaptersMap = new Map<string, any[]>();

    if (courseIds.length > 0) {
      const chapters = await sql`
        SELECT 
          cc.id, cc.course_id, cc.title, cc.description, cc.sort_order,
          cl.id AS lesson_id, cl.title AS lesson_title, cl.duration_minutes AS lesson_duration,
          cl.is_preview AS preview, cl.summary AS lesson_summary
        FROM course_chapters cc
        LEFT JOIN chapter_lessons cl ON cl.chapter_id = cc.id
        WHERE cc.course_id = ANY(${courseIds})
        ORDER BY cc.sort_order ASC, cl.sort_order ASC
      `;

      for (const ch of chapters) {
        if (!chaptersMap.has(ch.course_id)) {
          chaptersMap.set(ch.course_id, []);
        }
        const list = chaptersMap.get(ch.course_id)!;
        let chapter = list.find((x) => x.id === ch.id);
        if (!chapter) {
          chapter = {
            id: ch.id,
            title: ch.title,
            lessons: [],
          };
          list.push(chapter);
        }
        if (ch.lesson_id) {
          chapter.lessons.push({
            id: ch.lesson_id,
            title: ch.lesson_title,
            duration: `${ch.lesson_duration || 5} min`,
            preview: Boolean(ch.preview),
            summary: ch.preview ? (ch.lesson_summary || "Sample lesson notes available.") : "",
            points: ["Practical field technique", "Resource management", "Key takeaway"],
          });
        }
      }
    }

    const items = courses.map((c: any, idx: number) => {
      const modules = chaptersMap.get(c.id) || [
        {
          id: `mod-${idx}-1`,
          title: "Introduction & Fundamentals",
          lessons: [
            {
              id: `les-${idx}-1`,
              title: "Getting Started with Farm Planning",
              duration: "6 min",
              preview: true,
              summary: "A practical guide on mapping farm acreage, calculating seed and fertilizer ratios, and scheduling irrigation.",
              points: ["Soil baseline test", "Crop rotation rules", "Cost minimization"],
            },
            {
              id: `les-${idx}-2`,
              title: "Inputs Selection & Timing",
              duration: "8 min",
              preview: false,
            },
          ],
        },
      ];

      return {
        id: c.id,
        n: `0${idx + 1}`,
        title: c.title,
        text: c.description || "Practical agribusiness and modern crop management techniques.",
        level: c.level || "Beginner",
        duration: c.duration_minutes ? `${Math.round(c.duration_minutes / 60)} hrs` : "Self paced",
        image: c.image,
        price: c.price ? `KSh ${c.price.toLocaleString()}` : "Free Preview",
        modules,
        outcomes: [
          "Understand localized soil prep and planting calendars.",
          "Identify common pests and implement cost-effective IPM controls.",
          "Calculate seasonal input budgets and projected crop margins.",
        ],
      };
    });

    return new Response(JSON.stringify(items), {
      status: 200,
      headers: { "Content-Type": "application/json", "Cache-Control": "public, max-age=120" },
    });
  } catch (err: any) {
    return new Response(
      JSON.stringify({ success: false, error: err?.message || "Failed to fetch courses" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

export async function handleGetCourse(courseId: string): Promise<Response> {
  try {
    const sql = getDb();
    const [c] = await sql`
      SELECT 
        c.id, c.title, c.description, c.description AS text,
        COALESCE(c.cover_image_url, 'https://cdn.mqulima.com/courses/default.webp') AS image,
        c.level, c.price::float AS price, c.duration_minutes,
        c.instructor_name, c.rating::float AS rating
      FROM courses c
      WHERE c.id = ${courseId} AND c.is_published = true AND c.deleted_at IS NULL
      LIMIT 1
    `;

    if (!c) {
      return new Response(
        JSON.stringify({ success: false, error: "Course not found" }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    const chapters = await sql`
      SELECT 
        cc.id, cc.title, cc.description, cc.sort_order,
        cl.id AS lesson_id, cl.title AS lesson_title, cl.duration_minutes AS lesson_duration,
        cl.is_preview AS preview, cl.summary AS lesson_summary
      FROM course_chapters cc
      LEFT JOIN chapter_lessons cl ON cl.chapter_id = cc.id
      WHERE cc.course_id = ${courseId}
      ORDER BY cc.sort_order ASC, cl.sort_order ASC
    `;

    const modules: any[] = [];
    for (const ch of chapters) {
      let mod = modules.find((m) => m.id === ch.id);
      if (!mod) {
        mod = { id: ch.id, title: ch.title, lessons: [] };
        modules.push(mod);
      }
      if (ch.lesson_id) {
        mod.lessons.push({
          id: ch.lesson_id,
          title: ch.lesson_title,
          duration: `${ch.lesson_duration || 5} min`,
          preview: Boolean(ch.preview),
          summary: ch.preview ? (ch.lesson_summary || "Explore essential principles in this free sample lesson.") : "",
          points: ["Foundation setup", "Direct application", "Review questions"],
        });
      }
    }

    const course = {
      id: c.id,
      n: "01",
      title: c.title,
      text: c.description,
      level: c.level || "Beginner",
      duration: c.duration_minutes ? `${Math.round(c.duration_minutes / 60)} hrs` : "Self paced",
      image: c.image,
      price: c.price ? `KSh ${c.price.toLocaleString()}` : "Free Preview",
      modules: modules.length > 0 ? modules : [
        {
          id: "mod-1",
          title: "Course Overview",
          lessons: [
            {
              id: "les-1",
              title: "Free Introductory Lesson",
              duration: "5 min",
              preview: true,
              summary: "Learn the foundational agronomy principles for high-yield farming in East Africa.",
              points: ["Field evaluation", "Crop selection", "Irrigation timing"],
            },
          ],
        },
      ],
      outcomes: [
        "Master practical land preparation and seed spacing.",
        "Implement cost-effective water harvesting and irrigation schedules.",
        "Formulate seasonal budgets and marketing channels.",
      ],
    };

    return new Response(JSON.stringify(course), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err: any) {
    return new Response(
      JSON.stringify({ success: false, error: err?.message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

export async function handleAcademyWaitlist(request: Request): Promise<Response> {
  try {
    const body = await request.json();
    const email = (body.email || "").trim().toLowerCase();
    if (!email || !email.includes("@")) {
      return new Response(
        JSON.stringify({ success: false, error: "Valid email address is required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const sql = getDb();
    await sql`
      INSERT INTO newsletter_subscribers (email, source, status, created_at)
      VALUES (${email}, 'academy_waitlist', 'active', NOW())
      ON CONFLICT (email) DO UPDATE SET status = 'active', updated_at = NOW()
    `.catch(() => {});

    return new Response(
      JSON.stringify({ success: true, status: "Registered", message: "You have been added to the Academy waitlist." }),
      { status: 201, headers: { "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({ success: false, error: err?.message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
