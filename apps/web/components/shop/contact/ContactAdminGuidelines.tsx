import { Lightbulb, MessageSquare, Mail, Clock, Bell } from "lucide-react";

export default function ContactAdminGuidelines() {
  return (
    <div className="bg-[#FFFDF9] rounded-2xl border border-orange-100 p-6">
      <div className="flex items-center gap-3 mb-6 pb-4 border-b border-orange-100">
        <div className="w-8 h-8 rounded-full bg-orange-100 text-orange-500 flex items-center justify-center shrink-0">
          <Lightbulb className="w-4 h-4" />
        </div>
        <h3 className="font-bold text-slate-800">ก่อนส่งคำร้อง</h3>
      </div>

      <div className="space-y-6">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-red-50 text-red-500 flex items-center justify-center shrink-0">
            <MessageSquare className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-slate-800">ระบุรายละเอียดให้ชัดเจน</h4>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              อธิบายปัญหาให้ละเอียด เพื่อให้ทีมงานช่วยเหลือได้รวดเร็วขึ้น
            </p>
          </div>
        </div>

        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-green-50 text-green-500 flex items-center justify-center shrink-0">
            <Mail className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-slate-800">ทีมงานตอบกลับผ่านระบบ</h4>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              ดูคำตอบได้ที่เมนู &quot;ตรวจสอบคำร้อง&quot; ไม่ต้องรอทางอีเมล
            </p>
          </div>
        </div>

        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-red-50 text-red-500 flex items-center justify-center shrink-0">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-slate-800">เวลาทำการของแอดมิน</h4>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              ทุกวัน 09:00 - 18:00 น. <br/> (ยกเว้นวันหยุดนักขัตฤกษ์)
            </p>
          </div>
        </div>
      </div>

      <div className="mt-6 bg-orange-50 border border-orange-100 rounded-xl p-4 flex gap-3">
        <Bell className="w-5 h-5 text-orange-500 shrink-0" />
        <div>
          <h4 className="text-sm font-semibold text-orange-800">แจ้งเตือน</h4>
          <p className="text-xs text-orange-700 mt-1 leading-relaxed">
            ท่านสามารถตรวจสอบสถานะคำร้องได้ที่เมนู "ตรวจสอบคำร้อง" หลังจากส่งแล้ว
          </p>
        </div>
      </div>
    </div>
  );
}
