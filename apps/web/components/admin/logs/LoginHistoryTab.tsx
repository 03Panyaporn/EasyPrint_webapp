"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AlertCircle, CheckCircle2, LogIn, RefreshCw, Search, X, XCircle } from "lucide-react";
import type { AdminLoginHistoryListResponse, AdminLoginHistoryQuery } from "@easyprint/shared";
import { listAdminLoginHistory } from "@/lib/api/admin";
import { ApiError } from "@/lib/api/client";
import { SkeletonRow } from "@/components/ui/Skeleton";
import LogPagination from "./LogPagination";
import { FAILURE_REASON_LABEL, ROLE_LABEL, describeUserAgent, formatThaiDateTime } from "./format";

const PAGE_SIZE = 20;
const SEARCH_DEBOUNCE_MS = 350;

export default function LoginHistoryTab() {
  const [data, setData] = useState<AdminLoginHistoryListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [status, setStatus] = useState<AdminLoginHistoryQuery["status"]>("all");
  const [role, setRole] = useState<AdminLoginHistoryQuery["role"]>("all");
  const [page, setPage] = useState(1);
  // กัน response เก่าที่ตอบกลับช้ามาทับผลการค้นหาล่าสุด
  const requestSeq = useRef(0);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search.trim()), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [search]);

  const fetchLogins = useCallback(async () => {
    const seq = ++requestSeq.current;
    setLoading(true);
    setLoadError("");
    try {
      const res = await listAdminLoginHistory({ q: debouncedSearch || undefined, status, role, page, pageSize: PAGE_SIZE });
      if (seq !== requestSeq.current) return;
      setData(res);
    } catch (err) {
      if (seq !== requestSeq.current) return;
      setLoadError(err instanceof ApiError ? err.message : "โหลดประวัติการเข้าสู่ระบบไม่สำเร็จ");
    } finally {
      if (seq === requestSeq.current) setLoading(false);
    }
  }, [debouncedSearch, status, role, page]);

  useEffect(() => {
    fetchLogins();
  }, [fetchLogins]);

  const logins = data?.logins ?? [];
  const hasFilter = !!debouncedSearch || status !== "all" || role !== "all";

  return (
    <div className="space-y-4">
      {loadError && (
        <div className="flex flex-wrap items-center gap-3 p-4 rounded-2xl bg-red-50 text-red-600 border border-red-200 text-sm">
          <AlertCircle size={18} className="shrink-0" />
          <span className="flex-1 min-w-0">{loadError}</span>
          <button
            onClick={fetchLogins}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-red-200 text-xs font-semibold hover:bg-red-100 transition"
          >
            <RefreshCw size={13} /> ลองใหม่
          </button>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-sm space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400">เข้าสู่ระบบสำเร็จ (24 ชม.)</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 size={16} />
            </div>
          </div>
          <p className="text-2xl font-bold text-emerald-600">{data ? data.last24h.success.toLocaleString() : "-"}</p>
        </div>
        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-sm space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400">เข้าสู่ระบบล้มเหลว (24 ชม.)</span>
            <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <XCircle size={16} />
            </div>
          </div>
          <p className="text-2xl font-bold text-rose-600">{data ? data.last24h.failed.toLocaleString() : "-"}</p>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200/90 p-5 shadow-sm flex flex-col lg:flex-row items-stretch lg:items-center gap-3">
        <div className="relative flex-1">
          <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            maxLength={100}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="ค้นหาอีเมล หรือ IP..."
            aria-label="ค้นหาประวัติการเข้าสู่ระบบ"
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-9 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-orange-500 focus:bg-white transition"
          />
          {search && (
            <button
              onClick={() => {
                setSearch("");
                setPage(1);
              }}
              aria-label="ล้างคำค้นหา"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X size={15} />
            </button>
          )}
        </div>
        <div className="flex flex-wrap gap-3">
          <select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value as AdminLoginHistoryQuery["status"]);
              setPage(1);
            }}
            aria-label="กรองตามผลการเข้าสู่ระบบ"
            className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-medium text-slate-700 focus:outline-none focus:border-orange-500 cursor-pointer"
          >
            <option value="all">ผลทั้งหมด</option>
            <option value="success">สำเร็จ</option>
            <option value="failed">ล้มเหลว</option>
          </select>
          <select
            value={role}
            onChange={(e) => {
              setRole(e.target.value as AdminLoginHistoryQuery["role"]);
              setPage(1);
            }}
            aria-label="กรองตามประเภทบัญชี"
            className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-medium text-slate-700 focus:outline-none focus:border-orange-500 cursor-pointer"
          >
            <option value="all">ทุกประเภทบัญชี</option>
            <option value="customer">ลูกค้า</option>
            <option value="shop_owner">ร้านค้า</option>
            <option value="admin">แอดมิน</option>
          </select>
          <button
            onClick={fetchLogins}
            disabled={loading}
            className="flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-slate-100 text-slate-600 text-xs font-semibold hover:bg-slate-200 disabled:opacity-50 transition"
          >
            <RefreshCw size={13} className={loading ? "animate-spin" : ""} /> รีเฟรช
          </button>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden">
        {loading && !data ? (
          <div className="divide-y divide-slate-100" aria-live="polite" aria-busy="true">
            {Array.from({ length: 6 }).map((_, i) => (
              <SkeletonRow key={i} />
            ))}
          </div>
        ) : logins.length === 0 ? (
          <div className="text-center py-16 px-4">
            <LogIn size={40} className="mx-auto text-slate-300 mb-3" />
            <p className="text-slate-700 font-medium text-base">
              {hasFilter ? "ไม่พบประวัติการเข้าสู่ระบบตรงตามเงื่อนไข" : "ยังไม่มีประวัติการเข้าสู่ระบบ"}
            </p>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              {hasFilter ? "ลองเปลี่ยนคำค้นหาหรือตัวกรองใหม่" : "ระบบจะบันทึกทุกครั้งที่มีการเข้าสู่ระบบ ทั้งสำเร็จและล้มเหลว"}
            </p>
          </div>
        ) : (
          <div className={`overflow-x-auto transition-opacity ${loading ? "opacity-60" : ""}`} aria-busy={loading}>
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200/80 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  <th className="py-3.5 px-5">เวลา</th>
                  <th className="py-3.5 px-4">อีเมล</th>
                  <th className="py-3.5 px-4">ประเภทบัญชี</th>
                  <th className="py-3.5 px-4">ผล</th>
                  <th className="py-3.5 px-4">IP / อุปกรณ์</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {logins.map((login) => (
                  <tr key={login.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3.5 px-5 whitespace-nowrap text-xs text-slate-600">{formatThaiDateTime(login.createdAt)}</td>
                    <td className="py-3.5 px-4">
                      <p className="text-sm text-slate-800 truncate max-w-[16rem]" title={login.email}>
                        {login.email}
                      </p>
                      {!login.userId && <p className="text-[11px] text-slate-400">ไม่พบบัญชีนี้ในระบบ</p>}
                    </td>
                    <td className="py-3.5 px-4 text-xs whitespace-nowrap">{login.role ? ROLE_LABEL[login.role] : "-"}</td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {login.success ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <CheckCircle2 size={12} /> สำเร็จ
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                          <XCircle size={12} /> {login.failureReason ? FAILURE_REASON_LABEL[login.failureReason] : "ล้มเหลว"}
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-xs">
                      <p className="font-mono text-slate-600">{login.ipAddress ?? "-"}</p>
                      <p className="text-slate-400" title={login.userAgent ?? undefined}>
                        {describeUserAgent(login.userAgent)}
                      </p>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {data && data.pagination.totalPages > 1 && logins.length > 0 && (
          <LogPagination
            page={data.pagination.page}
            totalPages={data.pagination.totalPages}
            total={data.pagination.total}
            loading={loading}
            onChange={setPage}
          />
        )}
      </div>
    </div>
  );
}
