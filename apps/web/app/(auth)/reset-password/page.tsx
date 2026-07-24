"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

function getPasswordStrength(pass: string) {
  if (!pass) return { score: 0, label: "", colorClass: "bg-slate-200" };
  if (pass.length < 8) {
    return { score: 1, label: "ความปลอดภัย: น้อย (ต้องการอย่างน้อย 8 ตัวอักษร)", colorClass: "bg-red-500" };
  }
  if (pass.length < 12) {
    return { score: 2, label: "ความปลอดภัย: ปานกลาง", colorClass: "bg-orange-400" };
  }
  return { score: 3, label: "ความปลอดภัย: สูง", colorClass: "bg-teal-500" };
}

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const passwordsMatch = !password || !confirmPassword || password === confirmPassword;
  const strength = getPasswordStrength(password);

  const isFormValid = password.length >= 8 && confirmPassword.length >= 8 && password === confirmPassword;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid || !token) return;

    // TODO: ต่อ API ยืนยัน token และบันทึกรหัสผ่านใหม่ (Argon2 hash ฝั่ง backend)
    console.log("EasyPrint Reset Password Form Submitted:", { token });
    setSubmitted(true);
  };

  if (!token) {
    return (
      <div className="text-center space-y-5">
        <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto">
          <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
          </svg>
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-bold text-slate-900">ลิงก์ไม่ถูกต้องหรือหมดอายุ</h2>
          <p className="text-sm text-slate-500 leading-relaxed">
            ลิงก์รีเซ็ตรหัสผ่านนี้ใช้ไม่ได้แล้ว กรุณาขอลิงก์ใหม่อีกครั้ง
          </p>
        </div>
        <Link
          href="/forgot-password"
          className="inline-block w-full py-3.5 font-bold rounded-full shadow-lg bg-[#F46A2F] text-white hover:bg-[#E05B22] transition"
        >
          ขอลิงก์รีเซ็ตรหัสผ่านใหม่
        </Link>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="text-center space-y-5">
        <div className="w-16 h-16 bg-teal-50 rounded-full flex items-center justify-center mx-auto">
          <svg className="w-8 h-8 text-[#8FD2D5]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-bold text-slate-900">ตั้งรหัสผ่านใหม่สำเร็จ</h2>
          <p className="text-sm text-slate-500 leading-relaxed">
            คุณสามารถเข้าสู่ระบบด้วยรหัสผ่านใหม่ได้ทันที
          </p>
        </div>
        <Link
          href="/login"
          className="inline-block w-full py-3.5 font-bold rounded-full shadow-lg bg-[#F46A2F] text-white hover:bg-[#E05B22] transition"
        >
          ไปหน้าเข้าสู่ระบบ
        </Link>
      </div>
    );
  }

  return (
    <>
      {/* Illustration: padlock + reset badge inside a decorated pastel circle */}
      <div className="relative w-40 h-40 mx-auto">
        <div className="absolute -top-1 left-2 w-6 h-6 rounded-lg bg-[#F3DADA] rotate-12"></div>
        <div className="absolute top-3 -right-2 w-7 h-7 rounded-lg bg-[#8FD2D5]/50 -rotate-12"></div>
        <div className="absolute -bottom-1 left-0 w-5 h-5 rounded-lg bg-[#FFB273]/60 rotate-6"></div>
        <div className="absolute bottom-2 -right-3 w-6 h-6 rounded-lg bg-[#F3DADA] -rotate-6"></div>

        <div className="absolute inset-3 rounded-full bg-gradient-to-br from-orange-50 to-slate-100 flex items-center justify-center">
          <svg viewBox="0 0 100 100" className="w-24 h-24">
            {/* Shackle */}
            <path d="M35 44a15 15 0 0130 0" fill="none" stroke="#F46A2F" strokeWidth="8" strokeLinecap="round" />
            {/* Lock body */}
            <rect x="25" y="43" width="50" height="38" rx="10" fill="#F46A2F" />
            {/* Keyhole */}
            <circle cx="50" cy="57" r="5" fill="#FFF7F2" />
            <rect x="47" y="60" width="6" height="10" rx="2" fill="#FFF7F2" />
            {/* Reset badge */}
            <circle cx="77" cy="79" r="15" fill="#8FD2D5" stroke="#FFF7F2" strokeWidth="3" />
            <g transform="translate(69.2 71.2) scale(0.65)" fill="none" stroke="#FFF7F2" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
              <path d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
            </g>
          </svg>
        </div>
      </div>

      <div className="space-y-2 text-center">
        <h2 className="text-2xl sm:text-[26px] font-extrabold text-slate-900 tracking-tight">ตั้งรหัสผ่านใหม่</h2>
        <p className="text-sm text-slate-400 leading-relaxed max-w-[320px] mx-auto">
          หากต้องการรีเซ็ตรหัสผ่าน กรุณากรอกรหัสผ่านใหม่ของคุณด้านล่าง
        </p>
      </div>

      <form className="space-y-5" onSubmit={handleSubmit}>
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-2">รหัสผ่านใหม่</label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="กรอกรหัสผ่านใหม่"
              className="w-full px-5 py-3.5 rounded-full bg-slate-50 border border-slate-200 text-sm placeholder:text-slate-400 focus:outline-none focus:border-[#F46A2F] focus:ring-1 focus:ring-[#F46A2F] transition pr-12"
            />
            {password.length > 0 && (
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition"
                aria-label={showPassword ? "ซ่อนรหัสผ่าน" : "แสดงรหัสผ่าน"}
              >
                {showPassword ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.542-7a10.025 10.025 0 012.132-3.611m3.13-2.567A9.958 9.958 0 0112 5c4.478 0 8.268 2.943 9.542 7a10.025 10.025 0 01-4.132 5.411M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3l18 18" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            )}
          </div>
          <p className="text-xs text-slate-400 mt-2">อย่างน้อย 8 ตัวอักษร</p>

          <div className="flex gap-1 mt-2">
            <div className={`h-1 flex-1 rounded-full transition-colors ${password.length > 0 ? strength.colorClass : "bg-slate-200"}`}></div>
            <div className={`h-1 flex-1 rounded-full transition-colors ${password.length > 0 && strength.score >= 2 ? strength.colorClass : "bg-slate-200"}`}></div>
            <div className={`h-1 flex-1 rounded-full transition-colors ${password.length > 0 && strength.score >= 3 ? strength.colorClass : "bg-slate-200"}`}></div>
          </div>
          {password.length > 0 && (
            <span
              className={`text-xs font-bold mt-1 block ${
                strength.score === 1 ? "text-red-500" : strength.score === 2 ? "text-orange-400" : "text-teal-500"
              }`}
            >
              {strength.label}
            </span>
          )}
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-2">ยืนยันรหัสผ่านใหม่</label>
          <div className="relative">
            <input
              type={showConfirmPassword ? "text" : "password"}
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="ยืนยันรหัสผ่านใหม่อีกครั้ง"
              className="w-full px-5 py-3.5 rounded-full bg-slate-50 border border-slate-200 text-sm placeholder:text-slate-400 focus:outline-none focus:border-[#F46A2F] focus:ring-1 focus:ring-[#F46A2F] transition pr-12"
            />
            {confirmPassword.length > 0 && (
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition"
                aria-label={showConfirmPassword ? "ซ่อนรหัสผ่าน" : "แสดงรหัสผ่าน"}
              >
                {showConfirmPassword ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.542-7a10.025 10.025 0 012.132-3.611m3.13-2.567A9.958 9.958 0 0112 5c4.478 0 8.268 2.943 9.542 7a10.025 10.025 0 01-4.132 5.411M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3l18 18" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            )}
          </div>
          {!passwordsMatch && <p className="text-xs text-red-500 mt-2">รหัสผ่านไม่ตรงกัน</p>}
        </div>

        <button
          type="submit"
          disabled={!isFormValid}
          className={`w-full py-3.5 font-bold rounded-full transition-all duration-300 flex items-center justify-center gap-2 ${
            isFormValid
              ? "bg-gradient-to-r from-[#F46A2F] via-[#FF8A50] to-[#FFB273] text-white border border-white/40 shadow-lg shadow-[#F46A2F]/30 hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
              : "bg-slate-200 text-slate-400 cursor-not-allowed"
          }`}
        >
          เปลี่ยนรหัสผ่าน
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17 8l4 4m0 0l-4 4m4-4H3" />
          </svg>
        </button>
      </form>

      <p className="text-xs text-slate-400 text-center leading-relaxed">
        หากคุณไม่ได้ร้องขอลิงก์กู้คืนรหัสผ่าน กรุณาเพิกเฉยต่อข้อความนี้
      </p>
    </>
  );
}

export default function ResetPasswordPage() {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-800 antialiased flex flex-col justify-center items-center p-4 relative overflow-hidden">
      <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-gradient-to-tr from-[#F46A2F]/10 to-[#FFB273]/5 blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] rounded-full bg-gradient-to-tr from-[#8FD2D5]/10 to-[#F3DADA]/5 blur-3xl pointer-events-none"></div>

      <div className="relative w-full max-w-[440px]">
        {/* Peeking accent shape behind the card, bottom-left */}
        <div className="absolute -bottom-4 -left-4 w-2/3 h-1/2 bg-gradient-to-tr from-[#FFE4D1] to-[#F3DADA]/60 rounded-[32px] -z-10"></div>

        <div className="relative bg-white rounded-[28px] shadow-xl shadow-slate-200/50 p-8 sm:p-10 space-y-7">
          <Suspense fallback={<div className="text-center text-sm text-slate-400">กำลังโหลด...</div>}>
            <ResetPasswordForm />
          </Suspense>
        </div>
      </div>
    </main>
  );
}
