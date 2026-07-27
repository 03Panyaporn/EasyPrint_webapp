import { Check, Image as ImageIcon } from "lucide-react";
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

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-gray-400 shrink-0">{label}</span>
      <span className="text-gray-800 font-medium text-right truncate">{value}</span>
    </div>
  );
}

/** ตัวอย่างสลิปโอนเงิน — สไตล์แอปธนาคารทั่วไป ใช้ข้อมูลจริงของออเดอร์ประกอบ */
export function SlipMock({ order }: { order: Order }) {
  return (
    <div style={{ width: MOCK_WIDTH }} className="rounded-2xl overflow-hidden shadow-lg bg-white border border-gray-100 select-none">
      <div className="bg-gradient-to-br from-emerald-500 to-teal-600 px-5 pt-6 pb-7 text-white text-center">
        <div className="w-11 h-11 rounded-full bg-white/20 flex items-center justify-center mx-auto mb-2">
          <Check size={22} />
        </div>
        <p className="text-xs font-medium opacity-90">โอนเงินสำเร็จ</p>
        <p className="text-3xl font-bold mt-1 tracking-tight">
          {order.price.toLocaleString()}
          <span className="text-lg">.00</span>
        </p>
        <p className="text-[11px] opacity-80">บาท</p>
      </div>
      <div className="px-5 py-4 space-y-2.5 text-xs">
        <Row label="จาก" value={order.customerName} />
        <Row label="ไปยัง" value="ร้าน EasyPrint" />
        <div className="border-t border-dashed border-gray-200 my-1" />
        <Row label="วันที่ทำรายการ" value={order.createdAtLabel} />
        <Row label="เลขที่อ้างอิง" value={order.ref} />
      </div>
      <div className="px-5 pb-5">
        <div className="h-8 rounded bg-[repeating-linear-gradient(90deg,#1f2937_0,#1f2937_2px,transparent_2px,transparent_5px)] opacity-70" />
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
