"use client";

import { useEffect, useState, useRef } from "react";
import { getMyShopProfile, updateShopProfile, type MyShopProfile } from "@/lib/api/shops";
import { changeEmail, changePassword, deleteAccount } from "@/lib/api/auth";
import { uploadFile } from "@/lib/api/uploads";
import {
  CreditCard,
  Bell,
  Shield,
  Loader2,
  Save,
  Image as ImageIcon,
  AlertTriangle,
  Settings,
  ShoppingCart,
  Package,
  MessageSquare,
  Clock,
  Store,
  Megaphone,
  Users,
  ChevronRight,
  Lock,
  Check,
  Eye,
  EyeOff,
  Info,
  Upload,
} from "lucide-react";
import { useRouter } from "next/navigation";

type TabType = "payment" | "notifications" | "security";

export default function ShopSettings() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>("payment");
  const [shop, setShop] = useState<MyShopProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const { shop } = await getMyShopProfile();
      setShop(shop);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3 text-gray-400">
        <Loader2 size={24} className="animate-spin" />
        <p className="text-sm">กำลังโหลดข้อมูล...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Page Heading */}
      <div className="flex items-center justify-between gap-2.5">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-orange-500 text-white flex items-center justify-center shadow-md shadow-orange-200">
              <Settings size={20} />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
              ตั้งค่า
            </h1>
          </div>
          <p className="text-sm text-gray-500 mt-2 ml-[46px]">
            จัดการข้อมูลบัญชีธนาคาร การแจ้งเตือน และความปลอดภัยของร้านค้า
          </p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {/* Tabs */}
        <div className="flex border-b border-gray-100 overflow-x-auto hide-scrollbar">
          <button
            onClick={() => setActiveTab("payment")}
            className={`flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
              activeTab === "payment"
                ? "border-orange-500 text-orange-600"
                : "border-transparent text-slate-500 hover:text-slate-700 hover:border-gray-300"
            }`}
          >
            <CreditCard className="w-4 h-4" />
            ช่องทางการชำระเงิน
          </button>
          <button
            onClick={() => setActiveTab("notifications")}
            className={`flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
              activeTab === "notifications"
                ? "border-orange-500 text-orange-600"
                : "border-transparent text-slate-500 hover:text-slate-700 hover:border-gray-300"
            }`}
          >
            <Bell className="w-4 h-4" />
            การแจ้งเตือน
          </button>
          <button
            onClick={() => setActiveTab("security")}
            className={`flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
              activeTab === "security"
                ? "border-orange-500 text-orange-600"
                : "border-transparent text-slate-500 hover:text-slate-700 hover:border-gray-300"
            }`}
          >
            <Shield className="w-4 h-4" />
            ความปลอดภัย
          </button>
        </div>

        {/* Content */}
        <div className="p-6 md:p-8">
          {activeTab === "payment" && <PaymentSettingsTab shop={shop} onSaved={loadData} />}
          {activeTab === "notifications" && <NotificationSettingsTab shop={shop} onSaved={loadData} />}
          {activeTab === "security" && <SecuritySettingsTab shopName={shop?.name || ""} onDeleted={() => router.push("/login")} />}
        </div>
      </div>
    </div>
  );
}

// ---------------- Payment Settings Tab ----------------

