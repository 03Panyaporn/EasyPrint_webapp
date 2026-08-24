"use client";

import { useState, useEffect } from "react";
import { Send, CheckCircle2, AlertCircle, Loader2, Mail, Info, Pencil, UploadCloud } from "lucide-react";
import { getMyShopProfile } from "@/lib/api/shops";
import { submitContactAdminMessage } from "@/lib/api/contactAdmin";
import { uploadFile } from "@/lib/api/uploads";
import { ApiError } from "@/lib/api/client";
import { useToast } from "@/contexts/ToastContext";

export default function ContactAdminForm() {
  const { addToast } = useToast();
  const [shopId, setShopId] = useState<string | null>(null);
  const [shopName, setShopName] = useState("");
  const [subject, setSubject] = useState("สอบถามบริการ / การใช้งาน");
  const [message, setMessage] = useState("");
  const [files, setFiles] = useState<File[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadShopProfile = async () => {
      try {
        const { shop } = await getMyShopProfile();
        if (shop) {
          setShopId(shop.id);
          setShopName(shop.name || "");
        }
      } catch (err) {
        console.error("Failed to load shop profile:", err);
      } finally {
        setIsLoading(false);
      }
    };

    loadShopProfile();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selected = Array.from(e.target.files);
      if (selected.length > 5) {
        setError("แนบไฟล์ได้สูงสุด 5 ไฟล์เท่านั้น");
        return;
      }
      
      const invalidFiles = selected.filter(f => f.size > 20 * 1024 * 1024);
      if (invalidFiles.length > 0) {
        setError("ไฟล์ต้องมีขนาดไม่เกิน 20MB");
        return;
      }

      // Replace existing files when a new selection is made
      setFiles(selected.slice(0, 5));
    }
  };

  const removeFile = (index: number, e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!shopId || !subject || !message) {
      setError("กรุณากรอกข้อมูลให้ครบถ้วน");
      return;
    }

    setIsSubmitting(true);

    try {
      const uploadedUrls: string[] = [];
      if (files.length > 0) {
        for (const file of files) {
          const res = await uploadFile(file, "contact-admin-attachment");
          if (res.url) {
            uploadedUrls.push(res.url);
          } else {
            // Private bucket returns path
            uploadedUrls.push(res.path);
          }
        }
      }

      await submitContactAdminMessage(shopId, { 
        subject, 
        message,
        attachments: uploadedUrls.length > 0 ? uploadedUrls : undefined
      });
      
      addToast({
        title: "ส่งข้อความสำเร็จ!",
        message: "ทีมงานได้รับข้อความของคุณแล้ว และจะติดต่อกลับทางอีเมลโดยเร็วที่สุด",
        type: "success",
        duration: 5000,
      });

      setSubject("สอบถามบริการ / การใช้งาน");
      setMessage("");
      setFiles([]);
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

          {error && (
            <div className="mb-6 bg-red-50 text-red-700 p-4 rounded-xl flex items-start gap-3 border border-red-200">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <p className="text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
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
            
            {/* File Upload */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                แนบไฟล์ (ไม่บังคับ) <span className="text-slate-400 font-normal text-xs ml-1">สูงสุด 5 ไฟล์, ไม่เกิน 20MB/ไฟล์ (รูปภาพ, PDF)</span>
              </label>
              
              <div className="grid grid-cols-1 gap-4">
                {files.length > 0 && (
                  <label className="relative group cursor-pointer block">
                    <input
                      type="file"
                      multiple
                      onChange={handleFileChange}
                      className="absolute inset-0 w-0 h-0 opacity-0"
                      disabled={isSubmitting}
                    />
                    
                    <div className="grid grid-cols-1 gap-4">
                      {files.map((file, i) => {
                        const isImage = file.type.startsWith("image/");
                        if (isImage) {
                          return (
                            <div key={i} className="relative border border-slate-200 rounded-xl overflow-hidden bg-slate-100 flex items-center justify-center min-h-[200px] max-h-[400px]">
                              <img src={URL.createObjectURL(file)} alt={file.name} className="w-full h-full object-contain group-hover:opacity-80 transition-opacity" />
                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                                <span className="text-white font-medium bg-black/50 px-4 py-2 rounded-lg backdrop-blur-sm">คลิกเพื่อเปลี่ยนรูป</span>
                              </div>
                              <button
                                type="button"
                                onClick={(e) => removeFile(i, e)}
                                disabled={isSubmitting}
                                className="absolute top-2 right-2 w-8 h-8 flex items-center justify-center bg-white text-slate-500 hover:text-red-500 rounded-lg shadow-sm opacity-0 group-hover:opacity-100 transition-opacity z-10"
                              >
                                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                                  <path d="M10.5 3.5L3.5 10.5M3.5 3.5L10.5 10.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                              </button>
                              <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 to-transparent p-2 pt-6 pointer-events-none text-center">
                                <p className="text-[10px] font-medium text-white truncate">{file.name}</p>
                              </div>
                            </div>
                          );
                        }
                        
                        return (
                          <div key={i} className="relative flex flex-col items-center justify-center p-3 bg-white border border-slate-200 rounded-xl aspect-video text-center hover:bg-slate-50 transition-colors">
                            <div className="w-10 h-10 shrink-0 bg-slate-100 rounded-lg flex items-center justify-center text-xs font-bold text-slate-500 overflow-hidden mb-2">
                              {file.name.split('.').pop()?.toUpperCase() || 'FILE'}
                            </div>
                            <p className="text-xs font-medium text-slate-700 truncate w-full px-2">{file.name}</p>
                            <p className="text-[10px] text-slate-400 mt-1">คลิกเพื่อเปลี่ยนไฟล์</p>
                            <button
                              type="button"
                              onClick={(e) => removeFile(i, e)}
                              disabled={isSubmitting}
                              className="absolute top-2 right-2 w-8 h-8 flex items-center justify-center bg-white text-slate-500 hover:text-red-500 rounded-lg shadow-sm opacity-0 group-hover:opacity-100 transition-opacity border border-slate-100 z-10"
                            >
                              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M10.5 3.5L3.5 10.5M3.5 3.5L10.5 10.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                              </svg>
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </label>
                )}

                {files.length === 0 && (
                  <label className="relative border-2 border-dashed border-slate-200 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors flex items-center justify-center min-h-[120px] cursor-pointer group">
                    <input
                      type="file"
                      multiple
                      onChange={handleFileChange}
                      className="absolute inset-0 w-0 h-0 opacity-0"
                      disabled={isSubmitting}
                      title="อัปโหลดไฟล์"
                    />
                    <div className="flex flex-col items-center justify-center text-slate-400 group-hover:text-slate-500 transition-colors">
                      <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm mb-2 border border-slate-100">
                        <UploadCloud className="w-6 h-6" />
                      </div>
                    </div>
                  </label>
                )}
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
