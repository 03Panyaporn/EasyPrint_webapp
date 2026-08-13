import type { Metadata } from "next";
import ContactAdminContainer from "@/components/shop/contact/ContactAdminContainer";

export const metadata: Metadata = { title: "ติดต่อแอดมิน" };

export default function ContactAdminPage() {
  return <ContactAdminContainer />;
}
