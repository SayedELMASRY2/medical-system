"use client";

import React, { useState, useEffect } from "react";
import { cn, getScopedKey } from "@/lib/utils";
import { Bell, Search, User, Menu, LogOut, Shield } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface HeaderProps {
  className?: string;
}

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

export default function Header({ className }: HeaderProps) {
  const router = useRouter();
  const [userRole, setUserRole] = useState<string>("PATIENT");
  const [userEmail, setUserEmail] = useState<string>("user@materna.ai");
  const [userName, setUserName] = useState<string>("User Profile");
  const [userAvatar, setUserAvatar] = useState<string>("/default_avatar.png");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("access_token");
      if (token) {
        const decoded = parseJwt(token);
        if (decoded?.role) setUserRole(decoded.role);
        if (decoded?.sub) setUserEmail(decoded.sub);
      }

      const savedProfile = localStorage.getItem(getScopedKey("materna_user_profile"));
      if (savedProfile) {
        try {
          const parsed = JSON.parse(savedProfile);
          if (parsed.avatar) setUserAvatar(parsed.avatar);
          if (parsed.fullName) setUserName(parsed.fullName);
        } catch (e) {}
      }
    }
  }, []);

  const handleLogout = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("access_token");
      localStorage.removeItem("user_id");
    }
    router.push("/login");
  };

  return (
    <header
      className={cn(
        "sticky top-0 z-30 w-full h-14",
        "glass-heavy border-b border-glass-border/60 backdrop-blur-xl",
        "flex items-center justify-between px-6 gap-4",
        className
      )}
    >
      {/* ── Left: Mobile menu + Sleek Search ─────────────────── */}
      <div className="flex items-center gap-4 flex-1">
        <button
          className="lg:hidden btn-ghost p-1.5 text-slate-300"
          aria-label="Toggle navigation menu"
        >
          <Menu size={18} />
        </button>

        {/* Sleek Modern Search Bar */}
        <div className="relative hidden sm:flex items-center max-w-sm flex-1">
          <div className="absolute left-3 flex items-center justify-center text-sky-400 pointer-events-none">
            <Search size={15} />
          </div>
          <input
            type="text"
            placeholder="Search patients, vitals, lab reports..."
            className="w-full pl-9 pr-12 py-1.5 rounded-full bg-slate-900/70 border border-slate-800 text-xs text-slate-100 placeholder:text-slate-500 focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-all"
            id="header-search"
          />
          <kbd className="absolute right-3 hidden md:inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-mono text-slate-400 bg-slate-800 border border-slate-700">
            ⌘K
          </kbd>
        </div>
      </div>

      {/* ── Right: Actions & Profile ────────────────────── */}
      <div className="flex items-center gap-3">
        {/* Admin Quick Link Badge */}
        {userRole === "ADMIN" && (
          <Link
            href="/admin"
            className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-500/15 border border-sky-500/30 text-sky-300 text-xs font-semibold hover:bg-sky-500/25 transition-all"
          >
            <Shield size={13} />
            Admin Panel
          </Link>
        )}

        {/* Notification Bell */}
        <button
          className="relative p-1.5 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-all"
          aria-label="View notifications"
          id="header-notifications"
        >
          <Bell size={17} />
          <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-rose-500" />
        </button>

        {/* Divider */}
        <div className="w-px h-5 bg-slate-800 mx-0.5" />

        {/* User Profile */}
        <Link
          href="/settings"
          className="flex items-center gap-2.5 p-1 rounded-xl hover:bg-slate-800 transition-all group"
          id="header-user-menu"
        >
          <div className="w-8 h-8 rounded-full overflow-hidden border border-sky-500/40 shadow-sm bg-slate-900 flex-shrink-0">
            <img src={userAvatar} alt="User Avatar" className="w-full h-full object-cover" />
          </div>
          <div className="hidden md:block text-left">
            <p className="text-xs font-semibold text-slate-200 group-hover:text-white transition-colors truncate max-w-[120px] leading-tight">
              {userName}
            </p>
            <p className="text-[10px] text-slate-400 truncate max-w-[110px] leading-tight">
              {userRole}
            </p>
          </div>
        </Link>

        {/* Logout Button */}
        <button
          onClick={handleLogout}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-semibold hover:bg-rose-500/20 transition-all ml-1"
          title="Logout from Materna CDSS"
          id="header-logout-btn"
        >
          <LogOut size={13} />
          <span className="hidden sm:inline">Log Out</span>
        </button>
      </div>
    </header>
  );
}
