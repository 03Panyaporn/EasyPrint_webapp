"use client";

import { useState } from "react";
import Link from "next/link";

export default function RegisterPage() {
  const [role, setRole] = useState<"customer" | "shop_owner">("customer");
  
  // Form field states
  const [usernameOrEmail, setUsernameOrEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [firstname, setFirstname] = useState("");
  const [lastname, setLastname] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  
  // Toggles
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [acceptPdpa, setAcceptPdpa] = useState(false);
  
  // Password match error state
  const passwordsMatch = !password || !confirmPassword || password === confirmPassword;

  // Password strength logic
  const getPasswordStrength = (pass: string) => {
    if (!pass) return { score: 0, label: "", colorClass: "bg-slate-200" };
    if (pass.length < 8) {
      return { score: 1, label: "ความปลอดภัย: น้อย (ต้องการอย่างน้อย 8 ตัวอักษร)", colorClass: "bg-red-500" };
    }
    if (pass.length < 12) {
      return { score: 2, label: "ความปลอดภัย: ปานกลาง", colorClass: "bg-orange-400" };
    }
    return { score: 3, label: "ความปลอดภัย: สูง", colorClass: "bg-teal-500" };
  };

  const strength = getPasswordStrength(password);

  // Form validity check
  const isFormValid =
    usernameOrEmail.trim() !== "" &&
    password.length >= 8 &&
    passwordsMatch &&
    firstname.trim() !== "" &&
    lastname.trim() !== "" &&
    phone.trim() !== "" &&
    acceptTerms &&
    acceptPdpa;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid) return;
    
    console.log("EasyPrint Register Form Submitted:", {
      role,
      usernameOrEmail,
      password,
      firstname,
      lastname,
      phone,
      address,
    });
  };

  return (
    <main className="min-h-screen bg-slate-50 text-slate-800 antialiased flex flex-col justify-center items-center p-4 relative overflow-x-hidden">
      {/* Background Accents (Subtle Orange -> Teal Gradient) */}
      <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-gradient-to-tr from-[#F46A2F]/10 to-[#FFB273]/5 blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] rounded-full bg-gradient-to-tr from-[#8FD2D5]/10 to-[#F3DADA]/5 blur-3xl pointer-events-none"></div>

      {/* Registration Card */}
      <div className="w-full max-w-[620px] bg-white rounded-[24px] shadow-2xl shadow-slate-100/50 border border-slate-100 p-8 sm:p-12 space-y-8 my-8 relative z-10">
        
        {/* Centered Brand Logo */}
        <div className="flex flex-col items-center gap-2 text-center">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#F46A2F] to-[#FFB273] flex items-center justify-center text-white font-extrabold text-xl shadow-lg shadow-[#F46A2F]/20">
            EP
          </div>
          <span className="text-2xl font-bold tracking-tight text-slate-900">Easy<span className="text-[#F46A2F]">Print</span></span>
        </div>

        {/* Title */}
        <div className="space-y-2 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">สมัครสมาชิก</h2>
          <p className="text-sm text-slate-400 font-medium">เลือกประเภทบัญชีที่ต้องการสมัคร</p>
        </div>

        {/* Segmented Control for Account Type */}
        <div className="bg-slate-100 p-1 rounded-xl flex">
          <button
            type="button"
            onClick={() => setRole("customer")}
            className={`flex-1 py-3 text-sm font-semibold rounded-lg transition-all duration-300 flex items-center justify-center gap-2 ${
              role === "customer"
                ? "bg-[#F46A2F] text-white shadow-sm"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            👤 ลูกค้า
          </button>
          <button
            type="button"
            onClick={() => setRole("shop_owner")}
            className={`flex-1 py-3 text-sm font-semibold rounded-lg transition-all duration-300 flex items-center justify-center gap-2 ${
              role === "shop_owner"
                ? "bg-[#F46A2F] text-white shadow-sm"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            🏪 เจ้าของร้านค้า
          </button>
        </div>

        {/* Main Form */}
        <form className="space-y-8" onSubmit={handleSubmit}>
          
          {/* 1. Account Info Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-1 border-b border-slate-100">
              <span className="w-1.5 h-4 bg-[#F46A2F] rounded-full"></span>
              <h3 className="text-sm font-bold text-slate-900 tracking-wide uppercase">1. ข้อมูลบัญชีผู้ใช้งาน</h3>
            </div>
            
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5">ชื่อผู้ใช้งาน หรือ อีเมล</label>
                <input
                  type="text"
                  required
                  value={usernameOrEmail}
                  onChange={(e) => setUsernameOrEmail(e.target.value)}
                  placeholder="example@email.com"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-[#F46A2F] focus:ring-1 focus:ring-[#F46A2F] transition"
                />
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1.5">รหัสผ่าน</label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-[#F46A2F] focus:ring-1 focus:ring-[#F46A2F] transition pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-3.5 text-slate-400 hover:text-slate-600"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    </button>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร</p>
                  
                  {/* Strength Indicator */}
                  <div className="flex gap-1 mt-2">
                    <div className={`h-1 flex-1 rounded transition-colors ${password.length > 0 ? strength.colorClass : "bg-slate-200"}`}></div>
                    <div className={`h-1 flex-1 rounded transition-colors ${password.length > 0 && strength.score >= 2 ? strength.colorClass : "bg-slate-200"}`}></div>
                    <div className={`h-1 flex-1 rounded transition-colors ${password.length > 0 && strength.score >= 3 ? strength.colorClass : "bg-slate-200"}`}></div>
                  </div>
                  {password.length > 0 && (
                    <span className={`text-[10px] font-bold mt-1 block ${
                      strength.score === 1 ? "text-red-500" : strength.score === 2 ? "text-orange-400" : "text-teal-500"
                    }`}>
                      {strength.label}
                    </span>
                  )}
                </div>
                
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1.5">ยืนยันรหัสผ่าน</label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-[#F46A2F] focus:ring-1 focus:ring-[#F46A2F] transition pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-3.5 text-slate-400 hover:text-slate-600"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    </button>
                  </div>
                  {!passwordsMatch && (
                    <p className="text-[10px] text-red-500 mt-1">รหัสผ่านไม่ตรงกัน</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* 2. Personal Info Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-1 border-b border-slate-100">
              <span className="w-1.5 h-4 bg-[#F46A2F] rounded-full"></span>
              <h3 className="text-sm font-bold text-slate-900 tracking-wide uppercase">2. ข้อมูลส่วนตัว</h3>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5">ชื่อ</label>
                <input
                  type="text"
                  required
                  value={firstname}
                  onChange={(e) => setFirstname(e.target.value)}
                  placeholder="สมชาย"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-[#F46A2F] focus:ring-1 focus:ring-[#F46A2F] transition"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5">นามสกุล</label>
                <input
                  type="text"
                  required
                  value={lastname}
                  onChange={(e) => setLastname(e.target.value)}
                  placeholder="ใจดี"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-[#F46A2F] focus:ring-1 focus:ring-[#F46A2F] transition"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5">เบอร์โทรศัพท์</label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="0XX-XXX-XXXX"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-[#F46A2F] focus:ring-1 focus:ring-[#F46A2F] transition"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5">ที่อยู่ (ไม่บังคับ)</label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="บ้านเลขที่, ถนน, อำเภอ"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-[#F46A2F] focus:ring-1 focus:ring-[#F46A2F] transition"
                />
              </div>
            </div>
          </div>

          {/* 3. Legal Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-1 border-b border-slate-100">
              <span className="w-1.5 h-4 bg-[#F46A2F] rounded-full"></span>
              <h3 className="text-sm font-bold text-slate-900 tracking-wide uppercase">3. ข้อตกลงทางกฎหมาย</h3>
            </div>
            
            <div className="bg-slate-50 rounded-2xl border border-slate-150 p-5 space-y-3.5">
              <label className="flex items-start gap-3 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={acceptTerms}
                  onChange={(e) => setAcceptTerms(e.target.checked)}
                  className="mt-1 w-4 h-4 rounded border-slate-350 text-[#F46A2F] focus:ring-[#F46A2F]"
                />
                <span className="text-xs font-medium text-slate-600 leading-normal">ฉันยอมรับข้อตกลงและเงื่อนไขการให้บริการ</span>
              </label>
              
              <label className="flex items-start gap-3 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={acceptPdpa}
                  onChange={(e) => setAcceptPdpa(e.target.checked)}
                  className="mt-1 w-4 h-4 rounded border-slate-350 text-[#F46A2F] focus:ring-[#F46A2F]"
                />
                <span className="text-xs font-medium text-slate-600 leading-normal">ฉันยินยอมตามนโยบายความเป็นส่วนตัว (PDPA)</span>
              </label>
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-4">
            <button
              type="submit"
              disabled={!isFormValid}
              className={`w-full py-4 font-bold rounded-[14px] shadow-lg transition-all duration-300 flex items-center justify-center ${
                isFormValid
                  ? "bg-[#F46A2F] text-white hover:bg-[#E05B22] hover:-translate-y-0.5 active:translate-y-0 shadow-[#F46A2F]/20 cursor-pointer"
                  : "bg-slate-300 text-white cursor-not-allowed"
              }`}
            >
              สมัครสมาชิก
            </button>
          </div>

        </form>

        {/* Under button only link */}
        <div className="text-center">
          <p className="text-sm text-slate-400 font-medium">
            มีบัญชีอยู่แล้ว?{" "}
            <Link href="/login" className="text-[#F46A2F] hover:text-[#F46A2F]/80 font-bold hover:underline transition">
              เข้าสู่ระบบ
            </Link>
          </p>
        </div>

        {/* Footer Secure Guard */}
        <div className="flex items-center justify-center gap-2 text-[10px] text-slate-400 font-medium pt-4 border-t border-slate-100">
          <svg className="w-3.5 h-3.5 text-[#8FD2D5]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
          ข้อมูลของคุณได้รับการปกป้องตามมาตรฐานความปลอดภัยและ PDPA
        </div>

      </div>
    </main>
  );
}
