import React from "react";
import GlassCard from "@/components/ui/GlassCard";
import AlertBadge from "@/components/ui/AlertBadge";
import { getPatientById } from "@/lib/api/patients";
import { notFound } from "next/navigation";
import { Activity, Clock, FileText, ActivitySquare } from "lucide-react";
import Link from "next/link";

export default async function PatientDetailsPage({ params }: { params: { id: string } }) {
  // Await the mocked network fetch
  const patient = await getPatientById(params.id);

  if (!patient) {
    notFound();
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* ── Header ── */}
      <div className="flex items-center justify-between animate-fade-in">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-3xl font-bold text-slate-100">{patient.name}</h1>
            <AlertBadge level={patient.riskLevel} />
          </div>
          <p className="text-slate-400">
            Patient ID: {patient.id} • {patient.age} yrs • Week {patient.gestationalAgeWeeks}
          </p>
        </div>
        <Link href="/dashboard" className="btn-secondary">
          Back to Dashboard
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ── Left Column: Vitals & History ── */}
        <div className="lg:col-span-2 space-y-6">
          <GlassCard className="animate-fade-in-up animation-delay-100">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-brand-500/15 text-brand-400 rounded-lg">
                <ActivitySquare size={20} />
              </div>
              <h2 className="text-xl font-semibold text-slate-100">Latest Vitals</h2>
            </div>
            
            <div className="grid grid-cols-3 gap-4">
              <div className="p-4 rounded-xl bg-glass-light border border-glass-border text-center">
                <p className="text-sm text-slate-400 mb-1">Blood Pressure</p>
                <p className="text-2xl font-mono text-slate-100">{patient.latestVitals?.bloodPressure}</p>
              </div>
              <div className="p-4 rounded-xl bg-glass-light border border-glass-border text-center">
                <p className="text-sm text-slate-400 mb-1">Weight</p>
                <p className="text-2xl font-mono text-slate-100">{patient.latestVitals?.weight} <span className="text-sm text-slate-500">kg</span></p>
              </div>
              <div className="p-4 rounded-xl bg-glass-light border border-glass-border text-center">
                <p className="text-sm text-slate-400 mb-1">Symptoms</p>
                <p className="text-lg font-medium text-alert-orange">
                  {patient.symptoms && patient.symptoms.length > 0 ? patient.symptoms.length : "None"}
                </p>
              </div>
            </div>
          </GlassCard>
        </div>

        {/* ── Right Column: AI Explanation (Task 5.5 Placeholder) ── */}
        <div className="space-y-6">
          <GlassCard variant="subtle" className="border-brand-500/30 animate-fade-in-up animation-delay-200">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-brand-500/20 text-brand-400 rounded-lg shadow-glow-blue">
                <Activity size={20} />
              </div>
              <h2 className="text-lg font-semibold text-slate-100">AI Risk Analysis</h2>
            </div>
            <div className="p-4 rounded-lg bg-glass-light border border-glass-border/50">
              <p className="text-sm text-slate-300 leading-relaxed italic">
                {/* This will be replaced by the SSE stream in Task 5.5 */}
                Waiting for Triage Agent stream...
              </p>
              <p className="text-xs text-slate-500 mt-4 pt-4 border-t border-glass-border/50">
                Current Trend: {patient.clinicalTrendSummary}
              </p>
            </div>
          </GlassCard>
        </div>
      </div>
    </div>
  );
}