function PaymentSettingsTab({ shop, onSaved }: { shop: MyShopProfile | null; onSaved: () => void }) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const [bankAccountName, setBankAccountName] = useState(shop?.bankAccountName || "");
  const [bankName, setBankName] = useState(shop?.bankName || "");
  const [bankAccountNumber, setBankAccountNumber] = useState(shop?.bankAccountNumber || "");
  const [promptpayNumber, setPromptpayNumber] = useState(shop?.promptpayNumber || "");
  const [promptpayQrUrl, setPromptpayQrUrl] = useState(shop?.promptpayQrUrl || "");

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingQr, setUploadingQr] = useState(false);

  const handleUploadQr = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("กรุณาอัปโหลดไฟล์รูปภาพเท่านั้น");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("ขนาดไฟล์ต้องไม่เกิน 5MB");
      return;
    }

    try {
      setError("");
      setUploadingQr(true);
      const res = await uploadFile(file, "shop-photo");
      setPromptpayQrUrl(res.url || "");
    } catch (err: any) {
      setError(err.message || "เกิดข้อผิดพลาดในการอัปโหลดรูปภาพ");
    } finally {
      setUploadingQr(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError("");
      setSuccess(false);

      await updateShopProfile({
        name: shop?.name || "",
        bankAccountName,
        bankName,
        bankAccountNumber,
        promptpayNumber,
        promptpayQrUrl,
      });

      setSuccess(true);
      onSaved();
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err.message || "เกิดข้อผิดพลาดในการบันทึก");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="w-full">
      <div className="bg-orange-50/50 rounded-2xl p-6 mb-8 flex items-center justify-between border border-orange-100">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-orange-100 text-orange-500 rounded-full flex items-center justify-center shrink-0">
             <CreditCard className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-slate-800 font-bold mb-1">ช่องทางการชำระเงิน</h3>
            <p className="text-sm text-slate-500">จัดการข้อมูลบัญชีธนาคารและพร้อมเพย์สำหรับรับชำระเงินจากลูกค้า</p>
          </div>
        </div>
        <div className="hidden md:flex items-center gap-3">
          <CreditCard className="w-8 h-8 text-orange-200" />
          <span className="text-2xl tracking-widest text-slate-300 mt-2">****</span>
          <div className="w-6 h-6 bg-green-100 text-green-500 rounded-full flex items-center justify-center">
            <Check className="w-4 h-4" />
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-xl text-sm border border-red-100 flex items-start gap-2">
          <AlertTriangle className="w-5 h-5 shrink-0" />
          <p>{error}</p>
        </div>
      )}

      {success && (
        <div className="mb-6 p-4 bg-green-50 text-green-600 rounded-xl text-sm border border-green-100 flex items-start gap-2">
          <p>บันทึกการเปลี่ยนแปลงเรียบร้อยแล้ว</p>
        </div>
      )}

      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">ชื่อบัญชีธนาคาร</label>
            <input
              type="text"
              value={bankAccountName}
              onChange={(e) => setBankAccountName(e.target.value)}
              className="w-full px-4 py-2.5 text-sm rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 placeholder:text-slate-400"
              placeholder="นาย สมใจ รักดี"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">ชื่อธนาคาร</label>
            <input
              type="text"
              value={bankName}
              onChange={(e) => setBankName(e.target.value)}
              className="w-full px-4 py-2.5 text-sm rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 placeholder:text-slate-400"
              placeholder="กสิกรไทย"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">เลขที่บัญชี</label>
          <input
            type="text"
            value={bankAccountNumber}
            onChange={(e) => setBankAccountNumber(e.target.value)}
            className="w-full px-4 py-2.5 text-sm rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 placeholder:text-slate-400"
            placeholder="012-3-45678-9"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">หมายเลขพร้อมเพย์</label>
          <input
            type="text"
            value={promptpayNumber}
            onChange={(e) => setPromptpayNumber(e.target.value)}
            className="w-full px-4 py-2.5 text-sm rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 placeholder:text-slate-400"
            placeholder="0XX-XXX-XXXX"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">อัปโหลด QR Code (PromptPay)</label>
          <div className="w-full">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleUploadQr}
              accept="image/*"
              className="hidden"
            />
            {promptpayQrUrl ? (
              <div
                className="relative w-full rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50 flex flex-col items-center justify-center p-8 hover:bg-gray-100 transition-colors cursor-pointer group"
                onClick={() => fileInputRef.current?.click()}
              >
                <img
                  src={promptpayQrUrl}
                  alt="PromptPay QR"
                  className="w-48 h-48 object-contain rounded-xl bg-white shadow-sm mb-4"
                />
                <p className="text-sm font-medium text-slate-700 group-hover:text-orange-500 transition-colors">
                  คลิกเพื่อเปลี่ยน QR Code
                </p>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setPromptpayQrUrl("");
                  }}
                  className="absolute top-4 right-4 px-3 py-1.5 bg-white border border-gray-200 text-red-600 text-xs font-medium rounded-lg shadow-sm hover:bg-red-50"
                >
                  ลบรูปภาพ
                </button>
              </div>
            ) : (
              <div
                className="w-full rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50/50 flex flex-col items-center justify-center p-10 hover:bg-gray-50 hover:border-gray-300 transition-all cursor-pointer group"
                onClick={() => fileInputRef.current?.click()}
              >
                <div className="w-12 h-12 rounded-full bg-orange-100 text-orange-500 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  {uploadingQr ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Upload className="w-5 h-5" />
                  )}
                </div>
                <p className="text-sm font-medium text-slate-700 mb-1">
                  {uploadingQr ? "กำลังอัปโหลด..." : "คลิกเพื่ออัปโหลด QR Code"}
                </p>
                <p className="text-xs text-slate-500">รองรับไฟล์ JPG, PNG ขนาดไม่เกิน 5MB</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="mt-8 pt-6 border-t border-gray-100 flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-6 py-2.5 bg-orange-500 text-white font-medium rounded-xl hover:bg-orange-600 transition-colors disabled:opacity-50"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          บันทึกข้อมูล
        </button>
      </div>
    </div>
  );
}

