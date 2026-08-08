import { Printer, Phone, Mail } from "lucide-react";
import CustomerHeader from "@/components/customer/CustomerHeader";

export default function CustomerLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <CustomerHeader variant="auth" />
      {children}
      <footer className="bg-gradient-to-r from-orange-500 via-orange-600 to-red-500 text-white mt-12 sm:mt-16 py-10 sm:py-12 px-6 sm:px-12 lg:px-20">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand Info */}
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-white text-orange-600 flex items-center justify-center font-bold">
                <Printer className="w-4 h-4" />
              </div>
              <span className="text-xl font-black tracking-tight">EASYPRINT</span>
            </div>
            <p className="text-sm text-white/90 leading-relaxed max-w-md">
              ประสบการณ์ใหม่สำหรับการสั่งพิมพ์งานออนไลน์ เพื่อความสะดวกสบาย พร้อมการแจ้งเตือน
            </p>
            {/* Social / Contact Icons */}
            <div className="flex items-center gap-3 pt-2">
              <a
                href="tel:020000000"
                className="w-9 h-9 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white transition"
                title="โทรศัพท์"
              >
                <Phone className="w-4 h-4" />
              </a>
              <a
                href="mailto:contact@easyprint.com"
                className="w-9 h-9 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white transition"
                title="อีเมล"
              >
                <Mail className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Platform Links */}
          <div className="space-y-3">
            <h4 className="text-xs font-black tracking-wider uppercase text-white/70">
              PLATFORM
            </h4>
            <ul className="space-y-2 text-sm text-white/90">
              <li>
                <a href="/Dashboard" className="hover:underline">
                  ราคาร้านต่างๆ
                </a>
              </li>
              <li>
                <a href="/status" className="hover:underline">
                  ติดตามสถานะ
                </a>
              </li>
              <li>
                <a href="#" className="hover:underline">
                  การช่วยเหลือ
                </a>
              </li>
            </ul>
          </div>

          {/* Company Links */}
          <div className="space-y-3">
            <h4 className="text-xs font-black tracking-wider uppercase text-white/70">
              COMPANY
            </h4>
            <ul className="space-y-2 text-sm text-white/90">
              <li>
                <a href="#" className="hover:underline">
                  Our Vision
                </a>
              </li>
              <li>
                <a href="#" className="hover:underline">
                  Privacy Policy
                </a>
              </li>
              <li>
                <a href="#" className="hover:underline">
                  Terms of Use
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="max-w-6xl mx-auto border-t border-white/20 mt-8 pt-6 text-center text-xs text-white/70">
          © {new Date().getFullYear()} EasyPrint. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
