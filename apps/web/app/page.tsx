"use client";

import { useState } from "react";
import axios from "axios";
import { createOrderSchema, type CreateOrderInput } from "@easyprint/shared";

// ตัวอย่างหน้าเดียว แสดงวิธีเรียก API /orders ที่ backend สร้างไว้
// ใช้ schema เดียวกับ backend จาก @easyprint/shared เพื่อ validate ก่อนส่ง
// "use client" จำเป็นเพราะหน้านี้ใช้ useState (Next.js App Router แยก server/client component)

export default function HomePage() {
  const [result, setResult] = useState<string>("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const payload: CreateOrderInput = {
      shopId: "00000000-0000-0000-0000-000000000000",
      serviceType: "photocopy",
      pages: 10,
      copies: 1,
      colorMode: "bw",
      paperSize: "A4",
      binding: false,
      lamination: false,
      fileUrl: "https://example.com/test.pdf",
    };

    const parsed = createOrderSchema.safeParse(payload);
    if (!parsed.success) {
      setResult("ข้อมูลไม่ผ่านการตรวจสอบ: " + JSON.stringify(parsed.error.flatten()));
      return;
    }

    try {
      const res = await axios.post("http://localhost:3000/orders", parsed.data);
      setResult("สำเร็จ: " + JSON.stringify(res.data));
    } catch (err) {
      setResult("เกิดข้อผิดพลาด: " + String(err));
    }
  }

  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center p-8">
      <div className="max-w-md w-full bg-white rounded-xl shadow p-6 space-y-4">
        <h1 className="text-xl font-bold text-gray-800">EasyPrint — ทดสอบเชื่อมต่อ API</h1>
        <p className="text-sm text-gray-500">
          ปุ่มนี้ทดสอบส่งคำสั่งพิมพ์ตัวอย่างไปที่ backend (ต้องรัน <code>bun --cwd apps/api dev</code> ก่อน)
        </p>
        <form onSubmit={handleSubmit}>
          <button
            type="submit"
            className="w-full bg-blue-600 text-white rounded-lg py-2 font-medium hover:bg-blue-700 transition"
          >
            ทดสอบสั่งพิมพ์
          </button>
        </form>
        {result && (
          <pre className="text-xs bg-gray-100 rounded p-3 overflow-auto whitespace-pre-wrap">{result}</pre>
        )}
      </div>
    </main>
  );
}
