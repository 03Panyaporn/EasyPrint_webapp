import "./env";
import { Elysia } from "elysia";
import { cors } from "@elysiajs/cors";
import { createOrderSchema } from "@easyprint/shared";
import { db } from "./db";
import { orders } from "../drizzle/schema";
import { servicesRoutes } from "./routes/services";
import { authRoutes } from "./auth/routes";
import { uploadsRoutes } from "./routes/uploads";
import { adminRoutes } from "./routes/admin";
import { shopsRoutes } from "./routes/shops";
import { verifyAuthToken, AUTH_COOKIE_NAME } from "./auth/jwt";

const isProd = process.env.NODE_ENV === "production";
const WEB_ORIGIN = process.env.WEB_ORIGIN ?? "http://localhost:3000";
// ตอน dev พอร์ตของ `next dev` อาจขยับได้ (ชนพอร์ตอื่นแล้ว Next auto-fallback) เลยอนุญาต localhost ทุกพอร์ตแทนการ hardcode
const corsOrigin = isProd ? WEB_ORIGIN : /^http:\/\/localhost:\d+$/;

const app = new Elysia()
  .use(cors({ origin: corsOrigin, credentials: true }))
  .get("/", () => ({ status: "ok", service: "EasyPrint API" }))
  .use(servicesRoutes)
  .use(authRoutes)
  .use(uploadsRoutes)
  .use(adminRoutes)
  .use(shopsRoutes)

  // ตัวอย่าง endpoint: สร้างคำสั่งพิมพ์ใหม่
  // ทุก endpoint ในโปรเจกต์นี้ต้อง validate ด้วย Zod schema จาก @easyprint/shared ก่อนเสมอ (ดู AGENTS.md ข้อ 6)
  // ⚠️ ช่องโหว่ที่แก้แล้ว: เดิม endpoint นี้ไม่เช็ค login เลย และ hardcode customerId เป็น UUID ปลอม
  // ทำให้ใครก็ตามสร้างออเดอร์ปลอมได้ไม่จำกัด โดยไม่มีทางสืบว่าใครสร้าง — ตอนนี้บังคับ login เป็น customer
  // แล้วใช้ userId จริงจาก JWT เท่านั้น (ห้ามรับ customerId จาก body เด็ดขาด กัน spoof)
  .post("/orders", async ({ body, cookie, set }) => {
    const token = cookie[AUTH_COOKIE_NAME]?.value as string | undefined;
    const payload = token ? verifyAuthToken(token) : null;
    if (!payload) {
      set.status = 401;
      return { error: "ยังไม่ได้เข้าสู่ระบบ" };
    }
    if (payload.role !== "customer") {
      set.status = 403;
      return { error: "ต้องเป็นบัญชีลูกค้าเท่านั้นถึงจะสั่งพิมพ์ได้" };
    }

    const parsed = createOrderSchema.safeParse(body);

    if (!parsed.success) {
      set.status = 400;
      return { error: "ข้อมูลไม่ถูกต้อง", details: parsed.error.flatten() };
    }

    // TODO: คำนวณราคาจริงตามอัตราของร้าน (main_services/main_service_price_options) แทนสูตรชั่วคราวนี้
    // ตอนนี้ยังไม่มีหน้า/flow ให้ลูกค้าเลือกบริการ+ขนาด+สีจริงจากร้าน (ดู docs/proposal.md หัวข้อ 1.3.2.3)
    const totalPrice = parsed.data.pages * parsed.data.copies * 100; // ตัวอย่างชั่วคราว หน่วยสตางค์

    const [order] = await db
      .insert(orders)
      .values({
        shopId: parsed.data.shopId,
        customerId: payload.userId,
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

  // ห้ามใช้ 3000 เป็นค่า default เพราะ Next.js (apps/web) ก็ใช้พอร์ตนี้เป็นค่าเริ่มต้นเหมือนกัน
  // บน Windows ทั้งสองฝั่ง bind พอร์ตเดียวกันได้แบบไม่ error (คนละ address family, IPv4 vs IPv6)
  // แล้ว "localhost" จะ resolve ไปเจอฝั่งใดฝั่งหนึ่งแบบสุ่มๆ ทำให้ request หลุดไปหน้าเว็บแทน API เงียบๆ
  .listen(process.env.PORT ?? 4000);

console.log(`🖨️  EasyPrint API รันอยู่ที่ http://localhost:${app.server?.port}`);
