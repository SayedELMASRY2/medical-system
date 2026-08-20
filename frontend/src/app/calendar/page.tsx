"use client";

import React, { useState } from "react";
import GlassCard from "@/components/ui/GlassCard";
import AlertBadge from "@/components/ui/AlertBadge";
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
import { cn } from "@/lib/utils";
import type { RiskLevel } from "@/lib/utils";
import {
  ChevronLeft,
  ChevronRight,
  CalendarCheck,
  Droplet,
  Activity,
  Moon,
} from "lucide-react";

/* ─── Mock Check-in Data ─────────────────────────────── */
type CheckinDay = {
  date: number;
  risk: RiskLevel;
  bp?: string;
  weight?: number;
  notes?: string;
};

const MOCK_CHECKINS: Record<string, CheckinDay[]> = {
  "2026-08": [
    { date: 1, risk: "low", bp: "118/76", weight: 71.8, notes: "Normal vitals" },
    { date: 3, risk: "low", bp: "120/78", weight: 72.0 },
    { date: 5, risk: "monitor", bp: "128/82", weight: 72.2, notes: "Slight BP elevation" },
    { date: 7, risk: "low", bp: "117/74", weight: 72.1 },
    { date: 9, risk: "low", bp: "119/76", weight: 72.3 },
    { date: 11, risk: "low", bp: "121/77", weight: 72.4 },
    { date: 13, risk: "clinical_review", bp: "135/88", weight: 73.0, notes: "Elevated BP + edema" },
    { date: 14, risk: "low", bp: "118/75", weight: 72.5 },
    { date: 15, risk: "low", bp: "120/76", weight: 72.5 },
    { date: 16, risk: "monitor", bp: "126/80", weight: 72.6 },
    { date: 17, risk: "low", bp: "119/77", weight: 72.5 },
    { date: 18, risk: "low", bp: "121/78", weight: 72.6 },
    { date: 19, risk: "high", bp: "148/96", weight: 73.2, notes: "High BP + headache. Escalated!" },
    { date: 20, risk: "low", bp: "117/74", weight: 72.5 },
  ],
};

const MONTH_NAMES = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const riskDot: Record<RiskLevel, string> = {
  low: "bg-alert-green",
  monitor: "bg-alert-yellow",
  clinical_review: "bg-alert-orange",
  high: "bg-alert-red animate-pulse",
};

/* ═══════════════════════════════════════════════════════
   CALENDAR PAGE
   ═══════════════════════════════════════════════════════ */
