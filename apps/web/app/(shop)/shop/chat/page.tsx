import type { Metadata } from "next";
import ShopPlaceholder from "@/components/shop/ShopPlaceholder";

export const metadata: Metadata = { title: "แชท" };

export default function ChatPage() {
  return <ShopPlaceholder title="แชท" description="สนทนากับลูกค้าโดยตรงเกี่ยวกับงานพิมพ์" />;
}
