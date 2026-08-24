import { Elysia, t } from "elysia";
import { eq, or, and, desc } from "drizzle-orm";
import { db } from "../db";
import { messages, orders } from "../../drizzle/schema";
import { verifyAuthToken, AUTH_COOKIE_NAME } from "../auth/jwt";
import { createNotification } from "../utils/notification";

export const messagesRoutes = new Elysia({ prefix: "/messages" })
  .post("/", async ({ body, cookie, set }) => {
    const token = cookie[AUTH_COOKIE_NAME]?.value as string | undefined;
    const payload = token ? verifyAuthToken(token) : null;
    if (!payload) {
      set.status = 401;
      return { error: "กรุณาเข้าสู่ระบบ" };
    }

    const { orderId, content } = body;

    const [order] = await db.select().from(orders).where(eq(orders.id, orderId));
    if (!order) {
      set.status = 404;
      return { error: "ไม่พบออเดอร์" };
    }

    // ต้องเป็นลูกค้าเจ้าของออเดอร์ หรือ ร้านค้าเจ้าของออเดอร์
    if (payload.userId !== order.customerId && payload.userId !== order.shopId) {
      set.status = 403;
      return { error: "ไม่มีสิทธิ์ส่งข้อความในออเดอร์นี้" };
    }

    const [message] = await db
      .insert(messages)
      .values({
        orderId,
        senderId: payload.userId,
        shopId: order.shopId,
        content,
      })
      .returning();

    // แจ้งเตือนฝั่งตรงข้าม
    const receiverId = payload.role === "customer" ? order.shopId : order.customerId;
    
    // แจ้งเตือนร้านค้า หรือลูกค้า (Type 3 = แชทลูกค้าทักมา)
    await createNotification({
      userId: receiverId,
      typeId: 3,
      category: "chat", 
      title: `ข้อความใหม่จากออเดอร์ ${order.code}`,
      message: content.substring(0, 50) + (content.length > 50 ? "..." : ""),
      link: payload.role === "customer" ? `/shop/orders/${order.id}` : `/orders/${order.id}`,
    });

    return { message };
  }, {
    body: t.Object({
      orderId: t.String(),
      content: t.String({ minLength: 1 }),
    })
  })
  .get("/:orderId", async ({ params: { orderId }, cookie, set }) => {
    const token = cookie[AUTH_COOKIE_NAME]?.value as string | undefined;
    const payload = token ? verifyAuthToken(token) : null;
    if (!payload) {
      set.status = 401;
      return { error: "กรุณาเข้าสู่ระบบ" };
    }

    const [order] = await db.select().from(orders).where(eq(orders.id, orderId));
    if (!order) {
      set.status = 404;
      return { error: "ไม่พบออเดอร์" };
    }

    if (payload.userId !== order.customerId && payload.userId !== order.shopId) {
      set.status = 403;
      return { error: "ไม่มีสิทธิ์ดูข้อความในออเดอร์นี้" };
    }

    const chatHistory = await db
      .select()
      .from(messages)
      .where(eq(messages.orderId, orderId))
      .orderBy(desc(messages.createdAt));

    return { messages: chatHistory };
  });
