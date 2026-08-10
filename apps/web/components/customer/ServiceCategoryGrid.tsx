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
  Gift,
} from "lucide-react";

// จับคู่หมวดหมู่ในม็อคอปกับค่า serviceType จริงที่ใช้ตอนร้านสมัคร
export const SERVICE_CATEGORIES = [
  { label: "ถ่ายเอกสาร", value: "ถ่ายเอกสาร", icon: Copy },
  { label: "พิมพ์เอกสาร", value: "ปริ้นเอกสารขาวดำ", icon: FileText },
  { label: "พิมพ์สี", value: "ปริ้นเอกสารสี", icon: Palette },
  { label: "ปริ้นต์แบนเนอร์", value: "พิมพ์ไวนิล / แบนเนอร์", icon: PanelsTopLeft },
  { label: "ของขวัญพิมพ์สกรีน", value: "พิมพ์สติ๊กเกอร์", icon: Gift },
  { label: "เข้าเล่ม", value: "เข้าเล่ม (สันกาว / สันห่วง / สันเกลียว)", icon: BookOpen },
  { label: "สแกนเอกสาร", value: "สแกนเอกสาร", icon: ScanLine },
  { label: "นามบัตร", value: "นามบัตร", icon: CreditCard },
  { label: "โบรชัวร์", value: "ใบปลิว / โบรชัวร์", icon: Newspaper },
  { label: "โปสเตอร์", value: "พิมพ์โปสเตอร์", icon: ImageIcon },
] as const;

interface ServiceCategoryGridProps {
  selected: string;
  onSelect: (value: string) => void;
}

export default function ServiceCategoryGrid({ selected, onSelect }: ServiceCategoryGridProps) {
  return (
    <div className="space-y-2.5">
      <h2 className="text-xs sm:text-sm font-extrabold text-slate-800 tracking-tight">
        คุณกำลังมองหาบริการอะไร?
      </h2>

      {/* Responsive layout: Grid on PC (lg:grid-cols-10), horizontal scroll on Mobile/Tablet */}
      <div className="flex gap-2 sm:gap-2.5 overflow-x-auto pb-2 pt-0.5 scrollbar-none snap-x lg:grid lg:grid-cols-10 lg:gap-2.5 lg:overflow-visible">
        {SERVICE_CATEGORIES.map((cat) => {
          const Icon = cat.icon;
          const active = selected === cat.value;
          return (
            <button
              key={cat.value}
              type="button"
              onClick={() => onSelect(active ? "all" : cat.value)}
              className={`shrink-0 w-[70px] sm:w-[80px] lg:w-auto snap-start flex flex-col items-center justify-center gap-1.5 p-2 sm:p-2.5 rounded-xl sm:rounded-2xl border transition-all duration-200 ${
                active
                  ? "border-orange-400 bg-orange-50/90 shadow-md shadow-orange-100 scale-102"
                  : "border-slate-100 bg-white hover:border-orange-200 hover:bg-orange-50/40 shadow-2xs hover:shadow-sm"
              }`}
            >
              {/* Compact icon container with soft peach tint */}
              <div
                className={`w-8.5 h-8.5 sm:w-9.5 sm:h-9.5 rounded-xl sm:rounded-2xl flex items-center justify-center transition-all duration-200 shrink-0 ${
                  active
                    ? "bg-orange-500 text-white shadow-md shadow-orange-500/30 scale-105"
                    : "bg-orange-100/70 text-orange-600 group-hover:scale-105"
                }`}
              >
                <Icon className="w-4 h-4 sm:w-4.5 sm:h-4.5" strokeWidth={2} />
              </div>

              <span
                className={`text-[10px] sm:text-[11px] font-extrabold text-center leading-tight line-clamp-2 w-full ${
                  active ? "text-orange-600" : "text-slate-700"
                }`}
              >
                {cat.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