// ---------------- Notification Settings Tab ----------------

function NotificationSettingsTab({ shop, onSaved }: { shop: MyShopProfile | null; onSaved: () => void }) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const defaultSettings = {
    newOrder: true,
    orderUpdate: false,
    chatAndRequests: false,
    closingWarning: false,
    autoShopStatus: false,
    adminUpdates: false,
  };

  const [settings, setSettings] = useState(
    shop?.notificationSettings ? { ...defaultSettings, ...shop.notificationSettings } : defaultSettings
  );

  const handleToggle = (key: keyof typeof defaultSettings) => {
    setSettings((prev: any) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError("");
      setSuccess(false);

      await updateShopProfile({
        name: shop?.name || "",
        notificationSettings: settings,
      });

      setSuccess(true);
      onSaved();
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err.message || "เกิดข้อผิดพลาดในการบันทึก");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="w-full">
      <div className="bg-orange-50/50 rounded-2xl p-6 mb-8 flex items-center justify-between border border-orange-100">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-orange-100 text-orange-500 rounded-full flex items-center justify-center shrink-0">
             <Bell className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-slate-800 font-bold mb-1">การแจ้งเตือน</h3>
            <p className="text-sm text-slate-500">เลือกรับการแจ้งเตือนสำหรับรายการต่างๆ ในร้านค้าของคุณ</p>
          </div>
        </div>
        <div className="hidden md:flex items-center gap-3">
          <Bell className="w-8 h-8 text-orange-200" />
          <span className="text-2xl tracking-widest text-slate-300 mt-2">****</span>
          <div className="w-6 h-6 bg-green-100 text-green-500 rounded-full flex items-center justify-center">
            <Check className="w-4 h-4" />
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-xl text-sm border border-red-100">
          <p>{error}</p>
        </div>
      )}

      {success && (
        <div className="mb-6 p-4 bg-green-50 text-green-600 rounded-xl text-sm border border-green-100">
          <p>บันทึกการเปลี่ยนแปลงเรียบร้อยแล้ว</p>
        </div>
      )}

      <div className="space-y-12">
        {/* Category: การจัดการคำสั่งซื้อ */}
        <div>
          <h3 className="text-sm font-bold text-slate-800 mb-4">หมวดหมู่: การจัดการคำสั่งซื้อ</h3>
          <div className="bg-white border border-gray-100 shadow-sm rounded-2xl overflow-hidden">
            <NotificationToggle
              title="คำสั่งซื้อใหม่"
              description="รับการแจ้งเตือนเมื่อลูกค้าสั่งสินค้า หรือออเดอร์ใหม่เข้ามา"
              checked={settings.newOrder}
              onChange={() => handleToggle("newOrder")}
              icon={ShoppingCart}
              iconColor="text-pink-500"
              iconBg="bg-pink-50"
              hasBorder={true}
            />
            <NotificationToggle
              title="อัปเดตสถานะคำสั่งซื้อ"
              description="รับการแจ้งเตือนเมื่อลูกค้ายกเลิกออเดอร์ หรือร้านค้าอัปเดตสถานะคำสั่งซื้อ"
              checked={settings.orderUpdate}
              onChange={() => handleToggle("orderUpdate")}
              icon={Package}
              iconColor="text-pink-500"
              iconBg="bg-pink-50"
              hasBorder={false}
            />
          </div>
        </div>

        {/* Category: การติดต่อกับลูกค้า */}
        <div>
          <h3 className="text-sm font-bold text-slate-800 mb-4">หมวดหมู่: การติดต่อกับลูกค้า</h3>
          <div className="bg-white border border-gray-100 shadow-sm rounded-2xl overflow-hidden">
            <NotificationToggle
              title="ข้อความแชทใหม่และคำร้องขอ"
              description="รับการแจ้งเตือนเมื่อลูกค้าส่งข้อความแชท หรือมีคำร้องขอคืนเงิน"
              checked={settings.chatAndRequests}
              onChange={() => handleToggle("chatAndRequests")}
              icon={MessageSquare}
              iconColor="text-purple-500"
              iconBg="bg-purple-50"
              hasBorder={false}
            />
          </div>
        </div>

        {/* Category: สถานะร้านค้าและเวลาทำการ */}
        <div>
          <h3 className="text-sm font-bold text-slate-800 mb-4">หมวดหมู่: สถานะร้านค้าและเวลาทำการ</h3>
          <div className="bg-white border border-gray-100 shadow-sm rounded-2xl overflow-hidden">
            <NotificationToggle
              title="เตือนก่อนปิดร้านและออเดอร์ค้าง"
              description="แจ้งเตือนเมื่อใกล้ถึงเวลาปิดร้านแต่ยังมีออเดอร์ค้างอยู่"
              checked={settings.closingWarning}
              onChange={() => handleToggle("closingWarning")}
              icon={Clock}
              iconColor="text-blue-500"
              iconBg="bg-blue-50"
              hasBorder={true}
            />
            <NotificationToggle
              title="การเปิด-ปิดร้านอัตโนมัติ"
              description="รับการแจ้งเตือนเมื่อระบบทำการเปิด/ปิดร้านตามเวลาทำการ หรือพื้นที่ช่วงพักเบรกชั่วคราว"
              checked={settings.autoShopStatus}
              onChange={() => handleToggle("autoShopStatus")}
              icon={Store}
              iconColor="text-blue-500"
              iconBg="bg-blue-50"
              hasBorder={false}
            />
          </div>
        </div>

        {/* Category: ข่าวสารและระบบ */}
        <div>
          <h3 className="text-sm font-bold text-slate-800 mb-4">หมวดหมู่: ข่าวสารและระบบ</h3>
          <div className="bg-white border border-gray-100 shadow-sm rounded-2xl overflow-hidden">
            <NotificationToggle
              title="อัปเดตจากผู้ดูแลระบบ"
              description="รับการแจ้งเตือนเมื่อคำร้องขอได้รับการอนุมัติ หรือมีนโยบาย/ประกาศใหม่จากแอดมิน"
              checked={settings.adminUpdates}
              onChange={() => handleToggle("adminUpdates")}
              icon={Megaphone}
              iconColor="text-green-500"
              iconBg="bg-green-50"
              hasBorder={false}
            />
          </div>
        </div>
      </div>

      <div className="mt-8 pt-6 border-t border-gray-100 flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-6 py-2.5 bg-orange-500 text-white font-medium rounded-xl hover:bg-orange-600 transition-colors disabled:opacity-50"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          บันทึกข้อมูล
        </button>
      </div>
    </div>
  );
}

