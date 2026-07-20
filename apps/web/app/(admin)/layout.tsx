import Link from "next/link";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <span className="font-bold text-slate-800">EasyPrint — แอดมิน</span>
        <div className="flex gap-4 text-sm text-gray-600">
          <Link href="/admin/shops" className="hover:text-slate-800">
            ร้านค้า
          </Link>
          <Link href="/admin/users" className="hover:text-slate-800">
            ผู้ใช้งาน
          </Link>
        </div>
      </nav>
      {children}
    </div>
  );
}
