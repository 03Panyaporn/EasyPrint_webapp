"use client";

import { useEffect, useState } from "react";
import { ArrowDown, Landmark, QrCode, Image as ImageIcon, FileText } from "lucide-react";
import { Order, OrderFileAttachment } from "./types";

export const MOCK_WIDTH = 288; // = w-72 (18rem) — ความกว้างอ้างอิงสำหรับคำนวณ scale ตอนย่อเป็น thumbnail

const imageGradients = [
  "from-orange-200 to-rose-300",
  "from-sky-200 to-indigo-300",
  "from-emerald-200 to-teal-300",
  "from-fuchsia-200 to-purple-300",
  "from-amber-200 to-orange-300",
];

function pickGradient(seed: string) {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  return imageGradients[hash % imageGradients.length];
}

/** สลิปโอนเงินจริงที่ลูกค้าอัปโหลด (ดึงจาก rawSlipUrl signed URL) — object-contain กันรูปสลิปยาวๆ ถูกครอปหาย */
export function SlipImage({ url, name }: { url: string; name: string }) {
  return (
    <div
      style={{ width: MOCK_WIDTH }}
      className="rounded-2xl overflow-hidden shadow-lg select-none bg-gray-50 flex items-center justify-center"
    >
      <img src={url} alt={name} className="w-full h-auto max-h-[420px] object-contain" />
    </div>
  );
}

/** รูปไฟล์งานจริงที่ลูกค้าอัปโหลด (jpg/png — ดึงจาก rawFileUrl signed URL) */
export function PhotoImage({ url, name }: { url: string; name: string }) {
  return (
    <div
      style={{ width: MOCK_WIDTH, aspectRatio: "1 / 1" }}
      className="bg-white rounded-lg shadow-lg border-4 border-white ring-1 ring-gray-200 overflow-hidden select-none flex flex-col"
    >
      <img src={url} alt={name} className="w-full h-full object-cover" />
    </div>
  );
}

/** ไฟล์งานที่เป็น PDF — thumbnail เล็กแสดงแค่ไอคอน + ชื่อไฟล์จริง (ตัวเนื้อหาจริงไปเปิดดูเต็มที่ PdfViewerLightbox ผ่าน iframe) */
export function PdfFileCard({ name }: { name: string }) {
  return (
    <div
      style={{ width: MOCK_WIDTH, aspectRatio: "3 / 4" }}
      className="relative bg-white rounded-lg shadow-lg border border-gray-200 select-none overflow-hidden flex flex-col items-center justify-center gap-3 p-6"
    >
      <div className="w-14 h-14 rounded-xl bg-red-50 flex items-center justify-center">
        <FileText size={26} className="text-red-500" />
      </div>
      <p className="text-xs text-gray-500 text-center truncate w-full">{name}</p>
    </div>
  );
}

/** ไฟล์งานที่เป็น PDF — ดึงหน้าแรกมาเรนเดอร์เป็นรูปภาพ ถ้าไม่ได้จะ fallback เป็นไอคอน */
export function PdfLiveThumbnail({ url, name }: { url: string; name: string }) {
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let active = true;
    const generate = async () => {
      try {
        const pdfjsLib = await import("pdfjs-dist");
        pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
        
        const loadingTask = pdfjsLib.getDocument({ url });
        const pdfDoc = await loadingTask.promise;
        const page = await pdfDoc.getPage(1);
        
        const unscaledViewport = page.getViewport({ scale: 1.0 });
        const scale = MOCK_WIDTH / unscaledViewport.width;
        // เรนเดอร์ให้ชัดขึ้นหน่อยเวลา scale ขึ้น
        const viewport = page.getViewport({ scale: Math.max(scale * 1.5, 1.0) }); 
        
        const canvas = document.createElement("canvas");
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        const ctx = canvas.getContext("2d");
        if (!ctx) throw new Error("canvas not supported");
        
        await page.render({ canvasContext: ctx, viewport, canvas }).promise;
        if (!active) return;
        setThumbnailUrl(canvas.toDataURL("image/jpeg", 0.8));
      } catch (err) {
        console.error("Failed to generate PDF thumbnail:", err);
        if (active) setError(true);
      }
    };
    generate();
    return () => { active = false; };
  }, [url]);

  if (error || !thumbnailUrl) {
    return <PdfFileCard name={name} />;
  }

  return (
    <div
      style={{ width: MOCK_WIDTH, aspectRatio: "3 / 4" }}
      className="bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden select-none flex flex-col items-center justify-center relative"
    >
      <img src={thumbnailUrl} alt={name} className="w-full h-full object-cover" />
      <span className="absolute top-3 right-3 px-2 py-0.5 rounded-full bg-red-50 text-red-600 text-[10px] font-bold border border-red-100 shadow-sm backdrop-blur-sm">
        PDF
      </span>
    </div>
  );
}


