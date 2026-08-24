import type { Metadata } from "next";
import ShopReviewsContainer from "@/components/shop/reviews/ShopReviewsContainer";

export const metadata: Metadata = { title: "รีวิวร้านค้า" };

export default function ShopReviewsPage() {
  return <ShopReviewsContainer />;
}
