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
  Home as HomeIcon,
  LogIn,
  UserPlus,
  ScanLine,
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
            "w-10 h-10 rounded-xl flex items-center justify-center font-bold",
            color === "brand" && "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30",
            color === "green" && "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30",
            color === "yellow" && "bg-amber-500/20 text-amber-400 border border-amber-500/30",
            color === "red" && "bg-rose-500/20 text-rose-400 border border-rose-500/30"
          )}
        >
          {icon}
        </div>
        {trend && (
          <div
            className={cn(
              "flex items-center gap-1 text-xs font-medium",
              trend === "up" && "text-rose-400",
              trend === "down" && "text-emerald-400",
              trend === "stable" && "text-slate-400"
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
        <span className="text-sm font-normal text-slate-400 ml-1">{unit}</span>
      </p>
      <p className="text-sm text-slate-400 mt-1">{label}</p>
    </GlassCard>
  );
}

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
            "w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-transform duration-300 group-hover:scale-110",
            color === "brand" && "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30",
            color === "green" && "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30",
            color === "yellow" && "bg-amber-500/20 text-amber-400 border border-amber-500/30",
            color === "red" && "bg-rose-500/20 text-rose-400 border border-rose-500/30",
            color === "violet" && "bg-purple-500/20 text-purple-400 border border-purple-500/30"
          )}
        >
          {icon}
        </div>
        <h3 className="text-lg font-semibold text-slate-100 mb-2 group-hover:text-cyan-400 transition-colors">
          {title}
        </h3>
        <p className="text-sm text-slate-400 leading-relaxed mb-4">
          {description}
        </p>
        <div className="flex items-center gap-2 text-sm font-medium text-cyan-400 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-0 group-hover:translate-x-1">
          <span>Open</span>
          <ArrowRight size={14} />
        </div>
      </GlassCard>
    </Link>
  );
}

