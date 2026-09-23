import { Elysia, t } from "elysia";
import { and, count, desc, eq, inArray, lt } from "drizzle-orm";
import {
  rejectShopSchema,
  suspendShopSchema,
  adminUpdateShopSchema,
  createAnnouncementSchema,
  notificationSettingKeyForType,
  DEFAULT_NOTIFICATION_SETTINGS,
  type AdminDashboardResponse,
  type AnnouncementListResponse,
  type NotificationSettings,
} from "@easyprint/shared";
import { db } from "../db";
import { shops, users, announcements, notifications } from "../../drizzle/schema";

const ANNOUNCEMENT_NOTIFICATION_TYPE_ID = 5; // 5 = ประกาศจากแอดมิน (ดู NOTIFICATION_TYPES ฝั่งเว็บ)
import { verifyAuthToken, AUTH_COOKIE_NAME } from "../auth/jwt";
import { objectStorage } from "../storage";
import { createNotification } from "../utils/notification";

// เช็คว่า request มี JWT ที่ login เป็น admin จริง — คืน { error } (ตั้ง set.status ให้แล้ว) ถ้าไม่ผ่าน หรือ null ถ้าผ่าน
// export ไว้ให้ route อื่น (เช่น adminSettings.ts, uploads.ts) เรียกใช้ร่วมด้วย กันเขียนลอจิกตรวจสิทธิ์ซ้ำ
export async function requireAdmin(cookie: Record<string, { value?: unknown } | undefined>, set: { status?: unknown }) {
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
    email: row.shop.email, // อีเมลติดต่อของร้าน (shops.email) — คนละอันกับ ownerEmail ที่ใช้ login
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

type ShopApprovalStatus = (typeof shops.$inferSelect)["approvalStatus"];

// การเปลี่ยนสถานะร้านที่อนุญาต — เดิมเปลี่ยนจากสถานะไหนไปไหนก็ได้ (เช่น ปฏิเสธร้านที่เปิดขายอยู่แล้ว หรือระงับร้านที่ยังไม่เคยอนุมัติ)
//   approve: pending (อนุมัติร้านใหม่) / suspended (คืนสถานะ) / rejected (พิจารณาใหม่)
//   reject:  pending เท่านั้น (ใบสมัครใหม่ไม่ผ่าน) | suspend: approved เท่านั้น (ร้านที่เปิดขายอยู่แล้ว)
const ALLOWED_SHOP_TRANSITIONS: Record<"approve" | "reject" | "suspend", ShopApprovalStatus[]> = {
  approve: ["pending", "suspended", "rejected"],
  reject: ["pending"],
  suspend: ["approved"],
};

const SHOP_STATUS_LABEL: Record<ShopApprovalStatus, string> = {
  pending: "รอตรวจสอบ",
  approved: "อนุมัติแล้ว",
  rejected: "ไม่อนุมัติ",
  suspended: "ระงับการใช้งาน",
};

// คืน { status, error } ถ้าไม่พบร้าน/เปลี่ยนสถานะไม่ได้ หรือ null ถ้าทำได้
async function checkShopTransition(
  shopId: string,
  action: keyof typeof ALLOWED_SHOP_TRANSITIONS
): Promise<{ status: number; error: string } | null> {
  const [row] = await db.select({ approvalStatus: shops.approvalStatus }).from(shops).where(eq(shops.id, shopId));
  if (!row) return { status: 404, error: "ไม่พบร้านค้านี้" };
  if (!ALLOWED_SHOP_TRANSITIONS[action].includes(row.approvalStatus)) {
    return { status: 409, error: `ทำรายการนี้ไม่ได้ เนื่องจากร้านอยู่ในสถานะ "${SHOP_STATUS_LABEL[row.approvalStatus]}"` };
  }
  return null;
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
      const { data } = await objectStorage
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

      // ลบไฟล์ id-card/shop-photo ที่ผูกกับร้านนี้ทิ้งด้วย — กันไฟล์ตกค้างถาวรใน R2 (ยืนยันบั๊กจริงจาก QA: A3-10/BUG-P13-07
      // เดิมลบแค่แถวใน DB แต่ไฟล์ยังอยู่ใน bucket ตลอดไป และหาไม่เจอผ่าน admin storage dashboard เลยเพราะ query
      // ที่นั่น join กับตาราง shops ที่ถูกลบไปแล้ว) — shopPhotoUrl เก็บเป็น public URL เต็ม ต้องตัดเอาแค่ path
      // (ชื่อไฟล์ท้าย URL) ก่อนส่งให้ R2, ส่วน idCardUrl เก็บเป็น path เปล่าอยู่แล้ว (bucket private ไม่มี public URL)
      // ทำแบบ best-effort ไม่ block การลบร้าน (ที่ลบ DB สำเร็จแล้ว) ถ้าลบไฟล์พลาดแค่ log ไว้ให้แอดมินตามไปลบเองทีหลัง
      const filesToDelete: Promise<unknown>[] = [];
      if (shop.idCardUrl) {
        filesToDelete.push(objectStorage.from("id-cards").remove([shop.idCardUrl]));
      }
      if (shop.shopPhotoUrl) {
        const photoPath = shop.shopPhotoUrl.split("/").pop();
        if (photoPath) filesToDelete.push(objectStorage.from("shop-photos").remove([photoPath]));
      }
      Promise.all(filesToDelete).catch((err) =>
        console.error(`ลบไฟล์ id-card/shop-photo ของร้าน ${shop.id} ที่ถูกลบไม่สำเร็จ (orphan ใน R2):`, err)
      );

      return { message: `ลบร้านค้า "${shop.name}" เรียบร้อยแล้ว` };
    } catch (err) {
      if (isForeignKeyViolation(err)) {
        set.status = 409;
        return { error: "ลบร้านค้านี้ไม่ได้ เพราะมีบริการ/ออเดอร์/ข้อมูลอื่นผูกอยู่ — ใช้การระงับ (ปฏิเสธ) แทนการลบ" };
      }
      throw err;
    }
  })

  // อนุมัติร้าน — ใช้ทั้ง 2 กรณี: ร้านสมัครใหม่ (pending → approved) และ "คืนสถานะ" ร้านที่เคยถูกระงับ (suspended → approved)
  // ทั้งสองกรณี update DB เหมือนกันเป๊ะ (ตั้ง approved + ล้างเหตุผลเดิม) เลยไม่แยก endpoint /reinstate ต่างหาก
  // แต่ข้อความแจ้งเตือนต้องต่างกัน — ยืนยันบั๊กจริงจาก QA Phase 13 (AS13-03, เดิม A3-07): reinstate หลังถูกระงับเคยได้ข้อความ
  // "ยินดีด้วย! ผ่านการตรวจสอบ..." เหมือนอนุมัติร้านสมัครใหม่เป๊ะ ทั้งที่บริบทต่างกันมาก (ร้านเคยเปิดขายอยู่แล้วแค่โดนระงับชั่วคราว
  // ไม่ใช่เพิ่งผ่านการตรวจสอบครั้งแรก) ต้องอ่านสถานะ "ก่อน" อัปเดตมาเช็คก่อนถึงจะรู้ว่าเป็นกรณีไหน
  .patch("/shops/:id/approve", async ({ params, cookie, set }) => {
    const authError = await requireAdmin(cookie, set);
    if (authError) return authError;

    const transitionError = await checkShopTransition(params.id, "approve");
    if (transitionError) {
      set.status = transitionError.status;
      return { error: transitionError.error };
    }

    const [before] = await db.select({ approvalStatus: shops.approvalStatus }).from(shops).where(eq(shops.id, params.id));
    const isReinstate = before?.approvalStatus === "suspended";

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
      title: isReinstate ? "การระงับการใช้งานร้านค้าของคุณถูกยกเลิกแล้ว" : "ร้านค้าของคุณได้รับการอนุมัติแล้ว",
      message: isReinstate
        ? "ร้านค้าของคุณกลับมาเปิดให้บริการได้ตามปกติแล้ว ขอบคุณที่ให้ความร่วมมือ"
        : "ยินดีด้วย! บัญชีร้านค้าของคุณผ่านการตรวจสอบและพร้อมเปิดให้บริการแล้ว",
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

    const transitionError = await checkShopTransition(params.id, "reject");
    if (transitionError) {
      set.status = transitionError.status;
      return { error: transitionError.error };
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

  // ระงับร้านที่เคยอนุมัติแล้ว — ต่างจาก reject ตรงที่ reject ใช้กับร้านสมัครใหม่ที่ยังไม่เคยอนุมัติ ส่วน suspend ใช้กับร้านที่เปิดขายอยู่จริงแล้วโดนระงับทีหลัง
  // requireShopOwner()/canViewShopPublicly() ใน services.ts เช็คแบบ `!== "approved"`/`=== "approved"` อยู่แล้ว เลยกันร้าน suspended ออกจากทั้งฝั่งเจ้าของร้านจัดการเองและฝั่งลูกค้าเห็นสาธารณะได้ทันทีโดยไม่ต้องแก้โค้ดจุดนั้นเพิ่ม
  .patch("/shops/:id/suspend", async ({ params, body, cookie, set }) => {
    const authError = await requireAdmin(cookie, set);
    if (authError) return authError;

    const parsed = suspendShopSchema.safeParse(body);
    if (!parsed.success) {
      set.status = 400;
      return { error: "ข้อมูลไม่ถูกต้อง", details: parsed.error.flatten() };
    }

    const transitionError = await checkShopTransition(params.id, "suspend");
    if (transitionError) {
      set.status = transitionError.status;
      return { error: transitionError.error };
    }

    const [shop] = await db
      .update(shops)
      .set({ approvalStatus: "suspended", rejectedReason: parsed.data.reason })
      .where(eq(shops.id, params.id))
      .returning();

    if (!shop) {
      set.status = 404;
      return { error: "ไม่พบร้านค้านี้" };
    }

    await createNotification({
      userId: shop.ownerId,
      typeId: 6,
      category: "general", // 6 = บัญชีถูกระงับ/เตือน (ใช้ typeId เดียวกับ reject ด้านบน เพราะเป็นเหตุการณ์ประเภทเดียวกัน)
      title: "บัญชีร้านค้าถูกปฏิเสธ/ระงับการใช้งาน",
      message: `เหตุผล: ${parsed.data.reason}`,
    });

    return { shop };
  })

  // ── ประวัติประกาศจากระบบ (ล่าสุด 20 รายการ) — แสดงในการ์ด "ประกาศจากระบบ" หน้าแดชบอร์ดแอดมิน ──────────
  .get("/announcements", async ({ cookie, set }) => {
    const authError = await requireAdmin(cookie, set);
    if (authError) return authError;

    const rows = await db.select().from(announcements).orderBy(desc(announcements.createdAt)).limit(20);
    const response: AnnouncementListResponse = {
      announcements: rows.map((r) => ({
        id: r.id,
        category: r.category,
        target: r.target,
        title: r.title,
        message: r.message,
        recipientCount: r.recipientCount,
        createdAt: r.createdAt.toISOString(),
      })),
    };
    return response;
  })

  // ── ส่งประกาศระบบ: บันทึกประวัติ + ส่งแจ้งเตือนในแอป (typeId 5 = ประกาศจากแอดมิน) ถึงกลุ่มเป้าหมาย ──────────
  // เดิมหน้าเว็บไม่เคยเรียก endpoint นี้ (ฟอร์มในแดชบอร์ดเพิ่มแค่ใน state) และ endpoint ใช้ typeId 4 (= "แอดมินอนุมัติ")
  // รวมถึงส่งหาแอดมินด้วยเมื่อ target = all — แก้เป็น Zod จาก shared, ไม่รวมแอดมิน, insert แจ้งเตือนเป็นชุดแทนทีละแถว
  .post("/announcements", async ({ body, cookie, set }) => {
    const authError = await requireAdmin(cookie, set);
    if (authError) return authError;

    const parsed = createAnnouncementSchema.safeParse(body);
    if (!parsed.success) {
      set.status = 400;
      return { error: parsed.error.errors[0]?.message ?? "ข้อมูลไม่ถูกต้อง", details: parsed.error.flatten() };
    }
    const { category, target, title, message } = parsed.data;

    const roles: ("shop_owner" | "customer")[] =
      target === "shops" ? ["shop_owner"] : target === "customers" ? ["customer"] : ["shop_owner", "customer"];
    const recipients = await db
      .select({ id: users.id, role: users.role, notificationSettings: shops.notificationSettings })
      .from(users)
      .leftJoin(shops, eq(shops.ownerId, users.id))
      .where(inArray(users.role, roles));

    // เคารพสวิตช์ "อัปเดตจากผู้ดูแลระบบ" ของร้าน — กติกาเดียวกับ createNotification() (utils/notification.ts)
    const settingKey = notificationSettingKeyForType(ANNOUNCEMENT_NOTIFICATION_TYPE_ID);
    const allowed = recipients.filter((r) => {
      if (r.role !== "shop_owner" || !r.notificationSettings || !settingKey) return true;
      const settings = { ...DEFAULT_NOTIFICATION_SETTINGS, ...(r.notificationSettings as Partial<NotificationSettings>) };
      return settings[settingKey] !== false;
    });

    const adminToken = cookie[AUTH_COOKIE_NAME]?.value as string | undefined;
    const payload = adminToken ? verifyAuthToken(adminToken) : null;
    const [announcement] = await db.transaction(async (tx) => {
      const created = await tx
        .insert(announcements)
        .values({ category, target, title, message, recipientCount: allowed.length, createdBy: payload?.userId ?? null })
        .returning();
      for (let i = 0; i < allowed.length; i += 500) {
        await tx.insert(notifications).values(
          allowed.slice(i, i + 500).map((r) => ({
            userId: r.id,
            typeId: ANNOUNCEMENT_NOTIFICATION_TYPE_ID,
            category: "general",
            title,
            message,
          }))
        );
      }
      return created;
    });

    return {
      announcement: {
        id: announcement.id,
        category: announcement.category,
        target: announcement.target,
        title: announcement.title,
        message: announcement.message,
        recipientCount: announcement.recipientCount,
        createdAt: announcement.createdAt.toISOString(),
      },
    };
  });
