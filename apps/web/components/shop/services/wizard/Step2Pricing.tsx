"use client";

import { useState } from "react";
import { Plus, Trash2, FileText, Package, Maximize2, Hash } from "lucide-react";
import type { ColorTier, QuantityTier } from "../types";

export type PricingMode = "per_page" | "per_piece" | "per_sqm" | "quantity_tier";

export interface Step2Data {
  pricingMode: PricingMode;
  basePrice: number | "";
  minArea: number | "";
  areaRoundingIncrement: number | "";
  colorTiers: ColorTier[];
  quantityTiers: QuantityTier[];
}

const PRICING_CARDS: {
  value: PricingMode;
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  example: string;
}[] = [
  {
    value: "per_page",
    icon: <FileText size={22} />,
    title: "ต่อหน้า",
    subtitle: "คิดราคาตามจำนวนหน้าที่พิมพ์",
    example: "เอกสาร, ชีทเรียน, รายงาน",
  },
  {
    value: "per_piece",
    icon: <Package size={22} />,
    title: "ต่อชิ้น",
    subtitle: "คิดราคาตามจำนวนชิ้น/ชุด",
    example: "นามบัตร, การ์ด, สติ๊กเกอร์",
  },
  {
    value: "per_sqm",
    icon: <Maximize2 size={22} />,
    title: "ต่อตารางเมตร",
    subtitle: "ลูกค้ากรอกขนาดกว้าง × สูง",
    example: "ป้ายไวนิล, โปสเตอร์, แบนเนอร์",
  },
  {
    value: "quantity_tier",
    icon: <Hash size={22} />,
    title: "ตามจำนวน",
    subtitle: "ลูกค้าเลือกจำนวนจาก dropdown",
    example: "100 ใบ, 200 ใบ, 500 ใบ",
  },
];

interface Step2PricingProps {
  data: Step2Data;
  onChange: (data: Step2Data) => void;
  onNext: () => void;
  onBack: () => void;
}

function emptyColorTier(): ColorTier {
  return { label: "", pricePerUnit: 0 };
}

function emptyQtyTier(): QuantityTier {
  return { minQty: 0, maxQty: null, unitPrice: 0 };
}

