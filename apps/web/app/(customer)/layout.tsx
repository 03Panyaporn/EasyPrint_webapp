import Link from "next/link";

export default function CustomerLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <span className="font-bold text-blue-600">EasyPrint — ลูกค้า</span>
        <div className="flex gap-4 text-sm text-gray-600 items-center">
          <Link href="/orders" className="hover:text-blue-600 font-medium">
            ประวัติสั่งพิมพ์
          </Link>
          <Link href="/orders/new" className="hover:text-blue-600 font-medium">
            สั่งพิมพ์ใหม่
          </Link>
          <Link
            href="/login"
            className="flex items-center justify-center w-8 h-8 rounded-full border border-gray-200 hover:border-blue-400 hover:text-blue-600 transition text-gray-500"
            title="โปรไฟล์"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
              />
            </svg>
          </Link>
        </div>
      </nav>
      {children}
    </div>
  );
}
