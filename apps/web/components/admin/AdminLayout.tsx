"use client";

import { useState } from "react";
import AdminSidebar from "@/components/admin/AdminSidebar";
import AdminTopbar from "@/components/admin/AdminTopbar";
import { useRequireRole } from "@/lib/hooks/useRequireRole";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { checking } = useRequireRole("admin");

  // ระหว่างเช็คสิทธิ์ (หรือกำลัง redirect ออกเพราะไม่ใช่ admin) ไม่ render layout จริงเลย
  // กันไม่ให้ role อื่น/คนไม่ได้ login เห็น sidebar/topbar ของแอดมินแม้แค่แวบเดียว
  if (checking) {
    return <div className="flex h-screen items-center justify-center bg-gray-50 text-gray-400 text-sm">กำลังตรวจสอบสิทธิ์...</div>;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <AdminSidebar
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
      />
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <AdminTopbar onMobileMenuOpen={() => setMobileOpen(true)} />
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
