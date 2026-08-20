"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  ClipboardPlus,
  MessageCircle,
  Activity,
  Settings,
  ChevronLeft,
  Heart,
  Shield,
  UserPlus,
} from "lucide-react";

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  badge?: string;
}

const navItems: NavItem[] = [
  {
    label: "Patient Onboarding",
    href: "/onboarding",
    icon: <UserPlus size={20} />,
  },
  {
    label: "Daily Check-in",
    href: "/checkin",
    icon: <ClipboardPlus size={20} />,
  },
  {
    label: "AI Chat",
    href: "/chat",
    icon: <MessageCircle size={20} />,
  },
  {
    label: "Vitals Monitor",
    href: "#",
    icon: <Activity size={20} />,
  },
];

const bottomNavItems: NavItem[] = [
  {
    label: "Settings",
    href: "#",
    icon: <Settings size={20} />,
  },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <>
      {/* Mobile overlay */}
      <div
        className={cn(
          "fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden transition-opacity duration-300",
          "pointer-events-none opacity-0"
        )}
      />

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed top-0 left-0 z-50 h-full",
          "glass-heavy border-r border-glass-border",
          "flex flex-col transition-all duration-300 ease-out",
          "hidden lg:flex",
          collapsed ? "w-[72px]" : "w-[var(--sidebar-width)]"
        )}
      >
        {/* ── Logo ──────────────────────────────────────── */}
        <div className="flex items-center gap-3 px-5 h-[var(--header-height)] border-b border-glass-border/50">
          <div className="flex-shrink-0 w-9 h-9 rounded-xl bg-gradient-brand flex items-center justify-center shadow-glow-brand">
            <Heart size={18} className="text-white" />
          </div>
          {!collapsed && (
            <div className="animate-fade-in">
              <h1 className="text-lg font-bold text-gradient-brand tracking-tight">
                Materna
              </h1>
              <p className="text-[10px] text-slate-500 -mt-0.5 tracking-wider uppercase">
                CDSS
              </p>
            </div>
          )}
        </div>

        {/* ── Navigation ────────────────────────────────── */}
        <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive =
              pathname === item.href || pathname?.startsWith(item.href + "/");
            return (
              <Link
                key={item.label}
                href={item.href}
                onClick={(e) => item.href === "#" && e.preventDefault()}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-xl",
                  "text-sm font-medium transition-all duration-200",
                  "group relative",
                  isActive
                    ? "bg-brand-500/15 text-brand-400 border border-brand-500/20"
                    : "text-slate-300 hover:text-slate-100 hover:bg-white/5 border border-transparent"
                )}
              >
                {/* Active indicator bar */}
                {isActive && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-brand-500 rounded-full" />
                )}

                <span
                  className={cn(
                    "flex-shrink-0 transition-colors duration-200",
                    isActive
                      ? "text-brand-400"
                      : "text-slate-400 group-hover:text-slate-300"
                  )}
                >
                  {item.icon}
                </span>

                {!collapsed && (
                  <span className="animate-fade-in">{item.label}</span>
                )}

                {!collapsed && item.badge && (
                  <span className="ml-auto px-2 py-0.5 text-xs font-bold rounded-full bg-alert-red/20 text-alert-red border border-alert-red/30 animate-pulse-glow">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* ── Bottom Section ────────────────────────────── */}
        <div className="px-3 py-3 border-t border-glass-border/50 space-y-1">
          {bottomNavItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.label}
                href={item.href}
                onClick={(e) => item.href === "#" && e.preventDefault()}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-xl",
                  "text-sm font-medium transition-all duration-200",
                  "group",
                  isActive
                    ? "bg-brand-500/15 text-brand-400"
                    : "text-slate-300 hover:text-slate-100 hover:bg-white/5"
                )}
              >
                <span className={cn("transition-colors duration-200", isActive ? "text-brand-400" : "text-slate-400 group-hover:text-slate-300")}>
                  {item.icon}
                </span>
                {!collapsed && <span>{item.label}</span>}
              </Link>
            );
          })}

          {/* Collapse toggle */}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="flex items-center gap-3 px-4 py-3 rounded-xl w-full
                       text-sm font-medium text-slate-300 hover:text-slate-100 hover:bg-white/5
                       transition-all duration-200 group"
          >
            <span className="text-slate-400 group-hover:text-slate-300 transition-colors duration-200">
              <ChevronLeft
                size={20}
                className={cn(
                  "transition-transform duration-300",
                  collapsed && "rotate-180"
                )}
              />
            </span>
            {!collapsed && <span>Collapse</span>}
          </button>
        </div>

        {/* ── CDSS Badge ────────────────────────────────── */}
        {!collapsed && (
          <div className="px-4 py-3 border-t border-glass-border/50">
            <div className="flex items-center gap-2 text-[10px] text-slate-600">
              <Shield size={12} />
              <span>Clinical Decision Support System</span>
            </div>
          </div>
        )}
      </aside>
    </>
  );
}
