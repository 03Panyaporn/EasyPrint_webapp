"use client";

import { useCallback, useEffect, useState } from "react";
import { AlertCircle, CheckCircle2, Cloud, Database, Mail, RefreshCw, Server, XCircle } from "lucide-react";
import type { SystemHealthCheck, SystemHealthResponse } from "@easyprint/shared";
import { getSystemHealth } from "@/lib/api/admin";
import { ApiError } from "@/lib/api/client";
import { Skeleton } from "@/components/ui/Skeleton";
import { formatThaiDateTime, formatUptime } from "./format";

type Health = SystemHealthResponse["health"];

function StatusPill({ ok, okLabel = "ปกติ", failLabel = "มีปัญหา" }: { ok: boolean; okLabel?: string; failLabel?: string }) {
  return ok ? (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
      <CheckCircle2 size={12} /> {okLabel}
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
      <XCircle size={12} /> {failLabel}
    </span>
  );
}

function ServiceCard({
  icon: Icon,
  title,
  description,
  check,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
  check: SystemHealthCheck;
}) {
  return (
    <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-sm space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${check.ok ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"}`}>
            <Icon size={18} />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-800">{title}</p>
            <p className="text-[11px] text-slate-400">{description}</p>
          </div>
        </div>
        <StatusPill ok={check.ok} />
      </div>
      <p className="text-xs text-slate-500">
        {check.ok ? `ตอบสนองใน ${check.latencyMs?.toLocaleString()} ms` : check.error ?? "เชื่อมต่อไม่สำเร็จ"}
      </p>
    </div>
  );
}

export default function SystemHealthTab() {
  const [health, setHealth] = useState<Health | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const fetchHealth = useCallback(async () => {
    setLoading(true);
    setLoadError("");
    try {
      const res = await getSystemHealth();
      setHealth(res.health);
    } catch (err) {
      setLoadError(err instanceof ApiError ? err.message : "ตรวจสอบสถานะระบบไม่สำเร็จ — API อาจไม่ตอบสนอง");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHealth();
  }, [fetchHealth]);

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-3xl border border-slate-200/90 p-5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          {health ? (
            <StatusPill ok={health.status === "ok"} okLabel="ระบบทำงานปกติ" failLabel="บางบริการมีปัญหา" />
          ) : loadError ? (
            <StatusPill ok={false} failLabel="ตรวจสอบไม่ได้" />
          ) : null}
          <p className="text-xs text-slate-400">
            {health ? `ตรวจล่าสุด ${formatThaiDateTime(health.checkedAt)}` : loading ? "กำลังตรวจสอบ..." : ""}
          </p>
        </div>
        <button
          onClick={fetchHealth}
          disabled={loading}
          className="flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-slate-100 text-slate-600 text-xs font-semibold hover:bg-slate-200 disabled:opacity-50 transition"
        >
          <RefreshCw size={13} className={loading ? "animate-spin" : ""} /> ตรวจสอบอีกครั้ง
        </button>
      </div>

      {loadError && (
        <div className="flex items-center gap-3 p-4 rounded-2xl bg-red-50 text-red-600 border border-red-200 text-sm">
          <AlertCircle size={18} className="shrink-0" />
          <span>{loadError}</span>
        </div>
      )}

      {loading && !health ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-sm space-y-3">
              <Skeleton className="h-9 w-40" />
              <Skeleton className="h-3 w-24" />
            </div>
          ))}
        </div>
      ) : health ? (
        <div className={`grid grid-cols-1 md:grid-cols-2 gap-4 transition-opacity ${loading ? "opacity-60" : ""}`}>
          <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-sm space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-emerald-50 text-emerald-600">
                  <Server size={18} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-800">API Server</p>
                  <p className="text-[11px] text-slate-400">ระบบหลังบ้าน (ElysiaJS)</p>
                </div>
              </div>
              <StatusPill ok />
            </div>
            <dl className="grid grid-cols-3 gap-2 text-xs">
              <div>
                <dt className="text-slate-400">ทำงานต่อเนื่อง</dt>
                <dd className="font-semibold text-slate-700">{formatUptime(health.api.uptimeSeconds)}</dd>
              </div>
              <div>
                <dt className="text-slate-400">หน่วยความจำ</dt>
                <dd className="font-semibold text-slate-700">{health.api.memoryMb.toLocaleString()} MB</dd>
              </div>
              <div>
                <dt className="text-slate-400">สภาพแวดล้อม</dt>
                <dd className="font-semibold text-slate-700">{health.api.environment}</dd>
              </div>
            </dl>
            <p className="text-[11px] text-slate-400">
              {health.api.runtime} — ถ้าค่า &quot;ทำงานต่อเนื่อง&quot; สั้นมาก แปลว่าเซิร์ฟเวอร์เพิ่งตื่นจาก sleep (Render free tier) หรือเพิ่ง restart
            </p>
          </div>

          <ServiceCard icon={Database} title="ฐานข้อมูล" description="Supabase (PostgreSQL)" check={health.database} />
          <ServiceCard icon={Cloud} title="พื้นที่จัดเก็บไฟล์" description="Cloudflare R2" check={health.storage} />

          <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-sm space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center ${health.email.configured ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600"}`}
                >
                  <Mail size={18} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-800">ระบบส่งอีเมล</p>
                  <p className="text-[11px] text-slate-400">Resend</p>
                </div>
              </div>
              {health.email.configured ? (
                <StatusPill ok okLabel="ตั้งค่าแล้ว" />
              ) : (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                  <AlertCircle size={12} /> ยังไม่ได้ตั้งค่า
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500">
              {health.email.configured
                ? "ตรวจเฉพาะการตั้งค่า API key — ไม่ได้ส่งอีเมลทดสอบจริง"
                : "ไม่มี RESEND_API_KEY — อีเมลรีเซ็ตรหัสผ่านจะไม่ถูกส่งถึงผู้ใช้จริง"}
            </p>
          </div>
        </div>
      ) : null}
    </div>
  );
}
