// ตัวช่วยจัดรูปแบบข้อมูลในหน้าจัดการบัญชีลูกค้า (/admin/users)

export function formatThaiDate(iso: string | null | undefined) {
  if (!iso) return "-";
  return new Date(iso).toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "numeric" });
}

export function formatBaht(amount: number | null | undefined) {
  if (amount === null || amount === undefined) return "-";
  return `฿${amount.toLocaleString("th-TH", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}

export function customerFullName(c: { firstname: string; lastname: string }) {
  return `${c.firstname} ${c.lastname}`.trim();
}
