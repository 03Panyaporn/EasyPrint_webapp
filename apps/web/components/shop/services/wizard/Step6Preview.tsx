"use client";

import { useState, useMemo } from "react";
import { FileText, Loader2, Upload, CheckCircle2, XCircle } from "lucide-react";
import { calculateLineItem, type ScopedAmount, type PricingModel } from "@easyprint/shared";
import type { WizardFormData } from "./ServiceBuilderWizard";
import type { AddOnService, AllowedFileType } from "../types";

interface Step6PreviewProps {
  data: WizardFormData;
  availableAddOns: AddOnService[];
  onSave: () => Promise<void>;
  onBack: () => void;
  isSaving: boolean;
}

function toPricingModel(mode: WizardFormData["step2"]["pricingMode"]): PricingModel {
  return mode === "quantity_tier" ? "per_piece" : mode;
}

function getExtension(fileName: string): string {
  return fileName.split(".").pop()?.toLowerCase() ?? "";
}

// นับหน้าไฟล์ PDF จริงฝั่ง browser เท่านั้น — ไม่มีการอัปโหลดขึ้น storage เพราะเป็นแค่ทดสอบราคาให้ร้านดู
async function countPdfPages(file: File): Promise<number> {
  const pdfjsLib = await import("pdfjs-dist");
  pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
  const bytes = await file.arrayBuffer();
  const pdfDoc = await pdfjsLib.getDocument({ data: bytes }).promise;
  return pdfDoc.numPages;
}

