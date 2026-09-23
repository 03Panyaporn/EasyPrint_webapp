import { NextRequest, NextResponse } from "next/server";

// Proxy API ทุก endpoint ของ apps/api (Render) ให้ browser เรียกผ่านโดเมนเดียวกับเว็บ (same-origin)
// เดิม browser เรียกข้ามโดเมนตรงไปที่ easyprint-api-*.onrender.com พร้อม credentials: "include" —
// cookie ยืนยันตัวตน (easyprint_token) เลยถูกมองเป็น "third-party cookie" เบราว์เซอร์สมัยใหม่บล็อกไว้เป็นค่าเริ่มต้น
// (Incognito บล็อกเสมอ, โปรไฟล์ปกติก็ทยอยบล็อกเป็นดีฟอลต์) → login สำเร็จแต่ request ถัดไปหลุด session ทันที (401)
//
// ทางแก้: proxy คำขอผ่าน route นี้แทน — browser เห็นแค่ request ไปโดเมนตัวเอง (/api/...) ทำให้ cookie ที่ backend
// ตั้งกลับมา (ผ่าน Set-Cookie ที่ถูก relay ต่อในนี้) ถูกผูกกับโดเมนเว็บเอง กลายเป็น first-party cookie ทันที
// โดยไม่ต้องแก้โดเมน/cookie ฝั่ง apps/api เลย (คุก backend ไม่ได้ตั้ง Set-Cookie's Domain ไว้ตายตัวอยู่แล้ว)
//
// apps/web/lib/api/client.ts และ uploads.ts ต้องเรียก path relative "/api/..." (ไม่ใช่โดเมนเต็มของ Render ตรงๆ)
// ถึงจะผ่าน route นี้ — ดู NEXT_PUBLIC_API_URL ที่ตั้งไว้ในค่า build ของ Cloudflare (ควรเป็น "/api" ตอนนี้)

// server-only (ไม่ใส่ NEXT_PUBLIC_) กันเว็บฝั่ง browser เห็น URL จริงของ backend ตรงๆ — ตั้งใน Cloudflare
// dashboard ได้ถ้าต้องการ override แต่ไม่บังคับ เพราะ URL นี้ไม่ใช่ความลับ (เห็นได้จาก response header ของ Render อยู่แล้ว)
const BACKEND_API_URL = process.env.BACKEND_API_URL ?? "https://easyprint-api-8kki.onrender.com";

// header ที่ห้าม forward ต่อ (hop-by-hop ตาม RFC 7230 หรือถูกคำนวณใหม่อัตโนมัติโดย fetch/runtime อยู่แล้ว)
const SKIP_REQUEST_HEADERS = new Set([
  "host",
  "connection",
  "content-length",
  "cf-connecting-ip",
  "cf-ray",
  "cf-visitor",
  "x-forwarded-for",
  "x-forwarded-proto",
]);
const SKIP_RESPONSE_HEADERS = new Set(["content-encoding", "content-length", "transfer-encoding", "connection"]);

async function proxy(req: NextRequest, path: string[]): Promise<NextResponse> {
  const targetUrl = `${BACKEND_API_URL}/${path.join("/")}${req.nextUrl.search}`;

  const headers = new Headers();
  req.headers.forEach((value, key) => {
    if (!SKIP_REQUEST_HEADERS.has(key.toLowerCase())) headers.set(key, value);
  });

  const hasBody = !["GET", "HEAD"].includes(req.method);

  let upstream: Response;
  try {
    upstream = await fetch(targetUrl, {
      method: req.method,
      headers,
      body: hasBody ? await req.arrayBuffer() : undefined,
      redirect: "manual",
    });
  } catch (err) {
    console.error("API proxy: เรียก backend ไม่สำเร็จ:", err);
    return NextResponse.json({ error: "เชื่อมต่อเซิร์ฟเวอร์ไม่สำเร็จ กรุณาลองใหม่อีกครั้ง" }, { status: 502 });
  }

  const resHeaders = new Headers();
  upstream.headers.forEach((value, key) => {
    if (!SKIP_RESPONSE_HEADERS.has(key.toLowerCase())) resHeaders.set(key, value);
  });

  // Set-Cookie อาจมีได้หลายค่าพร้อมกัน (เช่น login เซ็ต cookie เดียว แต่เผื่ออนาคตมีหลายตัว) — ต้อง append ทีละค่า
  // ไม่ใช้ resHeaders.set ตรงๆ เพราะ Headers.set จะรวมหลายค่าด้วย ", " ทำให้ browser อ่าน cookie พังได้
  const setCookies = typeof upstream.headers.getSetCookie === "function" ? upstream.headers.getSetCookie() : [];
  resHeaders.delete("set-cookie");
  for (const cookie of setCookies) resHeaders.append("set-cookie", cookie);

  const body = upstream.body ? await upstream.arrayBuffer() : null;
  return new NextResponse(body, { status: upstream.status, headers: resHeaders });
}

export const dynamic = "force-dynamic"; // ห้าม cache — เป็น proxy ของข้อมูลส่วนตัว/มี auth เสมอ

type RouteContext = { params: { path: string[] } };

export async function GET(req: NextRequest, { params }: RouteContext) {
  return proxy(req, params.path);
}
export async function POST(req: NextRequest, { params }: RouteContext) {
  return proxy(req, params.path);
}
export async function PUT(req: NextRequest, { params }: RouteContext) {
  return proxy(req, params.path);
}
export async function PATCH(req: NextRequest, { params }: RouteContext) {
  return proxy(req, params.path);
}
export async function DELETE(req: NextRequest, { params }: RouteContext) {
  return proxy(req, params.path);
}
