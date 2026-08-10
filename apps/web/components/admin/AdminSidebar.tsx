"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useState } from "react";
import {
  LayoutDashboard,
  Store,
  ShieldCheck,
  HardDrive,
  Settings,
  PhoneCall,
  Bell,
  ChevronLeft,
  ChevronRight,
  X,
  Printer,
  LogOut,
} from "lucide-react";

// ─────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────
type NavItem = {
  label: string;
  href: string;
  icon: React.ElementType;
};

export interface AdminSidebarProps {
  mobileOpen: boolean;
  onMobileClose: () => void;
}

// ─────────────────────────────────────────────────
// Menu definition
// ─────────────────────────────────────────────────
const navItems: NavItem[] = [
  { label: "หน้าหลัก", href: "/admin", icon: LayoutDashboard },
  { label: "ตรวจสอบร้านค้า", href: "/admin/shops", icon: ShieldCheck },
  { label: "จัดการร้านค้า", href: "/admin/manage", icon: Store },
  { label: "จัดการไฟล์และพื้นที่จัดเก็บ", href: "/admin/storage", icon: HardDrive },
  { label: "ตั้งค่าระบบ", href: "/admin/settings", icon: Settings },
  { label: "ติดต่อสอบถาม", href: "/admin/contact", icon: PhoneCall },
];

// ─────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────
export default function AdminSidebar({ mobileOpen, onMobileClose }: AdminSidebarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [logoutOpen, setLogoutOpen] = useState(false);
  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });

      router.replace("/");
      router.refresh();
    } catch (err) {
      console.error(err);
    }
  };
  const isActive = (href: string) => {
    if (href === "/admin") return pathname === "/admin";
    return pathname === href || pathname.startsWith(href + "/");
  };

  // ── Nav Link ──────────────────────────────────
  const NavLink = ({ label, href, icon: Icon }: NavItem) => {
    const active = isActive(href);
    return (
      <Link
        href={href}
        onClick={onMobileClose}
        title={collapsed ? label : undefined}
        className={[
          "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 group relative",
          collapsed ? "justify-center" : "",
          active
            ? "bg-white/20 text-white font-semibold shadow-sm"
            : "text-white/70 hover:bg-white/10 hover:text-white",
        ].join(" ")}
      >
        <Icon
          size={20}
          className={`shrink-0 ${active ? "text-white" : "text-white/70 group-hover:text-white"}`}
        />

        {!collapsed && <span className="flex-1 truncate">{label}</span>}

        {/* Active indicator bar */}
        {active && !collapsed && (
          <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-white rounded-r-full" />
        )}

        {/* Tooltip when collapsed */}
        {collapsed && (
          <span className="pointer-events-none absolute left-full ml-3 z-50 whitespace-nowrap rounded-lg bg-gray-900 px-2.5 py-1.5 text-xs text-white opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-150 shadow-lg">
            {label}
            <span className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-gray-900" />
          </span>
        )}
      </Link>
    );
  };

  // ── Sidebar content ────────────────────────────
  const content = (
    <div
      className={`flex flex-col h-full bg-[#F46A2F] transition-all duration-300 ${collapsed ? "w-[72px]" : "w-64"
        }`}
    >
      {/* Logo + toggle */}
      <div
        className={`flex items-center h-16 px-4 border-b border-white/20 shrink-0 ${collapsed ? "justify-center" : "justify-between"
          }`}
      >
        {!collapsed ? (
          <Link href="/admin" className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-white/20 rounded-xl flex items-center justify-center shadow-md backdrop-blur">
              <Printer size={16} className="text-white" />
            </div>
            <div className="leading-tight">
              <span className="font-black text-white text-base tracking-wide">
                EASY<span className="opacity-80">PRINT</span>
              </span>
              <p className="text-[10px] text-white/60 font-medium tracking-widest uppercase -mt-0.5">
                Admin
              </p>
            </div>
          </Link>
        ) : (
          <Link href="/admin">
            <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center shadow-md">
              <Printer size={18} className="text-white" />
            </div>
          </Link>
        )}

        {/* Desktop collapse button */}
        <button
          onClick={() => setCollapsed((c) => !c)}
          className="hidden lg:flex items-center justify-center w-7 h-7 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors shrink-0"
          aria-label={collapsed ? "ขยาย sidebar" : "ย่อ sidebar"}
        >
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>

        {/* Mobile close */}
        <button
          onClick={onMobileClose}
          className="flex lg:hidden items-center justify-center w-7 h-7 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors"
        >
          <X size={16} />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        {navItems.map((item) => (
          <NavLink key={item.href} {...item} />
        ))}
      </nav>

      {/* Footer: logout */}
      <div className={`px-3 py-4 border-t border-white/20 shrink-0 ${collapsed ? "flex justify-center" : ""}`}>
        <button
          onClick={() => setLogoutOpen(true)}
          className={[
            "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-white/70 hover:bg-white/10 hover:text-white transition-all group w-full relative",
            collapsed ? "justify-center" : "",
          ].join(" ")}
          title={collapsed ? "ออกจากระบบ" : undefined}
        >
          <LogOut size={20} className="shrink-0 text-white/70 group-hover:text-white" />
          {!collapsed && <span>ออกจากระบบ</span>}
          {collapsed && (
            <span className="pointer-events-none absolute left-full ml-3 z-50 whitespace-nowrap rounded-lg bg-gray-900 px-2.5 py-1.5 text-xs text-white opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all shadow-lg">
              ออกจากระบบ
            </span>
          )}
        </button>
      </div>
    </div>

  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex h-screen sticky top-0 shrink-0">{content}</aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 lg:hidden"
          onClick={onMobileClose}
          aria-hidden="true"
        />
      )}

      {/* Mobile drawer */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 lg:hidden flex h-full transition-transform duration-300 ${mobileOpen ? "translate-x-0" : "-translate-x-full"
          }`}
      >
        {content}
      </aside>
      {logoutOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 animate-in fade-in zoom-in">

            <div className="flex justify-center mb-4">
              <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center">
                <LogOut size={32} className="text-red-500" />
              </div>
            </div>

            <h3 className="text-xl font-bold text-gray-900 text-center mb-2">
              ออกจากระบบ
            </h3>

            <p className="text-gray-600 text-center mb-6">
              คุณต้องการออกจากระบบใช่หรือไม่?
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => setLogoutOpen(false)}
                className="flex-1 py-3 px-4 bg-gray-50 text-gray-700 font-semibold rounded-xl hover:bg-gray-100 transition-colors"
              >
                ยกเลิก
              </button>

              <button
                onClick={() => {
                  setLogoutOpen(false);
                  handleLogout();
                }}
                className="flex-1 py-3 px-4 bg-red-500 text-white font-semibold rounded-xl hover:bg-red-600 transition-colors shadow-md"
              >
                ออกจากระบบ
              </button>
            </div>

          </div>
        </div>
      )}
    </>
  );
}
