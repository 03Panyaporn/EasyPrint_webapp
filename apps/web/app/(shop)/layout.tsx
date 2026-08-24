import type { Metadata } from "next";
import DashboardLayout from "@/components/shop/ShopLayout";
import { ToastProvider } from "@/contexts/ToastContext";
import GlobalNotificationListener from "@/components/shop/GlobalNotificationListener";

export const metadata: Metadata = {
  title: {
    template: "%s | EasyPrint ร้านค้า",
    default: "EasyPrint — ระบบจัดการร้านค้า",
  },
  description: "ระบบบริหารจัดการร้านถ่ายเอกสาร EasyPrint",
};

export default function ShopLayout({ children }: { children: React.ReactNode }) {
  return (
    <ToastProvider>
      <GlobalNotificationListener />
      <DashboardLayout>{children}</DashboardLayout>
    </ToastProvider>
  );
}
