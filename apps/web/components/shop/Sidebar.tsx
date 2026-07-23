"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  LayoutDashboard,
  ShoppingBag,
  MessageSquare,
  BarChart2,
  Wrench,
  Store,
  Settings,
  PhoneCall,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  X,
  Printer,
} from "lucide-react";

// ─────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────
type NavLeaf = {
  kind: "leaf";
  label: string;
  href: string;
  icon: React.ElementType;
  /** แสดง > ด้านขวา เผื่อ sub-menu ในอนาคต */
  futureDropdown?: boolean;
};

type NavSection = {
  kind: "section";
  label: string;
  icon: React.ElementType;
  children: { label: string; href: string; icon: React.ElementType }[];
};

type NavItem = NavLeaf | NavSection;

export interface SidebarProps {
  mobileOpen: boolean;
  onMobileClose: () => void;
}

// ─────────────────────────────────────────────────
// Menu definition — ตาม spec ที่กำหนด
// ─────────────────────────────────────────────────
const navItems: NavItem[] = [
  {
    kind: "leaf",
    label: "หน้าหลัก",
    href: "/shop/dashboard",
    icon: LayoutDashboard,
  },
  {
    kind: "leaf",
    label: "รายการคำสั่งซื้อ",
    href: "/shop/orders",
    icon: ShoppingBag,
    futureDropdown: true,
  },
  {
    kind: "leaf",
    label: "แชท",
    href: "/shop/chat",
    icon: MessageSquare,
  },
  {
    kind: "leaf",
    label: "รายงาน",
    href: "/shop/reports",
    icon: BarChart2,
  },
  // ── Section: จัดการร้าน ─────────────────────────
  {
    kind: "section",
    label: "จัดการร้าน",
    icon: Store,
    children: [
      { label: "บริการและราคา", href: "/shop/services", icon: Wrench },
      { label: "โปรไฟล์ร้าน", href: "/shop/profile", icon: Store },
    ],
  },
  // ── Section: ระบบ ───────────────────────────────
  {
    kind: "section",
    label: "ระบบ",
    icon: Settings,
    children: [
      { label: "ตั้งค่า", href: "/shop/settings", icon: Settings },
      { label: "ติดต่อแอดมิน", href: "/shop/contact-admin", icon: PhoneCall },
    ],
  },
];

