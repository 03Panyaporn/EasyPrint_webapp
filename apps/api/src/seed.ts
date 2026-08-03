import "./env";
import { eq } from "drizzle-orm";
import { db } from "./db";
import { orders, shops, users } from "../drizzle/schema";
import { hashPassword } from "./auth/password";
import { supabaseAdmin } from "./storage";

// สคริปต์นี้ไว้ใส่ "ออเดอร์จำลอง" ตรงลง database เพื่อทดสอบ endpoint ฝั่งร้านค้า (list/detail/เปลี่ยนสถานะ/ยกเลิก/อนุมัติสลิป)
// โดยไม่ต้องรอหน้าฟอร์มสั่งซื้อของลูกค้า (ยังไม่ได้ทำ) — รันซ้ำได้ ไม่สร้างข้อมูลซ้ำ (เช็คด้วยอีเมลก่อนสร้างทุกครั้ง)
// วิธีรัน: bun --cwd apps/api run seed

const SEED_SHOP_OWNER_EMAIL = "seed-shop@easyprint.test";
const SEED_PASSWORD = "Seed1234!"; // ใช้ทดสอบเท่านั้น ไม่ใช่บัญชีจริง

async function ensureSlipBucket() {
  const { error } = await supabaseAdmin.storage.createBucket("payment-slips", { public: false });
  if (error && !error.message.includes("already exists")) {
    console.warn("สร้าง bucket payment-slips ไม่สำเร็จ (อาจมีอยู่แล้ว):", error.message);
  }
}

async function ensureShopOwner() {
  const [existing] = await db.select().from(users).where(eq(users.email, SEED_SHOP_OWNER_EMAIL));
  if (existing) return existing;

  const [owner] = await db
    .insert(users)
    .values({
      email: SEED_SHOP_OWNER_EMAIL,
      passwordHash: await hashPassword(SEED_PASSWORD),
      role: "shop_owner",
      firstname: "ทดสอบ",
      lastname: "เจ้าของร้าน",
      phone: "080-000-0001",
    })
    .returning();
  return owner;
}

async function ensureShop(ownerId: string) {
  const [existing] = await db.select().from(shops).where(eq(shops.ownerId, ownerId));
  if (existing) return existing;

  const [shop] = await db
    .insert(shops)
    .values({
      ownerId,
      name: "ร้าน EasyPrint (seed)",
      phone: "080-000-0002",
      address: "199 หมู่ 2 ต.แม่กา อ.เมือง จ.พะเยา 56000",
      serviceTypes: ["photocopy", "color_print", "poster"],
      deliveryMethods: ["shop_delivery", "self_pickup"],
      approvalStatus: "approved", // seed ให้อนุมัติแล้วเลย เพื่อให้เรียก endpoint ออเดอร์ได้ทันที (ปกติต้องรอแอดมินอนุมัติ)
    })
    .returning();
  return shop;
}

async function ensureCustomer(email: string, firstname: string, lastname: string, phone: string) {
  const [existing] = await db.select().from(users).where(eq(users.email, email));
  if (existing) return existing;

  const [customer] = await db
    .insert(users)
    .values({
      email,
      passwordHash: await hashPassword(SEED_PASSWORD),
      role: "customer",
      firstname,
      lastname,
      phone,
    })
    .returning();
  return customer;
}

type SeedOrderInput = {
  code: string;
  ref: string;
  customerEmail: string;
  customerFirstname: string;
  customerLastname: string;
  customerPhone: string;
  serviceType: string;
  paperSize: string;
  copies: number;
  pages: number;
  selectedAddOns: string[];
  fileUrl: string;
  slipUrl: string;
  deliveryMethod: "shop_delivery" | "self_pickup";
  deliveryAddress?: string;
  priceBaht: number;
  status: "pending_review" | "accepted" | "in_progress" | "shipping" | "completed" | "cancelled";
  cancelReason?:
    | "customer_request"
    | "invalid_payment_slip"
    | "amount_mismatch"
    | "no_transfer_found"
    | "invalid_file"
    | "shop_unavailable"
    | "other";
  cancelNote?: string;
  note?: string;
  createdAt: Date;
};

