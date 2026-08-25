import { Elysia, t } from "elysia";
import { eq, and, desc, ne, sql } from "drizzle-orm";
import { db } from "../db";
import { messages, orders, shops, users } from "../../drizzle/schema";
import { verifyAuthToken, AUTH_COOKIE_NAME } from "../auth/jwt";
import { createNotification } from "../utils/notification";
import { supabaseAdmin } from "../storage";

// คืน order พร้อม ownerId ของร้าน (join shops) — ใช้ตรวจสิทธิ์แชทของออเดอร์นี้
// ⚠️ ต้อง join shops เพื่อเทียบ ownerId เสมอ ห้ามเทียบ payload.userId กับ order.shopId ตรงๆ
// เพราะ order.shopId คือ id ของร้าน (shops.id) ไม่ใช่ id ของ user เจ้าของร้าน (บั๊กเดิมที่ทำให้ร้านค้าแชทไม่ได้เลย)
async function getOrderWithShopOwner(orderId: string) {
  const [row] = await db
    .select({ order: orders, shopOwnerId: shops.ownerId })
    .from(orders)
    .innerJoin(shops, eq(orders.shopId, shops.id))
    .where(eq(orders.id, orderId));
  return row;
}

// ไฟล์แนบในแชทเก็บใน messages.content เป็น JSON string (ไม่มีคอลัมน์แยกสำหรับไฟล์) — { kind: "file", path, fileName }
// path คือ storage path ใน bucket private "order-files" (อัปโหลดผ่าน POST /uploads type "order-file")
type FileAttachment = { kind: "file"; path: string; fileName: string };

function parseFileAttachment(content: string): FileAttachment | null {
  if (!content.startsWith("{")) return null;
  try {
    const parsed = JSON.parse(content);
    if (parsed?.kind === "file" && typeof parsed.path === "string" && typeof parsed.fileName === "string") {
      return parsed as FileAttachment;
    }
  } catch {
    // ไม่ใช่ JSON ก็ถือเป็นข้อความปกติ
  }
  return null;
}

async function signOrderFilePath(path: string, expiresInSeconds = 3600): Promise<string | null> {
  const { data } = await supabaseAdmin.storage.from("order-files").createSignedUrl(path, expiresInSeconds);
  return data?.signedUrl ?? null;
}

// แปลง row จาก DB ให้ frontend ใช้ได้ตรงๆ — ข้อความไฟล์แนบจะมี fileUrl (signed url ชั่วคราว) + fileName เพิ่มมาให้
async function serializeMessage(row: typeof messages.$inferSelect) {
  const attachment = parseFileAttachment(row.content);
  if (!attachment) {
    return { ...row, isFile: false as const, fileUrl: null, fileName: null };
  }
  const fileUrl = await signOrderFilePath(attachment.path);
  return { ...row, isFile: true as const, fileUrl, fileName: attachment.fileName };
}

