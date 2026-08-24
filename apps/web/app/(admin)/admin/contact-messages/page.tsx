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
  Loader2
} from "lucide-react";
import type { ContactAdminMessageItem } from "@easyprint/shared";
import { 
  getAllContactAdminMessages, 
  replyContactAdminMessage,
  deleteContactAdminMessage
} from "@/lib/api/contactAdmin";
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

  const [replyText, setReplyText] = useState("");
  const [isReplying, setIsReplying] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

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
      const { message: updated } = await replyContactAdminMessage(replyMessage.id, { adminReply: replyText });
      setMessages(prev => prev.map(m => m.id === updated.id ? updated : m));
      setReplyMessage(null);
      setReplyText("");
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
                <th className="px-6 py-4 font-bold">หัวข้อ</th>
                <th className="px-6 py-4 font-bold">จากร้านค้า</th>
                <th className="px-6 py-4 font-bold">ข้อความล่าสุด</th>
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
                      <td className="px-6 py-4 text-gray-700 max-w-[200px] truncate">{m.subject}</td>
                      <td className="px-6 py-4 text-gray-700">{m.shopName || "ร้านค้า"}</td>
                      <td className="px-6 py-4 text-gray-600">
                        {m.status === "resolved" ? "แอดมินตอบกลับแล้ว" : "ร้านค้าส่งข้อความใหม่"}
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
                            onClick={() => setViewMessage(m)}
                            className="relative p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors border border-transparent hover:border-gray-200"
                            title="ไฟล์แนบ"
                          >
                            <Paperclip size={16} />
                            {/* Mock attachment count */}
                            <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-gray-500 text-[9px] font-bold text-white">
                              {idx % 3 + 1}
                            </span>
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

              {/* Mock Attachments */}
              <div>
                <h3 className="text-sm font-bold text-gray-900 mb-2">ไฟล์แนบจากร้านค้า (2)</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="border border-gray-200 rounded-xl overflow-hidden group relative">
                    <div className="h-24 bg-gray-100 w-full flex items-center justify-center overflow-hidden">
                      {/* Placeholder image */}
                      <img src="https://images.unsplash.com/photo-1618424181497-157f25b6ce5e?w=400&q=80" alt="doc" className="w-full h-full object-cover opacity-80" />
                    </div>
                    <div className="p-3 bg-white flex justify-between items-center">
                      <div>
                        <p className="text-xs font-medium text-gray-900 truncate max-w-[120px]">เอกสารตัวอย่าง1.jpg</p>
                        <p className="text-[10px] text-gray-500 mt-0.5">1.25 MB</p>
                      </div>
                      <button className="text-gray-400 hover:text-orange-500 transition-colors">
                        <Download size={16} />
                      </button>
                    </div>
                  </div>
                  <div className="border border-gray-200 rounded-xl overflow-hidden group relative">
                    <div className="h-24 bg-gray-100 w-full flex items-center justify-center overflow-hidden">
                      <img src="https://images.unsplash.com/photo-1586281380349-632531db7ed4?w=400&q=80" alt="doc2" className="w-full h-full object-cover opacity-80" />
                    </div>
                    <div className="p-3 bg-white flex justify-between items-center">
                      <div>
                        <p className="text-xs font-medium text-gray-900 truncate max-w-[120px]">เอกสารตัวอย่าง2.png</p>
                        <p className="text-[10px] text-gray-500 mt-0.5">860 KB</p>
                      </div>
                      <button className="text-gray-400 hover:text-orange-500 transition-colors">
                        <Download size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>

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
                      <span className="text-xs text-gray-500">
                        {/* Mock reply time */}
                        12 พ.ค. 2567  11:15
                      </span>
                    </div>
                    <p className="text-sm text-gray-700 whitespace-pre-wrap pl-8">
                      {viewMessage.adminReply}
                    </p>
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
                <div className="border-2 border-dashed border-gray-200 rounded-xl p-6 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-gray-50 hover:border-orange-200 transition-colors">
                  <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-gray-500 mb-3">
                    <Paperclip size={18} />
                  </div>
                  <p className="text-sm font-medium text-gray-700">คลิกหรือลากไฟล์มาวางที่นี่</p>
                  <p className="text-xs text-gray-400 mt-1">รองรับไฟล์ JPG, PNG, PDF, DOC, DOCX (ขนาดไม่เกิน 20MB/ไฟล์)</p>
                </div>
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
    </div>
  );
}
