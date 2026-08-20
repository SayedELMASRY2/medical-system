"use client";

import React, { useState } from "react";
import GlassCard from "@/components/ui/GlassCard";
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
import { cn } from "@/lib/utils";
import {
  FileText,
  ClipboardCheck,
  Upload,
  Download,
  CheckCircle,
  FilePlus,
  ArrowRight,
  Shield,
} from "lucide-react";
import Link from "next/link";

const CLINICAL_FORMS = [
  {
    id: "form-1",
    title: "Patient Pregnancy Baseline Onboarding",
    description: "Captures initial obstetric history (G/P, EDD, baseline vitals) and past medical conditions.",
    category: "Intake",
    status: "Completed",
    link: "/onboarding",
  },
  {
    id: "form-2",
    title: "Daily Longitudinal Vitals Check-in",
    description: "Daily 6-section check-in covering BP, weight, proteinuria, symptoms, and fetal movement.",
    category: "Daily",
    status: "Active",
    link: "/checkin",
  },
  {
    id: "form-3",
    title: "Preeclampsia Risk Assessment Form",
    description: "Evidence-based ACOG criteria checklist for preeclampsia with severe features.",
    category: "Assessment",
    status: "Ready",
    link: "/checkin",
  },
  {
    id: "form-4",
    title: "Laboratory Report & Vision OCR Upload",
    description: "Upload CBC, renal function, or urine analysis reports for AI Vision processing.",
    category: "Diagnostics",
    status: "Ready",
    link: "/chat",
  },
];

export default function FormsPage() {
  const [downloading, setDownloading] = useState<string | null>(null);

  const handleDownloadPDF = (id: string) => {
    setDownloading(id);
    setTimeout(() => setDownloading(null), 2000);
  };

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1 lg:ml-[var(--sidebar-width)]">
        <Header />
        <main className="p-6 max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-8 animate-fade-in">
            <h1 className="text-3xl font-bold text-slate-100 mb-1 flex items-center gap-3">
              <FileText size={28} className="text-brand-400" />
              Clinical Forms & Records
            </h1>
            <p className="text-slate-400">
              Access pregnancy intake forms, daily check-in logs, and clinical summary reports.
            </p>
          </div>

          {/* Forms List Grid */}
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            {CLINICAL_FORMS.map((form, i) => (
              <GlassCard
                key={form.id}
                hover
                className={cn("animate-fade-in-up flex flex-col justify-between", `animation-delay-${(i + 1) * 100}`)}
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-brand-500/20 text-brand-300 border border-brand-500/30">
                      {form.category}
                    </span>
                    <span className="text-xs text-alert-green font-medium flex items-center gap-1">
                      <CheckCircle size={12} /> {form.status}
                    </span>
                  </div>
                  <h3 className="text-lg font-semibold text-slate-100 mb-2">{form.title}</h3>
                  <p className="text-xs text-slate-400 leading-relaxed mb-4">{form.description}</p>
                </div>

                <div className="flex items-center gap-3 pt-4 border-t border-glass-border/40">
                  <Link href={form.link} className="btn-primary text-xs flex-1 text-center justify-center">
                    Open Form <ArrowRight size={14} />
                  </Link>
                  <button
                    onClick={() => handleDownloadPDF(form.id)}
                    className="btn-secondary text-xs flex items-center gap-1.5"
                  >
                    <Download size={14} />
                    {downloading === form.id ? "Exporting..." : "PDF Summary"}
                  </button>
                </div>
              </GlassCard>
            ))}
          </div>

          {/* CDSS Notice */}
          <GlassCard className="animate-fade-in">
            <div className="flex items-center gap-3 text-xs text-slate-400">
              <Shield size={20} className="text-brand-400 flex-shrink-0" />
              <p>
                All medical forms completed in Materna CDSS are encrypted and processed according to clinical privacy standards. Form data is fed directly into the Deterministic Risk Engine.
              </p>
            </div>
          </GlassCard>
        </main>
      </div>
    </div>
  );
}
