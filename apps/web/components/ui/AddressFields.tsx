"use client";

import { useEffect, useMemo } from "react";
import { lookupByPostalCode } from "@easyprint/shared";

export interface AddressFieldsValue {
  postalCode: string;
  subdistrict: string;
  district: string;
  province: string;
}

interface AddressFieldsProps {
  value: AddressFieldsValue;
  onChange: (next: AddressFieldsValue) => void;
  disabled?: boolean;
  inputClassName: string;
  labelClassName?: string;
}

// กรอกรหัสไปรษณีย์ก่อน แล้วเลือกอำเภอ/ตำบลจาก dropdown ที่กรองตามรหัสนั้น จังหวัดเติมให้อัตโนมัติ
// ใช้ร่วมกันทั้งฟอร์มที่อยู่ลูกค้าและร้านค้า (ดู thai-address.ts ใน packages/shared สำหรับ dataset)
// รหัสไปรษณีย์ที่ไม่พบในฐานข้อมูล (พื้นที่ใหม่/พิเศษ) ตกกลับไปเป็นกรอกตำบล/อำเภอ/จังหวัดเองแบบเดิม
export default function AddressFields({
  value,
  onChange,
  disabled,
  inputClassName,
  labelClassName = "mb-1 block text-xs font-medium text-slate-600",
}: AddressFieldsProps) {
  const matches = useMemo(() => lookupByPostalCode(value.postalCode), [value.postalCode]);
  const postalCodeComplete = /^\d{5}$/.test(value.postalCode.trim());
  const notFound = postalCodeComplete && matches.length === 0;

  const districtOptions = useMemo(() => {
    const seen = new Map<string, string>(); // district -> province
    for (const m of matches) seen.set(m.district, m.province);
    return Array.from(seen.entries()).map(([district, province]) => ({ district, province }));
  }, [matches]);

  const subdistrictOptions = useMemo(
    () => matches.filter((m) => m.district === value.district).map((m) => m.subdistrict),
    [matches, value.district]
  );

  // auto-fill เมื่อรหัสไปรษณีย์นี้มีตัวเลือกเดียว ไม่ต้องให้ผู้ใช้กด dropdown ที่มีตัวเลือกเดียวซ้ำ
  useEffect(() => {
    if (districtOptions.length === 1 && value.district !== districtOptions[0].district) {
      onChange({ ...value, district: districtOptions[0].district, province: districtOptions[0].province, subdistrict: "" });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [districtOptions]);

  useEffect(() => {
    if (subdistrictOptions.length === 1 && value.subdistrict !== subdistrictOptions[0]) {
      onChange({ ...value, subdistrict: subdistrictOptions[0] });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subdistrictOptions]);

  const handlePostalCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const postalCode = e.target.value.replace(/\D/g, "").slice(0, 5);
    onChange({ postalCode, subdistrict: "", district: "", province: "" });
  };

  const handleDistrictChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const district = e.target.value;
    const match = districtOptions.find((d) => d.district === district);
    onChange({ ...value, district, province: match?.province ?? "", subdistrict: "" });
  };

  const handleSubdistrictChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onChange({ ...value, subdistrict: e.target.value });
  };

  const handleManualChange = (field: "subdistrict" | "district" | "province") => (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange({ ...value, [field]: e.target.value });
  };

  return (
    <div className="space-y-3">
      <div>
        <label className={labelClassName}>รหัสไปรษณีย์</label>
        <input
          type="text"
          inputMode="numeric"
          value={value.postalCode}
          onChange={handlePostalCodeChange}
          placeholder="เช่น 10200"
          maxLength={5}
          disabled={disabled}
          className={inputClassName}
        />
        {notFound && (
          <p className="mt-1 text-xs text-amber-600">
            ไม่พบข้อมูลรหัสไปรษณีย์นี้ในระบบ กรุณากรอกตำบล/อำเภอ/จังหวัดด้วยตนเอง
          </p>
        )}
      </div>

      {!notFound && postalCodeComplete && districtOptions.length > 0 ? (
        <>
          <div>
            <label className={labelClassName}>อำเภอ / เขต</label>
            <select
              value={value.district}
              onChange={handleDistrictChange}
              disabled={disabled}
              className={inputClassName}
            >
              <option value="">เลือกอำเภอ / เขต</option>
              {districtOptions.map((d) => (
                <option key={d.district} value={d.district}>
                  {d.district}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className={labelClassName}>ตำบล / แขวง</label>
            <select
              value={value.subdistrict}
              onChange={handleSubdistrictChange}
              disabled={disabled || !value.district}
              className={inputClassName}
            >
              <option value="">เลือกตำบล / แขวง</option>
              {subdistrictOptions.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className={labelClassName}>จังหวัด</label>
            <input type="text" value={value.province} disabled readOnly className={`${inputClassName} bg-slate-100 text-slate-500`} />
          </div>
        </>
      ) : (
        <>
          <div>
            <label className={labelClassName}>ตำบล / แขวง</label>
            <input
              type="text"
              value={value.subdistrict}
              onChange={handleManualChange("subdistrict")}
              disabled={disabled}
              className={inputClassName}
            />
          </div>
          <div>
            <label className={labelClassName}>อำเภอ / เขต</label>
            <input
              type="text"
              value={value.district}
              onChange={handleManualChange("district")}
              disabled={disabled}
              className={inputClassName}
            />
          </div>
          <div>
            <label className={labelClassName}>จังหวัด</label>
            <input
              type="text"
              value={value.province}
              onChange={handleManualChange("province")}
              disabled={disabled}
              className={inputClassName}
            />
          </div>
        </>
      )}
    </div>
  );
}
