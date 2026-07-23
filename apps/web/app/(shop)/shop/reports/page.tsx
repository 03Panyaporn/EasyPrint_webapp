import type { Metadata } from "next";
import ShopPlaceholder from "@/components/shop/ShopPlaceholder";

export const metadata: Metadata = { title: "สรุปและรายงาน" };

export default function ReportsPage() {
  return <ShopPlaceholder title="สรุปและรายงาน" description="ดูรายงานยอดขาย รายได้รายวัน/รายเดือน และสถิติการใช้งาน" />;
}
