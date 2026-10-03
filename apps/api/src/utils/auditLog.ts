import type { AuditAction } from "@easyprint/shared";
import { db } from "../db";
import { auditLogs, users } from "../../drizzle/schema";
import { eq } from "drizzle-orm";

// targetParam = ชื่อ path param ที่เป็น id ของข้อมูล, targetResponseKey = กรณีสร้างใหม่ (ไม่มี id ใน path) ให้อ่าน id จาก response[key].id
type AuditedRoute = { action: AuditAction; targetType: string; targetParam?: string; targetResponseKey?: string };

// endpoint ที่แอดมินใช้แก้ข้อมูล → action ใน audit log — key = "METHOD route pattern" ตามที่ Elysia ส่งมาใน context.route
// เพิ่ม endpoint แอดมินใหม่ที่แก้ข้อมูลเมื่อไหร่ ต้องมาเพิ่มที่นี่ (และป้ายใน AUDIT_ACTIONS ที่ packages/shared) ด้วย ไม่งั้นจะไม่ถูกบันทึก
// ไม่รวม PATCH /admin/notifications/* (แค่ทำเครื่องหมายอ่านแล้ว ไม่ใช่การแก้ข้อมูลระบบ) และ POST /uploads (ไฟล์ยังไม่ผูกกับอะไร
// จนกว่าจะบันทึกผ่าน endpoint อื่นซึ่งถูกบันทึกอยู่แล้ว เช่น PATCH /admin/settings ตอนเปลี่ยนโลโก้)
const AUDITED_ROUTES: Record<string, AuditedRoute> = {
  "PATCH /admin/shops/:id": { action: "shop.update", targetType: "shop", targetParam: "id" },
  "DELETE /admin/shops/:id": { action: "shop.delete", targetType: "shop", targetParam: "id" },
  "PATCH /admin/shops/:id/approve": { action: "shop.approve", targetType: "shop", targetParam: "id" },
  "PATCH /admin/shops/:id/reject": { action: "shop.reject", targetType: "shop", targetParam: "id" },
  "PATCH /admin/shops/:id/suspend": { action: "shop.suspend", targetType: "shop", targetParam: "id" },
  "PATCH /admin/customers/:id/suspend": { action: "customer.suspend", targetType: "customer", targetParam: "id" },
  "PATCH /admin/customers/:id/reinstate": { action: "customer.reinstate", targetType: "customer", targetParam: "id" },
  "DELETE /admin/customers/:id": { action: "customer.delete", targetType: "customer", targetParam: "id" },
  "POST /admin/announcements": { action: "announcement.create", targetType: "announcement", targetResponseKey: "announcement" },
  "PATCH /admin/settings": { action: "settings.update", targetType: "settings" },
  "DELETE /admin/storage/files/:path": { action: "file.delete", targetType: "file", targetParam: "path" },
  "DELETE /admin/storage/shops/:shopId/files": { action: "shop_files.delete", targetType: "shop", targetParam: "shopId" },
  "DELETE /reviews/:id": { action: "review.delete", targetType: "review", targetParam: "id" },
  "PATCH /admin/contact-messages/:id/reply": { action: "contact_message.reply", targetType: "contact_message", targetParam: "id" },
  "DELETE /admin/contact-messages/:id": { action: "contact_message.delete", targetType: "contact_message", targetParam: "id" },
};

// ฟิลด์ที่ห้ามเก็บลง log เด็ดขาด (เผื่อ endpoint ในอนาคตรับค่าพวกนี้) — เทียบท้ายชื่อ key แบบไม่สนตัวพิมพ์
// (password, newPassword, resetToken, apiSecret ฯลฯ) แต่ไม่โดนค่าตั้งค่าธรรมดาอย่าง minPasswordLength
const SENSITIVE_KEY_PATTERN = /(password|token|secret|otp)$/i;
const MAX_STRING_LENGTH = 500;

