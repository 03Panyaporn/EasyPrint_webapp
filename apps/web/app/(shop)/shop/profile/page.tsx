import type { Metadata } from "next";
import ShopProfileForm from "@/components/shop/profile/ShopProfileForm";

export const metadata: Metadata = { title: "โปรไฟล์ร้าน" };

export default function ShopProfilePage() {
  return <ShopProfileForm />;
}
