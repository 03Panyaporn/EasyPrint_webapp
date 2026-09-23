import { redirect } from "next/navigation";

// แจ้งเตือนเก่าที่บันทึกลิงก์ไว้เป็น /shop/orders/:id (ก่อนแก้เป็น /shop/orders?orderId=) — พาไปหน้ารายการออเดอร์
// แล้วเปิดรายละเอียดออเดอร์นั้นให้เอง แทนที่จะเจอ 404 (ร้านไม่มีหน้ารายละเอียดออเดอร์แยก)
export default function ShopOrderLinkRedirect({ params }: { params: { orderId: string } }) {
  redirect(`/shop/orders?orderId=${encodeURIComponent(params.orderId)}`);
}
