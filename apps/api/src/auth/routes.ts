import { Elysia } from "elysia";
import { and, eq, gt, isNull } from "drizzle-orm";
import {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  registerShopSchema,
} from "@easyprint/shared";
import { db } from "../db";
import { users, passwordResetTokens, shops } from "../../drizzle/schema";
import { hashPassword, verifyPassword, generateResetToken, hashResetToken } from "./password";
import { signAuthToken, verifyAuthToken, AUTH_COOKIE_NAME } from "./jwt";
import { sendPasswordResetEmail } from "../email";

const COOKIE_NAME = AUTH_COOKIE_NAME;
const isProd = process.env.NODE_ENV === "production";

function toPublicUser(user: typeof users.$inferSelect) {
  const { passwordHash, ...publicUser } = user;
  return publicUser;
}

// รวมฟิลด์ที่อยู่แบบแยกส่วน (จากฟอร์ม shop-register) เป็นข้อความเดียว เพราะ shops.address เก็บเป็น text ก้อนเดียว
function formatShopAddress(input: {
  houseNo: string;
  village?: string;
  street?: string;
  subdistrict: string;
  district: string;
  province: string;
  postcode: string;
}) {
  const parts = [
    input.houseNo,
    input.village ? `หมู่ ${input.village}` : "",
    input.street && input.street !== "-" ? `ถ.${input.street}` : "",
    `ต.${input.subdistrict}`,
    `อ.${input.district}`,
    `จ.${input.province}`,
    input.postcode,
  ];
  return parts.filter(Boolean).join(" ");
}

