import type { Metadata } from "next";
import ShopPlaceholder from "@/components/shop/ShopPlaceholder";

export const metadata: Metadata = { title: "ตั้งค่า" };

export default function SettingsPage() {
  return <ShopPlaceholder title="ตั้งค่า" description="จัดการการแจ้งเตือน ความปลอดภัย และการตั้งค่าระบบร้านค้า" />;
}
