import { eq, isNull, and, desc } from "drizzle-orm";
import { getDb } from "../index";
import { products, productCategories, type Product, type NewProduct, type ProductCategory } from "../schema";

export class ProductRepository {
  static async findProducts(options: {
    categoryId?: string;
    isFeatured?: boolean;
    limit?: number;
    offset?: number;
  } = {}): Promise<Product[]> {
    const db = getDb();
    const conditions = [isNull(products.deletedAt), eq(products.status, "active")];

    if (options.categoryId) {
      conditions.push(eq(products.categoryId, options.categoryId));
    }
    if (options.isFeatured !== undefined) {
      conditions.push(eq(products.isFeatured, options.isFeatured));
    }

    return db
      .select()
      .from(products)
      .where(and(...conditions))
      .orderBy(desc(products.createdAt))
      .limit(options.limit ?? 50)
      .offset(options.offset ?? 0);
  }

  static async findProductBySlug(slug: string): Promise<Product | undefined> {
    const db = getDb();
    const result = await db
      .select()
      .from(products)
      .where(and(eq(products.slug, slug), isNull(products.deletedAt)))
      .limit(1);
    return result[0];
  }

  static async findProductById(id: string): Promise<Product | undefined> {
    const db = getDb();
    const result = await db
      .select()
      .from(products)
      .where(and(eq(products.id, id), isNull(products.deletedAt)))
      .limit(1);
    return result[0];
  }

  static async createProduct(productData: NewProduct): Promise<Product> {
    const db = getDb();
    const [created] = await db.insert(products).values(productData).returning();
    return created;
  }

  static async findCategories(): Promise<ProductCategory[]> {
    const db = getDb();
    return db.select().from(productCategories).orderBy(productCategories.name);
  }
}
