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

// ร้านที่สมัครใหม่เป็น pending อยู่ ไม่มีทางรู้ว่าแอดมินอนุมัติแล้วนอกจาก log in มาเช็คกระดิ่งแจ้งเตือนในแอปเอง (createNotification ใน utils/notification.ts
// แค่ insert แถวลง DB ไม่ส่งอีเมล) — เพิ่มอีเมลนี้เป็นช่องทางเชิงรุกคู่กับแจ้งเตือนในแอปเดิม เรียกจาก PATCH /admin/shops/:id/approve
export async function notifyShopApproved(params: { to: string; shopName: string; isReinstate: boolean }) {
  const { to, shopName, isReinstate } = params;
  await sendNotificationEmail(
    to,
    isReinstate ? `ร้าน "${shopName}" กลับมาเปิดให้บริการได้แล้ว` : `ร้าน "${shopName}" ผ่านการอนุมัติแล้ว!`,
    isReinstate
      ? `<p>การระงับการใช้งานร้านค้า <strong>${shopName}</strong> ถูกยกเลิกแล้ว ร้านกลับมาเปิดให้บริการได้ตามปกติ</p>`
      : `
        <p>ยินดีด้วย! ร้าน <strong>${shopName}</strong> ผ่านการตรวจสอบและพร้อมเปิดให้บริการแล้ว</p>
        <p>เข้าสู่ระบบที่เว็บ EasyPrint เพื่อตั้งค่าบริการและเริ่มรับออเดอร์ได้เลย</p>
      `
  );
}

// kind: "rejected" = ใบสมัครใหม่ไม่ผ่านการอนุมัติ / "suspended" = ร้านที่เคยอนุมัติแล้วถูกระงับทีหลัง
export async function notifyShopRejected(params: { to: string; shopName: string; reason: string }) {
  const { to, shopName, reason } = params;
  await sendNotificationEmail(
    to,
    `ใบสมัครร้าน "${shopName}" ไม่ผ่านการอนุมัติ`,
    `
      <p>ใบสมัครร้านค้า <strong>${shopName}</strong> ของคุณไม่ผ่านการตรวจสอบ</p>
      <p>เหตุผล: ${reason}</p>
    `
  );
}
