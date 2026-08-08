"use client";

import {
  Copy,
  FileText,
  Palette,
  BookOpen,
  ScanLine,
  CreditCard,
  Newspaper,
  Image as ImageIcon,
  Tag,
  PanelsTopLeft,
} from "lucide-react";

// จับคู่หมวดหมู่ในม็อคอปกับค่า serviceType จริงที่ใช้ตอนร้านสมัคร (shopServiceTypeSchema ใน packages/shared/src/schemas/auth.ts)
// กดแล้วกรอง shop list ได้จริง ไม่ใช่แค่ไอคอนเฉยๆ
export const SERVICE_CATEGORIES = [
  { label: "ถ่ายเอกสาร", value: "ถ่ายเอกสาร", icon: Copy },
  { label: "พิมพ์เอกสาร", value: "ปริ้นเอกสารขาวดำ", icon: FileText },
  { label: "พิมพ์สี", value: "ปริ้นเอกสารสี", icon: Palette },
  { label: "เข้าเล่ม", value: "เข้าเล่ม (สันกาว / สันห่วง / สันเกลียว)", icon: BookOpen },
  { label: "สแกนเอกสาร", value: "สแกนเอกสาร", icon: ScanLine },
  { label: "นามบัตร", value: "นามบัตร", icon: CreditCard },
  { label: "โบรชัวร์", value: "ใบปลิว / โบรชัวร์", icon: Newspaper },
  { label: "โปสเตอร์", value: "พิมพ์โปสเตอร์", icon: ImageIcon },
  { label: "สติ๊กเกอร์", value: "พิมพ์สติ๊กเกอร์", icon: Tag },
  { label: "ป้ายไวนิล", value: "พิมพ์ไวนิล / แบนเนอร์", icon: PanelsTopLeft },
] as const;

interface ServiceCategoryGridProps {
  selected: string;
  onSelect: (value: string) => void;
}

export default function ServiceCategoryGrid({ selected, onSelect }: ServiceCategoryGridProps) {
  return (
    <div className="space-y-3">
      <h2 className="text-base sm:text-lg font-bold text-slate-800">คุณกำลังมองหาบริการอะไร?</h2>
      <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-none sm:grid sm:grid-cols-5 lg:grid-cols-10 sm:overflow-visible">
        {SERVICE_CATEGORIES.map((cat) => {
          const Icon = cat.icon;
          const active = selected === cat.value;
          return (
            <button
              key={cat.value}
              type="button"
              onClick={() => onSelect(active ? "all" : cat.value)}
              className={`shrink-0 w-20 sm:w-auto flex flex-col items-center gap-1.5 p-3 rounded-2xl border-2 transition-all ${
                active
                  ? "border-orange-400 bg-orange-50 shadow-sm"
                  : "border-slate-100 bg-white hover:border-orange-200 hover:bg-orange-50/40"
              }`}
            >
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center transition ${
                  active ? "bg-orange-500 text-white" : "bg-slate-100 text-slate-500"
                }`}
              >
                <Icon size={18} />
              </div>
              <span className={`text-[11px] font-semibold text-center leading-tight ${active ? "text-orange-600" : "text-slate-600"}`}>
                {cat.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
