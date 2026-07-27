import type { ShopStatus } from "@/lib/mock/adminShops";

interface ShopStatusBadgeProps {
  status: ShopStatus;
  size?: "sm" | "md";
}

const CONFIG: Record<ShopStatus, { label: string; className: string }> = {
  "รอตรวจสอบ": {
    label: "รอตรวจสอบ",
    className: "bg-orange-100 text-orange-700 border border-orange-200",
  },
  "อนุมัติแล้ว": {
    label: "อนุมัติแล้ว",
    className: "bg-green-100 text-green-700 border border-green-200",
  },
  "ไม่อนุมัติ": {
    label: "ไม่อนุมัติ",
    className: "bg-red-100 text-red-600 border border-red-200",
  },
};

export default function ShopStatusBadge({ status, size = "md" }: ShopStatusBadgeProps) {
  const { label, className } = CONFIG[status];
  const sizeClass = size === "sm" ? "text-[11px] px-2 py-0.5" : "text-xs px-2.5 py-1";
  return (
    <span className={`inline-flex items-center rounded-full font-semibold whitespace-nowrap ${className} ${sizeClass}`}>
      {label}
    </span>
  );
}
