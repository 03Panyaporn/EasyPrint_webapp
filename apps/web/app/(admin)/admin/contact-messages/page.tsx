"use client";

import { useEffect, useState } from "react";
import { 
  Search, 
  Eye, 
  CornerUpLeft, 
  Paperclip, 
  Trash2, 
  Info,
  X,
  AlertTriangle,
  Download,
  Loader2,
  FileText,
  ImageIcon
} from "lucide-react";
import type { ContactAdminMessageItem } from "@easyprint/shared";
import { 
  getAllContactAdminMessages, 
  replyContactAdminMessage,
  deleteContactAdminMessage
} from "@/lib/api/contactAdmin";
import { uploadFile } from "@/lib/api/uploads";
import { ApiError } from "@/lib/api/client";

function formatThaiDateTime(iso: string): string {
  const date = new Date(iso);
  const day = date.getDate();
  const month = date.toLocaleString("th-TH", { month: "short" });
  const year = date.getFullYear() + 543;
  const time = date.toLocaleString("th-TH", { hour: "2-digit", minute: "2-digit" });
  return `${day} ${month} ${year}\n${time}`;
}

export default function AdminContactMessagesPage() {
  const [messages, setMessages] = useState<ContactAdminMessageItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // Modal States
  const [viewMessage, setViewMessage] = useState<ContactAdminMessageItem | null>(null);
  const [replyMessage, setReplyMessage] = useState<ContactAdminMessageItem | null>(null);
  const [deleteMessage, setDeleteMessage] = useState<ContactAdminMessageItem | null>(null);
  const [attachmentsMessage, setAttachmentsMessage] = useState<ContactAdminMessageItem | null>(null);

  const [replyText, setReplyText] = useState("");
  const [replyFiles, setReplyFiles] = useState<File[]>([]);
  const [isReplying, setIsReplying] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleReplyFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selected = Array.from(e.target.files);
      if (replyFiles.length + selected.length > 5) {
        window.alert("แนบไฟล์ได้สูงสุด 5 ไฟล์เท่านั้น");
        return;
      }
      const invalidFiles = selected.filter(f => f.size > 20 * 1024 * 1024);
      if (invalidFiles.length > 0) {
        window.alert("ไฟล์ต้องมีขนาดไม่เกิน 20MB");
        return;
      }
      setReplyFiles(prev => [...prev, ...selected].slice(0, 5));
    }
  };

  const removeReplyFile = (index: number) => {
    setReplyFiles(prev => prev.filter((_, i) => i !== index));
  };

  useEffect(() => {
    fetchMessages();
  }, []);

  const fetchMessages = async () => {
    try {
      const res = await getAllContactAdminMessages();
      setMessages(res.messages);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filteredMessages = messages.filter(m => 
    m.subject.toLowerCase().includes(searchQuery.toLowerCase()) || 
    (m.shopName && m.shopName.toLowerCase().includes(searchQuery.toLowerCase())) ||
    m.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleReplySubmit = async () => {
    if (!replyMessage || !replyText.trim()) return;
    setIsReplying(true);
    try {
      const uploadedUrls: string[] = [];
      if (replyFiles.length > 0) {
        for (const file of replyFiles) {
          const res = await uploadFile(file, "contact-admin-attachment");
          if (res.url) {
            uploadedUrls.push(res.url);
          } else {
            uploadedUrls.push(res.path);
          }
        }
      }

      const { message: updated } = await replyContactAdminMessage(replyMessage.id, { 
        adminReply: replyText,
        adminReplyAttachments: uploadedUrls.length > 0 ? uploadedUrls : undefined
      });
      setMessages(prev => prev.map(m => m.id === updated.id ? updated : m));
      setReplyMessage(null);
      setReplyText("");
      setReplyFiles([]);
    } catch (err) {
      window.alert(err instanceof ApiError ? err.message : "ตอบกลับไม่สำเร็จ");
    } finally {
      setIsReplying(false);
    }
  };

  const handleDeleteSubmit = async () => {
    if (!deleteMessage) return;
    setIsDeleting(true);
    try {
      await deleteContactAdminMessage(deleteMessage.id);
      setMessages(prev => prev.filter(m => m.id !== deleteMessage.id));
      setDeleteMessage(null);
    } catch (err) {
      window.alert(err instanceof ApiError ? err.message : "ลบไม่สำเร็จ");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6 pb-10">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          ติดต่อสอบถาม
        </h1>
        <p className="text-sm text-gray-500 mt-1 flex items-center gap-1.5">
          ร้านค้าสามารถติดต่อแอดมินได้ที่นี่ <Info size={14} className="text-gray-400" />
        </p>
      </div>

      {/* Search Bar */}
      <div className="relative max-w-sm">
        <input
          type="text"
          placeholder="ค้นหาข้อความ"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-4 pr-10 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
        />
        <Search size={18} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-gray-700 bg-gray-50/50 border-b border-gray-100">
              <tr>
                <th className="px-6 py-4 font-bold">ID</th>
                <th className="px-6 py-4 font-bold">จากร้านค้า</th>
                <th className="px-6 py-4 font-bold">หัวข้อ</th>
                <th className="px-6 py-4 font-bold">ข้อความจากร้านค้า</th>
                <th className="px-6 py-4 font-bold">สถานะ</th>
                <th className="px-6 py-4 font-bold">วันที่-เวลา</th>
                <th className="px-6 py-4 font-bold text-center">จัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-20 text-center text-gray-500">
                    <Loader2 size={24} className="animate-spin mx-auto mb-2" />
                    กำลังโหลด...
                  </td>
                </tr>
              ) : filteredMessages.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-20 text-center text-gray-500">
                    ไม่พบข้อมูลข้อความ
                  </td>
                </tr>
              ) : (
                filteredMessages.map((m, idx) => {
                  const displayId = `#Q-${String(messages.length - idx).padStart(4, '0')}`;
                  return (
                    <tr key={m.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4 font-medium text-gray-900">{displayId}</td>
                      <td className="px-6 py-4 text-gray-700">{m.shopName || "ร้านค้า"}</td>
                      <td className="px-6 py-4 text-gray-700 max-w-[200px] truncate">{m.subject}</td>
                      <td className="px-6 py-4 text-gray-600 max-w-[200px] truncate" title={m.message}>
                        {m.message}
                      </td>
                      <td className="px-6 py-4">
                        {m.status === "resolved" ? (
                          <span className="inline-flex px-2.5 py-1 bg-[#E8F5E9] text-[#2E7D32] rounded-md text-xs font-bold">
                            ตอบแล้ว
                          </span>
                        ) : (
                          <span className="inline-flex px-2.5 py-1 bg-[#FFF3E0] text-[#E65100] rounded-md text-xs font-bold">
                            ใหม่
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-gray-600 whitespace-pre-line text-xs leading-relaxed">
                        {formatThaiDateTime(m.createdAt)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-1.5">
                          <button 
                            onClick={() => setViewMessage(m)}
                            className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors border border-transparent hover:border-gray-200"
                            title="ดูรายละเอียด"
                          >
                            <Eye size={16} />
                          </button>
                          <button 
                            onClick={() => setReplyMessage(m)}
                            className="p-1.5 text-gray-400 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors border border-transparent hover:border-orange-200"
                            title="ตอบกลับ"
                          >
                            <CornerUpLeft size={16} />
                          </button>
                          <button 
                            onClick={() => setAttachmentsMessage(m)}
                            className="relative p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors border border-transparent hover:border-gray-200"
                            title="ไฟล์แนบ"
                          >
                            <Paperclip size={16} />
                            {m.attachments && m.attachments.length > 0 && (
                              <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-gray-500 text-[9px] font-bold text-white">
                                {m.attachments.length}
                              </span>
                            )}
                          </button>
                          <button 
                            onClick={() => setDeleteMessage(m)}
                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-transparent hover:border-red-200"
                            title="ลบ"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: View Details */}
      {viewMessage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-xl">
            <div className="flex items-center justify-between p-5 border-b border-gray-100 sticky top-0 bg-white z-10">
              <h2 className="text-lg font-bold text-gray-900">
                รายละเอียดข้อความ #Q-{String(messages.findIndex(m => m.id === viewMessage.id) + 1).padStart(4, '0')}
              </h2>
              <button onClick={() => setViewMessage(null)} className="text-gray-400 hover:text-gray-600 p-1">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Details Grid */}
              <div className="grid grid-cols-[120px_1fr] gap-y-3 text-sm">
                <div className="text-gray-500 font-medium">จากร้านค้า</div>
                <div className="text-gray-900">{viewMessage.shopName || "ร้านค้า"}</div>
                
                <div className="text-gray-500 font-medium">อีเมล</div>
                <div className="text-gray-900">{viewMessage.shopEmail || "-"}</div>
                
                <div className="text-gray-500 font-medium">หัวข้อ</div>
                <div className="text-gray-900">{viewMessage.subject}</div>
                
                <div className="text-gray-500 font-medium">วันที่-เวลา</div>
                <div className="text-gray-900">{formatThaiDateTime(viewMessage.createdAt).replace('\n', '  ')}</div>
              </div>

              {/* Message from shop */}
              <div>
                <h3 className="text-sm font-bold text-gray-900 mb-2">ข้อความจากร้านค้า</h3>
                <div className="bg-gray-50 rounded-xl p-4 text-sm text-gray-700 whitespace-pre-wrap border border-gray-100">
                  {viewMessage.message}
                </div>
              </div>

              {/* Attachments from Shop */}
              {viewMessage.attachments && viewMessage.attachments.length > 0 && (
                <div>
                  <h3 className="text-sm font-bold text-gray-900 mb-2">ไฟล์แนบจากร้านค้า ({viewMessage.attachments.length})</h3>
                  <div className="grid grid-cols-2 gap-4">
                    {viewMessage.attachments.map((url, idx) => (
                      <a 
                        key={idx}
                        href={url}
                        target="_blank"
                        rel="noreferrer"
                        className="border border-gray-200 rounded-xl overflow-hidden group relative hover:border-orange-300 transition-colors block"
                      >
                        <div className="h-24 bg-gray-100 w-full flex items-center justify-center overflow-hidden">
                          <Paperclip className="w-8 h-8 text-gray-300" />
                        </div>
                        <div className="p-3 bg-white flex justify-between items-center">
                          <div className="min-w-0">
                            <p className="text-xs font-medium text-gray-900 truncate">ไฟล์แนบ {idx + 1}</p>
                          </div>
                          <div className="text-gray-400 group-hover:text-orange-500 transition-colors shrink-0">
                            <Download size={16} />
                          </div>
                        </div>
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Admin Reply */}
              {viewMessage.adminReply && (
                <div>
                  <h3 className="text-sm font-bold text-gray-900 mb-2">การตอบกลับของแอดมิน</h3>
                  <div className="border border-gray-100 rounded-xl p-4 bg-white shadow-sm">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-orange-500 text-white flex items-center justify-center text-[10px] font-bold">
                          AM
                        </div>
                        <span className="text-sm font-bold text-orange-600">Admin</span>
                      </div>
                    </div>
                    <p className="text-sm text-gray-700 whitespace-pre-wrap pl-8">
                      {viewMessage.adminReply}
                    </p>
                    
                    {viewMessage.adminReplyAttachments && viewMessage.adminReplyAttachments.length > 0 && (
                      <div className="pl-8 mt-3 grid grid-cols-2 gap-2">
                        {viewMessage.adminReplyAttachments.map((url, idx) => (
                          <a 
                            key={idx}
                            href={url}
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center gap-2 p-2 border border-gray-200 rounded-lg hover:border-orange-300 transition-colors bg-white group"
                          >
                            <Paperclip size={14} className="text-gray-400" />
                            <span className="text-xs font-medium text-gray-700 truncate flex-1">ไฟล์แนบ {idx + 1}</span>
                            <Download size={14} className="text-gray-400 group-hover:text-orange-500" />
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="p-4 border-t border-gray-100 flex justify-center bg-gray-50/50 rounded-b-2xl">
              <button 
                onClick={() => setViewMessage(null)}
                className="px-6 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
              >
                ปิด
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Reply */}
      {replyMessage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl w-full max-w-xl shadow-xl">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-900">
                ตอบกลับข้อความ #Q-{String(messages.findIndex(m => m.id === replyMessage.id) + 1).padStart(4, '0')}
              </h2>
              <button onClick={() => setReplyMessage(null)} className="text-gray-400 hover:text-gray-600 p-1">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 space-y-5">
              <div className="flex items-center gap-4 text-sm">
                <span className="text-gray-500 font-medium w-24">ถึงร้านค้า</span>
                <span className="text-gray-900">{replyMessage.shopName || "ร้านค้า"}</span>
              </div>
              
              <div>
                <label className="block text-sm font-bold text-gray-900 mb-2">ข้อความตอบกลับ</label>
                <textarea
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="พิมพ์ข้อความตอบกลับ..."
                  rows={4}
                  className="w-full p-3 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-900 mb-2">แนบไฟล์ <span className="text-gray-400 font-normal">(สูงสุด 5 ไฟล์)</span></label>
                <div className="relative border-2 border-dashed border-gray-200 rounded-xl bg-gray-50 p-6 flex flex-col items-center justify-center text-center hover:bg-gray-100 hover:border-orange-200 transition-colors">
                  <input 
                    type="file" 
                    multiple
                    accept="image/jpeg, image/png, image/webp, application/pdf"
                    onChange={handleReplyFileChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    disabled={isReplying || replyFiles.length >= 5}
                  />
                  <div className="w-10 h-10 bg-white rounded-full shadow-sm flex items-center justify-center text-gray-500 mb-3 border border-gray-100 pointer-events-none">
                    <Paperclip size={18} />
                  </div>
                  <p className="text-sm font-medium text-gray-700 pointer-events-none">คลิกหรือลากไฟล์มาวางที่นี่</p>
                  <p className="text-xs text-gray-400 mt-1 pointer-events-none">รองรับ JPG, PNG, PDF (ไม่เกิน 20MB)</p>
                </div>
                
                {replyFiles.length > 0 && (
                  <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {replyFiles.map((file, i) => (
                      <div key={i} className="flex items-center justify-between p-2 border border-gray-200 rounded-lg bg-white">
                        <div className="flex items-center gap-2 overflow-hidden">
                          <span className="text-xs font-medium text-gray-700 truncate">{file.name}</span>
                        </div>
                        <button 
                          type="button" 
                          onClick={() => removeReplyFile(i)}
                          disabled={isReplying}
                          className="text-gray-400 hover:text-red-500 p-1 shrink-0"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="p-5 border-t border-gray-100 flex justify-end gap-3 bg-gray-50/50 rounded-b-2xl">
              <button 
                onClick={() => setReplyMessage(null)}
                className="px-5 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl text-sm font-bold hover:bg-gray-50 transition-colors"
              >
                ยกเลิก
              </button>
              <button 
                onClick={handleReplySubmit}
                disabled={isReplying || !replyText.trim()}
                className="px-5 py-2.5 bg-[#FF4500] text-white rounded-xl text-sm font-bold hover:bg-[#E63E00] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isReplying && <Loader2 size={16} className="animate-spin" />}
                ส่งข้อความ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Delete */}
      {deleteMessage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-xl overflow-hidden">
            <div className="flex justify-end p-3">
              <button onClick={() => setDeleteMessage(null)} className="text-gray-400 hover:text-gray-600 p-1">
                <X size={20} />
              </button>
            </div>
            <div className="px-6 pb-6 pt-2 flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center text-red-500 mb-4 border border-red-100">
                <AlertTriangle size={32} />
              </div>
              <h2 className="text-lg font-bold text-gray-900 mb-2">คุณต้องการลบข้อความนี้ใช่หรือไม่?</h2>
              <p className="text-sm text-gray-500 mb-8">
                เมื่อลบแล้ว จะไม่สามารถกู้คืนข้อมูลได้
              </p>
              
              <div className="flex items-center gap-3 w-full">
                <button 
                  onClick={() => setDeleteMessage(null)}
                  className="flex-1 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl text-sm font-bold hover:bg-gray-50 transition-colors"
                >
                  ยกเลิก
                </button>
                <button 
                  onClick={handleDeleteSubmit}
                  disabled={isDeleting}
                  className="flex-1 py-2.5 bg-red-600 text-white rounded-xl text-sm font-bold hover:bg-red-700 transition-colors disabled:opacity-50 flex justify-center items-center gap-2"
                >
                  {isDeleting && <Loader2 size={16} className="animate-spin" />}
                  ลบข้อความ
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Attachments Viewer */}
      {attachmentsMessage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setAttachmentsMessage(null)}
          />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
              <div>
                <h2 className="text-base font-bold text-gray-900">
                  ตรวจสอบเอกสาร — {attachmentsMessage.shopName || "ร้านค้า"}
                </h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  เอกสารทั้งหมด {attachmentsMessage.attachments?.length || 0} ไฟล์
                </p>
              </div>
              <button
                onClick={() => setAttachmentsMessage(null)}
                className="flex items-center justify-center w-8 h-8 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <div className="overflow-y-auto flex-1 px-6 py-4 space-y-2">
              {(!attachmentsMessage.attachments || attachmentsMessage.attachments.length === 0) ? (
                <div className="flex flex-col items-center justify-center py-8 text-gray-400 text-center gap-2">
                  <FileText size={32} className="text-gray-300" />
                  <p className="text-sm font-semibold text-gray-500">ยังไม่มีเอกสารแนบ</p>
                </div>
              ) : (
                attachmentsMessage.attachments.map((url, idx) => {
                  let isPdf = false;
                  try {
                    isPdf = new URL(url).pathname.toLowerCase().endsWith('.pdf');
                  } catch {
                    isPdf = url.toLowerCase().includes('.pdf');
                  }

                  return (
                    <div 
                      key={idx} 
                      onClick={() => window.open(url, "_blank", "noopener,noreferrer")}
                      className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 bg-gray-50 hover:bg-gray-100 cursor-pointer transition-colors group"
                    >
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${isPdf ? "bg-red-100 text-red-500" : "bg-blue-100 text-blue-500"}`}>
                        {isPdf ? <FileText size={20} /> : <ImageIcon size={20} />}
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-800 truncate">
                          {isPdf ? "เอกสาร PDF" : "รูปภาพร้านค้า"}
                        </p>
                        <p className="text-xs text-gray-500">ไฟล์แนบ {idx + 1}</p>
                      </div>

                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button className="flex items-center justify-center w-7 h-7 rounded-lg text-gray-400 hover:text-orange-500 hover:bg-orange-50 transition-colors" title="ดูตัวอย่าง">
                          <Eye size={14} />
                        </button>
                        <button className="flex items-center justify-center w-7 h-7 rounded-lg text-gray-400 hover:text-orange-500 hover:bg-orange-50 transition-colors" title="ดาวน์โหลด">
                          <Download size={14} />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div className="px-6 py-4 border-t border-gray-100 shrink-0">
              <button
                onClick={() => setAttachmentsMessage(null)}
                className="w-full py-2.5 rounded-xl bg-gray-100 text-gray-700 text-sm font-semibold hover:bg-gray-200 transition-colors"
              >
                ปิด
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
