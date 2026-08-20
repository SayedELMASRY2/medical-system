"use client";

import React, { useEffect, useState } from "react";
import GlassCard from "@/components/ui/GlassCard";
import AlertBadge from "@/components/ui/AlertBadge";
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
import { cn, getScopedKey } from "@/lib/utils";
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

/* ─── Mock Chart Data ────────────────────────────────── */
const mockBPData = [
  { date: "Aug 14", systolic: 118, diastolic: 76 },
  { date: "Aug 15", systolic: 122, diastolic: 78 },
  { date: "Aug 16", systolic: 120, diastolic: 75 },
  { date: "Aug 17", systolic: 125, diastolic: 80 },
  { date: "Aug 18", systolic: 119, diastolic: 77 },
  { date: "Aug 19", systolic: 121, diastolic: 76 },
  { date: "Aug 20", systolic: 117, diastolic: 74 },
];

const mockWeightData = [
  { date: "Aug 14", weight: 72.1 },
  { date: "Aug 15", weight: 72.3 },
  { date: "Aug 16", weight: 72.2 },
  { date: "Aug 17", weight: 72.5 },
  { date: "Aug 18", weight: 72.4 },
  { date: "Aug 19", weight: 72.6 },
  { date: "Aug 20", weight: 72.5 },
];

