"use client";

import React, { useEffect, useState } from "react";
import GlassCard from "@/components/ui/GlassCard";
import AlertBadge from "@/components/ui/AlertBadge";
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
import { cn } from "@/lib/utils";
import {
  Heart,
  Activity,
  TrendingUp,
  Zap,
  CalendarCheck,
  AlertTriangle,
  ArrowRight,
  Clock,
  Baby,
  Droplet,
} from "lucide-react";
import Link from "next/link";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
} from "recharts";

/* ─── Recent Alert Item ──────────────────────────────── */
function AlertItem({ time, message, level }: { time: string; message: string; level: "low" | "monitor" | "clinical_review" | "high" }) {
  return (
    <div className={cn(
      "flex items-start gap-3 px-4 py-3 rounded-xl border transition-all duration-200",
      level === "high" && "bg-alert-red/5 border-alert-red/20",
      level === "clinical_review" && "bg-alert-orange/5 border-alert-orange/20",
      level === "monitor" && "bg-alert-yellow/5 border-alert-yellow/20",
      level === "low" && "bg-glass border-glass-border",
    )}>
      <AlertBadge level={level} size="sm" showIcon={true} pulse={level === "high"} />
      <div className="flex-1 min-w-0">
        <p className="text-sm text-slate-200">{message}</p>
        <p className="text-xs text-slate-500 mt-0.5">{time}</p>
      </div>
    </div>
  );
}

