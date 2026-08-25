import { Elysia } from "elysia";
import { desc, eq, and } from "drizzle-orm";
import {
  createContactAdminMessageSchema,
  replyContactAdminMessageSchema,
  type ContactAdminMessageItem,
} from "@easyprint/shared";
import { db } from "../db";
import { contactAdminMessages, shops, users } from "../../drizzle/schema";
import { verifyAuthToken, AUTH_COOKIE_NAME } from "../auth/jwt";
import { requireShopOwner } from "./services";
import { createAdminNotification } from "../adminNotifications";

async function requireAdmin(cookie: Record<string, { value?: unknown } | undefined>, set: { status?: unknown }) {
  const token = cookie[AUTH_COOKIE_NAME]?.value as string | undefined;
  const payload = token ? verifyAuthToken(token) : null;
  if (!payload) {
    set.status = 401;
    return { error: "ยังไม่ได้เข้าสู่ระบบ" };
  }
  if (payload.role !== "admin") {
    set.status = 403;
    return { error: "ต้องเป็นบัญชีแอดมินเท่านั้น" };
  }
  return null;
}

async function requireCustomer(cookie: Record<string, { value?: unknown } | undefined>, set: { status?: unknown }) {
  const token = cookie[AUTH_COOKIE_NAME]?.value as string | undefined;
  const payload = token ? verifyAuthToken(token) : null;
  if (!payload) {
    set.status = 401;
    return { error: "ยังไม่ได้เข้าสู่ระบบ" };
  }
  if (payload.role !== "customer") {
    set.status = 403;
    return { error: "ต้องเป็นบัญชีลูกค้าเท่านั้น" };
  }
  return null;
}

function serialize(
  row: typeof contactAdminMessages.$inferSelect,
  extra?: { shopName?: string; customerName?: string }
): ContactAdminMessageItem {
  return {
    id: row.id,
    senderType: row.senderType,
    shopId: row.shopId,
    shopName: extra?.shopName,
    userId: row.userId,
    customerName: extra?.customerName,
    subject: row.subject,
    message: row.message,
    status: row.status,
    adminReply: row.adminReply,
    createdAt: row.createdAt.toISOString(),
  };
}

