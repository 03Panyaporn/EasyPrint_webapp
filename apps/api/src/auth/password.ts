import argon2 from "argon2";
import { randomBytes, createHash } from "crypto";

export function hashPassword(plain: string) {
  return argon2.hash(plain);
}

export function verifyPassword(hash: string, plain: string) {
  return argon2.verify(hash, plain);
}

// ใช้สำหรับ password reset token: สุ่ม token ดิบส่งไปในอีเมล (ไม่เก็บใน DB)
// เก็บแค่ sha256 hash ไว้เทียบตอนผู้ใช้กดลิงก์กลับมา (เร็วกว่า argon2 และพอเพียงเพราะ token สุ่มเองมี entropy สูงอยู่แล้ว)
export function generateResetToken() {
  const token = randomBytes(32).toString("hex");
  const tokenHash = createHash("sha256").update(token).digest("hex");
  return { token, tokenHash };
}

export function hashResetToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}
