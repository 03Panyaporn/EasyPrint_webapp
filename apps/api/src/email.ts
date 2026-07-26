import { Resend } from "resend";

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const RESEND_FROM_EMAIL = process.env.RESEND_FROM_EMAIL ?? "EasyPrint <onboarding@resend.dev>";
const APP_URL = process.env.APP_URL ?? "http://localhost:3001";

const resend = RESEND_API_KEY ? new Resend(RESEND_API_KEY) : null;

export async function sendPasswordResetEmail(to: string, token: string) {
  const resetLink = `${APP_URL}/reset-password?token=${token}`;

  if (!resend) {
    // ยังไม่ได้ตั้งค่า RESEND_API_KEY — พิมพ์ลิงก์ลง console แทนตอน dev เพื่อให้ทดสอบ flow ได้
    console.log(`[dev] ไม่ได้ตั้งค่า RESEND_API_KEY — ลิงก์รีเซ็ตรหัสผ่านสำหรับ ${to}: ${resetLink}`);
    return;
  }

  await resend.emails.send({
    from: RESEND_FROM_EMAIL,
    to,
    subject: "รีเซ็ตรหัสผ่านบัญชี EasyPrint ของคุณ",
    html: `
      <p>คุณได้ขอรีเซ็ตรหัสผ่านสำหรับบัญชี EasyPrint นี้</p>
      <p><a href="${resetLink}">กดที่นี่เพื่อตั้งรหัสผ่านใหม่</a> (ลิงก์นี้จะหมดอายุใน 1 ชั่วโมง)</p>
      <p>หากคุณไม่ได้ร้องขอ กรุณาเพิกเฉยต่ออีเมลนี้</p>
    `,
  });
}