function NotificationToggle({
  title,
  description,
  checked,
  onChange,
  icon: Icon,
  iconColor = "text-slate-500",
  iconBg = "bg-gray-50",
  hasBorder = true,
}: {
  title: string;
  description: string;
  checked: boolean;
  onChange: () => void;
  icon?: React.ElementType;
  iconColor?: string;
  iconBg?: string;
  hasBorder?: boolean;
}) {
  return (
    <div className={`flex items-center justify-between p-5 hover:bg-gray-50/50 transition-colors ${hasBorder ? 'border-b border-gray-100' : ''}`}>
      <div className="flex items-center gap-4">
        {Icon && (
          <div className={`w-11 h-11 shrink-0 rounded-xl flex items-center justify-center ${iconBg} ${iconColor}`}>
            <Icon className="w-5 h-5" />
          </div>
        )}
        <div>
          <h3 className="text-sm font-semibold text-slate-800">{title}</h3>
          <p className="text-sm text-slate-500 mt-0.5">{description}</p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onChange}
          className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
            checked ? "bg-green-500" : "bg-gray-200"
          }`}
          role="switch"
          aria-checked={checked}
        >
          <span
            aria-hidden="true"
            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
              checked ? "translate-x-5" : "translate-x-0"
            }`}
          />
        </button>
      </div>
    </div>
  );
}

