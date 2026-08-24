import { Elysia } from "elysia";
import { desc, eq } from "drizzle-orm";
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

function serialize(row: typeof contactAdminMessages.$inferSelect, shopName?: string, shopEmail?: string): ContactAdminMessageItem {
  return {
    id: row.id,
    shopId: row.shopId,
    shopName,
    shopEmail,
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
      .values({ shopId: params.shopId, subject: parsed.data.subject, message: parsed.data.message })
      .returning();

    createAdminNotification({
      type: "contact_admin_message",
      title: "ข้อความใหม่จากร้านค้า",
      message: `${shop?.name ?? "ร้านค้า"}: ${parsed.data.subject}`,
      link: `/admin/contact-messages`,
    }).catch((err) => console.error("สร้างการแจ้งเตือนข้อความ contact-admin ไม่สำเร็จ:", err));

    return { message: serialize(created, shop?.name) };
  })

  // ── ประวัติข้อความ contact-admin ของร้านตัวเอง ──────────
  .get("/shops/:shopId/contact-admin", async ({ params, cookie, set }) => {
    const authError = await requireShopOwner(cookie, params.shopId, set);
    if (authError) return authError;

    const rows = await db
      .select()
      .from(contactAdminMessages)
      .where(eq(contactAdminMessages.shopId, params.shopId))
      .orderBy(desc(contactAdminMessages.createdAt));

    return { messages: rows.map((r) => serialize(r)) };
  })

  // ── แอดมินดูข้อความ contact-admin ทั้งหมด ──────────
  .get("/admin/contact-messages", async ({ cookie, set }) => {
    const authError = await requireAdmin(cookie, set);
    if (authError) return authError;

    const rows = await db
      .select({ message: contactAdminMessages, shopName: shops.name, shopEmail: users.email })
      .from(contactAdminMessages)
      .leftJoin(shops, eq(contactAdminMessages.shopId, shops.id))
      .leftJoin(users, eq(shops.ownerId, users.id))
      .orderBy(desc(contactAdminMessages.createdAt));

    return { messages: rows.map((r) => serialize(r.message, r.shopName ?? undefined, r.shopEmail ?? undefined)) };
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

    const [shop] = await db.select({ name: shops.name }).from(shops).where(eq(shops.id, updated.shopId));

    return { message: serialize(updated, shop?.name) };
  })
  
  // ── แอดมินลบข้อความ ──────────
  .delete("/admin/contact-messages/:id", async ({ params, cookie, set }) => {
    const authError = await requireAdmin(cookie, set);
    if (authError) return authError;

    const [deleted] = await db
      .delete(contactAdminMessages)
      .where(eq(contactAdminMessages.id, params.id))
      .returning();

    if (!deleted) {
      set.status = 404;
      return { error: "ไม่พบข้อความนี้" };
    }

    return { success: true };
  });
