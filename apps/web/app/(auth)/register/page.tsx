export default function RegisterPage() {
  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center p-8">
      <div className="max-w-sm w-full bg-white rounded-xl shadow p-6 space-y-4">
        <h1 className="text-xl font-bold text-gray-800">สมัครสมาชิก</h1>
        <p className="text-sm text-gray-500">
          หน้านี้สำหรับให้ผู้ใช้งานใหม่สมัครบัญชี เลือกได้ว่าจะเป็นลูกค้าหรือเจ้าของร้านค้า
        </p>
        <form className="space-y-3">
          <input
            type="text"
            placeholder="ชื่อ-นามสกุล"
            disabled
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-500"
          />
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
            สมัครสมาชิก (ยังไม่เชื่อมต่อ)
          </button>
        </form>
      </div>
    </main>
  );
}
