// Service Template — สร้าง Default Option/ColorTier/QuantityTier ให้ตามประเภทสินค้าที่ร้านเลือก
// Template มีหน้าที่ "ตั้งค่าเริ่มต้น" เท่านั้น ไม่ได้ล็อก logic ใดๆ — ร้านค้าแก้ไข/เพิ่ม/ลบ Option และราคาได้ทั้งหมดหลังจากนั้น
// ไม่ผูกกับ "งานเอกสาร" อย่างเดียวตามสเปก — รองรับป้ายไวนิล/โปสเตอร์/สติ๊กเกอร์/นามบัตร/Roll Up/X-Stand ด้วย
import type { ColorTier, OptionPriceCategory, PriceScope, QuantityTier, ServiceOption, ServiceOptionType } from "../types";
import type { PricingMode } from "./Step2Pricing";

export interface ServiceTemplate {
  id: string;
  icon: string;
  label: string;
  hint: string;
  pricingMode: PricingMode;
  // ไม่มีฟิลด์ unit — ระบบ derive หน่วยแสดงผลจาก pricingModel เองที่ ServiceBuilderWizard เสมอ (จำกัดแค่ enum ที่ backend รองรับ: แผ่น/เล่ม/ชิ้น/หน้า/งาน)
  colorTiers: ColorTier[];
  quantityTiers: QuantityTier[];
  options: ServiceOption[];
}

// ทุก template ที่มี ColorTier ต้องมี "ขาวดำ" เป็นแถวแรกเสมอ (ล็อกชื่อไว้ที่ Step3Options — ดู comment ที่นั่น)
function colorTiers(colorPrice: number, basePrice = 1): ColorTier[] {
  return [
    { label: "ขาวดำ", pricePerUnit: basePrice },
    { label: "สี", pricePerUnit: colorPrice },
  ];
}

function option(
  name: string,
  priceCategory: OptionPriceCategory,
  scope: PriceScope,
  values: { name: string; extraPrice: number }[],
  type: ServiceOptionType = "radio"
): ServiceOption {
  return {
    name,
    type,
    priceCategory,
    values: values.map((v) => ({ name: v.name, extraPrice: v.extraPrice, priceScope: scope })),
  };
}

