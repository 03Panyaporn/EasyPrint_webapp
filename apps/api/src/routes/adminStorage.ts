import { Elysia } from "elysia";
import { eq, isNotNull, inArray } from "drizzle-orm";
import type {
  AdminStorageFile,
  AdminStorageOverviewResponse,
  AdminStorageFilesResponse,
  AdminStorageShopSummary,
  StorageStatus,
} from "@easyprint/shared";
import { db } from "../db";
import { cartItems, carts, orderItems, orders, shops, users } from "../../drizzle/schema";
import { requireAdmin } from "./admin";
import { getSystemSettings } from "../systemSettings";
import { supabaseAdmin, listBucketFiles } from "../storage";

// ไฟล์งานพิมพ์ทั้งหมดของลูกค้า (ตะกร้า + ออเดอร์) อยู่ใน bucket นี้ที่เดียว — ดู apps/api/src/storage.ts UPLOAD_BUCKETS
const ORDER_FILES_BUCKET = "order-files";

function fullName(firstname: string | null, lastname: string | null): string {
  if (!firstname) return "-";
  return `${firstname} ${lastname ?? ""}`.trim();
}

// รวมไฟล์งานพิมพ์ทั้งหมดในระบบ (ทั้งที่ยังอยู่ในตะกร้าและอยู่ในออเดอร์แล้ว) พร้อม join ชื่อร้าน/ผู้อัปโหลด/ขนาดไฟล์จริงจาก Storage
// เป็น query ที่ใช้ร่วมกันทั้ง /overview (เอาไปรวมยอดต่อร้าน) และ /files (แสดงรายการ) กันเขียน join ซ้ำ 2 ที่
async function collectAllFiles(): Promise<AdminStorageFile[]> {
  const [cartRows, orderRows, shopRows, sizeByPath] = await Promise.all([
    db
      .select({
        path: cartItems.fileUrl,
        fileName: cartItems.fileName,
        createdAt: cartItems.createdAt,
        shopId: carts.shopId,
        firstname: users.firstname,
        lastname: users.lastname,
      })
      .from(cartItems)
      .innerJoin(carts, eq(cartItems.cartId, carts.id))
      .leftJoin(users, eq(carts.customerId, users.id))
      .where(isNotNull(cartItems.fileUrl)),
    db
      .select({
        path: orderItems.fileUrl,
        fileName: orderItems.fileName,
        createdAt: orderItems.createdAt,
        shopId: orders.shopId,
        orderCode: orders.code,
        firstname: users.firstname,
        lastname: users.lastname,
      })
      .from(orderItems)
      .innerJoin(orders, eq(orderItems.orderId, orders.id))
      .leftJoin(users, eq(orders.customerId, users.id))
      .where(isNotNull(orderItems.fileUrl)),
    db.select({ id: shops.id, name: shops.name }).from(shops),
    listBucketFiles(ORDER_FILES_BUCKET),
  ]);

  const shopNameById = new Map(shopRows.map((s) => [s.id, s.name]));

  const files: AdminStorageFile[] = [];

  for (const row of cartRows) {
    if (!row.path) continue;
    files.push({
      path: row.path,
      fileName: row.fileName,
      sizeMb: (sizeByPath.get(row.path) ?? 0) / (1024 * 1024),
      shopId: row.shopId,
      shopName: shopNameById.get(row.shopId) ?? "-",
      uploadedBy: fullName(row.firstname, row.lastname),
      createdAt: row.createdAt.toISOString(),
      source: "cart",
      orderCode: null,
    });
  }

  for (const row of orderRows) {
    if (!row.path) continue;
    files.push({
      path: row.path,
      fileName: row.fileName,
      sizeMb: (sizeByPath.get(row.path) ?? 0) / (1024 * 1024),
      shopId: row.shopId,
      shopName: shopNameById.get(row.shopId) ?? "-",
      uploadedBy: fullName(row.firstname, row.lastname),
      createdAt: row.createdAt.toISOString(),
      source: "order",
      orderCode: row.orderCode,
    });
  }

  return files;
}

// เคลียร์ fileUrl/fileName ใน DB หลังลบไฟล์จริงจาก Storage แล้ว — เช็คทั้ง cart_items และ order_items เพราะไม่รู้ล่วงหน้าว่า path นี้มาจากตารางไหน (path เป็น UUID สุ่ม ไม่ชนกันข้ามตารางอยู่แล้ว เช็คคู่ขนานได้อย่างปลอดภัย)
async function clearFileReferences(paths: string[]) {
  if (paths.length === 0) return;
  await Promise.all([
    db.update(cartItems).set({ fileUrl: null, fileName: null }).where(inArray(cartItems.fileUrl, paths)),
    db.update(orderItems).set({ fileUrl: null, fileName: null }).where(inArray(orderItems.fileUrl, paths)),
  ]);
}

