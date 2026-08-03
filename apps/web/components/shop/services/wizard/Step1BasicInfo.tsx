"use client";

import { useState, useRef } from "react";
import { ImageIcon, Upload, X, Loader2, Check } from "lucide-react";
import { uploadFile } from "@/lib/api/uploads";
import { SERVICE_TEMPLATES, BLANK_TEMPLATE, type ServiceTemplate } from "./serviceTemplates";

// สถานะบริการมีแค่ 2 แบบ — เปิดใช้งาน (ลูกค้าเห็น) กับ แบบร่าง (ซ่อนจากลูกค้า ร้านกลับมาแก้ไข/เปิดใช้งานทีหลังได้)
// ตรงกับ backend ที่มีแค่ main_services.is_active (boolean) เดียว ไม่มีสถานะที่ 3 แยกต่างหาก
export type ServiceStatus = "draft" | "active";

export interface Step1Data {
  name: string;
  description: string;
  imageUrl: string;
  status: ServiceStatus;
}

const STATUS_OPTIONS: { value: ServiceStatus; label: string; color: string; bg: string }[] = [
  { value: "active", label: "เปิดใช้งาน", color: "text-emerald-700", bg: "bg-emerald-50 border-emerald-300" },
  { value: "draft", label: "แบบร่าง (ซ่อนจากลูกค้า)", color: "text-amber-700", bg: "bg-amber-50 border-amber-300" },
];

interface Step1BasicInfoProps {
  data: Step1Data;
  onChange: (data: Step1Data) => void;
  onNext: () => void;
  onBack: () => void;
  mode: "create" | "edit";
  onSelectTemplate: (template: ServiceTemplate) => void;
}

