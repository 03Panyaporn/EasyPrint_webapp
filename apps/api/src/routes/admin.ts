import { Elysia } from "elysia";
import { and, count, desc, eq, lt } from "drizzle-orm";
import { rejectShopSchema, adminUpdateShopSchema, type AdminDashboardResponse } from "@easyprint/shared";
import { db } from "../db";
import { shops, users } from "../../drizzle/schema";
import { verifyAuthToken, AUTH_COOKIE_NAME } from "../auth/jwt";
import { supabaseAdmin } from "../storage";

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

// Postgres foreign_key_violation — ร้านที่มีบริการ/ออเดอร์/ตะกร้าผูกอยู่ ลบไม่ได้ตรงๆ (ไม่มี onDelete cascade ตั้งใจไว้ กันข้อมูลออเดอร์/ประวัติการขายหายแบบเงียบๆ)
// drizzle-orm ห่อ error ของ postgres-js ไว้ใน DrizzleQueryError อีกชั้น (code จริงอยู่ที่ err.cause.code ไม่ใช่ err.code ตรงๆ) — เช็คทั้งสองชั้นกันพลาด
const POSTGRES_FOREIGN_KEY_VIOLATION = "23503";
function isForeignKeyViolation(err: unknown): boolean {
  if (typeof err !== "object" || err === null) return false;
  const e = err as { code?: string; cause?: { code?: string } };
  return e.code === POSTGRES_FOREIGN_KEY_VIOLATION || e.cause?.code === POSTGRES_FOREIGN_KEY_VIOLATION;
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
  // สรุปภาพรวมหน้าหลักแอดมิน — ตัวเลข "เปลี่ยนแปลง" เทียบกับ 7 วันที่แล้ว คำนวณได้แม่นยำเฉพาะยอดที่อิง createdAt (ร้านค้าทั้งหมด/ผู้ใช้ทั้งหมด)
  // ส่วน "อนุมัติแล้ว"/"รอตรวจสอบ" ไม่มีค่าเปลี่ยนแปลงให้ เพราะ approvalStatus แก้ไขได้ตลอดเวลา ไม่มี audit log ย้อนหลังให้รู้ว่าเมื่อ 7 วันก่อนมีกี่ร้านในสถานะนั้น
  .get("/dashboard", async ({ cookie, set }) => {
    const authError = await requireAdmin(cookie, set);
    if (authError) return authError;

    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const [totalShopsRow] = await db.select({ c: count() }).from(shops);
    const [approvedShopsRow] = await db.select({ c: count() }).from(shops).where(eq(shops.approvalStatus, "approved"));
    const [pendingShopsRow] = await db.select({ c: count() }).from(shops).where(eq(shops.approvalStatus, "pending"));
    const [totalShopsPrevRow] = await db.select({ c: count() }).from(shops).where(lt(shops.createdAt, sevenDaysAgo));

    // ผู้ใช้งาน = ลูกค้าเท่านั้น — เจ้าของร้านถูกนับแยกในการ์ด "ร้านค้าทั้งหมด" อยู่แล้ว นับซ้ำที่นี่จะทำให้ตัวเลขสับสน
    const [totalUsersRow] = await db.select({ c: count() }).from(users).where(eq(users.role, "customer"));
    const [totalUsersPrevRow] = await db
      .select({ c: count() })
      .from(users)
      .where(and(eq(users.role, "customer"), lt(users.createdAt, sevenDaysAgo)));

    const pendingRows = await db
      .select({ shop: shops, owner: users })
      .from(shops)
      .leftJoin(users, eq(shops.ownerId, users.id))
      .where(eq(shops.approvalStatus, "pending"))
      .orderBy(desc(shops.createdAt))
      .limit(5);

    const response: AdminDashboardResponse = {
      shops: {
        total: Number(totalShopsRow.c),
        totalChange: Number(totalShopsRow.c) - Number(totalShopsPrevRow.c),
        approved: Number(approvedShopsRow.c),
        pending: Number(pendingShopsRow.c),
      },
      users: {
        total: Number(totalUsersRow.c),
        totalChange: Number(totalUsersRow.c) - Number(totalUsersPrevRow.c),
      },
      pendingShops: pendingRows.map((r) => ({
        id: r.shop.id,
        name: r.shop.name,
        ownerEmail: r.owner?.email ?? null,
        createdAt: r.shop.createdAt.toISOString(),
        hasIdCard: !!r.shop.idCardUrl,
      })),
    };

    return response;
  })

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

  .patch("/shops/:id", async ({ params, body, cookie, set }) => {
    const authError = await requireAdmin(cookie, set);
    if (authError) return authError;

    const parsed = adminUpdateShopSchema.safeParse(body);
    if (!parsed.success) {
      set.status = 400;
      return { error: "ข้อมูลไม่ถูกต้อง", details: parsed.error.flatten() };
    }

    const { email, ...rest } = parsed.data;
    const [shop] = await db
      .update(shops)
      .set({ ...rest, ...(email !== undefined ? { email: email || null } : {}) })
      .where(eq(shops.id, params.id))
      .returning();

    if (!shop) {
      set.status = 404;
      return { error: "ไม่พบร้านค้านี้" };
    }
    return { shop };
  })

  .delete("/shops/:id", async ({ params, cookie, set }) => {
    const authError = await requireAdmin(cookie, set);
    if (authError) return authError;

    try {
      const [shop] = await db.delete(shops).where(eq(shops.id, params.id)).returning();
      if (!shop) {
        set.status = 404;
        return { error: "ไม่พบร้านค้านี้" };
      }
      return { message: `ลบร้านค้า "${shop.name}" เรียบร้อยแล้ว` };
    } catch (err) {
      if (isForeignKeyViolation(err)) {
        set.status = 409;
        return { error: "ลบร้านค้านี้ไม่ได้ เพราะมีบริการ/ออเดอร์/ข้อมูลอื่นผูกอยู่ — ใช้การระงับ (ปฏิเสธ) แทนการลบ" };
      }
      throw err;
    }
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
    return { shop };
  });
