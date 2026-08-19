"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import GlassCard from "@/components/ui/GlassCard";
import AlertBadge from "@/components/ui/AlertBadge";
import {
  Heart,
  Activity,
  Users,
  ClipboardPlus,
  MessageCircle,
  Shield,
  ArrowRight,
  Stethoscope,
  Brain,
  TrendingUp,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";

/* ─── Mock Live Vital Data ──────────────────────────────────── */
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

/* ─── Stat Card ─────────────────────────────────────────────── */
function StatCard({
  icon,
  label,
  value,
  unit,
  trend,
  color,
  delay,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  unit: string;
  trend?: "up" | "down" | "stable";
  color: string;
  delay: string;
}) {
  return (
    <GlassCard
      hover
      className={cn(
        "animate-fade-in-up opacity-0 fill-mode-forwards",
        delay
      )}
    >
      <div className="flex items-start justify-between mb-3">
        <div
          className={cn(
            "w-10 h-10 rounded-xl flex items-center justify-center",
            color === "brand" && "bg-brand-500/15 text-brand-400",
            color === "green" && "bg-alert-green-bg text-alert-green",
            color === "yellow" && "bg-alert-yellow-bg text-alert-yellow",
            color === "red" && "bg-alert-red-bg text-alert-red"
          )}
        >
          {icon}
        </div>
        {trend && (
          <div
            className={cn(
              "flex items-center gap-1 text-xs font-medium",
              trend === "up" && "text-alert-red",
              trend === "down" && "text-alert-green",
              trend === "stable" && "text-slate-500"
            )}
          >
            <TrendingUp
              size={12}
              className={cn(
                trend === "down" && "rotate-180",
                trend === "stable" && "rotate-0"
              )}
            />
            {trend === "up" ? "+2.3%" : trend === "down" ? "-1.1%" : "0.0%"}
          </div>
        )}
      </div>
      <p className="text-2xl font-bold text-slate-100 tracking-tight">
        {value}
        <span className="text-sm font-normal text-slate-500 ml-1">{unit}</span>
      </p>
      <p className="text-sm text-slate-500 mt-1">{label}</p>
    </GlassCard>
  );
}

/* ─── Feature Card ──────────────────────────────────────────── */
function FeatureCard({
  icon,
  title,
  description,
  href,
  color,
  delay,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  href: string;
  color: string;
  delay: string;
}) {
  return (
    <Link href={href} className="block group">
      <GlassCard
        hover
        className={cn(
          "h-full animate-fade-in-up opacity-0 fill-mode-forwards",
          delay
        )}
      >
        <div
          className={cn(
            "w-12 h-12 rounded-xl flex items-center justify-center mb-4",
            "transition-transform duration-300 group-hover:scale-110",
            color === "brand" && "bg-brand-500/15 text-brand-400",
            color === "green" && "bg-alert-green-bg text-alert-green",
            color === "yellow" && "bg-alert-yellow-bg text-alert-yellow",
            color === "red" && "bg-alert-red-bg text-alert-red",
            color === "violet" &&
              "bg-purple-500/15 text-purple-400"
          )}
        >
          {icon}
        </div>
        <h3 className="text-lg font-semibold text-slate-100 mb-2 group-hover:text-brand-400 transition-colors">
          {title}
        </h3>
        <p className="text-sm text-slate-400 leading-relaxed mb-4">
          {description}
        </p>
        <div className="flex items-center gap-2 text-sm font-medium text-brand-400 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-0 group-hover:translate-x-1">
          <span>Open</span>
          <ArrowRight size={14} />
        </div>
      </GlassCard>
    </Link>
  );
}

/* ─── Main Page ─────────────────────────────────────────────── */
export default function HomePage() {
  const heartRate = useMockVital(78, 8, 2000);
  const systolic = useMockVital(118, 12, 3000);
  const diastolic = useMockVital(76, 8, 3500);
  const weight = useMockVital(72.5, 0.3, 5000);

  return (
    <div className="min-h-screen">
      {/* ══════════════════════════════════════════════════
          HERO SECTION
          ══════════════════════════════════════════════════ */}
      <section className="relative overflow-hidden">
        {/* Extra glow orbs for hero */}
        <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-gradient-radial from-brand-500/20 via-transparent to-transparent blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto px-6 pt-16 pb-12">
          {/* Badge */}
          <div className="flex justify-center mb-8 animate-fade-in">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass text-sm">
              <Shield size={14} className="text-brand-400" />
              <span className="text-slate-400">
                Clinical Decision Support System
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-alert-green animate-pulse" />
            </div>
          </div>

          {/* Title */}
          <div className="text-center max-w-3xl mx-auto animate-fade-in-up">
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight mb-6">
              <span className="text-gradient-brand">Materna</span>
              <br />
              <span className="text-slate-200">
                Protecting Every{" "}
                <span className="relative">
                  Heartbeat
                  <Heart
                    size={28}
                    className="inline-block ml-2 text-alert-red animate-heartbeat"
                    fill="currentColor"
                  />
                </span>
              </span>
            </h1>
            <p className="text-lg text-slate-400 leading-relaxed max-w-2xl mx-auto mb-10">
              AI-powered longitudinal pregnancy monitoring that eliminates the
              blind spots between prenatal visits. Continuously track, detect
              risks early, and deliver evidence-based alerts to save lives.
            </p>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16 animate-fade-in-up animation-delay-200">
            <Link href="/login" className="btn-primary text-base px-8 py-4">
              <Users size={18} />
              Login to Account
            </Link>
            <Link href="/register" className="btn-secondary text-base px-8 py-4">
              <ClipboardPlus size={18} />
              Create Patient Account
            </Link>
          </div>

          {/* ── Live Vitals Strip ─────────────────────────── */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 max-w-4xl mx-auto">
            <StatCard
              icon={<Activity size={20} />}
              label="Heart Rate"
              value={heartRate}
              unit="bpm"
              trend="stable"
              color="red"
              delay="animation-delay-100"
            />
            <StatCard
              icon={<TrendingUp size={20} />}
              label="Blood Pressure"
              value={`${systolic}/${diastolic}`}
              unit="mmHg"
              trend="up"
              color="yellow"
              delay="animation-delay-200"
            />
            <StatCard
              icon={<Zap size={20} />}
              label="Weight"
              value={weight}
              unit="kg"
              trend="stable"
              color="green"
              delay="animation-delay-300"
            />
            <StatCard
              icon={<Users size={20} />}
              label="Active Patients"
              value={24}
              unit="today"
              trend="up"
              color="brand"
              delay="animation-delay-400"
            />
          </div>
        </div>
      </section>

      {/* ── Divider ─────────────────────────────────────── */}
      <div className="divider-gradient max-w-4xl mx-auto" />

      {/* ══════════════════════════════════════════════════
          ALERT LEVELS SHOWCASE
          ══════════════════════════════════════════════════ */}
      <section className="max-w-7xl mx-auto px-6 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-slate-100 mb-3">
            4-Level Risk Assessment
          </h2>
          <p className="text-slate-400 max-w-xl mx-auto">
            Intelligent, deterministic clinical rules that the AI cannot
            override. Every vital sign is evaluated against evidence-based
            thresholds.
          </p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 max-w-4xl mx-auto">
          {/* GREEN */}
          <GlassCard
            variant="low"
            className="text-center animate-fade-in-up opacity-0 fill-mode-forwards animation-delay-100"
          >
            <div className="text-3xl mb-3">🟢</div>
            <AlertBadge level="low" size="sm" showIcon={false} />
            <p className="text-xs text-slate-500 mt-3">
              Normal vitals. Continue routine monitoring.
            </p>
          </GlassCard>

          {/* YELLOW */}
          <GlassCard
            variant="monitor"
            className="text-center animate-fade-in-up opacity-0 fill-mode-forwards animation-delay-200"
          >
            <div className="text-3xl mb-3">🟡</div>
            <AlertBadge level="monitor" size="sm" showIcon={false} />
            <p className="text-xs text-slate-500 mt-3">
              Subtle trend detected. Increased observation recommended.
            </p>
          </GlassCard>

          {/* ORANGE */}
          <GlassCard
            variant="clinical_review"
            className="text-center animate-fade-in-up opacity-0 fill-mode-forwards animation-delay-300"
          >
            <div className="text-3xl mb-3">🟠</div>
            <AlertBadge level="clinical_review" size="sm" showIcon={false} />
            <p className="text-xs text-slate-500 mt-3">
              Multi-factor risk pattern. Physician review required.
            </p>
          </GlassCard>

          {/* RED */}
          <GlassCard
            variant="high"
            className="text-center animate-fade-in-up opacity-0 fill-mode-forwards animation-delay-400"
          >
            <div className="text-3xl mb-3">🔴</div>
            <AlertBadge level="high" size="sm" showIcon={false} />
            <p className="text-xs text-slate-500 mt-3">
              Critical threshold breached. Immediate escalation.
            </p>
          </GlassCard>
        </div>
      </section>

      {/* ── Divider ─────────────────────────────────────── */}
      <div className="divider-gradient max-w-4xl mx-auto" />

      {/* ══════════════════════════════════════════════════
          FEATURE GRID
          ══════════════════════════════════════════════════ */}
      <section className="max-w-7xl mx-auto px-6 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-slate-100 mb-3">
            Core Capabilities
          </h2>
          <p className="text-slate-400 max-w-xl mx-auto">
            Everything a maternal care team needs — from patient onboarding to
            AI-powered risk explanations.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          <FeatureCard
            icon={<ClipboardPlus size={24} />}
            title="Patient Onboarding"
            description="Comprehensive baseline profile with medical history, obstetric data, and risk factor assessment."
            href="/onboarding"
            color="brand"
            delay="animation-delay-100"
          />
          <FeatureCard
            icon={<Activity size={24} />}
            title="Daily Check-in"
            description="Wizard-style vital logging — blood pressure, weight, symptoms, and fetal monitoring in under 2 minutes."
            href="/checkin"
            color="green"
            delay="animation-delay-200"
          />
          <FeatureCard
            icon={<Heart size={24} />}
            title="My Health Profile"
            description="View your active vital trends, upcoming check-ins, and personal medical baseline."
            href="/chat"
            color="yellow"
            delay="animation-delay-300"
          />
          <FeatureCard
            icon={<Brain size={24} />}
            title="AI Medical Assistant"
            description="Ask questions about your pregnancy symptoms and receive safe, evidence-based guidance."
            href="/chat"
            color="violet"
            delay="animation-delay-400"
          />
          <FeatureCard
            icon={<MessageCircle size={24} />}
            title="Smart Chat + OCR"
            description="24/7 empathetic chatbot with lab test image upload. OCR extracts structured data automatically."
            href="/chat"
            color="brand"
            delay="animation-delay-500"
          />
          <FeatureCard
            icon={<Shield size={24} />}
            title="Safety Guardrails"
            description="Deterministic clinical rules that AI cannot override. CDSS disclaimers on every interface."
            href="/chat"
            color="red"
            delay="animation-delay-700"
          />
        </div>
      </section>

      {/* ── Bottom Spacer ───────────────────────────────── */}
      <div className="h-8" />
    </div>
  );
}