// ข้อมูลอ้างอิงจาก apps/web/lib/mock-data/orders-mock.ts (ชื่อ/ราคา/รายละเอียดเดียวกัน) แต่กระจายสถานะให้หลากหลายขึ้น
// เพื่อทดสอบทั้ง filter ตามสถานะ, PATCH เปลี่ยนสถานะ (เดินหน้า), และ PATCH ยกเลิก/ปฏิเสธการชำระเงิน ได้ครบทุกเคส
const SEED_ORDERS: SeedOrderInput[] = [
  {
    code: "#0001",
    ref: "ORD-20260516-1E33",
    customerEmail: "seed-customer-1@easyprint.test",
    customerFirstname: "วรเมธ",
    customerLastname: "ทดสอบ",
    customerPhone: "085-678-9011",
    serviceType: "ถ่ายเอกสารสี",
    paperSize: "A4",
    copies: 5,
    pages: 20,
    selectedAddOns: ["เข้าเล่ม", "เคลือบ"],
    fileUrl: "https://example.com/files/order-1-worametha.pdf",
    slipUrl: "seed/slip-order-1.jpg",
    deliveryMethod: "shop_delivery",
    deliveryAddress: "หอพักแบมบู ชั้น 1 ห้อง 105 เลขที่ 45/3 ถ.พหลโยธิน ต.แม่กา อ.เมือง จ.พะเยา 56000",
    priceBaht: 250,
    status: "in_progress",
    createdAt: new Date("2026-05-16T08:50:00+07:00"),
  },
  {
    code: "#0002",
    ref: "ORD-20260516-77A0",
    customerEmail: "seed-customer-2@easyprint.test",
    customerFirstname: "เมย์",
    customerLastname: "ทดสอบ",
    customerPhone: "084-567-8902",
    serviceType: "เข้าเล่ม",
    paperSize: "A4",
    copies: 1,
    pages: 1,
    selectedAddOns: ["เข้าเล่มรายงาน"],
    fileUrl: "https://example.com/files/order-2-may.pdf",
    slipUrl: "seed/slip-order-2.jpg",
    deliveryMethod: "self_pickup",
    priceBaht: 40,
    status: "accepted",
    createdAt: new Date("2026-05-16T09:20:00+07:00"),
  },
  {
    code: "#0003",
    ref: "ORD-20260516-4D77",
    customerEmail: "seed-customer-3@easyprint.test",
    customerFirstname: "ปาณิชา",
    customerLastname: "ทดสอบ",
    customerPhone: "083-456-7893",
    serviceType: "ถ่ายเอกสารขาว-ดำ",
    paperSize: "A4",
    copies: 2,
    pages: 40,
    selectedAddOns: [],
    fileUrl: "https://example.com/files/order-3-panicha.pdf",
    slipUrl: "seed/slip-order-3.jpg",
    deliveryMethod: "shop_delivery",
    deliveryAddress: "หอพักอินฟินิต ชั้น 4 ห้อง 410 เลขที่ 22/8 ถ.มหาวิทยาลัย ต.แม่กา อ.เมือง จ.พะเยา 56000",
    priceBaht: 15,
    status: "pending_review",
    note: "รบกวนพิมพ์หน้า-หลังด้วยค่ะ ไม่งั้นกระดาษไม่พอ",
    createdAt: new Date("2026-05-16T09:30:00+07:00"),
  },
  {
    code: "#0004",
    ref: "ORD-20260516-9C41",
    customerEmail: "seed-customer-4@easyprint.test",
    customerFirstname: "วสิ",
    customerLastname: "ทดสอบ",
    customerPhone: "082-345-6784",
    serviceType: "เคลือบ",
    paperSize: "A4",
    copies: 1,
    pages: 1,
    selectedAddOns: ["เคลือบด้าน"],
    fileUrl: "https://example.com/files/order-4-wasi.jpg",
    slipUrl: "seed/slip-order-4.jpg",
    deliveryMethod: "self_pickup",
    priceBaht: 35,
    status: "pending_review",
    createdAt: new Date("2026-05-16T09:45:00+07:00"),
  },
  {
    code: "#0005",
    ref: "ORD-20260516-B0F2",
    customerEmail: "seed-customer-5@easyprint.test",
    customerFirstname: "ญัฐพล",
    customerLastname: "ทดสอบ",
    customerPhone: "081-234-5671",
    serviceType: "ถ่ายเอกสารขาว-ดำ",
    paperSize: "A4",
    copies: 3,
    pages: 75,
    selectedAddOns: ["เข้าเล่ม", "เคลือบ"],
    fileUrl: "https://example.com/files/order-5-nattapon.pdf",
    slipUrl: "seed/slip-order-5.jpg",
    deliveryMethod: "shop_delivery",
    deliveryAddress: "หอพัก UP Dorm ชั้น 3 ห้อง 305 เลขที่ 99/15 ถ.พหลโยธิน ต.แม่กา อ.เมือง จ.พะเยา 56000",
    priceBaht: 120,
    status: "pending_review",
    note: "ช่วยเข้าเล่มให้แน่นหน่อยนะคะ จะใช้ส่งอาจารย์",
    createdAt: new Date("2026-05-16T10:30:00+07:00"),
  },
  {
    code: "#0006",
    ref: "ORD-20260514-D8A2",
    customerEmail: "seed-customer-6@easyprint.test",
    customerFirstname: "พิมพ์ใจ",
    customerLastname: "ทดสอบ",
    customerPhone: "086-789-0123",
    serviceType: "พิมพ์โปสเตอร์",
    paperSize: "A3",
    copies: 1,
    pages: 2,
    selectedAddOns: [],
    fileUrl: "https://example.com/files/order-6-pimjai.jpg",
    slipUrl: "seed/slip-order-6.jpg",
    deliveryMethod: "shop_delivery",
    deliveryAddress: "หอพักดอกบัว ชั้น 2 ห้อง 203 เลขที่ 12/7 ถ.มหาวิทยาลัย ต.แม่กา อ.เมือง จ.พะเยา 56000",
    priceBaht: 90,
    status: "cancelled",
    cancelReason: "amount_mismatch",
    cancelNote: "ยอดโอนน้อยกว่ายอดที่ต้องชำระ 20 บาท",
    createdAt: new Date("2026-05-14T15:40:00+07:00"),
  },
];

