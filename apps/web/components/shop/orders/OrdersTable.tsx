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
  Truck,
  Copy,
  FileText,
  Palette,
  BookOpen,
  ScanLine,
  CreditCard,
  Newspaper,
  Image as ImageIcon,
  Tag,
  LayoutTemplate,
} from "lucide-react";
import { Order } from "./types";
import { statusConfig } from "./statusConfig";
import FileThumbnail from "./FileThumbnail";

const formatCategoryName = (rawName: string) => {
  if (rawName.includes("ถ่าย")) return "ถ่ายเอกสาร";
  if (rawName.includes("สติ๊กเกอร์")) return "สติ๊กเกอร์";
  if (rawName.includes("นามบัตร")) return "นามบัตร";
  if (rawName.includes("โบรชัวร์")) return "โบรชัวร์";
  if (rawName.includes("โปสเตอร์")) return "โปสเตอร์";
  if (rawName.includes("ไวนิล") || rawName.includes("ป้ายไวนิล")) return "ป้ายไวนิล";
  if (rawName.includes("สแกน")) return "สแกนเอกสาร";
  if (rawName.includes("เข้าเล่ม")) return "เข้าเล่ม";
  if (rawName.includes("พิมพ์") || rawName.includes("ปริ้น")) {
    return "พิมพ์เอกสาร";
  }
  return rawName.replace(" A4 / A3 (ขาวดำ & สี)", "");
};

// ใช้ชื่อไฟล์จริงที่ลูกค้าอัปโหลด (realName) ถ้ามี — ไม่งั้นเดาจาก URL (ออเดอร์เก่าก่อนมี fileName บันทึกไว้)
const getFileAttachment = (url: string | null, fallbackName: string, realName?: string | null) => {
  const isPdf = (url?.toLowerCase().endsWith(".pdf") || realName?.toLowerCase().endsWith(".pdf")) ?? false;
  if (realName) return { name: realName, sizeLabel: "-", type: (isPdf ? "pdf" : "image") as "pdf" | "image" };
  if (!url) return { name: fallbackName, sizeLabel: "-", type: "image" as const };
  const lastSegment = url.split("/").pop();
  const name = lastSegment && lastSegment.length > 0 ? lastSegment : fallbackName;
  return { name, sizeLabel: "-", type: (isPdf ? "pdf" : "image") as "pdf" | "image" };
};

const extractColorFromCategory = (rawName: string, colorMode?: string | null) => {
  if (rawName.includes("ขาว-ดำ") || rawName.includes("ขาวดำ")) return "ขาว-ดำ";
  if (rawName.includes("สี") && !rawName.includes("ขาวดำ & สี")) return "สี";
  if (colorMode === "bw") return "ขาว-ดำ";
  if (colorMode === "color") return "สี";
  return null;
};

