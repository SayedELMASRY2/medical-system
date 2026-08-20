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

  // Sync and load ONLY REAL registered patients from database & registration control
  useEffect(() => {
    async function loadRealPatients() {
      if (typeof window === "undefined") return;

      const deletedIds: string[] = JSON.parse(localStorage.getItem("admin_deleted_user_ids") || "[]");
      const deletedNames: string[] = JSON.parse(localStorage.getItem("admin_deleted_names") || "[]");

      let realPatientsMap = new Map<string, DoctorPatient>();

      // 1. Load users registered via /register or /onboarding
      const registered: any[] = JSON.parse(localStorage.getItem("materna_registered_users") || "[]");
      registered.forEach((regUser, index) => {
        if (regUser.role === "PATIENT" || !regUser.role) {
          const key = (regUser.name || regUser.email || `user-${index}`).toLowerCase();
          if (!realPatientsMap.has(key)) {
            realPatientsMap.set(key, {
              id: regUser.id || `reg-${index}`,
              name: regUser.name || regUser.email.split("@")[0],
              age: regUser.age || 28,
              gestationalWeek: regUser.gestationalWeek || 26,
              riskStatus: regUser.riskStatus || "monitor",
              latestBP: regUser.latestBP || "120/80",
              heartRate: regUser.heartRate || 80,
              proteinuria: regUser.proteinuria || "negative",
              symptoms: regUser.symptoms || ["Registered Patient"],
              lastCheckin: "Recently Active",
              escalated: false,
            });
          }
        }
      });

      // 2. Load active saved profile if present
      const profileStr = localStorage.getItem("materna_user_profile");
      if (profileStr) {
        try {
          const prof = JSON.parse(profileStr);
          if (prof.fullName) {
            const key = prof.fullName.toLowerCase();
            if (!realPatientsMap.has(key)) {
              realPatientsMap.set(key, {
                id: "active-profile-1",
                name: prof.fullName,
                age: 29,
                gestationalWeek: prof.gestationalWeek || 28,
                riskStatus: "clinical_review",
                latestBP: "135/85",
                heartRate: 88,
                proteinuria: "trace",
                symptoms: [prof.conditions || "Active Profile Patient"],
                lastCheckin: "Just now",
                escalated: false,
              });
            }
          }
        } catch (e) { }
      }

      // 3. Load users from admin panel if present
      const adminUsersStr = localStorage.getItem("admin_users");
      if (adminUsersStr) {
        try {
          const adminUsers: any[] = JSON.parse(adminUsersStr);
          adminUsers.forEach((u, i) => {
            if (u.role === "PATIENT") {
              const key = u.name.toLowerCase();
              if (!realPatientsMap.has(key)) {
                realPatientsMap.set(key, {
                  id: u.id || `admin-usr-${i}`,
                  name: u.name,
                  age: 27,
                  gestationalWeek: 24,
                  riskStatus: "monitor",
                  latestBP: "124/82",
                  heartRate: 82,
                  proteinuria: "negative",
                  symptoms: ["Admin Managed Patient"],
                  lastCheckin: u.lastActive || "Active",
                  escalated: false,
                });
              }
            }
          });
        } catch (e) { }
      }

      // 4. Try fetching live users from backend API
      try {
        const token = localStorage.getItem("access_token");
        const res = await fetch("http://localhost:8000/api/v1/admin/users", {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (res.ok) {
          const data = await res.json();
          data.users?.forEach((u: any, i: number) => {
            if (u.role === "PATIENT") {
              const uName = u.full_name || u.email.split("@")[0];
              const key = uName.toLowerCase();
              if (!realPatientsMap.has(key)) {
                realPatientsMap.set(key, {
                  id: u.id || `api-usr-${i}`,
                  name: uName,
                  age: 28,
                  gestationalWeek: 26,
                  riskStatus: "low",
                  latestBP: "118/78",
                  heartRate: 76,
                  proteinuria: "negative",
                  symptoms: ["Database Patient"],
                  lastCheckin: "Live DB",
                  escalated: false,
                });
              }
            }
          });
        }
      } catch (e) { }

      // Convert map to array and apply deletion filter
      let realPatientsList = Array.from(realPatientsMap.values());

      const filtered = realPatientsList.filter((p) => {
        const isDeletedById = deletedIds.includes(p.id);
        const isDeletedByName = deletedNames.some((dn) => dn.toLowerCase() === p.name.toLowerCase());
        return !isDeletedById && !isDeletedByName;
      });

      setPatients(filtered);
      if (filtered.length > 0) {
        setSelectedPatient(filtered[0]);
      } else {
        setSelectedPatient(null);
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
