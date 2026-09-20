import { Users } from "lucide-react";

export default function AdminUsersPage() {
  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-orange-500 text-white shadow-sm">
          <Users size={21} />
        </div>
        <div>
          <h1 className="text-xl font-semibold text-slate-800 md:text-2xl">จัดการบัญชีผู้ใช้</h1>
          <p className="mt-0.5 text-xs text-slate-400 md:text-sm">
            หน้านี้แสดงรายชื่อผู้ใช้งานทั้งหมดในระบบ (ลูกค้า / เจ้าของร้าน / แอดมิน) ให้แอดมินจัดการสิทธิ์หรือระงับบัญชี
          </p>
        </div>
      </div>

      {/* Placeholder — ยังไม่มี backend รองรับหน้านี้ */}
      <div className="bg-white rounded-2xl sm:rounded-3xl p-6 sm:p-12 text-center border-2 border-dashed border-slate-200 space-y-1">
        <p className="text-slate-500 font-semibold text-xs sm:text-base">ฟีเจอร์นี้ยังไม่พร้อมใช้งาน</p>
        <p className="text-slate-400 text-[11px] sm:text-xs">อยู่ระหว่างการพัฒนา — จะสามารถจัดการบัญชีผู้ใช้งานได้ในเร็ว ๆ นี้</p>
      </div>
    </div>
  );
}
