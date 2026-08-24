import type { Metadata } from "next";
import ShopSettings from "@/components/shop/settings/ShopSettings";

export const metadata: Metadata = { title: "ตั้งค่า" };

export default function SettingsPage() {
  return <ShopSettings />;
}
