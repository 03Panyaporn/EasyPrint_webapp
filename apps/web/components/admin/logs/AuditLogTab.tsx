"use client";

import { Fragment, useCallback, useEffect, useRef, useState } from "react";
import { AlertCircle, ChevronDown, ChevronUp, ClipboardList, RefreshCw, Search, X } from "lucide-react";
import { AUDIT_ACTIONS, type AdminAuditLogListResponse, type AuditAction } from "@easyprint/shared";
import { listAdminAuditLogs } from "@/lib/api/admin";
import { ApiError } from "@/lib/api/client";
import { SkeletonRow } from "@/components/ui/Skeleton";
import LogPagination from "./LogPagination";
import { TARGET_TYPE_LABEL, auditActionLabel, describeUserAgent, formatThaiDateTime } from "./format";

const PAGE_SIZE = 20;
const SEARCH_DEBOUNCE_MS = 350;

export default function AuditLogTab() {
  const [data, setData] = useState<AdminAuditLogListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [action, setAction] = useState<AuditAction | "">("");
  const [page, setPage] = useState(1);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  // กัน response เก่าที่ตอบกลับช้ามาทับผลการค้นหาล่าสุด
  const requestSeq = useRef(0);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search.trim()), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [search]);

  const fetchLogs = useCallback(async () => {
    const seq = ++requestSeq.current;
    setLoading(true);
    setLoadError("");
    try {
      const res = await listAdminAuditLogs({ q: debouncedSearch || undefined, action: action || undefined, page, pageSize: PAGE_SIZE });
      if (seq !== requestSeq.current) return;
      setData(res);
    } catch (err) {
      if (seq !== requestSeq.current) return;
      setLoadError(err instanceof ApiError ? err.message : "โหลดประวัติการทำรายการไม่สำเร็จ");
    } finally {
      if (seq === requestSeq.current) setLoading(false);
    }
  }, [debouncedSearch, action, page]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const logs = data?.logs ?? [];
  const hasFilter = !!debouncedSearch || !!action;

  return (
    <div className="space-y-4">
      {loadError && (
        <div className="flex flex-wrap items-center gap-3 p-4 rounded-2xl bg-red-50 text-red-600 border border-red-200 text-sm">
          <AlertCircle size={18} className="shrink-0" />
          <span className="flex-1 min-w-0">{loadError}</span>
          <button
            onClick={fetchLogs}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-red-200 text-xs font-semibold hover:bg-red-100 transition"
          >
            <RefreshCw size={13} /> ลองใหม่
          </button>
        </div>
      )}

      <div className="bg-white rounded-3xl border border-slate-200/90 p-5 shadow-sm flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
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
            placeholder="ค้นหาอีเมลแอดมิน หรือรหัสข้อมูลที่ถูกแก้..."
            aria-label="ค้นหาประวัติการทำรายการ"
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
        <select
          value={action}
          onChange={(e) => {
            setAction(e.target.value as AuditAction | "");
            setPage(1);
          }}
          aria-label="กรองตามประเภทการทำรายการ"
          className="bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-medium text-slate-700 focus:outline-none focus:border-orange-500 cursor-pointer"
        >
          <option value="">การทำรายการทั้งหมด</option>
          {(Object.entries(AUDIT_ACTIONS) as [AuditAction, string][]).map(([key, label]) => (
            <option key={key} value={key}>
              {label}
            </option>
          ))}
        </select>
        <button
          onClick={fetchLogs}
          disabled={loading}
          className="flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-slate-100 text-slate-600 text-xs font-semibold hover:bg-slate-200 disabled:opacity-50 transition"
        >
          <RefreshCw size={13} className={loading ? "animate-spin" : ""} /> รีเฟรช
        </button>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden">
        {loading && !data ? (
          <div className="divide-y divide-slate-100" aria-live="polite" aria-busy="true">
            {Array.from({ length: 6 }).map((_, i) => (
              <SkeletonRow key={i} />
            ))}
          </div>
        ) : logs.length === 0 ? (
          <div className="text-center py-16 px-4">
            <ClipboardList size={40} className="mx-auto text-slate-300 mb-3" />
            <p className="text-slate-700 font-medium text-base">
              {hasFilter ? "ไม่พบประวัติการทำรายการตรงตามเงื่อนไข" : "ยังไม่มีประวัติการทำรายการ"}
            </p>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              {hasFilter
                ? "ลองเปลี่ยนคำค้นหา หรือเลือกประเภทการทำรายการใหม่"
                : "ระบบจะบันทึกทุกครั้งที่แอดมินแก้ไขข้อมูล เช่น อนุมัติร้าน ระงับบัญชี แก้การตั้งค่า หรือลบไฟล์"}
            </p>
          </div>
        ) : (
          <div className={`overflow-x-auto transition-opacity ${loading ? "opacity-60" : ""}`} aria-busy={loading}>
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200/80 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  <th className="py-3.5 px-5">เวลา</th>
                  <th className="py-3.5 px-4">แอดมิน</th>
                  <th className="py-3.5 px-4">การทำรายการ</th>
                  <th className="py-3.5 px-4">ข้อมูลที่เกี่ยวข้อง</th>
                  <th className="py-3.5 px-4">IP / อุปกรณ์</th>
                  <th className="py-3.5 px-4 text-right">รายละเอียด</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {logs.map((log) => {
                  const expanded = expandedId === log.id;
                  return (
                    <Fragment key={log.id}>
                      <tr className="hover:bg-slate-50/60 transition-colors align-top">
                        <td className="py-3.5 px-5 whitespace-nowrap text-xs text-slate-600">{formatThaiDateTime(log.createdAt)}</td>
                        <td className="py-3.5 px-4">
                          <p className="text-sm font-semibold text-slate-800">{log.actorName ?? "(บัญชีถูกลบแล้ว)"}</p>
                          <p className="text-xs text-slate-400 truncate max-w-[14rem]" title={log.actorEmail}>
                            {log.actorEmail}
                          </p>
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-orange-50 text-orange-700 border border-orange-200">
                            {auditActionLabel(log.action)}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-xs">
                          <p className="text-slate-700">{log.targetType ? (TARGET_TYPE_LABEL[log.targetType] ?? log.targetType) : "-"}</p>
                          {log.targetId && (
                            <p className="font-mono text-[11px] text-slate-400 truncate max-w-[12rem]" title={log.targetId}>
                              {log.targetId}
                            </p>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-xs">
                          <p className="font-mono text-slate-600">{log.ipAddress ?? "-"}</p>
                          <p className="text-slate-400" title={log.userAgent ?? undefined}>
                            {describeUserAgent(log.userAgent)}
                          </p>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          {log.details ? (
                            <button
                              onClick={() => setExpandedId(expanded ? null : log.id)}
                              aria-expanded={expanded}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-100 text-slate-600 text-xs font-semibold hover:bg-slate-200 transition"
                            >
                              {expanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                              {expanded ? "ซ่อน" : "ดู"}
                            </button>
                          ) : (
                            <span className="text-xs text-slate-300">-</span>
                          )}
                        </td>
                      </tr>
                      {expanded && log.details && (
                        <tr className="bg-slate-50/70">
                          <td colSpan={6} className="px-5 py-3">
                            <pre className="text-[11px] leading-relaxed text-slate-600 whitespace-pre-wrap break-all font-mono bg-white border border-slate-200 rounded-xl p-3 max-h-64 overflow-auto">
                              {JSON.stringify(log.details, null, 2)}
                            </pre>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        {data && data.pagination.totalPages > 1 && logs.length > 0 && (
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
