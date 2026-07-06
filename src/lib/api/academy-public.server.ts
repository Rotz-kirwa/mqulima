import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

async function db() {
  const { getDb } = await import("../db.server");
  return getDb();
}

export const getPublishedCourses = createServerFn({ method: "POST" })
  .handler(async () => {
    const sql = await db();
    return sql`
      SELECT 
        c.id, c.title, c.description, c.cover_image_url, 
        c.intro_video_url, c.intro_video_type, c.level, 
        c.price::float as price, c.duration_minutes, c.category, c.is_published,
        c.instructor_name, c.instructor_title, c.rating::float as rating, 
        c.student_count, c.has_certificate, c.youtube_id,
        COUNT(DISTINCT cc.id)::int as chapter_count,
        COUNT(DISTINCT cl.id)::int as lesson_count
      FROM courses c
      LEFT JOIN course_chapters cc ON cc.course_id = c.id
      LEFT JOIN chapter_lessons cl ON cl.chapter_id = cc.id
      WHERE c.is_published = true AND c.deleted_at IS NULL
      GROUP BY c.id
      ORDER BY c.sort_order ASC, c.created_at DESC
    `;
  });

const CourseDetailInputSchema = z.union([
  z.string(),
  z.object({ data: z.string() })
]);

export const getCourseDetail = createServerFn({ method: "POST" })
  .inputValidator(CourseDetailInputSchema)
  .handler(async ({ data }) => {
    const courseId = typeof data === "string" ? data : data.data;
    const sql = await db();

    // 1. Fetch course details
    const courseRes = await sql`
      SELECT 
        id, title, description, cover_image_url, intro_video_url, intro_video_type,
        level, price::float as price, duration_minutes, category, is_published,
        instructor_name, instructor_title, rating::float as rating, 
        student_count, has_certificate, youtube_id
      FROM courses
      WHERE id = ${courseId} AND is_published = true AND deleted_at IS NULL
    `;

    if (courseRes.length === 0) {
      throw new Error("Course not found");
    }

    const course = courseRes[0];

    // 2. Fetch chapters
    const chapters = await sql`
      SELECT id, title, description, sort_order, duration_minutes
      FROM course_chapters
      WHERE course_id = ${courseId} AND is_published = true
      ORDER BY sort_order ASC
    `;

    // 3. For each chapter, fetch lessons
    const chaptersWithLessons = await Promise.all(
      chapters.map(async (ch) => {
        const lessons = await sql`
          SELECT id, chapter_id, title, content_type, video_url, video_type, video_duration_seconds, text_content, pdf_url, sort_order, is_free_preview
          FROM chapter_lessons
          WHERE chapter_id = ${ch.id}
          ORDER BY sort_order ASC
        `;
        return {
          ...ch,
          lessons,
        };
      })
    );

    // 4. Fetch User's Enrollment & Progress Status
    const { getCurrentUser } = await import("../auth-server");
    const user = await getCurrentUser();
    
    let is_enrolled = false;
    let progress_pct = 0;
    let completed_lessons: string[] = [];

    if (user) {
      const [enrollment] = await sql`
        SELECT id, progress_pct
        FROM course_enrollments
        WHERE course_id = ${courseId} AND user_id = ${user.id}
      `;
      if (enrollment) {
        is_enrolled = true;
        progress_pct = enrollment.progress_pct ?? 0;
        
        const completedRes = await sql`
          SELECT lesson_id
          FROM user_completed_lessons
          WHERE course_id = ${courseId} AND user_id = ${user.id}
        `;
        completed_lessons = completedRes.map((r: any) => r.lesson_id);
      }
    }

    return {
      ...course,
      is_enrolled,
      progress_pct,
      completed_lessons,
      chapters: chaptersWithLessons,
    };
  });