export const authRoutes = new Elysia({ prefix: "/auth" })

  // สมัครสมาชิกลูกค้า (หน้า /register ฝั่ง web) — role เป็น "customer" เสมอ ร้านค้าสมัครผ่านช่องทางแยก (/register/shop-register)
  .post("/register", async ({ body, cookie, set }) => {
    const parsed = registerSchema.safeParse(body);
    if (!parsed.success) {
      set.status = 400;
      return { error: "ข้อมูลไม่ถูกต้อง", details: parsed.error.flatten() };
    }

    const existing = await db.query.users.findFirst({ where: eq(users.email, parsed.data.email) });
    if (existing) {
      set.status = 409;
      return { error: "อีเมลนี้ถูกใช้งานแล้ว" };
    }

    const passwordHash = await hashPassword(parsed.data.password);
    const [user] = await db
      .insert(users)
      .values({
        email: parsed.data.email,
        passwordHash,
        role: "customer",
        firstname: parsed.data.firstname,
        lastname: parsed.data.lastname,
        phone: parsed.data.phone,
        address: parsed.data.address,
      })
      .returning();

    const token = signAuthToken({ userId: user.id, role: user.role }, false);
    cookie[COOKIE_NAME]?.set({
      value: token,
      httpOnly: true,
      secure: isProd,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24, // 1 วัน
    });

    return { user: toPublicUser(user) };
  })

  // สมัครสมาชิกร้านค้า (หน้า /register/shop-register ฝั่ง web) — สร้าง user (role=shop_owner) กับ shop พร้อมกันในทีเดียว
  // ร้านที่สมัครใหม่เริ่มที่ approvalStatus="pending" เสมอ ต้องรอแอดมินอนุมัติก่อน (ดู shopApprovalStatusEnum ใน schema.ts)
  .post("/register/shop", async ({ body, cookie, set }) => {
    const parsed = registerShopSchema.safeParse(body);
    if (!parsed.success) {
      set.status = 400;
      return { error: "ข้อมูลไม่ถูกต้อง", details: parsed.error.flatten() };
    }

    const existing = await db.query.users.findFirst({ where: eq(users.email, parsed.data.email) });
    if (existing) {
      set.status = 409;
      return { error: "อีเมลนี้ถูกใช้งานแล้ว" };
    }

    const passwordHash = await hashPassword(parsed.data.password);
    const address = formatShopAddress(parsed.data);

    const { user, shop } = await db.transaction(async (tx) => {
      const [user] = await tx
        .insert(users)
        .values({
          email: parsed.data.email,
          passwordHash,
          role: "shop_owner",
          firstname: parsed.data.firstname,
          lastname: parsed.data.lastname,
          phone: parsed.data.phone,
        })
        .returning();

      const [shop] = await tx
        .insert(shops)
        .values({
          ownerId: user.id,
          name: parsed.data.shopName,
          phone: parsed.data.phone,
          address,
          serviceTypes: parsed.data.serviceTypes,
          deliveryMethods: parsed.data.deliveryMethods,
          googleMapLink: parsed.data.googleMapLink,
          idCardUrl: parsed.data.idCardUrl,
          shopPhotoUrl: parsed.data.shopPhotoUrl,
          socialMedia: parsed.data.socialMedia,
          openingHours: parsed.data.openingHours,
        })
        .returning();

      return { user, shop };
    });

    const token = signAuthToken({ userId: user.id, role: user.role }, false);
    cookie[COOKIE_NAME]?.set({
      value: token,
      httpOnly: true,
      secure: isProd,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24, // 1 วัน
    });

    return { user: toPublicUser(user), shop };
  })

  .post("/login", async ({ body, cookie, set }) => {
    const parsed = loginSchema.safeParse(body);
    if (!parsed.success) {
      set.status = 400;
      return { error: "ข้อมูลไม่ถูกต้อง", details: parsed.error.flatten() };
    }

    const user = await db.query.users.findFirst({ where: eq(users.email, parsed.data.email) });
    const passwordOk = user ? await verifyPassword(user.passwordHash, parsed.data.password) : false;

    if (!user || !passwordOk) {
      set.status = 401;
      return { error: "อีเมลหรือรหัสผ่านไม่ถูกต้อง" };
    }

    const token = signAuthToken({ userId: user.id, role: user.role }, parsed.data.rememberMe);
    cookie[COOKIE_NAME]?.set({
      value: token,
      httpOnly: true,
      secure: isProd,
      sameSite: "lax",
      path: "/",
      maxAge: parsed.data.rememberMe ? 60 * 60 * 24 * 30 : 60 * 60 * 24,
    });

    return { user: toPublicUser(user) };
  })

  .post("/logout", ({ cookie }) => {
    cookie[COOKIE_NAME]?.remove();
    return { ok: true };
  })

  .get("/me", async ({ cookie, set }) => {
    const token = cookie[COOKIE_NAME]?.value as string | undefined;
    const payload = token ? verifyAuthToken(token) : null;
    if (!payload) {
      set.status = 401;
      return { error: "ยังไม่ได้เข้าสู่ระบบ" };
    }

    const user = await db.query.users.findFirst({ where: eq(users.id, payload.userId) });
    if (!user) {
      set.status = 401;
      return { error: "ยังไม่ได้เข้าสู่ระบบ" };
    }

    return { user: toPublicUser(user) };
  })

  // ตอบ success message เดียวกันไม่ว่าจะเจออีเมลในระบบหรือไม่ กันไม่ให้คนนอกเช็คได้ว่าอีเมลไหนสมัครไว้แล้วบ้าง
  .post("/forgot-password", async ({ body, set }) => {
    const parsed = forgotPasswordSchema.safeParse(body);
    if (!parsed.success) {
      set.status = 400;
      return { error: "ข้อมูลไม่ถูกต้อง", details: parsed.error.flatten() };
    }

    const user = await db.query.users.findFirst({ where: eq(users.email, parsed.data.email) });
    if (user) {
      const { token, tokenHash } = generateResetToken();
      await db.insert(passwordResetTokens).values({
        userId: user.id,
        tokenHash,
        expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 ชั่วโมง
      });
      await sendPasswordResetEmail(user.email, token);
    }

    return { ok: true, message: "หากอีเมลนี้มีอยู่ในระบบ เราได้ส่งลิงก์รีเซ็ตรหัสผ่านไปให้แล้ว" };
  })

  .post("/reset-password", async ({ body, set }) => {
    const parsed = resetPasswordSchema.safeParse(body);
    if (!parsed.success) {
      set.status = 400;
      return { error: "ข้อมูลไม่ถูกต้อง", details: parsed.error.flatten() };
    }

    const tokenHash = hashResetToken(parsed.data.token);
    const resetToken = await db.query.passwordResetTokens.findFirst({
      where: and(
        eq(passwordResetTokens.tokenHash, tokenHash),
        isNull(passwordResetTokens.usedAt),
        gt(passwordResetTokens.expiresAt, new Date()),
      ),
    });

    if (!resetToken) {
      set.status = 400;
      return { error: "ลิงก์ไม่ถูกต้องหรือหมดอายุแล้ว" };
    }

    const passwordHash = await hashPassword(parsed.data.password);
    await db.update(users).set({ passwordHash }).where(eq(users.id, resetToken.userId));
    await db
      .update(passwordResetTokens)
      .set({ usedAt: new Date() })
      .where(eq(passwordResetTokens.id, resetToken.id));

    return { ok: true };
  });