export const contactAdminRoutes = new Elysia()
  // ── ร้านค้าส่งข้อความถึงแอดมิน ──────────
  .post("/shops/:shopId/contact-admin", async ({ params, body, cookie, set }) => {
    const authError = await requireShopOwner(cookie, params.shopId, set);
    if (authError) return authError;

    const parsed = createContactAdminMessageSchema.safeParse(body);
    if (!parsed.success) {
      set.status = 400;
      return { error: "ข้อมูลไม่ถูกต้อง", details: parsed.error.flatten() };
    }

    const [shop] = await db.select({ name: shops.name }).from(shops).where(eq(shops.id, params.shopId));

    const [created] = await db
      .insert(contactAdminMessages)
      .values({ senderType: "shop", shopId: params.shopId, subject: parsed.data.subject, message: parsed.data.message })
      .returning();

    createAdminNotification({
      type: "contact_admin_message",
      title: "ข้อความใหม่จากร้านค้า",
      message: `${shop?.name ?? "ร้านค้า"}: ${parsed.data.subject}`,
      link: `/admin/contact-messages`,
    }).catch((err) => console.error("สร้างการแจ้งเตือนข้อความ contact-admin ไม่สำเร็จ:", err));

    return { message: serialize(created, { shopName: shop?.name }) };
  })

  // ── ประวัติข้อความ contact-admin ของร้านตัวเอง ──────────
  .get("/shops/:shopId/contact-admin", async ({ params, cookie, set }) => {
    const authError = await requireShopOwner(cookie, params.shopId, set);
    if (authError) return authError;

    const rows = await db
      .select()
      .from(contactAdminMessages)
      .where(and(eq(contactAdminMessages.shopId, params.shopId), eq(contactAdminMessages.senderType, "shop")))
      .orderBy(desc(contactAdminMessages.createdAt));

    return { messages: rows.map((r) => serialize(r)) };
  })

  // ── ลูกค้าส่งข้อความถึงแอดมิน ──────────
  .post("/users/contact-admin", async ({ body, cookie, set }) => {
    const authError = await requireCustomer(cookie, set);
    if (authError) return authError;

    const token = cookie[AUTH_COOKIE_NAME]?.value as string;
    const payload = verifyAuthToken(token)!;

    const parsed = createContactAdminMessageSchema.safeParse(body);
    if (!parsed.success) {
      set.status = 400;
      return { error: "ข้อมูลไม่ถูกต้อง", details: parsed.error.flatten() };
    }

    const [user] = await db
      .select({ firstname: users.firstname, lastname: users.lastname })
      .from(users)
      .where(eq(users.id, payload.userId));

    const [created] = await db
      .insert(contactAdminMessages)
      .values({ senderType: "customer", userId: payload.userId, subject: parsed.data.subject, message: parsed.data.message })
      .returning();

    const customerName = user ? `${user.firstname} ${user.lastname}`.trim() : "ลูกค้า";

    createAdminNotification({
      type: "contact_admin_message",
      title: "ข้อความใหม่จากลูกค้า",
      message: `${customerName}: ${parsed.data.subject}`,
      link: `/admin/contact-messages`,
    }).catch((err) => console.error("สร้างการแจ้งเตือนข้อความ contact-admin ไม่สำเร็จ:", err));

    return { message: serialize(created, { customerName }) };
  })

  // ── ลูกค้าดูประวัติข้อความ contact-admin ของตัวเอง ──────────
  .get("/users/contact-admin", async ({ cookie, set }) => {
    const authError = await requireCustomer(cookie, set);
    if (authError) return authError;

    const token = cookie[AUTH_COOKIE_NAME]?.value as string;
    const payload = verifyAuthToken(token)!;

    const rows = await db
      .select()
      .from(contactAdminMessages)
      .where(and(eq(contactAdminMessages.userId, payload.userId), eq(contactAdminMessages.senderType, "customer")))
      .orderBy(desc(contactAdminMessages.createdAt));

    return { messages: rows.map((r) => serialize(r)) };
  })

  // ── แอดมินดูข้อความ contact-admin ทั้งหมด ──────────
  .get("/admin/contact-messages", async ({ cookie, set }) => {
    const authError = await requireAdmin(cookie, set);
    if (authError) return authError;

    const rows = await db
      .select({
        message: contactAdminMessages,
        shopName: shops.name,
        userFirstname: users.firstname,
        userLastname: users.lastname,
      })
      .from(contactAdminMessages)
      .leftJoin(shops, eq(contactAdminMessages.shopId, shops.id))
      .leftJoin(users, eq(contactAdminMessages.userId, users.id))
      .orderBy(desc(contactAdminMessages.createdAt));

    return {
      messages: rows.map((r) => {
        const customerName =
          r.userFirstname || r.userLastname
            ? `${r.userFirstname ?? ""} ${r.userLastname ?? ""}`.trim()
            : undefined;
        return serialize(r.message, { shopName: r.shopName ?? undefined, customerName });
      }),
    };
  })

  // ── แอดมินตอบกลับข้อความ ──────────
  .patch("/admin/contact-messages/:id/reply", async ({ params, body, cookie, set }) => {
    const authError = await requireAdmin(cookie, set);
    if (authError) return authError;

    const parsed = replyContactAdminMessageSchema.safeParse(body);
    if (!parsed.success) {
      set.status = 400;
      return { error: "ข้อมูลไม่ถูกต้อง", details: parsed.error.flatten() };
    }

    const [updated] = await db
      .update(contactAdminMessages)
      .set({ adminReply: parsed.data.adminReply, status: "resolved" })
      .where(eq(contactAdminMessages.id, params.id))
      .returning();

    if (!updated) {
      set.status = 404;
      return { error: "ไม่พบข้อความนี้" };
    }

    let extra: { shopName?: string; customerName?: string } = {};
    if (updated.shopId) {
      const [shop] = await db.select({ name: shops.name }).from(shops).where(eq(shops.id, updated.shopId));
      extra.shopName = shop?.name;
    } else if (updated.userId) {
      const [user] = await db.select({ firstname: users.firstname, lastname: users.lastname }).from(users).where(eq(users.id, updated.userId));
      if (user) extra.customerName = `${user.firstname} ${user.lastname}`.trim();
    }

    return { message: serialize(updated, extra) };
  });
