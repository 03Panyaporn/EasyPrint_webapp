// เครื่องคำนวณราคากลาง — ห้ามมี logic คำนวณราคาชุดที่สองที่อาจ drift กันที่อื่นในระบบ (สเปก §6)
// ฟังก์ชันทั้งหมดในไฟล์นี้เป็น pure function ไม่แตะ DB เอง เพื่อให้ทั้ง cart.ts (ตอนนี้) และ order checkout (เฟสถัดไป) เรียกใช้ร่วมกันได้

export type PricingModel = "per_page" | "per_piece" | "per_sqm" | "fixed";
export type PriceScope = "per_item" | "per_page" | "per_piece" | "per_sqm";
export type PageCountingMode = "by_file_page" | "by_sheet";

export interface QuantityTierRule {
  minQty: number;
  maxQty: number | null; // null = ไม่จำกัด
  unitPrice: number;
}

export interface ScopedAmount {
  scope: PriceScope;
  amount: number;
}

// by_sheet = พิมพ์สองหน้า ปัดขึ้นครึ่งหนึ่งเสมอ (11 หน้า → 6 แผ่น) ห้ามปัดลง
export function countBilledPages(rawPageCount: number, mode: PageCountingMode): number {
  return mode === "by_sheet" ? Math.ceil(rawPageCount / 2) : rawPageCount;
}

// billed_area = ปัดขึ้นเป็นหน่วย roundingIncrement เสมอ แล้วบังคับขั้นต่ำ minArea (ถ้ามี)
export function computeBilledArea(
  widthCm: number,
  heightCm: number,
  minArea: number | undefined,
  roundingIncrement: number
): number {
  const rawAreaSqm = (widthCm / 100) * (heightCm / 100);
  // ปัดเศษทศนิยมก่อน ceil กันปัญหา floating point (เช่น 0.1+0.2 = 0.30000000000000004)
  const roundedRatio = Math.ceil(Number((rawAreaSqm / roundingIncrement).toFixed(6)));
  const billed = roundedRatio * roundingIncrement;
  return Math.max(Number(billed.toFixed(6)), minArea ?? 0);
}

// หา QuantityTier ที่ quantity ตกอยู่ในช่วง — คืน undefined ถ้าไม่มี tier ไหนครอบคลุม/ไม่มี tier เลย
export function findQuantityTierUnitPrice(quantity: number, tiers: QuantityTierRule[]): number | undefined {
  const match = tiers.find((t) => quantity >= t.minQty && (t.maxQty == null || quantity <= t.maxQty));
  return match?.unitPrice;
}

export function sumByScope(deltas: ScopedAmount[], scope: PriceScope): number {
  return deltas.reduce((sum, d) => (d.scope === scope ? sum + d.amount : sum), 0);
}

export interface CalculateLineItemInput {
  pricingModel: PricingModel;
  basePrice: number; // ราคาขาวดำ/ค่าเริ่มต้น — ใช้เมื่อไม่มี ColorTier/QuantityTier ที่ match
  colorTierPricePerUnit?: number; // ราคาต่อหน่วยแบบเบ็ดเสร็จของ ColorTier ที่ลูกค้าเลือก (ถ้ามี) — ไม่บวกกับ basePrice
  quantity: number; // per_piece = จำนวนชิ้น, แบบอื่น = จำนวนชุด/สำเนา
  pageCountingMode?: PageCountingMode; // ใช้เมื่อ pricingModel = per_page
  rawPageCount?: number; // จำนวนหน้าไฟล์จริงที่นับได้ฝั่ง server — ใช้เมื่อ pricingModel = per_page
  widthCm?: number; // ใช้เมื่อ pricingModel = per_sqm
  heightCm?: number; // ใช้เมื่อ pricingModel = per_sqm
  minArea?: number; // ใช้เมื่อ pricingModel = per_sqm
  areaRoundingIncrement?: number; // ใช้เมื่อ pricingModel = per_sqm
  quantityTiers?: QuantityTierRule[]; // ใช้เมื่อ pricingModel = per_piece
  optionDeltas: ScopedAmount[]; // ผลรวม price_delta ของ OptionValue ที่ลูกค้าเลือก แยกตาม price_scope แล้ว
  addOnCharges: ScopedAmount[]; // ผลรวมราคาบริการเสริมที่เลือก แยกตาม scope ของ AddOnService แล้ว
}