function sanitize(value: unknown, depth = 0): unknown {
  if (depth > 4) return "[…]";
  if (typeof value === "string") return value.length > MAX_STRING_LENGTH ? `${value.slice(0, MAX_STRING_LENGTH)}…` : value;
  if (Array.isArray(value)) return value.slice(0, 50).map((v) => sanitize(v, depth + 1));
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value)) {
      out[k] = SENSITIVE_KEY_PATTERN.test(k) ? "[ซ่อน]" : sanitize(v, depth + 1);
    }
    return out;
  }
  return value;
}

// IP จริงของผู้ใช้ — บน Render request ผ่าน proxy มาก่อนเสมอ ต้องอ่านจาก x-forwarded-for (ค่าแรก = client) ไม่งั้นได้ IP ของ proxy
// ตอน dev ไม่มี proxy ใช้ server.requestIP() แทน
export function getRequestMeta(
  request: Request,
  server: { requestIP(req: Request): { address: string } | null } | null
): { ipAddress: string | null; userAgent: string | null } {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const ipAddress = forwarded || server?.requestIP(request)?.address || null;
  const userAgent = request.headers.get("user-agent")?.slice(0, MAX_STRING_LENGTH) ?? null;
  return { ipAddress, userAgent };
}

// Elysia ใส่ route ของ group ที่ประกาศ "/" ไว้เป็น "/admin/settings/" — ตัด "/" ท้ายออกให้ตรงกับ key ใน AUDITED_ROUTES
function normalizeRoute(route: string) {
  return route.length > 1 && route.endsWith("/") ? route.slice(0, -1) : route;
}

function isSuccessStatus(status: unknown) {
  if (status === undefined) return true; // ไม่ได้ตั้ง set.status = 200 ค่า default
  const code = typeof status === "number" ? status : Number(status);
  return Number.isFinite(code) ? code < 400 : true;
}

function resolveTargetId(audited: AuditedRoute, params: Record<string, string | undefined>, responseValue: unknown) {
  if (audited.targetParam) return params[audited.targetParam] ?? null;
  if (audited.targetResponseKey && responseValue && typeof responseValue === "object") {
    const created = (responseValue as Record<string, unknown>)[audited.targetResponseKey];
    const id = created && typeof created === "object" ? (created as { id?: unknown }).id : undefined;
    if (typeof id === "string") return id;
  }
  return null;
}

export function getAuditedRoute(method: string, route: string): AuditedRoute | undefined {
  return AUDITED_ROUTES[`${method.toUpperCase()} ${normalizeRoute(route)}`];
}

// เรียกจาก onAfterHandle กลาง (apps/api/src/index.ts) หลัง handler ทำงานเสร็จ — บันทึกเฉพาะเมื่อ role=admin และทำสำเร็จ (status < 400)
// best-effort เสมอ: บันทึก log ไม่สำเร็จต้องไม่ทำให้การทำรายการ (ที่สำเร็จไปแล้ว) ตอบกลับเป็น error
export async function recordAdminAudit(input: {
  actorId: string;
  method: string;
  route: string;
  params: Record<string, string | undefined>;
  body: unknown;
  responseValue: unknown;
  status: unknown;
  ipAddress: string | null;
  userAgent: string | null;
}) {
  const audited = getAuditedRoute(input.method, input.route);
  if (!audited || !isSuccessStatus(input.status)) return;

  try {
    const [actor] = await db.select({ email: users.email }).from(users).where(eq(users.id, input.actorId));
    const message =
      input.responseValue && typeof input.responseValue === "object" && "message" in input.responseValue
        ? (input.responseValue as { message?: unknown }).message
        : undefined;
    const details: Record<string, unknown> = {};
    if (input.body && typeof input.body === "object" && Object.keys(input.body).length > 0) details.input = sanitize(input.body);
    if (typeof message === "string") details.result = message;

    await db.insert(auditLogs).values({
      actorId: input.actorId,
      actorEmail: actor?.email ?? "(ไม่พบบัญชี)",
      action: audited.action,
      targetType: audited.targetType,
      targetId: resolveTargetId(audited, input.params, input.responseValue),
      details: Object.keys(details).length > 0 ? details : null,
      ipAddress: input.ipAddress,
      userAgent: input.userAgent,
    });
  } catch (err) {
    console.error(`บันทึก audit log (${audited.action}) ไม่สำเร็จ:`, err);
  }
}