/* ─── Custom Tooltip ─────────────────────────────────── */
function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload) return null;
  return (
    <div className="glass px-3 py-2 rounded-lg text-xs">
      <p className="text-slate-400 mb-1">{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} style={{ color: p.color }} className="font-medium">
          {p.name}: {p.value} {p.name === "weight" ? "kg" : "mmHg"}
        </p>
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   DASHBOARD PAGE
   ═══════════════════════════════════════════════════════ */
export default function DashboardPage() {
  const [patient, setPatient] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);
  const [chartData, setChartData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dynamicAlerts, setDynamicAlerts] = useState<Array<{ time: string; message: string; level: "low" | "monitor" | "clinical_review" | "high" }>>([]);

  useEffect(() => {
    async function loadDashboard() {
      try {
        const token = localStorage.getItem("access_token");
        if (!token) return;

        const res = await fetch("http://localhost:8000/api/v1/dashboard/summary", {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (res.ok) {
          const data = await res.json();
          if (data.has_profile) {
            setPatient(data.patient);
            setStats(data.stats);

            // Format chart data
            const formattedData = data.chart_data.map((d: any) => ({
              date: new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
              systolic: d.systolic_bp,
              diastolic: d.diastolic_bp,
              weight: d.weight_kg,
            }));
            setChartData(formattedData);

            // Create alerts based on risk status
            const alerts: Array<{ time: string; message: string; level: "low" | "monitor" | "clinical_review" | "high" }> = [];
            const risk = data.patient.risk_status;
            
            if (risk === "high") {
              alerts.push({
                time: "Current Status",
                message: `🚨 HIGH RISK: Please ensure you log your vitals daily. Immediate clinical evaluation may be recommended.`,
                level: "high",
              });
            } else if (risk === "clinical_review" || risk === "monitor") {
              alerts.push({
                time: "Current Status",
                message: `⚠️ Elevated parameters detected in your profile. Continue close vital tracking.`,
                level: "monitor",
              });
            } else {
              alerts.push({
                time: "Current Status",
                message: `✅ Your profile indicates a low-risk trajectory. Keep up the good work!`,
                level: "low",
              });
            }

            setDynamicAlerts(alerts);
          }
        }
      } catch (e) {
        console.error("Failed to load dashboard data", e);
      } finally {
        setLoading(false);
      }
    }

    loadDashboard();
  }, []);

  const sysVal = stats?.latest_bp ? stats.latest_bp.split('/')[0] : "--";
  const diaVal = stats?.latest_bp ? stats.latest_bp.split('/')[1] : "--";
  const weightVal = stats?.latest_weight ? `${stats.latest_weight}` : "--";
  const heartRate = stats?.latest_heart_rate || "--";
  const hydrationVal = stats?.latest_hydration ? `${stats.latest_hydration} L` : "--"; // Connected to DB

  const riskLevel = patient?.risk_status || "low";

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1 lg:ml-[var(--sidebar-width)]">
        <Header />
        <main className="p-6 max-w-7xl mx-auto">
          {/* ── Page Title ───────────────────────────── */}
          <div className="mb-8 animate-fade-in flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-3xl font-bold text-slate-100 mb-1">
                Patient Clinical Dashboard
              </h1>
              <p className="text-slate-400 text-sm">
                Real-time longitudinal risk engine & decision support telemetry.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs text-slate-400">Current Risk Status:</span>
              <AlertBadge level={riskLevel} size="lg" pulse={riskLevel === "high"} />
            </div>
          </div>

          {loading ? (
             <GlassCard className="p-12 text-center text-slate-400">
                <Activity className="mx-auto animate-spin mb-4 text-brand-400" size={32} />
                <p>Loading your clinical dashboard...</p>
             </GlassCard>
          ) : !patient ? (
             <GlassCard className="p-12 text-center text-slate-400">
                <AlertTriangle className="mx-auto mb-4 text-alert-yellow" size={32} />
                <p className="text-lg text-slate-200 mb-2">No Clinical Profile Found</p>
                <p className="mb-4">You need to complete onboarding to access your dashboard.</p>
                <Link href="/onboarding" className="btn-primary inline-flex">Complete Onboarding</Link>
             </GlassCard>
          ) : (
            <>
              {/* ── Pregnancy Progress Card ──────────────── */}
              <GlassCard className="mb-6 animate-fade-in-up opacity-0 fill-mode-forwards">
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-brand flex items-center justify-center shadow-glow-brand">
                      <Baby size={28} className="text-white" />
                    </div>
                    <div>
                      <p className="text-sm text-slate-400">Gestational Timeline</p>
                      <p className="text-2xl font-bold text-slate-100">Week {patient.gestational_age_weeks}</p>
                      <p className="text-xs text-slate-500">EDD: {patient.estimated_due_date ? new Date(patient.estimated_due_date).toLocaleDateString() : "N/A"} • ACOG Monitoring Active</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <AlertBadge level={riskLevel} size="md" />
                    <div className="w-px h-8 bg-glass-border" />
                    <Link href="/checkin" className="btn-primary text-sm">
                      <CalendarCheck size={16} />
                      Daily Check-in
                    </Link>
                  </div>
                </div>
                {/* Progress bar */}
                <div className="mt-4">
                  <div className="flex justify-between text-xs text-slate-500 mb-1">
                    <span>Gestational Progress</span>
                    <span>{patient.gestational_age_weeks} / 40 weeks ({Math.round((patient.gestational_age_weeks / 40) * 100)}%)</span>
                  </div>
                  <div className="w-full h-2 bg-glass-light rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-brand rounded-full transition-all duration-1000" style={{ width: `${(patient.gestational_age_weeks / 40) * 100}%` }} />
                  </div>
                </div>
              </GlassCard>

              {/* ── Live Vitals Strip ────────────────────── */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                {[
                  { icon: <Activity size={20} />, label: "Heart Rate", value: heartRate, unit: "bpm", color: "red" },
                  { icon: <TrendingUp size={20} />, label: "Blood Pressure", value: `${sysVal}/${diaVal}`, unit: "mmHg", color: Number(sysVal) >= 140 ? "red" : Number(sysVal) >= 130 ? "yellow" : "green" },
                  { icon: <Zap size={20} />, label: "Weight Today", value: weightVal, unit: "kg", color: "green" },
                  { icon: <Droplet size={20} />, label: "Daily Hydration", value: hydrationVal, unit: "", color: "brand" },
                ].map((stat, i) => (
                  <GlassCard
                    key={stat.label}
                    hover
                    className={cn("animate-fade-in-up opacity-0 fill-mode-forwards", `animation-delay-${(i + 1) * 100}`)}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className={cn(
                        "w-10 h-10 rounded-xl flex items-center justify-center",
                        stat.color === "brand" && "bg-brand-500/15 text-brand-400",
                        stat.color === "green" && "bg-alert-green-bg text-alert-green",
                        stat.color === "yellow" && "bg-alert-yellow-bg text-alert-yellow",
                        stat.color === "red" && "bg-alert-red-bg text-alert-red",
                      )}>
                        {stat.icon}
                      </div>
                    </div>
                    <p className="text-2xl font-bold text-slate-100 tracking-tight">
                      {stat.value}
                      <span className="text-sm font-normal text-slate-500 ml-1">{stat.unit}</span>
                    </p>
                    <p className="text-sm text-slate-500 mt-1">{stat.label}</p>
                  </GlassCard>
                ))}
              </div>

              {/* ── Charts Row ───────────────────────────── */}
              {chartData.length > 0 && (
                <div className="grid lg:grid-cols-2 gap-6 mb-6">
                  {/* BP Chart */}
                  <GlassCard className="animate-fade-in-up opacity-0 fill-mode-forwards animation-delay-300">
                    <h3 className="text-sm font-semibold text-slate-300 mb-4 flex items-center gap-2">
                      <Activity size={16} className="text-alert-yellow" />
                      Blood Pressure Trajectory
                    </h3>
                    <div className="h-48">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={chartData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                          <XAxis dataKey="date" tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} />
                          <YAxis tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} domain={[60, 170]} />
                          <Tooltip content={<CustomTooltip />} />
                          <Line type="monotone" dataKey="systolic" stroke="#f59e0b" strokeWidth={2} dot={{ fill: "#f59e0b", r: 4 }} name="systolic" />
                          <Line type="monotone" dataKey="diastolic" stroke="#06b6d4" strokeWidth={2} dot={{ fill: "#06b6d4", r: 4 }} name="diastolic" />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </GlassCard>

                  {/* Weight Chart */}
                  <GlassCard className="animate-fade-in-up opacity-0 fill-mode-forwards animation-delay-400">
                    <h3 className="text-sm font-semibold text-slate-300 mb-4 flex items-center gap-2">
                      <Zap size={16} className="text-alert-green" />
                      Weight Tracking
                    </h3>
                    <div className="h-48">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={chartData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                          <XAxis dataKey="date" tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} />
                          <YAxis tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} domain={['dataMin - 1', 'dataMax + 1']} />
                          <Tooltip content={<CustomTooltip />} />
                          <defs>
                            <linearGradient id="weightGrad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                              <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <Area type="monotone" dataKey="weight" stroke="#10b981" strokeWidth={2} fill="url(#weightGrad)" name="weight" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </GlassCard>
                </div>
              )}

              {/* ── Recent Alerts + Quick Actions ────────── */}
              <div className="grid lg:grid-cols-3 gap-6">
                {/* Recent Alerts */}
                <div className="lg:col-span-2">
                  <GlassCard className="animate-fade-in-up opacity-0 fill-mode-forwards animation-delay-500">
                    <h3 className="text-sm font-semibold text-slate-300 mb-4 flex items-center gap-2">
                      <AlertTriangle size={16} className="text-alert-yellow" />
                      Live Patient Telemetry & Risk Alerts
                    </h3>
                    <div className="space-y-3">
                      {dynamicAlerts.map((alt, idx) => (
                        <AlertItem key={idx} time={alt.time} message={alt.message} level={alt.level} />
                      ))}
                      <AlertItem time="Longitudinal History" message="Prior trajectory remains stored in clinical timeline." level="low" />
                    </div>
                  </GlassCard>
                </div>

                {/* Quick Actions */}
                <GlassCard className="animate-fade-in-up opacity-0 fill-mode-forwards animation-delay-700">
                  <h3 className="text-sm font-semibold text-slate-300 mb-4 flex items-center gap-2">
                    <Clock size={16} className="text-brand-400" />
                    Quick Actions
                  </h3>
                  <div className="space-y-3">
                    {[
                      { label: "Daily Check-in", href: "/checkin", icon: <CalendarCheck size={16} />, desc: "Log today's vitals" },
                      { label: "AI Clinical Chat", href: "/chat", icon: <Activity size={16} />, desc: "Consult Materna AI" },
                      { label: "OCR Lab Upload", href: "/ocr", icon: <Zap size={16} />, desc: "Scan new lab PDFs" },
                    ].map((action) => (
                      <Link
                        key={action.label}
                        href={action.href}
                        className="flex items-center gap-3 px-4 py-3 rounded-xl glass-subtle hover:bg-glass-medium transition-all duration-200 group"
                      >
                        <div className="w-8 h-8 rounded-lg bg-brand-500/15 flex items-center justify-center text-brand-400">
                          {action.icon}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-slate-200 group-hover:text-white">{action.label}</p>
                          <p className="text-xs text-slate-500">{action.desc}</p>
                        </div>
                        <ArrowRight size={14} className="text-slate-600 group-hover:text-brand-400 transition-colors" />
                      </Link>
                    ))}
                  </div>
                </GlassCard>
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
}
