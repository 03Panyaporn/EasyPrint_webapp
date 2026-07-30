"use client";

import { useState } from "react";
import { MainService, AddOnService, PricingModel } from "./types";
import { Pencil, Trash2, Copy, Plus, Clock, FileText } from "lucide-react";

const PRICING_MODEL_LABEL: Record<PricingModel, string> = {
  per_page: "/หน้า",
  per_piece: "/ชิ้น",
  per_sqm: "/ตร.ม.",
  fixed: " เหมาจ่าย",
};
const PRICING_MODEL_HINT: Record<PricingModel, string> = {
  per_page: "ตามจำนวนหน้า PDF ที่นับได้",
  per_piece: "ตามจำนวนชุดที่สั่ง",
  per_sqm: "ตามพื้นที่ที่ลูกค้ากรอก",
  fixed: "ราคาเดียวทั้งงาน",
};

interface MainServicesTableProps {
  services: MainService[];
  allAddOns: AddOnService[];
  onAddClick: () => void;
  onEditClick: (service: MainService) => void;
  onDuplicateClick: (service: MainService) => void;
  onDeleteClick: (id: string) => void;
  onToggleActive: (id: string) => void;
}

export default function MainServicesTable({
  services,
  allAddOns,
  onAddClick,
  onEditClick,
  onDuplicateClick,
  onDeleteClick,
  onToggleActive,
}: MainServicesTableProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const filteredServices = services.filter(
    (s) =>
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.description && s.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const totalPages = Math.ceil(filteredServices.length / itemsPerPage) || 1;
  const paginatedServices = filteredServices.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      {/* Header bar */}
      <div className="p-4 sm:p-6 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-gray-800">รายการบริการหลัก</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            บริการพิมพ์ ถ่ายเอกสาร สแกน ที่เปิดให้บริการแก่ลูกค้า
          </p>
        </div>
        <div className="flex items-center gap-3">
          <input
            type="text"
            placeholder="ค้นหาบริการหลัก..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="px-3.5 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/25 focus:border-orange-500 w-full sm:w-64"
          />
          <button
            onClick={onAddClick}
            className="flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white font-medium text-sm rounded-xl shadow-md shadow-orange-200 transition-colors shrink-0"
          >
            <Plus size={16} />
            <span>+ เพิ่มบริการ</span>
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-sm">
          <thead>
            <tr className="bg-gray-50/80 text-gray-600 font-semibold border-b border-gray-100">
              <th className="py-3.5 px-4 sm:px-6">ชื่อบริการ</th>
              <th className="py-3.5 px-4">ราคา</th>
              <th className="py-3.5 px-4">หน่วย</th>
              <th className="py-3.5 px-4">เวลาทำการ</th>
              <th className="py-3.5 px-4 text-center">บริการเสริม</th>
              <th className="py-3.5 px-4 text-center">เปิด/ปิด</th>
              <th className="py-3.5 px-4 text-right">จัดการ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {paginatedServices.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-gray-400">
                  <FileText size={32} className="mx-auto mb-2 opacity-50" />
                  <p className="text-sm font-medium">ไม่พบข้อมูลบริการหลัก</p>
                </td>
              </tr>
            ) : (
              paginatedServices.map((service) => (
                <tr
                  key={service.id}
                  className={`hover:bg-orange-50/30 transition-colors ${
                    !service.isActive ? "bg-gray-50/50 opacity-60" : ""
                  }`}
                >
                  {/* Name + Description */}
                  <td className="py-4 px-4 sm:px-6">
                    <div className="font-semibold text-gray-800">{service.name}</div>
                    {service.description && (
                      <div className="text-xs text-gray-400 mt-0.5 truncate max-w-xs">
                        {service.description}
                      </div>
                    )}
                  </td>

                  {/* Price (ราคาพื้นฐานตาม pricingModel + จำนวนตัวเลือก) */}
                  <td className="py-4 px-4">
                    <div>
                      <div className="font-bold text-orange-600">
                        ฿{service.basePrice.toLocaleString()}
                        {PRICING_MODEL_LABEL[service.pricingModel]}
                      </div>
                      <div className="text-xs text-gray-400 mt-0.5">{PRICING_MODEL_HINT[service.pricingModel]}</div>
                      {service.options.length > 0 && (
                        <div className="text-[11px] text-gray-400 mt-0.5">{service.options.length} ตัวเลือกเสริม</div>
                      )}
                    </div>
                  </td>

                  {/* Unit */}
                  <td className="py-4 px-4 text-gray-600">
                    ต่อ{service.unit}
                  </td>

                  {/* Estimated time */}
                  <td className="py-4 px-4 text-gray-500 text-xs">
                    {service.estimatedTime ? (
                      <span className="flex items-center gap-1">
                        <Clock size={13} className="text-gray-400" />
                        {service.estimatedTime}
                      </span>
                    ) : (
                      "-"
                    )}
                  </td>

                  {/* Add-ons count badge */}
                  <td className="py-4 px-4 text-center">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-50 text-orange-600 border border-orange-100">
                      {service.availableAddOns.length} รายการ
                    </span>
                  </td>

                  {/* Toggle active */}
                  <td className="py-4 px-4 text-center">
                    <button
                      onClick={() => {
                        if (service.isActive) {
                          const confirmed = confirm(
                            `คุณต้องการปิดบริการ "${service.name}" หรือไม่?\n\nลูกค้าจะไม่สามารถเลือกบริการนี้ได้จนกว่าจะเปิดใช้งานอีกครั้ง`
                          );
                          if (!confirmed) return;
                        }
                        onToggleActive(service.id);
                      }}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        service.isActive ? "bg-orange-500" : "bg-gray-200"
                      }`}
                      aria-label="เปิดปิดบริการ"
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                          service.isActive ? "translate-x-5" : "translate-x-0"
                        }`}
                      />
                    </button>
                  </td>

                  {/* Actions */}
                  <td className="py-4 px-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => onEditClick(service)}
                        className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 transition-colors"
                        title="แก้ไข"
                      >
                        <Pencil size={16} />
                      </button>
                      <button
                        onClick={() => onDuplicateClick(service)}
                        className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
                        title="คัดลอกบริการ"
                      >
                        <Copy size={16} />
                      </button>
                      <button
                        onClick={() => {
                          if (
                            confirm(
                              `คุณต้องการลบบริการ "${service.name}" หรือไม่?\n\nข้อมูลตัวเลือก/ราคาที่ตั้งไว้ของบริการนี้จะถูกลบทั้งหมด และลูกค้าจะไม่เห็นบริการนี้อีก`
                            )
                          ) {
                            onDeleteClick(service.id);
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

      {/* Pagination Footer */}
      <div className="p-4 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-500">
        <div>
          แสดง {paginatedServices.length} จากทั้งหมด {filteredServices.length} รายการ
        </div>
        <div className="flex items-center gap-1">
          <button
            disabled={currentPage === 1}
            onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
            className="px-3 py-1.5 border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50 transition"
          >
            ก่อนหน้า
          </button>
          <span className="px-3 py-1.5 font-medium text-gray-700">
            {currentPage} / {totalPages}
          </span>
          <button
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
            className="px-3 py-1.5 border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50 transition"
          >
            ถัดไป
          </button>
        </div>
      </div>
    </div>
  );
}
