"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  ClipboardPlus,
  MessageCircle,
  Settings,
  ChevronLeft,
  Heart,
  Shield,
  UserPlus,
  Calendar as CalendarIcon,
  Brain,
  Stethoscope,
  Coins,
  FileText,
  ScanLine,
  Sparkles,
  BarChart3,
  Bot,
  LogOut,
} from "lucide-react";

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  badge?: string;
  adminOnly?: boolean;
  doctorOnly?: boolean;
}

const navItems: NavItem[] = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: <LayoutDashboard size={20} />,
  },
  {
    label: "Doctor Triage",
    href: "/doctor",
    icon: <Stethoscope size={20} />,
    badge: "ALERT",
    doctorOnly: true,
  },
  {
    label: "AI Chatbot",
    href: "/chat",
    icon: <Bot size={20} className="text-cyan-400" />,
    badge: "AI CO-PILOT",
  },
  {
    label: "Calendar",
    href: "/calendar",
    icon: <CalendarIcon size={20} />,
  },
  {
    label: "AI Agents",
    href: "/agents",
    icon: <Brain size={20} />,
  },
  {
    label: "3D Body Simulator",
    href: "/body-simulator",
    icon: <Sparkles size={20} />,
    badge: "3D",
  },
  {
    label: "Evaluations & Metrics",
    href: "/evaluations",
    icon: <BarChart3 size={20} className="text-emerald-400" />,
    badge: "RAG EVAL",
  },
  {
    label: "Lab OCR Scanner",
    href: "/ocr",
    icon: <ScanLine size={20} />,
  },
  {
    label: "Daily Check-in",
    href: "/checkin",
    icon: <ClipboardPlus size={20} />,
  },
  {
    label: "Onboarding",
    href: "/onboarding",
    icon: <UserPlus size={20} />,
  },
  {
    label: "Clinical Forms",
    href: "/forms",
    icon: <FileText size={20} />,
  },
  {
    label: "Admin Panel",
    href: "/admin",
    icon: <Shield size={20} />,
    adminOnly: true,
  },
  {
    label: "API & Tokens",
    href: "/admin/tokens",
    icon: <Coins size={20} />,
    adminOnly: true,
  },
];

function parseJwt(token: string) {
  try {
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    return JSON.parse(jsonPayload);
  } catch (e) {
    return null;
  }
}

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const [userRole, setUserRole] = useState<string>("PATIENT");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("access_token");
      if (token) {
        const decoded = parseJwt(token);
        if (decoded?.role) {
          setUserRole(decoded.role);
        }
      }
    }
  }, []);

  const handleLogout = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("access_token");
      document.cookie = "access_token=; path=/; max-age=0;";
    }
    router.push("/login");
  };

  const filteredNavItems = navItems.filter((item) => {
    if (item.adminOnly && userRole !== "ADMIN") return false;
    if (item.doctorOnly && !["DOCTOR", "ADMIN"].includes(userRole)) return false;
    return true;
  });

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
          <Link href="/" className="flex items-center gap-3">
            <div className="flex-shrink-0 w-9 h-9 rounded-xl overflow-hidden shadow-glow-brand border border-cyan-500/30 bg-slate-950 flex items-center justify-center">
              <img src="/materna_logo.png" alt="Materna AI Logo" className="w-full h-full object-cover" />
            </div>
            {!collapsed && (
              <div className="animate-fade-in">
                <h1 className="text-lg font-bold text-gradient-brand tracking-tight flex items-center gap-1">
                  Materna <span className="text-cyan-400 font-mono text-xs">AI</span>
                </h1>
                <p className="text-[10px] text-slate-400 -mt-0.5 tracking-wider uppercase font-semibold">
                  Clinical CDSS
                </p>
              </div>
            )}
          </Link>
        </div>

        {/* ── Navigation ────────────────────────────────── */}
        <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
          {filteredNavItems.map((item) => {
            const isActive =
              pathname === item.href || (item.href !== "/" && pathname?.startsWith(item.href));
            return (
              <Link
                key={item.label}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-4 py-2.5 rounded-xl",
                  "text-sm font-medium transition-all duration-200",
                  "group relative",
                  isActive
                    ? "bg-brand-500/15 text-brand-400 border border-brand-500/20 shadow-sm"
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
                  <span className="ml-auto px-2 py-0.5 text-[10px] font-bold rounded-full bg-alert-red/20 text-alert-red border border-alert-red/30 animate-pulse-glow">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* ── Bottom Section ────────────────────────────── */}
        <div className="px-3 py-3 border-t border-glass-border/50 space-y-1">
          <Link
            href="/settings"
            className={cn(
              "flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group",
              pathname === "/settings"
                ? "bg-brand-500/15 text-brand-400"
                : "text-slate-300 hover:text-slate-100 hover:bg-white/5"
            )}
          >
            <span className="text-slate-400 group-hover:text-slate-300">
              <Settings size={20} />
            </span>
            {!collapsed && <span>Settings</span>}
          </Link>

          {/* Logout Button */}
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-2.5 rounded-xl w-full text-sm font-medium text-alert-red hover:bg-alert-red/10 transition-all duration-200 group"
          >
            <span className="text-alert-red">
              <LogOut size={20} />
            </span>
            {!collapsed && <span>Log Out</span>}
          </button>

          {/* Collapse toggle */}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="flex items-center gap-3 px-4 py-2.5 rounded-xl w-full text-sm font-medium text-slate-300 hover:text-slate-100 hover:bg-white/5 transition-all duration-200 group"
          >
            <span className="text-slate-400 group-hover:text-slate-300 transition-colors duration-200">
              <ChevronLeft
                size={20}
                className={cn("transition-transform duration-300", collapsed && "rotate-180")}
              />
            </span>
            {!collapsed && <span>Collapse Sidebar</span>}
          </button>
        </div>

        {/* ── CDSS Badge ────────────────────────────────── */}
        {!collapsed && (
          <div className="px-4 py-3 border-t border-glass-border/50">
            <div className="flex items-center gap-2 text-[10px] text-slate-500">
              <Shield size={12} className="text-brand-400" />
              <span>Materna CDSS v1.0</span>
            </div>
          </div>
        )}
      </aside>
    </>
  );
}
