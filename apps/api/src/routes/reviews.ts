import { Elysia } from "elysia";
import { and, desc, eq } from "drizzle-orm";
import { createReviewSchema, replyReviewSchema, type ReviewResponse, type ShopReviewsResponse, type AdminReviewResponse } from "@easyprint/shared";
import { db } from "../db";
import { reviews, orders, users, shops } from "../../drizzle/schema";
import { verifyAuthToken, AUTH_COOKIE_NAME } from "../auth/jwt";
import { requireShopOwner } from "./services";
import { requireAdmin } from "./admin";

// ตัดนามสกุลเหลือแค่อักษรย่อ กันข้อมูลลูกค้าหลุดออกไปแบบเต็มๆ บนหน้ารีวิวสาธารณะ (เช่น "สมชาย จ.")
function maskName(firstname: string, lastname: string): string {
  const lastInitial = lastname ? `${lastname[0]}.` : "";
  return `${firstname} ${lastInitial}`.trim();
}

function serializeReview(row: {
  review: typeof reviews.$inferSelect;
  orderCode: string;
  firstname: string;
  lastname: string;
}): ReviewResponse {
  return {
    id: row.review.id,
    shopId: row.review.shopId,
    orderId: row.review.orderId,
    orderCode: row.orderCode,
    rating: row.review.rating,
    comment: row.review.comment,
    shopReply: row.review.shopReply,
    shopRepliedAt: row.review.shopRepliedAt ? row.review.shopRepliedAt.toISOString() : null,
    createdAt: row.review.createdAt.toISOString(),
    customerId: row.review.customerId,
    customerName: maskName(row.firstname, row.lastname),
  };
}

