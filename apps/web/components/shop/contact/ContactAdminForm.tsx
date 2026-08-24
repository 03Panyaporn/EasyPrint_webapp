"use client";

import { useState, useEffect } from "react";
import { Send, CheckCircle2, AlertCircle, Loader2, Mail, Info, Pencil } from "lucide-react";
import { getMyShopProfile } from "@/lib/api/shops";
import { submitContactAdminMessage } from "@/lib/api/contactAdmin";
import { ApiError } from "@/lib/api/client";

export default function ContactAdminForm() {
  const [shopId, setShopId] = useState<string | null>(null);
  const [shopName, setShopName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("สอบถามบริการ / การใช้งาน");
  const [message, setMessage] = useState("");

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadShopProfile = async () => {
      try {
        const { shop } = await getMyShopProfile();
        if (shop) {
          setShopId(shop.id);
          setShopName(shop.name || "");
          setEmail(shop.email || "");
        }
      } catch (err) {
        console.error("Failed to load shop profile:", err);
      } finally {
        setIsLoading(false);
      }
    };

    loadShopProfile();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess(false);

    if (!shopId || !subject || !message) {
      setError("กรุณากรอกข้อมูลให้ครบถ้วน");
      return;
    }

    setIsSubmitting(true);

    try {
      await submitContactAdminMessage(shopId, { subject, message });
      setSuccess(true);
      setSubject("สอบถามบริการ / การใช้งาน");
      setMessage("");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "เกิดข้อผิดพลาดในการส่งข้อความ");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-slate-400">
        <Loader2 className="w-8 h-8 animate-spin mb-4" />
        <p>กำลังโหลดข้อมูล...</p>
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col h-full">
      <div className="bg-white rounded-2xl rounded-b-none shadow-sm border border-slate-200 overflow-hidden flex-1">
        <div className="bg-slate-50 border-b border-slate-200 px-6 py-5 flex items-center gap-3">
          <div className="w-10 h-10 bg-orange-100 text-orange-500 rounded-xl flex items-center justify-center shrink-0">
             <Mail className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-800">แบบฟอร์มติดต่อแอดมิน</h2>
            <p className="text-sm text-slate-500 mt-0.5">กรอกข้อมูลด้านล่างเพื่อให้ทีมงานช่วยเหลือคุณ</p>
          </div>
        </div>
        
        <div className="p-6 md:p-8">
          {success && (
            <div className="mb-6 bg-green-50 text-green-700 p-4 rounded-xl flex items-start gap-3 border border-green-200">
              <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">ส่งข้อความสำเร็จ!</p>
                <p className="text-sm text-green-600 mt-1">ทีมงานได้รับข้อความของคุณแล้ว และจะติดต่อกลับทางอีเมลโดยเร็วที่สุด</p>
              </div>
            </div>
          )}

          {error && (
            <div className="mb-6 bg-red-50 text-red-700 p-4 rounded-xl flex items-start gap-3 border border-red-200">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <p className="text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Shop Name */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  ชื่อร้านค้า <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  readOnly
                  value={shopName}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-500 text-sm cursor-not-allowed"
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  อีเมล
                </label>
                <input
                  type="email"
                  readOnly
                  value={email}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-500 text-sm cursor-not-allowed"
                  placeholder="-"
                />
              </div>
            </div>

            {/* Subject */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                เรื่องที่ติดต่อ <span className="text-red-500">*</span>
              </label>
              <select
                required
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 text-sm bg-white"
              >
                <option value="สอบถามบริการ / การใช้งาน">สอบถามบริการ / การใช้งาน</option>
                <option value="แจ้งปัญหาการใช้งาน">แจ้งปัญหาการใช้งาน (Bug/Error)</option>
                <option value="แจ้งเรื่องการเงิน">แจ้งปัญหาเรื่องการเงิน / การชำระเงิน</option>
                <option value="เสนอแนะ">ข้อเสนอแนะ / ติชม</option>
                <option value="อื่นๆ">อื่นๆ</option>
              </select>
            </div>

            {/* Message */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                รายละเอียดข้อความ <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                 <div className="absolute top-3 right-4 pointer-events-none">
                    <Pencil className="w-4 h-4 text-slate-300" />
                 </div>
                <textarea
                  required
                  maxLength={1000}
                  rows={5}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 text-sm resize-y"
                  placeholder="อธิบายรายละเอียดปัญหา หรือสิ่งที่ต้องการสอบถาม..."
                />
                <div className="absolute bottom-3 right-4 pointer-events-none">
                  <span className="text-xs font-medium text-slate-400">{message.length} / 1000</span>
                </div>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex items-center gap-2 px-8 py-3 bg-orange-500 text-white rounded-xl hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium text-sm shadow-sm shadow-orange-200"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    กำลังส่งข้อความ...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    ส่งข้อความ
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
      
      {/* Footer Banner */}
      <div className="bg-blue-50/50 border border-t-0 border-slate-200 rounded-b-2xl p-4 flex items-center gap-3">
         <Info className="w-5 h-5 text-blue-500 shrink-0" />
         <p className="text-xs md:text-sm text-slate-600 font-medium">โดยปกติทีมงานจะตอบกลับภายใน 1-24 ชั่วโมง (ในวันและเวลาทำการ)</p>
      </div>
    </div>
  );
}
