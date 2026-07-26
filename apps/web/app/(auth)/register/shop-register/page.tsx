"use client";

import { useState } from "react";
import { Sarabun } from "next/font/google";
import Link from "next/link";
import {
  User,
  Mail,
  Lock,
  Store,
  Phone,
  MapPin,
  Link2,
  Tag,
  ChevronDown,
  Printer,
  ArrowRight,
  CheckCircle2,
  Upload,
  CircleUser,
} from "lucide-react";
import { on } from "events";
import { SHOP_TYPES } from "@easyprint/shared";
import { registerShop } from "@/lib/api/auth";
import { ApiError } from "@/lib/api/client";
import { uploadFile } from "@/lib/api/uploads";

export default function ShopRegisterPage() {
  const [form, setForm] = useState({
    firstname: "",
    lastname: "",
    email: "",
    password: "",
    confirmPassword: "",
    shopName: "",
    phone: "",
    houseNo: "",
    village: "",
    street: "",
    subdistrict: "",
    district: "",
    province: "",
    postcode: "",
    googleMapLink: "",
    shopType: "",
  });
  const [idCardFile, setIdCardFile] = useState<File | null>(null);
  const [shopPhotoFile, setShopPhotoFile] = useState<File | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStage, setSubmitStage] = useState<"idle" | "uploading" | "registering">("idle");
  const [formError, setFormError] = useState("");

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const passwordsMatch = !form.password || !form.confirmPassword || form.password === form.confirmPassword;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordsMatch || isSubmitting) return;
    if (!idCardFile || !shopPhotoFile) {
      setFormError("กรุณาแนบรูปบัตรประชาชนและรูปภาพร้านค้า");
      return;
    }

    setFormError("");
    setIsSubmitting(true);
    try {
      setSubmitStage("uploading");
      const [idCardResult, shopPhotoResult] = await Promise.all([
        uploadFile(idCardFile, "id-card"),
        uploadFile(shopPhotoFile, "shop-photo"),
      ]);

      setSubmitStage("registering");
      await registerShop({
        email: form.email,
        password: form.password,
        firstname: form.firstname,
        lastname: form.lastname,
        shopName: form.shopName,
        phone: form.phone,
        shopType: form.shopType as (typeof SHOP_TYPES)[number],
        houseNo: form.houseNo,
        village: form.village || undefined,
        street: form.street || undefined,
        subdistrict: form.subdistrict,
        district: form.district,
        province: form.province,
        postcode: form.postcode,
        googleMapLink: form.googleMapLink,
        idCardUrl: idCardResult.path,
        shopPhotoUrl: shopPhotoResult.url!,
      });
      setSubmitted(true);
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : "สมัครร้านค้าไม่สำเร็จ กรุณาลองใหม่อีกครั้ง");
    } finally {
      setIsSubmitting(false);
      setSubmitStage("idle");
    }
  };
  const [registerModalOpen, setRegisterModalOpen] = useState<boolean>(false);

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-teal-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-xl p-10 max-w-md w-full text-center space-y-5">
          <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-10 h-10 text-emerald-500" />
          </div>
          <h2 className="text-2xl font-black text-slate-800">สมัครสำเร็จ!</h2>
          <p className="text-slate-500 text-sm leading-relaxed">
            ข้อมูลร้านค้าของคุณถูกส่งแล้ว ทีมงาน EasyPrint จะตรวจสอบและยืนยันภายใน 1-2 วันทำการ
          </p>
          <Link
            href="/"
            className="inline-block bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-full px-8 py-3 text-sm transition"
          >
            กลับหน้าหลัก
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-teal-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur border-b border-slate-100 px-6 py-4 flex items-center justify-between sticky top-0 z-10">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-orange-500 to-amber-400 flex items-center justify-center text-white shadow-md group-hover:scale-105 transition">
            <Printer className="w-5 h-5" />
          </div>
          <span className="text-xl sm:text-2xl  tracking-tight font-black text-lg text-orange-500">
            EASY<span className="text-orange-500">PRINT</span>
          </span>
        </Link>
        <nav className="hidden md:flex items-center gap-8">
          <Link
            href="/"
            className="text-orange-500 font-bold border-b-2 border-orange-500 pb-0.5 text-base transition"
          >
            หน้าหลัก
          </Link>
        </nav>

        {/* Auth Buttons (Desktop) */}
        <div className="hidden sm:flex items-center gap-4">
          <Link
            href="/login"
            className="text-orange-500 font-semibold hover:text-orange-600 text-sm md:text-base px-2 py-1 transition"
          >
            เข้าสู่ระบบ
          </Link>
          <button
            onClick={() => setRegisterModalOpen(true)}
            className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-semibold rounded-full px-6 py-2 text-sm md:text-base shadow-md hover:shadow-lg transition transform hover:-translate-y-0.5"
          >
            สมัครสมาชิก
          </button>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-10 sm:py-14">
        {/* Title */}
        <div className="text-center mb-8 space-y-2">
          <div className="inline-flex items-center gap-2 bg-orange-100 text-orange-600 text-xs font-bold px-4 py-1.5 rounded-full mb-2">
            <Store className="w-3.5 h-3.5" />
            สำหรับเจ้าของร้านถ่ายเอกสาร
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-800 leading-tight">
            ลงทะเบียน<span className="text-orange-500">ร้านค้า</span>
          </h1>
          <p className="text-slate-500 text-sm">
            เพิ่มรายได้ รับออเดอร์ออนไลน์ ไม่มีค่าใช้จ่ายเริ่มต้น
          </p>
        </div>

        {/* Form Card */}
        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6 sm:p-8 space-y-5"
        >
          {/* Row: ชื่อ + นามสกุล */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="ชื่อเจ้าของร้าน" icon={<User className="w-4 h-4" />} required>
              <input
                type="text"
                name="firstname"
                value={form.firstname}
                onChange={handleChange}
                placeholder="เช่น สมชาย"
                required
                className={inputCls}
              />
            </Field>
            <Field label="นามสกุล" icon={<User className="w-4 h-4" />} required>
              <input
                type="text"
                name="lastname"
                value={form.lastname}
                onChange={handleChange}
                placeholder="เช่น ใจดี"
                required
                className={inputCls}
              />
            </Field>
          </div>

          {/* Row: อีเมล + รหัสผ่าน */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="อีเมล" icon={<Mail className="w-4 h-4" />} required>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                placeholder="example@email.com"
                required
                className={inputCls}
              />
            </Field>
            <Field label="รหัสผ่าน" icon={<Lock className="w-4 h-4" />} required>
              <input
                type="password"
                name="password"
                value={form.password}
                onChange={handleChange}
                placeholder="อย่างน้อย 8 ตัวอักษร"
                minLength={8}
                required
                className={inputCls}
              />
            </Field>
          </div>

          <Field label="ยืนยันรหัสผ่าน" icon={<Lock className="w-4 h-4" />} required>
            <input
              type="password"
              name="confirmPassword"
              value={form.confirmPassword}
              onChange={handleChange}
              placeholder="กรอกรหัสผ่านอีกครั้ง"
              minLength={8}
              required
              className={inputCls}
            />
            {!passwordsMatch && (
              <p className="text-xs text-red-500 mt-1">รหัสผ่านไม่ตรงกัน</p>
            )}
          </Field>

          {/* ชื่อร้านค้า */}
          <Field label="ชื่อร้านค้า" icon={<Store className="w-4 h-4" />} required>
            <input
              type="text"
              name="shopName"
              value={form.shopName}
              onChange={handleChange}
              placeholder="เช่น ร้านถ่ายเอกสารสุขใจ"
              required
              className={inputCls}
            />
          </Field>

          {/* Row: เบอร์โทร + ประเภทร้านค้า */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="เบอร์โทรศัพท์" icon={<Phone className="w-4 h-4" />} required>
              <input
                type="tel"
                name="phone"
                value={form.phone}
                onChange={handleChange}
                placeholder="0XX-XXX-XXXX"
                pattern="[0-9\-]{9,12}"
                required
                className={inputCls}
              />
            </Field>
            <Field label="ประเภทร้านค้า" icon={<Tag className="w-4 h-4" />} required>
              <div className="relative">
                <select
                  name="shopType"
                  value={form.shopType}
                  onChange={handleChange}
                  required
                  className={`${inputCls} appearance-none pr-9 cursor-pointer`}
                >
                  <option value="">เลือกประเภทร้านค้า</option>
                  {SHOP_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </Field>
          </div>

          {/* ที่อยู่ */}
          <div>
            <p className="flex items-center gap-1.5 text-xs font-bold text-slate-600 mb-3">
              <span className="text-orange-400"><MapPin className="w-4 h-4" /></span>
              ที่อยู่ร้านค้า <span className="text-orange-500">*</span>
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-slate-500">บ้านเลขที่</label>
                <input type="text" name="houseNo" value={form.houseNo} onChange={handleChange}
                  placeholder="เช่น 123/4" required className={inputCls} />
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-slate-500">หมู่</label>
                <input type="number" name="village" value={form.village} onChange={handleChange}
                  placeholder="เช่น 5" className={inputCls} />
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-slate-500">ถนน (ไม่มีใช้ -)</label>
                <input type="text" name="street" value={form.street} onChange={handleChange}
                  placeholder="เช่น พหลโยธิน" className={inputCls} />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-slate-500">ตำบล / แขวง</label>
                <input type="text" name="subdistrict" value={form.subdistrict} onChange={handleChange}
                  placeholder="ตำบล" required className={inputCls} />
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-slate-500">อำเภอ / เขต</label>
                <input type="text" name="district" value={form.district} onChange={handleChange}
                  placeholder="อำเภอ" required className={inputCls} />
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-slate-500">จังหวัด</label>
                <div className="relative">
                  <select name="province" value={form.province} onChange={handleChange}
                    required className={`${inputCls} appearance-none pr-9 cursor-pointer`}>
                    <option value="">-- เลือกจังหวัด --</option>
                    <option>กรุงเทพมหานคร</option><option>กระบี่</option><option>กาญจนบุรี</option>
                    <option>กาฬสินธุ์</option><option>กำแพงเพชร</option><option>ขอนแก่น</option>
                    <option>จันทบุรี</option><option>ฉะเชิงเทรา</option><option>ชัยนาท</option>
                    <option>ชัยภูมิ</option><option>ชุมพร</option><option>ชลบุรี</option>
                    <option>เชียงใหม่</option><option>เชียงราย</option><option>ตรัง</option>
                    <option>ตราด</option><option>ตาก</option><option>นครนายก</option>
                    <option>นครปฐม</option><option>นครพนม</option><option>นครราชสีมา</option>
                    <option>นครศรีธรรมราช</option><option>นครสวรรค์</option><option>นราธิวาส</option>
                    <option>น่าน</option><option>นนทบุรี</option><option>บึงกาฬ</option>
                    <option>บุรีรัมย์</option><option>ประจวบคีรีขันธ์</option><option>ปราจีนบุรี</option>
                    <option>ปทุมธานี</option><option>พระนครศรีอยุธยา</option><option>พังงา</option>
                    <option>พัทลุง</option><option>พิจิตร</option><option>พิษณุโลก</option>
                    <option>เพชรบุรี</option><option>เพชรบูรณ์</option><option>แพร่</option>
                    <option>พะเยา</option><option>ภูเก็ต</option><option>มหาสารคาม</option>
                    <option>มุกดาหาร</option><option>แม่ฮ่องสอน</option><option>ยโสธร</option>
                    <option>ยะลา</option><option>ร้อยเอ็ด</option><option>ระนอง</option>
                    <option>ระยอง</option><option>ราชบุรี</option><option>ลพบุรี</option>
                    <option>ลำปาง</option><option>ลำพูน</option><option>เลย</option>
                    <option>ศรีสะเกษ</option><option>สกลนคร</option><option>สงขลา</option>
                    <option>สตูล</option><option>สมุทรปราการ</option><option>สมุทรสงคราม</option>
                    <option>สมุทรสาคร</option><option>สระแก้ว</option><option>สระบุรี</option>
                    <option>สิงห์บุรี</option><option>สุโขทัย</option><option>สุพรรณบุรี</option>
                    <option>สุราษฎร์ธานี</option><option>สุรินทร์</option><option>หนองคาย</option>
                    <option>หนองบัวลำภู</option><option>อ่างทอง</option><option>อุดรธานี</option>
                    <option>อุทัยธานี</option><option>อุตรดิตถ์</option><option>อุบลราชธานี</option>
                    <option>อำนาจเจริญ</option>
                  </select>
                  <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-slate-500">รหัสไปรษณีย์</label>
                <input type="text" name="postcode" value={form.postcode} onChange={handleChange}
                  placeholder="รหัสไปรษณีย์" required className={inputCls} />
              </div>
            </div>
          </div>

          {/* Google Maps Link */}
          <Field label="ลิงก์ Google Maps" icon={<Link2 className="w-4 h-4" />} required>
            <input
              type="url"
              name="googleMapLink"
              value={form.googleMapLink}
              onChange={handleChange}
              placeholder="https://maps.google.com/..."
              required
              className={inputCls}
            />
          </Field>

          <Field label="รูปบัตรประชาชน" icon={<CircleUser className="w-4 h-4" />} required>
            <input
              type="file"
              name="idCardFile"
              accept="image/jpeg,image/png,image/webp"
              onChange={(e) => setIdCardFile(e.target.files?.[0] ?? null)}
              required
              className={inputCls}
            />
          </Field>
          <Field label="รูปภาพร้านค้า" icon={<Upload className="w-4 h-4" />} required>
            <input
              type="file"
              name="shopPhotoFile"
              accept="image/jpeg,image/png,image/webp"
              onChange={(e) => setShopPhotoFile(e.target.files?.[0] ?? null)}
              required
              className={inputCls}
            />
          </Field>

          {formError && (
            <p className="text-sm text-red-500 font-semibold text-center">{formError}</p>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 disabled:opacity-60 disabled:cursor-not-allowed text-white font-black rounded-2xl py-3.5 flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all text-base mt-2"
          >
            {submitStage === "uploading"
              ? "กำลังอัปโหลดไฟล์..."
              : submitStage === "registering"
                ? "กำลังสมัคร..."
                : "สมัครเป็นร้านค้า"}
          </button>

          <p className="text-center text-xs text-slate-400">
            มีบัญชีอยู่แล้ว?{" "}
            <Link href="/login" className="text-orange-500 font-bold hover:underline">
              เข้าสู่ระบบ
            </Link>
          </p>
        </form>
      </main>
    </div>

  );
}

// ─── Helpers ────────────────────────────────────────────────────────────────

const inputCls =
  "w-full bg-slate-50 border border-slate-200 text-slate-800 text-sm font-medium rounded-xl px-4 py-2.5 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent transition";

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
      <label className="flex items-center gap-1.5 text-xs font-bold text-slate-600">
        <span className="text-orange-400">{icon}</span>
        {label}
        {required && <span className="text-orange-500">*</span>}
        {optional && (
          <span className="text-slate-400 font-normal">(ใส่ทีหลังได้)</span>
        )}
      </label>
      {children}
    </div>
  );
}

