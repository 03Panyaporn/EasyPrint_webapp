"use client";

import { useState } from "react";
import Link from "next/link";

export default function ChangePasswordPage() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [success, setSuccess] = useState(false);

  const passwordsMatch = !newPassword || !confirmNewPassword || newPassword === confirmNewPassword;
  const isSameAsCurrent = currentPassword.length > 0 && newPassword.length > 0 && currentPassword === newPassword;

  const isFormValid =
    currentPassword.length > 0 &&
    newPassword.length >= 8 &&
    newPassword === confirmNewPassword &&
    !isSameAsCurrent;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid) return;

    // TODO: ต่อ API ตรวจสอบรหัสผ่านปัจจุบันและบันทึกรหัสผ่านใหม่ (Argon2 hash ฝั่ง backend)
    console.log("EasyPrint Change Password Form Submitted");
    setSuccess(true);
    setCurrentPassword("");
    setNewPassword("");
    setConfirmNewPassword("");
  };

  return (
    <main className="max-w-lg mx-auto p-8">
      <div className="bg-white rounded-2xl shadow-sm p-6 space-y-6">
        <div>
          <h1 className="text-xl font-bold text-slate-800">เปลี่ยนรหัสผ่าน</h1>
          <p className="text-sm text-slate-500 mt-1">
            เพื่อความปลอดภัย กรุณากรอกรหัสผ่านปัจจุบันก่อนตั้งรหัสผ่านใหม่
          </p>
        </div>

        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 text-sm font-medium rounded-xl px-4 py-3">
            เปลี่ยนรหัสผ่านสำเร็จแล้ว
          </div>
        )}

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5">รหัสผ่านปัจจุบัน</label>
            <input
              type="password"
              required
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-orange-400 focus:ring-1 focus:ring-orange-400 transition"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5">รหัสผ่านใหม่</label>
            <input
              type="password"
              required
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-orange-400 focus:ring-1 focus:ring-orange-400 transition"
            />
            <p className="text-[11px] text-slate-400 mt-1">รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร</p>
            {isSameAsCurrent && (
              <p className="text-[11px] text-red-500 mt-1">รหัสผ่านใหม่ต้องไม่ซ้ำกับรหัสผ่านปัจจุบัน</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5">ยืนยันรหัสผ่านใหม่</label>
            <input
              type="password"
              required
              value={confirmNewPassword}
              onChange={(e) => setConfirmNewPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-orange-400 focus:ring-1 focus:ring-orange-400 transition"
            />
            {!passwordsMatch && <p className="text-[11px] text-red-500 mt-1">รหัสผ่านไม่ตรงกัน</p>}
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              type="submit"
              disabled={!isFormValid}
              className={`px-5 py-2.5 rounded-full text-sm font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 ${
                isFormValid
                  ? "bg-orange-500 text-white hover:bg-orange-600 cursor-pointer"
                  : "bg-slate-100 text-slate-400 cursor-not-allowed"
              }`}
            >
              บันทึกรหัสผ่านใหม่
            </button>
            <Link href="/orders" className="text-sm font-semibold text-slate-500 hover:text-slate-700 transition">
              ยกเลิก
            </Link>
          </div>
        </form>
      </div>
    </main>
  );
}