/** ตัวอย่างสลิปโอนเงิน (fallback เมื่อไม่มี signed URL จริง เช่น ข้อมูลทดสอบ/ออเดอร์เก่าที่ไม่มีไฟล์) — จำลองสไตล์แอปธนาคารด้วยข้อมูลสมมติ ไม่ใช่แบรนด์หรือข้อมูลจริง */
export function SlipMock({ order }: { order: Order }) {
  return (
    <div
      style={{ width: MOCK_WIDTH }}
      className="rounded-2xl overflow-hidden shadow-lg select-none bg-gradient-to-b from-sky-200 to-sky-100"
    >
      <div className="px-4 pt-4 pb-4">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-start gap-2">
            <div className="w-1 self-stretch rounded-full bg-emerald-600" />
            <div>
              <p className="text-sm font-bold text-gray-800">โอนเงินสำเร็จ</p>
              <p className="text-[10px] text-gray-500 mt-0.5">{order.createdAtLabel} น.</p>
            </div>
          </div>
          <div className="flex items-center text-emerald-700 font-extrabold text-sm tracking-tight">
            PAY<span className="text-orange-500">+</span>
          </div>
        </div>

        {/* From */}
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-full bg-white ring-1 ring-emerald-200 flex items-center justify-center shrink-0">
            <Landmark size={16} className="text-emerald-600" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-semibold text-gray-800 truncate">{order.customerName}</p>
            <p className="text-[9px] text-gray-500">ธ.ตัวอย่าง • xxx-x-x0000-x</p>
          </div>
        </div>

        <div className="pl-4 py-1">
          <ArrowDown size={13} className="text-gray-400" />
        </div>

        {/* To */}
        <div className="flex items-center gap-2.5 mb-3.5">
          <div className="w-9 h-9 rounded-full bg-white ring-1 ring-gray-300 flex items-center justify-center shrink-0">
            <span className="text-[6px] font-bold text-gray-500 leading-none text-center">
              PROMPT
              <br />
              PAY
            </span>
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-semibold text-gray-800 truncate">ร้าน EasyPrint</p>
            <p className="text-[9px] text-gray-500">รหัสพร้อมเพย์ • x-xxxx-xxxx0-00-0</p>
          </div>
        </div>

        {/* Details */}
        <div className="space-y-1.5 text-[10px] border-t border-white/70 pt-3">
          <div>
            <p className="text-gray-500">เลขที่รายการ</p>
            <p className="text-gray-700 font-medium truncate">{order.ref}</p>
          </div>
          <div className="flex items-center justify-between pt-0.5">
            <span className="text-gray-500">จำนวน</span>
            <span className="text-gray-800 font-bold text-sm">
              {order.price.toLocaleString()}.00 บาท
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-500">ค่าธรรมเนียม</span>
            <span className="text-gray-700 font-medium">0.00 บาท</span>
          </div>
        </div>

        {/* QR footer */}
        <div className="flex justify-end mt-3">
          <div className="bg-white rounded-lg p-1.5 shadow-sm">
            <QrCode size={40} className="text-gray-800" strokeWidth={1.5} />
            <p className="text-[6px] text-gray-400 text-center mt-0.5 leading-tight">
              สแกนตรวจสอบสลิป
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

/** ตัวอย่างไฟล์งานเอกสาร (PDF) — fallback เมื่อไม่มี signed URL จริง จำลองหน้ากระดาษที่พิมพ์ พร้อมป้ายประเภทงาน */
export function DocumentMock({ order }: { order: Order }) {
  return (
    <div
      style={{ width: MOCK_WIDTH, aspectRatio: "3 / 4" }}
      className="relative bg-white rounded-lg shadow-lg border border-gray-200 p-6 select-none overflow-hidden"
    >
      <span className="absolute top-3 right-3 px-2 py-0.5 rounded-full bg-orange-50 text-orange-600 text-[9px] font-semibold border border-orange-100">
        {order.category}
      </span>
      <div className="h-3 w-2/3 bg-gray-800 rounded-full mb-2" />
      <div className="h-2 w-1/3 bg-gray-300 rounded-full mb-6" />
      {Array.from({ length: 7 }).map((_, i) => (
        <div
          key={i}
          className={`h-1.5 bg-gray-200 rounded-full mb-2.5 ${i % 3 === 2 ? "w-3/5" : "w-full"}`}
        />
      ))}
      <div className="mt-4 flex gap-3">
        <div className="h-14 w-14 bg-gray-100 rounded shrink-0" />
        <div className="flex-1 space-y-2 pt-1">
          <div className="h-1.5 w-full bg-gray-200 rounded-full" />
          <div className="h-1.5 w-4/5 bg-gray-200 rounded-full" />
          <div className="h-1.5 w-3/5 bg-gray-200 rounded-full" />
        </div>
      </div>
    </div>
  );
}

/** ตัวอย่างไฟล์งานรูปภาพ — fallback เมื่อไม่มี signed URL จริง จำลองกรอบรูปถ่าย/โปสเตอร์ */
export function PhotoMock({ file }: { file: OrderFileAttachment }) {
  return (
    <div
      style={{ width: MOCK_WIDTH, aspectRatio: "1 / 1" }}
      className="bg-white rounded-lg shadow-lg border-4 border-white ring-1 ring-gray-200 overflow-hidden select-none flex flex-col"
    >
      <div
        className={`flex-1 bg-gradient-to-br ${pickGradient(file.name)} flex items-center justify-center`}
      >
        <ImageIcon size={44} className="text-white/80" />
      </div>
      <div className="h-10 flex items-center px-3 shrink-0">
        <p className="text-[11px] text-gray-500 truncate">{file.name}</p>
      </div>
    </div>
  );
}

export function renderFileMock(order: Order, kind: "file" | "slip") {
  if (kind === "slip") {
    return order.rawSlipUrl ? (
      <SlipImage url={order.rawSlipUrl} name={order.paymentSlip.name} />
    ) : (
      <SlipMock order={order} />
    );
  }
  if (order.file.type === "pdf") {
    return order.rawFileUrl ? (
      <PdfLiveThumbnail url={order.rawFileUrl} name={order.file.name} />
    ) : (
      <PdfFileCard name={order.file.name} />
    );
  }
  return order.rawFileUrl ? (
    <PhotoImage url={order.rawFileUrl} name={order.file.name} />
  ) : (
    <PhotoMock file={order.file} />
  );
}
