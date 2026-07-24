"use client";

import { useState } from "react";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isEmailValid) return;

    // TODO: ต่อ API ส่งลิงก์รีเซ็ตรหัสผ่านไปยังอีเมลจริง (ดู reset-password/page.tsx สำหรับหน้าปลายทางของลิงก์)
    console.log("EasyPrint Forgot Password Form Submitted:", { email });
    setSubmitted(true);
  };

  return (
    <main className="min-h-screen bg-slate-50 text-slate-800 antialiased flex flex-col justify-center items-center p-4 relative overflow-hidden">
      {/* Background Accents */}
      <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-gradient-to-tr from-[#F46A2F]/10 to-[#FFB273]/5 blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] rounded-full bg-gradient-to-tr from-[#8FD2D5]/10 to-[#F3DADA]/5 blur-3xl pointer-events-none"></div>

      <div className={`relative w-full ${submitted ? "max-w-[500px]" : "max-w-[440px]"}`}>
        {/* Peeking accent shape behind the card, bottom-left */}
        <div className="absolute -bottom-4 -left-4 w-2/3 h-1/2 bg-gradient-to-tr from-[#FFE4D1] to-[#F3DADA]/60 rounded-[32px] -z-10"></div>

        <div className={`relative bg-white rounded-[28px] shadow-xl shadow-slate-200/50 space-y-7 ${submitted ? "p-10 sm:p-14" : "p-8 sm:p-10"}`}>
          {submitted ? (
            <div className="text-center space-y-6">
              <div className="w-20 h-20 bg-teal-50 rounded-full flex items-center justify-center mx-auto">
                <svg className="w-10 h-10 text-[#8FD2D5]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <div className="space-y-3">
                <h2 className="text-2xl sm:text-[28px] font-extrabold text-slate-900">ตรวจสอบอีเมลของคุณ</h2>
                <p className="text-base text-slate-500 leading-relaxed">
                  เราได้ส่งลิงก์สำหรับรีเซ็ตรหัสผ่านไปที่ <span className="font-semibold text-slate-700">{email}</span> แล้ว
                  กรุณาตรวจสอบกล่องจดหมาย (รวมถึงโฟลเดอร์สแปม)
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSubmitted(false)}
                className="text-sm font-semibold text-[#F46A2F] hover:underline"
              >
                ไม่ได้รับอีเมล? ลองอีกครั้ง
              </button>
              <div className="pt-2 border-t border-slate-100">
                <Link href="/login" className="text-sm font-bold text-slate-500 hover:text-slate-700">
                  &larr; กลับไปหน้าเข้าสู่ระบบ
                </Link>
              </div>
            </div>
          ) : (
            <>
              {/* Illustration: key icon inside a decorated pastel circle */}
              <div className="relative w-40 h-40 mx-auto">
                {/* Scattered decorative squares */}
                <div className="absolute -top-1 left-2 w-6 h-6 rounded-lg bg-[#F3DADA] rotate-12"></div>
                <div className="absolute top-3 -right-2 w-7 h-7 rounded-lg bg-[#8FD2D5]/50 -rotate-12"></div>
                <div className="absolute -bottom-1 left-0 w-5 h-5 rounded-lg bg-[#FFB273]/60 rotate-6"></div>
                <div className="absolute bottom-2 -right-3 w-6 h-6 rounded-lg bg-[#F3DADA] -rotate-6"></div>

                {/* Pastel circle */}
                <div className="absolute inset-3 rounded-full bg-gradient-to-br from-orange-50 to-slate-100 flex items-center justify-center">
                  <svg viewBox="0 0 100 100" className="w-24 h-24" strokeLinecap="round" strokeLinejoin="round">
                    {/* Back key (peach, smaller, peeking out) */}
                    <g transform="rotate(28 50 50) translate(6 14)">
                      <circle cx="26" cy="52" r="13" fill="none" stroke="#FFB273" strokeWidth="7" />
                      <rect x="37" y="47.5" width="30" height="9" rx="2.5" fill="#FFB273" />
                      <rect x="58" y="56.5" width="7" height="9" fill="#FFB273" />
                      <rect x="68" y="56.5" width="7" height="12" fill="#FFB273" />
                    </g>
                    {/* Front key (brand orange, bold and clear) */}
                    <g transform="rotate(-24 50 50)">
                      <circle cx="28" cy="42" r="16" fill="none" stroke="#F46A2F" strokeWidth="9" />
                      <rect x="42" y="36.5" width="36" height="11" rx="3" fill="#F46A2F" />
                      <rect x="66" y="47.5" width="8.5" height="11" fill="#F46A2F" />
                      <rect x="78" y="47.5" width="8.5" height="15" fill="#F46A2F" />
                    </g>
                  </svg>
                </div>
              </div>

              <div className="space-y-2 text-center">
                <h2 className="text-2xl sm:text-[26px] font-extrabold text-slate-900 tracking-tight">ลืมรหัสผ่านใช่ไหม?</h2>
                <p className="text-sm text-slate-400 leading-relaxed max-w-[320px] mx-auto">
                  กรอกอีเมลที่ใช้สมัครสมาชิกด้านล่าง แล้วเราจะส่งลิงก์สำหรับกู้คืนรหัสผ่านให้คุณ
                </p>
              </div>

              <form className="space-y-5" onSubmit={handleSubmit}>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-2">อีเมล</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="กรอกอีเมลของคุณ"
                    className="w-full px-5 py-3.5 rounded-full bg-slate-50 border border-slate-200 text-sm placeholder:text-slate-400 focus:outline-none focus:border-[#F46A2F] focus:ring-1 focus:ring-[#F46A2F] transition"
                  />
                </div>

                <button
                  type="submit"
                  disabled={!isEmailValid}
                  className={`w-full py-3.5 font-bold rounded-full transition-all duration-300 flex items-center justify-center gap-2 ${
                    isEmailValid
                      ? "bg-gradient-to-r from-[#F46A2F] via-[#FF8A50] to-[#FFB273] text-white border border-white/40 shadow-lg shadow-[#F46A2F]/30 hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
                      : "bg-slate-200 text-slate-400 cursor-not-allowed"
                  }`}
                >
                  ส่งลิงก์กู้คืนรหัสผ่าน
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </button>
              </form>

              <p className="text-sm text-slate-400 text-center">
                จำรหัสผ่านได้แล้ว?{" "}
                <Link href="/login" className="text-slate-900 font-bold hover:text-[#F46A2F] transition">
                  เข้าสู่ระบบ
                </Link>
              </p>
            </>
          )}
        </div>
      </div>
    </main>
  );
}
