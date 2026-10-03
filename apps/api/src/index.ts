import "./env";
import { Elysia } from "elysia";
import { cors } from "@elysiajs/cors";
import { servicesRoutes } from "./routes/services";
import { authRoutes } from "./auth/routes";
import { uploadsRoutes } from "./routes/uploads";
import { adminRoutes } from "./routes/admin";
import { adminSettingsRoutes } from "./routes/adminSettings";
import { adminStorageRoutes } from "./routes/adminStorage";
import { internalCleanupRoutes } from "./routes/internalCleanup";
import { reviewsRoutes } from "./routes/reviews";
import { shopsRoutes } from "./routes/shops";
import { ordersRoutes } from "./routes/orders";
import { cartRoutes } from "./routes/cart";
import { addressRoutes } from "./routes/addresses";
import { notificationsRoutes } from "./routes/notifications";
import { messagesRoutes } from "./routes/messages";
import { cronRoutes } from "./cron";
import { reportsRoutes } from "./routes/reports";
import { contactAdminRoutes } from "./routes/contactAdmin";
import { adminNotificationsRoutes } from "./routes/adminNotificationsRoutes";
import { favoritesRoutes } from "./routes/favorites";
import { adminLogsRoutes } from "./routes/adminLogs";

import { isInvalidTextRepresentation } from "./utils/validation";
import { AUTH_COOKIE_NAME, verifyAuthToken } from "./auth/jwt";
import { isCustomerSuspended, getSuspendedAccountMessage, ACCOUNT_SUSPENDED_CODE } from "./utils/accountSuspension";
import { getAuditedRoute, getRequestMeta, recordAdminAudit } from "./utils/auditLog";
const isProd = process.env.NODE_ENV === "production";
const WEB_ORIGIN = process.env.WEB_ORIGIN ?? "http://localhost:3000";
// ตอน dev พอร์ตของ `next dev` อาจขยับได้ (ชนพอร์ตอื่นแล้ว Next auto-fallback) เลยอนุญาต localhost ทุกพอร์ตแทนการ hardcode
const corsOrigin = isProd ? WEB_ORIGIN : /^http:\/\/localhost:\d+$/;

// endpoint ที่ไม่ต้องใช้ session เดิม — ปล่อยผ่าน hook ระงับบัญชีด้านล่างเสมอ (login เช็คการระงับเองหลังตรวจรหัสผ่าน)
// กันไม่ให้ cookie เก่าของบัญชีที่ถูกระงับไปขวางการ logout / login บัญชีอื่น / สมัครใหม่ / รีเซ็ตรหัสผ่าน
const SUSPENSION_EXEMPT_PATHS = new Set([
  "/auth/login",
  "/auth/logout",
  "/auth/register",
  "/auth/register/shop",
  "/auth/forgot-password",
  "/auth/reset-password",
]);

