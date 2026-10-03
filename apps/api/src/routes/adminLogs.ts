import { Elysia } from "elysia";
import { and, count, desc, eq, gte, ilike, or, sql } from "drizzle-orm";
import {
  adminAuditLogQuerySchema,
  adminLoginHistoryQuerySchema,
  type AdminAuditLogListResponse,
  type AdminLoginHistoryListResponse,
  type LoginFailureReason,
  type SystemHealthCheck,
  type SystemHealthResponse,
} from "@easyprint/shared";
import { db } from "../db";
import { auditLogs, loginHistory, users } from "../../drizzle/schema";
import { requireAdmin } from "./admin";
import { escapeLikePattern } from "../utils/validation";
import { checkStorageConnection } from "../storage";
import { isEmailConfigured } from "../email";

// bucket ที่ใช้เช็คการเชื่อมต่อ R2 — order-files มีอยู่เสมอ (ไฟล์งานพิมพ์ทั้งหมดอยู่ที่นี่ ดู UPLOAD_BUCKETS ใน storage.ts)
const HEALTH_CHECK_BUCKET = "order-files";
const HEALTH_CHECK_TIMEOUT_MS = 5000;

// เช็คบริการภายนอก 1 ตัว พร้อมจับเวลา — timeout กันหน้า System Health ค้างนานถ้า DB/R2 ไม่ตอบ
async function runHealthCheck(check: () => Promise<unknown>): Promise<SystemHealthCheck> {
  const started = performance.now();
  try {
    await Promise.race([
      check(),
      new Promise((_, reject) => setTimeout(() => reject(new Error(`ไม่ตอบสนองภายใน ${HEALTH_CHECK_TIMEOUT_MS / 1000} วินาที`)), HEALTH_CHECK_TIMEOUT_MS)),
    ]);
    return { ok: true, latencyMs: Math.round(performance.now() - started), error: null };
  } catch (err) {
    // ไม่ส่ง error ดิบ (อาจมี host/credential) ออกไป — log เต็มฝั่ง server, ส่งข้อความสั้นให้หน้าเว็บ
    console.error("System health check ไม่ผ่าน:", err);
    const message = err instanceof Error && err.message.startsWith("ไม่ตอบสนอง") ? err.message : "เชื่อมต่อไม่สำเร็จ";
    return { ok: false, latencyMs: null, error: message };
  }
}