async function main() {
  await ensureSlipBucket();

  const owner = await ensureShopOwner();
  const shop = await ensureShop(owner.id);
  console.log(`ร้าน seed: ${shop.name} (${shop.id})`);

  for (const seedOrder of SEED_ORDERS) {
    const [existing] = await db.select().from(orders).where(eq(orders.ref, seedOrder.ref));
    if (existing) {
      console.log(`ข้าม ${seedOrder.code} — มีอยู่แล้ว`);
      continue;
    }

    const customer = await ensureCustomer(
      seedOrder.customerEmail,
      seedOrder.customerFirstname,
      seedOrder.customerLastname,
      seedOrder.customerPhone
    );

    await db.insert(orders).values({
      shopId: shop.id,
      customerId: customer.id,
      code: seedOrder.code,
      ref: seedOrder.ref,
      serviceType: seedOrder.serviceType,
      pages: seedOrder.pages,
      copies: seedOrder.copies,
      paperSize: seedOrder.paperSize,
      selectedAddOns: seedOrder.selectedAddOns,
      fileUrl: seedOrder.fileUrl,
      slipUrl: seedOrder.slipUrl,
      slipUploadedAt: seedOrder.createdAt,
      deliveryMethod: seedOrder.deliveryMethod,
      subtotal: String(seedOrder.priceBaht),
      totalPrice: seedOrder.priceBaht,
      status: seedOrder.status,
      cancelReason: seedOrder.cancelReason,
      cancelNote: seedOrder.cancelNote,
      note: seedOrder.note,
      createdAt: seedOrder.createdAt,
    });
    console.log(`สร้าง ${seedOrder.code} (${seedOrder.customerFirstname}) — ${seedOrder.status}`);
  }

  console.log("\nเสร็จแล้ว ทดสอบด้วย:");
  console.log(`  GET http://localhost:4000/shops/${shop.id}/orders`);
  console.log(`  (ต้อง login เป็น ${SEED_SHOP_OWNER_EMAIL} / ${SEED_PASSWORD} ก่อน ถึงจะผ่าน requireShopOwner)`);

  process.exit(0);
}

main().catch((err) => {
  console.error("seed ล้มเหลว:", err);
  process.exit(1);
});
