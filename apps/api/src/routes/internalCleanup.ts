import { Elysia } from "elysia";
import { and, eq, inArray, isNotNull, lt, or } from "drizzle-orm";
import { db } from "../db";
import { orders, orderItems } from "../../drizzle/schema";
import { supabaseAdmin } from "../storage";

// endpoint นี้ไม่ใช่ของแอดมินที่ login ผ่านหน้าเว็บ — เป็น machine-to-machine เรียกจาก cron ภายนอก (Supabase pg_cron / cron-job.org / GitHub Actions scheduled workflow)
// เลยเช็คสิทธิ์ด้วย shared secret (header x-cleanup-secret) แทน JWT cookie ปกติ
if (!process.env.CLEANUP_SECRET) {
  throw new Error("CLEANUP_SECRET ไม่ถูกตั้งค่า — เช็คไฟล์ .env (ก็อปจาก .env.example)");
}
const CLEANUP_SECRET: string = process.env.CLEANUP_SECRET;

const ORDER_FILES_BUCKET = "order-files";
const RETENTION_MS = 24 * 60 * 60 * 1000; // 1 วัน — ตาม requirement "ลบไฟล์อัตโนมัติหลังออเดอร์จบงาน 1 วัน"

export const internalCleanupRoutes = new Elysia().post(
  "/internal/cleanup/expired-order-files",
  async ({ headers, set }) => {
    if (headers["x-cleanup-secret"] !== CLEANUP_SECRET) {
      set.status = 401;
      return { error: "unauthorized" };
    }

    const cutoff = new Date(Date.now() - RETENTION_MS);

    // หา order_items ที่มีไฟล์แนบอยู่ ของออเดอร์ที่จบงานแล้ว (completed/cancelled) เกิน 1 วัน
    // ใช้ orders.finishedAt เป็นจุดเริ่มนับเสมอ ไม่ใช่ createdAt — ออเดอร์ที่ยังทำงานอยู่ (pending_review/accepted/in_progress/shipping) จะไม่ถูกแตะเลยไม่ว่าจะเก่าแค่ไหน
    const expiredFiles = await db
      .select({ id: orderItems.id, fileUrl: orderItems.fileUrl })
      .from(orderItems)
      .innerJoin(orders, eq(orderItems.orderId, orders.id))
      .where(
        and(
          or(eq(orders.status, "completed"), eq(orders.status, "cancelled")),
          isNotNull(orders.finishedAt),
          lt(orders.finishedAt, cutoff),
          isNotNull(orderItems.fileUrl)
        )
      );

    if (expiredFiles.length === 0) {
      return { deletedCount: 0, message: "ไม่มีไฟล์ที่ครบกำหนดลบ" };
    }

    const paths = expiredFiles.map((f) => f.fileUrl).filter((p): p is string => p !== null);
    const ids = expiredFiles.map((f) => f.id);

    const { error } = await supabaseAdmin.storage.from(ORDER_FILES_BUCKET).remove(paths);
    if (error) {
      set.status = 500;
      return { error: `ลบไฟล์ไม่สำเร็จ: ${error.message}` };
    }

    // เคลียร์ reference ใน DB ทีหลังสุด — ถ้า remove() ข้างบน error จะไม่มาถึงบรรทัดนี้ กัน DB บอกว่าไฟล์หายแต่จริงๆ ยังอยู่ใน Storage
    await db.update(orderItems).set({ fileUrl: null, fileName: null }).where(inArray(orderItems.id, ids));

    return { deletedCount: paths.length, message: `ลบไฟล์งานพิมพ์ที่ครบกำหนด 1 วันหลังออเดอร์จบงานแล้ว ${paths.length} ไฟล์` };
  }
);