export const adminLogsRoutes = new Elysia({ prefix: "/admin" })
  // ── ประวัติการทำรายการของแอดมิน ใหม่สุดก่อน — กรองตาม action / ค้นหาอีเมลแอดมินหรือ id ของข้อมูลที่ถูกแก้ ──
  .get("/audit-logs", async ({ query, cookie, set }) => {
    const authError = await requireAdmin(cookie, set);
    if (authError) return authError;

    const parsed = adminAuditLogQuerySchema.safeParse(query);
    if (!parsed.success) {
      set.status = 400;
      return { error: parsed.error.errors[0]?.message ?? "ข้อมูลไม่ถูกต้อง", details: parsed.error.flatten() };
    }
    const { q, action, page, pageSize } = parsed.data;

    const conditions = [];
    if (action) conditions.push(eq(auditLogs.action, action));
    if (q) {
      const pattern = `%${escapeLikePattern(q)}%`;
      conditions.push(or(ilike(auditLogs.actorEmail, pattern), ilike(auditLogs.targetId, pattern))!);
    }
    const where = conditions.length > 0 ? and(...conditions) : undefined;

    const [[totalRow], rows] = await Promise.all([
      db.select({ c: count() }).from(auditLogs).where(where),
      db
        .select({ log: auditLogs, firstname: users.firstname, lastname: users.lastname })
        .from(auditLogs)
        .leftJoin(users, eq(auditLogs.actorId, users.id))
        .where(where)
        .orderBy(desc(auditLogs.createdAt), desc(auditLogs.id))
        .limit(pageSize)
        .offset((page - 1) * pageSize),
    ]);

    const total = Number(totalRow.c);
    const response: AdminAuditLogListResponse = {
      logs: rows.map(({ log, firstname, lastname }) => ({
        id: log.id,
        actorId: log.actorId,
        actorEmail: log.actorEmail,
        actorName: firstname ? `${firstname} ${lastname ?? ""}`.trim() : null,
        action: log.action,
        targetType: log.targetType,
        targetId: log.targetId,
        details: (log.details as Record<string, unknown> | null) ?? null,
        ipAddress: log.ipAddress,
        userAgent: log.userAgent,
        createdAt: log.createdAt.toISOString(),
      })),
      pagination: { page, pageSize, total, totalPages: Math.max(1, Math.ceil(total / pageSize)) },
    };
    return response;
  })

  // ── ประวัติการเข้าสู่ระบบทุก role ใหม่สุดก่อน — กรองสำเร็จ/ล้มเหลว, role และค้นหาอีเมลหรือ IP ──
  .get("/login-history", async ({ query, cookie, set }) => {
    const authError = await requireAdmin(cookie, set);
    if (authError) return authError;

    const parsed = adminLoginHistoryQuerySchema.safeParse(query);
    if (!parsed.success) {
      set.status = 400;
      return { error: parsed.error.errors[0]?.message ?? "ข้อมูลไม่ถูกต้อง", details: parsed.error.flatten() };
    }
    const { q, status, role, page, pageSize } = parsed.data;

    const conditions = [];
    if (status !== "all") conditions.push(eq(loginHistory.success, status === "success"));
    if (role !== "all") conditions.push(eq(loginHistory.role, role));
    if (q) {
      const pattern = `%${escapeLikePattern(q)}%`;
      conditions.push(or(ilike(loginHistory.email, pattern), ilike(loginHistory.ipAddress, pattern))!);
    }
    const where = conditions.length > 0 ? and(...conditions) : undefined;
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const [[totalRow], rows, [last24hRow]] = await Promise.all([
      db.select({ c: count() }).from(loginHistory).where(where),
      db
        .select()
        .from(loginHistory)
        .where(where)
        .orderBy(desc(loginHistory.createdAt), desc(loginHistory.id))
        .limit(pageSize)
        .offset((page - 1) * pageSize),
      db
        .select({
          success: sql<number>`count(*) filter (where ${loginHistory.success})::int`,
          failed: sql<number>`count(*) filter (where not ${loginHistory.success})::int`,
        })
        .from(loginHistory)
        .where(gte(loginHistory.createdAt, since)),
    ]);

    const total = Number(totalRow.c);
    const response: AdminLoginHistoryListResponse = {
      logins: rows.map((r) => ({
        id: r.id,
        userId: r.userId,
        email: r.email,
        role: r.role,
        success: r.success,
        failureReason: (r.failureReason as LoginFailureReason | null) ?? null,
        ipAddress: r.ipAddress,
        userAgent: r.userAgent,
        createdAt: r.createdAt.toISOString(),
      })),
      pagination: { page, pageSize, total, totalPages: Math.max(1, Math.ceil(total / pageSize)) },
      last24h: { success: Number(last24hRow?.success ?? 0), failed: Number(last24hRow?.failed ?? 0) },
    };
    return response;
  })

  // ── สถานะระบบ ณ ตอนที่เรียก: API (uptime/หน่วยความจำ), DB, R2 และการตั้งค่าอีเมล — ไม่เก็บประวัติ ──
  .get("/system-health", async ({ cookie, set }) => {
    const authError = await requireAdmin(cookie, set);
    if (authError) return authError;

    const [database, storage] = await Promise.all([
      runHealthCheck(() => db.execute(sql`select 1`)),
      runHealthCheck(() => checkStorageConnection(HEALTH_CHECK_BUCKET)),
    ]);

    const response: SystemHealthResponse = {
      health: {
        status: database.ok && storage.ok ? "ok" : "degraded",
        checkedAt: new Date().toISOString(),
        api: {
          uptimeSeconds: Math.round(process.uptime()),
          environment: process.env.NODE_ENV ?? "development",
          runtime: `Bun ${Bun.version}`,
          memoryMb: Math.round(process.memoryUsage().rss / (1024 * 1024)),
        },
        database,
        storage,
        email: { configured: isEmailConfigured },
      },
    };
    return response;
  });
