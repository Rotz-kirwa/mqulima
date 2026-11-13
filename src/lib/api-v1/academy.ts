import { getDb, withDbRetry } from "../db.server";

function formatCourseLevel(raw: string | null | undefined): string {
  const val = String(raw || "beginner").trim().toLowerCase();
  if (val === "all_levels" || val === "all" || val === "all levels") return "All Levels";
  return val.replace(/[_-]+/g, " ").replace(/\b\w/g, (ch) => ch.toUpperCase());
}

function resolveCourseCover(coverUrl: string | null | undefined, title: string | null | undefined): string {
  if (coverUrl && String(coverUrl).trim()) return String(coverUrl).trim();
  const t = String(title || "").toLowerCase();
  if (t.includes("poultry")) return "/images/services/incubation.webp";
  if (t.includes("dairy")) return "/images/services/silage.webp";
  if (t.includes("sukuma") || t.includes("collard") || t.includes("crop")) return "/images/services/crop_production.webp";
  if (t.includes("avocado") || t.includes("horticulture")) return "/images/services/consult_agronomist.webp";
  if (t.includes("ai ") || t.includes("artificial intelligence") || t.includes("smart")) return "/images/services/get_coaching.webp";
  return "/images/services/agronomy_consultation.webp";
}

export async function handleListCourses(): Promise<Response> {
  try {
    const { courses, chapters } = await withDbRetry(async (sql) => {
      const courseRows = await sql`
        SELECT 
          c.id, c.title, c.slug, c.description, c.description AS text,
          c.cover_image_url,
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

      const courseIds = courseRows.map((c: any) => c.id);
      const chapterRows = courseIds.length > 0
        ? await sql`
            SELECT 
              cc.id, cc.course_id, cc.title, cc.description, cc.sort_order,
              cl.id AS lesson_id, cl.title AS lesson_title, cl.video_duration_seconds AS lesson_duration_sec,
              cl.is_free_preview AS preview, cl.text_content AS lesson_summary
            FROM course_chapters cc
            LEFT JOIN chapter_lessons cl ON cl.chapter_id = cc.id
            WHERE cc.course_id = ANY(${courseIds})
            ORDER BY cc.sort_order ASC, cl.sort_order ASC
          `
        : [];
      return { courses: courseRows, chapters: chapterRows };
    });

    // Build complete module outline map
    const chaptersMap = new Map<string, any[]>();
    if (chapters.length > 0) {
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
          const mins = Math.max(1, Math.round(Number(ch.lesson_duration_sec || 300) / 60));
          chapter.lessons.push({
            id: ch.lesson_id,
            title: ch.lesson_title,
            duration: `${mins} min`,
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
        level: formatCourseLevel(c.level),
        duration: c.duration_minutes ? `${Math.round(c.duration_minutes / 60)} hrs` : "Self paced",
        image: resolveCourseCover(c.cover_image_url, c.title),
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
    const result = await withDbRetry(async (sql) => {
      const [row] = await sql`
        SELECT 
          c.id, c.title, c.description, c.description AS text,
          c.cover_image_url,
          c.level, c.price::float AS price, c.duration_minutes,
          c.instructor_name, c.rating::float AS rating
        FROM courses c
        WHERE c.id = ${courseId} AND c.is_published = true AND c.deleted_at IS NULL
        LIMIT 1
      `;
      if (!row) return null;
      const chapterRows = await sql`
        SELECT 
          cc.id, cc.title, cc.description, cc.sort_order,
          cl.id AS lesson_id, cl.title AS lesson_title, cl.video_duration_seconds AS lesson_duration_sec,
          cl.is_free_preview AS preview, cl.text_content AS lesson_summary
        FROM course_chapters cc
        LEFT JOIN chapter_lessons cl ON cl.chapter_id = cc.id
        WHERE cc.course_id = ${courseId}
        ORDER BY cc.sort_order ASC, cl.sort_order ASC
      `;
      return { c: row, chapters: chapterRows };
    });

    if (!result) {
      return new Response(
        JSON.stringify({ success: false, error: "Course not found" }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    const { c, chapters } = result;

    const modules: any[] = [];
    for (const ch of chapters) {
      let mod = modules.find((m) => m.id === ch.id);
      if (!mod) {
        mod = { id: ch.id, title: ch.title, lessons: [] };
        modules.push(mod);
      }
      if (ch.lesson_id) {
        const mins = Math.max(1, Math.round(Number(ch.lesson_duration_sec || 300) / 60));
        mod.lessons.push({
          id: ch.lesson_id,
          title: ch.lesson_title,
          duration: `${mins} min`,
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
      level: formatCourseLevel(c.level),
      duration: c.duration_minutes ? `${Math.round(c.duration_minutes / 60)} hrs` : "Self paced",
      image: resolveCourseCover(c.cover_image_url, c.title),
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
