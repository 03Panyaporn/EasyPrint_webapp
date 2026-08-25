import type { Metadata } from "next";
import CustomerContactAdminContainer from "@/components/customer/contact/CustomerContactAdminContainer";

export const metadata: Metadata = { title: "ติดต่อแอดมิน" };

export default function CustomerContactAdminPage() {
  return <CustomerContactAdminContainer />;
}