// ─────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────
export default function Sidebar({ mobileOpen, onMobileClose }: SidebarProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  /** เปิด section ที่มี active child อยู่โดยอัตโนมัติตอน mount */
  const getInitialSections = () => {
    const map: Record<string, boolean> = {};
    for (const item of navItems) {
      if (item.kind === "section") {
        map[item.label] = item.children.some((c) => pathname.startsWith(c.href));
      }
    }
    return map;
  };

  const [openSections, setOpenSections] = useState<Record<string, boolean>>(
    getInitialSections
  );

  const toggle = (label: string) =>
    setOpenSections((prev) => ({ ...prev, [label]: !prev[label] }));

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(href + "/");

  const sectionHasActive = (children: { href: string }[]) =>
    children.some((c) => isActive(c.href));

  // ── Leaf link ──────────────────────────────────
  const LeafLink = ({
    label,
    href,
    icon: Icon,
    futureDropdown,
    indented = false,
  }: {
    label: string;
    href: string;
    icon: React.ElementType;
    futureDropdown?: boolean;
    indented?: boolean;
  }) => {
    const active = isActive(href);
    return (
      <Link
        href={href}
        onClick={onMobileClose}
        title={collapsed && !indented ? label : undefined}
        className={[
          "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 group relative",
          indented ? "pl-10" : "",
          collapsed && !indented ? "justify-center" : "",
          active
            ? "bg-orange-500 text-white shadow-md shadow-orange-200"
            : "text-gray-600 hover:bg-orange-50 hover:text-orange-600",
        ].join(" ")}
      >
        <Icon
          size={indented ? 16 : 20}
          className={`shrink-0 ${
            active
              ? "text-white"
              : "text-gray-400 group-hover:text-orange-500"
          }`}
        />

        {/* Label (hidden when collapsed and not indented) */}
        {(!collapsed || indented) && (
          <span className="flex-1 truncate">{label}</span>
        )}

        {/* Future dropdown arrow */}
        {futureDropdown && !collapsed && (
          <ChevronRight
            size={14}
            className={`shrink-0 ${
              active ? "text-white/70" : "text-gray-300"
            }`}
          />
        )}

        {/* Tooltip when collapsed */}
        {collapsed && !indented && (
          <span className="pointer-events-none absolute left-full ml-3 z-50 whitespace-nowrap rounded-lg bg-gray-900 px-2.5 py-1.5 text-xs text-white opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-150 shadow-lg">
            {label}
            <span className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-gray-900" />
          </span>
        )}
      </Link>
    );
  };

  // ── Section (collapsible group) ────────────────
  const Section = ({ label, icon: Icon, children }: NavSection) => {
    const isOpen = openSections[label] ?? false;
    const active = sectionHasActive(children);

    return (
      <div>
        {/* Section header button */}
        <button
          onClick={() => !collapsed && toggle(label)}
          title={collapsed ? label : undefined}
          className={[
            "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all duration-150 group relative",
            collapsed ? "justify-center" : "",
            active && collapsed
              ? "bg-orange-50 text-orange-600"
              : "text-gray-500 hover:bg-gray-50 hover:text-gray-700",
          ].join(" ")}
        >
          <Icon
            size={20}
            className={`shrink-0 ${
              active ? "text-orange-500" : "text-gray-400 group-hover:text-gray-600"
            }`}
          />
          {!collapsed && (
            <>
              <span className="flex-1 text-left truncate">{label}</span>
              <ChevronDown
                size={14}
                className={`shrink-0 text-gray-400 transition-transform duration-200 ${
                  isOpen ? "rotate-180" : ""
                }`}
              />
            </>
          )}
          {/* Tooltip when collapsed */}
          {collapsed && (
            <span className="pointer-events-none absolute left-full ml-3 z-50 whitespace-nowrap rounded-lg bg-gray-900 px-2.5 py-1.5 text-xs text-white opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all shadow-lg">
              {label}
              <span className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-gray-900" />
            </span>
          )}
        </button>

        {/* Sub-items */}
        {!collapsed && isOpen && (
          <div className="mt-0.5 space-y-0.5">
            {children.map((child) => (
              <LeafLink
                key={child.href}
                href={child.href}
                label={child.label}
                icon={child.icon}
                indented
              />
            ))}
          </div>
        )}
      </div>
    );
  };

  // ── Sidebar content ────────────────────────────
  const content = (
    <div
      className={`flex flex-col h-full bg-white border-r border-gray-100 transition-all duration-300 ${
        collapsed ? "w-[72px]" : "w-64"
      }`}
    >
      {/* Logo + toggle */}
      <div
        className={`flex items-center h-16 px-4 border-b border-gray-100 shrink-0 ${
          collapsed ? "justify-center" : "justify-between"
        }`}
      >
        {!collapsed ? (
          <Link href="/shop/dashboard" className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-orange-500 rounded-xl flex items-center justify-center shadow-md shadow-orange-200">
              <Printer size={16} className="text-white" />
            </div>
            <span className="font-bold text-gray-900 text-lg tracking-wide">
              EASY<span className="text-orange-500">PRINT</span>
            </span>
          </Link>
        ) : (
          <Link href="/shop/dashboard">
            <div className="w-9 h-9 bg-orange-500 rounded-xl flex items-center justify-center shadow-md shadow-orange-200">
              <Printer size={18} className="text-white" />
            </div>
          </Link>
        )}

        {/* Desktop collapse button */}
        <button
          onClick={() => setCollapsed((c) => !c)}
          className="hidden lg:flex items-center justify-center w-7 h-7 rounded-lg text-gray-400 hover:text-orange-500 hover:bg-orange-50 transition-colors shrink-0"
          aria-label={collapsed ? "ขยาย sidebar" : "ย่อ sidebar"}
        >
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>

        {/* Mobile close */}
        <button
          onClick={onMobileClose}
          className="flex lg:hidden items-center justify-center w-7 h-7 rounded-lg text-gray-400 hover:text-orange-500 hover:bg-orange-50 transition-colors"
        >
          <X size={16} />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
        {navItems.map((item) =>
          item.kind === "leaf" ? (
            <LeafLink
              key={item.href}
              href={item.href}
              label={item.label}
              icon={item.icon}
              futureDropdown={item.futureDropdown}
            />
          ) : (
            <Section key={item.label} {...item} />
          )
        )}
      </nav>

      {/* Footer: shop identity */}
      <div
        className={`px-3 py-4 border-t border-gray-100 shrink-0 ${
          collapsed ? "flex justify-center" : ""
        }`}
      >
        {!collapsed ? (
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-orange-50/60">
            <div className="w-8 h-8 rounded-lg bg-orange-500 flex items-center justify-center shrink-0 shadow-sm">
              <Store size={14} className="text-white" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-gray-800 truncate">ร้าน EasyPrint</p>
              <p className="text-[11px] text-orange-500 font-medium">เจ้าของร้าน</p>
            </div>
          </div>
        ) : (
          <div className="w-9 h-9 rounded-lg bg-orange-500 flex items-center justify-center shadow-sm">
            <Store size={14} className="text-white" />
          </div>
        )}
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
        className={`fixed inset-y-0 left-0 z-50 lg:hidden flex h-full transition-transform duration-300 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {content}
      </aside>
    </>
  );
}
