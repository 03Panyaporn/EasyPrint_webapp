import { ArrowDown, Landmark, QrCode, Image as ImageIcon } from "lucide-react";
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

/** ตัวอย่างสลิปโอนเงิน — จำลองสไตล์แอปธนาคาร (พื้นหลังฟ้า, วงกลมธนาคาร/พร้อมเพย์, QR) ด้วยข้อมูลสมมติ ไม่ใช่แบรนด์หรือข้อมูลจริง */
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

/** ตัวอย่างไฟล์งานเอกสาร (PDF) — จำลองหน้ากระดาษที่พิมพ์ พร้อมป้ายประเภทงาน */
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

/** ตัวอย่างไฟล์งานรูปภาพ — จำลองกรอบรูปถ่าย/โปสเตอร์ */
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
  if (kind === "slip") return <SlipMock order={order} />;
  return order.file.type === "pdf" ? <DocumentMock order={order} /> : <PhotoMock file={order.file} />;
}
