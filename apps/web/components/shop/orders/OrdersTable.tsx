"use client";

import { useEffect, useState } from "react";
import {
  MapPin,
  ChevronRight,
  ChevronUp,
  Eye,
  Inbox,
  Store,
  MessageSquareText,
  X,
} from "lucide-react";
import { Order } from "./types";
import { statusConfig } from "./statusConfig";
import FileThumbnail from "./FileThumbnail";

interface OrdersTableProps {
  orders: Order[];
  onOpenStatusModal: (order: Order) => void;
  onOpenDetail: (order: Order) => void;
  onPreviewFile: (order: Order, kind: "file" | "slip") => void;
}

export default function OrdersTable({
  orders,
  onOpenStatusModal,
  onOpenDetail,
  onPreviewFile,
}: OrdersTableProps) {
  const [openAddressId, setOpenAddressId] = useState<string | null>(null);
  const [openNoteId, setOpenNoteId] = useState<string | null>(null);

  useEffect(() => {
    if (!openAddressId) return;
    const handler = (e: MouseEvent) => {
      if (!(e.target as HTMLElement).closest("[data-address-popover]")) {
        setOpenAddressId(null);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [openAddressId]);

  useEffect(() => {
    if (!openNoteId) return;
    const handler = (e: MouseEvent) => {
      if (!(e.target as HTMLElement).closest("[data-note-popover]")) {
        setOpenNoteId(null);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [openNoteId]);

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      {/* Header bar */}
      <div className="p-4 sm:p-6 border-b border-gray-100">
        <h2 className="text-lg font-bold text-gray-800">รายการคำสั่งซื้อทั้งหมด</h2>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-center border-collapse text-sm">
          <thead>
            <tr className="bg-gray-50/80 text-gray-600 font-semibold border-b border-gray-100">
              <th className="py-3.5 px-4 sm:px-6 whitespace-nowrap">รหัส</th>
              <th className="py-3.5 px-4 whitespace-nowrap">ชื่อ</th>
              <th className="py-3.5 px-4 whitespace-nowrap">ประเภทงาน</th>
              <th className="py-3.5 px-4 whitespace-nowrap">ขนาดกระดาษ</th>
              <th className="py-3.5 px-4 whitespace-nowrap">จำนวนชุด</th>
              <th className="py-3.5 px-4 whitespace-nowrap">บริการเพิ่มเติม</th>
              <th className="py-3.5 px-4 whitespace-nowrap">ไฟล์งาน</th>
              <th className="py-3.5 px-4 whitespace-nowrap">สลิปโอนเงิน</th>
              <th className="py-3.5 px-4 whitespace-nowrap">การจัดส่ง</th>
              <th className="py-3.5 px-4 whitespace-nowrap">ราคา</th>
              <th className="py-3.5 px-4 whitespace-nowrap">
                สถานะงาน
                <br />
                <span className="font-normal text-gray-400">(อัปเดตสถานะ)</span>
              </th>
              <th className="py-3.5 px-4 whitespace-nowrap">จัดการ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {orders.length === 0 ? (
              <tr>
                <td colSpan={12} className="py-12 text-center text-gray-400">
                  <Inbox size={32} className="mx-auto mb-2 opacity-50" />
                  <p className="text-sm font-medium">ไม่พบรายการคำสั่งซื้อ</p>
                </td>
              </tr>
            ) : (
              orders.map((order) => {
                const meta = statusConfig[order.status];

                return (
                  <tr key={order.id} className="hover:bg-orange-50/30 transition-colors">
                    {/* รหัส */}
                    <td className="py-4 px-4 sm:px-6">
                      <div className="flex items-center justify-center gap-1.5">
                        <span className="font-semibold text-gray-800">{order.code}</span>
                        {order.note && (
                          <div className="relative" data-note-popover>
                            <button
                              onClick={() =>
                                setOpenNoteId(openNoteId === order.id ? null : order.id)
                              }
                              className="p-0.5 rounded text-amber-500 hover:text-amber-600 hover:bg-amber-50 transition-colors"
                              title="มีหมายเหตุจากลูกค้า"
                            >
                              <MessageSquareText size={13} />
                            </button>
                            {openNoteId === order.id && (
                              <>
                                <div
                                  className="fixed inset-0 z-40 bg-black/40"
                                  onClick={() => setOpenNoteId(null)}
                                />
                                <div className="fixed z-50 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 max-w-[90vw] bg-white rounded-xl shadow-xl border border-gray-100 p-4">
                                  <div className="flex items-start justify-between gap-2 mb-1.5">
                                    <p className="text-sm font-semibold text-gray-800">
                                      หมายเหตุจากลูกค้า
                                    </p>
                                    <button
                                      onClick={() => setOpenNoteId(null)}
                                      className="p-0.5 rounded text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                                    >
                                      <X size={16} />
                                    </button>
                                  </div>
                                  <p className="text-sm text-gray-600 leading-relaxed whitespace-normal">
                                    {order.note}
                                  </p>
                                </div>
                              </>
                            )}
                          </div>
                        )}
                      </div>
                      <div className="text-xs text-gray-400 mt-0.5">{order.createdAtLabel}</div>
                    </td>

                    {/* ชื่อ */}
                    <td className="py-4 px-4 text-gray-700">{order.customerName}</td>

                    {/* ประเภทงาน */}
                    <td className="py-4 px-4 text-gray-700">{order.category}</td>

                    {/* ขนาดกระดาษ */}
                    <td className="py-4 px-4 text-gray-700">{order.paperSize}</td>

                    {/* จำนวนชุด */}
                    <td className="py-4 px-4 text-gray-700">
                      {order.copies} ชุด
                      <div className="text-xs text-gray-400">({order.totalPages} หน้า)</div>
                    </td>

                    {/* บริการเพิ่มเติม */}
                    <td className="py-4 px-4 text-gray-600">
                      {order.addOns.length > 0 ? order.addOns.join(", ") : "-"}
                    </td>

                    {/* ไฟล์งาน */}
                    <td className="py-3 px-4">
                      <FileThumbnail
                        order={order}
                        kind="file"
                        onClick={() => onPreviewFile(order, "file")}
                      />
                    </td>

                    {/* สลิปโอนเงิน */}
                    <td className="py-3 px-4">
                      <FileThumbnail
                        order={order}
                        kind="slip"
                        onClick={() => onPreviewFile(order, "slip")}
                      />
                    </td>

                    {/* การจัดส่ง */}
                    <td className="py-4 px-4 text-gray-700 max-w-[160px]">
                      {order.delivery.method === "self_pickup" ? (
                        <span className="flex items-center justify-center gap-1.5">
                          <Store size={14} className="text-gray-400 shrink-0" />
                          มารับเองที่ร้าน
                        </span>
                      ) : (
                        <div className="relative" data-address-popover>
                          <p className="truncate text-center">{order.delivery.address}</p>
                          <button
                            onClick={() =>
                              setOpenAddressId(openAddressId === order.id ? null : order.id)
                            }
                            className="flex items-center gap-1 text-orange-500 hover:text-orange-600 text-xs font-medium mt-0.5"
                          >
                            {openAddressId === order.id ? (
                              <ChevronUp size={11} />
                            ) : (
                              <MapPin size={11} />
                            )}
                            {openAddressId === order.id ? "ซ่อนที่อยู่" : "ดูที่อยู่"}
                          </button>
                          {openAddressId === order.id && (
                            <>
                              <div
                                className="fixed inset-0 z-40 bg-black/40"
                                onClick={() => setOpenAddressId(null)}
                              />
                              <div className="fixed z-50 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 max-w-[90vw] bg-white rounded-xl shadow-xl border border-gray-100 p-4">
                                <div className="flex items-start justify-between gap-2 mb-1.5">
                                  <p className="text-sm font-semibold text-gray-800">
                                    ที่อยู่จัดส่ง
                                  </p>
                                  <button
                                    onClick={() => setOpenAddressId(null)}
                                    className="p-0.5 rounded text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                                  >
                                    <X size={16} />
                                  </button>
                                </div>
                                <p className="text-sm text-gray-600 leading-relaxed whitespace-normal">
                                  {order.delivery.address}
                                </p>
                              </div>
                            </>
                          )}
                        </div>
                      )}
                    </td>

                    {/* ราคา */}
                    <td className="py-4 px-4 font-bold text-gray-800 whitespace-nowrap">
                      {order.price.toLocaleString()} บาท
                    </td>

                    {/* สถานะงาน */}
                    <td className="py-4 px-4">
                      {order.status === "completed" || order.status === "cancelled" ? (
                        <span
                          className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold border ${meta.badgeBg} ${meta.badgeText} ${meta.badgeBorder}`}
                        >
                          {meta.label}
                        </span>
                      ) : (
                        <button
                          onClick={() => onOpenStatusModal(order)}
                          className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors hover:brightness-95 ${meta.badgeBg} ${meta.badgeText} ${meta.badgeBorder}`}
                        >
                          {meta.label}
                          <ChevronRight size={13} />
                        </button>
                      )}
                    </td>

                    {/* จัดการ */}
                    <td className="py-4 px-4">
                      <button
                        onClick={() => onOpenDetail(order)}
                        className="p-1.5 rounded-lg text-gray-500 hover:text-orange-600 hover:bg-orange-50 transition-colors"
                        title="ดูรายละเอียด"
                      >
                        <Eye size={16} />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
