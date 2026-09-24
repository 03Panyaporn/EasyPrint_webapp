import { Elysia } from "elysia";
import { and, eq, gt, isNull, sql } from "drizzle-orm";
import {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  changePasswordSchema,
  registerShopSchema,
  changeEmailSchema,
  deleteAccountSchema,
  updateProfileSchema,
} from "@easyprint/shared";
import { db } from "../db";
import { users, passwordResetTokens, shops, orders, carts, addresses, contactAdminMessages, deliveryOptions } from "../../drizzle/schema";
import { hashPassword, verifyPassword, generateResetToken, hashResetToken } from "./password";
import { signAuthToken, verifyAuthToken, AUTH_COOKIE_NAME } from "./jwt";
import { sendPasswordResetEmail } from "../email";
import { createNotification } from "../utils/notification";
import { createAdminNotification } from "../adminNotifications";
import { getSystemSettings } from "../systemSettings";
import { isUniqueViolation } from "../utils/validation";

// เช็คความยาวรหัสผ่านขั้นต่ำตามค่าที่แอดมินตั้งไว้ (system_settings.minPasswordLength) — เสริมจาก Zod ที่เช็คขั้นต่ำ 8 ตัวอักษรแบบ hardcode อยู่แล้ว
// คืน error message ถ้าไม่ผ่าน หรือ null ถ้าผ่าน
async function checkMinPasswordLength(password: string): Promise<string | null> {
  const settings = await getSystemSettings();
  if (password.length < settings.minPasswordLength) {
    return `รหัสผ่านต้องมีอย่างน้อย ${settings.minPasswordLength} ตัวอักษร`;
  }
  return null;
}

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

// หา user ด้วยอีเมลแบบไม่สนตัวพิมพ์ — input ผ่าน emailSchema (lowercase แล้ว) ส่วนฝั่ง DB ใช้ lower() ด้วย
// เผื่อแถวเก่าที่ถูกบันทึกเป็นตัวพิมพ์ใหญ่ไว้ก่อน migration 0021 จะรัน (ใช้ index users_email_lower_unique ได้)
function emailEquals(email: string) {
  return sql`lower(${users.email}) = ${email.toLowerCase()}`;
}

