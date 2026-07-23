import type { Metadata } from "next";
import ShopPlaceholder from "@/components/shop/ShopPlaceholder";

export const metadata: Metadata = { title: "ติดต่อแอดมิน" };

export default function ContactAdminPage() {
  return <ShopPlaceholder title="ติดต่อแอดมิน" description="ส่งคำร้องหรือแจ้งปัญหาไปยังผู้ดูแลระบบ EasyPrint" />;
}
