"use client";

import { X, MapPin, Store, MessageSquareText, Calendar } from "lucide-react";
import { Order } from "./types";
import { statusConfig, cancelReasonLabels } from "./statusConfig";
import FileThumbnail from "./FileThumbnail";

interface OrderDetailModalProps {
  order: Order | null;
  isOpen: boolean;
  onClose: () => void;
  onPreviewFile: (order: Order, kind: "file" | "slip") => void;
}

function DetailRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs text-gray-400 mb-1">{label}</p>
      <div className="text-sm font-medium text-gray-800">{children}</div>
    </div>
  );
}

const renderAddress = (addressStr?: string) => {
  if (!addressStr) return "";
  try {
    const parsed = JSON.parse(addressStr);
    if (typeof parsed === "object" && parsed !== null) {
      const parts = [];
      if (parsed.address) parts.push(parsed.address);
      if (parsed.subdistrict) parts.push(parsed.subdistrict.startsWith('ตำบล') || parsed.subdistrict.startsWith('แขวง') ? parsed.subdistrict : `ตำบล${parsed.subdistrict}`);
      if (parsed.district) parts.push(parsed.district.startsWith('อำเภอ') || parsed.district.startsWith('เขต') ? parsed.district : `อำเภอ${parsed.district}`);
      if (parsed.province) parts.push(parsed.province.startsWith('จังหวัด') || parsed.province === 'กรุงเทพมหานคร' ? parsed.province : `จังหวัด${parsed.province}`);
      if (parsed.postalCode) parts.push(parsed.postalCode);
      if (parts.length > 0) return parts.join(" ");
    }
  } catch (e) {
    // If it's not JSON, return as is
  }
  return addressStr;
};

