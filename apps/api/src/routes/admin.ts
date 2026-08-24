import { Elysia, t } from "elysia";
import { desc, eq } from "drizzle-orm";
import { rejectShopSchema } from "@easyprint/shared";
import { db } from "../db";
import { shops, users } from "../../drizzle/schema";
import { verifyAuthToken, AUTH_COOKIE_NAME } from "../auth/jwt";
import { supabaseAdmin } from "../storage";
import { createNotification } from "../utils/notification";

// เช็คว่า request มี JWT ที่ login เป็น admin จริง — คืน { error } (ตั้ง set.status ให้แล้ว) ถ้าไม่ผ่าน หรือ null ถ้าผ่าน
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

function serializeShopListItem(row: {
  shop: typeof shops.$inferSelect;
  owner: typeof users.$inferSelect | null;
}) {
  return {
    id: row.shop.id,
    name: row.shop.name,
    phone: row.shop.phone,
    address: row.shop.address,
    serviceTypes: row.shop.serviceTypes,
    deliveryMethods: row.shop.deliveryMethods,
    googleMapLink: row.shop.googleMapLink,
    shopPhotoUrl: row.shop.shopPhotoUrl,
    socialMedia: row.shop.socialMedia,
    openingHours: row.shop.openingHours,
    approvalStatus: row.shop.approvalStatus,
    rejectedReason: row.shop.rejectedReason,
    createdAt: row.shop.createdAt,
    ownerEmail: row.owner?.email ?? null,
    ownerFirstname: row.owner?.firstname ?? null,
    ownerLastname: row.owner?.lastname ?? null,
  };
}

export const adminRoutes = new Elysia({ prefix: "/admin" })
  .get("/shops", async ({ cookie, set }) => {
    const authError = await requireAdmin(cookie, set);
    if (authError) return authError;

    const rows = await db
      .select({ shop: shops, owner: users })
      .from(shops)
      .leftJoin(users, eq(shops.ownerId, users.id))
      .orderBy(desc(shops.createdAt));

    return { shops: rows.map(serializeShopListItem) };
  })

  .get("/shops/:id", async ({ params, cookie, set }) => {
    const authError = await requireAdmin(cookie, set);
    if (authError) return authError;

    const [row] = await db
      .select({ shop: shops, owner: users })
      .from(shops)
      .leftJoin(users, eq(shops.ownerId, users.id))
      .where(eq(shops.id, params.id));

    if (!row) {
      set.status = 404;
      return { error: "ไม่พบร้านค้านี้" };
    }

    // id-cards เป็น private bucket ไม่มี public URL ตรงๆ ต้องออก signed URL ให้แอดมินดูชั่วคราว (10 นาที)
    let idCardSignedUrl: string | null = null;
    if (row.shop.idCardUrl) {
      const { data } = await supabaseAdmin.storage
        .from("id-cards")
        .createSignedUrl(row.shop.idCardUrl, 600);
      idCardSignedUrl = data?.signedUrl ?? null;
    }

    return { shop: { ...serializeShopListItem(row), idCardSignedUrl } };
  })

  .patch("/shops/:id/approve", async ({ params, cookie, set }) => {
    const authError = await requireAdmin(cookie, set);
    if (authError) return authError;

    const [shop] = await db
      .update(shops)
      .set({ approvalStatus: "approved", rejectedReason: null })
      .where(eq(shops.id, params.id))
      .returning();

    if (!shop) {
      set.status = 404;
      return { error: "ไม่พบร้านค้านี้" };
    }

    await createNotification({
      userId: shop.ownerId,
      typeId: 4,
      category: "general", // 4 = แอดมินอนุมัติเรื่อง
      title: "ร้านค้าของคุณได้รับการอนุมัติแล้ว",
      message: "ยินดีด้วย! บัญชีร้านค้าของคุณผ่านการตรวจสอบและพร้อมเปิดให้บริการแล้ว",
    });

    return { shop };
  })

  .patch("/shops/:id/reject", async ({ params, body, cookie, set }) => {
    const authError = await requireAdmin(cookie, set);
    if (authError) return authError;

    const parsed = rejectShopSchema.safeParse(body);
    if (!parsed.success) {
      set.status = 400;
      return { error: "ข้อมูลไม่ถูกต้อง", details: parsed.error.flatten() };
    }

    const [shop] = await db
      .update(shops)
      .set({ approvalStatus: "rejected", rejectedReason: parsed.data.reason })
      .where(eq(shops.id, params.id))
      .returning();

    if (!shop) {
      set.status = 404;
      return { error: "ไม่พบร้านค้านี้" };
    }

    await createNotification({
      userId: shop.ownerId,
      typeId: 6,
      category: "general", // 6 = บัญชีถูกระงับ/เตือน
      title: "บัญชีร้านค้าถูกปฏิเสธ/ระงับการใช้งาน",
      message: `เหตุผล: ${parsed.data.reason}`,
    });

    return { shop };
  })

  // ── ส่งประกาศระบบถึงผู้ใช้งานทั้งหมด (หรือทุกร้านค้า) ──────────
  .post("/announcements", async ({ body, cookie, set }) => {
    const authError = await requireAdmin(cookie, set);
    if (authError) return authError;

    const { title, message, target } = body;

    // หาผู้ใช้ตามเป้าหมาย (ทั้งหมด, เลือกร้านค้า, เลือกลูกค้า)
    let targetUsers: { id: string }[] = [];
    if (target === "all") {
      targetUsers = await db.select({ id: users.id }).from(users);
    } else if (target === "shops") {
      targetUsers = await db.select({ id: users.id }).from(users).where(eq(users.role, "shop_owner"));
    } else if (target === "customers") {
      targetUsers = await db.select({ id: users.id }).from(users).where(eq(users.role, "customer"));
    }

    let successCount = 0;
    for (const u of targetUsers) {
      await createNotification({
        userId: u.id,
        typeId: 4,
      category: "general", // ใช้ typeId = 4 (คำร้องถูกอนุมัติ/ประกาศจากแอดมิน - ชั่วคราวไปก่อน หรือ type ใหม่)
        title,
        message,
      });
      successCount++;
    }

    return { ok: true, sent: successCount };
  }, {
    body: t.Object({
      title: t.String({ minLength: 1 }),
      message: t.String({ minLength: 1 }),
      target: t.Union([t.Literal("all"), t.Literal("shops"), t.Literal("customers")]),
    })
  });