export default function Step2Pricing({ data, onChange, onNext, onBack }: Step2PricingProps) {
  const [errors, setErrors] = useState<Record<string, string>>({});

  const update = (patch: Partial<Step2Data>) => onChange({ ...data, ...patch });

  const validate = () => {
    const errs: Record<string, string> = {};

    // per_page/per_piece: ราคาพื้นฐาน (ขาวดำ) ย้ายไปตั้งที่ Step3 (ตัวเลือกสินค้า > สี) แล้ว ไม่ต้องเช็คที่นี่

    if (data.pricingMode === "per_sqm") {
      if (data.basePrice === "" || Number(data.basePrice) <= 0)
        errs.basePrice = "กรุณากรอกราคาต่อตารางเมตร";
    }

    if (data.pricingMode === "quantity_tier") {
      if (data.quantityTiers.length === 0)
        errs.quantityTiers = "กรุณาเพิ่มอย่างน้อย 1 ตัวเลือกจำนวน";
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleNext = () => {
    if (validate()) onNext();
  };

  // ── Quantity Tier CRUD ───────────────────────
  const addQtyTier = () => {
    const last = data.quantityTiers[data.quantityTiers.length - 1];
    const newMin = last ? (typeof last.maxQty === "number" ? last.maxQty + 1 : last.minQty + 100) : 1;
    update({ quantityTiers: [...data.quantityTiers, { minQty: newMin, maxQty: null, unitPrice: 0 }] });
  };

  const updateQtyTier = (i: number, patch: Partial<QuantityTier>) => {
    const updated = data.quantityTiers.map((t, idx) => (idx === i ? { ...t, ...patch } : t));
    update({ quantityTiers: updated });
  };

  const removeQtyTier = (i: number) =>
    update({ quantityTiers: data.quantityTiers.filter((_, idx) => idx !== i) });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900">วิธีคิดราคา</h2>
        <p className="text-sm text-gray-500 mt-1">เลือกวิธีที่ร้านใช้คิดเงินลูกค้า</p>
      </div>

      {/* Pricing Mode Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {PRICING_CARDS.map((card) => {
          const selected = data.pricingMode === card.value;
          return (
            <button
              key={card.value}
              type="button"
              onClick={() => {
                update({ pricingMode: card.value });
                setErrors({});
              }}
              className={`relative flex items-start gap-4 p-4 rounded-2xl border-2 text-left transition-all duration-150 group ${
                selected
                  ? "border-orange-400 bg-orange-50 shadow-sm"
                  : "border-gray-200 bg-white hover:border-orange-200 hover:bg-orange-50/30"
              }`}
            >
              <div
                className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 transition ${
                  selected ? "bg-orange-500 text-white shadow-md shadow-orange-200" : "bg-gray-100 text-gray-400 group-hover:bg-orange-100 group-hover:text-orange-500"
                }`}
              >
                {card.icon}
              </div>
              <div className="min-w-0">
                <p className={`font-bold text-sm ${selected ? "text-orange-700" : "text-gray-800"}`}>
                  {card.title}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">{card.subtitle}</p>
                <p className={`text-xs mt-1 font-medium ${selected ? "text-orange-500" : "text-gray-400"}`}>
                  เช่น {card.example}
                </p>
              </div>
              {selected && (
                <div className="absolute top-3 right-3 w-5 h-5 bg-orange-500 rounded-full flex items-center justify-center">
                  <svg viewBox="0 0 10 10" fill="none" className="w-3 h-3">
                    <path d="M2 5l2.5 2.5L8 3" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* ── Per Page / Per Piece: ราคาพื้นฐาน (ขาวดำ) ตั้งที่ Step ถัดไปแทน ไม่ให้ตั้งซ้ำสองที่ ── */}
      {(data.pricingMode === "per_page" || data.pricingMode === "per_piece") && (
        <div className="p-4 bg-orange-50/60 rounded-2xl border border-orange-100">
          <p className="text-xs text-orange-700">
            💡 ราคาพื้นฐาน{data.pricingMode === "per_page" ? " (ขาวดำ)" : ""} ตั้งได้ในขั้นตอนถัดไป &quot;ตัวเลือกสินค้า&quot; (ส่วนสี)
          </p>
        </div>
      )}

      {/* Per-piece: quantity tiers (ไม่บังคับ) */}
      {data.pricingMode === "per_piece" && (
        <div className="p-4 bg-orange-50/60 rounded-2xl border border-orange-100 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-gray-700">ราคาตามจำนวน (ไม่บังคับ)</p>
            <button
              type="button"
              onClick={addQtyTier}
              className="flex items-center gap-1 text-xs text-orange-600 hover:text-orange-700 font-medium"
            >
              <Plus size={13} /> เพิ่ม tier
            </button>
          </div>
          {data.quantityTiers.map((tier, i) => (
            <div key={i} className="flex items-center gap-2 flex-wrap">
              <span className="text-xs text-gray-500 w-16 shrink-0">จำนวน ≥</span>
              <input
                type="number"
                min={1}
                value={tier.minQty}
                onChange={(e) => updateQtyTier(i, { minQty: Number(e.target.value) })}
                className="w-20 px-2 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/25"
              />
              <span className="text-xs text-gray-500">ชิ้น ราคา</span>
              <input
                type="number"
                min={0}
                step={0.5}
                value={tier.unitPrice}
                onChange={(e) => updateQtyTier(i, { unitPrice: Number(e.target.value) })}
                className="w-24 px-2 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/25"
              />
              <span className="text-xs text-gray-500">บาท/ชิ้น</span>
              <button onClick={() => removeQtyTier(i)} className="text-red-400 hover:text-red-600">
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* ── Per SQM ── */}
      {data.pricingMode === "per_sqm" && (
        <div className="p-4 bg-orange-50/60 rounded-2xl border border-orange-100 space-y-4">
          <h3 className="text-sm font-semibold text-orange-800">ตั้งค่าราคาตามพื้นที่</h3>
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600 w-40 shrink-0">ราคา / ตารางเมตร</span>
              <input
                type="number"
                min={0}
                step={1}
                value={data.basePrice}
                onChange={(e) => update({ basePrice: e.target.value === "" ? "" : Number(e.target.value) })}
                placeholder="150"
                className={`w-28 px-3 py-2 text-sm border rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/25 focus:border-orange-500 ${
                  errors.basePrice ? "border-red-400" : "border-gray-200"
                }`}
              />
              <span className="text-sm text-gray-500">บาท</span>
            </div>
            {errors.basePrice && <p className="text-xs text-red-500">{errors.basePrice}</p>}

            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600 w-40 shrink-0">พื้นที่ขั้นต่ำ</span>
              <input
                type="number"
                min={0}
                step={0.1}
                value={data.minArea}
                onChange={(e) => update({ minArea: e.target.value === "" ? "" : Number(e.target.value) })}
                placeholder="0.5"
                className="w-28 px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/25"
              />
              <span className="text-sm text-gray-500">ตร.ม.</span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600 w-40 shrink-0">ปัดเศษขึ้นทุก</span>
              <input
                type="number"
                min={0}
                step={0.1}
                value={data.areaRoundingIncrement}
                onChange={(e) =>
                  update({ areaRoundingIncrement: e.target.value === "" ? "" : Number(e.target.value) })
                }
                placeholder="0.1"
                className="w-28 px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/25"
              />
              <span className="text-sm text-gray-500">ตร.ม.</span>
            </div>
          </div>
        </div>
      )}

      {/* ── Quantity Tier mode ── */}
      {data.pricingMode === "quantity_tier" && (
        <div className="p-4 bg-orange-50/60 rounded-2xl border border-orange-100 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-orange-800">ตัวเลือกจำนวน</h3>
              <p className="text-xs text-orange-600 mt-0.5">ลูกค้าจะเลือกจาก dropdown ที่นี่</p>
            </div>
            <button
              type="button"
              onClick={addQtyTier}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-orange-500 hover:bg-orange-600 rounded-lg transition"
            >
              <Plus size={13} /> เพิ่มตัวเลือก
            </button>
          </div>

          {data.quantityTiers.length === 0 && (
            <p className="text-xs text-gray-400 italic">ยังไม่มีตัวเลือก กด "เพิ่มตัวเลือก" เพื่อเริ่ม</p>
          )}
          {errors.quantityTiers && (
            <p className="text-xs text-red-500">{errors.quantityTiers}</p>
          )}

          {data.quantityTiers.map((tier, i) => (
            <div
              key={i}
              className="flex items-center gap-2 flex-wrap bg-white p-3 rounded-xl border border-orange-100"
            >
              <span className="text-xs font-semibold text-gray-600 w-10 shrink-0">
                #{i + 1}
              </span>
              <input
                type="number"
                min={1}
                value={tier.minQty}
                onChange={(e) => updateQtyTier(i, { minQty: Number(e.target.value) })}
                placeholder="จำนวน"
                className="w-24 px-2 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/25"
              />
              <span className="text-xs text-gray-500">ใบ ราคา</span>
              <input
                type="number"
                min={0}
                step={1}
                value={tier.unitPrice}
                onChange={(e) => updateQtyTier(i, { unitPrice: Number(e.target.value) })}
                placeholder="ราคา"
                className="w-28 px-2 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/25"
              />
              <span className="text-xs text-gray-500">บาท</span>
              <button
                onClick={() => removeQtyTier(i)}
                className="ml-auto text-red-400 hover:text-red-600 transition"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
          <p className="text-xs text-gray-400">
            💡 ลูกค้าจะเห็นตัวเลือกเหล่านี้ใน dropdown และเลือกได้เพียงอันเดียว
          </p>
        </div>
      )}

      {/* Navigation */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-100">
        <button
          onClick={onBack}
          className="px-5 py-2.5 text-sm font-medium text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 transition"
        >
          ← ย้อนกลับ
        </button>
        <button
          onClick={handleNext}
          className="px-6 py-2.5 text-sm font-semibold bg-orange-500 hover:bg-orange-600 text-white rounded-xl shadow-md shadow-orange-200 transition"
        >
          ถัดไป →
        </button>
      </div>
    </div>
  );
}
