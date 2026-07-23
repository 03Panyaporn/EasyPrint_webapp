"use client";

import { useState } from "react";
import Link from "next/link";

export default function LoginPage() {
  const [usernameOrEmail, setUsernameOrEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const isFormValid = usernameOrEmail.trim() !== "" && password.length >= 8;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid) return;
    
    console.log("EasyPrint Login Form Submitted:", {
      usernameOrEmail,
      password,
      rememberMe,
    });
  };

  return (
    <main className="min-h-screen bg-slate-50 text-slate-800 antialiased flex flex-col lg:flex-row relative overflow-hidden">
      
      {/* Inject custom CSS keyframe animations for floating 3D spheres */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes float-slow {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-25px) rotate(4deg); }
        }
        @keyframes float-medium {
          0%, 100% { transform: translateY(0px) scale(1) rotate(0deg); }
          50% { transform: translateY(-15px) scale(1.06) rotate(-3deg); }
        }
        @keyframes float-fast {
          0%, 100% { transform: translateY(0px) rotate(0deg) translate3d(0, 0, 0); }
          50% { transform: translateY(-30px) rotate(-6deg) translate3d(10px, -10px, 0); }
        }
        .animate-float-1 { animation: float-slow 10s ease-in-out infinite; }
        .animate-float-2 { animation: float-medium 8s ease-in-out infinite; }
        .animate-float-3 { animation: float-fast 12s ease-in-out infinite; }
      `}} />

      {/* LEFT COLUMN: Welcome Panel (Orange-Teal-Pink gradient + Floating Spheres & Glassmorphic 3D Card) */}
      <div className="hidden lg:flex lg:w-[50%] bg-gradient-to-tr from-[#F46A2F] via-[#FFB273]/80 to-[#8FD2D5] flex-col justify-between p-16 relative overflow-hidden shadow-2xl">
        
        {/* Decorative Grid Overlay to add modern micro-texture depth */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff0c_1px,transparent_1px),linear-gradient(to_bottom,#ffffff0c_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none"></div>

        {/* 3D-like spheres with premium gradients, borders and multi-layered shadows */}
        <div className="absolute top-[8%] left-[15%] w-80 h-80 rounded-full bg-gradient-to-br from-[#FFB273] to-[#F46A2F] shadow-[inset_-10px_-10px_30px_rgba(0,0,0,0.2),10px_20px_40px_rgba(244,106,47,0.4)] blur-[1px] animate-float-1 pointer-events-none z-0"></div>
        <div className="absolute bottom-[10%] right-[8%] w-[380px] h-[380px] rounded-full bg-gradient-to-tr from-[#8FD2D5] to-[#F3DADA] shadow-[inset_-15px_-15px_40px_rgba(0,0,0,0.15),15px_25px_55px_rgba(143,210,213,0.35)] blur-[2px] animate-float-3 pointer-events-none z-0"></div>
        <div className="absolute top-[42%] right-[18%] w-40 h-40 rounded-full bg-gradient-to-br from-[#FFFFFF]/30 to-[#FFFFFF]/5 backdrop-blur-[4px] border border-white/20 shadow-[0_20px_40px_rgba(0,0,0,0.1)] animate-float-2 pointer-events-none z-0"></div>

        {/* Empty placeholder for flex spacing in place of the deleted logo */}
        <div className="relative z-10"></div>

        {/* Welcome Text + Standout Logo Title */}
        <div className="my-auto space-y-8 relative z-10 max-w-lg">
          <div className="space-y-5">
            {/* Standout Wordmark Design */}
            <h1 className="text-7xl sm:text-8xl font-black tracking-tight text-white drop-shadow-[0_8px_24px_rgba(0,0,0,0.15)] leading-[1.05]">
              Easy<span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FFB273] to-[#F3DADA] drop-shadow-[0_8px_16px_rgba(255,178,115,0.3)]">Print</span>
            </h1>

            <div className="inline-block">
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-white/20 backdrop-blur-md border border-white/30 text-white font-extrabold text-sm tracking-wide shadow-md">
                ✨ ยินดีต้อนรับกลับเข้าสู่ระบบ
              </span>
            </div>
          </div>

          <p className="text-white/95 text-xl font-medium leading-relaxed drop-shadow-sm max-w-md">
            จัดการและจัดส่งคำสั่งพิมพ์เอกสารออนไลน์ของคุณให้รวดเร็ว ปลอดภัย และไร้รอยต่อในที่เดียว
          </p>

          {/* Interactive 3D Glassmorphic Preview Card (Static / No floating animation) */}
          <div className="bg-white/10 backdrop-blur-xl border border-white/20 p-6 rounded-[24px] shadow-2xl shadow-black/5 max-w-xs flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-[#FFB273] to-[#F46A2F] flex items-center justify-center text-white shadow-lg">
              <svg className="w-6 h-6 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.4" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
            </div>
            <div className="flex-1 space-y-1.5">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-white">กำลังพิมพ์เอกสาร...</span>
                <span className="text-[10px] font-extrabold text-[#FFB273] tracking-wider">85%</span>
              </div>
              <div className="w-full h-1.5 bg-white/20 rounded-full overflow-hidden">
                <div className="w-[85%] h-full bg-gradient-to-r from-[#FFB273] to-white rounded-full"></div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer guard */}
        <div className="text-white/60 text-xs font-semibold relative z-10 tracking-wide">
          © 2026 EasyPrint App. All rights reserved.
        </div>
      </div>

      {/* RIGHT COLUMN: Sign In Form */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12 lg:p-16 relative z-10 bg-white lg:bg-slate-50/20">
        
        {/* Subtle background glow for mobile screens */}
        <div className="absolute top-0 right-0 w-80 h-80 rounded-full bg-[#FFB273]/8 blur-3xl pointer-events-none lg:hidden"></div>
        <div className="absolute bottom-0 left-0 w-80 h-80 rounded-full bg-[#8FD2D5]/8 blur-3xl pointer-events-none lg:hidden"></div>

        {/* Card Container */}
        <div className="w-full max-w-[480px] bg-white rounded-[24px] shadow-2xl shadow-slate-100/60 sm:border border-slate-100/80 p-8 sm:p-10 space-y-8 my-auto relative z-10">
          
          {/* Brand Logo for mobile only */}
          <div className="flex lg:hidden items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#F46A2F] to-[#FFB273] flex items-center justify-center text-white font-extrabold shadow-lg shadow-[#F46A2F]/10">
              EP
            </div>
            <span className="text-lg font-bold text-slate-900">Easy<span className="text-[#F46A2F]">Print</span></span>
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">เข้าสู่ระบบ</h2>
            <p className="text-sm text-slate-400 font-medium">กรอกชื่อบัญชีและรหัสผ่านเพื่อเข้าใช้งาน</p>
          </div>

          <form className="space-y-5" onSubmit={handleSubmit}>
            
            {/* Username/Email Input */}
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5">ชื่อผู้ใช้งาน หรือ อีเมล</label>
              <div className="relative">
                <div className="absolute left-3.5 top-3.5 text-slate-400">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <input
                  type="text"
                  required
                  value={usernameOrEmail}
                  onChange={(e) => setUsernameOrEmail(e.target.value)}
                  placeholder="example@email.com"
                  className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-[#F46A2F] focus:ring-1 focus:ring-[#F46A2F] transition duration-200"
                />
              </div>
            </div>

            {/* Password Input */}
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5">รหัสผ่าน</label>
              <div className="relative">
                <div className="absolute left-3.5 top-3.5 text-slate-400">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-11 pr-16 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-[#F46A2F] focus:ring-1 focus:ring-[#F46A2F] transition duration-200"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-3.5 text-xs font-bold text-[#F46A2F] hover:text-[#E05B22] transition"
                >
                  {showPassword ? "ซ่อน" : "แสดง"}
                </button>
              </div>
            </div>

            {/* Remember Me and Forgot Password */}
            <div className="flex items-center justify-between text-xs font-semibold">
              <label className="flex items-center gap-2 text-slate-500 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-350 text-[#F46A2F] focus:ring-[#F46A2F]"
                />
                จดจำฉันไว้
              </label>
              <Link href="/forgot-password" className="text-[#F46A2F] hover:underline">
                ลืมรหัสผ่าน?
              </Link>
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={!isFormValid}
                className={`w-full py-3.5 font-bold rounded-[14px] shadow-lg transition-all duration-300 ${
                  isFormValid
                    ? "bg-[#F46A2F] text-white hover:bg-[#E05B22] hover:-translate-y-0.5 active:translate-y-0 shadow-[#F46A2F]/20 cursor-pointer"
                    : "bg-slate-300 text-white cursor-not-allowed"
                }`}
              >
                เข้าสู่ระบบ
              </button>
            </div>

          </form>

          {/* Signup Link */}
          <div className="text-center pt-2">
            <p className="text-sm text-slate-400 font-medium">
              ยังไม่มีบัญชีใช่ไหม?{" "}
              <Link href="/register" className="text-[#F46A2F] hover:text-[#F46A2F]/80 font-bold hover:underline transition">
                สมัครสมาชิก
              </Link>
            </p>
          </div>

        </div>
      </div>
    </main>
  );
}
