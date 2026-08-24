"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import {
  Printer,
  UserPlus,
  AlertTriangle,
  Clock,
  MessageSquare,
  Timer,
  Settings as SettingsIcon,
  Lock,
  Check,
  Bell,
  ShieldCheck,
  Building2,
  Sliders,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { getAdminSettings, updateAdminSettings } from "@/lib/api/admin";
import { uploadFile } from "@/lib/api/uploads";
import { ApiError } from "@/lib/api/client";
import type { AdminSettingsResponse, NotificationToggles } from "@easyprint/shared";

const DEFAULT_NOTIFICATIONS: NotificationToggles = {
  newShop: true,
  storageWarning90: true,
  shopPendingReview: true,
  newMessage: true,
  storageWarning80: true,
  systemError: true,
};

// backend เก็บ autoLogoutMinutes เป็นตัวเลข ส่วน UI เดิมใช้ dropdown เป็น label ภาษาไทย — แปลงไปมาที่นี่ที่เดียว
const AUTO_LOGOUT_OPTIONS: { label: string; minutes: number }[] = [
  { label: "15 นาที", minutes: 15 },
  { label: "30 นาที", minutes: 30 },
  { label: "1 ชั่วโมง", minutes: 60 },
  { label: "2 ชั่วโมง", minutes: 120 },
];
function minutesToLabel(minutes: number) {
  return AUTO_LOGOUT_OPTIONS.find((o) => o.minutes === minutes)?.label ?? `${minutes} นาที`;
}
function labelToMinutes(label: string) {
  return AUTO_LOGOUT_OPTIONS.find((o) => o.label === label)?.minutes ?? 30;
}

function applySettings(s: AdminSettingsResponse, set: {
  setSystemName: (v: string) => void;
  setContactEmail: (v: string) => void;
  setContactPhone: (v: string) => void;
  setMainWebsite: (v: string) => void;
  setLogoUrl: (v: string | null) => void;
  setNotifications: (v: NotificationToggles) => void;
  setMinPasswordLength: (v: number) => void;
  setRequireSpecialChar: (v: boolean) => void;
  setEnable2FA: (v: boolean) => void;
  setAutoLogoutTime: (v: string) => void;
}) {
  set.setSystemName(s.systemName);
  set.setContactEmail(s.contactEmail ?? "");
  set.setContactPhone(s.contactPhone ?? "");
  set.setMainWebsite(s.website ?? "");
  set.setLogoUrl(s.logoUrl);
  set.setNotifications(s.notificationSettings ?? DEFAULT_NOTIFICATIONS);
  set.setMinPasswordLength(s.minPasswordLength);
  set.setRequireSpecialChar(s.requireSpecialChar);
  set.setEnable2FA(s.enable2fa);
  set.setAutoLogoutTime(minutesToLabel(s.autoLogoutMinutes));
}

