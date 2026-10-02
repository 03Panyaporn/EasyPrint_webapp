import type { AdminCustomerStatus } from "@easyprint/shared";

// สีเดียวกับ ShopStatusBadge (อนุมัติแล้ว = เขียว, ระงับการใช้งาน = เทา) ให้หน้าแอดมินดูเป็นชุดเดียวกัน
const CONFIG: Record<AdminCustomerStatus, { label: string; className: string }> = {
  active: {
    label: "ใช้งานปกติ",
    className: "bg-green-100 text-green-700 border border-green-200",
  },
  suspended: {
    label: "ระงับการใช้งาน",
    className: "bg-slate-200 text-slate-700 border border-slate-300",
  },
};

export default function CustomerStatusBadge({
  status,
  size = "md",
}: {
  status: AdminCustomerStatus;
  size?: "sm" | "md";
}) {
  const { label, className } = CONFIG[status];
  const sizeClass = size === "sm" ? "text-[11px] px-2 py-0.5" : "text-xs px-2.5 py-1";
  return (
    <span className={`inline-flex items-center rounded-full font-semibold whitespace-nowrap ${className} ${sizeClass}`}>
      {label}
    </span>
  );
}
