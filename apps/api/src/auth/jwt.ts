import jwt from "jsonwebtoken";

export const AUTH_COOKIE_NAME = "easyprint_token";

if (!process.env.JWT_SECRET) {
  throw new Error("JWT_SECRET ไม่ถูกตั้งค่า — เช็คไฟล์ .env (ก็อปจาก .env.example)");
}
const JWT_SECRET: string = process.env.JWT_SECRET;

export type JwtPayload = {
  userId: string;
  role: "shop_owner" | "customer" | "admin";
};

// rememberMe = true ให้ token อยู่ได้นานขึ้น (30 วัน) ไม่งั้นหมดอายุใน 1 วัน ตาม cookie maxAge ที่ตั้งคู่กันตอน set cookie
export function signAuthToken(payload: JwtPayload, rememberMe: boolean) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: rememberMe ? "30d" : "1d" });
}

export function verifyAuthToken(token: string): JwtPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as unknown as JwtPayload;
  } catch {
    return null;
  }
}
