/** สร้างไฟล์ PDF จริง (ใช้งานได้จริงตอนเปิด/ดาวน์โหลด) เป็นตัวอย่างแทนไฟล์งานจริงของลูกค้าที่ยังไม่มีระบบเก็บไฟล์จริง */
export function buildMockPdfBlob(labelText: string): Blob {
  const safeText = labelText.replace(/[()\\]/g, "");
  const contentStream = `BT /F1 14 Tf 40 750 Td (${safeText}) Tj ET`;

  const catalog = "1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n";
  const pages = "2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n";
  const page =
    "3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>\nendobj\n";
  const content = `4 0 obj\n<< /Length ${contentStream.length} >>\nstream\n${contentStream}\nendstream\nendobj\n`;
  const font = "5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n";

  const header = "%PDF-1.4\n";
  const orderedBody = [catalog, pages, page, content, font];

  let pdf = header;
  const offsets: number[] = [0];
  for (const obj of orderedBody) {
    offsets.push(pdf.length);
    pdf += obj;
  }

  const xrefStart = pdf.length;
  let xref = `xref\n0 ${orderedBody.length + 1}\n0000000000 65535 f \n`;
  for (let i = 1; i <= orderedBody.length; i++) {
    xref += `${offsets[i].toString().padStart(10, "0")} 00000 n \n`;
  }
  const trailer = `trailer\n<< /Size ${orderedBody.length + 1} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF`;

  pdf += xref + trailer;

  return new Blob([pdf], { type: "application/pdf" });
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
