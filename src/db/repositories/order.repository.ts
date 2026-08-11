import { eq, isNull, and, desc } from "drizzle-orm";
import { getDb } from "../index";
import { orders, orderItems, payments, type Order, type NewOrder, type NewOrderItem } from "../schema";

export class OrderRepository {
  static async createOrderWithItems(
    orderData: NewOrder,
    itemsData: Omit<NewOrderItem, "orderId">[]
  ): Promise<{ order: Order; itemsCount: number }> {
    const db = getDb();
    
    return db.transaction(async (tx) => {
      const [createdOrder] = await tx.insert(orders).values(orderData).returning();

      if (itemsData.length > 0) {
        const fullItems = itemsData.map((item) => ({
          ...item,
          orderId: createdOrder.id,
        }));
        await tx.insert(orderItems).values(fullItems);
      }

      return { order: createdOrder, itemsCount: itemsData.length };
    });
  }

  static async findOrdersByUserId(userId: string): Promise<Order[]> {
    const db = getDb();
    return db
      .select()
      .from(orders)
      .where(and(eq(orders.userId, userId), isNull(orders.deletedAt)))
      .orderBy(desc(orders.createdAt));
  }

  static async findOrderById(id: string): Promise<Order | undefined> {
    const db = getDb();
    const result = await db
      .select()
      .from(orders)
      .where(and(eq(orders.id, id), isNull(orders.deletedAt)))
      .limit(1);
    return result[0];
  }

  static async updatePaymentStatus(
    orderId: string,
    status: "pending" | "paid" | "failed" | "refunded"
  ): Promise<Order | undefined> {
    const db = getDb();
    const [updated] = await db
      .update(orders)
      .set({ paymentStatus: status, updatedAt: new Date() })
      .where(eq(orders.id, orderId))
      .returning();
    return updated;
  }
}
