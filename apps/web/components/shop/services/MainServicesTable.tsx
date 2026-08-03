"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Pencil,
  Trash2,
  Copy,
  Plus,
  FileText,
  Search,
  Package,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import type { MainService, AddOnService, PricingModel } from "./types";
import DuplicateNameModal from "./DuplicateNameModal";

const PRICING_MODEL_LABEL: Record<PricingModel, string> = {
  per_page: "ต่อหน้า",
  per_piece: "ต่อชิ้น",
  per_sqm: "ต่อตารางเมตร",
  fixed: "เหมาจ่าย",
};

const PRICING_MODEL_ICON: Record<PricingModel, string> = {
  per_page: "📄",
  per_piece: "📦",
  per_sqm: "📏",
  fixed: "🏷️",
};

const STATUS_BADGE = {
  active: "bg-emerald-50 text-emerald-700 border-emerald-200",
  inactive: "bg-gray-100 text-gray-500 border-gray-200",
};

interface MainServicesListProps {
  services: MainService[];
  allAddOns: AddOnService[];
  onDuplicateClick: (service: MainService, newName: string) => Promise<void>;
  onDeleteClick: (id: string) => void;
  onToggleActive: (id: string) => void;
}

export default function MainServicesList({
  services,
  allAddOns,
  onDuplicateClick,
  onDeleteClick,
  onToggleActive,
}: MainServicesListProps) {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [duplicateTarget, setDuplicateTarget] = useState<MainService | null>(null);
  const itemsPerPage = 9;

  const filtered = services.filter(
    (s) =>
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.description ?? "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / itemsPerPage));
  const paginated = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  // helpers
  const getAddOnNames = (service: MainService) =>
    service.availableAddOns
      .map((b) => allAddOns.find((a) => a.id === b.addOnId)?.name)
      .filter(Boolean) as string[];

  const handleDuplicateConfirm = async (newName: string) => {
    if (!duplicateTarget) return;
    await onDuplicateClick(duplicateTarget, newName);
    setDuplicateTarget(null);
  };

  return (
    <>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
        <div>
          <h2 className="text-lg font-bold text-gray-800">รายการบริการหลัก</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            {services.length > 0
              ? `${services.length} บริการ · ${services.filter((s) => s.isActive).length} เปิดใช้งาน`
              : "บริการพิมพ์ ถ่ายเอกสาร ที่เปิดให้บริการแก่ลูกค้า"}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* Search */}
          <div className="relative">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
            />
            <input
              type="text"
              placeholder="ค้นหาบริการ..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="pl-8 pr-4 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/25 focus:border-orange-500 w-52"
            />
          </div>
          {/* Add button */}
          <button
            onClick={() => router.push("/shop/services/new")}
            className="flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white font-semibold text-sm rounded-xl shadow-md shadow-orange-200 transition shrink-0"
          >
            <Plus size={16} />
            เพิ่มบริการ
          </button>
        </div>
      </div>

      {/* Empty state */}
      {paginated.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
          <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center text-gray-300">
            <FileText size={30} />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-600">
              {searchTerm ? "ไม่พบบริการที่ค้นหา" : "ยังไม่มีบริการหลัก"}
            </p>
            <p className="text-xs text-gray-400 mt-1">
              {searchTerm
                ? "ลองเปลี่ยนคำค้นหา"
                : "กด \"เพิ่มบริการ\" เพื่อสร้างบริการแรกของร้าน"}
            </p>
          </div>
          {!searchTerm && (
            <button
              onClick={() => router.push("/shop/services/new")}
              className="flex items-center gap-2 px-5 py-2.5 bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold rounded-xl shadow-md shadow-orange-200 transition"
            >
              <Plus size={16} />
              เพิ่มบริการแรก
            </button>
          )}
        </div>
      )}

      {/* Card Grid */}
      {paginated.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {paginated.map((service) => {
            const addOnNames = getAddOnNames(service);
            const isQtyTier =
              service.pricingModel === "per_piece" && service.quantityTiers.length > 0;

            return (
              <div
                key={service.id}
                className={`group bg-white rounded-2xl border-2 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden ${
                  service.isActive ? "border-gray-100 hover:border-orange-200" : "border-gray-100 opacity-60"
                }`}
              >
                {/* Service image or gradient header */}
                <div className="relative h-24 overflow-hidden">
                  {service.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={service.imageUrl}
                      alt={service.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-orange-50 to-amber-50 flex items-center justify-center">
                      <span className="text-4xl opacity-40">
                        {PRICING_MODEL_ICON[service.pricingModel]}
                      </span>
                    </div>
                  )}
                  {/* Status badge overlay */}
                  <div className="absolute top-2.5 left-2.5">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                        service.isActive
                          ? STATUS_BADGE.active
                          : STATUS_BADGE.inactive
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${service.isActive ? "bg-emerald-500" : "bg-gray-400"}`}
                      />
                      {service.isActive ? "เปิดใช้งาน" : "ปิดใช้งาน"}
                    </span>
                  </div>
                  {/* Toggle active */}
                  <div className="absolute top-2.5 right-2.5">
                    <button
                      onClick={() => {
                        if (service.isActive) {
                          if (
                            !confirm(
                              `ปิดบริการ "${service.name}"?\nลูกค้าจะไม่เห็นบริการนี้จนกว่าจะเปิดอีกครั้ง`
                            )
                          )
                            return;
                        }
                        onToggleActive(service.id);
                      }}
                      className={`relative w-10 h-5 rounded-full border-2 border-transparent transition-colors shadow-sm ${
                        service.isActive ? "bg-emerald-500" : "bg-gray-300"
                      }`}
                      aria-label="เปิด/ปิดบริการ"
                    >
                      <span
                        className={`absolute top-0.5 w-3.5 h-3.5 bg-white rounded-full shadow transition-transform ${
                          service.isActive ? "translate-x-[1.25rem]" : "translate-x-0.5"
                        }`}
                      />
                    </button>
                  </div>
                </div>

                {/* Card body */}
                <div className="p-4 space-y-3">
                  {/* Name */}
                  <div>
                    <h3 className="font-bold text-gray-900 text-sm leading-snug line-clamp-1">
                      {service.name}
                    </h3>
                    {service.description && (
                      <p className="text-xs text-gray-400 mt-0.5 line-clamp-2">{service.description}</p>
                    )}
                  </div>

                  {/* Pricing info */}
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-orange-50 border border-orange-100 text-orange-600 font-semibold">
                      {isQtyTier
                        ? `ตามจำนวน · ${service.quantityTiers.length} ตัวเลือก`
                        : `${PRICING_MODEL_LABEL[service.pricingModel]}`}
                    </span>
                    {!isQtyTier && (
                      <span className="text-xs font-bold text-orange-600">
                        ฿{service.basePrice}/{service.unit}
                      </span>
                    )}
                  </div>

                  {/* Options chips */}
                  {service.options.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {service.options.map((opt) => (
                        <span
                          key={opt.name}
                          className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 font-medium border border-gray-150"
                        >
                          {opt.name} ({opt.values.length})
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Add-ons */}
                  {addOnNames.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {addOnNames.slice(0, 3).map((name) => (
                        <span
                          key={name}
                          className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 border border-blue-100 font-medium"
                        >
                          <Package size={9} />
                          {name}
                        </span>
                      ))}
                      {addOnNames.length > 3 && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">
                          +{addOnNames.length - 3} อื่น ๆ
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Card actions */}
                <div className="px-4 pb-4 pt-0 flex items-center gap-2 border-t border-gray-50 mt-0 pt-3">
                  <button
                    onClick={() => router.push(`/shop/services/${service.id}/edit`)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-semibold text-blue-600 hover:bg-blue-50 rounded-xl transition border border-blue-100 hover:border-blue-200"
                  >
                    <Pencil size={13} />
                    แก้ไข
                  </button>
                  <button
                    onClick={() => setDuplicateTarget(service)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-50 rounded-xl transition border border-gray-200 hover:border-gray-300"
                  >
                    <Copy size={13} />
                    คัดลอก
                  </button>
                  <button
                    onClick={() => {
                      if (
                        confirm(
                          `ลบบริการ "${service.name}"?\n\nตัวเลือก/ราคาทั้งหมดจะถูกลบและลูกค้าจะไม่เห็นบริการนี้อีก`
                        )
                      ) {
                        onDeleteClick(service.id);
                      }
                    }}
                    className="p-2 text-red-400 hover:bg-red-50 rounded-xl transition border border-transparent hover:border-red-100"
                    title="ลบ"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-6">
          <button
            disabled={currentPage === 1}
            onClick={() => setCurrentPage((p) => p - 1)}
            className="p-2 border border-gray-200 rounded-xl disabled:opacity-40 hover:bg-gray-50 transition"
          >
            <ChevronLeft size={16} />
          </button>
          <span className="text-sm text-gray-600 font-medium px-3">
            {currentPage} / {totalPages}
          </span>
          <button
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage((p) => p + 1)}
            className="p-2 border border-gray-200 rounded-xl disabled:opacity-40 hover:bg-gray-50 transition"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      )}

      {/* Duplicate modal */}
      <DuplicateNameModal
        isOpen={!!duplicateTarget}
        originalName={duplicateTarget?.name ?? ""}
        onConfirm={handleDuplicateConfirm}
        onClose={() => setDuplicateTarget(null)}
      />
    </>
  );
}
