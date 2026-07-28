import type { Metadata } from "next";
import { Sarabun } from "next/font/google";
import "./globals.css";

const sarabun = Sarabun({
  weight: ["300", "400", "500", "600", "700"],
  subsets: ["thai", "latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "EasyPrint - ร้านถ่ายเอกสารออนไลน์",
  description: "แพลตฟอร์มบริหารจัดการร้านถ่ายเอกสาร สั่งพิมพ์งานออนไลน์สะดวกรวดเร็ว",
  icons: {
    icon: "/icon.png",
    shortcut: "/icon.png",
    apple: "/icon.png",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="th" className={sarabun.className}>
      <body className="antialiased bg-gray-50 text-slate-800">{children}</body>
    </html>
  );
}

