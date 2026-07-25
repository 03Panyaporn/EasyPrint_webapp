"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { register } from "@/lib/api/auth";
import { ApiError } from "@/lib/api/client";

const PASSWORD_REVEAL_MS = 10000;

export default function RegisterPage() {
  const router = useRouter();

  // Form field states
  const [email, setEmail] = useState("");
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

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  // Auto-hide password again after a few seconds so it doesn't stay exposed
  useEffect(() => {
    if (!showPassword) return;
    const timer = setTimeout(() => setShowPassword(false), PASSWORD_REVEAL_MS);
    return () => clearTimeout(timer);
  }, [showPassword]);

  useEffect(() => {
    if (!showConfirmPassword) return;
    const timer = setTimeout(() => setShowConfirmPassword(false), PASSWORD_REVEAL_MS);
    return () => clearTimeout(timer);
  }, [showConfirmPassword]);

  // Password match error state
  const passwordsMatch = !password || !confirmPassword || password === confirmPassword;

  // Password strength logic
  const getPasswordStrength = (pass: string) => {
    if (!pass) return { score: 0, label: "", colorClass: "bg-slate-200" };
    if (pass.length < 8) {
      return { score: 1, label: "ความปลอดภัย: น้อย", colorClass: "bg-red-500" };
    }
    if (pass.length < 12) {
      return { score: 2, label: "ความปลอดภัย: ปานกลาง", colorClass: "bg-orange-400" };
    }
    return { score: 3, label: "ความปลอดภัย: สูง", colorClass: "bg-teal-500" };
  };

  const strength = getPasswordStrength(password);

  // Form validity check
  const isFormValid =
    email.trim() !== "" &&
    password.length >= 8 &&
    passwordsMatch &&
    firstname.trim() !== "" &&
    lastname.trim() !== "" &&
    phone.trim() !== "" &&
    acceptTerms;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid || isSubmitting) return;

    setFormError("");
    setIsSubmitting(true);
    try {
      await register({ email, password, firstname, lastname, phone, address: address || undefined });
      router.push("/orders");
      router.refresh();
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : "สมัครสมาชิกไม่สำเร็จ กรุณาลองใหม่อีกครั้ง");
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputClass =
    "w-full px-5 py-3.5 rounded-full bg-slate-50 border border-slate-200 text-sm placeholder:text-slate-400 focus:outline-none focus:border-[#F46A2F] focus:ring-1 focus:ring-[#F46A2F] transition";
  const labelClass = "text-xs font-bold text-slate-700";

  return (
    <main className="min-h-screen text-slate-800 antialiased flex items-center justify-center p-4 sm:p-8 relative overflow-hidden bg-[linear-gradient(120deg,#FFF7F2_0%,#FDF4EE_25%,#F4FAF9_50%,#FDF4EE_75%,#FFF7F2_100%)] bg-[length:200%_200%] animate-[aurora_18s_ease-in-out_infinite]">

      {/* Keyframes for the slow-panning aurora background and floating blobs */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes aurora {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        @keyframes float-a {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(20px, -30px) scale(1.08); }
        }
        @keyframes float-b {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(-25px, 25px) scale(1.05); }
        }
        @keyframes float-c {
          0%, 100% { transform: translate(0, 0) rotate(0deg); }
          50% { transform: translate(15px, 20px) rotate(8deg); }
        }
      `}} />

      {/* Subtle dot-grid texture for depth */}
      <div className="absolute inset-0 bg-[radial-gradient(#00000008_1px,transparent_1px)] bg-[size:22px_22px] pointer-events-none"></div>

      {/* Ambient floating color blobs (kept soft/blurred so the card stays the focal point) */}
      <div className="absolute top-[6%] left-[6%] w-80 h-80 rounded-full bg-[#F46A2F]/20 blur-3xl pointer-events-none [animation:float-a_11s_ease-in-out_infinite]"></div>
      <div className="absolute bottom-[8%] right-[8%] w-96 h-96 rounded-full bg-[#8FD2D5]/25 blur-3xl pointer-events-none [animation:float-b_13s_ease-in-out_infinite]"></div>
      <div className="absolute top-[38%] right-[16%] w-64 h-64 rounded-full bg-[#FFB273]/20 blur-3xl pointer-events-none [animation:float-c_9s_ease-in-out_infinite]"></div>
      <div className="absolute bottom-[30%] left-[14%] w-56 h-56 rounded-full bg-[#F3DADA]/25 blur-3xl pointer-events-none [animation:float-a_15s_ease-in-out_infinite]"></div>

      <div className="relative z-10 w-full max-w-[540px]">
        {/* Glow behind the card */}
        <div className="absolute -inset-4 bg-gradient-to-br from-[#F46A2F]/20 via-[#FFB273]/10 to-[#8FD2D5]/20 rounded-[36px] blur-2xl pointer-events-none"></div>

        <div className="relative bg-white rounded-[28px] border border-white p-8 sm:p-12 space-y-8 shadow-[0_25px_70px_-15px_rgba(244,106,47,0.25),0_15px_35px_-10px_rgba(15,23,42,0.15),inset_0_1px_0_0_rgba(255,255,255,0.9)]">

        {/* Brand mark */}
        <div className="flex items-center justify-center">
          <span className="text-xl font-extrabold text-slate-900 tracking-tight">Easy<span className="text-[#F46A2F]">Print</span></span>
        </div>

        {/* Title */}
        <div className="space-y-2 text-center">
          <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 tracking-normal">สมัครสมาชิก</h1>
          <div className="w-12 h-1 mx-auto rounded-full bg-gradient-to-r from-[#F46A2F] to-[#FFB273]"></div>
          <p className="text-sm text-slate-400">สร้างบัญชีลูกค้าเพื่อเริ่มสั่งพิมพ์เอกสารออนไลน์</p>
        </div>

        {/* Main Form */}
        <form className="space-y-6" onSubmit={handleSubmit}>

          {/* Email */}
          <div>
            <label className={`block ${labelClass} mb-2`}>อีเมล*</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="กรอกอีเมลของคุณ"
              className={inputClass}
            />
          </div>

          {/* Password */}
          <div>
            <label className={`block ${labelClass} mb-2`}>รหัสผ่าน*</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="ตั้งรหัสผ่าน"
                className={`${inputClass} pr-12`}
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

            {/* Strength Indicator */}
            <div className="flex gap-1 mt-2">
              <div className={`h-1 flex-1 rounded-full transition-colors ${password.length > 0 ? strength.colorClass : "bg-slate-200"}`}></div>
              <div className={`h-1 flex-1 rounded-full transition-colors ${password.length > 0 && strength.score >= 2 ? strength.colorClass : "bg-slate-200"}`}></div>
              <div className={`h-1 flex-1 rounded-full transition-colors ${password.length > 0 && strength.score >= 3 ? strength.colorClass : "bg-slate-200"}`}></div>
            </div>
          </div>

          {/* Confirm Password */}
          <div>
            <label className={`block ${labelClass} mb-2`}>ยืนยันรหัสผ่าน*</label>
            <div className="relative">
              <input
                type={showConfirmPassword ? "text" : "password"}
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="กรอกรหัสผ่านอีกครั้ง"
                className={`${inputClass} pr-12`}
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
            {!passwordsMatch && (
              <p className="text-xs text-red-500 mt-2">รหัสผ่านไม่ตรงกัน</p>
            )}
          </div>

          {/* Name row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={`block ${labelClass} mb-2`}>ชื่อ*</label>
              <input
                type="text"
                required
                value={firstname}
                onChange={(e) => setFirstname(e.target.value)}
                placeholder="สมชาย"
                className={inputClass}
              />
            </div>
            <div>
              <label className={`block ${labelClass} mb-2`}>นามสกุล*</label>
              <input
                type="text"
                required
                value={lastname}
                onChange={(e) => setLastname(e.target.value)}
                placeholder="ใจดี"
                className={inputClass}
              />
            </div>
          </div>

          {/* Phone + Address */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={`block ${labelClass} mb-2`}>เบอร์โทรศัพท์*</label>
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="0XX-XXX-XXXX"
                className={inputClass}
              />
            </div>
            <div>
              <label className={`block ${labelClass} mb-2`}>ที่อยู่ (ไม่บังคับ)</label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="บ้านเลขที่, ถนน, อำเภอ"
                className={inputClass}
              />
            </div>
          </div>

          {/* Terms checkbox */}
          <label className="flex items-start gap-2.5 cursor-pointer select-none pt-1">
            <input
              type="checkbox"
              checked={acceptTerms}
              onChange={(e) => setAcceptTerms(e.target.checked)}
              className="mt-0.5 w-4 h-4 rounded border-slate-300 text-[#F46A2F] focus:ring-[#F46A2F]"
            />
            <span className="text-xs text-slate-500 leading-normal">ฉันยอมรับข้อตกลงและเงื่อนไขการใช้บริการ</span>
          </label>

          {/* Server error message */}
          {formError && (
            <p className="text-sm text-red-500 font-semibold text-center">{formError}</p>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={!isFormValid || isSubmitting}
            className={`group relative w-full py-3.5 font-bold rounded-full overflow-hidden transition-all duration-300 ${
              isFormValid && !isSubmitting
                ? "bg-gradient-to-r from-[#F46A2F] via-[#FF8A50] to-[#FFB273] text-white border border-white/40 shadow-lg shadow-[#F46A2F]/30 hover:shadow-xl hover:shadow-[#F46A2F]/40 hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
                : "bg-slate-200 text-slate-400 cursor-not-allowed"
            }`}
          >
            {isFormValid && !isSubmitting && (
              <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-out bg-gradient-to-r from-transparent via-white/30 to-transparent skew-x-12"></span>
            )}
            <span className="relative">{isSubmitting ? "กำลังสมัครสมาชิก..." : "สมัครสมาชิก"}</span>
          </button>

        </form>

        {/* Login link */}
        <p className="text-sm text-slate-400 text-center">
          มีบัญชีอยู่แล้ว?{" "}
          <Link href="/login" className="text-[#F46A2F] font-bold hover:text-[#E05B22] transition">
            เข้าสู่ระบบ
          </Link>
        </p>

        </div>
      </div>
    </main>
  );
}
