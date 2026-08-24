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
import { createNotification } from "../utils/notification";
import { supabaseAdmin } from "../storage";

async function signStoragePaths(paths: string[] | null | undefined): Promise<string[]> {
  if (!paths || paths.length === 0) return [];
  const urls = await Promise.all(
    paths.map(async (path) => {
      // If it's already a full URL (e.g. public bucket or old format), return as is
      if (path.startsWith("http")) return path;
      const { data } = await supabaseAdmin.storage.from("contact-admin-attachments").createSignedUrl(path, 3600);
      return data?.signedUrl ?? path;
    })
  );
  return urls;
}

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

async function serializeAsync(row: typeof contactAdminMessages.$inferSelect, shopName?: string, shopEmail?: string): Promise<ContactAdminMessageItem> {
  const [attachments, adminReplyAttachments] = await Promise.all([
    signStoragePaths(row.attachments),
    signStoragePaths(row.adminReplyAttachments),
  ]);

  return {
    id: row.id,
    shopId: row.shopId,
    shopName,
    shopEmail,
    subject: row.subject,
    message: row.message,
    attachments,
    status: row.status,
    adminReply: row.adminReply,
    adminReplyAttachments,
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
      .values({ 
        shopId: params.shopId, 
        subject: parsed.data.subject, 
        message: parsed.data.message,
        attachments: parsed.data.attachments ?? []
      })
      .returning();

    createAdminNotification({
      type: "contact_admin_message",
      title: "ข้อความใหม่จากร้านค้า",
      message: `${shop?.name ?? "ร้านค้า"}: ${parsed.data.subject}`,
      link: `/admin/contact-messages`,
    }).catch((err) => console.error("สร้างการแจ้งเตือนข้อความ contact-admin ไม่สำเร็จ:", err));

    return { message: await serializeAsync(created, shop?.name) };
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

    return { messages: await Promise.all(rows.map((r) => serializeAsync(r))) };
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

    return { messages: await Promise.all(rows.map((r) => serializeAsync(r.message, r.shopName ?? undefined, r.shopEmail ?? undefined))) };
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
      .set({ 
        adminReply: parsed.data.adminReply, 
        adminReplyAttachments: parsed.data.adminReplyAttachments ?? [],
        status: "resolved" 
      })
      .where(eq(contactAdminMessages.id, params.id))
      .returning();

    if (!updated) {
      set.status = 404;
      return { error: "ไม่พบข้อความนี้" };
    }

    const [shop] = await db.select({ name: shops.name, ownerId: shops.ownerId }).from(shops).where(eq(shops.id, updated.shopId));

    if (shop?.ownerId) {
      createNotification({
        userId: shop.ownerId,
        typeId: 4, // 4 = ประกาศแอดมิน / การติดต่อกลับ
        title: "แอดมินตอบกลับข้อความของคุณแล้ว",
        message: `แอดมินได้ตอบกลับคำร้องเรื่อง "${updated.subject}" ของคุณ กรุณาตรวจสอบ`,
        category: "general",
        link: "/shop/contact-admin"
      }).catch(err => console.error("Error creating notification for admin reply:", err));
    }

    return { message: await serializeAsync(updated, shop?.name) };
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