const app = new Elysia()
  .use(cors({ origin: corsOrigin, credentials: true }))
  // ดักทุก error ที่หลุดจาก route handler (เช่น DB error ตอน params เป็น id รูปแบบผิด) — ไม่ให้ raw error/SQL query
  // หลุดออกไปให้ client เห็น (information disclosure) ต้อง log เต็มๆ ไว้ฝั่ง server เท่านั้นแล้วตอบกลับเป็นข้อความทั่วไปแทน
  .onError(({ code, error, set }) => {
    if (code === "VALIDATION") {
      set.status = 400;
      return { error: "ข้อมูลไม่ถูกต้อง" };
    }
    if (code === "NOT_FOUND") {
      set.status = 404;
      return { error: "ไม่พบ endpoint นี้" };
    }
    // id ใน path ไม่ใช่ UUID (Postgres 22P02) — ข้อมูลที่ขอไม่มีทางมีอยู่จริง ตอบ 404 แทน 500 (route ส่วนใหญ่ไม่ได้เช็ค isValidUUID เอง)
    if (isInvalidTextRepresentation(error)) {
      set.status = 404;
      return { error: "ไม่พบข้อมูลที่ต้องการ" };
    }
    console.error(`[API Error] ${code}:`, error);
    set.status = 500;
    return { error: "เกิดข้อผิดพลาดที่ไม่คาดคิด กรุณาลองใหม่อีกครั้ง" };
  })
  // บล็อกบัญชีลูกค้าที่แอดมินระงับ (PATCH /admin/customers/:id/suspend) ทุก endpoint ที่จุดเดียว — JWT เป็น stateless
  // ถ้าเช็คแค่ตอน login ลูกค้าที่ login ค้างไว้จะยังใช้งานได้จน token หมดอายุ (สูงสุด 30 วัน) — query เพิ่มเฉพาะ request
  // ที่ cookie เป็น role customer เท่านั้น (ร้านค้า/แอดมิน/guest ไม่กระทบ) และล้าง cookie ทิ้งด้วย attribute ชุดเดียวกับ
  // POST /auth/logout (ดูเหตุผลที่นั่น) ให้ request ถัดไปกลายเป็น guest ปกติ ไม่ติด 403 วนซ้ำในหน้าสาธารณะ
  .onBeforeHandle({ as: "global" }, async ({ cookie, set, path }) => {
    if (SUSPENSION_EXEMPT_PATHS.has(path)) return;
    const token = cookie[AUTH_COOKIE_NAME]?.value as string | undefined;
    const payload = token ? verifyAuthToken(token) : null;
    if (!payload || payload.role !== "customer") return;
    if (!(await isCustomerSuspended(payload.userId))) return;

    cookie[AUTH_COOKIE_NAME]?.set({
      value: "",
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? "none" : "lax",
      path: "/",
      maxAge: 0,
      expires: new Date(0),
    });
    set.status = 403;
    return { error: await getSuspendedAccountMessage(), code: ACCOUNT_SUSPENDED_CODE };
  })
  // Audit log ของแอดมิน (หน้า /admin/logs) — บันทึกที่จุดเดียวหลัง handler ทำงานเสร็จ แทนการไปแทรกโค้ดในทุก route
  // เฉพาะ endpoint ที่อยู่ในรายการ AUDITED_ROUTES (utils/auditLog.ts) + role=admin + ทำสำเร็จเท่านั้น
  // ไม่ await — ไม่ให้การเขียน log หน่วง response (recordAdminAudit จัดการ error เองแล้ว)
  .onAfterHandle({ as: "global" }, ({ request, route, params, body, cookie, set, server, responseValue }) => {
    if (!getAuditedRoute(request.method, route)) return;
    const token = cookie[AUTH_COOKIE_NAME]?.value as string | undefined;
    const payload = token ? verifyAuthToken(token) : null;
    if (!payload || payload.role !== "admin") return;
    void recordAdminAudit({
      actorId: payload.userId,
      method: request.method,
      route,
      params: (params ?? {}) as Record<string, string | undefined>,
      body,
      responseValue,
      status: set.status,
      ...getRequestMeta(request, server),
    });
  })
  .get("/", () => ({ status: "ok", service: "EasyPrint API" }))
  .use(servicesRoutes)
  .use(authRoutes)
  .use(uploadsRoutes)
  .use(adminRoutes)
  .use(adminSettingsRoutes)
  .use(adminStorageRoutes)
  .use(internalCleanupRoutes)
  .use(reviewsRoutes)
  .use(shopsRoutes)
  .use(ordersRoutes)
  .use(cartRoutes)
  .use(addressRoutes)
  .use(notificationsRoutes)
  .use(messagesRoutes)
  .use(cronRoutes)
  .use(reportsRoutes)
  .use(contactAdminRoutes)
  .use(adminNotificationsRoutes)
  .use(favoritesRoutes)
  .use(adminLogsRoutes)

  // ห้ามใช้ 3000 เป็นค่า default เพราะ Next.js (apps/web) ก็ใช้พอร์ตนี้เป็นค่าเริ่มต้นเหมือนกัน
  // บน Windows ทั้งสองฝั่ง bind พอร์ตเดียวกันได้แบบไม่ error (คนละ address family, IPv4 vs IPv6)
  // แล้ว "localhost" จะ resolve ไปเจอฝั่งใดฝั่งหนึ่งแบบสุ่มๆ ทำให้ request หลุดไปหน้าเว็บแทน API เงียบๆ
  .listen(process.env.PORT ?? 4000);

console.log(`🖨️  EasyPrint API รันอยู่ที่ http://localhost:${app.server?.port}`);
