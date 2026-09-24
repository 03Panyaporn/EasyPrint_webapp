"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Sidebar from "@/components/shop/Sidebar";
import Topbar from "@/components/shop/Topbar";
import ShopApprovalGate from "@/components/shop/ShopApprovalGate";
import { useRequireRole } from "@/lib/hooks/useRequireRole";
import { LoadingSection } from "@/components/ui/Spinner";
import { getMyShopProfile, type MyShopProfile } from "@/lib/api/shops";

// หน้าเดียวที่ยังเข้าได้แม้ร้านยังไม่ได้รับการอนุมัติ — ทางออกให้ติดต่อแอดมินได้จาก ShopApprovalGate โดยไม่ต้องเปิดฟีเจอร์อื่นทั้งหมด
const APPROVAL_GATE_EXEMPT_PATH = "/shop/contact-admin";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { checking } = useRequireRole("shop_owner");
  const pathname = usePathname();

  const [shop, setShop] = useState<MyShopProfile | null>(null);
  const [shopLoading, setShopLoading] = useState(true);

  useEffect(() => {
    if (checking) return;
    (async () => {
      try {
        const { shop: myShop } = await getMyShopProfile();
        setShop(myShop);
      } catch {
        // โหลดไม่สำเร็จ (เช่น หลุด session ระหว่างทาง) — ปล่อยผ่านไปหน้าเดิม useRequireRole/หน้านั้นๆ จะจัดการ error ของตัวเองต่อ
      } finally {
        setShopLoading(false);
      }
    })();
  }, [checking]);

  // ระหว่างเช็คสิทธิ์ (หรือกำลัง redirect ออกเพราะไม่ใช่ shop_owner/session หมดอายุ) ไม่ render layout จริงเลย
  // กันไม่ให้คน logout ไปแล้ว/role อื่นยังเห็น dashboard ร้านค้าเต็มรูปแบบ (บั๊กที่ยืนยันแล้วใน QA Phase 01 — BUG-01-02)
  if (checking || shopLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50" aria-live="polite" aria-busy="true">
        <LoadingSection label="กำลังตรวจสอบสิทธิ์..." />
      </div>
    );
  }

  // ร้านที่ยังไม่ approved ไม่เห็น Sidebar/Topbar หรือฟีเจอร์ใดๆ เลย นอกจากหน้าติดต่อแอดมิน (เดิมเห็นเมนูครบ ได้แต่โดน 403 ตอนกดบันทึก)
  if (shop && shop.approvalStatus !== "approved" && pathname !== APPROVAL_GATE_EXEMPT_PATH) {
    return <ShopApprovalGate shop={shop} />;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <Sidebar
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
        shopName={shop?.name}
      />
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <Topbar onMobileMenuOpen={() => setMobileOpen(true)} shopName={shop?.name} shopEmail={shop?.email} />
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
