import type { Metadata } from "next";
import ShopPlaceholder from "@/components/shop/ShopPlaceholder";

export const metadata: Metadata = { title: "รายการคำสั่งซื้อ" };

export default function OrdersPage() {
  return <ShopPlaceholder title="รายการคำสั่งซื้อ" description="จัดการและอัปเดตสถานะคำสั่งพิมพ์ทั้งหมดจากลูกค้า" />;
}
