import Link from "next/link";

export default function ShopLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <span className="font-bold text-emerald-600">EasyPrint — ร้านค้า</span>
        <div className="flex gap-4 text-sm text-gray-600">
          <Link href="/shop/dashboard" className="hover:text-emerald-600">
            สรุปรายได้
          </Link>
          <Link href="/shop/orders" className="hover:text-emerald-600">
            จัดการคำสั่งซื้อ
          </Link>
          <Link href="/shop/settings" className="hover:text-emerald-600">
            ตั้งค่าร้าน
          </Link>
        </div>
      </nav>
      {children}
    </div>
  );
}