/* ─── Live Vital Hook ─────────────────────────────────── */
function useMockVital(base: number, variance: number, interval: number) {
  const [value, setValue] = useState(base);
  useEffect(() => {
    const timer = setInterval(() => {
      const delta = (Math.random() - 0.5) * variance;
      setValue(Math.round((base + delta) * 10) / 10);
    }, interval);
    return () => clearInterval(timer);
  }, [base, variance, interval]);
  return value;
}

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
  const [patientVitals, setPatientVitals] = useState<any>(null);
  const [ocrLabs, setOcrLabs] = useState<any[]>([]);
  const [riskLevel, setRiskLevel] = useState<"low" | "monitor" | "clinical_review" | "high">("low");
  const [dynamicAlerts, setDynamicAlerts] = useState<Array<{ time: string; message: string; level: "low" | "monitor" | "clinical_review" | "high" }>>([]);

  const heartRate = useMockVital(78, 4, 3000);

  useEffect(() => {
    if (typeof window !== "undefined") {
      // 1. Read Daily Check-in Form Vitals (user-scoped)
      const storedVitals = localStorage.getItem(getScopedKey("last_patient_vitals"));
      let vitalsObj: any = null;
      if (storedVitals) {
        try {
          vitalsObj = JSON.parse(storedVitals);
          setPatientVitals(vitalsObj);
        } catch (e) {}
      }

      // 2. Read OCR Lab Dataset (user-scoped)
      const storedOcr = localStorage.getItem(getScopedKey("patient_ocr_dataset"));
      let ocrList: any[] = [];
      if (storedOcr) {
        try {
          ocrList = JSON.parse(storedOcr);
          setOcrLabs(ocrList);
        } catch (e) {}
      }

      // 3. Evaluate Clinical Risk Level
      let calculatedLevel: "low" | "monitor" | "clinical_review" | "high" = "low";
      const alerts: Array<{ time: string; message: string; level: "low" | "monitor" | "clinical_review" | "high" }> = [];

      const sys = vitalsObj?.systolic ? Number(vitalsObj.systolic) : 120;
      const dia = vitalsObj?.diastolic ? Number(vitalsObj.diastolic) : 80;
      const headache = vitalsObj?.headache || "";
      const vision = Boolean(vitalsObj?.visionChanges);
      const abdo = Boolean(vitalsObj?.abdominalPain);
      const bleeding = Boolean(vitalsObj?.vaginalBleeding);
      const fetalMove = vitalsObj?.fetalMovement || "";

      if (sys >= 140 || dia >= 90 || headache === "Severe/Unrelenting" || vision || abdo || bleeding || fetalMove === "Decreased" || fetalMove === "None") {
        calculatedLevel = "high";
        alerts.push({
          time: "Today's Check-in",
          message: `🚨 HIGH RISK: Blood pressure ${sys}/${dia} mmHg with ${headache || 'severe symptoms'}. Immediate clinical evaluation recommended.`,
          level: "high",
        });
      } else if (sys >= 130 || dia >= 85 || headache === "Mild" || (vitalsObj?.swelling && vitalsObj.swelling.length > 1)) {
        calculatedLevel = "monitor";
        alerts.push({
          time: "Today's Check-in",
          message: `⚠️ Elevated parameters: Blood pressure ${sys}/${dia} mmHg. Continue close vital tracking.`,
          level: "monitor",
        });
      } else if (vitalsObj) {
        alerts.push({
          time: "Today's Check-in",
          message: `✅ Daily check-in logged: Blood pressure ${sys}/${dia} mmHg, weight ${vitalsObj.weight || 68} kg. All vitals stable.`,
          level: "low",
        });
      }

      // Add OCR alerts if available
      if (ocrList.length > 0) {
        alerts.push({
          time: "Saved Lab Memory",
          message: `📄 ${ocrList.length} OCR clinical report(s) integrated into gestational timeline.`,
          level: "low",
        });
      }

      if (alerts.length === 0) {
        alerts.push({
          time: "System Default",
          message: "No daily check-in logged yet for today. Click 'Daily Check-in' to update your vitals.",
          level: "monitor",
        });
      }

      setRiskLevel(calculatedLevel);
      setDynamicAlerts(alerts);
    }
  }, []);

  const sysVal = patientVitals?.systolic ? Number(patientVitals.systolic) : 120;
  const diaVal = patientVitals?.diastolic ? Number(patientVitals.diastolic) : 80;
  const weightVal = patientVitals?.weight ? `${patientVitals.weight}` : "72.5";
  const hydrationVal = patientVitals?.hydrationCups ? `${patientVitals.hydrationCups} cups` : "2.2 L";

  // Dynamic BP Chart Data
  const dynamicBPData = [...mockBPData];
  if (patientVitals) {
    dynamicBPData[dynamicBPData.length - 1] = {
      date: "Today",
      systolic: sysVal,
      diastolic: diaVal,
    };
  }

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

          {/* ── Pregnancy Progress Card ──────────────── */}
          <GlassCard className="mb-6 animate-fade-in-up opacity-0 fill-mode-forwards">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-brand flex items-center justify-center shadow-glow-brand">
                  <Baby size={28} className="text-white" />
                </div>
                <div>
                  <p className="text-sm text-slate-400">Gestational Timeline</p>
                  <p className="text-2xl font-bold text-slate-100">Week 14, Day 2</p>
                  <p className="text-xs text-slate-500">2nd Trimester • ACOG Monitoring Active</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <AlertBadge level={riskLevel} size="md" />
                <div className="w-px h-8 bg-glass-border" />
                <Link href="/checkin" className="btn-primary text-sm">
                  <CalendarCheck size={16} />
                  {patientVitals ? "Update Check-in" : "Daily Check-in"}
                </Link>
              </div>
            </div>
            {/* Progress bar */}
            <div className="mt-4">
              <div className="flex justify-between text-xs text-slate-500 mb-1">
                <span>Gestational Progress</span>
                <span>14 / 40 weeks (35%)</span>
              </div>
              <div className="w-full h-2 bg-glass-light rounded-full overflow-hidden">
                <div className="h-full bg-gradient-brand rounded-full transition-all duration-1000" style={{ width: "35%" }} />
              </div>
            </div>
          </GlassCard>

          {/* ── Live Vitals Strip ────────────────────── */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {[
              { icon: <Activity size={20} />, label: "Heart Rate", value: heartRate, unit: "bpm", color: "red" },
              { icon: <TrendingUp size={20} />, label: "Blood Pressure", value: `${sysVal}/${diaVal}`, unit: "mmHg", color: sysVal >= 140 ? "red" : sysVal >= 130 ? "yellow" : "green" },
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
          <div className="grid lg:grid-cols-2 gap-6 mb-6">
            {/* BP Chart */}
            <GlassCard className="animate-fade-in-up opacity-0 fill-mode-forwards animation-delay-300">
              <h3 className="text-sm font-semibold text-slate-300 mb-4 flex items-center gap-2">
                <Activity size={16} className="text-alert-yellow" />
                7-Day Blood Pressure Trajectory
              </h3>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={dynamicBPData}>
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
                7-Day Weight Tracking
              </h3>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={mockWeightData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="date" tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} domain={[71, 74]} />
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
                  <AlertItem time="Longitudinal History" message="Prior 14-day trajectory remains stored in clinical timeline." level="low" />
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
                  { label: "Calendar & History", href: "/calendar", icon: <CalendarCheck size={16} />, desc: "View history log" },
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
        </main>
      </div>
    </div>
  );
}
