import type { Metadata } from "next";
import { Settings, Clock } from "lucide-react";

export const metadata: Metadata = { title: "ตั้งค่าระบบ" };

export default function SettingsPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center gap-4">
      <div className="w-20 h-20 bg-orange-100 rounded-2xl flex items-center justify-center">
        <Settings size={36} className="text-orange-500" />
      </div>
      <div>
        <h1 className="text-2xl font-bold text-gray-900">ตั้งค่าระบบ</h1>
        <p className="text-gray-500 mt-1 text-sm">หน้านี้กำลังอยู่ในระหว่างการพัฒนา</p>
      </div>
      <div className="flex items-center gap-2 px-4 py-2 bg-orange-50 text-orange-600 rounded-full text-sm font-medium">
        <Clock size={14} />
        Coming Soon
      </div>
    </div>
  );
}
