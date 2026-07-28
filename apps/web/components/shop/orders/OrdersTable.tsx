"use client";

import { useEffect, useState } from "react";
import {
  MapPin,
  ChevronRight,
  ChevronUp,
  Eye,
  Inbox,
  Store,
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
  const [addressPopover, setAddressPopover] = useState<{
    id: string;
    top: number;
    left: number;
  } | null>(null);
  const [notePopover, setNotePopover] = useState<{
    id: string;
    top: number;
    left: number;
  } | null>(null);

  useEffect(() => {
    if (!addressPopover) return;
    const closeHandler = (e: MouseEvent) => {
      if (!(e.target as HTMLElement).closest("[data-address-popover]")) {
        setAddressPopover(null);
      }
    };
    const dismiss = () => setAddressPopover(null);
    document.addEventListener("mousedown", closeHandler);
    window.addEventListener("scroll", dismiss, true);
    window.addEventListener("resize", dismiss);
    return () => {
      document.removeEventListener("mousedown", closeHandler);
      window.removeEventListener("scroll", dismiss, true);
      window.removeEventListener("resize", dismiss);
    };
  }, [addressPopover]);

  useEffect(() => {
    if (!notePopover) return;
    const closeHandler = (e: MouseEvent) => {
      if (!(e.target as HTMLElement).closest("[data-note-popover]")) {
        setNotePopover(null);
      }
    };
    const dismiss = () => setNotePopover(null);
    document.addEventListener("mousedown", closeHandler);
    window.addEventListener("scroll", dismiss, true);
    window.addEventListener("resize", dismiss);
    return () => {
      document.removeEventListener("mousedown", closeHandler);
      window.removeEventListener("scroll", dismiss, true);
      window.removeEventListener("resize", dismiss);
    };
  }, [notePopover]);

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_16px_32px_-12px_rgba(0,0,0,0.12),inset_0_1px_0_0_rgba(255,255,255,0.8)] overflow-hidden">
      {/* Header bar */}
      <div className="p-4 sm:p-6 border-b border-gray-100">
        <h2 className="text-lg font-bold text-gray-800">รายการคำสั่งซื้อทั้งหมด</h2>
      </div>

      {/* Table */}
      <div className="overflow-x-auto shadow-[inset_0_1px_3px_rgba(0,0,0,0.03)]">
        <table className="w-full text-center border-collapse text-sm">
          <thead>
            <tr className="bg-gray-50 text-gray-600 font-semibold border-b-2 border-gray-200">
              <th className="py-3.5 px-4 sm:px-6 whitespace-nowrap">รหัส</th>
              <th className="py-3.5 px-4 whitespace-nowrap">ชื่อ</th>
              <th className="py-3.5 px-4 whitespace-nowrap">ประเภท</th>
              <th className="py-3.5 px-4 whitespace-nowrap">ขนาด</th>
              <th className="py-3.5 px-4 whitespace-nowrap">จำนวน</th>
              <th className="py-3.5 px-4 whitespace-nowrap">บริการเพิ่มเติม</th>
              <th className="py-3.5 px-4 whitespace-nowrap">หมายเหตุ</th>
              <th className="py-3.5 px-4 whitespace-nowrap">การจัดส่ง</th>
              <th className="py-3.5 px-4 whitespace-nowrap">ยอดรวม</th>
              <th className="py-3.5 px-4 whitespace-nowrap">ดูรายละเอียด</th>
              <th className="py-3.5 px-4 whitespace-nowrap">ไฟล์งาน</th>
              <th className="py-3.5 px-4 whitespace-nowrap">สลิปโอนเงิน</th>
              <th className="py-3.5 px-4 whitespace-nowrap">
                สถานะงาน
                <br />
                <span className="font-normal text-gray-400">(อัปเดตสถานะ)</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 [&>tr:nth-child(even)]:bg-gray-50/50">
            {orders.length === 0 ? (
              <tr>
                <td colSpan={13} className="py-12 text-center text-gray-400">
                  <Inbox size={32} className="mx-auto mb-2 opacity-50" />
                  <p className="text-sm font-medium">ไม่พบรายการคำสั่งซื้อ</p>
                </td>
              </tr>
            ) : (
              orders.map((order) => {
                const meta = statusConfig[order.status];

                return (
                  <tr key={order.id} className="hover:!bg-orange-50/40 transition-colors">
                    {/* รหัส */}
                    <td className="py-4 px-4 sm:px-6">
                      <span className="font-semibold text-gray-800">{order.code}</span>
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

                    {/* หมายเหตุ */}
                    <td className="py-4 px-4 text-gray-600 max-w-[130px]">
                      {order.note ? (
                        <div className="relative" data-note-popover>
                          <p className="truncate text-center tracking-tight">{order.note}</p>
                          {order.note.length > 20 && (
                            <button
                              onClick={(e) => {
                                if (notePopover?.id === order.id) {
                                  setNotePopover(null);
                                  return;
                                }
                                const rect = e.currentTarget.getBoundingClientRect();
                                const left = Math.min(
                                  Math.max(rect.left + rect.width / 2, 140),
                                  window.innerWidth - 140,
                                );
                                setNotePopover({ id: order.id, top: rect.bottom + 8, left });
                              }}
                              className="text-orange-500 hover:text-orange-600 text-xs font-medium mt-0.5"
                            >
                              ดูเพิ่มเติม
                            </button>
                          )}
                          {notePopover?.id === order.id && (
                            <div
                              className="fixed z-50 w-64 max-w-[90vw] -translate-x-1/2 bg-white rounded-xl shadow-lg border border-gray-100 p-3"
                              style={{ top: notePopover.top, left: notePopover.left }}
                            >
                              <div className="flex items-start justify-between gap-2 mb-1">
                                <p className="text-xs font-semibold text-gray-800">
                                  หมายเหตุจากลูกค้า
                                </p>
                                <button
                                  onClick={() => setNotePopover(null)}
                                  className="p-0.5 -m-0.5 rounded text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                                >
                                  <X size={14} />
                                </button>
                              </div>
                              <p className="text-sm text-gray-600 leading-relaxed whitespace-normal text-left">
                                {order.note}
                              </p>
                            </div>
                          )}
                        </div>
                      ) : (
                        "-"
                      )}
                    </td>

                    {/* การจัดส่ง */}
                    <td className="py-4 px-4 text-gray-700 max-w-[130px]">
                      {order.delivery.method === "self_pickup" ? (
                        <span className="flex items-center justify-center gap-1.5">
                          <Store size={14} className="text-gray-400 shrink-0" />
                          มารับที่ร้าน
                        </span>
                      ) : (
                        <div className="relative" data-address-popover>
                          <p className="truncate text-center tracking-tight">{order.delivery.address}</p>
                          <button
                            onClick={(e) => {
                              if (addressPopover?.id === order.id) {
                                setAddressPopover(null);
                                return;
                              }
                              const rect = e.currentTarget.getBoundingClientRect();
                              const left = Math.min(
                                Math.max(rect.left + rect.width / 2, 140),
                                window.innerWidth - 140,
                              );
                              setAddressPopover({ id: order.id, top: rect.bottom + 8, left });
                            }}
                            className="flex items-center gap-1 mx-auto text-orange-500 hover:text-orange-600 text-xs font-medium mt-0.5"
                          >
                            {addressPopover?.id === order.id ? (
                              <ChevronUp size={11} />
                            ) : (
                              <MapPin size={11} />
                            )}
                            {addressPopover?.id === order.id ? "ซ่อนที่อยู่" : "ดูที่อยู่"}
                          </button>
                          {addressPopover?.id === order.id && (
                            <div
                              className="fixed z-50 w-64 max-w-[90vw] -translate-x-1/2 bg-white rounded-xl shadow-lg border border-gray-100 p-3"
                              style={{ top: addressPopover.top, left: addressPopover.left }}
                            >
                              <div className="flex items-start justify-between gap-2 mb-1">
                                <p className="text-xs font-semibold text-gray-800">
                                  ที่อยู่จัดส่ง
                                </p>
                                <button
                                  onClick={() => setAddressPopover(null)}
                                  className="p-0.5 -m-0.5 rounded text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                                >
                                  <X size={14} />
                                </button>
                              </div>
                              <p className="text-sm text-gray-600 leading-relaxed whitespace-normal text-left">
                                {order.delivery.address}
                              </p>
                            </div>
                          )}
                        </div>
                      )}
                    </td>

                    {/* ยอดรวม */}
                    <td className="py-4 px-4 font-bold text-gray-800 whitespace-nowrap">
                      {order.price.toLocaleString()} บาท
                    </td>

                    {/* ดูรายละเอียด */}
                    <td className="py-4 px-4">
                      <button
                        onClick={() => onOpenDetail(order)}
                        className="p-1.5 rounded-lg text-gray-500 hover:text-orange-600 hover:bg-orange-50 transition-colors"
                        title="ดูรายละเอียด"
                      >
                        <Eye size={16} />
                      </button>
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

                    {/* สถานะงาน */}
                    <td className="py-4 px-4">
                      {order.status === "completed" || order.status === "cancelled" ? (
                        <span
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border whitespace-nowrap shadow-[0_1px_2px_rgba(0,0,0,0.06),inset_0_1px_0_0_rgba(255,255,255,0.7)] ${meta.badgeBg} ${meta.badgeText} ${meta.badgeBorder}`}
                        >
                          {meta.label}
                        </span>
                      ) : (
                        <button
                          onClick={() => onOpenStatusModal(order)}
                          className={`group inline-flex items-center gap-1.5 pl-3 pr-1.5 py-1.5 rounded-lg text-xs font-semibold border whitespace-nowrap transition-all duration-200 ease-out shadow-[0_1px_2px_rgba(0,0,0,0.06),inset_0_1px_0_0_rgba(255,255,255,0.7)] hover:shadow-[0_6px_14px_-4px_rgba(0,0,0,0.18),inset_0_1px_0_0_rgba(255,255,255,0.7)] hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.96] active:shadow-[0_1px_1px_rgba(0,0,0,0.08)] ${meta.badgeBg} ${meta.badgeText} ${meta.targetBorder}`}
                        >
                          {meta.label}
                          <span className="flex items-center justify-center w-4 h-4 rounded-md bg-white/70 shrink-0 transition-transform duration-200 group-hover:translate-x-0.5">
                            <ChevronRight size={11} strokeWidth={2.5} />
                          </span>
                        </button>
                      )}
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
