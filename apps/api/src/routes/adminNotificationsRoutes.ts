import { Elysia } from "elysia";
import { count, desc, eq } from "drizzle-orm";
import type { AdminNotificationListResponse } from "@easyprint/shared";
import { db } from "../db";
import { adminNotifications } from "../../drizzle/schema";
import { verifyAuthToken, AUTH_COOKIE_NAME } from "../auth/jwt";

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

export const adminNotificationsRoutes = new Elysia()
  // ── รายการแจ้งเตือนแอดมิน (ใหม่สุดก่อน จำกัด 50 รายการล่าสุด — หน้า bell dropdown/หน้ารายการไม่จำเป็นต้องเห็นย้อนหลังทั้งหมด) ──────────
  .get("/admin/notifications", async ({ cookie, set }) => {
    const authError = await requireAdmin(cookie, set);
    if (authError) return authError;

    const rows = await db
      .select()
      .from(adminNotifications)
      .orderBy(desc(adminNotifications.createdAt))
      .limit(50);
    const [unreadRow] = await db
      .select({ c: count() })
      .from(adminNotifications)
      .where(eq(adminNotifications.isRead, false));

    const response: AdminNotificationListResponse = {
      notifications: rows.map((r) => ({
        id: r.id,
        type: r.type,
        title: r.title,
        message: r.message,
        link: r.link,
        isRead: r.isRead,
        createdAt: r.createdAt.toISOString(),
      })),
      unreadCount: Number(unreadRow.c),
    };
    return response;
  })

  // ── มาร์คอ่านแล้วรายการเดียว ──────────
  .patch("/admin/notifications/:id/read", async ({ params, cookie, set }) => {
    const authError = await requireAdmin(cookie, set);
    if (authError) return authError;

    const [updated] = await db
      .update(adminNotifications)
      .set({ isRead: true })
      .where(eq(adminNotifications.id, params.id))
      .returning();

    if (!updated) {
      set.status = 404;
      return { error: "ไม่พบการแจ้งเตือนนี้" };
    }
    return { success: true };
  })

  // ── มาร์คอ่านแล้วทั้งหมด ──────────
  .patch("/admin/notifications/read-all", async ({ cookie, set }) => {
    const authError = await requireAdmin(cookie, set);
    if (authError) return authError;

    await db.update(adminNotifications).set({ isRead: true }).where(eq(adminNotifications.isRead, false));
    return { success: true };
  });
