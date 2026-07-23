"use client";

import { useState, useEffect } from "react";
import { DeliveryOption } from "./types";
import { X, Upload, AlertCircle } from "lucide-react";

interface AddDeliveryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (delivery: DeliveryOption) => void;
  editingDelivery?: DeliveryOption | null;
}

export default function AddDeliveryModal({
  isOpen,
  onClose,
  onSave,
  editingDelivery,
}: AddDeliveryModalProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [baseFee, setBaseFee] = useState<number | "">(0);
  const [freeShippingThreshold, setFreeShippingThreshold] = useState<number | "">("");
  const [isActive, setIsActive] = useState(true);

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (editingDelivery) {
      setName(editingDelivery.name);
      setDescription(editingDelivery.description || "");
      setBaseFee(editingDelivery.baseFee);
      setFreeShippingThreshold(
        editingDelivery.freeShippingThreshold !== undefined
          ? editingDelivery.freeShippingThreshold
          : ""
      );
      setIsActive(editingDelivery.isActive);
    } else {
      setName("");
      setDescription("");
      setBaseFee(40);
      setFreeShippingThreshold("");
      setIsActive(true);
    }
    setErrors({});
  }, [editingDelivery, isOpen]);

  if (!isOpen) return null;

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!name.trim()) errs.name = "กรุณากรอกชื่อประเภทการจัดส่ง";
    if (baseFee === "" || Number(baseFee) < 0) errs.baseFee = "กรุณากรอกค่าจัดส่งเริ่มต้นที่ถูกต้อง";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const delivery: DeliveryOption = {
      id: editingDelivery ? editingDelivery.id : `delivery-${Date.now()}`,
      name: name.trim(),
      description: description.trim() || undefined,
      baseFee: Number(baseFee),
      freeShippingThreshold:
        freeShippingThreshold !== "" && Number(freeShippingThreshold) > 0
          ? Number(freeShippingThreshold)
          : undefined,
      isActive,
    };

    onSave(delivery);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col my-auto">
        {/* Modal Header */}
        <div className="p-4 sm:p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50 shrink-0">
          <div>
            <h3 className="text-lg font-bold text-gray-800">
              {editingDelivery ? "แก้ไขประเภทการจัดส่ง" : "เพิ่มประเภทการจัดส่ง"}
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              ตั้งค่าอัตราค่าจัดส่งและเงื่อนไขส่งฟรีสำหรับลูกค้า
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-200/60 transition"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-5 overflow-y-auto">
          {/* Name */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">
              ชื่อผู้ให้บริการ / ประเภทการจัดส่ง <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              placeholder="เช่น Kerry Express, รับหน้าร้าน, ไปรษณีย์ EMS"
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
              คำอธิบายสั้น ๆ
            </label>
            <textarea
              rows={2}
              placeholder="เช่น จัดส่งด่วน รับสินค้าภายใน 1-2 วันทำการ..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/25 focus:border-orange-500"
            />
          </div>

          {/* Base Fee & Free Shipping Threshold Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                ค่าจัดส่งเริ่มต้น (บาท) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                min="0"
                step="5"
                placeholder="0"
                value={baseFee}
                onChange={(e) =>
                  setBaseFee(e.target.value === "" ? "" : Number(e.target.value))
                }
                className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/25 focus:border-orange-500"
              />
              {errors.baseFee && (
                <p className="text-xs text-red-500 mt-1">{errors.baseFee}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                ฟรีเมื่อยอดซื้อขั้นต่ำ (บาท)
              </label>
              <input
                type="number"
                min="0"
                step="50"
                placeholder="เช่น 500 (ว่างไว้ถ้าไม่มีโปรส่งฟรี)"
                value={freeShippingThreshold}
                onChange={(e) =>
                  setFreeShippingThreshold(
                    e.target.value === "" ? "" : Number(e.target.value)
                  )
                }
                className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/25 focus:border-orange-500"
              />
            </div>
          </div>

          {/* Logo Upload (Mock) */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">
              โลโก้ / ไอคอนผู้ให้บริการ (ถ้ามี)
            </label>
            <div className="border-2 border-dashed border-gray-200 rounded-xl p-3 text-center hover:border-orange-400 transition-colors cursor-pointer bg-gray-50/50">
              <Upload size={20} className="mx-auto text-gray-400 mb-1" />
              <p className="text-xs text-gray-600 font-medium">อัปโหลดโลโก้ขนส่ง</p>
            </div>
          </div>

          {/* Active Status */}
          <div className="flex items-center justify-between p-3.5 bg-gray-50 rounded-xl border border-gray-100">
            <div>
              <div className="text-xs font-bold text-gray-800">เปิดใช้งานวิธีการจัดส่งนี้</div>
              <div className="text-[11px] text-gray-500">
                หากเปิดอยู่ ลูกค้าจะเห็นตัวเลือกนี้ในหน้าชำระเงิน
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsActive(!isActive)}
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
          <div className="flex justify-end gap-3 pt-3 border-t border-gray-100 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-xl transition"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-sm font-medium text-white bg-orange-500 hover:bg-orange-600 rounded-xl shadow-md shadow-orange-200 transition"
            >
              บันทึกการจัดส่ง
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
