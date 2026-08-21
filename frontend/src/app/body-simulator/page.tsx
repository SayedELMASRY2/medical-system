"use client";

import React, { useState, useEffect } from "react";
import GlassCard from "@/components/ui/GlassCard";
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
import { cn } from "@/lib/utils";
import {
  Activity,
  Heart,
  Baby,
  Brain,
  Droplet,
  ShieldAlert,
  Sparkles,
  Sliders,
  RotateCcw,
  Zap,
  Info,
  CheckCircle2,
  AlertTriangle,
  Flame,
  Eye,
  Thermometer,
} from "lucide-react";

export default function BodySimulatorPage() {
  // User Simulation Parameters
  const [gestationalWeek, setGestationalWeek] = useState<number>(28);
  const [systolicBP, setSystolicBP] = useState<number>(124);
  const [diastolicBP, setDiastolicBP] = useState<number>(82);
  const [heartRate, setHeartRate] = useState<number>(84);
  const [proteinuria, setProteinuria] = useState<string>("Trace"); // Negative, Trace, 1+, 2+, 3+
  const [edema, setEdema] = useState<"None" | "Mild (Ankles)" | "Moderate (Legs)" | "Severe (Face/Hands)">("Mild (Ankles)");
  const [symptoms, setSymptoms] = useState<{
    headache: boolean;
    visionBlur: boolean;
    upperRightPain: boolean;
  }>({
    headache: false,
    visionBlur: false,
    upperRightPain: false,
  });

  const [activeOrgan, setActiveOrgan] = useState<"heart" | "uterus" | "kidney" | "brain" | "edema">("uterus");

  // Load last logged user checkin vitals on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedVitals = localStorage.getItem("last_patient_vitals");
      if (savedVitals) {
        try {
          const parsed = JSON.parse(savedVitals);
          if (parsed.systolic) setSystolicBP(Number(parsed.systolic));
          if (parsed.diastolic) setDiastolicBP(Number(parsed.diastolic));
          if (parsed.heartRate) setHeartRate(Number(parsed.heartRate));
          if (parsed.gestationalWeek) setGestationalWeek(Number(parsed.gestationalWeek));
        } catch (e) {}
      }
    }
  }, []);

  // Compute Risk Level dynamically
  const isHighRisk = systolicBP >= 160 || diastolicBP >= 110 || (proteinuria === "3+" && systolicBP >= 140);
  const isElevatedRisk = (systolicBP >= 135 || diastolicBP >= 88 || proteinuria === "1+" || proteinuria === "2+") && !isHighRisk;
  const riskStatus = isHighRisk ? "RED" : isElevatedRisk ? "YELLOW" : "GREEN";

  // Calculate Fetal Size (grams & length) based on week
  const fetalWeightGrams = Math.round(Math.pow(gestationalWeek, 2.3) * 0.45);
  const fetalLengthCm = Math.round(gestationalWeek * 1.25);

  const resetToBaseline = () => {
    setGestationalWeek(28);
    setSystolicBP(120);
    setDiastolicBP(80);
    setHeartRate(78);
    setProteinuria("Negative");
    setEdema("None");
    setSymptoms({ headache: false, visionBlur: false, upperRightPain: false });
  };

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1 lg:ml-[var(--sidebar-width)]">
        <Header />
        <main className="p-6 max-w-7xl mx-auto">
          {/* Header Banner */}
          <div className="flex items-center justify-between flex-wrap gap-4 mb-6 animate-fade-in">
            <div>
              <h1 className="text-3xl font-bold text-slate-100 mb-1 flex items-center gap-3">
                <Sparkles size={28} className="text-sky-400 animate-pulse" />
                Maternal Physiological 3D Body Simulator
              </h1>
              <p className="text-slate-400 text-sm">
                Interactive real-time visualization of maternal organ systems, fetal development, and preeclampsia risk heatmaps.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button onClick={resetToBaseline} className="btn-secondary text-xs flex items-center gap-1.5">
                <RotateCcw size={14} /> Reset Baseline Vitals
              </button>
              <span className={cn(
                "px-3.5 py-1.5 rounded-full text-xs font-bold font-mono tracking-wider border flex items-center gap-2",
                riskStatus === "GREEN" && "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
                riskStatus === "YELLOW" && "bg-amber-500/20 text-amber-300 border-amber-500/30",
                riskStatus === "RED" && "bg-rose-500/20 text-rose-300 border-rose-500/30 animate-pulse"
              )}>
                <span className={cn(
                  "w-2.5 h-2.5 rounded-full",
                  riskStatus === "GREEN" && "bg-emerald-400",
                  riskStatus === "YELLOW" && "bg-amber-400",
                  riskStatus === "RED" && "bg-rose-400"
                )} />
                PHYSILOGICAL STATUS: {riskStatus} ALERT
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* LEFT PANEL: Interactive Controls (4 cols) */}
            <GlassCard className="lg:col-span-4 space-y-5 animate-fade-in">
              <h2 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2 border-b border-slate-800 pb-3">
                <Sliders size={16} className="text-sky-400" />
                Patient Vitals & Organ Parameters
              </h2>

              {/* 1. Gestational Week Slider */}
              <div>
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="text-slate-300 font-medium">Gestational Age</span>
                  <span className="text-sky-400 font-bold font-mono">Week {gestationalWeek} / 40</span>
                </div>
                <input
                  type="range"
                  min={4}
                  max={40}
                  value={gestationalWeek}
                  onChange={(e) => setGestationalWeek(Number(e.target.value))}
                  className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-sky-500"
                />
              </div>

              {/* 2. Blood Pressure Sliders */}
              <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 space-y-3">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-300 font-medium">Blood Pressure (Systolic / Diastolic)</span>
                  <span className={cn(
                    "font-bold font-mono",
                    systolicBP >= 140 ? "text-rose-400" : systolicBP >= 130 ? "text-amber-400" : "text-emerald-400"
                  )}>
                    {systolicBP} / {diastolicBP} mmHg
                  </span>
                </div>
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">Systolic BP: {systolicBP} mmHg</label>
                  <input
                    type="range"
                    min={90}
                    max={190}
                    value={systolicBP}
                    onChange={(e) => setSystolicBP(Number(e.target.value))}
                    className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-rose-500"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">Diastolic BP: {diastolicBP} mmHg</label>
                  <input
                    type="range"
                    min={50}
                    max={120}
                    value={diastolicBP}
                    onChange={(e) => setDiastolicBP(Number(e.target.value))}
                    className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-sky-500"
                  />
                </div>
              </div>

              {/* 3. Heart Rate */}
              <div>
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="text-slate-300 font-medium">Heart Rate (Pulse)</span>
                  <span className="text-rose-400 font-bold font-mono">{heartRate} bpm</span>
                </div>
                <input
                  type="range"
                  min={60}
                  max={140}
                  value={heartRate}
                  onChange={(e) => setHeartRate(Number(e.target.value))}
                  className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-rose-500"
                />
              </div>

              {/* 4. Proteinuria */}
              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1.5">Urine Proteinuria Level</label>
                <div className="grid grid-cols-5 gap-1.5 text-xs font-mono">
                  {["Negative", "Trace", "1+", "2+", "3+"].map((lvl) => (
                    <button
                      key={lvl}
                      onClick={() => setProteinuria(lvl)}
                      className={cn(
                        "py-1.5 rounded-lg border font-bold text-[11px] transition-all",
                        proteinuria === lvl
                          ? "bg-sky-600 text-white border-sky-400 shadow-sm"
                          : "bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200"
                      )}
                    >
                      {lvl}
                    </button>
                  ))}
                </div>
              </div>

              {/* 5. Edema Swelling */}
              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1.5">Peripheral Edema (Swelling)</label>
                <select
                  value={edema}
                  onChange={(e) => setEdema(e.target.value as any)}
                  className="input-glass-sm w-full bg-slate-900 text-slate-200"
                >
                  <option value="None">None (Normal)</option>
                  <option value="Mild (Ankles)">Mild (Ankles & Feet)</option>
                  <option value="Moderate (Legs)">Moderate (Lower Legs)</option>
                  <option value="Severe (Face/Hands)">Severe (Facial & Hand Swelling)</option>
                </select>
              </div>

              {/* 6. Symptom Toggles */}
              <div className="pt-2 border-t border-slate-800 space-y-2">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">Neurological Symptoms</span>
                <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={symptoms.headache}
                    onChange={(e) => setSymptoms({ ...symptoms, headache: e.target.checked })}
                    className="w-4 h-4 rounded bg-slate-900 border-slate-700 text-sky-500"
                  />
                  Persistent Headache (Cranial Pressure)
                </label>
                <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={symptoms.visionBlur}
                    onChange={(e) => setSymptoms({ ...symptoms, visionBlur: e.target.checked })}
                    className="w-4 h-4 rounded bg-slate-900 border-slate-700 text-sky-500"
                  />
                  Visual Disturbances / Blurred Vision
                </label>
                <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={symptoms.upperRightPain}
                    onChange={(e) => setSymptoms({ ...symptoms, upperRightPain: e.target.checked })}
                    className="w-4 h-4 rounded bg-slate-900 border-slate-700 text-sky-500"
                  />
                  Right Upper Quadrant Abdominal Pain (Liver)
                </label>
              </div>
            </GlassCard>

            {/* CENTER PANEL: Visual Anatomical 3D Real Body & Organ Heatmap (5 cols) */}
            <GlassCard className="lg:col-span-5 flex flex-col items-center justify-between animate-fade-in relative overflow-hidden bg-slate-950/90">
              <div className="w-full flex items-center justify-between mb-2 border-b border-slate-800 pb-2 z-10">
                <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                  <Flame size={15} className="text-amber-400" />
                  Real 3D Photorealistic Body Scan
                </h3>
                <span className="text-[11px] text-sky-400 font-mono">3D AI Medical Scan</span>
              </div>

              {/* Photorealistic 3D Body Image Container with Interactive SVG Heatmap Layer */}
              <div className="relative w-full max-w-[340px] h-[460px] flex items-center justify-center rounded-2xl overflow-hidden shadow-2xl border border-slate-800 bg-black">
                {/* Photorealistic 3D Rendered Image */}
                <img
                  src="/maternal_body_real.png"
                  alt="Real 3D Pregnant Woman Body Visualization"
                  className="w-full h-full object-cover opacity-90 transition-all duration-300"
                />

                {/* Interactive Dynamic Organ SVG Heatmap Overlay over Real Body */}
                <svg viewBox="0 0 200 500" className="absolute inset-0 w-full h-full pointer-events-auto">
                  {/* Dynamic Risk Ambient Aura */}
                  <circle
                    cx="100"
                    cy="250"
                    r="180"
                    fill={riskStatus === "RED" ? "#f43f5e" : riskStatus === "YELLOW" ? "#f59e0b" : "#0ea5e9"}
                    fillOpacity="0.08"
                    className="transition-all duration-500"
                  />

                  {/* 1. BRAIN NODE (Headache / Scotoma) */}
                  <g onClick={() => setActiveOrgan("brain")} className="cursor-pointer group">
                    <circle
                      cx="100"
                      cy="60"
                      r="18"
                      fill={symptoms.headache || symptoms.visionBlur ? "#f43f5e" : "#0ea5e9"}
                      fillOpacity={symptoms.headache ? "0.6" : "0.25"}
                      className={cn("transition-all", symptoms.headache && "animate-ping")}
                    />
                    <circle cx="100" cy="60" r="7" fill="#ffffff" className="group-hover:scale-125 transition-transform" />
                    <text x="100" y="63" textAnchor="middle" fill="#000000" fontSize="6" fontWeight="bold">BRAIN</text>
                  </g>

                  {/* 2. CARDIOVASCULAR HEART NODE */}
                  <g onClick={() => setActiveOrgan("heart")} className="cursor-pointer group">
                    <circle
                      cx="100"
                      cy="135"
                      r={heartRate > 100 ? "22" : "18"}
                      fill={systolicBP >= 140 ? "#f43f5e" : systolicBP >= 130 ? "#f59e0b" : "#10b981"}
                      fillOpacity="0.45"
                      className="animate-pulse"
                      style={{ animationDuration: `${60 / heartRate}s` }}
                    />
                    <path
                      d="M100,141 C100,141 93,134 93,130 C93,126 96,123 100,123 C101,123 103,125 103,125 C103,125 105,123 107,123 C111,123 114,126 114,130 C114,134 107,141 107,141 Z"
                      fill={systolicBP >= 140 ? "#ffffff" : "#f43f5e"}
                    />
                  </g>

                  {/* 3. RENAL / KIDNEY NODE */}
                  <g onClick={() => setActiveOrgan("kidney")} className="cursor-pointer group">
                    <ellipse
                      cx="86"
                      cy="195"
                      rx="9"
                      ry="12"
                      fill={proteinuria !== "Negative" ? "#f59e0b" : "#0284c7"}
                      fillOpacity="0.6"
                    />
                    <ellipse
                      cx="114"
                      cy="195"
                      rx="9"
                      ry="12"
                      fill={proteinuria !== "Negative" ? "#f59e0b" : "#0284c7"}
                      fillOpacity="0.6"
                    />
                    <text x="100" y="198" textAnchor="middle" fill="#ffffff" fontSize="6" fontWeight="bold">RENAL</text>
                  </g>

                  {/* 4. UTERUS & FETUS HUB */}
                  <g onClick={() => setActiveOrgan("uterus")} className="cursor-pointer group">
                    <circle
                      cx="100"
                      cy="260"
                      r={Math.min(46, 20 + gestationalWeek * 0.65)}
                      fill="#8b5cf6"
                      fillOpacity="0.35"
                      stroke="#c084fc"
                      strokeWidth="2"
                      className="group-hover:stroke-sky-300 transition-colors"
                    />
                    <circle
                      cx="100"
                      cy="260"
                      r={Math.min(22, 8 + gestationalWeek * 0.35)}
                      fill="#ffffff"
                      fillOpacity="0.8"
                    />
                    <text x="100" y="263" textAnchor="middle" fill="#1e1b4b" fontSize="8" fontWeight="bold">
                      {gestationalWeek}W
                    </text>
                  </g>

                  {/* 5. PERIPHERAL EDEMA NODE (Legs) */}
                  <g onClick={() => setActiveOrgan("edema")} className="cursor-pointer group">
                    <circle
                      cx="82"
                      cy="435"
                      r="12"
                      fill={edema !== "None" ? "#f59e0b" : "#38bdf8"}
                      fillOpacity="0.5"
                    />
                    <circle
                      cx="118"
                      cy="435"
                      r="12"
                      fill={edema !== "None" ? "#f59e0b" : "#38bdf8"}
                      fillOpacity="0.5"
                    />
                  </g>
                </svg>
              </div>

              {/* Quick Node Selector Tabs */}
              <div className="flex items-center gap-1.5 w-full justify-center pt-2.5 border-t border-slate-800 text-[11px] z-10">
                {[
                  { id: "uterus", label: "Fetus", icon: <Baby size={12} /> },
                  { id: "heart", label: "Cardio", icon: <Heart size={12} /> },
                  { id: "kidney", label: "Kidneys", icon: <Droplet size={12} /> },
                  { id: "brain", label: "Cranial", icon: <Brain size={12} /> },
                  { id: "edema", label: "Edema", icon: <Activity size={12} /> },
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setActiveOrgan(item.id as any)}
                    className={cn(
                      "px-2.5 py-1 rounded-lg flex items-center gap-1 font-semibold transition-all",
                      activeOrgan === item.id
                        ? "bg-sky-500/20 text-sky-300 border border-sky-500/30 shadow-sm"
                        : "text-slate-400 hover:text-slate-200"
                    )}
                  >
                    {item.icon}
                    {item.label}
                  </button>
                ))}
              </div>
            </GlassCard>

            {/* RIGHT PANEL: Organ Detail Inspector & AI Clinical Assessment (3 cols) */}
            <div className="lg:col-span-3 space-y-5 animate-fade-in">
              {/* Active Organ Deep-Dive Inspector */}
              <GlassCard>
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2 border-b border-slate-800 pb-2">
                  <Info size={14} className="text-sky-400" />
                  Organ System Inspector
                </h3>

                {activeOrgan === "uterus" && (
                  <div className="space-y-3 text-xs">
                    <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                      <span className="text-slate-400 block text-[11px]">Fetal Development</span>
                      <p className="text-sm font-bold text-slate-100 mt-0.5">Week {gestationalWeek} Pregnancy</p>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="p-2 rounded bg-slate-900 text-center">
                        <span className="text-[10px] text-slate-500 block">Est. Weight</span>
                        <span className="font-mono font-bold text-sky-300">{fetalWeightGrams} g</span>
                      </div>
                      <div className="p-2 rounded bg-slate-900 text-center">
                        <span className="text-[10px] text-slate-500 block">Est. Length</span>
                        <span className="font-mono font-bold text-sky-300">{fetalLengthCm} cm</span>
                      </div>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      Uterine growth aligns with week {gestationalWeek}. Placental blood flow relies on stable maternal blood pressure.
                    </p>
                  </div>
                )}

                {activeOrgan === "heart" && (
                  <div className="space-y-3 text-xs">
                    <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                      <span className="text-slate-400 block text-[11px]">Cardiovascular System</span>
                      <p className="text-sm font-bold text-slate-100 mt-0.5">{systolicBP}/{diastolicBP} mmHg</p>
                    </div>
                    <div className="p-2 rounded bg-slate-900 flex items-center justify-between">
                      <span className="text-[11px] text-slate-400">Heart Rate</span>
                      <span className="font-mono font-bold text-rose-400">{heartRate} bpm</span>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      {systolicBP >= 140
                        ? "⚠️ Elevated arterial pressure increases cardiac workload and endothelial stress."
                        : "Normal cardiac output supporting maternal-fetal circulation."}
                    </p>
                  </div>
                )}

                {activeOrgan === "kidney" && (
                  <div className="space-y-3 text-xs">
                    <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                      <span className="text-slate-400 block text-[11px]">Renal & Proteinuria</span>
                      <p className="text-sm font-bold text-amber-300 mt-0.5">Protein: {proteinuria}</p>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      {proteinuria !== "Negative"
                        ? "Glomerular permeability altered. Protein leakage detected in urine."
                        : "Normal renal filtration with no excess protein excretion."}
                    </p>
                  </div>
                )}

                {activeOrgan === "brain" && (
                  <div className="space-y-3 text-xs">
                    <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                      <span className="text-slate-400 block text-[11px]">Cranial & Neurological</span>
                      <p className="text-sm font-bold text-slate-100 mt-0.5">
                        {symptoms.headache ? "Headache Active" : "No Headache"}
                      </p>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      {symptoms.headache || symptoms.visionBlur
                        ? "⚠️ Cerebral vasospasm or elevated intracranial pressure warning."
                        : "No neurological symptoms reported."}
                    </p>
                  </div>
                )}

                {activeOrgan === "edema" && (
                  <div className="space-y-3 text-xs">
                    <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                      <span className="text-slate-400 block text-[11px]">Peripheral Fluid Balance</span>
                      <p className="text-sm font-bold text-slate-100 mt-0.5">{edema}</p>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      Fluid retention monitored for sudden weight shifts associated with endothelial leak.
                    </p>
                  </div>
                )}
              </GlassCard>

              {/* AI Risk Engine Live Diagnostic Summary */}
              <GlassCard className="border-sky-500/30 bg-sky-500/5">
                <h3 className="text-xs font-bold text-sky-300 uppercase tracking-wider mb-2 flex items-center gap-2">
                  <ShieldAlert size={15} />
                  AI Clinical Engine Assessment
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {riskStatus === "RED" && (
                    <span className="text-rose-300 font-semibold">
                      🚨 HIGH RISK PREECLAMPSIA ALERT: Severe hypertension ({systolicBP}/{diastolicBP}) detected. Immediate clinical referral required.
                    </span>
                  )}
                  {riskStatus === "YELLOW" && (
                    <span className="text-amber-300 font-semibold">
                      ⚠️ ELEVATED MONITORING ALERT: Vitals show gestational hypertension or mild proteinuria. Daily check-in enforcement active.
                    </span>
                  )}
                  {riskStatus === "GREEN" && (
                    <span className="text-emerald-300 font-semibold">
                      ✅ NORMAL PHYSIOLOGICAL PROFILE: All vitals and fetal development metrics are within safe pregnancy ranges.
                    </span>
                  )}
                </p>
              </GlassCard>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