export const getAcademyStats = createServerFn({ method: "POST" })
  .handler(async () => {
    const sql = await db();
    
    // We fetch counts of courses, chapters, and enrollments
    const res = await sql`
      SELECT 
        (SELECT COUNT(*)::int FROM courses WHERE is_published = true AND deleted_at IS NULL) as course_count,
        (SELECT COUNT(cc.id)::int FROM course_chapters cc JOIN courses c ON c.id = cc.course_id WHERE c.is_published = true AND c.deleted_at IS NULL) as chapter_count,
        (SELECT COUNT(DISTINCT user_id)::int FROM course_enrollments) as enrollment_count
    `;
    
    return res[0] || { course_count: 0, chapter_count: 0, enrollment_count: 0 };
  });

export const enrollInCourse = createServerFn({ method: "POST" })
  .inputValidator(z.object({ courseId: z.string().uuid() }))
  .handler(async ({ data }) => {
    const { getCurrentUser } = await import("../auth-server");
    const user = await getCurrentUser();
    if (!user) {
      throw new Error("Unauthorized");
    }

    const sql = await db();

    // Check if enrollment already exists
    const [existing] = await sql`
      SELECT id FROM course_enrollments
      WHERE course_id = ${data.courseId} AND user_id = ${user.id}
    `;

    if (!existing) {
      await sql`
        INSERT INTO course_enrollments (course_id, user_id, progress_pct)
        VALUES (${data.courseId}, ${user.id}, 0)
      `;

      // Log audit
      const { writeAuditLog } = await import("../audit.server");
      await writeAuditLog({
        actorId: user.id,
        action: "academy.enroll",
        entityType: "course",
        entityId: data.courseId,
        diff: { userId: user.id }
      });
    }

    return { success: true };
  });

export const toggleLessonCompletion = createServerFn({ method: "POST" })
  .inputValidator(z.object({
    courseId: z.string().uuid(),
    lessonId: z.string().uuid(),
    completed: z.boolean()
  }))
  .handler(async ({ data }) => {
    const { getCurrentUser } = await import("../auth-server");
    const user = await getCurrentUser();
    if (!user) {
      throw new Error("Unauthorized");
    }

    const sql = await db();

    // 1. Verify user is enrolled
    const [enrollment] = await sql`
      SELECT id FROM course_enrollments
      WHERE course_id = ${data.courseId} AND user_id = ${user.id}
    `;
    if (!enrollment) {
      throw new Error("User not enrolled in this course");
    }

    // 2. Insert or delete from user_completed_lessons
    if (data.completed) {
      await sql`
        INSERT INTO user_completed_lessons (user_id, course_id, lesson_id)
        VALUES (${user.id}, ${data.courseId}, ${data.lessonId})
        ON CONFLICT (user_id, lesson_id) DO NOTHING
      `;
    } else {
      await sql`
        DELETE FROM user_completed_lessons
        WHERE user_id = ${user.id} AND lesson_id = ${data.lessonId}
      `;
    }

    // 3. Count total lessons in the course
    const [totalRes] = await sql`
      SELECT COUNT(*)::int as count FROM chapter_lessons cl
      JOIN course_chapters cc ON cc.id = cl.chapter_id
      WHERE cc.course_id = ${data.courseId}
    `;
    const totalLessons = totalRes?.count || 0;

    // 4. Count completed lessons in the course
    const [completedRes] = await sql`
      SELECT COUNT(*)::int as count FROM user_completed_lessons
      WHERE user_id = ${user.id} AND course_id = ${data.courseId}
    `;
    const completedLessons = completedRes?.count || 0;

    // Calculate percentage
    const progress_pct = totalLessons > 0 ? Math.min(100, Math.round((completedLessons * 100) / totalLessons)) : 0;
    const completed_at = progress_pct === 100 ? new Date() : null;

    // Update course_enrollments
    await sql`
      UPDATE course_enrollments
      SET progress_pct = ${progress_pct}, completed_at = ${completed_at}
      WHERE course_id = ${data.courseId} AND user_id = ${user.id}
    `;

    return { success: true, progress_pct, completedLessons, totalLessons };
  });
