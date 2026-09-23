// Service Template — สร้าง Default Option/ColorTier/QuantityTier ให้ตามประเภทสินค้าที่ร้านเลือก
// Template มีหน้าที่ "ตั้งค่าเริ่มต้น" เท่านั้น ไม่ได้ล็อก logic ใดๆ — ร้านค้าแก้ไข/เพิ่ม/ลบ Option และราคาได้ทั้งหมดหลังจากนั้น
// ไม่ผูกกับ "งานเอกสาร" อย่างเดียวตามสเปก — รองรับป้ายไวนิล/โปสเตอร์/สติ๊กเกอร์/นามบัตร/Roll Up/X-Stand ด้วย
import type { LucideIcon } from "lucide-react";
import {
  FileText,
  Image,
  Palette,
  Tag,
  CreditCard,
  Flag,
  PanelTop,
  PencilLine,
  BookOpen,
  Layers,
  Scissors,
  Circle,
  Paperclip,
  Ruler,
  Newspaper,
  ScanLine,
} from "lucide-react";
import type { ColorTier, OptionPriceCategory, PriceScope, QuantityTier, ServiceOption, ServiceOptionType } from "../types";
import type { PricingMode } from "./Step2Pricing";

export interface ServiceTemplate {
  id: string;
  icon: LucideIcon;
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
    icon: FileText,
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
    icon: Image,
    label: "ป้ายไวนิล",
    hint: "ป้ายไวนิลหน้าร้าน, แบนเนอร์ — คิดตามตารางเมตร",
    pricingMode: "per_sqm",
    colorTiers: colorTiers(150, 150),
    quantityTiers: [],
    options: [
      option(
        "ขนาด",
        "size",
        "per_item",
        [
          { name: "กรอกขนาดเอง (กว้าง x สูง)", extraPrice: 0 },
          { name: "A3 (มาตรฐาน)", extraPrice: 0 },
          { name: "A2 (มาตรฐาน)", extraPrice: 50 },
          { name: "A1 (มาตรฐาน)", extraPrice: 120 },
        ],
        "dropdown"
      ),
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
    icon: Palette,
    label: "โปสเตอร์",
    hint: "โปสเตอร์โฆษณา, งานอีเวนต์ — คิดตามตารางเมตร",
    pricingMode: "per_sqm",
    colorTiers: colorTiers(180, 180),
    quantityTiers: [],
    options: [
      option(
        "ขนาด",
        "size",
        "per_item",
        [
          { name: "กรอกขนาดเอง (กว้าง x สูง)", extraPrice: 0 },
          { name: "A3 (มาตรฐาน)", extraPrice: 0 },
          { name: "A2 (มาตรฐาน)", extraPrice: 30 },
        ],
        "dropdown"
      ),
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
    icon: Tag,
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
    icon: CreditCard,
    label: "นามบัตร",
    hint: "นามบัตรพนักงาน/ธุรกิจ — ราคาลดหลั่นตามจำนวน",
    pricingMode: "per_piece",
    colorTiers: colorTiers(3, 2),
    quantityTiers: [
      { minQty: 100, maxQty: 199, unitPrice: 2.5 },
      { minQty: 200, maxQty: 499, unitPrice: 2.25 },
      { minQty: 500, maxQty: 999, unitPrice: 1.8 },
      { minQty: 1000, maxQty: null, unitPrice: 1.6 },
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
    icon: Flag,
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
    icon: PanelTop,
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
  // ── เพิ่มจาก Phase 3 (ทบทวนความครอบคลุมของ template เทียบกับ shopServiceTypeSchema 16 ตัวเลือกตอนสมัครร้าน
  // ใน packages/shared/src/schemas/auth.ts) — ก่อนหน้านี้มีแค่ 7 template ครอบคลุมแค่ 8/16 ประเภท เพิ่ม 8 อันนี้ให้ครบ
  // ทุกตัวยังเป็นแค่ "ค่าเริ่มต้น" ไม่ใช่ราคาตลาดจริงที่ยืนยันแล้ว — ร้านต้องปรับตัวเลขให้ตรงต้นทุนตัวเองเสมอ
  {
    id: "scan",
    icon: ScanLine,
    label: "สแกนเอกสาร",
    hint: "สแกนเอกสารเป็นไฟล์ PDF/JPG — คิดตามจำนวนหน้า",
    pricingMode: "per_page",
    colorTiers: colorTiers(2, 1),
    quantityTiers: [],
    options: [],
  },
  {
    id: "binding",
    icon: BookOpen,
    label: "เข้าเล่ม",
    hint: "เข้าเล่มรายงาน สันกาว/สันห่วง/สันเกลียว — คิดตามเล่ม",
    pricingMode: "per_piece",
    // บริการเข้าเล่มไม่มีมิติ "สี" จริงๆ — seed แค่แถวฐาน "ขาวดำ" แถวเดียว (ไม่เพิ่ม "สี") ราคานี้คือค่าเข้าเล่มต่อเล่ม
    colorTiers: [{ label: "ขาวดำ", pricePerUnit: 20 }],
    quantityTiers: [],
    options: [
      option(
        "ประเภทสัน",
        "other",
        "per_piece",
        [
          { name: "สันกาว", extraPrice: 0 },
          { name: "สันห่วง", extraPrice: 5 },
          { name: "สันเกลียว", extraPrice: 10 },
        ],
        "dropdown"
      ),
    ],
  },
  {
    id: "lamination",
    icon: Layers,
    label: "เคลือบเอกสาร",
    hint: "เคลือบมัน/เคลือบด้าน กันน้ำกันฝุ่น — คิดตามแผ่น",
    pricingMode: "per_piece",
    colorTiers: [{ label: "ขาวดำ", pricePerUnit: 5 }],
    quantityTiers: [],
    options: [
      option(
        "ประเภทการเคลือบ",
        "other",
        "per_piece",
        [
          { name: "เคลือบมัน", extraPrice: 0 },
          { name: "เคลือบด้าน", extraPrice: 0 },
        ],
        "dropdown"
      ),
      option(
        "ขนาด",
        "size",
        "per_piece",
        [
          { name: "A4", extraPrice: 0 },
          { name: "A3", extraPrice: 5 },
        ],
        "radio"
      ),
    ],
  },
  {
    id: "cutting",
    icon: Scissors,
    label: "ตัดกระดาษ",
    hint: "ตัดกระดาษตามขนาดที่ต้องการ — คิดตามครั้ง",
    pricingMode: "per_piece",
    colorTiers: [{ label: "ขาวดำ", pricePerUnit: 2 }],
    quantityTiers: [],
    options: [],
  },
  {
    id: "hole_punch",
    icon: Circle,
    label: "เจาะรู",
    hint: "เจาะรูเอกสารสำหรับใส่แฟ้ม — คิดตามครั้ง",
    pricingMode: "per_piece",
    colorTiers: [{ label: "ขาวดำ", pricePerUnit: 1 }],
    quantityTiers: [],
    options: [],
  },
  {
    id: "stapling",
    icon: Paperclip,
    label: "เย็บเอกสาร",
    hint: "เย็บมุม/เย็บกลาง — คิดตามครั้ง",
    pricingMode: "per_piece",
    colorTiers: [{ label: "ขาวดำ", pricePerUnit: 1 }],
    quantityTiers: [],
    options: [],
  },
  {
    id: "blueprint",
    icon: Ruler,
    label: "พิมพ์แบบแปลน",
    hint: "พิมพ์แบบแปลนก่อสร้าง/แบบวิศวกรรม — คิดตามตารางเมตร",
    pricingMode: "per_sqm",
    colorTiers: colorTiers(80, 60),
    quantityTiers: [],
    options: [
      option(
        "ประเภทกระดาษ",
        "other",
        "per_sqm",
        [
          { name: "กระดาษปอนด์", extraPrice: 0 },
          { name: "กระดาษไข (Tracing)", extraPrice: 15 },
        ],
        "dropdown"
      ),
    ],
  },
  {
    id: "flyer",
    icon: Newspaper,
    label: "ใบปลิว / โบรชัวร์",
    hint: "ใบปลิวโฆษณา, โบรชัวร์พับ — ราคาลดหลั่นตามจำนวน",
    pricingMode: "per_piece",
    colorTiers: colorTiers(3, 1),
    quantityTiers: [
      { minQty: 100, maxQty: 499, unitPrice: 2 },
      { minQty: 500, maxQty: 999, unitPrice: 1.5 },
      { minQty: 1000, maxQty: null, unitPrice: 1 },
    ],
    options: [
      option(
        "ประเภทกระดาษ",
        "paper",
        "per_piece",
        [
          { name: "กระดาษปอนด์ 80 แกรม", extraPrice: 0 },
          { name: "กระดาษอาร์ตมัน 120 แกรม", extraPrice: 0.5 },
        ],
        "dropdown"
      ),
      option("การพับ", "other", "per_item", [
        { name: "ไม่พับ", extraPrice: 0 },
        { name: "พับ 2 ตอน", extraPrice: 0.5 },
        { name: "พับ 3 ตอน", extraPrice: 0.5 },
      ], "dropdown"),
    ],
  },
];

// "กำหนดเอง" — ไม่ seed อะไรเลย ให้ร้านสร้างเองทั้งหมด (เทียบเท่าพฤติกรรมเดิมก่อนมี template)
export const BLANK_TEMPLATE: ServiceTemplate = {
  id: "blank",
  icon: PencilLine,
  label: "กำหนดเอง",
  hint: "เริ่มจากบริการเปล่า ตั้งค่าทุกอย่างเอง",
  pricingMode: "per_page",
  colorTiers: [],
  quantityTiers: [],
  options: [],
};
