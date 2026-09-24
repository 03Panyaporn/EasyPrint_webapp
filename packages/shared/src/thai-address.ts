import rawData from "./data/thai-address.json";

// ข้อมูลตำบล/อำเภอ/จังหวัด/รหัสไปรษณีย์ทั้งประเทศ (7,452 ตำบล) — แปลงมาจาก
// https://github.com/kongvut/thai-province-data (data/raw) ครั้งเดียวตอน build,
// ไม่พึ่งพา API ภายนอกตอน runtime คีย์ย่อ z/s/d/p เพื่อลดขนาดไฟล์ JSON ที่ bundle
type RawRow = { z: string; s: string; d: string; p: string };

export type ThaiAddressEntry = {
  subdistrict: string;
  district: string;
  province: string;
  postalCode: string;
};

const data = rawData as RawRow[];

// รหัสไปรษณีย์เดียวกันอาจตรงกับหลายตำบล (คนละอำเภอ/จังหวัดก็มี) — ต้องให้ผู้ใช้เลือกเองว่าใช่ตำบลไหน
export function lookupByPostalCode(postalCode: string): ThaiAddressEntry[] {
  const code = postalCode.trim();
  if (!/^\d{5}$/.test(code)) return [];

  return data
    .filter((row) => row.z === code)
    .map((row) => ({
      subdistrict: row.s,
      district: row.d,
      province: row.p,
      postalCode: row.z,
    }));
}