export const SERVICE_TEMPLATES: ServiceTemplate[] = [
  {
    id: "document",
    icon: "📄",
    label: "งานเอกสาร",
    hint: "ปริ้นเอกสาร, ชีทเรียน, รายงาน — คิดตามจำนวนหน้า",
    pricingMode: "per_page",
    colorTiers: colorTiers(5, 1),
    quantityTiers: [],
    options: [
      option("ขนาดกระดาษ", "size", "per_page", [
        { name: "A4", extraPrice: 0 },
        { name: "A3", extraPrice: 2 },
      ]),
      option(
        "ประเภทกระดาษ",
        "paper",
        "per_page",
        [
          { name: "กระดาษธรรมดา", extraPrice: 0 },
          { name: "กระดาษถนอมสายตา", extraPrice: 1 },
          { name: "Photo Paper", extraPrice: 20 },
        ],
        "dropdown"
      ),
      option("รูปแบบการพิมพ์", "printing_side", "per_page", [
        { name: "หน้าเดียว", extraPrice: 0 },
        { name: "หน้าหลัง (2 ด้าน)", extraPrice: 2 },
      ]),
    ],
  },
  {
    id: "vinyl_banner",
    icon: "🖼️",
    label: "ป้ายไวนิล",
    hint: "ป้ายไวนิลหน้าร้าน, แบนเนอร์ — คิดตามตารางเมตร",
    pricingMode: "per_sqm",
    colorTiers: colorTiers(150, 150),
    quantityTiers: [],
    options: [
      option(
        "ประเภทวัสดุ",
        "other",
        "per_sqm",
        [
          { name: "ไวนิลธรรมดา", extraPrice: 0 },
          { name: "ไวนิลอย่างดี (กันน้ำ 100%)", extraPrice: 30 },
        ],
        "dropdown"
      ),
      option("การตกแต่ง", "other", "per_item", [
        { name: "พับขอบเจาะตาไก่ 4 มุม", extraPrice: 0 },
        { name: "ปล่อยชายไม่พับขอบ", extraPrice: 0 },
      ]),
      option(
        "ตัวเลือกขาตั้ง",
        "other",
        "per_item",
        [
          { name: "ไม่ใช้ขาตั้ง", extraPrice: 0 },
          { name: "ขาตั้ง X-Stand", extraPrice: 150 },
          { name: "ขาตั้ง Roll Up", extraPrice: 300 },
        ],
        "dropdown"
      ),
    ],
  },
  {
    id: "poster",
    icon: "🎨",
    label: "โปสเตอร์",
    hint: "โปสเตอร์โฆษณา, งานอีเวนต์ — คิดตามตารางเมตร",
    pricingMode: "per_sqm",
    colorTiers: colorTiers(180, 180),
    quantityTiers: [],
    options: [
      option(
        "ประเภทกระดาษ/วัสดุ",
        "other",
        "per_sqm",
        [
          { name: "กระดาษอาร์ตมัน", extraPrice: 0 },
          { name: "กระดาษโฟโต้", extraPrice: 20 },
        ],
        "dropdown"
      ),
      option("การเคลือบ", "other", "per_item", [
        { name: "ไม่เคลือบ", extraPrice: 0 },
        { name: "เคลือบด้าน", extraPrice: 50 },
      ]),
    ],
  },
  {
    id: "sticker",
    icon: "🏷️",
    label: "สติ๊กเกอร์",
    hint: "สติ๊กเกอร์ตัดรูปทรง, สติ๊กเกอร์ฉลาก — คิดตามชิ้น",
    pricingMode: "per_piece",
    colorTiers: colorTiers(5, 3),
    quantityTiers: [],
    options: [
      option(
        "วัสดุ",
        "other",
        "per_piece",
        [
          { name: "สติ๊กเกอร์กระดาษ", extraPrice: 0 },
          { name: "สติ๊กเกอร์ PVC กันน้ำ", extraPrice: 2 },
        ],
        "dropdown"
      ),
      option("รูปทรง", "other", "per_piece", [
        { name: "สี่เหลี่ยม", extraPrice: 0 },
        { name: "ตัดตามรูปทรง", extraPrice: 5 },
      ]),
      option(
        "เคลือบ",
        "other",
        "per_item",
        [
          { name: "ไม่เคลือบ", extraPrice: 0 },
          { name: "เคลือบด้าน", extraPrice: 3 },
          { name: "เคลือบเงา", extraPrice: 3 },
        ],
        "dropdown"
      ),
    ],
  },
  {
    id: "name_card",
    icon: "🪪",
    label: "นามบัตร",
    hint: "นามบัตรพนักงาน/ธุรกิจ — ราคาลดหลั่นตามจำนวน",
    pricingMode: "per_piece",
    colorTiers: colorTiers(2, 3),
    quantityTiers: [
      { minQty: 100, maxQty: 199, unitPrice: 2 },
      { minQty: 200, maxQty: 499, unitPrice: 1.75 },
      { minQty: 500, maxQty: null, unitPrice: 1.5 },
    ],
    options: [
      option(
        "ประเภทกระดาษ",
        "paper",
        "per_piece",
        [
          { name: "กระดาษมาตรฐาน 300g", extraPrice: 0 },
          { name: "การ์ดอาร์ต 300g", extraPrice: 0.5 },
          { name: "Photo Paper", extraPrice: 1 },
        ],
        "dropdown"
      ),
      option(
        "เคลือบ",
        "other",
        "per_item",
        [
          { name: "ไม่เคลือบ", extraPrice: 0 },
          { name: "เคลือบด้าน", extraPrice: 1 },
          { name: "เคลือบเงา", extraPrice: 1 },
        ],
        "dropdown"
      ),
    ],
  },
  {
    id: "roll_up",
    icon: "🎌",
    label: "Roll Up",
    hint: "ป้ายตั้งพื้น Roll Up พร้อมขาตั้ง — คิดตามชิ้น",
    pricingMode: "per_piece",
    colorTiers: colorTiers(5, 5),
    quantityTiers: [],
    options: [
      option(
        "ขนาด",
        "size",
        "per_piece",
        [
          { name: "มาตรฐาน 80x200 ซม.", extraPrice: 0 },
          { name: "ใหญ่ 100x200 ซม.", extraPrice: 200 },
        ],
        "dropdown"
      ),
      option(
        "ประเภทวัสดุ",
        "other",
        "per_piece",
        [
          { name: "ผ้าไม่ทอ", extraPrice: 0 },
          { name: "ผ้าแคนวาส", extraPrice: 150 },
        ],
        "dropdown"
      ),
      option("การเคลือบ", "other", "per_item", [
        { name: "ไม่เคลือบ", extraPrice: 0 },
        { name: "เคลือบด้าน", extraPrice: 100 },
      ]),
    ],
  },
  {
    id: "x_stand",
    icon: "🖼️",
    label: "X-Stand",
    hint: "ป้ายตั้งพื้นทรง X พร้อมขาตั้ง — คิดตามชิ้น",
    pricingMode: "per_piece",
    colorTiers: colorTiers(5, 5),
    quantityTiers: [],
    options: [
      option(
        "ขนาด",
        "size",
        "per_piece",
        [
          { name: "60x160 ซม.", extraPrice: 0 },
          { name: "80x180 ซม.", extraPrice: 100 },
        ],
        "dropdown"
      ),
      option(
        "ประเภทวัสดุ",
        "other",
        "per_piece",
        [
          { name: "กระดาษโฟม", extraPrice: 0 },
          { name: "พลาสวูด", extraPrice: 80 },
        ],
        "dropdown"
      ),
    ],
  },
];

// "กำหนดเอง" — ไม่ seed อะไรเลย ให้ร้านสร้างเองทั้งหมด (เทียบเท่าพฤติกรรมเดิมก่อนมี template)
export const BLANK_TEMPLATE: ServiceTemplate = {
  id: "blank",
  icon: "✏️",
  label: "กำหนดเอง",
  hint: "เริ่มจากบริการเปล่า ตั้งค่าทุกอย่างเอง",
  pricingMode: "per_page",
  colorTiers: [],
  quantityTiers: [],
  options: [],
};