export const adminStorageRoutes = new Elysia({ prefix: "/admin/storage" })
  // สรุปพื้นที่ใช้งานต่อร้าน — เทียบกับโควต้า (shops.storageQuotaMb override หรือ default กลางจาก system_settings)
  .get("/overview", async ({ cookie, set }) => {
    const authError = await requireAdmin(cookie, set);
    if (authError) return authError;

    const [files, shopRows, settings] = await Promise.all([
      collectAllFiles(),
      db.select({ id: shops.id, name: shops.name, storageQuotaMb: shops.storageQuotaMb }).from(shops),
      getSystemSettings(),
    ]);

    const statsByShop = new Map<string, { usedMb: number; fileCount: number }>();
    for (const f of files) {
      const entry = statsByShop.get(f.shopId) ?? { usedMb: 0, fileCount: 0 };
      entry.usedMb += f.sizeMb;
      entry.fileCount += 1;
      statsByShop.set(f.shopId, entry);
    }

    const shopSummaries: AdminStorageShopSummary[] = shopRows
      .map((shop) => {
        const stats = statsByShop.get(shop.id) ?? { usedMb: 0, fileCount: 0 };
        const quotaMb = shop.storageQuotaMb ?? settings.defaultShopStorageQuotaMb;
        const percent = quotaMb > 0 ? (stats.usedMb / quotaMb) * 100 : 0;
        const status: StorageStatus = percent > 85 ? "danger" : percent > 65 ? "warning" : "normal";
        return {
          shopId: shop.id,
          shopName: shop.name,
          usedMb: stats.usedMb,
          quotaMb,
          fileCount: stats.fileCount,
          percent,
          status,
        };
      })
      .sort((a, b) => b.usedMb - a.usedMb);

    const response: AdminStorageOverviewResponse = {
      summary: {
        totalUsedMb: shopSummaries.reduce((s, r) => s + r.usedMb, 0),
        totalQuotaMb: shopSummaries.reduce((s, r) => s + r.quotaMb, 0),
        totalFileCount: shopSummaries.reduce((s, r) => s + r.fileCount, 0),
        shopsNearLimitCount: shopSummaries.filter((r) => r.percent > 65).length,
        totalShopsCount: shopRows.length,
      },
      shops: shopSummaries,
    };
    return response;
  })

  // list ไฟล์ทั้งหมด (หรือกรองเฉพาะร้านเดียวด้วย ?shopId=) เรียงไฟล์ใหญ่สุดก่อน
  .get("/files", async ({ query, cookie, set }) => {
    const authError = await requireAdmin(cookie, set);
    if (authError) return authError;

    const files = await collectAllFiles();
    const shopId = typeof query.shopId === "string" ? query.shopId : undefined;
    const filtered = shopId ? files.filter((f) => f.shopId === shopId) : files;
    filtered.sort((a, b) => b.sizeMb - a.sizeMb);

    const response: AdminStorageFilesResponse = { files: filtered };
    return response;
  })

  // ออก signed URL ชั่วคราว (10 นาที) ให้แอดมินดูตัวอย่าง/ดาวน์โหลดไฟล์ — bucket order-files เป็น private ไม่มี public URL ตรงๆ (เหมือน id-cards ใน admin.ts)
  .get("/files/:path/url", async ({ params, cookie, set }) => {
    const authError = await requireAdmin(cookie, set);
    if (authError) return authError;

    const { data, error } = await supabaseAdmin.storage.from(ORDER_FILES_BUCKET).createSignedUrl(params.path, 600);
    if (error || !data) {
      set.status = 404;
      return { error: "ไม่พบไฟล์นี้ หรือสร้างลิงก์ไม่สำเร็จ" };
    }
    return { url: data.signedUrl };
  })

  // ลบไฟล์เดียว — path คือชื่อไฟล์ใน bucket order-files (UUID.ext) การลบเป็นการลบถาวรจริง ไม่มีถังขยะ/กู้คืน (Supabase Storage ไม่รองรับ soft-delete ในตัว)
  .delete("/files/:path", async ({ params, cookie, set }) => {
    const authError = await requireAdmin(cookie, set);
    if (authError) return authError;

    const { error } = await supabaseAdmin.storage.from(ORDER_FILES_BUCKET).remove([params.path]);
    if (error) {
      set.status = 500;
      return { error: `ลบไฟล์ไม่สำเร็จ: ${error.message}` };
    }

    await clearFileReferences([params.path]);
    return { message: "ลบไฟล์เรียบร้อยแล้ว" };
  })

  // ลบไฟล์ทั้งหมดของร้านเดียวในทีเดียว — ใช้ปุ่ม "ลบไฟล์ทั้งหมดของร้านนี้" ในหน้าแอดมิน
  .delete("/shops/:shopId/files", async ({ params, cookie, set }) => {
    const authError = await requireAdmin(cookie, set);
    if (authError) return authError;

    const files = await collectAllFiles();
    const shopFiles = files.filter((f) => f.shopId === params.shopId);
    if (shopFiles.length === 0) {
      return { message: "ไม่มีไฟล์ของร้านนี้ให้ลบ", deletedCount: 0 };
    }

    const paths = shopFiles.map((f) => f.path);
    const { error } = await supabaseAdmin.storage.from(ORDER_FILES_BUCKET).remove(paths);
    if (error) {
      set.status = 500;
      return { error: `ลบไฟล์ไม่สำเร็จ: ${error.message}` };
    }

    await clearFileReferences(paths);
    return { message: `ลบไฟล์ทั้งหมด ${paths.length} ไฟล์ของร้านนี้เรียบร้อยแล้ว`, deletedCount: paths.length };
  });
