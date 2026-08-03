"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import type {
  ServiceOption,
  ServiceOptionValue,
  ColorTier,
  PricingModel,
  PriceScope,
  OptionPriceCategory,
  ServiceOptionType,
} from "../types";
import { ALLOWED_PRICE_SCOPES_BY_PRICING_MODEL as SCOPE_MAP } from "../types";
import type { PricingMode } from "./Step2Pricing";

export interface Step3Data {
  colorTiers: ColorTier[];
  options: ServiceOption[];
}

// Default sections per pricing mode
function buildDefaultOptions(mode: PricingMode, pricingModel: PricingModel): ServiceOption[] {
  const scope: PriceScope = pricingModel === "per_page" ? "per_page" : pricingModel === "per_sqm" ? "per_sqm" : "per_piece";

  if (mode === "per_sqm") return []; // no default options for sqm

  return [
    {
      name: "ขนาดกระดาษ",
      type: "radio" as ServiceOptionType,
      priceCategory: "size" as OptionPriceCategory,
      values: [
        { name: "A4", extraPrice: 0, priceScope: scope },
        { name: "A3", extraPrice: 2, priceScope: scope },
      ],
    },
    {
      name: "ประเภทกระดาษ",
      type: "dropdown" as ServiceOptionType,
      priceCategory: "paper" as OptionPriceCategory,
      values: [
        { name: "กระดาษธรรมดา", extraPrice: 0, priceScope: scope },
        { name: "กระดาษถนอมสายตา", extraPrice: 1, priceScope: scope },
        { name: "Photo Paper", extraPrice: 20, priceScope: scope },
      ],
    },
    {
      name: "รูปแบบการพิมพ์",
      type: "radio" as ServiceOptionType,
      priceCategory: "printing_side" as OptionPriceCategory,
      values: [
        { name: "หน้าเดียว", extraPrice: 0, priceScope: scope },
        { name: "หน้าหลัง (2 ด้าน)", extraPrice: 2, priceScope: scope },
      ],
    },
  ];
}

const DEFAULT_COLOR_TIERS: ColorTier[] = [
  { label: "ขาวดำ", pricePerUnit: 1 },
  { label: "สี", pricePerUnit: 5 },
];

const PRICE_SCOPE_LABELS: Record<PriceScope, string> = {
  per_item: "ต่อรายการ",
  per_page: "บาท/หน้า",
  per_piece: "บาท/ชิ้น",
  per_sqm: "บาท/ตร.ม.",
};

const STANDARD_OPTION_NAMES = ["ขนาดกระดาษ", "ประเภทกระดาษ", "รูปแบบการพิมพ์"];

// ─── Single option value row editor ──────────────────────────────────────────
function ValueRow({
  value,
  allowedScopes,
  onChange,
  onRemove,
}: {
  value: ServiceOptionValue;
  allowedScopes: PriceScope[];
  onChange: (v: ServiceOptionValue) => void;
  onRemove: () => void;
}) {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      <input
        type="text"
        value={value.name}
        onChange={(e) => onChange({ ...value, name: e.target.value })}
        placeholder="ชื่อตัวเลือก"
        className="flex-1 min-w-[120px] px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/25"
      />
      <input
        type="number"
        min={0}
        step={0.5}
        value={value.extraPrice}
        onChange={(e) => onChange({ ...value, extraPrice: Number(e.target.value) })}
        placeholder="0"
        className="w-20 px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/25"
      />
      {allowedScopes.length > 1 ? (
        <select
          value={value.priceScope}
          onChange={(e) => onChange({ ...value, priceScope: e.target.value as PriceScope })}
          className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-orange-500/25"
        >
          {allowedScopes.map((s) => (
            <option key={s} value={s}>{PRICE_SCOPE_LABELS[s]}</option>
          ))}
        </select>
      ) : (
        <span className="text-xs text-gray-400 w-20">{PRICE_SCOPE_LABELS[value.priceScope]}</span>
      )}
      <button onClick={onRemove} className="text-red-400 hover:text-red-600 transition">
        <Trash2 size={13} />
      </button>
    </div>
  );
}

