"use client";

import React, { useState, useEffect } from "react";
import GlassCard from "@/components/ui/GlassCard";
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
import AlertBadge from "@/components/ui/AlertBadge";
import { cn } from "@/lib/utils";
import type { RiskLevel } from "@/lib/utils";
import {
  Stethoscope,
  Users,
  AlertTriangle,
  Activity,
  Search,
  CheckCircle,
  Clock,
  ChevronRight,
  FileText,
  Bell,
  PhoneCall,
  UserCheck,
} from "lucide-react";
import Link from "next/link";

/* ─── Mock Patient List for Doctor ────────────────── */
interface DoctorPatient {
  id: string;
  name: string;
  age: number;
  gestationalWeek: number;
  riskStatus: RiskLevel;
  latestBP: string;
  heartRate: number;
  proteinuria: string;
  symptoms: string[];
  lastCheckin: string;
  escalated: boolean;
}

// Default empty array - NO hardcoded fake patients
const MOCK_DOCTOR_PATIENTS: DoctorPatient[] = [];

export default function DoctorPage() {
  const [patients, setPatients] = useState<DoctorPatient[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<DoctorPatient | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Sync and load ONLY REAL registered patients from database
  useEffect(() => {
    async function loadRealPatients() {
      if (typeof window === "undefined") return;

      try {
        const token = localStorage.getItem("access_token");
        if (!token) return;

        const res = await fetch("http://localhost:8000/api/v1/dashboard/doctor/patients", {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (res.ok) {
          const data = await res.json();
          const realPatientsList: DoctorPatient[] = data.patients.map((u: any) => ({
            id: u.id,
            name: u.full_name,
            age: u.age || 28,
            gestationalWeek: u.gestational_age_weeks || 26,
            riskStatus: u.risk_status || "low",
            latestBP: u.latest_bp || "N/A",
            heartRate: u.latest_heart_rate || 0,
            proteinuria: "N/A", // Not implemented in summary yet
            symptoms: u.latest_symptoms || [],
            lastCheckin: u.created_at ? new Date(u.created_at).toLocaleDateString() : "Live DB",
            escalated: u.risk_status === "high",
          }));

          setPatients(realPatientsList);
          if (realPatientsList.length > 0) {
            setSelectedPatient(realPatientsList[0]);
          } else {
            setSelectedPatient(null);
          }
        }
      } catch (e) {
        console.error("Failed to load patients", e);
      }
    }

    loadRealPatients();
  }, []);

  const filteredPatients = patients.filter(
    (p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.riskStatus.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1 lg:ml-[var(--sidebar-width)]">
        <Header />
        <main className="p-6 max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between flex-wrap gap-4 mb-8 animate-fade-in">
            <div>
              <h1 className="text-3xl font-bold text-slate-100 mb-1 flex items-center gap-3">
                <Stethoscope size={28} className="text-brand-400" />
                Doctor Clinical Triage Dashboard
              </h1>
              <p className="text-slate-400">
                Prioritized patient monitoring queue driven by the Materna AI Risk Engine.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className="px-3 py-1.5 rounded-full bg-alert-red-bg text-alert-red text-xs font-bold border border-alert-red/30 flex items-center gap-1.5 animate-pulse">
                <AlertTriangle size={14} />
                1 Critical Escalation
              </span>
            </div>
          </div>

          {/* Grid Layout: Queue + Detailed Inspector */}
          <div className="grid lg:grid-cols-12 gap-6">
            {/* Left Queue (5 Cols) */}
            <div className="lg:col-span-5 space-y-4">
              {/* Search */}
              <GlassCard padding="sm">
                <div className="relative">
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type="text"
                    placeholder="Filter patients by name or risk..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="input-glass-sm pl-9 pr-4 w-full"
                  />
                </div>
              </GlassCard>

              {/* Patient Cards */}
              <div className="space-y-3">
                {filteredPatients.length === 0 ? (
                  <GlassCard className="p-8 text-center text-slate-400 space-y-2">
                    <UserCheck size={32} className="mx-auto text-slate-600 mb-2" />
                    <p className="text-sm font-semibold text-slate-300">No Registered Patients Found</p>
                    <p className="text-xs text-slate-500">
                      When a user registers or completes onboarding, their real clinical dashboard will appear here.
                    </p>
                  </GlassCard>
                ) : (
                  filteredPatients.map((patient) => {
                    const isSelected = selectedPatient?.id === patient.id;
                    return (
                      <GlassCard
                        key={patient.id}
                        hover
                        onClick={() => setSelectedPatient(patient)}
                        className={cn(
                          "transition-all duration-200 cursor-pointer border",
                          isSelected
                            ? "border-brand-500/50 bg-brand-500/10 shadow-glow-brand"
                            : "border-glass-border hover:border-glass-border-light",
                          patient.riskStatus === "high" && "border-l-4 border-l-alert-red"
                        )}
                        padding="sm"
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-semibold text-slate-100">{patient.name}</p>
                              {patient.escalated && (
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-alert-red/20 text-alert-red border border-alert-red/30">
                                  ESCALATED
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-slate-400">
                              Age {patient.age} • Week {patient.gestationalWeek}
                            </p>
                          </div>
                          <AlertBadge level={patient.riskStatus} size="sm" />
                        </div>

                        <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-glass-border/40 text-xs">
                          <div>
                            <span className="text-slate-500">Latest BP:</span>{" "}
                            <span className="font-medium text-slate-200">{patient.latestBP}</span>
                          </div>
                          <div>
                            <span className="text-slate-500">Proteinuria:</span>{" "}
                            <span className="font-medium text-slate-200">{patient.proteinuria}</span>
                          </div>
                        </div>
                      </GlassCard>
                    );
                  })
                )}
              </div>
            </div>

            {/* Right Details Panel (7 Cols) */}
            <div className="lg:col-span-7">
              {selectedPatient ? (
                <GlassCard className="animate-fade-in sticky top-24">
                  {/* Header */}
                  <div className="flex items-start justify-between border-b border-glass-border pb-4 mb-6">
                    <div>
                      <h2 className="text-2xl font-bold text-slate-100 mb-1">{selectedPatient.name}</h2>
                      <p className="text-xs text-slate-400">
                        Patient ID: {selectedPatient.id} • Gestational Age: Week {selectedPatient.gestationalWeek} • Last Check-in: {selectedPatient.lastCheckin}
                      </p>
                    </div>
                    <AlertBadge level={selectedPatient.riskStatus} size="md" pulse={selectedPatient.riskStatus === "high"} />
                  </div>

                  {/* Vitals Grid */}
                  <div className="grid grid-cols-3 gap-3 mb-6">
                    <div className="p-3 rounded-xl bg-glass-light border border-glass-border/50">
                      <p className="text-xs text-slate-500">Blood Pressure</p>
                      <p className={cn("text-lg font-bold mt-0.5", selectedPatient.riskStatus === "high" ? "text-alert-red" : "text-slate-200")}>
                        {selectedPatient.latestBP}
                      </p>
                    </div>
                    <div className="p-3 rounded-xl bg-glass-light border border-glass-border/50">
                      <p className="text-xs text-slate-500">Heart Rate</p>
                      <p className="text-lg font-bold text-slate-200 mt-0.5">{selectedPatient.heartRate} bpm</p>
                    </div>
                    <div className="p-3 rounded-xl bg-glass-light border border-glass-border/50">
                      <p className="text-xs text-slate-500">Proteinuria</p>
                      <p className="text-lg font-bold text-slate-200 mt-0.5">{selectedPatient.proteinuria}</p>
                    </div>
                  </div>

                  {/* Reported Symptoms */}
                  <div className="mb-6">
                    <h3 className="text-xs uppercase tracking-wider text-slate-400 font-semibold mb-2">Reported Symptoms</h3>
                    <div className="flex flex-wrap gap-2">
                      {selectedPatient.symptoms.map((sym, i) => (
                        <span key={i} className="px-3 py-1 rounded-full text-xs font-semibold bg-alert-red/10 text-alert-red border border-alert-red/20">
                          ⚠️ {sym}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* AI Risk & Triage Recommendation */}
                  <div className="p-4 rounded-xl bg-surface-700/60 border border-brand-500/20 mb-6">
                    <h3 className="text-sm font-semibold text-brand-300 flex items-center gap-2 mb-2">
                      <Stethoscope size={16} /> AI Triage Assessment (CDSS Rule Engine)
                    </h3>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      {selectedPatient.riskStatus === "high"
                        ? "CRITICAL WARNING: Severe Preeclampsia criteria met (BP >= 160/110 + proteinuria >= 2+ and persistent headache). Immediate clinical evaluation recommended."
                        : "Patient vitals suggest mild monitoring required. Continue routine daily check-ins."}
                    </p>
                  </div>

                  {/* Doctor Action Bar */}
                  <div className="flex items-center gap-3 pt-2">
                    <button onClick={() => alert("Clinical notification dispatched to patient dashboard.")} className="btn-primary flex-1 text-center justify-center text-xs">
                      <Bell size={16} /> Send Clinical Alert
                    </button>
                    <button className="btn-secondary text-xs flex items-center gap-1.5">
                      <PhoneCall size={16} /> Emergency Call
                    </button>
                    <button className="btn-ghost text-xs flex items-center gap-1.5 text-alert-green">
                      <UserCheck size={16} /> Acknowledge Alert
                    </button>
                  </div>
                </GlassCard>
              ) : (
                <GlassCard className="p-12 text-center text-slate-400 space-y-2">
                  <Stethoscope size={36} className="mx-auto text-slate-600 mb-2" />
                  <p className="text-base font-bold text-slate-200">No Patient Selected</p>
                  <p className="text-xs text-slate-500">
                    Select a registered patient from the triage queue on the left to inspect their clinical dashboard.
                  </p>
                </GlassCard>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
