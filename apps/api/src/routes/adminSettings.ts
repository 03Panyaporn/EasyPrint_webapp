import { Elysia } from "elysia";
import { eq } from "drizzle-orm";
import { updateAdminSettingsSchema, type AdminSettingsResponse } from "@easyprint/shared";
import { db } from "../db";
import { systemSettings } from "../../drizzle/schema";
import { requireAdmin } from "./admin";
import { getSystemSettings } from "../systemSettings";

function serializeSettings(row: typeof systemSettings.$inferSelect): AdminSettingsResponse {
  return {
    id: row.id,
    systemName: row.systemName,
    logoUrl: row.logoUrl,
    contactEmail: row.contactEmail,
    contactPhone: row.contactPhone,
    website: row.website,
    notificationSettings: row.notificationSettings as AdminSettingsResponse["notificationSettings"],
    minPasswordLength: row.minPasswordLength,
    requireSpecialChar: row.requireSpecialChar,
    enable2fa: row.enable2fa,
    autoLogoutMinutes: row.autoLogoutMinutes,
    defaultShopStorageQuotaMb: row.defaultShopStorageQuotaMb,
    updatedAt: row.updatedAt.toISOString(),
    createdAt: row.createdAt.toISOString(),
  };
}

export const adminSettingsRoutes = new Elysia({ prefix: "/admin/settings" })
  .get("/", async ({ cookie, set }) => {
    const authError = await requireAdmin(cookie, set);
    if (authError) return authError;

    const settings = await getSystemSettings();
    return { settings: serializeSettings(settings) };
  })

  .patch("/", async ({ body, cookie, set }) => {
    const authError = await requireAdmin(cookie, set);
    if (authError) return authError;

    const parsed = updateAdminSettingsSchema.safeParse(body);
    if (!parsed.success) {
      set.status = 400;
      return { error: "ข้อมูลไม่ถูกต้อง", details: parsed.error.flatten() };
    }

    const current = await getSystemSettings(); // เผื่อยังไม่เคยมีแถวเลย ให้สร้าง default ก่อน แล้วค่อย update ทับ
    const { contactEmail, website, ...rest } = parsed.data;

    const [updated] = await db
      .update(systemSettings)
      .set({
        ...rest,
        ...(contactEmail !== undefined ? { contactEmail: contactEmail || null } : {}),
        ...(website !== undefined ? { website: website || null } : {}),
        updatedAt: new Date(),
      })
      .where(eq(systemSettings.id, current.id))
      .returning();

    return { settings: serializeSettings(updated) };
  });