// ─── Single option section (one header + its values) ─────────────────────────
function OptionSection({
  option,
  pricingModel,
  isStandard,
  onChange,
  onRemove,
}: {
  option: ServiceOption;
  pricingModel: PricingModel;
  isStandard: boolean;
  onChange: (o: ServiceOption) => void;
  onRemove: () => void;
}) {
  const allowedScopes = SCOPE_MAP[pricingModel];
  const [draftName, setDraftName] = useState("");

  const addValue = () => {
    const name = draftName.trim();
    if (!name) return;
    if (option.values.some((v) => v.name.toLowerCase() === name.toLowerCase())) return;
    onChange({
      ...option,
      values: [...option.values, { name, extraPrice: 0, priceScope: allowedScopes[0] }],
    });
    setDraftName("");
  };

  const removeValue = (i: number) =>
    onChange({ ...option, values: option.values.filter((_, idx) => idx !== i) });

  const updateValue = (i: number, v: ServiceOptionValue) =>
    onChange({ ...option, values: option.values.map((old, idx) => (idx === i ? v : old)) });

  return (
    <div className="rounded-2xl border border-gray-200 overflow-hidden">
      {/* Section header */}
      <div className={`flex items-center justify-between px-4 py-3 ${isStandard ? "bg-gray-50" : "bg-orange-50"}`}>
        <div className="flex items-center gap-2">
          {isStandard ? (
            <span className="text-sm font-bold text-gray-700">{option.name}</span>
          ) : (
            <input
              type="text"
              value={option.name}
              onChange={(e) => onChange({ ...option, name: e.target.value })}
              placeholder="ชื่อหัวข้อ"
              className="text-sm font-bold text-orange-700 bg-transparent border-b border-orange-300 focus:outline-none px-1 py-0.5"
            />
          )}
          {isStandard && (
            <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-gray-200 text-gray-500 font-medium">
              มาตรฐาน
            </span>
          )}
        </div>
        {!isStandard && (
          <button onClick={onRemove} className="text-red-400 hover:text-red-600 transition p-1">
            <Trash2 size={15} />
          </button>
        )}
      </div>

      {/* Values */}
      <div className="p-4 space-y-2">
        {option.values.map((v, i) => (
          <ValueRow
            key={i}
            value={v}
            allowedScopes={allowedScopes}
            onChange={(updated) => updateValue(i, updated)}
            onRemove={() => removeValue(i)}
          />
        ))}
        {option.values.length === 0 && (
          <p className="text-xs text-red-400 italic">⚠ ต้องมีอย่างน้อย 1 ตัวเลือก</p>
        )}

        {/* Add value row */}
        <div className="flex items-center gap-2 pt-1">
          <input
            type="text"
            value={draftName}
            onChange={(e) => setDraftName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addValue()}
            placeholder="+ พิมพ์ชื่อตัวเลือกใหม่ แล้ว Enter"
            className="flex-1 min-w-[140px] px-2.5 py-1.5 text-xs border border-dashed border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/25 focus:border-orange-400 bg-white"
          />
          <button
            onClick={addValue}
            disabled={!draftName.trim()}
            className="px-2.5 py-1.5 text-xs font-medium text-white bg-orange-500 hover:bg-orange-600 disabled:opacity-40 rounded-lg transition"
          >
            เพิ่ม
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Color tiers section ──────────────────────────────────────────────────────
function ColorSection({
  tiers,
  pricingModel,
  onChange,
}: {
  tiers: ColorTier[];
  pricingModel: PricingModel;
  onChange: (t: ColorTier[]) => void;
}) {
  const scopeLabel = pricingModel === "per_page" ? "บาท/หน้า" : "บาท/ชิ้น";

  const addTier = () =>
    onChange([...tiers, { label: "", pricePerUnit: 0 }]);

  return (
    <div className="rounded-2xl border border-gray-200 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 bg-gray-50">
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-gray-700">สี</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-gray-200 text-gray-500 font-medium">มาตรฐาน</span>
        </div>
      </div>
      <div className="p-4 space-y-2">
        {tiers.map((tier, i) => {
          // แถวแรกคือ "ขาวดำ" เสมอ — ล็อกชื่อไว้ แก้ไม่ได้/ลบไม่ได้ เพราะเป็นราคาพื้นฐานของบริการ (ไม่ใช่ Option แยก)
          const isBase = i === 0;
          return (
            <div key={i} className="flex items-center gap-2 flex-wrap">
              {isBase ? (
                <span className="flex-1 min-w-[100px] px-2.5 py-1.5 text-xs font-semibold text-gray-700">
                  ขาวดำ <span className="text-[10px] text-gray-400 font-normal">(ราคาพื้นฐาน)</span>
                </span>
              ) : (
                <input
                  type="text"
                  value={tier.label}
                  onChange={(e) => onChange(tiers.map((t, idx) => idx === i ? { ...t, label: e.target.value } : t))}
                  placeholder="เช่น สี, สีพรีเมียม"
                  className="flex-1 min-w-[100px] px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/25"
                />
              )}
              <input
                type="number"
                min={0}
                step={0.5}
                value={tier.pricePerUnit}
                onChange={(e) => onChange(tiers.map((t, idx) => idx === i ? { ...t, pricePerUnit: Number(e.target.value) } : t))}
                className="w-20 px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/25"
              />
              <span className="text-xs text-gray-400 w-16">{scopeLabel}</span>
              {!isBase && (
                <button
                  onClick={() => onChange(tiers.filter((_, idx) => idx !== i))}
                  className="text-red-400 hover:text-red-600 transition"
                >
                  <Trash2 size={13} />
                </button>
              )}
            </div>
          );
        })}
        <button
          onClick={addTier}
          className="flex items-center gap-1 text-xs text-orange-600 hover:text-orange-700 font-medium mt-1"
        >
          <Plus size={13} /> เพิ่มระดับสี
        </button>
      </div>
    </div>
  );
}

// ─── Main Step3 export ────────────────────────────────────────────────────────
interface Step3OptionsProps {
  data: Step3Data;
  pricingMode: PricingMode;
  pricingModel: PricingModel;
  onChange: (data: Step3Data) => void;
  onNext: () => void;
  onBack: () => void;
  isInitialRender: boolean;
  onInitialRenderDone: () => void;
}

export default function Step3Options({
  data,
  pricingMode,
  pricingModel,
  onChange,
  onNext,
  onBack,
  isInitialRender,
  onInitialRenderDone,
}: Step3OptionsProps) {
  // Auto-generate defaults on first entry if options are empty
  if (isInitialRender && data.options.length === 0 && data.colorTiers.length === 0) {
    const defaultOptions = buildDefaultOptions(pricingMode, pricingModel);
    const needsColor = pricingMode === "per_page" || pricingMode === "per_piece";
    onChange({
      options: defaultOptions,
      colorTiers: needsColor ? DEFAULT_COLOR_TIERS : [],
    });
    onInitialRenderDone();
  }

  const [errors, setErrors] = useState<string[]>([]);

  const validate = () => {
    const errs: string[] = [];
    data.options.forEach((opt) => {
      if (opt.values.length === 0)
        errs.push(`หัวข้อ "${opt.name || "ไม่มีชื่อ"}" ต้องมีอย่างน้อย 1 ตัวเลือก`);
    });
    if (
      (pricingMode === "per_page" || pricingMode === "per_piece") &&
      data.colorTiers.length === 0
    ) {
      errs.push("ส่วน 'สี' ต้องมีอย่างน้อย 1 ตัวเลือก");
    }
    setErrors(errs);
    return errs.length === 0;
  };

  const handleNext = () => {
    if (validate()) onNext();
  };

  const updateOption = (i: number, opt: ServiceOption) =>
    onChange({ ...data, options: data.options.map((o, idx) => (idx === i ? opt : o)) });

  const removeOption = (i: number) =>
    onChange({ ...data, options: data.options.filter((_, idx) => idx !== i) });

  const addCustomOption = () =>
    onChange({
      ...data,
      options: [
        ...data.options,
        {
          name: "",
          type: "dropdown" as ServiceOptionType,
          priceCategory: "other" as OptionPriceCategory,
          values: [],
        },
      ],
    });

  const showColor = pricingMode === "per_page" || pricingMode === "per_piece";
  const showNoOptionsHint = pricingMode === "per_sqm" && data.options.length === 0;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900">ตัวเลือกสินค้า</h2>
        <p className="text-sm text-gray-500 mt-1">
          ระบบสร้างหัวข้อมาตรฐานให้อัตโนมัติ — สามารถเพิ่ม/ลบ/แก้ไขตัวเลือกได้ทั้งหมด
        </p>
      </div>

      {/* Color section (only for per_page / per_piece) */}
      {showColor && (
        <ColorSection
          tiers={data.colorTiers}
          pricingModel={pricingModel}
          onChange={(t) => onChange({ ...data, colorTiers: t })}
        />
      )}

      {/* Standard + custom option sections */}
      {data.options.map((opt, i) => {
        const isStandard = STANDARD_OPTION_NAMES.includes(opt.name);
        return (
          <OptionSection
            key={i}
            option={opt}
            pricingModel={pricingModel}
            isStandard={isStandard}
            onChange={(updated) => updateOption(i, updated)}
            onRemove={() => removeOption(i)}
          />
        );
      })}

      {showNoOptionsHint && (
        <p className="text-sm text-gray-400 text-center py-4">
          บริการต่อตารางเมตรไม่มีหัวข้อมาตรฐาน — เพิ่มหัวข้อพิเศษได้ด้านล่าง
        </p>
      )}

      {/* Add custom section */}
      <button
        onClick={addCustomOption}
        className="w-full flex items-center justify-center gap-2 py-3 border-2 border-dashed border-orange-200 rounded-2xl text-sm font-medium text-orange-500 hover:border-orange-400 hover:bg-orange-50/40 transition"
      >
        <Plus size={16} />
        + เพิ่มหัวข้อพิเศษ (เช่น วัสดุ, ความหนา, เคลือบ)
      </button>

      {/* Errors */}
      {errors.length > 0 && (
        <div className="p-3 bg-red-50 rounded-xl border border-red-200 space-y-1">
          {errors.map((e, i) => (
            <p key={i} className="text-xs text-red-600 font-medium">• {e}</p>
          ))}
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
