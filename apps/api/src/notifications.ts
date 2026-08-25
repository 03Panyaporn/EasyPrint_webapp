import { Resend } from "resend";

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const RESEND_FROM_EMAIL = process.env.RESEND_FROM_EMAIL ?? "EasyPrint <onboarding@resend.dev>";

const resend = RESEND_API_KEY ? new Resend(RESEND_API_KEY) : null;

// อีเมลแจ้งเตือนลูกค้ามีแค่ 3 เหตุการณ์เท่านั้น: สั่งซื้อสำเร็จ, ร้านปฏิเสธการชำระเงิน, ร้านยกเลิกงาน
// ส่วนความคืบหน้าอื่นๆ ระหว่างทาง (รับงานแล้ว/กำลังดำเนินการ/กำลังจัดส่ง/เสร็จสิ้น) ลูกค้าติดตามผ่านหน้าเว็บแทน ไม่ส่งอีเมล
// ยังไม่มีระบบแจ้งเตือนแบบ push/in-app ในโปรเจกต์นี้ — ใช้อีเมลเป็นช่องทางเดียว (เหมือน sendPasswordResetEmail ใน email.ts)

async function sendNotificationEmail(to: string, subject: string, html: string) {
  if (!resend) {
    // ยังไม่ได้ตั้งค่า RESEND_API_KEY — พิมพ์ลง console แทนตอน dev เพื่อให้ทดสอบ flow ได้โดยไม่ต้องมี API key จริง
    console.log(`[dev] แจ้งเตือนลูกค้า ${to}: ${subject}`);
    return;
  }
  await resend.emails.send({ from: RESEND_FROM_EMAIL, to, subject, html });
}

export async function notifyOrderCreated(params: {
  to: string;
  orderCode: string;
  totalPrice: number; // หน่วยบาท
}) {
  const { to, orderCode, totalPrice } = params;
  const priceBaht = totalPrice.toLocaleString("th-TH");
  await sendNotificationEmail(
    to,
    `ยืนยันคำสั่งซื้อ ${orderCode} สำเร็จ`,
    `
      <p>ร้านได้รับคำสั่งซื้อ <strong>${orderCode}</strong> ของคุณแล้ว ยอดรวม <strong>${priceBaht} บาท</strong></p>
      <p>ร้านจะตรวจสอบหลักฐานการชำระเงินและอัปเดตสถานะให้เร็วที่สุด ติดตามความคืบหน้าได้ที่หน้าเว็บ EasyPrint</p>
    `
  );
}

// kind: "reject_payment" = ร้านกดปฏิเสธการชำระเงิน (ยกเลิกตอนสถานะยังรอตรวจสอบ) / "cancel" = ร้านกดยกเลิกงาน (ยกเลิกหลังรับงานไปแล้ว)
export async function notifyOrderCancelled(params: {
  to: string;
  orderCode: string;
  kind: "reject_payment" | "cancel";
  reasonLabel: string;
}) {
  const { to, orderCode, kind, reasonLabel } = params;
  const subject =
    kind === "reject_payment"
      ? `ออเดอร์ ${orderCode} ถูกปฏิเสธการชำระเงิน`
      : `ออเดอร์ ${orderCode} ถูกยกเลิก`;
  await sendNotificationEmail(
    to,
    subject,
    `
      <p>ออเดอร์ <strong>${orderCode}</strong> ของคุณ${kind === "reject_payment" ? "ถูกปฏิเสธการชำระเงิน" : "ถูกยกเลิก"}</p>
      <p>เหตุผล: ${reasonLabel}</p>
    `
  );
}