export const authRoutes = new Elysia({ prefix: "/auth" })

  // สมัครสมาชิกลูกค้า (หน้า /register ฝั่ง web) — role เป็น "customer" เสมอ ร้านค้าสมัครผ่านช่องทางแยก (/register/shop-register)
  .post("/register", async ({ body, cookie, set }) => {
    const parsed = registerSchema.safeParse(body);
    if (!parsed.success) {
      set.status = 400;
      return { error: "ข้อมูลไม่ถูกต้อง", details: parsed.error.flatten() };
    }

    const passwordError = await checkMinPasswordLength(parsed.data.password);
    if (passwordError) {
      set.status = 400;
      return { error: passwordError };
    }

    const existing = await db.query.users.findFirst({ where: emailEquals(parsed.data.email) });
    if (existing) {
      set.status = 409;
      return { error: "อีเมลนี้ถูกใช้งานแล้ว" };
    }

    const passwordHash = await hashPassword(parsed.data.password);
    // เช็ค existing ข้างบนกัน duplicate email แบบทั่วไปได้ แต่ไม่ atomic — ถ้ามี 2 request ชนกัน
    // (เช่น กด submit ซ้ำเร็วๆ/double-click) ทั้งคู่อาจผ่าน SELECT ก่อนที่ INSERT ตัวแรกจะ commit
    // แล้วตัวที่สองไปชน unique constraint ตอน INSERT จริง ต้อง catch แล้วแปลงเป็น 409 ที่สุภาพ
    // แทน raw 500 (ยืนยันบั๊กจริงจาก QA: BUG-P01-02) — pattern เดียวกับที่ใช้ใน services.ts (BUG-06-01/06-02)
    // สร้าง user + ที่อยู่หลักแรก (ถ้ากรอกมา) ใน transaction เดียว — ที่อยู่บันทึกไม่ผ่านต้องไม่ได้บัญชีครึ่งๆ กลางๆ
    let user: typeof users.$inferSelect;
    try {
      user = await db.transaction(async (tx) => {
        const [created] = await tx
          .insert(users)
          .values({
            email: parsed.data.email,
            passwordHash,
            role: "customer",
            firstname: parsed.data.firstname,
            lastname: parsed.data.lastname,
            phone: parsed.data.phone,
          })
          .returning();

        const addr = parsed.data.defaultAddress;
        if (addr) {
          await tx.insert(addresses).values({
            userId: created.id,
            receiverName: addr.receiverName || `${created.firstname} ${created.lastname}`.trim(),
            phone: addr.phone || created.phone,
            address: addr.address,
            subdistrict: addr.subdistrict,
            district: addr.district,
            province: addr.province,
            postalCode: addr.postalCode,
            label: "บ้าน",
            isDefault: true, // ที่อยู่แรกของบัญชี = ที่อยู่หลักเสมอ (เพิ่มที่อยู่อื่นได้ภายหลังที่หน้าโปรไฟล์)
          });
        }
        return created;
      });
    } catch (err) {
      if (isUniqueViolation(err)) {
        set.status = 409;
        return { error: "อีเมลนี้ถูกใช้งานแล้ว" };
      }
      throw err;
    }

    const token = signAuthToken({ userId: user.id, role: user.role }, false);
    cookie[COOKIE_NAME]?.set({
      value: token,
      httpOnly: true,
      secure: isProd,
      // dev: frontend/backend อยู่ localhost คนละพอร์ต แต่ registrable domain เดียวกัน "lax" ก็พอ
      // prod: frontend (pages.dev) กับ backend (onrender.com) คนละโดเมนกันจริง ต้องเป็น "none" cookie ถึงจะแนบไปกับ
      // cross-site request ได้ (ต้องคู่กับ secure:true เสมอ ไม่งั้นเบราว์เซอร์ปฏิเสธ cookie นี้ทิ้ง — isProd=true ที่นี่ก็ทำให้ secure เป็น true อยู่แล้ว)
      sameSite: isProd ? "none" : "lax",
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

    const passwordError = await checkMinPasswordLength(parsed.data.password);
    if (passwordError) {
      set.status = 400;
      return { error: passwordError };
    }

    const existing = await db.query.users.findFirst({ where: emailEquals(parsed.data.email) });
    if (existing) {
      set.status = 409;
      return { error: "อีเมลนี้ถูกใช้งานแล้ว" };
    }

    const passwordHash = await hashPassword(parsed.data.password);
    const address = formatShopAddress(parsed.data);

    let txResult: { user: typeof users.$inferSelect; shop: typeof shops.$inferSelect };
    try {
      txResult = await db.transaction(async (tx) => {
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
            bankName: parsed.data.bankName || null,
            bankAccountNumber: parsed.data.bankAccountNumber || null,
            bankAccountName: parsed.data.bankAccountName || null,
            promptpayNumber: parsed.data.promptpayNumber || null,
            promptpayQrUrl: parsed.data.promptpayQrUrl || null,
          })
          .returning();

        // ร้านติ๊ก "จัดส่งโดยร้าน" ตอนสมัคร แต่ค่านี้เป็นแค่ป้ายบอกความสามารถ (shops.deliveryMethods) ไม่ได้สร้างแถวค่าจัดส่งจริงให้เอง
        // เดิมลูกค้าจะยังไม่เห็นตัวเลือกจัดส่งใดๆ จนกว่าร้านจะเข้าไปตั้งค่าเองทีหลัง — สร้างแถวเริ่มต้นให้เลยลดขั้นตอน ร้านแก้ค่าธรรมเนียม/ปิดเปิดได้ทีหลังตามปกติ
        if (parsed.data.deliveryMethods.includes("จัดส่งโดยร้าน")) {
          await tx.insert(deliveryOptions).values({
            shopId: shop.id,
            name: "จัดส่งโดยร้าน",
            description: "ตั้งค่าเริ่มต้นตอนสมัครร้าน — แก้ไขค่าจัดส่งและเงื่อนไขได้ที่เมนู บริการและราคา > วิธีจัดส่ง",
            baseFee: "0.00",
            isActive: true,
          });
        }

        return { user, shop };
      });
    } catch (err) {
      // เช็ค existing ข้างบนกัน duplicate email แบบทั่วไปได้ แต่ไม่ atomic — เหมือนกับ /auth/register
      // ด้านบน (ดู comment ที่นั่นสำหรับรายละเอียดเต็ม BUG-P01-02)
      if (isUniqueViolation(err)) {
        set.status = 409;
        return { error: "อีเมลนี้ถูกใช้งานแล้ว" };
      }
      throw err;
    }
    const { user, shop } = txResult;

    // แจ้งเตือนแอดมินว่ามีร้านสมัครใหม่รอตรวจสอบ — best-effort เสมอ ไม่ทำให้การสมัครร้าน (ที่บันทึกลง DB สำเร็จแล้ว) fail ไปด้วยถ้าแจ้งเตือนพลาด
    createAdminNotification({
      type: "shop_registered",
      title: "ร้านค้าสมัครใหม่รอตรวจสอบ",
      message: `${shop.name} สมัครเข้าร่วมระบบ รอการตรวจสอบและอนุมัติ`,
      link: `/admin/shops/${shop.id}`,
    }).catch((err) => console.error("สร้างการแจ้งเตือนร้านสมัครใหม่ไม่สำเร็จ:", err));

    const token = signAuthToken({ userId: user.id, role: user.role }, false);
    cookie[COOKIE_NAME]?.set({
      value: token,
      httpOnly: true,
      secure: isProd,
      // dev: frontend/backend อยู่ localhost คนละพอร์ต แต่ registrable domain เดียวกัน "lax" ก็พอ
      // prod: frontend (pages.dev) กับ backend (onrender.com) คนละโดเมนกันจริง ต้องเป็น "none" cookie ถึงจะแนบไปกับ
      // cross-site request ได้ (ต้องคู่กับ secure:true เสมอ ไม่งั้นเบราว์เซอร์ปฏิเสธ cookie นี้ทิ้ง — isProd=true ที่นี่ก็ทำให้ secure เป็น true อยู่แล้ว)
      sameSite: isProd ? "none" : "lax",
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

    const user = await db.query.users.findFirst({ where: emailEquals(parsed.data.email) });
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
      // dev: frontend/backend อยู่ localhost คนละพอร์ต แต่ registrable domain เดียวกัน "lax" ก็พอ
      // prod: frontend (pages.dev) กับ backend (onrender.com) คนละโดเมนกันจริง ต้องเป็น "none" cookie ถึงจะแนบไปกับ
      // cross-site request ได้ (ต้องคู่กับ secure:true เสมอ ไม่งั้นเบราว์เซอร์ปฏิเสธ cookie นี้ทิ้ง — isProd=true ที่นี่ก็ทำให้ secure เป็น true อยู่แล้ว)
      sameSite: isProd ? "none" : "lax",
      path: "/",
      maxAge: parsed.data.rememberMe ? 60 * 60 * 24 * 30 : 60 * 60 * 24,
    });

    return { user: toPublicUser(user) };
  })

  .post("/logout", ({ cookie }) => {
    // ⚠️ ห้ามใช้ cookie[...]?.remove() เฉยๆ — Elysia's remove() ไม่ preserve secure/sameSite/path
    // ที่ตั้งไว้ตอน login (ดู login/register ด้านบน) ทำให้ Set-Cookie ตอน logout ไม่มี "Secure; SameSite=None"
    // เบราว์เซอร์จะมองว่านี่เป็น cookie คนละใบกับที่ set มาจาก cross-site response (frontend เป็น pages.dev,
    // backend เป็น onrender.com คนละโดเมนกันจริง) แล้วเงียบๆ ไม่ยอมรับ Set-Cookie นี้เลย — ผลคือ cookie เดิม
    // ที่ set ไว้ตอน login ยังคงใช้งานได้ต่อแม้กด logout แล้ว (ยืนยันบั๊กจริงจาก QA: BUG-P01-01, Critical)
    // ต้อง set ด้วย attribute ชุดเดียวกับตอน login/register เป๊ะๆ เพื่อให้เบราว์เซอร์ overwrite cookie เดิมจริง
    cookie[COOKIE_NAME]?.set({
      value: "",
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? "none" : "lax",
      path: "/",
      maxAge: 0,
      expires: new Date(0),
    });
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

  // แก้ไขชื่อ-นามสกุล/เบอร์โทรของตัวเอง — ไม่รวมอีเมล/รหัสผ่าน (มี endpoint แยกที่ต้องยืนยันรหัสผ่านปัจจุบันก่อน)
  .put("/me", async ({ body, cookie, set }) => {
    const token = cookie[COOKIE_NAME]?.value as string | undefined;
    const payload = token ? verifyAuthToken(token) : null;
    if (!payload) {
      set.status = 401;
      return { error: "ยังไม่ได้เข้าสู่ระบบ" };
    }

    const parsed = updateProfileSchema.safeParse(body);
    if (!parsed.success) {
      set.status = 400;
      return { error: "ข้อมูลไม่ถูกต้อง", details: parsed.error.flatten() };
    }

    const [user] = await db
      .update(users)
      .set({
        firstname: parsed.data.firstname,
        lastname: parsed.data.lastname,
        phone: parsed.data.phone,
      })
      .where(eq(users.id, payload.userId))
      .returning();

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

    const user = await db.query.users.findFirst({ where: emailEquals(parsed.data.email) });
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

    const passwordError = await checkMinPasswordLength(parsed.data.password);
    if (passwordError) {
      set.status = 400;
      return { error: passwordError };
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

    await createNotification({
      userId: resetToken.userId,
      typeId: 10,
      category: "general", // 10 = เปลี่ยนรหัสผ่าน
      title: "เปลี่ยนรหัสผ่านสำเร็จ",
      message: "รหัสผ่านของคุณถูกเปลี่ยนเรียบร้อยแล้ว หากไม่ได้เป็นผู้เปลี่ยน กรุณาติดต่อผู้ดูแลระบบทันที",
    });

    return { ok: true };
  })

  // เปลี่ยนรหัสผ่านตอนล็อกอินอยู่แล้ว (ต่างจาก reset-password ที่ไม่ต้องล็อกอิน ใช้ token จากอีเมลแทน)
  .post("/change-password", async ({ body, cookie, set }) => {
    const token = cookie[COOKIE_NAME]?.value as string | undefined;
    const payload = token ? verifyAuthToken(token) : null;
    if (!payload) {
      set.status = 401;
      return { error: "ยังไม่ได้เข้าสู่ระบบ" };
    }

    const parsed = changePasswordSchema.safeParse(body);
    if (!parsed.success) {
      set.status = 400;
      return { error: "ข้อมูลไม่ถูกต้อง", details: parsed.error.flatten() };
    }

    const user = await db.query.users.findFirst({ where: eq(users.id, payload.userId) });
    if (!user) {
      set.status = 401;
      return { error: "ยังไม่ได้เข้าสู่ระบบ" };
    }

    const currentPasswordOk = await verifyPassword(user.passwordHash, parsed.data.currentPassword);
    if (!currentPasswordOk) {
      set.status = 400;
      return { error: "รหัสผ่านปัจจุบันไม่ถูกต้อง" };
    }

    if (parsed.data.currentPassword === parsed.data.newPassword) {
      set.status = 400;
      return { error: "รหัสผ่านใหม่ต้องไม่ซ้ำกับรหัสผ่านปัจจุบัน" };
    }

    const passwordError = await checkMinPasswordLength(parsed.data.newPassword);
    if (passwordError) {
      set.status = 400;
      return { error: passwordError };
    }

    const passwordHash = await hashPassword(parsed.data.newPassword);
    await db.update(users).set({ passwordHash }).where(eq(users.id, user.id));

    await createNotification({
      userId: user.id,
      typeId: 10,
      category: "general", // 10 = เปลี่ยนรหัสผ่าน
      title: "เปลี่ยนรหัสผ่านสำเร็จ",
      message: "รหัสผ่านของคุณถูกเปลี่ยนเรียบร้อยแล้ว หากไม่ได้เป็นผู้เปลี่ยน กรุณาติดต่อผู้ดูแลระบบทันที",
    });

    return { ok: true };
  })

  // เปลี่ยนอีเมล
  .put("/change-email", async ({ body, cookie, set }) => {
    const token = cookie[COOKIE_NAME]?.value as string | undefined;
    const payload = token ? verifyAuthToken(token) : null;
    if (!payload) {
      set.status = 401;
      return { error: "ยังไม่ได้เข้าสู่ระบบ" };
    }

    const parsed = changeEmailSchema.safeParse(body);
    if (!parsed.success) {
      set.status = 400;
      return { error: "ข้อมูลไม่ถูกต้อง", details: parsed.error.flatten() };
    }

    const user = await db.query.users.findFirst({ where: eq(users.id, payload.userId) });
    if (!user) {
      set.status = 401;
      return { error: "ยังไม่ได้เข้าสู่ระบบ" };
    }

    const currentPasswordOk = await verifyPassword(user.passwordHash, parsed.data.currentPassword);
    if (!currentPasswordOk) {
      set.status = 400;
      return { error: "รหัสผ่านปัจจุบันไม่ถูกต้อง" };
    }
    
    // Check if new email is already used
    const existing = await db.query.users.findFirst({ where: emailEquals(parsed.data.newEmail) });
    if (existing) {
      set.status = 409;
      return { error: "อีเมลนี้ถูกใช้งานแล้ว" };
    }

    await db.update(users).set({ email: parsed.data.newEmail }).where(eq(users.id, user.id));

    return { ok: true };
  })
  
  // ลบบัญชี
  .delete("/me", async ({ body, cookie, set }) => {
    const token = cookie[COOKIE_NAME]?.value as string | undefined;
    const payload = token ? verifyAuthToken(token) : null;
    if (!payload) {
      set.status = 401;
      return { error: "ยังไม่ได้เข้าสู่ระบบ" };
    }

    const parsed = deleteAccountSchema.safeParse(body);
    if (!parsed.success) {
      set.status = 400;
      return { error: "ข้อมูลไม่ถูกต้อง", details: parsed.error.flatten() };
    }

    const user = await db.query.users.findFirst({ where: eq(users.id, payload.userId) });
    if (!user) {
      set.status = 401;
      return { error: "ยังไม่ได้เข้าสู่ระบบ" };
    }

    const currentPasswordOk = await verifyPassword(user.passwordHash, parsed.data.currentPassword);
    if (!currentPasswordOk) {
      set.status = 400;
      return { error: "รหัสผ่านปัจจุบันไม่ถูกต้อง" };
    }

    // shops.owner_id / orders.customer_id ตั้งใจไม่มี ON DELETE CASCADE (กันร้านค้า/ประวัติการขายหายไปเงียบๆ ตอนเจ้าของบัญชีลบตัวเอง —
    // ดูคอมเมนต์เดียวกันใน services.ts เรื่องลบบริการที่มี cart ผูกอยู่) เลยต้องเช็คก่อนลบเสมอ ไม่งั้น Postgres จะ throw
    // foreign_key_violation (23503) ดิบๆ ที่ catch ไม่ทัน กลายเป็น raw 500 (ยืนยันบั๊กจริงจาก QA Phase 08 — BUG-08-01
    // พบว่ากระทบทั้งเจ้าของร้านที่มีร้านผูกอยู่ และลูกค้าทั่วไปที่เคยสั่งซื้อแล้วอย่างน้อย 1 ครั้ง — คือเกือบทุกบัญชีที่ใช้งานจริง)
    if (user.role === "shop_owner") {
      const [ownedShop] = await db.select({ id: shops.id }).from(shops).where(eq(shops.ownerId, user.id));
      if (ownedShop) {
        set.status = 400;
        return { error: "ไม่สามารถลบบัญชีได้ เนื่องจากยังมีร้านค้าผูกอยู่กับบัญชีนี้ กรุณาติดต่อผู้ดูแลระบบเพื่อปิด/โอนย้ายร้านค้าก่อนลบบัญชี" };
      }
    }
    const [existingOrder] = await db.select({ id: orders.id }).from(orders).where(eq(orders.customerId, user.id));
    if (existingOrder) {
      set.status = 400;
      return { error: "ไม่สามารถลบบัญชีได้ เนื่องจากมีประวัติการสั่งซื้อผูกอยู่กับบัญชีนี้ กรุณาติดต่อผู้ดูแลระบบ" };
    }

    // ล้างข้อมูลที่ไม่ใช่ประวัติสำคัญทางธุรกิจ (ตะกร้าที่ยังไม่ checkout / token รีเซ็ตรหัสผ่านเก่า) ก่อนลบผู้ใช้เสมอ —
    // ทั้งคู่ไม่มี CASCADE เช่นกัน (carts.customer_id, password_reset_tokens.user_id) แต่ไม่ใช่ข้อมูลที่ต้องเก็บรักษาแบบ order/shop
    // จึงลบทิ้งตรงนี้ได้เลยแทนที่จะ block การลบบัญชีเหมือน 2 เคสด้านบน (cart_items/addons/option_selections มี CASCADE ผูกกับ cart อยู่แล้ว)
    // addresses.user_id / contact_admin_messages.user_id ก็ไม่มี CASCADE — เดิมไม่ได้ล้าง ทำให้ลูกค้าที่มีที่อยู่บันทึกไว้
    // หรือเคยติดต่อแอดมินลบบัญชีไม่ได้ (FK violation → 500) ที่อยู่ลบได้เลย (ออเดอร์เก็บที่อยู่เป็น snapshot ใน orders.delivery_address แล้ว)
    // ส่วนข้อความถึงแอดมินเก็บไว้เป็นประวัติแต่ตัดการผูกกับบัญชีออก (user_id เป็น nullable อยู่แล้ว)
    // ทำทั้งหมดใน transaction เดียว — ถ้าขั้นไหนพัง ข้อมูลที่ลบไปก่อนหน้า (เช่น ตะกร้า) ต้องไม่หายไปด้วย
    await db.transaction(async (tx) => {
      await tx.delete(carts).where(eq(carts.customerId, user.id));
      await tx.delete(passwordResetTokens).where(eq(passwordResetTokens.userId, user.id));
      await tx.delete(addresses).where(eq(addresses.userId, user.id));
      await tx.update(contactAdminMessages).set({ userId: null }).where(eq(contactAdminMessages.userId, user.id));

      await tx.delete(users).where(eq(users.id, user.id));
    });

    cookie[COOKIE_NAME]?.remove();

    return { ok: true };
  });
