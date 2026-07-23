"use client";

import { useState } from "react";
import { AddOnService } from "./types";
import { Pencil, Trash2, Plus, Clock, Layers } from "lucide-react";

interface AddOnServicesTableProps {
  addOns: AddOnService[];
  onAddClick: () => void;
  onEditClick: (addOn: AddOnService) => void;
  onDeleteClick: (id: string) => void;
  onToggleActive: (id: string) => void;
}

export default function AddOnServicesTable({
  addOns,
  onAddClick,
  onEditClick,
  onDeleteClick,
  onToggleActive,
}: AddOnServicesTableProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const filteredAddOns = addOns.filter(
    (a) =>
      a.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (a.description && a.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const totalPages = Math.ceil(filteredAddOns.length / itemsPerPage) || 1;
  const paginatedAddOns = filteredAddOns.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      {/* Header bar */}
      <div className="p-4 sm:p-6 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-gray-800">รายการบริการเสริม</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            ตัวเลือกเพิ่มเติม เช่น เข้าเล่ม เคลือบเอกสาร ปกใส เป็นต้น
          </p>
        </div>
        <div className="flex items-center gap-3">
          <input
            type="text"
            placeholder="ค้นหาบริการเสริม..."
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
              <th className="py-3.5 px-4">ราคา (บาท)</th>
              <th className="py-3.5 px-4">หน่วย</th>
              <th className="py-3.5 px-4">เวลาดำเนินการ</th>
              <th className="py-3.5 px-4 text-center">เปิด/ปิด</th>
              <th className="py-3.5 px-4 text-right">จัดการ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {paginatedAddOns.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-12 text-center text-gray-400">
                  <Layers size={32} className="mx-auto mb-2 opacity-50" />
                  <p className="text-sm font-medium">ไม่พบข้อมูลบริการเสริม</p>
                </td>
              </tr>
            ) : (
              paginatedAddOns.map((addOn) => (
                <tr
                  key={addOn.id}
                  className={`hover:bg-orange-50/30 transition-colors ${
                    !addOn.isActive ? "bg-gray-50/50 opacity-60" : ""
                  }`}
                >
                  {/* Name + Description */}
                  <td className="py-4 px-4 sm:px-6">
                    <div className="font-semibold text-gray-800">{addOn.name}</div>
                    {addOn.description && (
                      <div className="text-xs text-gray-400 mt-0.5 truncate max-w-sm">
                        {addOn.description}
                      </div>
                    )}
                  </td>

                  {/* Price */}
                  <td className="py-4 px-4 font-bold text-orange-600">
                    ฿{addOn.price.toLocaleString()}
                  </td>

                  {/* Unit */}
                  <td className="py-4 px-4 text-gray-600">
                    ต่อ{addOn.unit}
                  </td>

                  {/* Estimated time */}
                  <td className="py-4 px-4 text-gray-500 text-xs">
                    {addOn.estimatedTime ? (
                      <span className="flex items-center gap-1">
                        <Clock size={13} className="text-gray-400" />
                        {addOn.estimatedTime}
                      </span>
                    ) : (
                      "-"
                    )}
                  </td>

                  {/* Toggle active */}
                  <td className="py-4 px-4 text-center">
                    <button
                      onClick={() => onToggleActive(addOn.id)}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        addOn.isActive ? "bg-orange-500" : "bg-gray-200"
                      }`}
                      aria-label="เปิดปิดบริการเสริม"
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                          addOn.isActive ? "translate-x-5" : "translate-x-0"
                        }`}
                      />
                    </button>
                  </td>

                  {/* Actions */}
                  <td className="py-4 px-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => onEditClick(addOn)}
                        className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 transition-colors"
                        title="แก้ไข"
                      >
                        <Pencil size={16} />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`คุณต้องการลบบริการเสริม "${addOn.name}" หรือไม่?`)) {
                            onDeleteClick(addOn.id);
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
          แสดง {paginatedAddOns.length} จากทั้งหมด {filteredAddOns.length} รายการ
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
