import { eq, isNull, and } from "drizzle-orm";
import { getDb } from "../index";
import { users, profiles, type User, type NewUser, type Profile, type NewProfile } from "../schema";

export class UserRepository {
  static async findUserById(id: string): Promise<User | undefined> {
    const db = getDb();
    const result = await db.select().from(users).where(and(eq(users.id, id), isNull(users.deletedAt))).limit(1);
    return result[0];
  }

  static async findUserByEmail(email: string): Promise<User | undefined> {
    const db = getDb();
    const result = await db.select().from(users).where(and(eq(users.email, email), isNull(users.deletedAt))).limit(1);
    return result[0];
  }

  static async findProfileByUserId(userId: string): Promise<Profile | undefined> {
    const db = getDb();
    const result = await db.select().from(profiles).where(and(eq(profiles.id, userId), isNull(profiles.deletedAt))).limit(1);
    return result[0];
  }

  static async findProfileByUsername(username: string): Promise<Profile | undefined> {
    const db = getDb();
    const result = await db.select().from(profiles).where(and(eq(profiles.username, username), isNull(profiles.deletedAt))).limit(1);
    return result[0];
  }

  static async updateProfile(userId: string, data: Partial<NewProfile>): Promise<Profile | undefined> {
    const db = getDb();
    const [updated] = await db
      .update(profiles)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(profiles.id, userId))
      .returning();
    return updated;
  }

  static async createUser(userData: NewUser): Promise<User> {
    const db = getDb();
    const [created] = await db.insert(users).values(userData).returning();
    return created;
  }
}
