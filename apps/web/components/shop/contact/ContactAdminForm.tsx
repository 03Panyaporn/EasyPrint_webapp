"use client";

import { useState, useRef, useEffect } from "react";
import { Upload, X, Send, Image as ImageIcon, FileText, CheckCircle2, AlertCircle, Loader2, Store, Mail, Info, Pencil } from "lucide-react";
import { getMyShopProfile } from "@/lib/api/shops";

export default function ContactAdminForm() {
  const [shopName, setShopName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("สอบถามบริการ / การใช้งาน");
  const [message, setMessage] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const loadShopProfile = async () => {
      try {
        const { shop } = await getMyShopProfile();
        if (shop) {
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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      const validFiles = newFiles.filter(file => {
        return file.type.startsWith("image/") || file.type.includes("pdf") || file.type.includes("document");
      });

      setFiles(prev => [...prev, ...validFiles]);
      
      const newUrls = validFiles.map(file => {
        if (file.type.startsWith("image/")) {
          return URL.createObjectURL(file);
        }
        return "";
      });
      
      setPreviewUrls(prev => [...prev, ...newUrls]);
    }
  };

  const removeFile = (index: number) => {
    const newFiles = [...files];
    newFiles.splice(index, 1);
    setFiles(newFiles);
    
    const newUrls = [...previewUrls];
    if (newUrls[index]) {
      URL.revokeObjectURL(newUrls[index]);
    }
    newUrls.splice(index, 1);
    setPreviewUrls(newUrls);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess(false);
    
    if (!shopName || !email || !subject || !message) {
      setError("กรุณากรอกข้อมูลให้ครบถ้วน");
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      setSuccess(true);
      setSubject("สอบถามบริการ / การใช้งาน");
      setMessage("");
      setFiles([]);
      setPreviewUrls([]);
      
    } catch (err: any) {
      setError(err.message || "เกิดข้อผิดพลาดในการส่งข้อความ");
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
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
                  required
                  value={shopName}
                  onChange={(e) => setShopName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 text-sm"
                  placeholder="ชื่อร้านของคุณ"
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  อีเมล <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 text-sm"
                  placeholder="example@email.com"
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

            {/* File Uploads */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">แนบไฟล์รูปภาพหรือเอกสาร (ถ้ามี)</label>
              
              <div 
                className="border-2 border-dashed border-orange-200 bg-orange-50/30 rounded-xl p-8 text-center hover:bg-orange-50/60 transition-colors cursor-pointer"
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  type="file"
                  multiple
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  className="hidden"
                  accept="image/jpeg,image/png,application/pdf"
                />
                <div className="w-10 h-10 bg-orange-100 text-orange-500 rounded-full flex items-center justify-center mx-auto mb-3 shadow-sm">
                  <Upload className="w-5 h-5" />
                </div>
                <p className="text-sm font-semibold text-slate-800 mb-1">คลิกเพื่ออัปโหลดไฟล์</p>
                <p className="text-xs text-slate-500">รองรับไฟล์ JPG, PNG, PDF ขนาดไม่เกิน 5MB</p>
              </div>

              {/* Uploaded Files Preview */}
              {files.length > 0 && (
                <div className="mt-4 space-y-3">
                  {files.map((file, index) => (
                    <div key={index} className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-100 rounded-lg">
                      {previewUrls[index] ? (
                        <div className="w-12 h-12 rounded-md overflow-hidden bg-white shrink-0 border border-slate-200">
                          <img src={previewUrls[index]} alt="preview" className="w-full h-full object-cover" />
                        </div>
                      ) : (
                        <div className="w-12 h-12 rounded-md bg-white border border-slate-200 flex items-center justify-center text-slate-400 shrink-0">
                          {file.type.includes('pdf') ? <FileText className="w-6 h-6 text-red-400" /> : <ImageIcon className="w-6 h-6" />}
                        </div>
                      )}
                      
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-700 truncate">{file.name}</p>
                        <p className="text-xs text-slate-500">{formatFileSize(file.size)}</p>
                      </div>
                      
                      <button
                        type="button"
                        onClick={() => removeFile(index)}
                        className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
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
