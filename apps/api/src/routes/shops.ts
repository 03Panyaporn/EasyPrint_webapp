import { Elysia } from "elysia";
import { desc, eq } from "drizzle-orm";
import { db } from "../db";
import { shops } from "../../drizzle/schema";
import { verifyAuthToken, AUTH_COOKIE_NAME } from "../auth/jwt";

export const shopsRoutes = new Elysia()
  // endpoint สาธารณะ ไม่ต้อง login — ฝั่งลูกค้าใช้ดึงรายชื่อร้านค้าหน้าแรก
  // คืนเฉพาะร้านที่ approvalStatus === "approved" เท่านั้น ร้านที่ยัง pending/rejected ต้องไม่หลุดออกมา
  .get("/shops", async () => {
    const rows = await db
      .select({
        id: shops.id,
        name: shops.name,
        address: shops.address,
        serviceTypes: shops.serviceTypes,
        deliveryMethods: shops.deliveryMethods,
        openingHours: shops.openingHours,
        shopPhotoUrl: shops.shopPhotoUrl,
      })
      .from(shops)
      .where(eq(shops.approvalStatus, "approved"))
      .orderBy(desc(shops.createdAt));

    return { shops: rows };
  })

  // ให้เจ้าของร้าน login อยู่ดึงข้อมูลร้านของตัวเอง (รู้ shopId ตัวเอง + เช็คสถานะอนุมัติ) ใช้ตอนเปิดหน้า /shop/services เป็นต้น
  .get("/shops/me", async ({ cookie, set }) => {
    const token = cookie[AUTH_COOKIE_NAME]?.value as string | undefined;
    const payload = token ? verifyAuthToken(token) : null;
    if (!payload) {
      set.status = 401;
      return { error: "ยังไม่ได้เข้าสู่ระบบ" };
    }
    if (payload.role !== "shop_owner") {
      set.status = 403;
      return { error: "ต้องเป็นบัญชีร้านค้าเท่านั้น" };
    }

    const [shop] = await db
      .select({
        id: shops.id,
        name: shops.name,
        approvalStatus: shops.approvalStatus,
        rejectedReason: shops.rejectedReason,
        deliveryEnabled: shops.deliveryEnabled,
      })
      .from(shops)
      .where(eq(shops.ownerId, payload.userId));

    if (!shop) {
      set.status = 404;
      return { error: "ไม่พบร้านค้าของบัญชีนี้" };
    }

    return { shop };
  })

  // endpoint สาธารณะ ไม่ต้อง login — หน้ารายละเอียดร้านฝั่งลูกค้าใช้ดึงข้อมูลร้านเดี่ยว
  // คืนเฉพาะร้านที่ approvalStatus === "approved" เท่านั้น เหมือน GET /shops (list) — ร้าน pending/rejected เข้าตรงๆ ด้วย id ก็ต้องไม่เห็น
  // ใช้ชื่อ param ":shopId" (ไม่ใช่ ":id") เพราะ Elysia/memoirist บังคับให้ทุก route ที่ path prefix ตรงกันต้องใช้ชื่อ param เดียวกัน
  // ("/shops/:shopId/services" ในไฟล์อื่นประกาศไว้ก่อนแล้ว ถ้าใช้ชื่อไม่ตรงกันจะ error ตอน compile route ทันที)
  .get("/shops/:shopId", async ({ params, set }) => {
    const [row] = await db
      .select({
        id: shops.id,
        name: shops.name,
        phone: shops.phone,
        address: shops.address,
        serviceTypes: shops.serviceTypes,
        deliveryMethods: shops.deliveryMethods,
        googleMapLink: shops.googleMapLink,
        socialMedia: shops.socialMedia,
        openingHours: shops.openingHours,
        shopPhotoUrl: shops.shopPhotoUrl,
        approvalStatus: shops.approvalStatus,
      })
      .from(shops)
      .where(eq(shops.id, params.shopId));

    if (!row || row.approvalStatus !== "approved") {
      set.status = 404;
      return { error: "ไม่พบร้านค้านี้" };
    }

    const { approvalStatus: _approvalStatus, ...shop } = row;
    return { shop };
  });
