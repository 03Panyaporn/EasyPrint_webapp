"use client";

import { useState } from "react";
import { DeliveryOption } from "./types";
import { Pencil, Trash2, Plus, Truck, Store, Package } from "lucide-react";

interface DeliverySettingsTableProps {
  deliveryOptions: DeliveryOption[];
  isAllDeliveryEnabled: boolean;
  onToggleAllDelivery: () => void;
  onAddClick: () => void;
  onEditClick: (option: DeliveryOption) => void;
  onDeleteClick: (id: string) => void;
  onToggleActive: (id: string) => void;
}

export default function DeliverySettingsTable({
  deliveryOptions,
  isAllDeliveryEnabled,
  onToggleAllDelivery,
  onAddClick,
  onEditClick,
  onDeleteClick,
  onToggleActive,
}: DeliverySettingsTableProps) {
  return (
    <div className="space-y-6">
      {/* Global toggle banner */}
      <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm flex items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center shrink-0">
            <Truck size={22} />
          </div>
          <div>
            <h3 className="font-bold text-gray-800 text-base">
              เปิดใช้งานระบบการจัดส่งทั้งหมด
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              เปิดเพื่ออนุญาตให้ลูกค้าเลือกรอบส่งพัสดุและจัดส่งตามตัวเลือกด้านล่าง
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <span className="text-xs font-semibold text-gray-600 hidden sm:inline">
            {isAllDeliveryEnabled ? "เปิดใช้งานอยู่" : "ปิดการจัดส่งทั้งหมด"}
          </span>
          <button
            onClick={onToggleAllDelivery}
            className={`relative inline-flex h-7 w-14 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
              isAllDeliveryEnabled ? "bg-orange-500" : "bg-gray-300"
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                isAllDeliveryEnabled ? "translate-x-7" : "translate-x-0"
              }`}
            />
          </button>
        </div>
      </div>

      {/* Main Table Container */}
      <div
        className={`bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden transition-all duration-300 ${
          !isAllDeliveryEnabled ? "opacity-45 pointer-events-none" : ""
        }`}
      >
        {/* Header bar */}
        <div className="p-4 sm:p-6 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-gray-800">ประเภทและอัตราค่าจัดส่ง</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              จัดการวิธีการจัดส่งสินค้า ค่าบริการ และโปรโมชันส่งฟรี
            </p>
          </div>
          <button
            onClick={onAddClick}
            disabled={!isAllDeliveryEnabled}
            className="flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white font-medium text-sm rounded-xl shadow-md shadow-orange-200 transition-colors shrink-0 self-start sm:self-auto"
          >
            <Plus size={16} />
            <span>+ เพิ่มประเภทการจัดส่ง</span>
          </button>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-gray-50/80 text-gray-600 font-semibold border-b border-gray-100">
                <th className="py-3.5 px-4 sm:px-6">ประเภทการจัดส่ง</th>
                <th className="py-3.5 px-4 text-center">สถานะ</th>
                <th className="py-3.5 px-4">ค่าจัดส่งเริ่มต้น</th>
                <th className="py-3.5 px-4">ฟรีเมื่อสั่งขั้นต่ำ</th>
                <th className="py-3.5 px-4 text-right">จัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {deliveryOptions.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-gray-400">
                    <Truck size={32} className="mx-auto mb-2 opacity-50" />
                    <p className="text-sm font-medium">ยังไม่มีประเภทการจัดส่ง</p>
                  </td>
                </tr>
              ) : (
                deliveryOptions.map((option) => (
                  <tr
                    key={option.id}
                    className={`hover:bg-orange-50/30 transition-colors ${
                      !option.isActive ? "bg-gray-50/50 opacity-60" : ""
                    }`}
                  >
                    {/* Name & Logo */}
                    <td className="py-4 px-4 sm:px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center shrink-0 border border-orange-100 text-orange-600 font-bold text-xs">
                          {option.name === "รับหน้าร้าน" ? (
                            <Store size={20} />
                          ) : (
                            <Package size={20} />
                          )}
                        </div>
                        <div>
                          <div className="font-semibold text-gray-800">{option.name}</div>
                          {option.description && (
                            <div className="text-xs text-gray-400 mt-0.5 truncate max-w-sm">
                              {option.description}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Toggle Active */}
                    <td className="py-4 px-4 text-center">
                      <button
                        onClick={() => onToggleActive(option.id)}
                        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                          option.isActive ? "bg-orange-500" : "bg-gray-200"
                        }`}
                        aria-label="เปิดปิดตัวเลือกการจัดส่ง"
                      >
                        <span
                          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                            option.isActive ? "translate-x-5" : "translate-x-0"
                          }`}
                        />
                      </button>
                    </td>

                    {/* Base Fee */}
                    <td className="py-4 px-4 font-bold text-gray-800">
                      {option.baseFee === 0 ? (
                        <span className="text-green-600">ฟรี (฿0)</span>
                      ) : (
                        `฿${option.baseFee.toLocaleString()}`
                      )}
                    </td>

                    {/* Free Shipping Threshold */}
                    <td className="py-4 px-4">
                      {option.freeShippingThreshold && option.freeShippingThreshold > 0 ? (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-100">
                          ส่งฟรีเมื่อครบ ฿{option.freeShippingThreshold.toLocaleString()}
                        </span>
                      ) : (
                        <span className="text-xs text-gray-400">ไม่มีขั้นต่ำ</span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-4 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => onEditClick(option)}
                          className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 transition-colors"
                          title="แก้ไข"
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`คุณต้องการลบประเภทการจัดส่ง "${option.name}" หรือไม่?`)) {
                              onDeleteClick(option.id);
                            }
                          }}
                          className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 transition-colors"
                          title="ลบ"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