export interface CalculateLineItemResult {
  billedPages?: number;
  billedArea?: number;
  baseUnitRate: number;
  perCopyAmount: number; // ราคาต่อ 1 ชุด/ชิ้น (รวม option/addon ที่ scope ตรงกับหน่วยคิดราคาของ pricing model นี้แล้ว)
  perItemFlat: number; // ผลรวม delta ที่ price_scope = per_item — บวกครั้งเดียว ไม่คูณอะไรเลย
  lineTotal: number;
}

// สูตรตาม §4.1: perCopyAmount × quantity + perItemFlat (ไม่คูณ quantity) เสมอทุก pricing model
// quantity หมายถึง "จำนวนชิ้น" สำหรับ per_piece หรือ "จำนวนชุด/สำเนา" สำหรับ per_page/per_sqm/fixed (รักษา UX เดิมของระบบที่สั่งพิมพ์เอกสารหลายชุดได้)
export function calculateLineItem(input: CalculateLineItemInput): CalculateLineItemResult {
  const optionDeltas = input.optionDeltas ?? [];
  const addOnCharges = input.addOnCharges ?? [];
  const perItemFlat = sumByScope(optionDeltas, "per_item") + sumByScope(addOnCharges, "per_item");

  if (input.pricingModel === "per_page") {
    const billedPages = countBilledPages(input.rawPageCount ?? 0, input.pageCountingMode ?? "by_file_page");
    const baseUnitRate = input.colorTierPricePerUnit ?? input.basePrice;
    const perPageSum = sumByScope(optionDeltas, "per_page") + sumByScope(addOnCharges, "per_page");
    const perCopyAmount = (baseUnitRate + perPageSum) * billedPages;
    return { billedPages, baseUnitRate, perCopyAmount, perItemFlat, lineTotal: perCopyAmount * input.quantity + perItemFlat };
  }

  if (input.pricingModel === "per_piece") {
    // QuantityTier (ถ้ามีและ match) เป็นตัวกำหนด base rate แทน ColorTier/basePrice ไปเลย — ไม่ผสมกัน (ดู assumption ใน plan)
    const tierRate = input.quantityTiers?.length ? findQuantityTierUnitPrice(input.quantity, input.quantityTiers) : undefined;
    const baseUnitRate = tierRate ?? input.colorTierPricePerUnit ?? input.basePrice;
    const perPieceSum = sumByScope(optionDeltas, "per_piece") + sumByScope(addOnCharges, "per_piece");
    const perCopyAmount = baseUnitRate + perPieceSum;
    return { baseUnitRate, perCopyAmount, perItemFlat, lineTotal: perCopyAmount * input.quantity + perItemFlat };
  }

  if (input.pricingModel === "per_sqm") {
    const billedArea = computeBilledArea(input.widthCm ?? 0, input.heightCm ?? 0, input.minArea, input.areaRoundingIncrement ?? 0.1);
    const baseUnitRate = input.colorTierPricePerUnit ?? input.basePrice;
    const perSqmSum = sumByScope(optionDeltas, "per_sqm") + sumByScope(addOnCharges, "per_sqm");
    const perCopyAmount = (baseUnitRate + perSqmSum) * billedArea;
    return { billedArea, baseUnitRate, perCopyAmount, perItemFlat, lineTotal: perCopyAmount * input.quantity + perItemFlat };
  }

  // fixed — เหมาจ่ายทั้งงาน ไม่มีหน่วยให้คูณ, มีแค่ per_item delta ที่ schema อนุญาต
  const baseUnitRate = input.colorTierPricePerUnit ?? input.basePrice;
  return { baseUnitRate, perCopyAmount: baseUnitRate, perItemFlat, lineTotal: baseUnitRate * input.quantity + perItemFlat };
}

// allow-list ของ price_scope ต่อ pricing model อยู่ที่ @easyprint/shared (ALLOWED_PRICE_SCOPES_BY_PRICING_MODEL)
// เพราะ Zod schema ฝั่ง packages/shared ก็ต้องใช้กฎเดียวกัน — import จากที่นั่นแทนที่จะประกาศซ้ำที่นี่ กันสองฝั่ง drift กัน
