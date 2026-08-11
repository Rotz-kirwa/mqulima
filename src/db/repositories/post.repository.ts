import { eq, isNull, and, desc } from "drizzle-orm";
import { getDb } from "../index";
import { showPosts, showComments, type ShowPost, type NewShowPost, type ShowComment, type NewShowComment } from "../schema";

export class PostRepository {
  static async findPosts(options: {
    category?: string;
    limit?: number;
    offset?: number;
  } = {}): Promise<ShowPost[]> {
    const db = getDb();
    const conditions = [isNull(showPosts.deletedAt)];

    if (options.category) {
      conditions.push(eq(showPosts.category, options.category));
    }

    return db
      .select()
      .from(showPosts)
      .where(and(...conditions))
      .orderBy(desc(showPosts.createdAt))
      .limit(options.limit ?? 50)
      .offset(options.offset ?? 0);
  }

  static async findPostById(id: string): Promise<ShowPost | undefined> {
    const db = getDb();
    const result = await db
      .select()
      .from(showPosts)
      .where(and(eq(showPosts.id, id), isNull(showPosts.deletedAt)))
      .limit(1);
    return result[0];
  }

  static async createPost(postData: NewShowPost): Promise<ShowPost> {
    const db = getDb();
    const [created] = await db.insert(showPosts).values(postData).returning();
    return created;
  }

  static async addComment(commentData: NewShowComment): Promise<ShowComment> {
    const db = getDb();
    return db.transaction(async (tx) => {
      const [comment] = await tx.insert(showComments).values(commentData).returning();

      // Increment comment count on post
      const [currentPost] = await tx
        .select({ commentCount: showPosts.commentCount })
        .from(showPosts)
        .where(eq(showPosts.id, commentData.postId))
        .limit(1);

      if (currentPost) {
        await tx
          .update(showPosts)
          .set({ commentCount: (currentPost.commentCount ?? 0) + 1 })
          .where(eq(showPosts.id, commentData.postId));
      }

      return comment;
    });
  }
}
