"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Printer,
  Mail,
  Lock,
  User,
  Phone,
  MapPin,
  ArrowLeft
} from "lucide-react";
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

  const passwordsMatch = !password || !confirmPassword || password === confirmPassword;

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

  const hasUppercase = /[A-Z]/.test(password);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
  const isPasswordValid = password.length >= 8 && hasUppercase && hasSpecialChar;

  const isFormValid =
    email.trim() !== "" &&
    isPasswordValid &&
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

  return (
    <main className="min-h-screen bg-slate-50 text-slate-800 antialiased flex flex-col lg:flex-row relative overflow-hidden">
      {/* Inject custom CSS keyframe animations for floating 3D spheres */}
      <style dangerouslySetInnerHTML={{
        __html: `
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

      {/* LEFT COLUMN */}
      <div className="hidden lg:flex lg:w-[50%] bg-gradient-to-tr from-[#F46A2F] via-[#FFB273]/80 to-[#8FD2D5] flex-col justify-between p-16 relative overflow-hidden shadow-2xl">
        <div className="absolute top-[8%] left-[15%] w-80 h-80 rounded-full bg-gradient-to-br from-[#FFB273] to-[#F46A2F] shadow-[0_35px_70px_-10px_rgba(180,60,10,0.55)] animate-float-1 pointer-events-none z-0"></div>
        <div className="absolute bottom-[10%] right-[8%] w-[380px] h-[380px] rounded-full bg-gradient-to-tr from-[#8FD2D5] to-[#F3DADA] shadow-[0_35px_75px_-10px_rgba(20,90,95,0.4)] animate-float-3 pointer-events-none z-0"></div>
        <div className="absolute top-[42%] right-[18%] w-40 h-40 rounded-full bg-gradient-to-br from-[#FFFFFF]/30 to-[#FFFFFF]/5 backdrop-blur-[4px] border border-white/20 shadow-[0_20px_40px_rgba(0,0,0,0.1)] animate-float-2 pointer-events-none z-0"></div>
        
        {/* Back Button for Desktop */}
        <Link
          href="/"
          className="relative z-10 flex items-center gap-2 text-white/80 hover:text-white transition w-fit"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="font-bold">ย้อนกลับ</span>
        </Link>

        <div className="my-auto space-y-8 relative z-10 max-w-lg">
          <div className="space-y-5">
            <h1 className="text-7xl sm:text-8xl font-black tracking-tight text-white drop-shadow-[0_8px_24px_rgba(0,0,0,0.15)] leading-[1.05]">
              Easy<span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FFB273] to-[#F3DADA] drop-shadow-[0_8px_16px_rgba(255,178,115,0.3)]">Print</span>
            </h1>
            <p className="text-white text-2xl sm:text-3xl font-extrabold tracking-tight drop-shadow-[0_4px_12px_rgba(0,0,0,0.15)]">
              เริ่มต้นใช้งานกับเรา
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-xl border border-white/20 p-6 rounded-[24px] shadow-2xl shadow-black/5 max-w-xs flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-[#FFB273] to-[#F46A2F] flex items-center justify-center text-white shadow-lg">
              <Printer className="w-6 h-6 animate-pulse" />
            </div>
            <div className="flex-1 space-y-1.5">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-white">กำลังสร้างบัญชี...</span>
                <span className="text-[10px] font-extrabold text-[#FFB273] tracking-wider">NEW</span>
              </div>
              <div className="w-full h-1.5 bg-white/20 rounded-full overflow-hidden">
                <div className="w-[100%] h-full bg-gradient-to-r from-[#FFB273] to-white rounded-full"></div>
              </div>
            </div>
          </div>
        </div>

        <div className="text-white/60 text-xs font-semibold relative z-10 tracking-wide">
          © 2026 EasyPrint App. All rights reserved.
        </div>
      </div>

      {/* RIGHT COLUMN */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 sm:p-12 lg:p-16 relative z-10 bg-white lg:bg-slate-50 h-screen lg:overflow-y-auto">
        <div className="absolute top-0 right-0 w-80 h-80 rounded-full bg-[#FFB273]/8 blur-3xl pointer-events-none lg:hidden"></div>
        <div className="absolute bottom-0 left-0 w-80 h-80 rounded-full bg-[#8FD2D5]/8 blur-3xl pointer-events-none lg:hidden"></div>
        
        {/* Mobile Back button */}
        <div className="w-full max-w-[560px] flex lg:hidden mb-4 relative z-10">
            <Link
              href="/"
              className="flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-[#F46A2F] transition"
            >
              <ArrowLeft className="w-4 h-4" />
              ย้อนกลับ
            </Link>
        </div>

        <div className="w-full max-w-[520px] bg-white rounded-[24px] lg:border lg:border-slate-100 lg:shadow-[0_25px_60px_-15px_rgba(15,23,42,0.15),0_10px_28px_-10px_rgba(244,106,47,0.15)] p-0 lg:p-8 space-y-6 my-auto relative z-10">
          
          <div className="flex lg:hidden items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#F46A2F] to-[#FFB273] flex items-center justify-center text-white font-extrabold shadow-lg shadow-[#F46A2F]/10">
              EP
            </div>
            <span className="text-lg font-bold text-slate-900">Easy<span className="text-[#F46A2F]">Print</span></span>
          </div>

          <div className="space-y-2 text-center">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">สมัครสมาชิก</h2>
            <p className="text-[13px] text-slate-400 font-medium">สร้างบัญชีลูกค้าเพื่อเริ่มสั่งพิมพ์เอกสารออนไลน์</p>
          </div>

          <form className="space-y-5" onSubmit={handleSubmit}>
            <Field label="อีเมล" icon={<Mail className="w-4 h-4" />} required>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="example@email.com"
                required
                className={inputCls}
              />
            </Field>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="รหัสผ่าน" icon={<Lock className="w-4 h-4" />} required>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="อย่างน้อย 8 ตัวอักษร"
                    minLength={8}
                    required
                    className={`${inputCls} pr-10`}
                  />
                  {password.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-2 text-slate-400 hover:text-slate-600 transition"
                    >
                      {showPassword ? (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.542-7a10.025 10.025 0 012.132-3.611m3.13-2.567A9.958 9.958 0 0112 5c4.478 0 8.268 2.943 9.542 7a10.025 10.025 0 01-4.132 5.411M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3l18 18" />
                        </svg>
                      ) : (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      )}
                    </button>
                  )}
                </div>
                
                {/* Strength Indicator */}
                <div className="flex gap-1 mt-1.5 px-1">
                  <div className={`h-1 flex-1 rounded-full transition-colors ${password.length > 0 ? strength.colorClass : "bg-slate-200"}`}></div>
                  <div className={`h-1 flex-1 rounded-full transition-colors ${password.length > 0 && strength.score >= 2 ? strength.colorClass : "bg-slate-200"}`}></div>
                  <div className={`h-1 flex-1 rounded-full transition-colors ${password.length > 0 && strength.score >= 3 ? strength.colorClass : "bg-slate-200"}`}></div>
                </div>
                <p className="text-[10px] text-slate-400 mt-1.5 pl-1 whitespace-nowrap tracking-tight">
                  อย่างน้อย 8 ตัวอักษร • ตัวพิมพ์ใหญ่ 1 ตัว • อักขระพิเศษ 1 ตัว
                </p>
              </Field>

              <Field label="ยืนยันรหัสผ่าน" icon={<Lock className="w-4 h-4" />} required>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="กรอกรหัสผ่านอีกครั้ง"
                    minLength={8}
                    required
                    className={`${inputCls} pr-10`}
                  />
                  {confirmPassword.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-2 text-slate-400 hover:text-slate-600 transition"
                    >
                      {showConfirmPassword ? (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.542-7a10.025 10.025 0 012.132-3.611m3.13-2.567A9.958 9.958 0 0112 5c4.478 0 8.268 2.943 9.542 7a10.025 10.025 0 01-4.132 5.411M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3l18 18" />
                        </svg>
                      ) : (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      )}
                    </button>
                  )}
                </div>
                {!passwordsMatch && (
                  <p className="text-[10px] text-red-500 mt-1 pl-1">รหัสผ่านไม่ตรงกัน</p>
                )}
              </Field>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="ชื่อ" icon={<User className="w-4 h-4" />} required>
                <input
                  type="text"
                  value={firstname}
                  onChange={(e) => setFirstname(e.target.value)}
                  placeholder="เช่น สมชาย"
                  required
                  className={inputCls}
                />
              </Field>
              <Field label="นามสกุล" icon={<User className="w-4 h-4" />} required>
                <input
                  type="text"
                  value={lastname}
                  onChange={(e) => setLastname(e.target.value)}
                  placeholder="เช่น ใจดี"
                  required
                  className={inputCls}
                />
              </Field>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="เบอร์โทรศัพท์" icon={<Phone className="w-4 h-4" />} required>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="0XX-XXX-XXXX"
                  required
                  className={inputCls}
                />
              </Field>
              <Field label="ที่อยู่" icon={<MapPin className="w-4 h-4" />} optional>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="บ้านเลขที่, ถนน, อำเภอ"
                  className={inputCls}
                />
              </Field>
            </div>

            <label className="flex items-center gap-2 cursor-pointer select-none pt-2 pl-1">
              <input
                type="checkbox"
                checked={acceptTerms}
                onChange={(e) => setAcceptTerms(e.target.checked)}
                className="w-3.5 h-3.5 rounded border-slate-300 text-[#F46A2F] focus:ring-[#F46A2F]"
              />
              <span className="text-[11px] font-semibold text-slate-500 leading-normal">ฉันยอมรับข้อตกลงและเงื่อนไขการใช้บริการ</span>
            </label>

            {formError && (
              <p className="text-[13px] text-red-500 font-semibold text-center">{formError}</p>
            )}

            <div className="pt-2">
              <button
                type="submit"
                disabled={!isFormValid || isSubmitting}
                className={`w-full py-2.5 text-[13px] font-bold rounded-2xl shadow-lg transition-all duration-300 ${
                  isFormValid && !isSubmitting
                    ? "bg-[#F46A2F] text-white hover:bg-[#E05B22] hover:-translate-y-0.5 active:translate-y-0 shadow-[#F46A2F]/20 cursor-pointer"
                    : "bg-slate-300 text-white cursor-not-allowed"
                }`}
              >
                {isSubmitting ? "กำลังสมัครสมาชิก..." : "สมัครสมาชิก"}
              </button>
            </div>
          </form>

          <div className="text-center pt-2">
            <p className="text-[13px] text-slate-400 font-medium">
              มีบัญชีอยู่แล้ว?{" "}
              <Link href="/login" className="text-[#F46A2F] hover:text-[#F46A2F]/80 font-bold hover:underline transition">
                เข้าสู่ระบบ
              </Link>
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}

// ─── Helpers ────────────────────────────────────────────────────────────────

const inputCls =
  "w-full bg-slate-50 border border-slate-200 text-slate-800 text-[13px] font-medium rounded-2xl px-4 py-2 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-[#F46A2F] focus:border-[#F46A2F] transition duration-200";

function Field({
  label,
  icon,
  required,
  optional,
  children,
}: {
  label: string;
  icon: React.ReactNode;
  required?: boolean;
  optional?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label className="flex items-center text-[11px] font-bold text-slate-700 pl-1">
        <span className="text-[#F46A2F] mr-1.5">{icon}</span>
        {label}
        {required && <span className="text-[#F46A2F] ml-0.5">*</span>}
        {optional && (
          <span className="text-slate-400 font-normal ml-1">(ไม่บังคับ)</span>
        )}
      </label>
      <div className="relative">
        {children}
      </div>
    </div>
  );
}
