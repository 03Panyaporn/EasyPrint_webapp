"use client";

import { ExternalLink, PackageOpen } from "lucide-react";
import type { AddOnService } from "../types";

export interface Step5Data {
  selectedAddOnIds: string[];
}

interface Step5AddOnsProps {
  data: Step5Data;
  availableAddOns: AddOnService[];
  onChange: (data: Step5Data) => void;
  onNext: () => void;
  onBack: () => void;
}

export default function Step5AddOns({
  data,
  availableAddOns,
  onChange,
  onNext,
  onBack,
}: Step5AddOnsProps) {
  const toggle = (id: string) => {
    const has = data.selectedAddOnIds.includes(id);
    onChange({
      selectedAddOnIds: has
        ? data.selectedAddOnIds.filter((x) => x !== id)
        : [...data.selectedAddOnIds, id],
    });
  };

  const activeAddOns = availableAddOns.filter((a) => a.isActive);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900">บริการเสริม</h2>
        <p className="text-sm text-gray-500 mt-1">
          เลือกว่าบริการนี้เปิดให้ใช้บริการเสริมใดได้บ้าง
        </p>
      </div>

      {activeAddOns.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 py-12 text-gray-400">
          <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center">
            <PackageOpen size={26} />
          </div>
          <div className="text-center">
            <p className="text-sm font-semibold text-gray-600">ยังไม่มีบริการเสริม</p>
            <p className="text-xs mt-1">ไปสร้างบริการเสริมก่อนในแท็บ "บริการเสริม"</p>
          </div>
          <a
            href="/shop/services"
            target="_blank"
            className="flex items-center gap-1.5 text-xs text-orange-600 hover:text-orange-700 font-medium"
          >
            <ExternalLink size={13} />
            ไปจัดการบริการเสริม
          </a>
        </div>
      ) : (
        <div className="space-y-2">
          {activeAddOns.map((addOn) => {
            const selected = data.selectedAddOnIds.includes(addOn.id);
            return (
              <label
                key={addOn.id}
                className={`flex items-center gap-4 p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                  selected
                    ? "border-orange-400 bg-orange-50"
                    : "border-gray-200 bg-white hover:border-orange-200 hover:bg-orange-50/20"
                }`}
              >
                {/* Checkbox */}
                <div
                  className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition ${
                    selected ? "bg-orange-500 border-orange-500" : "border-gray-300 bg-white"
                  }`}
                >
                  {selected && (
                    <svg viewBox="0 0 10 10" fill="none" className="w-3 h-3">
                      <path
                        d="M2 5l2.5 2.5L8 3"
                        stroke="white"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  )}
                </div>
                <input
                  type="checkbox"
                  className="sr-only"
                  checked={selected}
                  onChange={() => toggle(addOn.id)}
                />

                {/* Add-on image if any */}
                {addOn.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={addOn.imageUrl}
                    alt={addOn.name}
                    className="w-10 h-10 rounded-xl object-cover shrink-0"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center shrink-0 text-lg">
                    📦
                  </div>
                )}

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-800">{addOn.name}</p>
                  {addOn.description && (
                    <p className="text-xs text-gray-500 mt-0.5 truncate">{addOn.description}</p>
                  )}
                </div>

                {/* Price */}
                <div className="text-right shrink-0">
                  <p className="text-sm font-bold text-orange-600">฿{addOn.price.toLocaleString()}</p>
                  <p className="text-xs text-gray-400">ต่อ{addOn.unit}</p>
                </div>
              </label>
            );
          })}
        </div>
      )}

      {/* Selected count */}
      {data.selectedAddOnIds.length > 0 && (
        <p className="text-xs text-orange-600 font-medium text-center">
          ✓ เลือกแล้ว {data.selectedAddOnIds.length} บริการเสริม
        </p>
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
          onClick={onNext}
          className="px-6 py-2.5 text-sm font-semibold bg-orange-500 hover:bg-orange-600 text-white rounded-xl shadow-md shadow-orange-200 transition"
        >
          ถัดไป → ดู Preview
        </button>
      </div>
    </div>
  );
}
