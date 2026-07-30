import "./env";
import { Elysia } from "elysia";
import { cors } from "@elysiajs/cors";
import { servicesRoutes } from "./routes/services";
import { authRoutes } from "./auth/routes";
import { uploadsRoutes } from "./routes/uploads";
import { adminRoutes } from "./routes/admin";
import { shopsRoutes } from "./routes/shops";
import { ordersRoutes } from "./routes/orders";
import { cartRoutes } from "./routes/cart";

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
  .use(ordersRoutes)
  .use(cartRoutes)

  // ห้ามใช้ 3000 เป็นค่า default เพราะ Next.js (apps/web) ก็ใช้พอร์ตนี้เป็นค่าเริ่มต้นเหมือนกัน
  // บน Windows ทั้งสองฝั่ง bind พอร์ตเดียวกันได้แบบไม่ error (คนละ address family, IPv4 vs IPv6)
  // แล้ว "localhost" จะ resolve ไปเจอฝั่งใดฝั่งหนึ่งแบบสุ่มๆ ทำให้ request หลุดไปหน้าเว็บแทน API เงียบๆ
  .listen(process.env.PORT ?? 4000);

console.log(`🖨️  EasyPrint API รันอยู่ที่ http://localhost:${app.server?.port}`);