export const messagesRoutes = new Elysia({ prefix: "/messages" })
  // ── รายชื่อ "ห้องแชท" (ออเดอร์ที่มีข้อความ) ของผู้ใช้ปัจจุบัน พร้อมข้อความล่าสุด + จำนวนที่ยังไม่อ่าน ──
  .get("/rooms", async ({ cookie, set }) => {
    const token = cookie[AUTH_COOKIE_NAME]?.value as string | undefined;
    const payload = token ? verifyAuthToken(token) : null;
    if (!payload) {
      set.status = 401;
      return { error: "กรุณาเข้าสู่ระบบ" };
    }

    if (payload.role !== "customer" && payload.role !== "shop_owner") {
      set.status = 403;
      return { error: "ไม่มีสิทธิ์เข้าถึงแชทนี้" };
    }

    const ownerFilter =
      payload.role === "customer" ? eq(orders.customerId, payload.userId) : eq(shops.ownerId, payload.userId);

    const rows = await db
      .select({
        orderId: orders.id,
        orderCode: orders.code,
        shopId: orders.shopId,
        shopName: shops.name,
        customerId: orders.customerId,
        customerFirstname: users.firstname,
        customerLastname: users.lastname,
        lastMessageRaw: sql<string>`(
          select content from ${messages}
          where ${messages.orderId} = ${orders.id}
          order by ${messages.createdAt} desc limit 1
        )`,
        lastMessageAt: sql<string>`(
          select created_at from ${messages}
          where ${messages.orderId} = ${orders.id}
          order by ${messages.createdAt} desc limit 1
        )`,
        unreadCount: sql<number>`(
          select count(*)::int from ${messages}
          where ${messages.orderId} = ${orders.id}
            and ${messages.senderId} != ${payload.userId}
            and ${messages.isRead} = false
        )`,
      })
      .from(orders)
      .innerJoin(shops, eq(orders.shopId, shops.id))
      .innerJoin(users, eq(orders.customerId, users.id))
      .where(
        and(
          ownerFilter,
          sql`exists (select 1 from ${messages} where ${messages.orderId} = ${orders.id})`
        )
      )
      .orderBy(
        desc(sql`(
          select created_at from ${messages}
          where ${messages.orderId} = ${orders.id}
          order by ${messages.createdAt} desc limit 1
        )`)
      );

    const rooms = rows.map((r) => {
      const attachment = r.lastMessageRaw ? parseFileAttachment(r.lastMessageRaw) : null;
      return {
        orderId: r.orderId,
        orderCode: r.orderCode,
        shopId: r.shopId,
        shopName: r.shopName,
        customerId: r.customerId,
        customerName: `${r.customerFirstname} ${r.customerLastname}`.trim(),
        lastMessageContent: attachment ? `📎 ${attachment.fileName}` : r.lastMessageRaw,
        lastMessageAt: r.lastMessageAt,
        unreadCount: r.unreadCount,
      };
    });

    return { rooms };
  })
  .post("/", async ({ body, cookie, set }) => {
    const token = cookie[AUTH_COOKIE_NAME]?.value as string | undefined;
    const payload = token ? verifyAuthToken(token) : null;
    if (!payload) {
      set.status = 401;
      return { error: "กรุณาเข้าสู่ระบบ" };
    }

    const { orderId, content, filePath, fileName } = body;

    const row = await getOrderWithShopOwner(orderId);
    if (!row) {
      set.status = 404;
      return { error: "ไม่พบออเดอร์" };
    }
    const { order, shopOwnerId } = row;

    // ต้องเป็นลูกค้าเจ้าของออเดอร์ หรือ เจ้าของร้านของออเดอร์นี้
    if (payload.userId !== order.customerId && payload.userId !== shopOwnerId) {
      set.status = 403;
      return { error: "ไม่มีสิทธิ์ส่งข้อความในออเดอร์นี้" };
    }

    // filePath มีค่า = ข้อความไฟล์แนบ (อัปโหลดผ่าน POST /uploads type "order-file" มาก่อนแล้ว) — เก็บเป็น JSON marker ใน content
    const storedContent: string = filePath
      ? JSON.stringify({ kind: "file", path: filePath, fileName: fileName ?? "ไฟล์แนบ" } satisfies FileAttachment)
      : content ?? "";

    if (!storedContent) {
      set.status = 400;
      return { error: "กรุณากรอกข้อความหรือแนบไฟล์" };
    }

    const [messageRow] = await db
      .insert(messages)
      .values({
        orderId,
        senderId: payload.userId,
        shopId: order.shopId,
        content: storedContent,
      })
      .returning();

    // แจ้งเตือนฝั่งตรงข้าม — ผู้รับต้องเป็น users.id เสมอ (ลูกค้าส่งไปหาเจ้าของร้าน, ร้านส่งไปหาลูกค้า)
    const receiverId = payload.userId === order.customerId ? shopOwnerId : order.customerId;
    const notifyText = filePath ? `แนบไฟล์: ${fileName ?? "ไฟล์แนบ"}` : content ?? "";

    // แจ้งเตือนร้านค้า หรือลูกค้า (Type 3 = แชทลูกค้าทักมา)
    await createNotification({
      userId: receiverId,
      typeId: 3,
      category: "chat",
      title: `ข้อความใหม่จากออเดอร์ ${order.code}`,
      message: notifyText.substring(0, 50) + (notifyText.length > 50 ? "..." : ""),
      link: payload.userId === order.customerId ? `/shop/orders/${order.id}` : `/orders/${order.id}`,
    });

    return { message: await serializeMessage(messageRow) };
  }, {
    body: t.Object({
      orderId: t.String(),
      content: t.Optional(t.String()),
      filePath: t.Optional(t.String()),
      fileName: t.Optional(t.String()),
    })
  })
  // ── มาร์คข้อความในออเดอร์นี้ว่าอ่านแล้ว (เฉพาะข้อความที่ไม่ได้ส่งโดยตัวเอง) ──
  .patch("/:orderId/read", async ({ params: { orderId }, cookie, set }) => {
    const token = cookie[AUTH_COOKIE_NAME]?.value as string | undefined;
    const payload = token ? verifyAuthToken(token) : null;
    if (!payload) {
      set.status = 401;
      return { error: "กรุณาเข้าสู่ระบบ" };
    }

    const row = await getOrderWithShopOwner(orderId);
    if (!row) {
      set.status = 404;
      return { error: "ไม่พบออเดอร์" };
    }
    const { order, shopOwnerId } = row;

    if (payload.userId !== order.customerId && payload.userId !== shopOwnerId) {
      set.status = 403;
      return { error: "ไม่มีสิทธิ์เข้าถึงข้อความในออเดอร์นี้" };
    }

    await db
      .update(messages)
      .set({ isRead: true })
      .where(and(eq(messages.orderId, orderId), ne(messages.senderId, payload.userId)));

    return { success: true };
  })
  .get("/:orderId", async ({ params: { orderId }, cookie, set }) => {
    const token = cookie[AUTH_COOKIE_NAME]?.value as string | undefined;
    const payload = token ? verifyAuthToken(token) : null;
    if (!payload) {
      set.status = 401;
      return { error: "กรุณาเข้าสู่ระบบ" };
    }

    const row = await getOrderWithShopOwner(orderId);
    if (!row) {
      set.status = 404;
      return { error: "ไม่พบออเดอร์" };
    }
    const { order, shopOwnerId } = row;

    if (payload.userId !== order.customerId && payload.userId !== shopOwnerId) {
      set.status = 403;
      return { error: "ไม่มีสิทธิ์ดูข้อความในออเดอร์นี้" };
    }

    const chatHistory = await db
      .select()
      .from(messages)
      .where(eq(messages.orderId, orderId))
      .orderBy(desc(messages.createdAt));

    return { messages: await Promise.all(chatHistory.map(serializeMessage)) };
  });