export default function CalendarPage() {
  const [currentYear, setCurrentYear] = useState(2026);
  const [currentMonth, setCurrentMonth] = useState(7); // August (0-indexed)
  const [selectedDay, setSelectedDay] = useState<CheckinDay | null>(null);

  const key = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}`;
  const checkins = MOCK_CHECKINS[key] || [];

  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

  const prevMonth = () => {
    if (currentMonth === 0) { setCurrentMonth(11); setCurrentYear(y => y - 1); }
    else setCurrentMonth(m => m - 1);
    setSelectedDay(null);
  };
  const nextMonth = () => {
    if (currentMonth === 11) { setCurrentMonth(0); setCurrentYear(y => y + 1); }
    else setCurrentMonth(m => m + 1);
    setSelectedDay(null);
  };

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1 lg:ml-[var(--sidebar-width)]">
        <Header />
        <main className="p-6 max-w-5xl mx-auto">
          <div className="mb-8 animate-fade-in">
            <h1 className="text-3xl font-bold text-slate-100 mb-1">Check-in Calendar</h1>
            <p className="text-slate-400">View your daily check-in history and risk levels at a glance.</p>
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            {/* ── Calendar Grid ─────────────────────── */}
            <div className="lg:col-span-2">
              <GlassCard className="animate-fade-in-up opacity-0 fill-mode-forwards">
                {/* Month Navigation */}
                <div className="flex items-center justify-between mb-6">
                  <button onClick={prevMonth} className="btn-ghost p-2">
                    <ChevronLeft size={20} />
                  </button>
                  <h2 className="text-lg font-semibold text-slate-100">
                    {MONTH_NAMES[currentMonth]} {currentYear}
                  </h2>
                  <button onClick={nextMonth} className="btn-ghost p-2">
                    <ChevronRight size={20} />
                  </button>
                </div>

                {/* Day Headers */}
                <div className="grid grid-cols-7 gap-1 mb-2">
                  {DAY_NAMES.map(d => (
                    <div key={d} className="text-center text-xs font-medium text-slate-500 py-2">{d}</div>
                  ))}
                </div>

                {/* Day Cells */}
                <div className="grid grid-cols-7 gap-1">
                  {Array.from({ length: firstDayOfMonth }).map((_, i) => (
                    <div key={`empty-${i}`} className="aspect-square" />
                  ))}
                  {Array.from({ length: daysInMonth }).map((_, i) => {
                    const day = i + 1;
                    const checkin = checkins.find(c => c.date === day);
                    const isSelected = selectedDay?.date === day;
                    const isToday = day === 20 && currentMonth === 7 && currentYear === 2026;

                    return (
                      <button
                        key={day}
                        onClick={() => checkin && setSelectedDay(checkin)}
                        className={cn(
                          "aspect-square rounded-xl flex flex-col items-center justify-center gap-1 text-sm transition-all duration-200",
                          "border",
                          isSelected ? "border-brand-500/50 bg-brand-500/10" : "border-transparent",
                          isToday && !isSelected && "border-brand-500/30",
                          checkin ? "hover:bg-glass-medium cursor-pointer" : "text-slate-600 cursor-default",
                          !checkin && "opacity-50",
                        )}
                      >
                        <span className={cn(
                          "font-medium",
                          isToday ? "text-brand-400" : checkin ? "text-slate-200" : "text-slate-600",
                        )}>
                          {day}
                        </span>
                        {checkin && (
                          <span className={cn("w-2 h-2 rounded-full", riskDot[checkin.risk])} />
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Legend */}
                <div className="flex items-center gap-4 mt-6 pt-4 border-t border-glass-border/50">
                  {(["low", "monitor", "clinical_review", "high"] as RiskLevel[]).map(level => (
                    <div key={level} className="flex items-center gap-1.5">
                      <span className={cn("w-2 h-2 rounded-full", riskDot[level])} />
                      <span className="text-xs text-slate-500 capitalize">{level.replace("_", " ")}</span>
                    </div>
                  ))}
                </div>
              </GlassCard>
            </div>

            {/* ── Day Detail Panel ──────────────────── */}
            <div>
              {selectedDay ? (
                <GlassCard className="animate-slide-in-right sticky top-24">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-slate-100">
                      {MONTH_NAMES[currentMonth]} {selectedDay.date}
                    </h3>
                    <AlertBadge level={selectedDay.risk} size="sm" />
                  </div>

                  <div className="space-y-4">
                    {selectedDay.bp && (
                      <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-glass-light">
                        <Activity size={16} className="text-alert-yellow flex-shrink-0" />
                        <div>
                          <p className="text-xs text-slate-500">Blood Pressure</p>
                          <p className="text-sm font-semibold text-slate-200">{selectedDay.bp} mmHg</p>
                        </div>
                      </div>
                    )}
                    {selectedDay.weight && (
                      <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-glass-light">
                        <Droplet size={16} className="text-alert-green flex-shrink-0" />
                        <div>
                          <p className="text-xs text-slate-500">Weight</p>
                          <p className="text-sm font-semibold text-slate-200">{selectedDay.weight} kg</p>
                        </div>
                      </div>
                    )}
                    {selectedDay.notes && (
                      <div className="px-3 py-2.5 rounded-lg bg-glass-light">
                        <p className="text-xs text-slate-500 mb-1">Notes</p>
                        <p className="text-sm text-slate-300">{selectedDay.notes}</p>
                      </div>
                    )}
                  </div>
                </GlassCard>
              ) : (
                <GlassCard className="animate-fade-in text-center">
                  <CalendarCheck size={32} className="text-slate-600 mx-auto mb-3" />
                  <p className="text-sm text-slate-500">
                    Click on a check-in day to view details
                  </p>
                </GlassCard>
              )}

              {/* Stats summary */}
              <GlassCard className="mt-4 animate-fade-in-up opacity-0 fill-mode-forwards animation-delay-200">
                <h3 className="text-sm font-semibold text-slate-300 mb-3">This Month</h3>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Check-ins</span>
                    <span className="text-slate-200 font-medium">{checkins.length} days</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Normal</span>
                    <span className="text-alert-green font-medium">{checkins.filter(c => c.risk === "low").length}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Alerts</span>
                    <span className="text-alert-yellow font-medium">{checkins.filter(c => c.risk !== "low").length}</span>
                  </div>
                </div>
              </GlassCard>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
