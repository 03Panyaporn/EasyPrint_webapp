"use client";

import { useState } from "react";
import Sidebar from "@/components/shop/Sidebar";
import Topbar from "@/components/shop/Topbar";
import { useRequireRole } from "@/lib/hooks/useRequireRole";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { checking } = useRequireRole("shop_owner");

  // ระหว่างเช็คสิทธิ์ (หรือกำลัง redirect ออกเพราะไม่ใช่ shop_owner/session หมดอายุ) ไม่ render layout จริงเลย
  // กันไม่ให้คน logout ไปแล้ว/role อื่นยังเห็น dashboard ร้านค้าเต็มรูปแบบ (บั๊กที่ยืนยันแล้วใน QA Phase 01 — BUG-01-02)
  if (checking) {
    return <div className="flex h-screen items-center justify-center bg-gray-50 text-gray-400 text-sm">กำลังตรวจสอบสิทธิ์...</div>;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <Sidebar
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
      />
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <Topbar onMobileMenuOpen={() => setMobileOpen(true)} />
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
