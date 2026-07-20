export default function LoginPage() {
  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center p-8">
      <div className="max-w-sm w-full bg-white rounded-xl shadow p-6 space-y-4">
        <h1 className="text-xl font-bold text-gray-800">เข้าสู่ระบบ</h1>
        <p className="text-sm text-gray-500">
          หน้านี้สำหรับให้ผู้ใช้งาน (ลูกค้า / ร้านค้า / แอดมิน) เข้าสู่ระบบด้วยอีเมลและรหัสผ่าน
        </p>
        <form className="space-y-3">
          <input
            type="email"
            placeholder="อีเมล"
            disabled
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-500"
          />
          <input
            type="password"
            placeholder="รหัสผ่าน"
            disabled
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-500"
          />
          <button
            type="submit"
            disabled
            className="w-full bg-blue-600 text-white rounded-lg py-2 font-medium opacity-50"
          >
            เข้าสู่ระบบ (ยังไม่เชื่อมต่อ)
          </button>
        </form>
      </div>
    </main>
  );
}