export default function OrderDetailModal({
  order,
  isOpen,
  onClose,
  onPreviewFile,
}: OrderDetailModalProps) {
  if (!isOpen || !order) return null;

  const meta = statusConfig[order.status];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-5">
          <div>
            <div className="flex items-center gap-3">
               <h2 className="text-xl font-bold text-gray-800">รายละเอียดออเดอร์ {order.code}</h2>
               <span className={`px-2.5 py-0.5 rounded-full text-[12px] font-semibold border ${meta.badgeBg} ${meta.badgeText} ${meta.badgeBorder}`}>
                 {meta.label}
               </span>
            </div>
            <p className="flex items-center gap-1.5 text-[13.5px] text-gray-500 mt-2 font-medium">
               <Calendar size={14} />
               สั่งซื้อเมื่อ {order.createdAtLabel}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Customer Details */}
        <div className="mb-5">
          <p className="text-[12.5px] font-bold text-gray-400 mb-1">ชื่อลูกค้า</p>
          <p className="text-[14.5px] font-medium text-gray-800">{order.customerName}</p>
        </div>

        {/* Snapshot Items / Service Details */}
        {order.items && order.items.length > 0 ? (
           <div className="space-y-4 mb-5">
             {order.items.map((item, idx) => (
                <div key={item.id || idx} className="rounded-xl border border-slate-100 bg-slate-50/50 p-5">
                   <h3 className="font-bold text-slate-800 text-[16px] mb-4">{item.serviceName}</h3>
                   <ul className="space-y-1.5 list-disc pl-5 text-gray-600 marker:text-gray-400 text-[13.5px] mb-4">
                      {item.colorTierLabel && (
                        <li><span className="font-bold text-gray-700">สี:</span> {item.colorTierLabel}</li>
                      )}
                      {item.optionsSnapshot?.map((opt, oIdx) => {
                         let displayName = opt.optionName;
                         if (displayName === "ขนาดกระดาษ") displayName = "ขนาด";
                         if (displayName === "ประเภทกระดาษ") displayName = "ประเภท";
                         if (displayName === "รูปแบบการพิมพ์") displayName = "รูปแบบ";
                         return (
                           <li key={oIdx}><span className="font-bold text-gray-700">{displayName}:</span> {opt.valueName || opt.textValue}</li>
                         )
                      })}
                      <li><span className="font-bold text-gray-700">จำนวน:</span> {item.quantity} ชุด {item.pageCount ? `(${item.pageCount} หน้า)` : ""}</li>
                   </ul>
                   
                   <div className="pt-3.5 border-t border-slate-100 space-y-2.5 text-[13.5px]">
                      <div className="flex gap-3">
                         <span className="font-bold text-slate-700 min-w-[75px]">บริการเสริม</span>
                         {item.addOnsSnapshot && item.addOnsSnapshot.length > 0 ? (
                           <span className="text-orange-600 font-bold">{item.addOnsSnapshot.map(a => a.name).join(", ")}</span>
                         ) : (
                           <span className="text-orange-600 font-bold">ไม่มี</span>
                         )}
                      </div>
                      <div className="flex gap-3">
                         <span className="font-bold text-slate-700 min-w-[75px]">หมายเหตุ</span>
                         <span className="text-slate-500 font-medium">{item.note || "-"}</span>
                      </div>
                   </div>
                </div>
             ))}
           </div>
        ) : (
           <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-5 mb-5">
              <h3 className="font-bold text-slate-800 text-[16px] mb-4">{order.category}</h3>
              <ul className="space-y-1.5 list-disc pl-5 text-gray-600 marker:text-gray-400 text-[13.5px] mb-4">
                 <li><span className="font-bold text-gray-700">ขนาด:</span> {order.paperSize || "-"}</li>
                 <li><span className="font-bold text-gray-700">จำนวน:</span> {order.copies} ชุด {order.totalPages ? `(${order.totalPages} หน้า)` : ""}</li>
              </ul>
              
              <div className="pt-3.5 border-t border-slate-100 space-y-2.5 text-[13.5px]">
                 <div className="flex gap-3">
                    <span className="font-bold text-slate-700 min-w-[75px]">บริการเสริม</span>
                    {order.addOns && order.addOns.length > 0 ? (
                      <span className="text-orange-600 font-bold">{order.addOns.join(", ")}</span>
                    ) : (
                      <span className="text-orange-600 font-bold">ไม่มี</span>
                    )}
                 </div>
                 <div className="flex gap-3">
                    <span className="font-bold text-slate-700 min-w-[75px]">หมายเหตุ</span>
                    <span className="text-slate-500 font-medium">{order.note || "-"}</span>
                 </div>
              </div>
           </div>
        )}

        {/* Delivery */}
        <div className="flex items-center gap-3 mb-6 px-1">
           <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-50 text-blue-500 shrink-0">
             {order.delivery.method === "self_pickup" ? (
               <Store size={15} className="stroke-[2.5px]" />
             ) : (
               <MapPin size={15} className="stroke-[2.5px]" />
             )}
           </div>
           <p className="text-[14.5px] text-gray-600">
             <span className="font-bold text-slate-800 mr-2">การจัดส่ง:</span>
             {order.delivery.method === "self_pickup" ? "มารับที่ร้าน" : renderAddress(order.delivery.address)}
           </p>
        </div>

        {/* Files */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="flex flex-col rounded-xl border border-gray-100 p-4">
            <p className="text-[13.5px] font-bold text-slate-400 mb-4">ไฟล์งาน</p>
            <div className="flex justify-center">
              <FileThumbnail
                order={order}
                kind="file"
                size="md"
                onClick={() => onPreviewFile(order, "file")}
              />
            </div>
          </div>

          <div className="flex flex-col rounded-xl border border-gray-100 p-4">
            <p className="text-[13.5px] font-bold text-slate-400 mb-4">สลิปโอนเงิน</p>
            <div className="flex justify-center">
              <FileThumbnail
                order={order}
                kind="slip"
                size="md"
                onClick={() => onPreviewFile(order, "slip")}
              />
            </div>
          </div>
        </div>

        {/* Cancel / reject info */}
        {order.status === "cancelled" && order.cancelReason && (
          <div className="rounded-xl border border-red-100 bg-red-50 p-4 mb-5">
            <p className="text-xs text-red-500 mb-1">เหตุผลที่ยกเลิก</p>
            <p className="text-sm font-bold text-red-700">
              {cancelReasonLabels[order.cancelReason] ?? order.cancelReason}
            </p>
            {order.cancelNote && (
              <p className="text-xs text-red-500 mt-1.5">{order.cancelNote}</p>
            )}
          </div>
        )}

        {/* Price */}
        <div className="flex items-center justify-between rounded-xl bg-orange-50/80 p-5 mt-2">
          <span className="text-[15.5px] font-bold text-orange-700">ราคารวมทั้งหมด</span>
          <span className="text-[22px] font-bold text-orange-600">
            {order.price.toLocaleString()} บาท
          </span>
        </div>
      </div>
    </div>
  );
}
