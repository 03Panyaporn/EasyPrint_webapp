"use client";

import { useState, useEffect } from "react";
import {
  MainService,
  AddOnService,
  AddOnPriceBinding,
  PricingModel,
  ServiceOption,
  ServiceOptionType,
  ServiceOptionValue,
  AllowedFileType,
  OptionPriceCategory,
  PriceScope,
  PageCountingMode,
  ColorTier,
  QuantityTier,
  ALLOWED_PRICE_SCOPES_BY_PRICING_MODEL,
} from "./types";
import { X, Upload, Layers, AlertCircle, Loader2, Plus, Trash2, ListPlus, Palette } from "lucide-react";
import { uploadFile } from "@/lib/api/uploads";
import { ApiError } from "@/lib/api/client";

const PRICING_MODEL_OPTIONS: { value: PricingModel; label: string; hint: string; priceLabel: string }[] = [
  { value: "per_page", label: "ต่อหน้า (Per Page)", hint: "ระบบนับจำนวนหน้าจากไฟล์ PDF ที่ลูกค้าอัปโหลดเอง", priceLabel: "ราคาต่อหน้า (บาท) — ราคาขาวดำ" },
  { value: "per_piece", label: "ต่อชิ้น (Per Piece)", hint: "คูณด้วยจำนวนชุดที่ลูกค้าสั่ง", priceLabel: "ราคาต่อชิ้น (บาท)" },
  { value: "per_sqm", label: "ต่อตารางเมตร (Per Square Meter)", hint: "ลูกค้ากรอกกว้าง/สูงเอง เช่น โปสเตอร์/ไวนิล", priceLabel: "ราคาต่อตารางเมตร (บาท) — ราคาขาวดำ" },
  { value: "fixed", label: "ราคาเหมาจ่าย (Fixed Price)", hint: "ราคาเดียวทั้งงาน ไม่คูณตามจำนวน", priceLabel: "ราคาเหมาจ่าย (บาท)" },
];

const OPTION_TYPE_LABEL: Record<ServiceOptionType, string> = {
  dropdown: "Dropdown (เลือก 1 ค่า)",
  radio: "Radio (เลือก 1 ค่า)",
  checkbox: "Checkbox (เลือกได้หลายค่า)",
  number: "Number (กรอกตัวเลข)",
  text: "Text (กรอกข้อความ)",
};

const PRICE_CATEGORY_LABEL: Record<OptionPriceCategory, string> = {
  paper: "ประเภทกระดาษ",
  printing_side: "ด้านพิมพ์ (หน้าเดียว/สองหน้า)",
  size: "ขนาด",
  other: "อื่นๆ (ไม่จำกัดจำนวน)",
};

const PRICE_SCOPE_LABEL: Record<PriceScope, string> = {
  per_item: "คงที่ต่อชิ้นงาน (ไม่คูณอะไร)",
  per_page: "คูณตามจำนวนหน้า/แผ่น",
  per_piece: "คูณตามจำนวนชิ้น",
  per_sqm: "คูณตามพื้นที่ (ตร.ม.)",
};

const FILE_TYPE_OPTIONS: { value: AllowedFileType; label: string }[] = [
  { value: "pdf", label: "PDF" },
  { value: "jpg", label: "JPG" },
  { value: "png", label: "PNG" },
  { value: "ai", label: "AI" },
  { value: "psd", label: "PSD" },
];

// ข้อความสำเร็จรูป — ลดการพิมพ์ข้อมูลซ้ำ ร้านค้าเลือกแล้วแก้ต่อได้อิสระ
const CANNED_DESCRIPTIONS: { label: string; text: string }[] = [
  { label: "งานเอกสาร", text: "พิมพ์เอกสารสีและขาวดำ รองรับไฟล์ PDF" },
  { label: "โปสเตอร์", text: "เหมาะสำหรับโปสเตอร์ งานโฆษณา และประชาสัมพันธ์" },
  { label: "ป้ายไวนิล", text: "เหมาะสำหรับป้ายหน้าร้าน งานอีเวนต์ และแบนเนอร์" },
  { label: "นามบัตร", text: "พิมพ์นามบัตรคุณภาพสูง เลือกวัสดุได้หลากหลาย" },
  { label: "สติ๊กเกอร์", text: "สติ๊กเกอร์ตัดตามรูปทรง เลือกวัสดุกันน้ำได้" },
];

function emptyOptionValue(defaultScope: PriceScope): ServiceOptionValue {
  return { name: "", extraPrice: 0, priceScope: defaultScope };
}

interface AddServiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveMain: (service: MainService) => void;
  onSaveAddOn: (addOn: AddOnService) => void;
  allAddOnServices: AddOnService[];
  allMainServices: MainService[];
  editingMainService?: MainService | null;
  editingAddOnService?: AddOnService | null;
  defaultType?: "main" | "addon";
}