export default function Step1BasicInfo({ data, onChange, onNext, onBack, mode, onSelectTemplate }: Step1BasicInfoProps) {
  const [errors, setErrors] = useState<Partial<Record<keyof Step1Data, string>>>({});
  const [uploading, setUploading] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleTemplateClick = (tpl: ServiceTemplate) => {
    setSelectedTemplateId(tpl.id);
    onSelectTemplate(tpl);
  };

  const validate = () => {
    const errs: typeof errors = {};
    if (!data.name.trim()) errs.name = "กรุณากรอกชื่อบริการ";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleNext = () => {
    if (validate()) onNext();
  };

  const handleImageUpload = async (file: File) => {
    setUploading(true);
    try {
      const result = await uploadFile(file, "service-image");
      onChange({ ...data, imageUrl: result.url ?? "" });
    } catch {
      // silently ignore — user can retry
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900">ข้อมูลพื้นฐาน</h2>
        <p className="text-sm text-gray-500 mt-1">กรอกข้อมูลเบื้องต้นของบริการที่จะสร้าง</p>
      </div>

      {/* Service Template — เลือกประเภทสินค้าเพื่อ prefill ตัวเลือก/สี/ราคาเริ่มต้น (แค่ค่าเริ่มต้น แก้ไขได้ทั้งหมดในขั้นตอนถัดไป) */}
      {mode === "create" && (
        <div className="space-y-1.5">
          <label className="block text-sm font-semibold text-gray-700">เลือกประเภทบริการ (ไม่บังคับ)</label>
          <p className="text-xs text-gray-400">
            ระบบจะสร้างตัวเลือก/สี/ราคาเริ่มต้นให้ตามประเภทที่เลือก — แก้ไข เพิ่ม หรือลบได้ทั้งหมดในขั้นตอนถัดไป
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[...SERVICE_TEMPLATES, BLANK_TEMPLATE].map((tpl) => {
              const selected = selectedTemplateId === tpl.id;
              return (
                <button
                  key={tpl.id}
                  type="button"
                  onClick={() => handleTemplateClick(tpl)}
                  className={`relative flex flex-col items-center gap-1 p-3 rounded-xl border-2 text-center transition-all ${
                    selected
                      ? "border-orange-400 bg-orange-50 shadow-sm"
                      : "border-gray-200 bg-white hover:border-orange-200 hover:bg-orange-50/30"
                  }`}
                >
                  <span className="text-xl">{tpl.icon}</span>
                  <span className={`text-xs font-semibold ${selected ? "text-orange-700" : "text-gray-700"}`}>{tpl.label}</span>
                  {selected && (
                    <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-orange-500 rounded-full flex items-center justify-center">
                      <Check size={10} className="text-white" strokeWidth={3} />
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Service Name */}
      <div className="space-y-1.5">
        <label className="block text-sm font-semibold text-gray-700">
          ชื่อบริการ <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={data.name}
          onChange={(e) => {
            onChange({ ...data, name: e.target.value });
            if (errors.name) setErrors({ ...errors, name: undefined });
          }}
          placeholder="เช่น ปริ้นเอกสาร A4, ป้ายไวนิล, นามบัตร"
          className={`w-full px-4 py-2.5 text-sm border rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/25 focus:border-orange-500 transition ${
            errors.name ? "border-red-400 bg-red-50" : "border-gray-200"
          }`}
        />
        {errors.name && (
          <p className="text-xs text-red-500 font-medium">{errors.name}</p>
        )}
      </div>

      {/* Image Upload */}
      <div className="space-y-1.5">
        <label className="block text-sm font-semibold text-gray-700">รูปภาพบริการ</label>
        <div
          onClick={() => !uploading && fileInputRef.current?.click()}
          className={`relative flex flex-col items-center justify-center border-2 border-dashed rounded-2xl transition cursor-pointer group ${
            data.imageUrl
              ? "border-orange-300 bg-orange-50"
              : "border-gray-200 hover:border-orange-300 hover:bg-orange-50/40"
          }`}
          style={{ minHeight: "10rem" }}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleImageUpload(file);
            }}
          />
          {uploading ? (
            <div className="flex flex-col items-center gap-2 text-orange-400">
              <Loader2 size={28} className="animate-spin" />
              <span className="text-xs font-medium">กำลังอัปโหลด...</span>
            </div>
          ) : data.imageUrl ? (
            <div className="relative w-full h-40">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={data.imageUrl}
                alt="service preview"
                className="w-full h-full object-cover rounded-2xl"
              />
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onChange({ ...data, imageUrl: "" });
                }}
                className="absolute top-2 right-2 w-7 h-7 bg-white/90 rounded-full flex items-center justify-center shadow-md hover:bg-red-50 text-gray-500 hover:text-red-500 transition"
              >
                <X size={14} />
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2 text-gray-400 group-hover:text-orange-400 transition py-6">
              <div className="w-12 h-12 rounded-2xl bg-gray-100 group-hover:bg-orange-100 flex items-center justify-center transition">
                <ImageIcon size={22} />
              </div>
              <div className="text-center">
                <p className="text-sm font-medium">คลิกเพื่ออัปโหลดรูปภาพ</p>
                <p className="text-xs mt-0.5">PNG, JPG, WEBP ไม่เกิน 5MB</p>
              </div>
              <div className="flex items-center gap-1.5 px-4 py-2 bg-white border border-gray-200 rounded-xl text-xs font-medium text-gray-600 group-hover:border-orange-300 transition">
                <Upload size={13} />
                <span>เลือกไฟล์</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Description */}
      <div className="space-y-1.5">
        <label className="block text-sm font-semibold text-gray-700">คำอธิบาย</label>
        <textarea
          value={data.description}
          onChange={(e) => onChange({ ...data, description: e.target.value })}
          placeholder="อธิบายบริการนี้สั้น ๆ เพื่อให้ลูกค้าเข้าใจ เช่น ปริ้นเอกสาร A4 ขาวดำและสี รองรับไฟล์ PDF"
          rows={3}
          className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/25 focus:border-orange-500 transition resize-none"
        />
      </div>

      {/* Status */}
      <div className="space-y-2">
        <label className="block text-sm font-semibold text-gray-700">สถานะ</label>
        <div className="flex flex-wrap gap-2">
          {STATUS_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => onChange({ ...data, status: opt.value })}
              className={`px-4 py-2 rounded-xl border-2 text-sm font-medium transition-all duration-150 ${
                data.status === opt.value
                  ? `${opt.bg} ${opt.color} shadow-sm`
                  : "bg-white border-gray-200 text-gray-500 hover:border-gray-300"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
        {data.status === "draft" && (
          <p className="text-xs text-amber-600">แบบร่างจะไม่แสดงให้ลูกค้าเห็น จนกว่าจะเปลี่ยนเป็นเปิดใช้งาน</p>
        )}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-100">
        <button
          onClick={onBack}
          className="px-5 py-2.5 text-sm font-medium text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 transition"
        >
          ยกเลิก
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
