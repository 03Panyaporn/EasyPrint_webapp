import type { Metadata } from "next";
import AdminLayout from "@/components/admin/AdminLayout";

export const metadata: Metadata = {
  title: {
    template: "%s | EasyPrint Admin",
    default: "EasyPrint — ระบบจัดการแอดมิน",
  },
  description: "ระบบจัดการผู้ดูแล EasyPrint",
};

export default function AdminRouteLayout({ children }: { children: React.ReactNode }) {
  return <AdminLayout>{children}</AdminLayout>;
}
