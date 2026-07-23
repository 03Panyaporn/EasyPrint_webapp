"use client";

import { useEffect } from "react";
import { AlertCircle } from "lucide-react";

export default function ShopError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Shop layout error:", error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mb-4">
        <AlertCircle size={32} className="text-red-500" />
      </div>
      <h2 className="text-xl font-bold text-gray-800 mb-2">เกิดข้อผิดพลาดในการโหลดหน้า</h2>
      <p className="text-sm text-gray-500 max-w-sm mb-6">
        {error.message || "ไม่สามารถแสดงผลหน้านี้ได้"}
      </p>
      <button
        onClick={() => reset()}
        className="px-4 py-2 bg-orange-500 text-white rounded-xl font-medium hover:bg-orange-600 transition"
      >
        ลองใหม่อีกครั้ง
      </button>
    </div>
  );
}
