"use client";

import { Check } from "lucide-react";
import { SERVICE_TEMPLATES, BLANK_TEMPLATE, type ServiceTemplate } from "./serviceTemplates";

// Phase 1 ของแผน "Option B — Template/Presets": ยกระดับการเลือก Service Template จากปุ่มเสริมเล็กๆ ใน
// Step1BasicInfo ให้เป็นจุดเริ่มต้นของ flow ทั้งหมด (ก่อนเข้า Step 1) — เพื่อให้ร้านค้าที่ขายบริการซับซ้อน
// (ป้ายไวนิล/นามบัตร/สติ๊กเกอร์) ได้โครงสร้างราคา+ตัวเลือกที่ถูกต้องตาม business rule มาให้ทันที แค่ปรับตัวเลข
// (ดู serviceTemplates.ts) แทนที่จะต้องมาสร้าง Option เองทั้งหมดใน Step 3 — เป็นแค่ค่าเริ่มต้น แก้ไข/เพิ่ม/ลบได้
// ทั้งหมดในขั้นตอนถัดไป ไม่ได้ล็อก logic ใดๆ

interface TemplatePickerProps {
  onSelect: (template: ServiceTemplate) => void;
  onBack: () => void;
}

// ตัวอย่างราคาเริ่มต้นบนการ์ด (Phase 3 ของแผน Option B) — ใช้ราคา "ขาวดำ"/แถวฐานของ colorTiers ที่ seed ไว้ในตัว
// template ตรงๆ (แถวแรกเสมอ ดู comment ที่ colorTiers() ใน serviceTemplates.ts) แค่ให้ร้านเห็นสเกลราคาคร่าวๆ
// ก่อนเลือก ไม่ใช่ราคาตลาดจริงที่ยืนยันแล้ว — ร้านต้องปรับให้ตรงต้นทุนตัวเองเสมอในขั้นตอนถัดไป
// หน่วยที่โชว์ตรงกับ unit ที่ ServiceBuilderWizard.buildServiceInput() จะบันทึกจริงเป๊ะ (per_page→หน้า, per_sqm→แผ่น, อื่นๆ→ชิ้น)
// กันไม่ให้ตัวเลขที่โชว์ตรงนี้กับหน้า /shop/services หลังบันทึกจริงดูขัดกัน
function formatStartingPrice(tpl: ServiceTemplate): string | null {
  if (tpl.id === "blank") return null;
  const basePrice = tpl.colorTiers[0]?.pricePerUnit;
  if (basePrice == null) return null;
  const unit = tpl.pricingMode === "per_page" ? "หน้า" : tpl.pricingMode === "per_sqm" ? "แผ่น" : "ชิ้น";
  return `เริ่มต้น ฿${basePrice}/${unit}`;
}

export default function TemplatePicker({ onSelect, onBack }: TemplatePickerProps) {
  const templates = [...SERVICE_TEMPLATES, BLANK_TEMPLATE];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900">เลือกประเภทบริการ</h2>
        <p className="text-sm text-gray-500 mt-1">
          เลือกประเภทที่ใกล้เคียงบริการของร้านที่สุด ระบบจะตั้งค่าตัวเลือก/ระดับสี/ราคาเริ่มต้นให้ทันที —
          ปรับแก้ เพิ่ม หรือลบได้ทั้งหมดในขั้นตอนถัดไป
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {templates.map((tpl) => {
          const Icon = tpl.icon;
          const isBlank = tpl.id === "blank";
          const startingPrice = formatStartingPrice(tpl);
          return (
            <button
              key={tpl.id}
              type="button"
              onClick={() => onSelect(tpl)}
              className={`relative flex flex-col items-start gap-2 p-4 rounded-2xl border-2 text-left transition-all ${
                isBlank
                  ? "border-dashed border-gray-300 bg-gray-50 hover:border-orange-300 hover:bg-orange-50/30"
                  : "border-gray-200 bg-white hover:border-orange-300 hover:bg-orange-50/30 hover:shadow-sm"
              }`}
            >
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  isBlank ? "bg-gray-200 text-gray-500" : "bg-orange-50 text-orange-500"
                }`}
              >
                <Icon size={20} strokeWidth={1.75} />
              </div>
              <div>
                <p className="text-sm font-bold text-gray-800">{tpl.label}</p>
                <p className="text-xs text-gray-400 mt-0.5 leading-snug">{tpl.hint}</p>
                {startingPrice && (
                  <p className="text-xs font-semibold text-orange-500 mt-1.5">{startingPrice}</p>
                )}
              </div>
            </button>
          );
        })}
      </div>

      <div className="flex items-center gap-2 text-xs text-gray-400 pt-1">
        <Check size={13} className="text-orange-400 shrink-0" />
        <span>เลือกแล้วเปลี่ยนใจได้ — กลับมาแก้วิธีคิดราคาใหม่ในขั้นตอนถัดไปได้เสมอ</span>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-100">
        <button
          onClick={onBack}
          className="px-5 py-2.5 text-sm font-medium text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 transition"
        >
          ยกเลิก
        </button>
      </div>
    </div>
  );
}
