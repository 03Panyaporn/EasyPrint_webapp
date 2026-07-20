import Link from "next/link";

export default function CustomerLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <span className="font-bold text-blue-600">EasyPrint — ลูกค้า</span>
        <div className="flex gap-4 text-sm text-gray-600">
          <Link href="/orders" className="hover:text-blue-600">
            ประวัติสั่งพิมพ์
          </Link>
          <Link href="/orders/new" className="hover:text-blue-600">
            สั่งพิมพ์ใหม่
          </Link>
        </div>
      </nav>
      {children}
    </div>
  );
}