export const reviewsRoutes = new Elysia()
  // ลูกค้ารีวิวออเดอร์ของตัวเอง — ต้อง completed แล้วเท่านั้น และรีวิวได้ครั้งเดียวต่อออเดอร์ (unique reviews.order_id กันซ้ำอีกชั้นที่ DB)
  // ⚠️ ใช้ชื่อ param ":id" (ไม่ใช่ ":orderId") เพราะ apps/api/src/routes/orders.ts ประกาศ "/orders/:id" ไว้ก่อนแล้ว — Elysia/memoirist บังคับให้ทุก route ที่ path prefix ตรงกันใช้ชื่อ param เดียวกัน
  .post("/orders/:id/review", async ({ params, body, cookie, set }) => {
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

    const parsed = createReviewSchema.safeParse(body);
    if (!parsed.success) {
      set.status = 400;
      return { error: "ข้อมูลไม่ถูกต้อง", details: parsed.error.flatten() };
    }

    const [order] = await db.select().from(orders).where(eq(orders.id, params.id));
    if (!order) {
      set.status = 404;
      return { error: "ไม่พบออเดอร์นี้" };
    }
    if (order.customerId !== payload.userId) {
      set.status = 403;
      return { error: "คุณไม่มีสิทธิ์รีวิวออเดอร์นี้" };
    }
    if (order.status !== "completed") {
      set.status = 400;
      return { error: "รีวิวได้เฉพาะออเดอร์ที่เสร็จสิ้นแล้วเท่านั้น" };
    }

    const [existing] = await db.select({ id: reviews.id }).from(reviews).where(eq(reviews.orderId, params.id));
    if (existing) {
      set.status = 409;
      return { error: "ออเดอร์นี้ถูกรีวิวไปแล้ว รีวิวได้ครั้งเดียวต่อออเดอร์" };
    }

    const [customer] = await db
      .select({ firstname: users.firstname, lastname: users.lastname })
      .from(users)
      .where(eq(users.id, payload.userId));

    const [created] = await db
      .insert(reviews)
      .values({
        shopId: order.shopId,
        orderId: order.id,
        customerId: payload.userId,
        rating: parsed.data.rating,
        comment: parsed.data.comment || null,
      })
      .returning();

    return {
      review: serializeReview({
        review: created,
        orderCode: order.code,
        firstname: customer.firstname,
        lastname: customer.lastname,
      }),
    };
  })

  // ดูรีวิวของออเดอร์ตัวเอง (ใช้เช็คว่าเคยรีวิวไปหรือยัง ก่อนแสดงฟอร์มเขียนรีวิว) — คืน null ถ้ายังไม่เคยรีวิว
  .get("/orders/:id/review", async ({ params, cookie, set }) => {
    const token = cookie[AUTH_COOKIE_NAME]?.value as string | undefined;
    const payload = token ? verifyAuthToken(token) : null;
    if (!payload) {
      set.status = 401;
      return { error: "ยังไม่ได้เข้าสู่ระบบ" };
    }

    const [row] = await db
      .select({ review: reviews, orderCode: orders.code, firstname: users.firstname, lastname: users.lastname })
      .from(reviews)
      .innerJoin(orders, eq(reviews.orderId, orders.id))
      .innerJoin(users, eq(reviews.customerId, users.id))
      .where(eq(reviews.orderId, params.id));

    if (!row) return { review: null };
    if (row.review.customerId !== payload.userId && payload.role !== "admin") {
      set.status = 403;
      return { error: "ไม่มีสิทธิ์ดูรีวิวนี้" };
    }
    return { review: serializeReview(row) };
  })

  // list รีวิวทั้งหมดของร้าน — สาธารณะ ไม่ต้อง login (หน้ารายละเอียดร้านฝั่งลูกค้าใช้แสดงผล)
  .get("/shops/:shopId/reviews", async ({ params }) => {
    const rows = await db
      .select({ review: reviews, orderCode: orders.code, firstname: users.firstname, lastname: users.lastname })
      .from(reviews)
      .innerJoin(orders, eq(reviews.orderId, orders.id))
      .innerJoin(users, eq(reviews.customerId, users.id))
      .where(eq(reviews.shopId, params.shopId))
      .orderBy(desc(reviews.createdAt));

    const distribution: Record<1 | 2 | 3 | 4 | 5, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    for (const r of rows) {
      const rating = r.review.rating as 1 | 2 | 3 | 4 | 5;
      if (rating >= 1 && rating <= 5) distribution[rating] += 1;
    }
    const avgRating = rows.length > 0 ? rows.reduce((sum, r) => sum + r.review.rating, 0) / rows.length : null;

    const response: ShopReviewsResponse = {
      reviews: rows.map(serializeReview),
      summary: { avgRating, reviewCount: rows.length, distribution },
    };
    return response;
  })

  // list รีวิวทั้งหมดของทุกร้านในระบบ — สำหรับหน้า moderation ของแอดมิน (ลบรีวิวไม่เหมาะสมได้)
  .get("/admin/reviews", async ({ cookie, set }) => {
    const authError = await requireAdmin(cookie, set);
    if (authError) return authError;

    const rows = await db
      .select({ review: reviews, orderCode: orders.code, firstname: users.firstname, lastname: users.lastname, shopName: shops.name })
      .from(reviews)
      .innerJoin(orders, eq(reviews.orderId, orders.id))
      .innerJoin(users, eq(reviews.customerId, users.id))
      .innerJoin(shops, eq(reviews.shopId, shops.id))
      .orderBy(desc(reviews.createdAt));

    const result: AdminReviewResponse[] = rows.map((row) => ({
      ...serializeReview(row),
      shopName: row.shopName,
    }));

    return { reviews: result };
  })

  // ร้านตอบกลับรีวิวของร้านตัวเอง — ใส่ซ้ำได้ (แก้ทับคำตอบเดิม)
  .patch("/shops/:shopId/reviews/:id/reply", async ({ params, body, cookie, set }) => {
    const authError = await requireShopOwner(cookie, params.shopId, set);
    if (authError) return authError;

    const parsed = replyReviewSchema.safeParse(body);
    if (!parsed.success) {
      set.status = 400;
      return { error: "ข้อมูลไม่ถูกต้อง", details: parsed.error.flatten() };
    }

    const [row] = await db
      .update(reviews)
      .set({ shopReply: parsed.data.reply, shopRepliedAt: new Date() })
      .where(and(eq(reviews.id, params.id), eq(reviews.shopId, params.shopId)))
      .returning();

    if (!row) {
      set.status = 404;
      return { error: "ไม่พบรีวิวนี้" };
    }

    const [orderRow] = await db.select({ code: orders.code }).from(orders).where(eq(orders.id, row.orderId));
    const [customerRow] = await db
      .select({ firstname: users.firstname, lastname: users.lastname })
      .from(users)
      .where(eq(users.id, row.customerId));

    return {
      review: serializeReview({
        review: row,
        orderCode: orderRow?.code ?? "-",
        firstname: customerRow?.firstname ?? "-",
        lastname: customerRow?.lastname ?? "",
      }),
    };
  })

  // ลบรีวิว — เจ้าของรีวิวเองหรือแอดมินเท่านั้น
  .delete("/reviews/:id", async ({ params, cookie, set }) => {
    const token = cookie[AUTH_COOKIE_NAME]?.value as string | undefined;
    const payload = token ? verifyAuthToken(token) : null;
    if (!payload) {
      set.status = 401;
      return { error: "ยังไม่ได้เข้าสู่ระบบ" };
    }

    const [review] = await db.select({ customerId: reviews.customerId }).from(reviews).where(eq(reviews.id, params.id));
    if (!review) {
      set.status = 404;
      return { error: "ไม่พบรีวิวนี้" };
    }

    const isOwner = payload.role === "customer" && review.customerId === payload.userId;
    const isAdmin = payload.role === "admin";
    if (!isOwner && !isAdmin) {
      set.status = 403;
      return { error: "ไม่มีสิทธิ์ลบรีวิวนี้" };
    }

    await db.delete(reviews).where(eq(reviews.id, params.id));
    return { message: "ลบรีวิวเรียบร้อยแล้ว" };
  });
