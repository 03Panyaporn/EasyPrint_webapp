export default function AdminUsersPage() {
  return (
    <main className="max-w-3xl mx-auto p-8">
      <div className="bg-white rounded-xl shadow p-6">
        <h1 className="text-xl font-bold text-gray-800">จัดการบัญชีผู้ใช้</h1>
        <p className="text-sm text-gray-500 mt-2">
          หน้านี้แสดงรายชื่อผู้ใช้งานทั้งหมดในระบบ (ลูกค้า / เจ้าของร้าน / แอดมิน) ให้แอดมินจัดการสิทธิ์หรือระงับบัญชี
        </p>
      </div>
    </main>
  );
}