export default function Step6Preview({
  data,
  availableAddOns,
  onSave,
  onBack,
  isSaving,
}: Step6PreviewProps) {
  const pricingMode = data.step2.pricingMode;
  const pricingModel = toPricingModel(pricingMode);

  // ── ทดสอบไฟล์จริง (ไม่อัปโหลดขึ้น storage) ──
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState("");
  const [pdfLoading, setPdfLoading] = useState(false);
  const [rawPageCount, setRawPageCount] = useState(0);

  const handleFileSelect = async (selected: File | null) => {
    setFile(selected);
    setFileError("");
    setRawPageCount(0);
    if (!selected) return;

    const ext = getExtension(selected.name) as AllowedFileType;
    if (!data.step4.allowedFileTypes.includes(ext)) {
      setFileError(`นามสกุล .${ext || "?"} ไม่ได้รับอนุญาต — บริการนี้รับเฉพาะ ${data.step4.allowedFileTypes.map((t) => `.${t}`).join(", ")}`);
      return;
    }

    if (pricingModel === "per_page") {
      if (ext !== "pdf") {
        setFileError("บริการราคาต่อหน้าต้องใช้ไฟล์ PDF เท่านั้นถึงจะนับหน้าได้");
        return;
      }
      setPdfLoading(true);
      try {
        const count = await countPdfPages(selected);
        setRawPageCount(count);
      } catch {
        setFileError("ไม่สามารถอ่านไฟล์ PDF นี้ได้ — ไฟล์อาจเสียหาย");
      } finally {
        setPdfLoading(false);
      }
    }
  };

  // ── ตัวเลือกที่ทดลองเลือก ──
  const [selections, setSelections] = useState<Record<string, string>>(() => {
    const defaults: Record<string, string> = {};
    data.step3.colorTiers.forEach((t, i) => {
      if (i === 0) defaults["color"] = t.label;
    });
    data.step3.options.forEach((opt) => {
      if (opt.values.length > 0) defaults[opt.name] = opt.values[0].name;
    });
    if (pricingMode === "quantity_tier" && data.step2.quantityTiers.length > 0) {
      defaults["qty_tier"] = String(data.step2.quantityTiers[0].minQty);
    }
    return defaults;
  });
  const [selectedPreviewAddOns, setSelectedPreviewAddOns] = useState<string[]>(data.step5.selectedAddOnIds);
  const [quantity, setQuantity] = useState(1);
  const [widthCm, setWidthCm] = useState<number | "">(100);
  const [heightCm, setHeightCm] = useState<number | "">(100);

  const totalPrice = useMemo(() => {
    if (pricingMode === "quantity_tier") {
      const tier = data.step2.quantityTiers.find((t) => selections["qty_tier"] === String(t.minQty));
      return tier?.unitPrice ?? 0;
    }

    const basePrice = data.step3.colorTiers[0]?.pricePerUnit ?? (typeof data.step2.basePrice === "number" ? data.step2.basePrice : 0);
    const selectedColorTier = data.step3.colorTiers.find((c) => c.label === selections["color"]);

    const optionDeltas: ScopedAmount[] = data.step3.options
      .map((opt) => {
        const val = opt.values.find((v) => v.name === selections[opt.name]);
        return val ? { scope: val.priceScope, amount: val.extraPrice } : null;
      })
      .filter((d): d is ScopedAmount => d !== null);

    const addOnCharges: ScopedAmount[] = selectedPreviewAddOns
      .map((id) => {
        const ao = availableAddOns.find((a) => a.id === id);
        return ao ? { scope: ao.scope, amount: ao.price } : null;
      })
      .filter((d): d is ScopedAmount => d !== null);

    const result = calculateLineItem({
      pricingModel,
      basePrice,
      colorTierPricePerUnit: selectedColorTier?.pricePerUnit,
      quantity,
      pageCountingMode: "by_file_page",
      rawPageCount,
      widthCm: typeof widthCm === "number" ? widthCm : 0,
      heightCm: typeof heightCm === "number" ? heightCm : 0,
      minArea: typeof data.step2.minArea === "number" ? data.step2.minArea : undefined,
      areaRoundingIncrement: typeof data.step2.areaRoundingIncrement === "number" ? data.step2.areaRoundingIncrement : 0.1,
      quantityTiers: data.step2.quantityTiers.map((t) => ({ ...t, maxQty: t.maxQty ?? null })),
      optionDeltas,
      addOnCharges,
    });
    return result.lineTotal;
  }, [data, selections, selectedPreviewAddOns, availableAddOns, pricingModel, pricingMode, quantity, rawPageCount, widthCm, heightCm]);

  const modeLabel = {
    per_page: "หน้า",
    per_piece: "ชิ้น",
    per_sqm: "ตร.ม.",
    quantity_tier: "ชุด",
  }[pricingMode];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Preview</h2>
        <p className="text-sm text-gray-500 mt-1">
          นี่คือหน้าที่ลูกค้าจะเห็น — ลองอัปโหลดไฟล์จริงและเลือกตัวเลือกดูได้เลยเพื่อเช็คว่านามสกุลไฟล์และราคาคำนวณถูกต้อง
        </p>
      </div>

      {/* Preview card — mimics customer order page */}
      <div className="rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
        {/* Service header */}
        <div className="relative h-32 bg-gradient-to-br from-orange-100 to-orange-50 flex items-center px-6">
          {data.step1.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={data.step1.imageUrl}
              alt={data.step1.name}
              className="absolute inset-0 w-full h-full object-cover"
            />
          ) : null}
          <div className="relative z-10">
            <h3 className="text-lg font-bold text-gray-900">{data.step1.name || "ชื่อบริการ"}</h3>
            {data.step1.description && (
              <p className="text-xs text-gray-600 mt-0.5 max-w-sm">{data.step1.description}</p>
            )}
          </div>
        </div>

        {/* Order form simulation */}
        <div className="p-5 space-y-5">
          {/* ── ทดสอบอัปโหลดไฟล์จริง (ไม่เก็บขึ้น storage) ── */}
          {data.step4.requiresFileUpload && (
            <div>
              <p className="text-xs font-semibold text-gray-600 mb-2">
                อัปโหลดไฟล์ ({data.step4.allowedFileTypes.map((t) => `.${t}`).join(", ")})
              </p>
              <label className="flex items-center gap-3 p-3 rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 cursor-pointer hover:border-orange-300 transition">
                <input
                  type="file"
                  className="hidden"
                  onChange={(e) => handleFileSelect(e.target.files?.[0] ?? null)}
                />
                {file ? (
                  <>
                    <FileText size={20} className="text-orange-500 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-xs text-gray-700 font-medium truncate">{file.name}</p>
                      <p className="text-xs text-gray-400">
                        {(file.size / 1024 / 1024).toFixed(2)} MB
                        {pdfLoading ? " · กำลังนับหน้า..." : pricingModel === "per_page" && rawPageCount > 0 ? ` · ${rawPageCount} หน้า` : ""}
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <Upload size={20} className="text-gray-400 shrink-0" />
                    <p className="text-xs text-gray-500">คลิกเพื่ออัปโหลดไฟล์ทดสอบ (ไม่ถูกเก็บไว้ที่ไหน)</p>
                  </>
                )}
              </label>
              {fileError && (
                <p className="text-xs text-red-500 mt-1.5 flex items-center gap-1">
                  <XCircle size={12} /> {fileError}
                </p>
              )}
              {!fileError && file && (
                <p className="text-xs text-emerald-600 mt-1.5 flex items-center gap-1">
                  <CheckCircle2 size={12} /> นามสกุลไฟล์ผ่านเงื่อนไขที่ตั้งไว้
                </p>
              )}
            </div>
          )}

          {/* per_sqm: ขนาดที่ทดสอบ */}
          {pricingModel === "per_sqm" && (
            <div>
              <p className="text-xs font-semibold text-gray-600 mb-1.5">ขนาดที่ทดสอบ (ซม.)</p>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="number"
                  min={1}
                  value={widthCm}
                  onChange={(e) => setWidthCm(e.target.value === "" ? "" : Number(e.target.value))}
                  placeholder="กว้าง"
                  className="px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/25"
                />
                <input
                  type="number"
                  min={1}
                  value={heightCm}
                  onChange={(e) => setHeightCm(e.target.value === "" ? "" : Number(e.target.value))}
                  placeholder="สูง"
                  className="px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/25"
                />
              </div>
            </div>
          )}

          {/* Quantity tier dropdown */}
          {pricingMode === "quantity_tier" && data.step2.quantityTiers.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-600 mb-1.5">จำนวน</p>
              <select
                value={selections["qty_tier"]}
                onChange={(e) => setSelections({ ...selections, qty_tier: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/25"
              >
                {data.step2.quantityTiers.map((t) => (
                  <option key={t.minQty} value={t.minQty}>
                    {t.minQty} ใบ — ฿{t.unitPrice.toLocaleString()}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* จำนวนชุด — ใช้ทดสอบ multiplier / quantity tier ของ per_piece */}
          {pricingMode !== "quantity_tier" && (
            <div>
              <p className="text-xs font-semibold text-gray-600 mb-1.5">จำนวนชุด</p>
              <input
                type="number"
                min={1}
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, Number(e.target.value) || 1))}
                className="w-28 px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/25"
              />
            </div>
          )}

          {/* Color selector */}
          {data.step3.colorTiers.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-600 mb-1.5">สี</p>
              <div className="flex flex-wrap gap-2">
                {data.step3.colorTiers.map((t) => (
                  <button
                    key={t.label}
                    onClick={() => setSelections({ ...selections, color: t.label })}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border-2 transition ${
                      selections["color"] === t.label
                        ? "border-orange-400 bg-orange-50 text-orange-700"
                        : "border-gray-200 text-gray-600 hover:border-orange-200"
                    }`}
                  >
                    {t.label}
                    <span className="ml-1.5 text-gray-400">
                      ฿{t.pricePerUnit}/{modeLabel}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Option selectors */}
          {data.step3.options.map((opt) => (
            <div key={opt.name}>
              <p className="text-xs font-semibold text-gray-600 mb-1.5">{opt.name}</p>
              {opt.type === "dropdown" ? (
                <select
                  value={selections[opt.name] ?? ""}
                  onChange={(e) => setSelections({ ...selections, [opt.name]: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/25"
                >
                  {opt.values.map((v) => (
                    <option key={v.name} value={v.name}>
                      {v.name} {v.extraPrice > 0 ? `(+฿${v.extraPrice})` : ""}
                    </option>
                  ))}
                </select>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {opt.values.map((v) => (
                    <button
                      key={v.name}
                      onClick={() => setSelections({ ...selections, [opt.name]: v.name })}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium border-2 transition ${
                        selections[opt.name] === v.name
                          ? "border-orange-400 bg-orange-50 text-orange-700"
                          : "border-gray-200 text-gray-600 hover:border-orange-200"
                      }`}
                    >
                      {v.name}
                      {v.extraPrice > 0 && (
                        <span className="ml-1.5 text-gray-400">+฿{v.extraPrice}</span>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}

          {/* Add-on checkboxes */}
          {data.step5.selectedAddOnIds.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-600 mb-2">บริการเสริม</p>
              <div className="space-y-2">
                {availableAddOns
                  .filter((a) => data.step5.selectedAddOnIds.includes(a.id))
                  .map((ao) => {
                    const checked = selectedPreviewAddOns.includes(ao.id);
                    return (
                      <label
                        key={ao.id}
                        className={`flex items-center gap-3 p-2.5 rounded-xl border cursor-pointer transition ${
                          checked ? "border-orange-300 bg-orange-50" : "border-gray-200"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() =>
                            setSelectedPreviewAddOns((prev) =>
                              checked ? prev.filter((x) => x !== ao.id) : [...prev, ao.id]
                            )
                          }
                          className="accent-orange-500"
                        />
                        <span className="text-xs font-medium text-gray-700 flex-1">{ao.name}</span>
                        <span className="text-xs font-bold text-orange-600">
                          +฿{ao.price} / {ao.unit}
                        </span>
                      </label>
                    );
                  })}
              </div>
            </div>
          )}

          {/* Price summary */}
          <div className="flex items-center justify-between pt-4 border-t border-gray-100">
            <div>
              <p className="text-xs text-gray-500">ราคาโดยประมาณ</p>
              <p className="text-xs text-gray-400">(คำนวณจากตัวเลือกที่เลือก ด้วยสูตรเดียวกับระบบจริง)</p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-black text-orange-600">
                ฿{totalPrice.toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-100">
        <button
          onClick={onBack}
          disabled={isSaving}
          className="px-5 py-2.5 text-sm font-medium text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 transition disabled:opacity-50"
        >
          ← ย้อนกลับ
        </button>
        <button
          onClick={onSave}
          disabled={isSaving}
          className="flex items-center gap-2 px-7 py-2.5 text-sm font-bold bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl shadow-md shadow-emerald-200 transition disabled:opacity-60"
        >
          {isSaving ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              กำลังบันทึก...
            </>
          ) : (
            "✓ บันทึกและเปิดใช้งาน"
          )}
        </button>
      </div>
    </div>
  );
}