export default function HomePage() {
  const heartRate = useMockVital(78, 8, 2000);
  const systolic = useMockVital(118, 12, 3000);
  const diastolic = useMockVital(76, 8, 3500);
  const weight = useMockVital(72.5, 0.3, 5000);

  return (
    <div className="min-h-screen flex flex-col">
      {/* ── Top Header Bar ────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 glass-heavy border-b border-glass-border/60 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-cyan-500 via-teal-500 to-emerald-500 flex items-center justify-center shadow-[0_0_20px_rgba(6,182,212,0.4)]">
              <Heart size={20} className="text-white" fill="currentColor" />
            </div>
            <div>
              <span className="text-xl font-bold text-gradient-brand">Materna</span>
              <span className="text-[10px] text-cyan-400 ml-1.5 font-mono px-2 py-0.5 rounded bg-cyan-500/20 border border-cyan-500/30">
                CDSS AI
              </span>
            </div>
          </Link>

          <nav className="flex items-center gap-3">
            <Link
              href="/"
              className="btn-ghost flex items-center gap-1.5 text-xs text-slate-200"
            >
              <HomeIcon size={15} className="text-cyan-400" /> Home
            </Link>
            <Link
              href="/ocr"
              className="btn-ghost hidden sm:flex items-center gap-1.5 text-xs text-slate-200"
            >
              <ScanLine size={15} className="text-cyan-400" /> Lab OCR
            </Link>
            <Link
              href="/login"
              className="btn-secondary py-2 px-4 text-xs flex items-center gap-1.5"
            >
              <LogIn size={15} /> Sign In
            </Link>
            <Link
              href="/register"
              className="btn-primary py-2 px-4 text-xs flex items-center gap-1.5"
            >
              <UserPlus size={15} /> Register
            </Link>
          </nav>
        </div>
      </header>

      {/* ── Hero Section ─────────────────────────────────────────── */}
      <section className="relative overflow-hidden flex-1">
        <div className="absolute top-10 left-1/2 -translate-x-1/2 w-[900px] h-[450px] bg-gradient-radial from-cyan-500/25 via-violet-500/15 to-transparent blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto px-6 pt-16 pb-12">
          {/* Badge */}
          <div className="flex justify-center mb-8 animate-fade-in">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass border border-cyan-500/30 text-sm">
              <Shield size={16} className="text-cyan-400" />
              <span className="text-slate-200 font-medium">
                Clinical Decision Support & OCR Memory System
              </span>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            </div>
          </div>

          {/* Title */}
          <div className="text-center max-w-4xl mx-auto animate-fade-in-up">
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight mb-6">
              <span className="text-gradient-brand">Materna AI</span>
              <br />
              <span className="text-slate-100">
                Precision Pregnancy{" "}
                <span className="relative">
                  Monitoring
                  <Heart
                    size={32}
                    className="inline-block ml-3 text-rose-500 animate-heartbeat"
                    fill="currentColor"
                  />
                </span>
              </span>
            </h1>
            <p className="text-lg text-slate-300 leading-relaxed max-w-2xl mx-auto mb-10">
              Longitudinal maternal care, real-time lab OCR scanning, and dual-memory AI assistant for continuous safety monitoring.
            </p>
          </div>

          {/* CTA Buttons on Hero */}
          <div className="flex flex-wrap items-center justify-center gap-4 mb-16 animate-fade-in-up animation-delay-200">
            <Link href="/" className="btn-secondary text-base px-6 py-3.5 flex items-center gap-2">
              <HomeIcon size={18} className="text-cyan-400" /> Home Page
            </Link>
            <Link href="/login" className="btn-primary text-base px-7 py-3.5 flex items-center gap-2">
              <LogIn size={18} /> Sign In to Dashboard
            </Link>
            <Link href="/register" className="btn-secondary text-base px-7 py-3.5 flex items-center gap-2">
              <UserPlus size={18} /> Create Account
            </Link>
            <Link href="/ocr" className="btn-secondary text-base px-7 py-3.5 flex items-center gap-2 text-cyan-300">
              <ScanLine size={18} /> Scan Lab OCR
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
              value={28}
              unit="monitored"
              trend="up"
              color="brand"
              delay="animation-delay-400"
            />
          </div>
        </div>
      </section>

      {/* ── Divider ─────────────────────────────────────── */}
      <div className="divider-gradient max-w-4xl mx-auto my-6" />

      {/* ── Feature Grid ────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-6 py-12">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-slate-100 mb-3">
            Core Clinical Capabilities
          </h2>
          <p className="text-slate-400 max-w-xl mx-auto">
            Everything a maternal care team and patient need — from lab report OCR scanning to long-term chatbot memory.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          <FeatureCard
            icon={<ScanLine size={24} />}
            title="Lab Report OCR Scanner"
            description="Upload lab reports & ultrasound images to parse structured Hemoglobin, Platelets, and Proteinuria metrics."
            href="/ocr"
            color="brand"
            delay="animation-delay-100"
          />
          <FeatureCard
            icon={<ClipboardPlus size={24} />}
            title="Daily Check-in (24h Frequency)"
            description="Log vitals and symptoms once every 24 hours with automatic countdown timer and risk escalation."
            href="/checkin"
            color="green"
            delay="animation-delay-200"
          />
          <FeatureCard
            icon={<Brain size={24} />}
            title="Dual-Memory AI Chatbot"
            description="Short-term conversation memory and long-term lab dataset access to answer questions about past lab trends."
            href="/chat"
            color="violet"
            delay="animation-delay-300"
          />
          <FeatureCard
            icon={<Stethoscope size={24} />}
            title="Doctor Clinical Triage"
            description="Real-time alert queue for physicians with rule-based preeclampsia escalation."
            href="/doctor"
            color="yellow"
            delay="animation-delay-400"
          />
          <FeatureCard
            icon={<Shield size={24} />}
            title="Admin Governance & Token Dashboard"
            description="Admin control panel to manage user roles, review API usage, block users, and audit logs."
            href="/admin"
            color="red"
            delay="animation-delay-500"
          />
          <FeatureCard
            icon={<Activity size={24} />}
            title="Patient Dashboard"
            description="Centralized view of gestational age, upcoming appointments, check-in status, and risk level."
            href="/dashboard"
            color="brand"
            delay="animation-delay-700"
          />
        </div>
      </section>
    </div>
  );
}
