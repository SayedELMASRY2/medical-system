"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { Bell, Search, User, Menu } from "lucide-react";

interface HeaderProps {
  className?: string;
}

export default function Header({ className }: HeaderProps) {
  return (
    <header
      className={cn(
        "sticky top-0 z-30 w-full",
        "h-[var(--header-height)]",
        "glass-subtle border-b border-glass-border/50",
        "flex items-center justify-between px-6 gap-4",
        className
      )}
    >
      {/* ── Left: Mobile menu + Search ─────────────────── */}
      <div className="flex items-center gap-4 flex-1">
        <button
          className="lg:hidden btn-ghost p-2"
          aria-label="Toggle navigation menu"
        >
          <Menu size={20} />
        </button>

        {/* Search Bar */}
        <div className="relative hidden sm:block max-w-md flex-1">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
          />
          <input
            type="text"
            placeholder="Search patients, vitals, alerts..."
            className="input-glass-sm pl-9 pr-4 bg-glass/50"
            id="header-search"
          />
        </div>
      </div>

      {/* ── Right: Actions ─────────────────────────────── */}
      <div className="flex items-center gap-2">
        {/* Notification Bell */}
        <button
          className="relative p-2.5 rounded-xl hover:bg-glass transition-all duration-200 group"
          aria-label="View notifications"
          id="header-notifications"
        >
          <Bell
            size={18}
            className="text-slate-400 group-hover:text-slate-200 transition-colors"
          />
          {/* Red dot indicator */}
          <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-alert-red animate-pulse-glow-red" />
        </button>

        {/* Divider */}
        <div className="w-px h-6 bg-glass-border mx-1" />

        {/* User Avatar */}
        <button
          className="flex items-center gap-3 p-1.5 pr-3 rounded-xl hover:bg-glass transition-all duration-200 group"
          id="header-user-menu"
        >
          <div className="w-8 h-8 rounded-lg bg-gradient-brand flex items-center justify-center shadow-sm">
            <User size={16} className="text-white" />
          </div>
          <div className="hidden md:block text-left">
            <p className="text-sm font-medium text-slate-200 group-hover:text-white transition-colors">
              My Profile
            </p>
            <p className="text-[10px] text-slate-500 -mt-0.5">Patient</p>
          </div>
        </button>
      </div>
    </header>
  );
}
