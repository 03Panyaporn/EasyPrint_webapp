import { Elysia } from "elysia";
import { and, desc, eq } from "drizzle-orm";
import type { FavoriteShopListResponse } from "@easyprint/shared";
import { db } from "../db";
import { favoriteShops, shops } from "../../drizzle/schema";
import { verifyAuthToken, AUTH_COOKIE_NAME } from "../auth/jwt";
import { isValidUUID } from "../utils/validation";

// ร้านโปรดของลูกค้า — เดิมปุ่มหัวใจในหน้าร้านเปลี่ยนแค่ state ในหน้าเว็บแล้วขึ้น toast "บันทึกแล้ว" ทั้งที่ไม่ได้บันทึกที่ไหนเลย
// เฉพาะบัญชีลูกค้าเท่านั้น (ร้านค้า/แอดมินไม่มีตะกร้า/ไม่ได้สั่งซื้อ จึงไม่มีร้านโปรด)
function requireCustomer(
  cookie: Record<string, { value?: unknown } | undefined>,
  set: { status?: unknown }
): { userId: string } | { error: string } {
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
  return { userId: payload.userId };
}

export const favoritesRoutes = new Elysia({ prefix: "/favorites" })
  // รายชื่อร้านโปรด (เฉพาะร้านที่ยังอนุมัติอยู่ — ร้านที่ถูกระงับภายหลังไม่แสดง แต่ยังเก็บแถวไว้ กลับมาอนุมัติแล้วโผล่เหมือนเดิม)
  .get("/", async ({ cookie, set }) => {
    const auth = requireCustomer(cookie, set);
    if ("error" in auth) return auth;

    const rows = await db
      .select({
        shopId: favoriteShops.shopId,
        createdAt: favoriteShops.createdAt,
        name: shops.name,
        shopPhotoUrl: shops.shopPhotoUrl,
        address: shops.address,
      })
      .from(favoriteShops)
      .innerJoin(shops, eq(favoriteShops.shopId, shops.id))
      .where(and(eq(favoriteShops.userId, auth.userId), eq(shops.approvalStatus, "approved")))
      .orderBy(desc(favoriteShops.createdAt));

    const response: FavoriteShopListResponse = {
      favorites: rows.map((r) => ({ ...r, createdAt: r.createdAt.toISOString() })),
    };
    return response;
  })

  // บันทึกร้านโปรด — ทำซ้ำได้ไม่ error (idempotent)
  .put("/:shopId", async ({ params, cookie, set }) => {
    const auth = requireCustomer(cookie, set);
    if ("error" in auth) return auth;
    if (!isValidUUID(params.shopId)) {
      set.status = 404;
      return { error: "ไม่พบร้านค้านี้" };
    }

    const [shop] = await db.select({ approvalStatus: shops.approvalStatus }).from(shops).where(eq(shops.id, params.shopId));
    if (!shop || shop.approvalStatus !== "approved") {
      set.status = 404;
      return { error: "ไม่พบร้านค้านี้" };
    }

    await db.insert(favoriteShops).values({ userId: auth.userId, shopId: params.shopId }).onConflictDoNothing();
    return { isFavorite: true };
  })

  // เลิกบันทึกร้านโปรด — ไม่มีอยู่แล้วก็ตอบสำเร็จ (idempotent)
  .delete("/:shopId", async ({ params, cookie, set }) => {
    const auth = requireCustomer(cookie, set);
    if ("error" in auth) return auth;
    if (!isValidUUID(params.shopId)) {
      set.status = 404;
      return { error: "ไม่พบร้านค้านี้" };
    }

    await db
      .delete(favoriteShops)
      .where(and(eq(favoriteShops.userId, auth.userId), eq(favoriteShops.shopId, params.shopId)));
    return { isFavorite: false };
  });
