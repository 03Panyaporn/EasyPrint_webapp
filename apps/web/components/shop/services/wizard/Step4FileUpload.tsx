"use client";

import { X } from "lucide-react";
import { UPLOADABLE_FILE_TYPES } from "@easyprint/shared";
import type { AllowedFileType } from "../types";

export interface Step4Data {
  requiresFileUpload: boolean;
  allowedFileTypes: AllowedFileType[];
}

// ชนิดไฟล์ที่เลือกได้ต้องมาจาก UPLOADABLE_FILE_TYPES เท่านั้น (ระบบอัปโหลดจริงรับแค่ชุดนี้ — ai/psd ไม่อยู่ในนี้เพราะอัปโหลดไม่ได้จริง)
// เดิมมีช่องให้พิมพ์นามสกุลไฟล์เองได้อิสระ (เช่น docx) แต่ backend ปฏิเสธค่านอกรายการนี้เสมอ ร้านจะเจอ error ตอนกด "บันทึก" เท่านั้น — ตัดช่องนั้นออก เหลือแค่เลือกจากรายการที่ใช้ได้จริง
const ALL_FILE_TYPES: { value: AllowedFileType; label: string }[] = UPLOADABLE_FILE_TYPES.map((value) => ({
  value,
  label: value.toUpperCase(),
}));

interface Step4FileUploadProps {
  data: Step4Data;
  onChange: (data: Step4Data) => void;
  onNext: () => void;
  onBack: () => void;
}

export default function Step4FileUpload({ data, onChange, onNext, onBack }: Step4FileUploadProps) {
  const toggleFileType = (type: AllowedFileType) => {
    const has = data.allowedFileTypes.includes(type);
    const updated = has
      ? data.allowedFileTypes.filter((t) => t !== type)
      : [...data.allowedFileTypes, type];
    onChange({ ...data, allowedFileTypes: updated });
  };

  const removeFileType = (type: AllowedFileType) =>
    onChange({ ...data, allowedFileTypes: data.allowedFileTypes.filter((t) => t !== type) });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900">ไฟล์ที่ลูกค้าอัปโหลด</h2>
        <p className="text-sm text-gray-500 mt-1">
          ลูกค้าแนบไฟล์งานได้เสมอ (ไม่บังคับ) — กำหนดแค่ประเภทไฟล์ที่ร้านรับ
        </p>
      </div>

      {/* File type selector */}
      <div className="space-y-4 p-4 bg-gray-50 rounded-2xl border border-gray-100">
        {/* Preset file types */}
        <div className="space-y-2">
          <p className="text-sm font-semibold text-gray-700">ประเภทไฟล์ที่รับ</p>
          <div className="flex flex-wrap gap-2">
            {ALL_FILE_TYPES.map((ft) => {
              const selected = data.allowedFileTypes.includes(ft.value);
              return (
                <button
                  key={ft.value}
                  onClick={() => toggleFileType(ft.value)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold border-2 transition-all ${
                    selected
                      ? "bg-orange-50 border-orange-500 text-orange-600 shadow-sm"
                      : "bg-white border-gray-200 text-gray-400 hover:border-gray-300"
                  }`}
                >
                  .{ft.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* ค่าเก่าที่นอกเหนือจากรายการปัจจุบัน (เช่น เคยกรอกนามสกุลอื่นเองไว้ก่อนตัดช่องนี้ออก) — แสดงไว้ให้ลบทิ้งได้ แต่เพิ่มใหม่ไม่ได้แล้ว */}
        {data.allowedFileTypes.some((t) => !ALL_FILE_TYPES.map((f) => f.value).includes(t)) && (
          <div className="flex flex-wrap gap-1.5">
            {data.allowedFileTypes
              .filter((t) => !ALL_FILE_TYPES.map((f) => f.value).includes(t))
              .map((t) => (
                <span
                  key={t}
                  className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold bg-gray-200 text-gray-600 rounded-lg"
                >
                  .{t.toUpperCase()}
                  <button onClick={() => removeFileType(t)} className="hover:text-red-500 transition ml-0.5">
                    <X size={11} />
                  </button>
                </span>
              ))}
          </div>
        )}

        {data.allowedFileTypes.length === 0 && (
          <p className="text-xs text-red-500">⚠ ต้องเลือกอย่างน้อย 1 ประเภทไฟล์</p>
        )}

        <p className="text-xs text-gray-400 pt-2 border-t border-gray-200">
          ขนาดไฟล์สูงสุดและจำนวนไฟล์ต่อรายการถูกกำหนดโดยระบบส่วนกลาง ร้านค้าไม่ต้องตั้งค่าเอง
        </p>
      </div>

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
          ถัดไป →
        </button>
      </div>
    </div>
  );
}
