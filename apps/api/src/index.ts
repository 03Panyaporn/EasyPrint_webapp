import "./env";
import { Elysia } from "elysia";
import { cors } from "@elysiajs/cors";
import { createOrderSchema } from "@easyprint/shared";
import { db } from "./db";
import { orders } from "../drizzle/schema";
import { authRoutes } from "./auth/routes";

const isProd = process.env.NODE_ENV === "production";
const WEB_ORIGIN = process.env.WEB_ORIGIN ?? "http://localhost:3000";
// ตอน dev พอร์ตของ `next dev` อาจขยับได้ (ชนพอร์ตอื่นแล้ว Next auto-fallback) เลยอนุญาต localhost ทุกพอร์ตแทนการ hardcode
const corsOrigin = isProd ? WEB_ORIGIN : /^http:\/\/localhost:\d+$/;

const app = new Elysia()
  .use(cors({ origin: corsOrigin, credentials: true }))
  .get("/", () => ({ status: "ok", service: "EasyPrint API" }))
  .use(authRoutes)

  // ตัวอย่าง endpoint: สร้างคำสั่งพิมพ์ใหม่
  // ทุก endpoint ในโปรเจกต์นี้ต้อง validate ด้วย Zod schema จาก @easyprint/shared ก่อนเสมอ (ดู AGENTS.md ข้อ 6)
  .post("/orders", async ({ body, set }) => {
    const parsed = createOrderSchema.safeParse(body);

    if (!parsed.success) {
      set.status = 400;
      return { error: "ข้อมูลไม่ถูกต้อง", details: parsed.error.flatten() };
    }

    // TODO: คำนวณราคาจริงตามอัตราของร้าน (ดู docs/proposal.md หัวข้อ 1.3.2.3)
    const totalPrice = parsed.data.pages * parsed.data.copies * 100; // ตัวอย่างชั่วคราว หน่วยสตางค์

    const [order] = await db
      .insert(orders)
      .values({
        shopId: parsed.data.shopId,
        customerId: "00000000-0000-0000-0000-000000000000", // TODO: ดึงจาก JWT ที่ login แล้ว
        serviceType: parsed.data.serviceType,
        pages: parsed.data.pages,
        copies: parsed.data.copies,
        colorMode: parsed.data.colorMode,
        paperSize: parsed.data.paperSize,
        binding: parsed.data.binding,
        lamination: parsed.data.lamination,
        fileUrl: parsed.data.fileUrl,
        totalPrice,
        note: parsed.data.note,
      })
      .returning();

    return { order };
  })

  .listen(process.env.PORT ?? 3000);

console.log(`🖨️  EasyPrint API รันอยู่ที่ http://localhost:${app.server?.port}`);
