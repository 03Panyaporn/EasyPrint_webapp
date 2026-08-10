"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

export default function AdminNotificationsPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/admin");
  }, [router]);

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3 text-slate-400">
      <Loader2 size={24} className="animate-spin text-orange-500" />
      <p className="text-sm font-semibold">กำลังเปลี่ยนหน้าไปยัง Dashboard...</p>
    </div>
  );
}
