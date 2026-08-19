"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import GlassCard from "@/components/ui/GlassCard";
import AlertBadge from "@/components/ui/AlertBadge";
import { cn } from "@/lib/utils";
import { Patient, DashboardSummary } from "@/types/patient";
import { getPatients, getDashboardSummary } from "@/lib/api/patients";
import {
  Users,
  Activity,
  AlertTriangle,
  TrendingUp,
  Clock,
  ArrowUpRight,
  Loader2,
  RefreshCcw,
  CheckCircle
} from "lucide-react";

/* ─── Summary Stats Component ─────────────────────────────────────────── */
function SummaryCard({
  icon,
  label,
  value,
  color,
  delay,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  color: string;
  delay: string;
}) {
  return (
    <GlassCard
      className={cn(
        "animate-fade-in-up opacity-0 fill-mode-forwards",
        delay
      )}
    >
      <div className="flex items-center gap-4">
        <div
          className={cn(
            "w-12 h-12 rounded-xl flex items-center justify-center",
            color
          )}
        >
          {icon}
        </div>
        <div>
          <p className="text-3xl font-bold text-slate-100">{value}</p>
          <p className="text-sm text-slate-500">{label}</p>
        </div>
      </div>
    </GlassCard>
  );
}

/* ─── Dashboard Page ────────────────────────────────────────── */
export default function DashboardPage() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [patientsData, summaryData] = await Promise.all([
        getPatients(),
        getDashboardSummary(),
      ]);
      setPatients(patientsData);
      setSummary(summaryData);
    } catch (err) {
      setError("Failed to load dashboard data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const formatTimeAgo = (isoString: string) => {
    const diffMins = Math.round((Date.now() - new Date(isoString).getTime()) / 60000);
    if (diffMins < 60) return `${diffMins} min ago`;
    const diffHours = Math.round(diffMins / 60);
    if (diffHours < 24) return `${diffHours} hr ago`;
    return `${Math.round(diffHours / 24)} days ago`;
  };

  return (
    <div className="space-y-8">
      {/* ── Page Title & Controls ─────────────────────────────────── */}
      <div className="flex items-end justify-between animate-fade-in">
        <div>
          <h1 className="text-3xl font-bold text-slate-100">Doctor Dashboard</h1>
          <p className="text-slate-400 mt-1">
            Real-time patient monitoring — prioritized by risk level
          </p>
        </div>
        <button 
          onClick={fetchData} 
          disabled={loading}
          className="btn-secondary flex items-center gap-2"
        >
          <RefreshCcw size={16} className={cn(loading && "animate-spin")} />
          Refresh
        </button>
      </div>

      {/* ── Error State ─────────────────────────────────────────── */}
      {error && (
        <div className="p-4 rounded-xl bg-alert-red-bg border border-alert-red-border flex items-start gap-3 animate-fade-in">
          <AlertTriangle className="text-alert-red flex-shrink-0 mt-0.5" size={20} />
          <p className="text-sm text-alert-red">{error}</p>
        </div>
      )}

      {/* ── Loading State ───────────────────────────────────────── */}
      {loading && !summary && (
        <div className="flex flex-col items-center justify-center py-24 text-slate-400 animate-fade-in">
          <Loader2 size={32} className="animate-spin mb-4 text-brand-500" />
          <p>Connecting to secure clinic network...</p>
        </div>
      )}

      {/* ── Summary Cards ──────────────────────────────── */}
      {!loading && summary && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <SummaryCard
            icon={<Users size={22} className="text-brand-400" />}
            label="Total Patients"
            value={summary.totalPatients}
            color="bg-brand-500/15"
            delay="animation-delay-100"
          />
          <SummaryCard
            icon={<AlertTriangle size={22} className="text-alert-red" />}
            label="High Priority"
            value={summary.highPriorityCount}
            color="bg-alert-red-bg"
            delay="animation-delay-200"
          />
          <SummaryCard
            icon={<Activity size={22} className="text-alert-orange" />}
            label="Clinical Review"
            value={summary.clinicalReviewCount}
            color="bg-alert-orange-bg"
            delay="animation-delay-300"
          />
          <SummaryCard
            icon={<TrendingUp size={22} className="text-alert-yellow" />}
            label="Monitoring"
            value={summary.monitoringCount}
            color="bg-alert-yellow-bg"
            delay="animation-delay-400"
          />
        </div>
      )}

      {/* ── Patient List ───────────────────────────────── */}
      {!loading && patients && (
        <GlassCard padding="none" className="animate-fade-in-up animation-delay-300 opacity-0 fill-mode-forwards overflow-hidden">
          <div className="px-6 py-4 border-b border-glass-border/50 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-100">
                Patient Queue
              </h2>
              <p className="text-xs text-slate-500">
                Sorted by risk severity: Red → Orange → Yellow → Green
              </p>
            </div>
          </div>

          {patients.length === 0 ? (
            <div className="px-6 py-12 text-center text-slate-400">
              <CheckCircle size={32} className="mx-auto mb-3 text-alert-green" />
              <p>No patients currently in the queue.</p>
            </div>
          ) : (
            <div className="divide-y divide-glass-border/30">
              {patients.map((patient, index) => (
                <Link
                  href={`/patients/${patient.id}`}
                  key={patient.id}
                  className={cn(
                    "flex items-center gap-4 px-6 py-4",
                    "hover:bg-glass/50 transition-all duration-200 cursor-pointer group",
                    "animate-slide-in-right opacity-0 fill-mode-forwards",
                    index === 0 && "animation-delay-100",
                    index === 1 && "animation-delay-200",
                    index === 2 && "animation-delay-300",
                    index === 3 && "animation-delay-400",
                    index === 4 && "animation-delay-500",
                    index === 5 && "animation-delay-700"
                  )}
                >
                  {/* Risk indicator bar */}
                  <div
                    className={cn(
                      "w-1 h-12 rounded-full flex-shrink-0",
                      patient.riskLevel === "high" && "bg-alert-red animate-pulse-glow-red",
                      patient.riskLevel === "clinical_review" && "bg-alert-orange",
                      patient.riskLevel === "monitor" && "bg-alert-yellow",
                      patient.riskLevel === "low" && "bg-alert-green"
                    )}
                  />

                  {/* Patient info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="text-sm font-semibold text-slate-200 group-hover:text-white transition-colors">
                        {patient.name}
                      </h3>
                      <AlertBadge level={patient.riskLevel} size="sm" />
                    </div>
                    <p className="text-xs text-slate-500 truncate">
                      {patient.clinicalTrendSummary}
                    </p>
                  </div>

                  {/* Vitals */}
                  <div className="hidden md:flex items-center gap-6 text-sm">
                    <div className="text-center">
                      <p className="text-slate-500 text-xs">Age</p>
                      <p className="text-slate-300 font-medium">{patient.age}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-slate-500 text-xs">Week</p>
                      <p className="text-slate-300 font-medium">{patient.gestationalAgeWeeks}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-slate-500 text-xs">BP</p>
                      <p
                        className={cn(
                          "font-mono font-medium",
                          patient.riskLevel === "high" && "text-alert-red",
                          patient.riskLevel === "clinical_review" && "text-alert-orange",
                          patient.riskLevel === "monitor" && "text-alert-yellow",
                          patient.riskLevel === "low" && "text-alert-green"
                        )}
                      >
                        {patient.latestVitals?.bloodPressure || "--/--"}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-slate-500 text-xs flex items-center gap-1 justify-center">
                        <Clock size={10} />
                        Check-in
                      </p>
                      <p className="text-slate-400 text-xs">{formatTimeAgo(patient.lastCheckInAt)}</p>
                    </div>
                  </div>

                  {/* Arrow */}
                  <div className="ml-2 w-8 h-8 rounded-full bg-glass-light border border-glass-border flex items-center justify-center group-hover:border-brand-500/50 group-hover:bg-brand-500/10 transition-colors">
                    <ArrowUpRight
                      size={16}
                      className="text-slate-500 group-hover:text-brand-400 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                    />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </GlassCard>
      )}
    </div>
  );
}