export default function AdminSettingsPage() {
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [systemName, setSystemName] = useState("EasyPrint");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [mainWebsite, setMainWebsite] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [notifications, setNotifications] = useState<NotificationToggles>(DEFAULT_NOTIFICATIONS);

  const [minPasswordLength, setMinPasswordLength] = useState(8);
  const [requireSpecialChar, setRequireSpecialChar] = useState(true);
  const [enable2FA, setEnable2FA] = useState(false);
  const [autoLogoutTime, setAutoLogoutTime] = useState("30 นาที");

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [showToast, setShowToast] = useState(false);

  const setters = {
    setSystemName,
    setContactEmail,
    setContactPhone,
    setMainWebsite,
    setLogoUrl,
    setNotifications,
    setMinPasswordLength,
    setRequireSpecialChar,
    setEnable2FA,
    setAutoLogoutTime,
  };

  const fetchSettings = useCallback(async () => {
    setLoading(true);
    setLoadError("");
    try {
      const { settings } = await getAdminSettings();
      applySettings(settings, setters);
    } catch (err) {
      setLoadError(err instanceof ApiError ? err.message : "โหลดการตั้งค่าไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const handleLogoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingLogo(true);
    setSaveError("");
    try {
      const result = await uploadFile(file, "system-logo");
      setLogoUrl(result.url);
    } catch (err) {
      setSaveError(err instanceof ApiError ? err.message : "อัปโหลดโลโก้ไม่สำเร็จ");
    } finally {
      setUploadingLogo(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const toggleNotification = (key: keyof NotificationToggles) => {
    setNotifications((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  // "ยกเลิก" = ทิ้งการแก้ไขที่ยังไม่บันทึก แล้วโหลดค่าล่าสุดจากเซิร์ฟเวอร์กลับมาใหม่ (ไม่ใช่ reset เป็นค่าเริ่มต้นโรงงาน)
  const handleReset = () => {
    setSaveError("");
    fetchSettings();
  };

  const handleSave = async () => {
    setIsSaving(true);
    setSaveError("");
    try {
      const { settings } = await updateAdminSettings({
        systemName,
        contactEmail,
        contactPhone,
        website: mainWebsite,
        logoUrl,
        notificationSettings: notifications,
        minPasswordLength,
        requireSpecialChar,
        enable2fa: enable2FA,
        autoLogoutMinutes: labelToMinutes(autoLogoutTime),
      });
      applySettings(settings, setters);
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3500);
    } catch (err) {
      setSaveError(err instanceof ApiError ? err.message : "บันทึกการตั้งค่าไม่สำเร็จ");
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3 text-slate-400">
        <Loader2 size={32} className="animate-spin text-orange-500" />
        <p className="text-sm">กำลังโหลดการตั้งค่าระบบ...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Toast Notification */}
      {showToast && (
        <div className="fixed top-5 right-5 z-50 flex items-center gap-2.5 px-5 py-3 rounded-2xl bg-orange-500 text-white shadow-xl shadow-orange-500/30 animate-fadeIn">
          <Check size={18} />
          <span>บันทึกการตั้งค่าระบบเรียบร้อยแล้ว</span>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-orange-500 text-white shadow-sm">
          <Sliders size={21} />
        </div>
        <div>
          <h1 className="text-xl  text-slate-800 md:text-2xl">ตั้งค่าระบบ</h1>
          <p className="mt-0.5 text-xs text-slate-400 md:text-sm">
            ตั้งค่าข้อมูลระบบ การแจ้งเตือน และความปลอดภัยของระบบ EasyPrint
          </p>
        </div>
      </div>

      {loadError && (
        <div className="flex items-center gap-3 p-4 rounded-2xl bg-red-50 text-red-600 border border-red-200 text-sm">
          <AlertCircle size={18} />
          <span>{loadError}</span>
        </div>
      )}
      {saveError && (
        <div className="flex items-center gap-3 p-4 rounded-2xl bg-red-50 text-red-600 border border-red-200 text-sm">
          <AlertCircle size={18} />
          <span>{saveError}</span>
        </div>
      )}

      <div className="bg-white rounded-3xl border border-slate-200/90 p-6 md:p-8 shadow-sm space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-orange-50 text-orange-500 flex items-center justify-center  shrink-0">
            <Building2 size={20} />
          </div>
          <div>
            <h2 className="text-base  text-slate-800">ข้อมูลระบบ</h2>
            <p className="text-xs text-slate-400">ข้อมูลทั่วไปของระบบ EasyPrint</p>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row items-start gap-8 pt-2">
          {/* Logo Upload Box */}
          <div className="space-y-2">
            <label className="text-xs  text-slate-600 block">โลโก้ระบบ</label>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleLogoChange}
              accept="image/*"
              className="hidden"
            />
            <div
              onClick={() => !uploadingLogo && fileInputRef.current?.click()}
              className="w-48 h-48 sm:w-52 sm:h-52 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/50 hover:bg-slate-50 hover:border-orange-400 transition-all flex flex-col items-center justify-center p-4 text-center cursor-pointer group relative overflow-hidden"
            >
              {uploadingLogo ? (
                <Loader2 size={32} className="animate-spin text-orange-500" />
              ) : logoUrl ? (
                <img
                  src={logoUrl}
                  alt="System Logo Preview"
                  className="w-full h-full object-contain p-2 rounded-xl"
                />
              ) : (
                <div className="flex flex-col items-center justify-center gap-2">
                  {/* Default EasyPrint Logo Design */}
                  <div className="w-16 h-16 rounded-2xl bg-orange-50 text-orange-500 flex items-center justify-center mb-1">
                    <Printer size={36} className="text-orange-500" />
                  </div>
                  <span className="text-orange-500  tracking-wider text-base">
                    EASYPRINT
                  </span>
                  <span className="text-[11px] text-slate-400 group-hover:text-slate-600 mt-1 transition">
                    คลิกเพื่อเปลี่ยนโลโก้
                  </span>
                </div>
              )}
            </div>
            <p className="text-[11px] text-slate-400">ขนาดที่แนะนำ 200 x 200px (PNG)</p>
          </div>

          {/* System Info Inputs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 flex-1 w-full">
            <div className="space-y-1.5">
              <label className="text-xs  text-slate-600">ชื่อระบบ</label>
              <input
                type="text"
                value={systemName}
                onChange={(e) => setSystemName(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-orange-500 focus:bg-white transition"
                placeholder="EasyPrint"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs  text-slate-600">อีเมลติดต่อ</label>
              <input
                type="email"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm  text-slate-800 focus:outline-none focus:border-orange-500 focus:bg-white transition"
                placeholder="support@easyprint.com"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs  text-slate-600">เบอร์โทรติดต่อ</label>
              <input
                type="text"
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-orange-500 focus:bg-white transition"
                placeholder="02-123-4567"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs  text-slate-600">เว็บไซต์หลัก</label>
              <input
                type="text"
                value={mainWebsite}
                onChange={(e) => setMainWebsite(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-orange-500 focus:bg-white transition"
                placeholder="https://easyprint.com"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200/90 p-6 md:p-8 shadow-sm space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-orange-50 text-orange-500 flex items-center justify-center shrink-0">
            <Bell size={20} />
          </div>
          <div>
            <h2 className="text-base text-slate-800">การแจ้งเตือน</h2>
            <p className="text-xs text-slate-400">เลือกการแจ้งเตือนที่ต้องการรับ</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
          {/* Notification Item 1 */}
          <div
            onClick={() => toggleNotification("newShop")}
            className="flex items-center gap-4 p-4 rounded-2xl border border-slate-100 hover:border-orange-200 bg-slate-50/40 hover:bg-orange-50/20 transition cursor-pointer"
          >
            <input
              type="checkbox"
              checked={notifications.newShop}
              onChange={() => { }}
              className="w-4 h-4 rounded text-orange-500 accent-orange-500 cursor-pointer shrink-0"
            />
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <UserPlus size={20} />
            </div>
            <div className="min-w-0">
              <p className="text-sm text-slate-800">มีร้านค้าสมัครใหม่</p>
              <p className="text-xs text-slate-400 truncate">แจ้งเตือนเมื่อมีร้านค้าสมัครเข้ามาใหม่</p>
            </div>
          </div>

          {/* Notification Item 2 */}
          <div
            onClick={() => toggleNotification("storageWarning90")}
            className="flex items-center gap-4 p-4 rounded-2xl border border-slate-100 hover:border-orange-200 bg-slate-50/40 hover:bg-orange-50/20 transition cursor-pointer"
          >
            <input
              type="checkbox"
              checked={notifications.storageWarning90}
              onChange={() => { }}
              className="w-4 h-4 rounded text-orange-500 accent-orange-500 cursor-pointer shrink-0"
            />
            <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
              <AlertTriangle size={20} />
            </div>
            <div className="min-w-0">
              <p className="text-sm text-slate-800">ร้านค้าใช้พื้นที่เกิน 90%</p>
              <p className="text-xs text-slate-400 truncate">แจ้งเตือนเมื่อร้านค้าใช้พื้นที่เกิน 90%</p>
            </div>
          </div>

          {/* Notification Item 3 */}
          <div
            onClick={() => toggleNotification("shopPendingReview")}
            className="flex items-center gap-4 p-4 rounded-2xl border border-slate-100 hover:border-orange-200 bg-slate-50/40 hover:bg-orange-50/20 transition cursor-pointer"
          >
            <input
              type="checkbox"
              checked={notifications.shopPendingReview}
              onChange={() => { }}
              className="w-4 h-4 rounded text-orange-500 accent-orange-500 cursor-pointer shrink-0"
            />
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <Clock size={20} />
            </div>
            <div className="min-w-0">
              <p className="text-sm text-slate-800">มีร้านค้ารอการตรวจสอบ</p>
              <p className="text-xs text-slate-400 truncate">แจ้งเตือนเมื่อมีร้านค้ารอการตรวจสอบ</p>
            </div>
          </div>

          {/* Notification Item 4 */}
          <div
            onClick={() => toggleNotification("newMessage")}
            className="flex items-center gap-4 p-4 rounded-2xl border border-slate-100 hover:border-orange-200 bg-slate-50/40 hover:bg-orange-50/20 transition cursor-pointer"
          >
            <input
              type="checkbox"
              checked={notifications.newMessage}
              onChange={() => { }}
              className="w-4 h-4 rounded text-orange-500 accent-orange-500 cursor-pointer shrink-0"
            />
            <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center shrink-0">
              <MessageSquare size={20} />
            </div>
            <div className="min-w-0">
              <p className="text-sm text-slate-800">มีข้อความติดต่อสอบถามใหม่</p>
              <p className="text-xs text-slate-400 truncate">แจ้งเตือนเมื่อมีข้อความติดต่อสอบถามใหม่</p>
            </div>
          </div>

          {/* Notification Item 5 */}
          <div
            onClick={() => toggleNotification("storageWarning80")}
            className="flex items-center gap-4 p-4 rounded-2xl border border-slate-100 hover:border-orange-200 bg-slate-50/40 hover:bg-orange-50/20 transition cursor-pointer"
          >
            <input
              type="checkbox"
              checked={notifications.storageWarning80}
              onChange={() => { }}
              className="w-4 h-4 rounded text-orange-500 accent-orange-500 cursor-pointer shrink-0"
            />
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
              <Timer size={20} />
            </div>
            <div className="min-w-0">
              <p className="text-sm text-slate-800">ร้านค้าใช้พื้นที่เกิน 80%</p>
              <p className="text-xs text-slate-400 truncate">แจ้งเตือนเมื่อร้านค้าใช้พื้นที่เกิน 80%</p>
            </div>
          </div>

          {/* Notification Item 6 */}
          <div
            onClick={() => toggleNotification("systemError")}
            className="flex items-center gap-4 p-4 rounded-2xl border border-slate-100 hover:border-orange-200 bg-slate-50/40 hover:bg-orange-50/20 transition cursor-pointer"
          >
            <input
              type="checkbox"
              checked={notifications.systemError}
              onChange={() => { }}
              className="w-4 h-4 rounded text-orange-500 accent-orange-500 cursor-pointer shrink-0"
            />
            <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center shrink-0">
              <SettingsIcon size={20} />
            </div>
            <div className="min-w-0">
              <p className="text-sm text-slate-800">ระบบเกิดข้อผิดพลาด</p>
              <p className="text-xs text-slate-400 truncate">แจ้งเตือนเมื่อระบบเกิดข้อผิดพลาด</p>
            </div>
          </div>
        </div>
      </div>


      <div className="bg-white rounded-3xl border border-slate-200/90 p-6 md:p-8 shadow-sm space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-orange-50 text-orange-500 flex items-center justify-center shrink-0">
            <ShieldCheck size={20} />
          </div>
          <div>
            <h2 className="text-base text-slate-800">ความปลอดภัย</h2>
            <p className="text-xs text-slate-400">ตั้งค่าความปลอดภัยสำหรับการใช้งานระบบ</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-1 items-start">
          {/* Min Password Length */}
          <div className="space-y-2">
            <label className="text-xs  text-slate-600 block">รหัสผ่านขั้นต่ำ</label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={6}
                max={32}
                value={minPasswordLength}
                onChange={(e) => setMinPasswordLength(Number(e.target.value))}
                className="w-24 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm  text-slate-800 focus:outline-none focus:border-orange-500 focus:bg-white transition text-center"
              />
              <span className="text-xs  text-slate-600">ตัวอักษร</span>
            </div>
            <p className="text-[11px] text-slate-400">บังคับใช้จริงตอนสมัคร/เปลี่ยนรหัสผ่าน (6-32 ตัวอักษร)</p>
          </div>

          {/* Require Special Char & 2FA Checkboxes */}
          <div className="space-y-4">
            <div
              onClick={() => setRequireSpecialChar(!requireSpecialChar)}
              className="flex items-start gap-3 cursor-pointer group"
            >
              <input
                type="checkbox"
                checked={requireSpecialChar}
                onChange={() => { }}
                className="w-4 h-4 mt-0.5 rounded text-orange-500 accent-orange-500 cursor-pointer shrink-0"
              />
              <div>
                <p className="text-xs text-slate-800">บังคับใช้อักษรพิเศษ</p>
                <p className="text-[11px] text-slate-400 mt-0.5">ต้องมีอักษรพิเศษอย่างน้อย 1 ตัว (ยังไม่บังคับใช้จริง — เก็บค่าไว้ก่อน)</p>
              </div>
            </div>

            <div
              onClick={() => setEnable2FA(!enable2FA)}
              className="flex items-start gap-3 cursor-pointer group"
            >
              <input
                type="checkbox"
                checked={enable2FA}
                onChange={() => { }}
                className="w-4 h-4 mt-0.5 rounded text-orange-500 accent-orange-500 cursor-pointer shrink-0"
              />
              <div>
                <p className="text-xs text-slate-800">
                  เปิดใช้งาน Two-Factor Authentication (2FA)
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5">เพิ่มความปลอดภัยในการเข้าสู่ระบบ (ยังไม่บังคับใช้จริง — เก็บค่าไว้ก่อน)</p>
              </div>
            </div>
          </div>

          {/* Auto Logout Selection */}
          <div className="space-y-2">
            <label className="text-xs text-slate-600 block">
              ออกจากระบบอัตโนมัติเมื่อไม่มีการใช้งาน
            </label>
            <select
              value={autoLogoutTime}
              onChange={(e) => setAutoLogoutTime(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-orange-500 focus:bg-white transition cursor-pointer"
            >
              {AUTO_LOGOUT_OPTIONS.map((o) => (
                <option key={o.label} value={o.label}>{o.label}</option>
              ))}
            </select>
            <p className="text-[11px] text-slate-400">
              ยังไม่บังคับใช้จริง — เก็บค่าไว้ก่อน
            </p>
          </div>
        </div>
      </div>


      <div className="flex items-center justify-end gap-3 pt-3">
        <button
          type="button"
          onClick={handleReset}
          className="px-6 py-2.5 rounded-xl bg-slate-100 text-slate-700 text-xs hover:bg-slate-200 active:scale-95 transition cursor-pointer"
        >
          ยกเลิก
        </button>

        <button
          type="button"
          disabled={isSaving}
          onClick={handleSave}
          className="px-6 py-2.5 rounded-xl bg-orange-500 text-white text-xs hover:bg-orange-600 active:scale-95 transition shadow-md shadow-orange-500/25 disabled:opacity-50 flex items-center gap-2 cursor-pointer"
        >
          <Lock size={15} />
          <span>{isSaving ? "กำลังบันทึก..." : "บันทึกการตั้งค่า"}</span>
        </button>
      </div>
    </div>
  );
}
