import type { Metadata } from "next";
import ShopPlaceholder from "@/components/shop/ShopPlaceholder";

export const metadata: Metadata = { title: "หน้าหลัก" };

export default function DashboardPage() {
  return <ShopPlaceholder title="หน้าหลัก" description="ภาพรวมยอดขาย คำสั่งซื้อ และสถิติของร้านค้า" />;
}
