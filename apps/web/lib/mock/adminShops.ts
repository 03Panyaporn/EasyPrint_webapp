// Mock data สำหรับ Admin — ตรวจสอบร้านค้า
// เตรียมเชื่อม API จริงในภายหลัง (structure ตรงกับ DB schema)

export type ShopStatus = "รอตรวจสอบ" | "อนุมัติแล้ว" | "ไม่อนุมัติ";

export interface MockDocument {
  id: string;
  name: string;
  type: "pdf" | "image";
  size: string;
  /** URL จำลอง — สำหรับ preview */
  url: string;
}

export interface MockShop {
  id: string;
  name: string;
  email: string;
  phone: string;
  ownerFirstname: string;
  ownerLastname: string;
  shopType: string;
  address: string;
  district: string;
  province: string;
  googleMapLink: string;
  lineId: string;
  socialUrl: string;
  openTime: string;
  closeTime: string;
  openDays: string;
  submitDate: string; // "20 พ.ย. 2567 16:30 น."
  docCount: number;
  status: ShopStatus;
  rejectedReason?: string;
  documents: MockDocument[];
}

export const mockShops: MockShop[] = [
  {
    id: "shop-001",
    name: "Copy Hub",
    email: "copyhub@gmail.com",
    phone: "081-234-5678",
    ownerFirstname: "สมาย",
    ownerLastname: "ใจดี",
    shopType: "ร้านถ่ายเอกสารทั่วไป",
    address: "123/45 ถนนพหลโยธิน แขวงสามเสนใน",
    district: "พญาไท",
    province: "กรุงเทพมหานคร 10400",
    googleMapLink: "https://maps.google.com",
    lineId: "@copyhub",
    socialUrl: "copyhub",
    openTime: "08:00",
    closeTime: "20:00",
    openDays: "จันทร์ - เสาร์",
    submitDate: "20 พ.ย. 2567 16:30 น.",
    docCount: 5,
    status: "รอตรวจสอบ",
    documents: [
      { id: "doc-001-1", name: "business_license.pdf", type: "pdf", size: "1.2 MB", url: "/mock/doc.pdf" },
      { id: "doc-001-2", name: "id_card.jpg", type: "image", size: "890 KB", url: "/mock/img.jpg" },
      { id: "doc-001-3", name: "commercial.pdf", type: "pdf", size: "2.1 MB", url: "/mock/doc.pdf" },
      { id: "doc-001-4", name: "shop_front.jpg", type: "image", size: "1.5 MB", url: "/mock/img.jpg" },
      { id: "doc-001-5", name: "other_doc.pdf", type: "pdf", size: "500 KB", url: "/mock/doc.pdf" },
    ],
  },
  {
    id: "shop-002",
    name: "Print Perfect",
    email: "printperfect@gmail.com",
    phone: "082-345-6789",
    ownerFirstname: "สุภา",
    ownerLastname: "ศรีดี",
    shopType: "ร้านพรินต์สี / กราฟิก",
    address: "88/1 ถนนสุขุมวิท",
    district: "วัฒนา",
    province: "กรุงเทพมหานคร 10110",
    googleMapLink: "https://maps.google.com",
    lineId: "@printperfect",
    socialUrl: "printperfect",
    openTime: "09:00",
    closeTime: "19:00",
    openDays: "จันทร์ - ศุกร์",
    submitDate: "20 พ.ย. 2567 11:30 น.",
    docCount: 4,
    status: "รอตรวจสอบ",
    documents: [
      { id: "doc-002-1", name: "business_license.pdf", type: "pdf", size: "1.1 MB", url: "/mock/doc.pdf" },
      { id: "doc-002-2", name: "id_card.jpg", type: "image", size: "750 KB", url: "/mock/img.jpg" },
      { id: "doc-002-3", name: "shop_photo.jpg", type: "image", size: "1.8 MB", url: "/mock/img.jpg" },
      { id: "doc-002-4", name: "contract.pdf", type: "pdf", size: "900 KB", url: "/mock/doc.pdf" },
    ],
  },
  {
    id: "shop-003",
    name: "Quick Print",
    email: "quickprint@gmail.com",
    phone: "083-456-7890",
    ownerFirstname: "สุกร",
    ownerLastname: "ใจกล้า",
    shopType: "ร้านถ่ายเอกสารทั่วไป",
    address: "55 ซอยลาดพร้าว 15",
    district: "วังทองหลาง",
    province: "กรุงเทพมหานคร 10310",
    googleMapLink: "https://maps.google.com",
    lineId: "@quickprint",
    socialUrl: "quickprint",
    openTime: "08:30",
    closeTime: "18:30",
    openDays: "จันทร์ - เสาร์",
    submitDate: "20 พ.ย. 2567 10:15 น.",
    docCount: 6,
    status: "รอตรวจสอบ",
    documents: [
      { id: "doc-003-1", name: "business_license.pdf", type: "pdf", size: "1.3 MB", url: "/mock/doc.pdf" },
      { id: "doc-003-2", name: "id_card.jpg", type: "image", size: "820 KB", url: "/mock/img.jpg" },
      { id: "doc-003-3", name: "commercial.pdf", type: "pdf", size: "1.9 MB", url: "/mock/doc.pdf" },
      { id: "doc-003-4", name: "shop_front.jpg", type: "image", size: "2.2 MB", url: "/mock/img.jpg" },
      { id: "doc-003-5", name: "map_confirm.pdf", type: "pdf", size: "400 KB", url: "/mock/doc.pdf" },
      { id: "doc-003-6", name: "owner_photo.jpg", type: "image", size: "600 KB", url: "/mock/img.jpg" },
    ],
  },
  {
    id: "shop-004",
    name: "Easy Copy",
    email: "easycopy@gmail.com",
    phone: "084-567-8901",
    ownerFirstname: "มนัส",
    ownerLastname: "ศรีรุ่ง",
    shopType: "ร้านครบวงจร",
    address: "201 ถนนรัชดาภิเษก",
    district: "ห้วยขวาง",
    province: "กรุงเทพมหานคร 10310",
    googleMapLink: "https://maps.google.com",
    lineId: "@easycopy",
    socialUrl: "easycopy",
    openTime: "08:00",
    closeTime: "21:00",
    openDays: "ทุกวัน",
    submitDate: "19 พ.ย. 2567 16:45 น.",
    docCount: 3,
    status: "รอตรวจสอบ",
    documents: [
      { id: "doc-004-1", name: "business_license.pdf", type: "pdf", size: "1.0 MB", url: "/mock/doc.pdf" },
      { id: "doc-004-2", name: "id_card.jpg", type: "image", size: "700 KB", url: "/mock/img.jpg" },
      { id: "doc-004-3", name: "shop_photo.jpg", type: "image", size: "1.6 MB", url: "/mock/img.jpg" },
    ],
  },
  {
    id: "shop-005",
    name: "Print & Go",
    email: "printgo@gmail.com",
    phone: "085-678-9012",
    ownerFirstname: "ณัฐพล",
    ownerLastname: "สุขสม",
    shopType: "ร้านเข้าเล่ม / ทำสปิไรล์",
    address: "77 ถนนพระราม 9",
    district: "เขตยานนาวา",
    province: "กรุงเทพมหานคร 10120",
    googleMapLink: "https://maps.google.com",
    lineId: "@printgo",
    socialUrl: "printgo",
    openTime: "09:00",
    closeTime: "18:00",
    openDays: "จันทร์ - เสาร์",
    submitDate: "19 พ.ย. 2567 09:00 น.",
    docCount: 4,
    status: "รอตรวจสอบ",
    documents: [
      { id: "doc-005-1", name: "business_license.pdf", type: "pdf", size: "1.4 MB", url: "/mock/doc.pdf" },
      { id: "doc-005-2", name: "id_card.jpg", type: "image", size: "860 KB", url: "/mock/img.jpg" },
      { id: "doc-005-3", name: "shop_front.jpg", type: "image", size: "2.0 MB", url: "/mock/img.jpg" },
      { id: "doc-005-4", name: "contract.pdf", type: "pdf", size: "750 KB", url: "/mock/doc.pdf" },
    ],
  },
  // อนุมัติแล้ว
  {
    id: "shop-006",
    name: "Pro Print Center",
    email: "proprint@gmail.com",
    phone: "086-789-0123",
    ownerFirstname: "กมล",
    ownerLastname: "วงษ์สวัสดิ์",
    shopType: "ร้านพรินต์สี / กราฟิก",
    address: "100 ถนนสีลม",
    district: "บางรัก",
    province: "กรุงเทพมหานคร 10500",
    googleMapLink: "https://maps.google.com",
    lineId: "@proprint",
    socialUrl: "proprint",
    openTime: "08:00",
    closeTime: "20:00",
    openDays: "จันทร์ - เสาร์",
    submitDate: "15 พ.ย. 2567 14:20 น.",
    docCount: 5,
    status: "อนุมัติแล้ว",
    documents: [
      { id: "doc-006-1", name: "business_license.pdf", type: "pdf", size: "1.2 MB", url: "/mock/doc.pdf" },
      { id: "doc-006-2", name: "id_card.jpg", type: "image", size: "780 KB", url: "/mock/img.jpg" },
      { id: "doc-006-3", name: "commercial.pdf", type: "pdf", size: "1.5 MB", url: "/mock/doc.pdf" },
      { id: "doc-006-4", name: "shop_photo.jpg", type: "image", size: "1.9 MB", url: "/mock/img.jpg" },
      { id: "doc-006-5", name: "contract.pdf", type: "pdf", size: "600 KB", url: "/mock/doc.pdf" },
    ],
  },
  {
    id: "shop-007",
    name: "Document King",
    email: "docking@gmail.com",
    phone: "087-890-1234",
    ownerFirstname: "วารุณี",
    ownerLastname: "ชุ่มใจ",
    shopType: "ร้านถ่ายเอกสารทั่วไป",
    address: "45/2 ถนนนวมินทร์",
    district: "บึงกุ่ม",
    province: "กรุงเทพมหานคร 10240",
    googleMapLink: "https://maps.google.com",
    lineId: "@docking",
    socialUrl: "docking",
    openTime: "07:30",
    closeTime: "19:30",
    openDays: "จันทร์ - เสาร์",
    submitDate: "10 พ.ย. 2567 09:45 น.",
    docCount: 4,
    status: "อนุมัติแล้ว",
    documents: [
      { id: "doc-007-1", name: "business_license.pdf", type: "pdf", size: "1.1 MB", url: "/mock/doc.pdf" },
      { id: "doc-007-2", name: "id_card.jpg", type: "image", size: "820 KB", url: "/mock/img.jpg" },
      { id: "doc-007-3", name: "shop_photo.jpg", type: "image", size: "2.3 MB", url: "/mock/img.jpg" },
      { id: "doc-007-4", name: "tax_cert.pdf", type: "pdf", size: "500 KB", url: "/mock/doc.pdf" },
    ],
  },
  // ไม่อนุมัติ
  {
    id: "shop-008",
    name: "Fake Print",
    email: "fakeprint@gmail.com",
    phone: "088-901-2345",
    ownerFirstname: "ไม่",
    ownerLastname: "ถูกต้อง",
    shopType: "ร้านถ่ายเอกสารทั่วไป",
    address: "999 ถนนไม่มีอยู่จริง",
    district: "ไม่ระบุ",
    province: "กรุงเทพมหานคร",
    googleMapLink: "",
    lineId: "",
    socialUrl: "",
    openTime: "08:00",
    closeTime: "18:00",
    openDays: "จันทร์ - ศุกร์",
    submitDate: "5 พ.ย. 2567 15:00 น.",
    docCount: 2,
    status: "ไม่อนุมัติ",
    rejectedReason: "เอกสารไม่ครบถ้วน และที่อยู่ไม่ตรงกับเอกสาร",
    documents: [
      { id: "doc-008-1", name: "id_card.jpg", type: "image", size: "500 KB", url: "/mock/img.jpg" },
      { id: "doc-008-2", name: "blurry_doc.jpg", type: "image", size: "300 KB", url: "/mock/img.jpg" },
    ],
  },
];

export function getShopById(id: string): MockShop | undefined {
  return mockShops.find((s) => s.id === id);
}

export function getShopsByStatus(status: ShopStatus): MockShop[] {
  return mockShops.filter((s) => s.status === status);
}