// ---------------- Security Settings Tab ----------------

function SecuritySettingsTab({ shopName, onDeleted }: { shopName: string; onDeleted: () => void }) {
  const [emailSaving, setEmailSaving] = useState(false);
  const [pwdSaving, setPwdSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [newEmail, setNewEmail] = useState("");
  const [emailCurrentPwd, setEmailCurrentPwd] = useState("");

  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletePwd, setDeletePwd] = useState("");
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);

  const handleChangeEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setEmailSaving(true);
      setError("");
      setSuccess("");
      await changeEmail({ newEmail, currentPassword: emailCurrentPwd });
      setSuccess("เปลี่ยนอีเมลสำเร็จ");
      setNewEmail("");
      setEmailCurrentPwd("");
    } catch (err: any) {
      setError(err.message || "เกิดข้อผิดพลาดในการเปลี่ยนอีเมล");
    } finally {
      setEmailSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setError("รหัสผ่านใหม่และการยืนยันรหัสผ่านไม่ตรงกัน");
      return;
    }
    try {
      setPwdSaving(true);
      setError("");
      setSuccess("");
      await changePassword({ currentPassword: oldPassword, newPassword });
      setSuccess("เปลี่ยนรหัสผ่านสำเร็จ");
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      setError(err.message || "เกิดข้อผิดพลาดในการเปลี่ยนรหัสผ่าน");
    } finally {
      setPwdSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    try {
      setDeleting(true);
      setError("");
      await deleteAccount({ currentPassword: deletePwd });
      setIsDeleteModalOpen(false);
      onDeleted();
    } catch (err: any) {
      setError(err.message || "รหัสผ่านไม่ถูกต้อง หรือเกิดข้อผิดพลาดในการลบบัญชี");
      setDeleting(false);
    }
  };

  return (
    <div className="w-full">
      <div className="bg-orange-50/50 rounded-2xl p-6 mb-8 flex items-center justify-between border border-orange-100">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-orange-100 text-orange-500 rounded-full flex items-center justify-center shrink-0">
             <Shield className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-slate-800 font-bold mb-1">ความปลอดภัยของบัญชี</h3>
            <p className="text-sm text-slate-500">การตั้งรหัสผ่านที่แข็งแรง จะช่วยปกป้องบัญชีของคุณให้ปลอดภัยยิ่งขึ้น</p>
          </div>
        </div>
        <div className="hidden md:flex items-center gap-3">
          <Lock className="w-8 h-8 text-orange-200" />
          <span className="text-2xl tracking-widest text-slate-300 mt-2">****</span>
          <div className="w-6 h-6 bg-green-100 text-green-500 rounded-full flex items-center justify-center">
            <Check className="w-4 h-4" />
          </div>
        </div>
      </div>

      {error && !isDeleteModalOpen && (
        <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-xl text-sm border border-red-100 flex items-start gap-2">
          <AlertTriangle className="w-5 h-5 shrink-0" />
          <p>{error}</p>
        </div>
      )}

      {success && !isDeleteModalOpen && (
        <div className="mb-6 p-4 bg-green-50 text-green-600 rounded-xl text-sm border border-green-100 flex items-start gap-2">
          <Check className="w-5 h-5 shrink-0" />
          <p>{success}</p>
        </div>
      )}

      {/* Change Email Section (Styled as Card 1) */}
      <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden mb-6">
        <div className="p-6">
          <div className="flex items-start gap-4 mb-6">
            <div className="mt-1 w-5 h-5 text-orange-500">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800">เปลี่ยนอีเมลปัจจุบัน</h3>
              <p className="text-sm text-slate-500 mt-0.5">อัปเดตอีเมลที่ใช้งานอยู่ในปัจจุบัน</p>
            </div>
          </div>
          <form onSubmit={handleChangeEmail}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">อีเมลใหม่</label>
                <div className="relative">
                  <input
                    type="email"
                    required
                    autoComplete="off"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder="กรอกอีเมลใหม่"
                    className="w-full px-4 py-2.5 text-sm rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 placeholder:text-slate-400"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">ยืนยันรหัสผ่านปัจจุบัน</label>
                <div className="relative">
                  <input
                    type="password"
                    required
                    autoComplete="new-password"
                    value={emailCurrentPwd}
                    onChange={(e) => setEmailCurrentPwd(e.target.value)}
                    placeholder="กรอกรหัสผ่านปัจจุบันเพื่อยืนยัน"
                    className="w-full px-4 py-2.5 text-sm rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 placeholder:text-slate-400"
                  />
                  <Eye className="absolute right-4 top-3 w-4 h-4 text-slate-400 cursor-pointer hover:text-slate-600" />
                </div>
              </div>
            </div>
            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={emailSaving || !newEmail || !emailCurrentPwd}
                className="px-6 py-2.5 bg-orange-500 text-white text-sm font-medium rounded-xl hover:bg-orange-600 transition-colors disabled:opacity-50"
              >
                {emailSaving ? "กำลังบันทึก..." : "บันทึกการเปลี่ยนอีเมล"}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Change Password Section (Styled as Card 2) */}
      <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden mb-6">
        <div className="p-6">
          <div className="flex items-start gap-4 mb-6">
            <div className="mt-1 w-5 h-5 text-orange-500">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800">เปลี่ยนรหัสผ่านใหม่</h3>
              <p className="text-sm text-slate-500 mt-0.5">ตั้งรหัสผ่านใหม่สำหรับเข้าสู่ระบบ</p>
            </div>
          </div>
          <form onSubmit={handleChangePassword}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">รหัสผ่านปัจจุบัน</label>
                <div className="relative">
                  <input
                    type="password"
                    required
                    autoComplete="new-password"
                    value={oldPassword}
                    onChange={(e) => setOldPassword(e.target.value)}
                    placeholder="กรอกรหัสผ่านปัจจุบัน"
                    className="w-full px-4 py-2.5 text-sm rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 placeholder:text-slate-400"
                  />
                  <Eye className="absolute right-4 top-3 w-4 h-4 text-slate-400 cursor-pointer hover:text-slate-600" />
                </div>
              </div>
              <div className="hidden md:block"></div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">รหัสผ่านใหม่</label>
                <div className="relative">
                  <input
                    type="password"
                    required
                    minLength={8}
                    autoComplete="new-password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="กรอกรหัสผ่านใหม่"
                    className="w-full px-4 py-2.5 text-sm rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 placeholder:text-slate-400"
                  />
                  <Eye className="absolute right-4 top-3 w-4 h-4 text-slate-400 cursor-pointer hover:text-slate-600" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">ยืนยันรหัสผ่านใหม่</label>
                <div className="relative">
                  <input
                    type="password"
                    required
                    minLength={8}
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="กรอกรหัสผ่านใหม่อีกครั้ง"
                    className="w-full px-4 py-2.5 text-sm rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 placeholder:text-slate-400"
                  />
                  <Eye className="absolute right-4 top-3 w-4 h-4 text-slate-400 cursor-pointer hover:text-slate-600" />
                </div>
              </div>
            </div>
            
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mt-6">
              <div className="mb-4 md:mb-0">
                 <div className="flex items-center gap-2 mb-1">
                   <h4 className="text-xs font-semibold text-slate-700">ความปลอดภัยของรหัสผ่าน</h4>
                   <div className="flex gap-1">
                      <div className={`w-8 h-1 rounded-full ${newPassword.length >= 8 ? 'bg-orange-400' : 'bg-gray-200'}`}></div>
                      <div className={`w-8 h-1 rounded-full ${newPassword.match(/[A-Z]/) && newPassword.match(/[0-9]/) ? 'bg-orange-400' : 'bg-gray-200'}`}></div>
                      <div className={`w-8 h-1 rounded-full ${newPassword.match(/[^A-Za-z0-9]/) ? 'bg-orange-400' : 'bg-gray-200'}`}></div>
                   </div>
                   <div className="flex items-center gap-1 text-slate-400 text-xs">
                     <Shield className="w-3 h-3" />
                     <span>{newPassword.length >= 8 ? 'แข็งแรง' : 'อ่อน'}</span>
                   </div>
                 </div>
                 <p className="text-xs text-slate-400">อย่างน้อย 8 ตัวอักษร ประกอบด้วยตัวอักษรภาษาอังกฤษพิมพ์ใหญ่ พิมพ์เล็ก ตัวเลข และสัญลักษณ์</p>
              </div>
              <button
                type="submit"
                disabled={pwdSaving || !oldPassword || !newPassword || !confirmPassword}
                className="px-6 py-2.5 bg-orange-500 text-white text-sm font-medium rounded-xl hover:bg-orange-600 transition-colors disabled:opacity-50 whitespace-nowrap"
              >
                {pwdSaving ? "กำลังบันทึก..." : "อัปเดตรหัสผ่าน"}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Delete Account Section */}
      <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden mb-6">
        <div className="p-6">
          <div className="flex items-start gap-4 mb-4">
            <div className="mt-1 w-5 h-5 text-red-500">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-red-500">ลบบัญชีร้านค้า</h3>
              <p className="text-sm text-slate-500 mt-0.5">เมื่อคุณลบบัญชีแล้ว ข้อมูลทั้งหมดของร้านค้า ประวัติออเดอร์ และรายการเชื่อมต่อ จะถูกลบอย่างถาวร ไม่สามารถกู้คืนกลับมาได้อีก</p>
            </div>
          </div>
          <button
            onClick={() => {
              setError("");
              setIsDeleteModalOpen(true);
            }}
            className="px-6 py-2.5 bg-red-50 text-red-600 text-sm font-medium rounded-xl hover:bg-red-100 transition-colors mt-2"
          >
            ลบบัญชีถาวร
          </button>
        </div>
      </div>

      {/* Security Tips Footer */}
      <div className="bg-gray-50/50 border border-gray-100 rounded-2xl p-4 flex flex-col md:flex-row items-start md:items-center gap-4 md:gap-6 mt-8">
        <div className="flex items-center gap-2 shrink-0">
          <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center">
             <Info className="w-4 h-4" />
          </div>
          <span className="text-sm font-bold text-slate-700">เคล็ดลับเพื่อความปลอดภัย</span>
        </div>
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-slate-500">
           <div className="flex items-center gap-1"><Check className="w-3 h-3 text-green-500" /> ไม่ใช้รหัสผ่านซ้ำกับเว็บไซต์อื่น</div>
           <div className="flex items-center gap-1"><Check className="w-3 h-3 text-green-500" /> เปลี่ยนรหัสผ่านอย่างสม่ำเสมอ</div>
           <div className="flex items-center gap-1"><Check className="w-3 h-3 text-green-500" /> ไม่แชร์รหัสผ่านกับผู้อื่น</div>
           <div className="flex items-center gap-1"><Check className="w-3 h-3 text-green-500" /> ออกจากระบบทุกครั้งเมื่อใช้งานบนอุปกรณ์สาธารณะ</div>
        </div>
      </div>

      {/* Delete Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6">
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="text-xl font-bold text-center text-slate-800 mb-2">ยืนยันการลบบัญชี?</h3>
              <p className="text-sm text-center text-slate-500 mb-6">
                ข้อมูลร้านค้า ประวัติออเดอร์ และรายได้จะถูกลบทิ้งทั้งหมด <b>ไม่สามารถกู้คืนกลับมาได้อีก</b>
              </p>

              {error && (
                <div className="mb-4 p-3 bg-red-50 text-red-600 text-xs rounded-lg border border-red-100">
                  {error}
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">รหัสผ่านปัจจุบัน</label>
                  <input
                    type="password"
                    autoComplete="new-password"
                    value={deletePwd}
                    onChange={(e) => setDeletePwd(e.target.value)}
                    className="w-full px-4 py-2 text-sm rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 placeholder:text-slate-400"
                    placeholder="กรอกรหัสผ่านเพื่อยืนยันตัวตน"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    พิมพ์ <b>DELETE</b> หรือชื่อร้านเพื่อยืนยัน
                  </label>
                  <input
                    type="text"
                    value={deleteConfirmText}
                    onChange={(e) => setDeleteConfirmText(e.target.value)}
                    className="w-full px-4 py-2 text-sm rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 placeholder:text-slate-400"
                    placeholder="DELETE"
                  />
                </div>
              </div>
            </div>

            <div className="p-4 bg-gray-50 flex gap-3 justify-end border-t border-gray-100">
              <button
                onClick={() => setIsDeleteModalOpen(false)}
                disabled={deleting}
                className="px-4 py-2 text-slate-600 font-medium hover:bg-gray-200 rounded-lg transition-colors"
              >
                ยกเลิก
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={deleting || !deletePwd || (deleteConfirmText !== "DELETE" && deleteConfirmText !== shopName)}
                className="px-4 py-2 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {deleting ? "กำลังลบ..." : "ยืนยันการลบ"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
