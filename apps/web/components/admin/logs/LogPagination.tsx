import { ChevronLeft, ChevronRight } from "lucide-react";

// แถบเปลี่ยนหน้าใต้ตาราง — รูปแบบเดียวกับหน้าจัดการบัญชีผู้ใช้ (/admin/users)
export default function LogPagination({
  page,
  totalPages,
  total,
  loading,
  onChange,
}: {
  page: number;
  totalPages: number;
  total: number;
  loading: boolean;
  onChange: (page: number) => void;
}) {
  return (
    <div className="flex items-center justify-between px-5 py-4 border-t border-slate-100 bg-slate-50/50">
      <span className="text-xs text-slate-500">
        หน้า {page} จาก {totalPages} • ทั้งหมด {total.toLocaleString()} รายการ
      </span>
      <div className="flex items-center gap-1.5">
        <button
          disabled={page <= 1 || loading}
          onClick={() => onChange(page - 1)}
          aria-label="หน้าก่อนหน้า"
          className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-40 transition"
        >
          <ChevronLeft size={16} />
        </button>
        <button
          disabled={page >= totalPages || loading}
          onClick={() => onChange(page + 1)}
          aria-label="หน้าถัดไป"
          className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-40 transition"
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}