const getCategoryIcon = (categoryName: string) => {
  const name = formatCategoryName(categoryName);
  switch (name) {
    case "ถ่ายเอกสาร": return { icon: Copy, bg: "bg-slate-100", text: "text-slate-600" };
    case "พิมพ์เอกสาร": return { icon: FileText, bg: "bg-blue-50", text: "text-blue-500" };
    case "เข้าเล่ม": return { icon: BookOpen, bg: "bg-orange-50", text: "text-orange-500" };
    case "สแกนเอกสาร": return { icon: ScanLine, bg: "bg-teal-50", text: "text-teal-500" };
    case "นามบัตร": return { icon: CreditCard, bg: "bg-pink-50", text: "text-pink-500" };
    case "โบรชัวร์": return { icon: Newspaper, bg: "bg-[#f4ebe1]", text: "text-[#8a5a2b]" };
    case "โปสเตอร์": return { icon: ImageIcon, bg: "bg-red-50", text: "text-red-500" };
    case "สติ๊กเกอร์": return { icon: Tag, bg: "bg-emerald-50", text: "text-emerald-500" };
    case "ป้ายไวนิล": return { icon: LayoutTemplate, bg: "bg-violet-50", text: "text-violet-500" };
    default: return { icon: FileText, bg: "bg-gray-50", text: "text-gray-500" };
  }
};

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



  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_16px_32px_-12px_rgba(0,0,0,0.12),inset_0_1px_0_0_rgba(255,255,255,0.8)] overflow-hidden -mx-2 md:-mx-3 lg:-mx-4">
      {/* Header bar */}
      <div className="p-4 sm:p-6 border-b border-gray-100">
        <h2 className="text-lg font-bold text-gray-800">รายการคำสั่งซื้อทั้งหมด</h2>
      </div>

      {/* Table */}
      <div className="overflow-x-auto shadow-[inset_0_1px_3px_rgba(0,0,0,0.03)]">
        <table className="w-full text-left border-collapse text-sm">
          <thead>
            <tr className="bg-gray-50 text-gray-600 font-semibold border-b-2 border-gray-200">
              <th className="py-3.5 px-4 sm:px-6 whitespace-nowrap">รหัส</th>
              <th className="py-3.5 px-4 whitespace-nowrap">ลูกค้า</th>
              <th className="py-3.5 px-4 whitespace-nowrap">บริการและรายละเอียด</th>
              <th className="py-3.5 px-4 whitespace-nowrap">จำนวน</th>
              <th className="py-3.5 px-4 whitespace-nowrap">การจัดส่ง</th>
              <th className="py-3.5 px-4 whitespace-nowrap">ยอดรวม</th>
              <th className="py-3.5 px-4 whitespace-nowrap text-center">ไฟล์</th>
              <th className="py-3.5 pl-16 pr-4 whitespace-nowrap text-center">สลิป</th>
              <th className="py-3.5 px-4 whitespace-nowrap text-center">รายละเอียด</th>
              <th className="py-3.5 px-4 whitespace-nowrap text-center">
                สถานะงาน
                <br />
                <span className="font-normal text-gray-400">(อัปเดตสถานะ)</span>
              </th>
            </tr>
          </thead>
          {orders.length === 0 ? (
            <tbody className="divide-y divide-gray-200">
              <tr>
                <td colSpan={10} className="py-12 text-center text-gray-400">
                  <Inbox size={32} className="mx-auto mb-2 opacity-50" />
                  <p className="text-sm font-medium">ไม่พบรายการคำสั่งซื้อ</p>
                </td>
              </tr>
            </tbody>
          ) : (
            orders.map((order, orderIdx) => {
              const meta = statusConfig[order.status];
              const items = (order.items && order.items.length > 0) ? order.items : [null];
              const isEven = orderIdx % 2 === 1;

              return (
                <tbody key={order.id} className={`divide-y divide-gray-200 border-b-2 border-gray-200 group hover:bg-orange-50/40 transition-colors ${isEven ? 'bg-gray-50/50' : 'bg-white'}`}>
                  {items.map((item, itemIdx) => {
                    const rowSpan = items.length;
                    const isFirst = itemIdx === 0;

                    return (
                      <tr key={item?.id || itemIdx} className="h-[110px] hover:bg-orange-50/40 transition-colors">
                        {isFirst && (
                          <>
                            {/* รหัส */}
                            <td rowSpan={rowSpan} className="py-4 px-4 sm:px-6 align-middle">
                              <span className="font-semibold text-gray-800">{order.code}</span>
                              <div className="text-xs text-gray-400 mt-0.5">{order.createdAtLabel}</div>
                            </td>

                            {/* 2. ลูกค้า */}
                            <td rowSpan={rowSpan} className="py-4 px-4 text-gray-700 max-w-[130px] whitespace-normal break-words leading-snug align-middle">
                              <div className="line-clamp-2" title={order.customerName}>
                                {order.customerName}
                              </div>
                            </td>
                          </>
                        )}
                        
                        {/* 3 & 4. บริการและรายละเอียด */}
                        <td className={`py-4 px-4 text-left text-gray-600 text-[12.5px] min-w-[160px] max-w-[180px] whitespace-normal align-middle break-words ${!isFirst ? "border-t border-gray-200" : ""}`}>
                           {item ? (
                             <>
                               <div className="flex items-center gap-2 mb-2.5">
                                 {(() => {
                                   const catInfo = getCategoryIcon(item.serviceName);
                                   const Icon = catInfo.icon;
                                   return (
                                     <div className={`flex items-center justify-center w-7 h-7 rounded-lg ${catInfo.bg} ${catInfo.text} shrink-0`}>
                                       <Icon size={14} className="stroke-[2.5px]" />
                                     </div>
                                   );
                                 })()}
                                 <span className="font-bold text-gray-800 text-[14px]">
                                   {formatCategoryName(item.serviceName)}
                                 </span>
                               </div>
                               <ul className="space-y-1 list-disc pl-5 text-gray-600 marker:text-gray-500">
                                  {(() => {
                                    // ดูจาก colorTierLabel ก่อน (item ใหม่จะมีนี้)
                                    // ถ้าไม่มี ลองดูจาก optionsSnapshot ว่ามีตัวเลือกสีหรือไม่
                                    // ถ้ายังไม่มีแต่ pageCount > 0 (per_page service) → fallback "ขาวดำ" สำหรับ order เก่า
                                    let colorLabel: string | null = item.colorTierLabel ?? null;
                                    if (!colorLabel) {
                                      const colorOpt = item.optionsSnapshot?.find(o => o.optionName === "สี");
                                      if (colorOpt) {
                                        colorLabel = colorOpt.valueName ?? colorOpt.textValue ?? null;
                                      }
                                    }
                                    if (!colorLabel) {
                                      colorLabel = extractColorFromCategory(order.category, order.colorMode);
                                    }
                                    // fallback สุดท้าย: order เก่าที่ colorMode="มาตรฐาน" แต่มี pageCount = per_page service (มักมีตัวเลือกสี)
                                    if (!colorLabel && item.pageCount && item.pageCount > 0) {
                                      colorLabel = "ขาวดำ";
                                    }
                                    return colorLabel ? (
                                      <li><span className="font-medium text-gray-700">สี:</span> {colorLabel}</li>
                                    ) : null;
                                  })()}
                                 {item.optionsSnapshot?.filter(opt => opt.optionName !== "สี").map((opt, i) => {
                                   let displayName = opt.optionName;
                                   if (displayName === "ขนาดกระดาษ") displayName = "ขนาด";
                                   if (displayName === "ประเภทกระดาษ") displayName = "ประเภท";
                                   if (displayName === "รูปแบบการพิมพ์") displayName = "รูปแบบ";
                                   return (
                                     <li key={i}><span className="font-medium text-gray-700">{displayName}:</span> {opt.valueName || opt.textValue}</li>
                                   );
                                 })}
                               </ul>
                               {item.addOnsSnapshot && item.addOnsSnapshot.length > 0 && (
                                 <div className="text-orange-600 mt-2 leading-relaxed">
                                   <span className="font-medium text-gray-800">บริการเสริม:</span> {item.addOnsSnapshot.map(a => a.name).join(", ")}
                                 </div>
                               )}
                               {isFirst && (!item.addOnsSnapshot || item.addOnsSnapshot.length === 0) && order.addOns && order.addOns.length > 0 && (
                                 <div className="text-orange-600 mt-2 leading-relaxed pt-2 border-t border-gray-100">
                                   <span className="font-medium text-gray-800">บริการเสริม (รวม):</span> {order.addOns.join(", ")}
                                 </div>
                               )}
                             </>
                           ) : (
                             <>
                               <div className="flex items-center gap-2 mb-2.5">
                                 {(() => {
                                   const catInfo = getCategoryIcon(order.category);
                                   const Icon = catInfo.icon;
                                   return (
                                     <div className={`flex items-center justify-center w-7 h-7 rounded-lg ${catInfo.bg} ${catInfo.text} shrink-0`}>
                                       <Icon size={14} className="stroke-[2.5px]" />
                                     </div>
                                   );
                                 })()}
                                 <span className="font-bold text-gray-800 text-[14px]">
                                   {formatCategoryName(order.category)}
                                 </span>
                               </div>
                               <ul className="space-y-1 list-disc pl-5 text-gray-600 marker:text-gray-500">
                                 {(() => {
                                   const colorLabel = extractColorFromCategory(order.category, order.colorMode);
                                   return colorLabel ? (
                                     <li><span className="font-medium text-gray-700">สี:</span> {colorLabel}</li>
                                   ) : null;
                                 })()}
                                 <li><span className="font-medium text-gray-700">ขนาด:</span> {order.paperSize}</li>
                               </ul>
                               {order.addOns.length > 0 && (
                                 <div className="text-orange-600 mt-2 leading-relaxed"><span className="font-medium text-gray-800">บริการเสริม:</span> {order.addOns.join(", ")}</div>
                               )}
                             </>
                           )}
                        </td>

                        {/* 5. จำนวน */}
                        <td className={`py-4 px-4 text-gray-700 align-middle ${!isFirst ? "border-t border-gray-200" : ""}`}>
                          {item ? (
                            <>
                              {item.quantity} ชุด
                              <div className="text-xs text-gray-400 mt-0.5">
                                {item.pageCount ? `(${item.pageCount} หน้า)` : ""}
                              </div>
                            </>
                          ) : (
                            <>
                              {order.copies} ชุด
                              <div className="text-xs text-gray-400 mt-0.5">
                                {order.totalPages ? `(${order.totalPages} หน้า)` : ""}
                              </div>
                            </>
                          )}
                        </td>

                        {/* การจัดส่ง */}
                        <td className={`py-4 px-4 text-gray-700 whitespace-nowrap align-middle ${!isFirst ? "border-t border-gray-200" : ""}`}>
                          {(!order.delivery || order.delivery.method === "self_pickup" || (order.delivery.method === "shop_delivery" && !order.delivery.address)) ? (
                            <div className="inline-flex items-center gap-1.5 text-orange-600 font-semibold text-[13.5px]">
                              <Store size={16} className="stroke-[2.5px]" />
                              รับที่ร้าน
                            </div>
                          ) : (
                            <div className="flex flex-col gap-0.5">
                              <div className="flex items-center gap-1.5 text-blue-600 font-medium">
                                <Truck size={14} />
                                ที่อยู่
                              </div>
                              {order.delivery?.address && (
                                <div className="relative inline-block" data-address-popover>
                                  {(() => {
                                    let fullAddress = order.delivery.address;
                                    try {
                                      const parsed = JSON.parse(order.delivery.address);
                                      if (typeof parsed === "object" && parsed !== null) {
                                        const parts = [];
                                        if (parsed.address) parts.push(parsed.address);
                                        if (parsed.subdistrict) parts.push(parsed.subdistrict.startsWith('ตำบล') || parsed.subdistrict.startsWith('แขวง') ? parsed.subdistrict : `ตำบล${parsed.subdistrict}`);
                                        if (parsed.district) parts.push(parsed.district.startsWith('อำเภอ') || parsed.district.startsWith('เขต') ? parsed.district : `อำเภอ${parsed.district}`);
                                        if (parsed.province) parts.push(parsed.province.startsWith('จังหวัด') || parsed.province === 'กรุงเทพมหานคร' ? parsed.province : `จังหวัด${parsed.province}`);
                                        if (parsed.postalCode) parts.push(parsed.postalCode);
                                        if (parts.length > 0) fullAddress = parts.join(" ");
                                      }
                                    } catch (e) {}
                                    
                                    return (
                                      <>
                                        <div
                                          className="text-[11px] text-gray-500 max-w-[100px] truncate cursor-pointer hover:text-blue-600 mt-0.5"
                                          onClick={(e) => {
                                            const rect = (e.target as HTMLElement).getBoundingClientRect();
                                            setAddressPopover(addressPopover?.id === order.id ? null : { id: order.id, top: rect.bottom, left: Math.max(10, rect.left - 50) });
                                          }}
                                        >
                                          {fullAddress}
                                        </div>
                                        {addressPopover?.id === order.id && (
                                          <div
                                            className="fixed z-50 mt-2 w-64 bg-gray-900 text-white text-xs p-3 rounded-lg shadow-xl shadow-gray-900/20 border border-gray-700 animate-in fade-in zoom-in-95 duration-200 whitespace-normal leading-relaxed"
                                            style={{ top: addressPopover.top, left: addressPopover.left }}
                                          >
                                            <p className="font-semibold text-gray-300 mb-1 border-b border-gray-700 pb-1">
                                              ที่อยู่จัดส่งเต็ม
                                            </p>
                                            {fullAddress}
                                            <button
                                              onClick={() => setAddressPopover(null)}
                                              className="absolute top-2 right-2 text-gray-400 hover:text-white"
                                            >
                                              <X size={12} />
                                            </button>
                                          </div>
                                        )}
                                      </>
                                    );
                                  })()}
                                </div>
                              )}
                            </div>
                          )}
                        </td>

                        {/* 6. ยอดรวม */}
                        {isFirst && (
                          <td rowSpan={rowSpan} className="py-4 px-4 font-bold text-gray-800 whitespace-nowrap align-middle">
                            {order.price.toLocaleString()} บาท
                          </td>
                        )}

                        {/* 7. ไฟล์งาน */}
                        <td className={`py-3 px-4 text-center align-middle ${!isFirst ? "border-t border-gray-200" : ""}`}>
                          {(() => {
                            const fileObj = item
                              ? getFileAttachment(item.fileUrl || order.fileUrl || "", `${order.code}-ไฟล์งาน`, item.fileName)
                              : order.file;
                            // item แต่ละอันมีไฟล์งานของตัวเอง — ใช้ signed URL ของ item นี้โดยเฉพาะ ไม่ใช่ของออเดอร์ทั้งก้อน
                            const itemFileUrl = item ? (item.fileSignedUrl ?? order.rawFileUrl) : order.rawFileUrl;
                            const itemFileOrder = { ...order, file: fileObj, rawFileUrl: itemFileUrl };
                            return (
                              <FileThumbnail
                                order={itemFileOrder}
                                kind="file"
                                align="center"
                                onClick={() => onPreviewFile(itemFileOrder, "file")}
                              />
                            );
                          })()}
                        </td>

                        {isFirst && (
                          <>
                            {/* 8. สลิปโอนเงิน */}
                            <td rowSpan={rowSpan} className="py-3 pl-16 pr-4 text-center align-middle">
                              <FileThumbnail
                                order={order}
                                kind="slip"
                                align="center"
                                onClick={() => onPreviewFile(order, "slip")}
                              />
                            </td>

                            {/* 9. รายละเอียด */}
                            <td rowSpan={rowSpan} className="py-4 px-4 text-center align-middle">
                              <button
                                onClick={() => onOpenDetail(order)}
                                className="relative inline-flex items-center justify-center p-1.5 mx-auto rounded-lg text-gray-500 hover:text-orange-600 hover:bg-orange-50 transition-colors"
                                title={order.note ? "ดูรายละเอียด (มีหมายเหตุจากลูกค้า)" : "ดูรายละเอียด"}
                              >
                                <Eye size={16} />
                                {order.note && (
                                  <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full border-[1.5px] border-white" />
                                )}
                              </button>
                            </td>

                            {/* สถานะงาน */}
                            <td rowSpan={rowSpan} className="py-4 px-4 text-center align-middle">
                              {order.status === "completed" || order.status === "cancelled" ? (
                                <span
                                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border whitespace-nowrap shadow-[0_1px_2px_rgba(0,0,0,0.06),inset_0_1px_0_0_rgba(255,255,255,0.7)] ${meta.badgeBg} ${meta.badgeText} ${meta.badgeBorder}`}
                                >
                                  {meta.label}
                                </span>
                              ) : (
                                <button
                                  onClick={() =>
                                    order.status === "pending_review"
                                      ? onPreviewFile(order, "slip")
                                      : onOpenStatusModal(order)
                                  }
                                  className={`group inline-flex items-center justify-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-semibold border whitespace-nowrap transition-all duration-200 ease-out shadow-[0_2px_0_rgba(0,0,0,0.12),0_3px_6px_-2px_rgba(0,0,0,0.18),inset_0_1px_0_0_rgba(255,255,255,0.7)] hover:shadow-[0_3px_0_rgba(0,0,0,0.12),0_6px_14px_-4px_rgba(0,0,0,0.22),inset_0_1px_0_0_rgba(255,255,255,0.7)] hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.97] active:shadow-[0_1px_1px_rgba(0,0,0,0.15)] ${meta.badgeBg} ${meta.badgeText} ${meta.targetBorder}`}
                                >
                                  {meta.label}
                                  <span className="flex items-center justify-center w-4 h-4 rounded-md bg-white/70 shrink-0 transition-transform duration-200 group-hover:translate-x-0.5">
                                    <ChevronRight size={11} strokeWidth={2.5} />
                                  </span>
                                </button>
                              )}
                            </td>
                          </>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              );
            })
          )}
        </table>
      </div>
    </div>
  );
}