// แก้ไข/เพิ่มตัวเลือกบริการ 1 รายการ (dropdown/radio/checkbox/number/text) — จัดการ draft ค่าย่อยของตัวเองภายในนี้
function OptionEditor({
  option,
  pricingModel,
  siblingCategoryUsed,
  onChange,
  onRemove,
}: {
  option: ServiceOption;
  pricingModel: PricingModel; // ใช้จำกัด price_scope ที่เลือกได้ต่อค่า ตาม §4.3
  siblingCategoryUsed: (category: OptionPriceCategory) => boolean; // true ถ้าตัวเลือกอื่นในบริการนี้ใช้หมวดนี้อยู่แล้ว
  onChange: (o: ServiceOption) => void;
  onRemove: () => void;
}) {
  const allowedScopes = ALLOWED_PRICE_SCOPES_BY_PRICING_MODEL[pricingModel];
  const [draftValueName, setDraftValueName] = useState("");
  const [draftValuePrice, setDraftValuePrice] = useState<number | "">(0);
  const [draftValueScope, setDraftValueScope] = useState<PriceScope>(allowedScopes[0]);
  const [valueError, setValueError] = useState("");

  const needsValues = option.type === "dropdown" || option.type === "radio" || option.type === "checkbox";
  const categoryConflict = option.priceCategory !== "other" && siblingCategoryUsed(option.priceCategory);

  const handleTypeChange = (type: ServiceOptionType) => {
    const stillNeedsValues = type === "dropdown" || type === "radio" || type === "checkbox";
    onChange({ ...option, type, values: stillNeedsValues ? option.values : [] });
  };

  const addValue = () => {
    const name = draftValueName.trim();
    if (!name) {
      setValueError("กรุณากรอกชื่อค่าตัวเลือก");
      return;
    }
    if (draftValuePrice === "" || Number(draftValuePrice) < 0) {
      setValueError("ราคาเพิ่มต้องเป็น 0 บาทขึ้นไป");
      return;
    }
    if (option.values.some((v) => v.name.trim().toLowerCase() === name.toLowerCase())) {
      setValueError(`มีค่า "${name}" อยู่แล้ว`);
      return;
    }
    onChange({ ...option, values: [...option.values, { name, extraPrice: Number(draftValuePrice), priceScope: draftValueScope }] });
    setDraftValueName("");
    setDraftValuePrice(0);
    setValueError("");
  };

  const removeValue = (index: number) => {
    onChange({ ...option, values: option.values.filter((_, i) => i !== index) });
  };

  const updateValueScope = (index: number, priceScope: PriceScope) => {
    onChange({ ...option, values: option.values.map((v, i) => (i === index ? { ...v, priceScope } : v)) });
  };

  return (
    <div className="p-3 bg-gray-50 rounded-xl border border-gray-100 space-y-2.5">
      <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto_auto_auto] gap-2 items-center">
        <input
          type="text"
          placeholder="ชื่อตัวเลือก เช่น ประเภทกระดาษ, ด้านพิมพ์, ขนาด"
          value={option.name}
          onChange={(e) => onChange({ ...option, name: e.target.value })}
          className="px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/25 focus:border-orange-500 bg-white"
        />
        <select
          value={option.type}
          onChange={(e) => handleTypeChange(e.target.value as ServiceOptionType)}
          className="px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/25 focus:border-orange-500 bg-white"
        >
          {(Object.keys(OPTION_TYPE_LABEL) as ServiceOptionType[]).map((t) => (
            <option key={t} value={t}>
              {OPTION_TYPE_LABEL[t]}
            </option>
          ))}
        </select>
        <select
          value={option.priceCategory}
          onChange={(e) => onChange({ ...option, priceCategory: e.target.value as OptionPriceCategory })}
          className={`px-3 py-2 text-xs border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/25 focus:border-orange-500 bg-white ${
            categoryConflict ? "border-red-300" : "border-gray-200"
          }`}
          title="หมวดราคา — กันสร้างตัวเลือกที่ทำหน้าที่ซ้ำกัน"
        >
          {(Object.keys(PRICE_CATEGORY_LABEL) as OptionPriceCategory[]).map((c) => (
            <option key={c} value={c}>
              {PRICE_CATEGORY_LABEL[c]}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={onRemove}
          className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition"
          title="ลบตัวเลือกนี้"
        >
          <Trash2 size={14} />
        </button>
      </div>
      {categoryConflict && (
        <p className="text-[11px] text-red-500 flex items-center gap-1 pl-1">
          <AlertCircle size={11} /> มีตัวเลือกอื่นใช้หมวด "{PRICE_CATEGORY_LABEL[option.priceCategory]}" อยู่แล้ว — กรุณาเพิ่มค่าใหม่ใต้ตัวเลือกเดิมแทน
        </p>
      )}

      {needsValues ? (
        <div className="pl-1 space-y-2">
          <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto_auto_auto] gap-2 items-center">
            <input
              type="text"
              placeholder="ค่า เช่น A4, กระดาษ 80 แกรม"
              value={draftValueName}
              onChange={(e) => setDraftValueName(e.target.value)}
              className="px-3 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/25 focus:border-orange-500 bg-white"
            />
            <input
              type="number"
              min="0"
              step="0.5"
              placeholder="ราคาเพิ่ม (บาท)"
              value={draftValuePrice}
              onChange={(e) => setDraftValuePrice(e.target.value === "" ? "" : Number(e.target.value))}
              className="w-28 px-3 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/25 focus:border-orange-500 bg-white"
            />
            <select
              value={draftValueScope}
              onChange={(e) => setDraftValueScope(e.target.value as PriceScope)}
              className="px-2 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/25 focus:border-orange-500 bg-white"
              title="ขอบเขตการคูณราคาเพิ่มนี้"
            >
              {allowedScopes.map((s) => (
                <option key={s} value={s}>
                  {PRICE_SCOPE_LABEL[s]}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={addValue}
              className="flex items-center justify-center gap-1 px-3 py-1.5 text-xs font-semibold text-white bg-orange-500 hover:bg-orange-600 rounded-lg transition"
            >
              <Plus size={13} /> เพิ่มค่า
            </button>
          </div>
          {valueError && (
            <p className="text-[11px] text-red-500 flex items-center gap-1">
              <AlertCircle size={11} /> {valueError}
            </p>
          )}
          {option.values.length > 0 && (
            <div className="space-y-1">
              {option.values.map((v, i) => (
                <div
                  key={`${v.name}-${i}`}
                  className="flex items-center justify-between text-xs bg-white px-3 py-1.5 rounded-lg border border-gray-100"
                >
                  <span className="text-gray-700">{v.name}</span>
                  <div className="flex items-center gap-2.5">
                    <select
                      value={allowedScopes.includes(v.priceScope) ? v.priceScope : allowedScopes[0]}
                      onChange={(e) => updateValueScope(i, e.target.value as PriceScope)}
                      className="px-1.5 py-1 text-[11px] border border-gray-200 rounded-lg bg-white text-gray-600"
                    >
                      {allowedScopes.map((s) => (
                        <option key={s} value={s}>
                          {PRICE_SCOPE_LABEL[s]}
                        </option>
                      ))}
                    </select>
                    <span className="font-bold text-orange-600">
                      {v.extraPrice > 0 ? `+฿${v.extraPrice.toLocaleString()}` : "+฿0"}
                    </span>
                    <button type="button" onClick={() => removeValue(i)} className="text-gray-400 hover:text-red-500 transition">
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <p className="pl-1 text-[11px] text-gray-400">
          {option.type === "number" ? "ลูกค้ากรอกตัวเลขเองตอนสั่งซื้อ" : "ลูกค้ากรอกข้อความเองตอนสั่งซื้อ"} — ไม่บังคับกรอก ไม่มีผลต่อราคา
        </p>
      )}
    </div>
  );
}

// ระดับราคาตามสี — เป็นส่วนหนึ่งของ Base Pricing แยกออกจาก Options เพราะ "ขาวดำ" ใช้ basePrice ตรงๆ ไม่มีแถวของตัวเอง
function ColorTierEditor({ tiers, onChange }: { tiers: ColorTier[]; onChange: (tiers: ColorTier[]) => void }) {
  const [draftLabel, setDraftLabel] = useState("");
  const [draftPrice, setDraftPrice] = useState<number | "">(0);
  const [error, setError] = useState("");

  const addTier = () => {
    const label = draftLabel.trim();
    if (!label) {
      setError("กรุณากรอกชื่อระดับสี");
      return;
    }
    if (draftPrice === "" || Number(draftPrice) < 0) {
      setError("ราคาต้องเป็น 0 บาทขึ้นไป");
      return;
    }
    if (tiers.some((t) => t.label.trim().toLowerCase() === label.toLowerCase())) {
      setError(`มีระดับสี "${label}" อยู่แล้ว`);
      return;
    }
    onChange([...tiers, { label, pricePerUnit: Number(draftPrice) }]);
    setDraftLabel("");
    setDraftPrice(0);
    setError("");
  };

  const removeTier = (index: number) => onChange(tiers.filter((_, i) => i !== index));

  return (
    <div>
      <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-700 mb-1">
        <Palette size={14} className="text-orange-500" /> ระดับสี (Color Tier)
      </label>
      <p className="text-[11px] text-gray-400 mb-2">
        ราคาขาวดำ = ราคาพื้นฐานด้านบน — เพิ่มระดับสีที่นี่เท่านั้น (เช่น "สี" +5 บาท/หน่วย) ห้ามสร้างเป็นตัวเลือก (Option) แยก
        ราคาที่ตั้งเป็นราคาต่อหน่วยแบบเบ็ดเสร็จ ไม่บวกกับราคาขาวดำ
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto_auto] gap-2 items-center mb-2">
        <input
          type="text"
          placeholder="ชื่อระดับสี เช่น สี, สีพรีเมียม"
          value={draftLabel}
          onChange={(e) => setDraftLabel(e.target.value)}
          className="px-3 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/25 focus:border-orange-500 bg-white"
        />
        <input
          type="number"
          min="0"
          step="0.5"
          placeholder="ราคาต่อหน่วย (บาท)"
          value={draftPrice}
          onChange={(e) => setDraftPrice(e.target.value === "" ? "" : Number(e.target.value))}
          className="w-32 px-3 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/25 focus:border-orange-500 bg-white"
        />
        <button
          type="button"
          onClick={addTier}
          className="flex items-center justify-center gap-1 px-3 py-1.5 text-xs font-semibold text-white bg-orange-500 hover:bg-orange-600 rounded-lg transition"
        >
          <Plus size={13} /> เพิ่มระดับสี
        </button>
      </div>
      {error && (
        <p className="text-[11px] text-red-500 flex items-center gap-1 mb-2">
          <AlertCircle size={11} /> {error}
        </p>
      )}
      {tiers.length > 0 && (
        <div className="space-y-1">
          {tiers.map((t, i) => (
            <div key={`${t.label}-${i}`} className="flex items-center justify-between text-xs bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100">
              <span className="text-gray-700">{t.label}</span>
              <div className="flex items-center gap-2.5">
                <span className="font-bold text-orange-600">฿{t.pricePerUnit.toLocaleString()}/หน่วย</span>
                <button type="button" onClick={() => removeTier(i)} className="text-gray-400 hover:text-red-500 transition">
                  <Trash2 size={12} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ราคาต่อหน่วยแบบขั้นบันไดตามจำนวน — ใช้เมื่อ pricingModel = per_piece เท่านั้น ตรวจ overlap ทันทีที่เพิ่ม
function QuantityTierEditor({ tiers, onChange }: { tiers: QuantityTier[]; onChange: (tiers: QuantityTier[]) => void }) {
  const [draftMin, setDraftMin] = useState<number | "">("");
  const [draftMax, setDraftMax] = useState<number | "">("");
  const [draftPrice, setDraftPrice] = useState<number | "">(0);
  const [error, setError] = useState("");

  const overlaps = (minQty: number, maxQty: number | null) =>
    tiers.some((t) => {
      const tMax = t.maxQty ?? Infinity;
      const newMax = maxQty ?? Infinity;
      return minQty <= tMax && t.minQty <= newMax;
    });

  const addTier = () => {
    if (draftMin === "" || Number(draftMin) < 1) {
      setError("กรุณากรอกจำนวนขั้นต่ำ (ตั้งแต่ 1)");
      return;
    }
    const minQty = Number(draftMin);
    const maxQty = draftMax === "" ? null : Number(draftMax);
    if (maxQty != null && maxQty < minQty) {
      setError("จำนวนสูงสุดต้องมากกว่าหรือเท่ากับจำนวนขั้นต่ำ");
      return;
    }
    if (draftPrice === "" || Number(draftPrice) < 0) {
      setError("ราคาต้องเป็น 0 บาทขึ้นไป");
      return;
    }
    if (overlaps(minQty, maxQty)) {
      setError("ช่วงจำนวนนี้ทับซ้อนกับขั้นบันไดที่มีอยู่แล้ว");
      return;
    }
    onChange([...tiers, { minQty, maxQty, unitPrice: Number(draftPrice) }].sort((a, b) => a.minQty - b.minQty));
    setDraftMin("");
    setDraftMax("");
    setDraftPrice(0);
    setError("");
  };

  const removeTier = (index: number) => onChange(tiers.filter((_, i) => i !== index));

  return (
    <div>
      <label className="block text-xs font-semibold text-gray-700 mb-1">ราคาขั้นบันไดตามจำนวน (Quantity Tier)</label>
      <p className="text-[11px] text-gray-400 mb-2">เช่น 1-99 ชิ้น ราคา 10 บาท/ชิ้น, 100 ชิ้นขึ้นไป ราคา 8 บาท/ชิ้น — ช่วงห้ามทับกัน</p>
      <div className="grid grid-cols-1 sm:grid-cols-[auto_auto_auto_auto] gap-2 items-center mb-2">
        <input
          type="number"
          min="1"
          placeholder="ขั้นต่ำ"
          value={draftMin}
          onChange={(e) => setDraftMin(e.target.value === "" ? "" : Number(e.target.value))}
          className="w-20 px-3 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/25 focus:border-orange-500 bg-white"
        />
        <input
          type="number"
          min="1"
          placeholder="สูงสุด (ว่าง = ไม่จำกัด)"
          value={draftMax}
          onChange={(e) => setDraftMax(e.target.value === "" ? "" : Number(e.target.value))}
          className="w-36 px-3 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/25 focus:border-orange-500 bg-white"
        />
        <input
          type="number"
          min="0"
          step="0.5"
          placeholder="ราคา/หน่วย"
          value={draftPrice}
          onChange={(e) => setDraftPrice(e.target.value === "" ? "" : Number(e.target.value))}
          className="w-28 px-3 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/25 focus:border-orange-500 bg-white"
        />
        <button
          type="button"
          onClick={addTier}
          className="flex items-center justify-center gap-1 px-3 py-1.5 text-xs font-semibold text-white bg-orange-500 hover:bg-orange-600 rounded-lg transition"
        >
          <Plus size={13} /> เพิ่มขั้นบันได
        </button>
      </div>
      {error && (
        <p className="text-[11px] text-red-500 flex items-center gap-1 mb-2">
          <AlertCircle size={11} /> {error}
        </p>
      )}
      {tiers.length > 0 && (
        <div className="space-y-1">
          {tiers.map((t, i) => (
            <div key={`${t.minQty}-${i}`} className="flex items-center justify-between text-xs bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100">
              <span className="text-gray-700">
                {t.minQty} - {t.maxQty ?? "ไม่จำกัด"} หน่วย
              </span>
              <div className="flex items-center gap-2.5">
                <span className="font-bold text-orange-600">฿{t.unitPrice.toLocaleString()}/หน่วย</span>
                <button type="button" onClick={() => removeTier(i)} className="text-gray-400 hover:text-red-500 transition">
                  <Trash2 size={12} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function AddServiceModal({
  isOpen,
  onClose,
  onSaveMain,
  onSaveAddOn,
  allAddOnServices,
  allMainServices,
  editingMainService,
  editingAddOnService,
  defaultType = "main",
}: AddServiceModalProps) {
  const [serviceType, setServiceType] = useState<"main" | "addon">("main");

  // Form Fields
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [cannedDescriptionLabel, setCannedDescriptionLabel] = useState("");
  // ราคาบริการเสริม (addon) ใช้ฟิลด์นี้ตรงๆ — บริการหลัก (main) ใช้ pricingModel + basePrice แทน
  const [price, setPrice] = useState<number | "">(0);
  const [pricingModel, setPricingModel] = useState<PricingModel>("fixed");
  const [basePrice, setBasePrice] = useState<number | "">(0);
  const [requiresFileUpload, setRequiresFileUpload] = useState(true);
  const [allowedFileTypes, setAllowedFileTypes] = useState<AllowedFileType[]>(["pdf", "jpg", "png"]);
  const [options, setOptions] = useState<ServiceOption[]>([]);
  const [colorTiers, setColorTiers] = useState<ColorTier[]>([]);
  const [quantityTiers, setQuantityTiers] = useState<QuantityTier[]>([]);
  const [pageCountingMode, setPageCountingMode] = useState<PageCountingMode>("by_file_page");
  const [minArea, setMinArea] = useState<number | "">("");
  const [areaRoundingIncrement, setAreaRoundingIncrement] = useState<number | "">(0.1);
  const [unit, setUnit] = useState("แผ่น");
  const [estimatedTime, setEstimatedTime] = useState("5 นาที");
  const [isActive, setIsActive] = useState(true);
  const [imageUrl, setImageUrl] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // AddOn Bindings for Main Service
  const [selectedAddOns, setSelectedAddOns] = useState<AddOnPriceBinding[]>([]);
  const [noAddOns, setNoAddOns] = useState(false);

  // Errors
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (editingMainService) {
      setServiceType("main");
      setName(editingMainService.name);
      setDescription(editingMainService.description || "");
      setCannedDescriptionLabel("");
      setPricingModel(editingMainService.pricingModel || "fixed");
      setBasePrice(editingMainService.basePrice ?? 0);
      setRequiresFileUpload(editingMainService.requiresFileUpload ?? true);
      setAllowedFileTypes(editingMainService.allowedFileTypes?.length ? editingMainService.allowedFileTypes : ["pdf", "jpg", "png"]);
      setOptions(editingMainService.options?.map((o) => ({ ...o, values: o.values.map((v) => ({ ...v })) })) || []);
      setColorTiers(editingMainService.colorTiers?.map((t) => ({ ...t })) || []);
      setQuantityTiers(editingMainService.quantityTiers?.map((t) => ({ ...t })) || []);
      setPageCountingMode(editingMainService.pageCountingMode || "by_file_page");
      setMinArea(editingMainService.minArea ?? "");
      setAreaRoundingIncrement(editingMainService.areaRoundingIncrement ?? 0.1);
      setUnit(editingMainService.unit || "แผ่น");
      setEstimatedTime(editingMainService.estimatedTime || "5 นาที");
      setIsActive(editingMainService.isActive);
      setImageUrl(editingMainService.imageUrl || "");
      setImageFile(null);
      setSelectedAddOns(editingMainService.availableAddOns || []);
      setNoAddOns((editingMainService.availableAddOns || []).length === 0);
    } else if (editingAddOnService) {
      setServiceType("addon");
      setName(editingAddOnService.name);
      setDescription(editingAddOnService.description || "");
      setCannedDescriptionLabel("");
      setPrice(editingAddOnService.price);
      setUnit(editingAddOnService.unit || "ชิ้น");
      setEstimatedTime(editingAddOnService.estimatedTime || "5 นาที");
      setIsActive(editingAddOnService.isActive);
      setImageUrl(editingAddOnService.imageUrl || "");
      setImageFile(null);
      setSelectedAddOns([]);
    } else {
      // Reset form
      setServiceType(defaultType);
      setName("");
      setDescription("");
      setCannedDescriptionLabel("");
      setPrice(0);
      setPricingModel("fixed");
      setBasePrice(0);
      setRequiresFileUpload(true);
      setAllowedFileTypes(["pdf", "jpg", "png"]);
      setOptions([]);
      setColorTiers([]);
      setQuantityTiers([]);
      setPageCountingMode("by_file_page");
      setMinArea("");
      setAreaRoundingIncrement(0.1);
      setUnit(defaultType === "main" ? "แผ่น" : "เล่ม");
      setEstimatedTime("5 นาที");
      setIsActive(true);
      setImageUrl("");
      setImageFile(null);
      setSelectedAddOns([]);
      setNoAddOns(false);
    }
    setErrors({});
    setIsUploading(false);
  }, [editingMainService, editingAddOnService, defaultType, isOpen]);

  if (!isOpen) return null;

  const isEditing = !!(editingMainService || editingAddOnService);

  const handleServiceTypeChange = (type: "main" | "addon") => {
    if (isEditing) return; // ห้ามเปลี่ยนประเภทระหว่างแก้ไข ไม่งั้นจะบันทึกเป็นรายการใหม่แทนการแก้ไขของเดิม
    setServiceType(type);
    setUnit(type === "main" ? "แผ่น" : "เล่ม");
  };

  const handleCannedDescriptionSelect = (label: string) => {
    setCannedDescriptionLabel(label);
    const found = CANNED_DESCRIPTIONS.find((d) => d.label === label);
    if (found) setDescription(found.text);
  };

  const toggleFileType = (type: AllowedFileType) => {
    setAllowedFileTypes((prev) => (prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]));
  };

  const addOption = () => {
    setOptions([...options, { name: "", type: "dropdown", priceCategory: "other", values: [] }]);
  };
  const updateOption = (index: number, updated: ServiceOption) => {
    setOptions(options.map((o, i) => (i === index ? updated : o)));
  };
  const removeOption = (index: number) => {
    setOptions(options.filter((_, i) => i !== index));
  };
  // ตัวเลือกอื่น (ไม่ใช่ index นี้) ใช้หมวดราคานี้อยู่แล้วหรือไม่ — เตือนก่อน submit ตามสเปก §4.4
  const isPriceCategoryUsedElsewhere = (category: OptionPriceCategory, exceptIndex: number) =>
    category !== "other" && options.some((o, i) => i !== exceptIndex && o.priceCategory === category);

  // เปลี่ยน pricingModel แล้ว priceScope เดิมของค่าตัวเลือกบางอันอาจไม่อยู่ใน allow-list ใหม่ — clamp กลับเป็นตัวเลือกแรกที่อนุญาตให้อัตโนมัติ
  // ทำตอนผู้ใช้กดเปลี่ยนจริงๆ เท่านั้น (ไม่ใช่ useEffect) กันไม่ให้ clamp ผิดจังหวะตอนโหลดข้อมูลเดิมมาแก้ไข
  const handlePricingModelChange = (model: PricingModel) => {
    setPricingModel(model);
    const allowed = ALLOWED_PRICE_SCOPES_BY_PRICING_MODEL[model];
    setOptions((prev) =>
      prev.map((o) => ({
        ...o,
        values: o.values.map((v) => (allowed.includes(v.priceScope) ? v : { ...v, priceScope: allowed[0] })),
      }))
    );
  };

  const handleAddOnToggle = (addOnId: string, defaultAddOnPrice: number) => {
    if (noAddOns) setNoAddOns(false);

    const exists = selectedAddOns.find((b) => b.addOnId === addOnId);
    if (exists) {
      setSelectedAddOns(selectedAddOns.filter((b) => b.addOnId !== addOnId));
    } else {
      setSelectedAddOns([
        ...selectedAddOns,
        { addOnId, extraPrice: defaultAddOnPrice },
      ]);
    }
  };

  const handleExtraPriceChange = (addOnId: string, newExtraPrice: number) => {
    const safePrice = Math.max(0, newExtraPrice);
    setSelectedAddOns(
      selectedAddOns.map((b) =>
        b.addOnId === addOnId ? { ...b, extraPrice: safePrice } : b
      )
    );
  };

  const handleNoAddOnsToggle = () => {
    setNoAddOns(!noAddOns);
    if (!noAddOns) {
      setSelectedAddOns([]);
    }
  };

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!name.trim()) errs.name = "กรุณากรอกชื่อบริการ";
    else {
      const trimmedName = name.trim().toLowerCase();
      const currentId = serviceType === "main" ? editingMainService?.id : editingAddOnService?.id;
      const duplicateList = serviceType === "main" ? allMainServices : allAddOnServices;
      const isDuplicate = duplicateList.some(
        (s) => s.id !== currentId && s.name.trim().toLowerCase() === trimmedName
      );
      if (isDuplicate) errs.name = "มีบริการชื่อนี้อยู่แล้ว กรุณาใช้ชื่ออื่น";
    }
    if (serviceType === "addon" && (price === "" || Number(price) < 0)) {
      errs.price = "กรุณากรอกราคาที่ถูกต้อง";
    }
    if (serviceType === "main") {
      if (basePrice === "" || Number(basePrice) < 0) {
        errs.basePrice = "กรุณากรอกราคาที่ถูกต้อง (0 บาทขึ้นไป)";
      }
      if (requiresFileUpload && allowedFileTypes.length === 0) {
        errs.allowedFileTypes = "กรุณาเลือกไฟล์ที่รับอย่างน้อย 1 ชนิด";
      }
      const optionNames = new Set<string>();
      for (const opt of options) {
        if (!opt.name.trim()) {
          errs.options = "กรุณากรอกชื่อตัวเลือกให้ครบทุกรายการ";
          break;
        }
        const key = opt.name.trim().toLowerCase();
        if (optionNames.has(key)) {
          errs.options = "มีชื่อตัวเลือกซ้ำกันในบริการนี้ กรุณาตรวจสอบ";
          break;
        }
        optionNames.add(key);
        const needsValues = opt.type === "dropdown" || opt.type === "radio" || opt.type === "checkbox";
        if (needsValues && opt.values.length === 0) {
          errs.options = `ตัวเลือก "${opt.name}" ต้องมีค่าให้เลือกอย่างน้อย 1 รายการ`;
          break;
        }
      }
      // สเปก §4.4: 1 price_category (ยกเว้น "other") มีได้แค่ 1 Option ต่อบริการ
      if (!errs.options) {
        const seenCategories = new Set<string>();
        for (const opt of options) {
          if (opt.priceCategory === "other") continue;
          if (seenCategories.has(opt.priceCategory)) {
            errs.options = `มีตัวเลือกมากกว่า 1 รายการที่ใช้หมวดราคาเดียวกัน (${PRICE_CATEGORY_LABEL[opt.priceCategory]}) กรุณารวมเป็นตัวเลือกเดียว`;
            break;
          }
          seenCategories.add(opt.priceCategory);
        }
      }
      if (minArea !== "" && Number(minArea) <= 0) {
        errs.minArea = "พื้นที่ขั้นต่ำต้องมากกว่า 0";
      }
      if (areaRoundingIncrement === "" || Number(areaRoundingIncrement) <= 0) {
        errs.areaRoundingIncrement = "หน่วยปัดขึ้นต้องมากกว่า 0";
      }
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    let finalImageUrl = imageUrl;
    if (imageFile) {
      setIsUploading(true);
      try {
        const { url } = await uploadFile(imageFile, "service-image");
        finalImageUrl = url || "";
      } catch (err) {
        setErrors({ image: err instanceof ApiError ? err.message : "อัปโหลดรูปภาพไม่สำเร็จ กรุณาลองใหม่อีกครั้ง" });
        setIsUploading(false);
        return;
      }
      setIsUploading(false);
    }

    if (serviceType === "main") {
      const newMain: MainService = {
        id: editingMainService ? editingMainService.id : `main-${Date.now()}`,
        name: name.trim(),
        description: description.trim() || undefined,
        pricingModel,
        basePrice: Number(basePrice),
        requiresFileUpload,
        allowedFileTypes,
        options,
        colorTiers,
        quantityTiers,
        pageCountingMode,
        minArea: minArea === "" ? undefined : Number(minArea),
        areaRoundingIncrement: areaRoundingIncrement === "" ? 0.1 : Number(areaRoundingIncrement),
        unit,
        estimatedTime,
        availableAddOns: noAddOns ? [] : selectedAddOns,
        imageUrl: finalImageUrl || undefined,
        isActive,
      };
      onSaveMain(newMain);
    } else {
      const newAddOn: AddOnService = {
        id: editingAddOnService ? editingAddOnService.id : `addon-${Date.now()}`,
        name: name.trim(),
        description: description.trim() || undefined,
        price: Number(price),
        unit,
        estimatedTime,
        imageUrl: finalImageUrl || undefined,
        isActive,
      };
      onSaveAddOn(newAddOn);
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden max-h-[90vh] flex flex-col my-auto">
        {/* Modal Header */}
        <div className="p-4 sm:p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50 shrink-0">
          <div>
            <h3 className="text-lg font-bold text-gray-800">
              {editingMainService || editingAddOnService
                ? "แก้ไขรายการบริการ"
                : "เพิ่มบริการใหม่"}
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              กำหนดรายละเอียด อัตราราคา และตัวเลือกเสริมสำหรับลูกค้า
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-200/60 transition"
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-6 overflow-y-auto flex-1">
          {/* Service Type Radio */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-2">
              ประเภทบริการ <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label
                className={`
                  flex items-center gap-3 p-3 rounded-xl border transition-all
                  ${
                    serviceType === "main"
                      ? "border-orange-500 bg-orange-50/60 ring-2 ring-orange-500/20"
                      : "border-gray-200 hover:bg-gray-50"
                  }
                  ${isEditing ? "opacity-60 cursor-not-allowed" : "cursor-pointer"}
                `}
              >
                <input
                  type="radio"
                  name="serviceType"
                  value="main"
                  checked={serviceType === "main"}
                  disabled={isEditing}
                  onChange={() => handleServiceTypeChange("main")}
                  className="text-orange-500 focus:ring-orange-500"
                />
                <div>
                  <div className="font-semibold text-sm text-gray-800">บริการหลัก</div>
                  <div className="text-[11px] text-gray-500">พิมพ์, ถ่ายเอกสาร, สแกน ฯลฯ</div>
                </div>
              </label>

              <label
                className={`
                  flex items-center gap-3 p-3 rounded-xl border transition-all
                  ${
                    serviceType === "addon"
                      ? "border-orange-500 bg-orange-50/60 ring-2 ring-orange-500/20"
                      : "border-gray-200 hover:bg-gray-50"
                  }
                  ${isEditing ? "opacity-60 cursor-not-allowed" : "cursor-pointer"}
                `}
              >
                <input
                  type="radio"
                  name="serviceType"
                  value="addon"
                  checked={serviceType === "addon"}
                  disabled={isEditing}
                  onChange={() => handleServiceTypeChange("addon")}
                  className="text-orange-500 focus:ring-orange-500"
                />
                <div>
                  <div className="font-semibold text-sm text-gray-800">บริการเสริม</div>
                  <div className="text-[11px] text-gray-500">เข้าเล่ม, เคลือบเอกสาร ฯลฯ</div>
                </div>
              </label>
            </div>
          </div>

          {/* Name */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">
              ชื่อบริการ <span className="text-red-500">*</span>
            </label>
            <p className="text-[11px] text-gray-400 mb-1.5">ชื่อที่ลูกค้าจะเห็นบนเว็บไซต์</p>
            <input
              type="text"
              placeholder="เช่น ถ่ายเอกสารขาวดำ, เข้าเล่มสันกาว"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/25 focus:border-orange-500"
            />
            {errors.name && (
              <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                <AlertCircle size={12} /> {errors.name}
              </p>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">
              คำอธิบายบริการ (อุปกรณ์/จุดเด่น)
            </label>
            <p className="text-[11px] text-gray-400 mb-1.5">อธิบายบริการแบบสั้นและเข้าใจง่าย</p>
            <select
              value={cannedDescriptionLabel}
              onChange={(e) => handleCannedDescriptionSelect(e.target.value)}
              className="w-full mb-2 px-3.5 py-2 text-xs border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/25 focus:border-orange-500 bg-white text-gray-500"
            >
              <option value="">เลือกข้อความสำเร็จรูป (ไม่บังคับ)...</option>
              {CANNED_DESCRIPTIONS.map((d) => (
                <option key={d.label} value={d.label}>
                  {d.label}
                </option>
              ))}
            </select>
            <textarea
              rows={2}
              placeholder="ระบุรายละเอียดสั้น ๆ เพื่อประกอบการตัดสินใจของลูกค้า..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/25 focus:border-orange-500"
            />
          </div>

          {/* FIELDS FOR MAIN SERVICE ONLY — วิธีคิดราคาพื้นฐาน */}
          {serviceType === "main" && (
            <>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Pricing Model <span className="text-red-500">*</span>
                </label>
                <p className="text-[11px] text-gray-400 mb-2">เลือกวิธีคิดราคาของบริการนี้</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {PRICING_MODEL_OPTIONS.map((opt) => (
                    <label
                      key={opt.value}
                      className={`flex items-center gap-2.5 p-3 rounded-xl border cursor-pointer transition-all ${
                        pricingModel === opt.value
                          ? "border-orange-500 bg-orange-50/60 ring-2 ring-orange-500/20"
                          : "border-gray-200 hover:bg-gray-50"
                      }`}
                    >
                      <input
                        type="radio"
                        name="pricingModel"
                        checked={pricingModel === opt.value}
                        onChange={() => handlePricingModelChange(opt.value)}
                        className="text-orange-500 focus:ring-orange-500"
                      />
                      <div>
                        <div className="font-semibold text-sm text-gray-800">{opt.label}</div>
                        <div className="text-[11px] text-gray-500">{opt.hint}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                  {PRICING_MODEL_OPTIONS.find((o) => o.value === pricingModel)?.priceLabel} <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.5"
                  value={basePrice}
                  onChange={(e) => setBasePrice(e.target.value === "" ? "" : Number(e.target.value))}
                  className="w-full sm:w-48 px-3.5 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/25 focus:border-orange-500"
                />
                {errors.basePrice && <p className="text-xs text-red-500 mt-1">{errors.basePrice}</p>}
              </div>

              <div className="p-3.5 bg-gray-50 rounded-xl border border-gray-100">
                <ColorTierEditor tiers={colorTiers} onChange={setColorTiers} />
              </div>

              {pricingModel === "per_page" && (
                <div className="p-3.5 bg-gray-50 rounded-xl border border-gray-100">
                  <label className="block text-xs font-semibold text-gray-700 mb-1">วิธีนับหน้า</label>
                  <p className="text-[11px] text-gray-400 mb-2">ใช้ตอนคำนวณราคา — ปัดขึ้นเสมอ ไม่ปัดลง</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <label
                      className={`flex items-center gap-2 p-2.5 rounded-lg border cursor-pointer text-xs ${
                        pageCountingMode === "by_file_page" ? "border-orange-500 bg-orange-50/60" : "border-gray-200 bg-white"
                      }`}
                    >
                      <input
                        type="radio"
                        checked={pageCountingMode === "by_file_page"}
                        onChange={() => setPageCountingMode("by_file_page")}
                        className="text-orange-500 focus:ring-orange-500"
                      />
                      นับหน้าไฟล์ตรงๆ (พิมพ์หน้าเดียว)
                    </label>
                    <label
                      className={`flex items-center gap-2 p-2.5 rounded-lg border cursor-pointer text-xs ${
                        pageCountingMode === "by_sheet" ? "border-orange-500 bg-orange-50/60" : "border-gray-200 bg-white"
                      }`}
                    >
                      <input
                        type="radio"
                        checked={pageCountingMode === "by_sheet"}
                        onChange={() => setPageCountingMode("by_sheet")}
                        className="text-orange-500 focus:ring-orange-500"
                      />
                      ปัดขึ้นครึ่งหนึ่ง (พิมพ์สองหน้า/แผ่น)
                    </label>
                  </div>
                </div>
              )}

              {pricingModel === "per_sqm" && (
                <div className="p-3.5 bg-gray-50 rounded-xl border border-gray-100">
                  <label className="block text-xs font-semibold text-gray-700 mb-1">พื้นที่ขั้นต่ำ / หน่วยปัดขึ้น</label>
                  <p className="text-[11px] text-gray-400 mb-2">พื้นที่ที่คิดราคาจะถูกปัดขึ้นเป็นหน่วยนี้เสมอ แล้วบังคับขั้นต่ำ (ถ้ามี)</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] text-gray-500 mb-1">พื้นที่ขั้นต่ำ (ตร.ม., ไม่บังคับ)</label>
                      <input
                        type="number"
                        min="0"
                        step="0.1"
                        value={minArea}
                        onChange={(e) => setMinArea(e.target.value === "" ? "" : Number(e.target.value))}
                        className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/25 focus:border-orange-500 bg-white"
                      />
                      {minArea !== "" && Number(minArea) > 50 && (
                        <p className="text-[11px] text-amber-600 mt-1 flex items-center gap-1">
                          <AlertCircle size={11} /> พื้นที่ขั้นต่ำมากกว่า 50 ตร.ม. กรุณาตรวจสอบว่าไม่ได้กรอกผิด
                        </p>
                      )}
                      {errors.minArea && <p className="text-[11px] text-red-500 mt-1">{errors.minArea}</p>}
                    </div>
                    <div>
                      <label className="block text-[11px] text-gray-500 mb-1">หน่วยปัดขึ้น (ตร.ม.)</label>
                      <input
                        type="number"
                        min="0.01"
                        step="0.1"
                        value={areaRoundingIncrement}
                        onChange={(e) => setAreaRoundingIncrement(e.target.value === "" ? "" : Number(e.target.value))}
                        className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/25 focus:border-orange-500 bg-white"
                      />
                      {errors.areaRoundingIncrement && <p className="text-[11px] text-red-500 mt-1">{errors.areaRoundingIncrement}</p>}
                    </div>
                  </div>
                </div>
              )}

              {pricingModel === "per_piece" && (
                <div className="p-3.5 bg-gray-50 rounded-xl border border-gray-100">
                  <QuantityTierEditor tiers={quantityTiers} onChange={setQuantityTiers} />
                  {errors.quantityTiers && (
                    <p className="text-[11px] text-red-500 mt-1.5 flex items-center gap-1">
                      <AlertCircle size={11} /> {errors.quantityTiers}
                    </p>
                  )}
                </div>
              )}

              {/* การอัปโหลดไฟล์ */}
              <div className="p-3.5 bg-gray-50 rounded-xl border border-gray-100 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold text-gray-800">ต้องอัปโหลดไฟล์งานพิมพ์</div>
                    <div className="text-[11px] text-gray-500">ปิดไว้ถ้าบริการนี้ไม่ต้องใช้ไฟล์จากลูกค้า</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setRequiresFileUpload(!requiresFileUpload)}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      requiresFileUpload ? "bg-orange-500" : "bg-gray-200"
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                        requiresFileUpload ? "translate-x-5" : "translate-x-0"
                      }`}
                    />
                  </button>
                </div>
                {requiresFileUpload && (
                  <div>
                    <p className="text-[11px] text-gray-500 mb-1.5">ไฟล์ที่รับ</p>
                    <div className="flex flex-wrap gap-1.5">
                      {FILE_TYPE_OPTIONS.map((f) => (
                        <button
                          key={f.value}
                          type="button"
                          onClick={() => toggleFileType(f.value)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                            allowedFileTypes.includes(f.value)
                              ? "border-orange-500 bg-orange-50 text-orange-600 font-semibold"
                              : "border-gray-200 text-gray-600 hover:bg-gray-100 bg-white"
                          }`}
                        >
                          {f.label}
                        </button>
                      ))}
                    </div>
                    {errors.allowedFileTypes && <p className="text-xs text-red-500 mt-1.5">{errors.allowedFileTypes}</p>}
                  </div>
                )}
              </div>

              {/* ตัวเลือกของบริการ (Options) */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-gray-700">ตัวเลือกของบริการ (Options)</label>
                  <button
                    type="button"
                    onClick={addOption}
                    className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-orange-600 hover:bg-orange-50 rounded-lg transition"
                  >
                    <ListPlus size={14} /> เพิ่มตัวเลือก
                  </button>
                </div>
                <p className="text-[11px] text-gray-400 mb-2">
                  สร้างตัวเลือกได้ไม่จำกัด เช่น ประเภทกระดาษ, ด้านพิมพ์, ขนาด, วัสดุ — dropdown/radio ต้องเลือกก่อนสั่งซื้อ, checkbox/text ไม่บังคับ
                  (ตัวเลือกเรื่องสีให้ตั้งที่ "ระดับสี" ด้านบนแทน ไม่ต้องสร้างที่นี่)
                </p>
                {options.length === 0 ? (
                  <p className="text-xs text-gray-400 italic py-2">ยังไม่มีตัวเลือก — บริการนี้จะมีแค่ราคาพื้นฐานเท่านั้น</p>
                ) : (
                  <div className="space-y-2.5">
                    {options.map((opt, i) => (
                      <OptionEditor
                        key={i}
                        option={opt}
                        pricingModel={pricingModel}
                        siblingCategoryUsed={(category) => isPriceCategoryUsedElsewhere(category, i)}
                        onChange={(o) => updateOption(i, o)}
                        onRemove={() => removeOption(i)}
                      />
                    ))}
                  </div>
                )}
                {errors.options && (
                  <p className="text-xs text-red-500 mt-2 flex items-center gap-1">
                    <AlertCircle size={12} /> {errors.options}
                  </p>
                )}
              </div>
            </>
          )}

          {/* Price & Unit Grid — ราคาเดี่ยวใช้กับบริการเสริมเท่านั้น บริการหลักใช้ pricingModel/basePrice ด้านบนแทน */}
          <div className={`grid grid-cols-1 gap-4 ${serviceType === "addon" ? "sm:grid-cols-2" : ""}`}>
            {serviceType === "addon" && (
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                  ราคาเริ่มต้น (บาท) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.5"
                  placeholder="0"
                  value={price}
                  onChange={(e) => setPrice(e.target.value === "" ? "" : Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/25 focus:border-orange-500"
                />
                {errors.price && (
                  <p className="text-xs text-red-500 mt-1">{errors.price}</p>
                )}
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                หน่วยคิดราคา
              </label>
              <select
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/25 focus:border-orange-500 bg-white"
              >
                <option value="แผ่น">ต่อแผ่น</option>
                <option value="เล่ม">ต่อเล่ม</option>
                <option value="ชิ้น">ต่อชิ้น</option>
                <option value="หน้า">ต่อหน้า</option>
                <option value="งาน">ต่องาน</option>
              </select>
            </div>
          </div>

          {/* Estimated Time */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">
              เวลาสำหรับบริการ (โดยประมาณ)
            </label>
            <select
              value={estimatedTime}
              onChange={(e) => setEstimatedTime(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/25 focus:border-orange-500 bg-white"
            >
              <option value="2 นาที">2 นาที</option>
              <option value="5 นาที">5 นาที</option>
              <option value="10 นาที">10 นาที</option>
              <option value="15 นาที">15 นาที</option>
              <option value="30 นาที">30 นาที</option>
              <option value="1 ชั่วโมง">1 ชั่วโมง</option>
              <option value="2 ชั่วโมง">2 ชั่วโมง</option>
              <option value="1 วัน">1 วัน</option>
            </select>
          </div>

          {/* MAIN SERVICE ADD-ON BINDING SECTION */}
          {serviceType === "main" && (
            <div className="border-t border-gray-100 pt-5 space-y-4">
              <div>
                <h4 className="text-sm font-bold text-gray-800 flex items-center gap-2">
                  <Layers size={16} className="text-orange-500" />
                  บริการเสริมที่ใช้
                </h4>
                <p className="text-xs text-gray-500 mt-0.5">
                  เลือกบริการเสริมที่มีในระบบ และสามารถปรับแต่งราคาบวกเพิ่มแยกเฉพาะบริการนี้ได้
                </p>
              </div>

              {/* No Add-ons Checkbox */}
              <label className="flex items-center gap-2 p-3 bg-gray-50 rounded-xl border border-gray-200 cursor-pointer">
                <input
                  type="checkbox"
                  checked={noAddOns}
                  onChange={handleNoAddOnsToggle}
                  className="rounded text-orange-500 focus:ring-orange-500"
                />
                <span className="text-xs font-semibold text-gray-700">
                  ไม่เอาบริการเสริมสำหรับบริการนี้
                </span>
              </label>

              {/* Add-ons List with Extra Price inputs */}
              {!noAddOns && (
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {allAddOnServices.length === 0 ? (
                    <p className="text-xs text-gray-400 py-2">ยังไม่มีบริการเสริมในระบบ</p>
                  ) : (
                    allAddOnServices.map((addOn) => {
                      const binding = selectedAddOns.find((b) => b.addOnId === addOn.id);
                      const isSelected = !!binding;

                      return (
                        <div
                          key={addOn.id}
                          className={`
                            flex items-center justify-between p-3 rounded-xl border transition-all text-xs
                            ${
                              isSelected
                                ? "border-orange-200 bg-orange-50/40"
                                : "border-gray-100 bg-white"
                            }
                          `}
                        >
                          <label className="flex items-center gap-2.5 cursor-pointer flex-1 min-w-0 pr-2">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => handleAddOnToggle(addOn.id, addOn.price)}
                              className="rounded text-orange-500 focus:ring-orange-500"
                            />
                            <div className="truncate">
                              <span className="font-medium text-gray-800">{addOn.name}</span>
                              <span className="text-gray-400 ml-1.5 text-[11px]">
                                (ราคามาตรฐาน ฿{addOn.price}/{addOn.unit})
                              </span>
                            </div>
                          </label>

                          {isSelected && (
                            <div className="flex items-center gap-2 shrink-0">
                              <span className="text-[11px] text-gray-500">บวกเพิ่ม (บาท):</span>
                              <input
                                type="number"
                                min="0"
                                value={binding.extraPrice}
                                onChange={(e) =>
                                  handleExtraPriceChange(
                                    addOn.id,
                                    Number(e.target.value) || 0
                                  )
                                }
                                className="w-20 px-2 py-1 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-orange-500 text-right font-bold text-orange-600"
                              />
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              )}

              {/* Summary Table of Selected Add-ons */}
              <div className="bg-gray-50/80 rounded-xl p-3 border border-gray-100">
                <div className="text-xs font-semibold text-gray-700 mb-2">
                  ตารางสรุปบริการเสริมที่เลือก ({selectedAddOns.length} รายการ)
                </div>
                {selectedAddOns.length === 0 ? (
                  <p className="text-xs text-gray-400 italic py-1">
                    กรุณาเลือกบริการเสริมที่ต้องการ
                  </p>
                ) : (
                  <div className="space-y-1.5">
                    {selectedAddOns.map((b) => {
                      const addOnObj = allAddOnServices.find((a) => a.id === b.addOnId);
                      return (
                        <div
                          key={b.addOnId}
                          className="flex justify-between items-center text-xs bg-white px-3 py-1.5 rounded-lg border border-gray-100"
                        >
                          <span className="text-gray-700 font-medium">
                            {addOnObj ? addOnObj.name : b.addOnId}
                          </span>
                          <span className="font-bold text-orange-600">
                            +฿{b.extraPrice.toLocaleString()}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Image Upload */}
          <div className="border-t border-gray-100 pt-5">
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">
              รูปภาพบริการ (ถ้ามี)
            </label>
            <label className="block border-2 border-dashed border-gray-200 rounded-xl p-4 text-center hover:border-orange-400 transition-colors cursor-pointer bg-gray-50/50">
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={(e) => setImageFile(e.target.files?.[0] ?? null)}
              />
              {imageFile || imageUrl ? (
                <>
                  {imageFile ? (
                    <p className="text-xs text-gray-700 font-semibold">{imageFile.name}</p>
                  ) : (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={imageUrl} alt="" className="mx-auto max-h-24 rounded-lg mb-1.5" />
                  )}
                  <p className="text-[11px] text-orange-500 mt-1 font-medium">คลิกเพื่อเปลี่ยนรูป</p>
                </>
              ) : (
                <>
                  <Upload size={24} className="mx-auto text-gray-400 mb-1.5" />
                  <p className="text-xs text-gray-600 font-medium">
                    คลิกเพื่ออัปโหลด หรือเลือกไฟล์
                  </p>
                  <p className="text-[11px] text-gray-400 mt-0.5">
                    รองรับไฟล์ JPG, PNG, WEBP ขนาดไม่เกิน 5MB
                  </p>
                </>
              )}
            </label>
            {errors.image && (
              <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                <AlertCircle size={12} /> {errors.image}
              </p>
            )}
          </div>

          {/* Active Status Toggle */}
          <div className="flex items-center justify-between p-3.5 bg-gray-50 rounded-xl border border-gray-100">
            <div>
              <div className="text-xs font-bold text-gray-800">เปิดให้บริการทันที</div>
              <div className="text-[11px] text-gray-500">
                หากปิดอยู่ ลูกค้าจะไม่สามารถเลือกบริการนี้ได้
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                if (isActive) {
                  const confirmed = confirm(`คุณต้องการปิดบริการ "${name || "นี้"}" หรือไม่?\n\nลูกค้าจะไม่สามารถเลือกบริการนี้ได้จนกว่าจะเปิดใช้งานอีกครั้ง`);
                  if (!confirmed) return;
                }
                setIsActive(!isActive);
              }}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                isActive ? "bg-orange-500" : "bg-gray-200"
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  isActive ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-xl transition"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              disabled={isUploading}
              className="px-5 py-2 text-sm font-medium text-white bg-orange-500 hover:bg-orange-600 disabled:opacity-60 disabled:cursor-not-allowed rounded-xl shadow-md shadow-orange-200 transition flex items-center gap-1.5"
            >
              {isUploading && <Loader2 size={14} className="animate-spin" />}
              {isUploading ? "กำลังอัปโหลดรูป..." : "บันทึกบริการ"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
