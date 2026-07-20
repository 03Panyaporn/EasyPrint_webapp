export default function OrderStatusPage({ params }: { params: { orderId: string } }) {
  return (
    <main className="max-w-3xl mx-auto p-8">
      <div className="bg-white rounded-xl shadow p-6">
        <h1 className="text-xl font-bold text-gray-800">ติดตามสถานะงาน</h1>
        <p className="text-sm text-gray-500 mt-2">
          หน้านี้แสดงรายละเอียดและสถานะปัจจุบันของคำสั่งพิมพ์หมายเลข{" "}
          <span className="font-mono text-gray-700">{params.orderId}</span>
        </p>
      </div>
    </main>
  );
}
