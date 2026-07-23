import type { Metadata } from "next";
import ShopPlaceholder from "@/components/shop/ShopPlaceholder";

export const metadata: Metadata = { title: "โปรไฟล์ร้าน" };

export default function ShopProfilePage() {
  return <ShopPlaceholder title="โปรไฟล์ร้าน" description="แก้ไขข้อมูลร้านค้า ที่อยู่ เบอร์โทร และรูปโปรไฟล์ร้าน" />;
}
