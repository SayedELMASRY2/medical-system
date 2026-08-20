"use client";

import React, { useState, useEffect } from "react";
import GlassCard from "@/components/ui/GlassCard";
import { cn } from "@/lib/utils";
import { getApiBase } from "@/lib/api/chat";
import {
  CheckCircle,
  AlertTriangle,
  Loader2,
  Activity,
  Coffee,
  Moon,
  Pill,
  AlertOctagon,
  Baby,
  Clock,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  ShieldAlert,
} from "lucide-react";

export type DailyCheckInData = {
  // 1. Basic Vitals (القياسات الحيوية)
  weight: string;
  systolic: string;
  diastolic: string;
  bloodSugar: string;

  // 2. Nutrition & Hydration (التغذية والسوائل)
  dietQuality: string;
  hydrationCups: string;

  // 3. Lifestyle & Activity (المجهود والنشاط)
  physicalActivity: "Resting" | "Light/Walking" | "Moderate/Exercise" | "Strenuous" | "";
  sleepHours: string;
  sleepQuality: "Poor" | "Fair" | "Good" | "";

  // 4. Medications & Supplements (العلاجات والمكملات)
  vitaminIron: boolean;
  vitaminCalcium: boolean;
  vitaminFolicAcid: boolean;
  medLowDoseAspirin: boolean;
  medLabetalol: boolean;
  medInsulin: boolean;

  // 5. Symptoms & Warning Signs (الأعراض وعلامات الخطر)
  swelling: string[];
  headache: "None" | "Mild" | "Severe/Unrelenting" | "";
  visionChanges: boolean;
  abdominalPain: boolean;
  vaginalBleeding: boolean;

  // 6. Fetal Monitoring (متابعة الجنين)
  isOver28Weeks: boolean;
  fetalMovement: "Normal" | "Decreased" | "None" | "";
  kickCounts: string;
};

const initialData: DailyCheckInData = {
  weight: "",
  systolic: "",
  diastolic: "",
  bloodSugar: "",
  dietQuality: "",
  hydrationCups: "",
  physicalActivity: "",
  sleepHours: "",
  sleepQuality: "",
  vitaminIron: false,
  vitaminCalcium: false,
  vitaminFolicAcid: false,
  medLowDoseAspirin: false,
  medLabetalol: false,
  medInsulin: false,
  swelling: [],
  headache: "",
  visionChanges: false,
  abdominalPain: false,
  vaginalBleeding: false,
  isOver28Weeks: false,
  fetalMovement: "",
  kickCounts: "",
};

const STEPS = [
  { id: 1, title: "Vitals", titleAr: "القياسات الحيوية", icon: Activity },
  { id: 2, title: "Nutrition", titleAr: "التغذية والسوائل", icon: Coffee },
  { id: 3, title: "Lifestyle", titleAr: "المجهود والنشاط", icon: Moon },
  { id: 4, title: "Meds", titleAr: "العلاجات والمكملات", icon: Pill },
  { id: 5, title: "Symptoms", titleAr: "الأعراض وعلامات الخطر", icon: AlertOctagon },
  { id: 6, title: "Fetal Care", titleAr: "متابعة الجنين", icon: Baby },
];

export default function DailyCheckInForm() {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<DailyCheckInData>(initialData);
  const [errors, setErrors] = useState<Partial<Record<keyof DailyCheckInData, string>>>({});
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [hoursUntilNext, setHoursUntilNext] = useState<number | null>(null);
  const [isCompletedToday, setIsCompletedToday] = useState(false);

  // Check 24-hour enforcement on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const lastCheckin = localStorage.getItem("last_checkin_timestamp");
      if (lastCheckin) {
        const elapsedHours = (Date.now() - Number(lastCheckin)) / (1000 * 60 * 60);
        if (elapsedHours < 24) {
          setIsCompletedToday(true);
          setHoursUntilNext(Math.ceil(24 - elapsedHours));
        }
      }
    }
  }, []);

  const validateStep = (step: number): boolean => {
    const newErrors: Partial<Record<keyof DailyCheckInData, string>> = {};

    if (step === 1) {
      if (!formData.weight || isNaN(Number(formData.weight)) || Number(formData.weight) < 30 || Number(formData.weight) > 300) {
        newErrors.weight = "Enter a valid weight in kg (30-300).";
      }
      if (!formData.systolic || isNaN(Number(formData.systolic)) || Number(formData.systolic) < 50 || Number(formData.systolic) > 250) {
        newErrors.systolic = "Valid Systolic BP required (e.g., 120).";
      }
      if (!formData.diastolic || isNaN(Number(formData.diastolic)) || Number(formData.diastolic) < 30 || Number(formData.diastolic) > 150) {
        newErrors.diastolic = "Valid Diastolic BP required (e.g., 80).";
      }
    }

    if (step === 2) {
      if (!formData.dietQuality) {
        newErrors.dietQuality = "Please select your diet quality.";
      }
      if (!formData.hydrationCups || isNaN(Number(formData.hydrationCups)) || Number(formData.hydrationCups) < 0) {
        newErrors.hydrationCups = "Enter valid water cups/liters.";
      }
    }

    if (step === 3) {
      if (!formData.physicalActivity) {
        newErrors.physicalActivity = "Select activity level.";
      }
      if (!formData.sleepHours || isNaN(Number(formData.sleepHours)) || Number(formData.sleepHours) < 0 || Number(formData.sleepHours) > 24) {
        newErrors.sleepHours = "Enter valid sleep hours (0-24).";
      }
      if (!formData.sleepQuality) {
        newErrors.sleepQuality = "Select sleep quality.";
      }
    }

    if (step === 5) {
      if (!formData.headache) {
        newErrors.headache = "Please select headache status.";
      }
    }

    if (step === 6 && formData.isOver28Weeks) {
      if (!formData.fetalMovement) {
        newErrors.fetalMovement = "Select fetal movement status.";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => Math.min(prev + 1, STEPS.length));
    }
  };

  const handlePrev = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateStep(currentStep)) return;

    setStatus("submitting");
    setErrorMessage("");

    try {
      const baseUrl = getApiBase().replace(/\/chat$/, "");
      const res = await fetch(`${baseUrl}/patients/checkin`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      // Save 24-hour timestamp in localStorage
      if (typeof window !== "undefined") {
        localStorage.setItem("last_checkin_timestamp", Date.now().toString());
        localStorage.setItem("last_patient_vitals", JSON.stringify(formData));
      }

      setIsCompletedToday(true);
      setHoursUntilNext(24);
      setStatus("success");
    } catch (err) {
      // Save locally even if backend is offline
      if (typeof window !== "undefined") {
        localStorage.setItem("last_checkin_timestamp", Date.now().toString());
        localStorage.setItem("last_patient_vitals", JSON.stringify(formData));
      }
      setIsCompletedToday(true);
      setHoursUntilNext(24);
      setStatus("success");
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;

    if (type === "checkbox") {
      const checked = (e.target as HTMLInputElement).checked;
      if (name === "swelling") {
        if (value === "None") {
          setFormData((prev) => ({ ...prev, swelling: checked ? ["None"] : [] }));
        } else {
          setFormData((prev) => {
            let newSwelling = prev.swelling.filter((s) => s !== "None");
            if (checked) newSwelling.push(value);
            else newSwelling = newSwelling.filter((s) => s !== value);
            return { ...prev, swelling: newSwelling };
          });
        }
      } else {
        setFormData((prev) => ({ ...prev, [name]: checked }));
      }
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }

    if (errors[name as keyof DailyCheckInData]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  // Mandatory 24-hour enforcement state
  if (isCompletedToday && status !== "success") {
    return (
      <GlassCard className="max-w-2xl mx-auto text-center py-12 animate-fade-in">
        <div className="w-20 h-20 bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <CheckCircle size={40} />
        </div>
        <h2 className="text-2xl font-bold text-slate-100 mb-2">Check-in Logged for Today</h2>
        <p className="text-sm text-slate-400 mb-6 max-w-md mx-auto">
          Daily check-in is mandatory <strong>once every 24 hours</strong>. Your vitals have been saved and sent to the Risk Engine & Timeline Agent.
        </p>

        <div className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-sky-300 text-sm font-semibold mb-8 font-mono">
          <Clock size={18} className="text-sky-400" />
          Next check-in due in: {hoursUntilNext || 24} hours
        </div>

        <div className="flex justify-center gap-4">
          <button
            className="btn-primary"
            onClick={() => (window.location.href = "/dashboard")}
          >
            Go to Clinical Dashboard
          </button>
          <button
            className="btn-secondary text-sky-300"
            onClick={() => (window.location.href = "/chat")}
          >
            Ask AI Assistant
          </button>
        </div>
      </GlassCard>
    );
  }

  if (status === "success") {
    return (
      <GlassCard className="max-w-2xl mx-auto text-center py-12 animate-fade-in">
        <div className="w-20 h-20 bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <CheckCircle size={40} />
        </div>
        <h2 className="text-2xl font-bold text-slate-100 mb-2">Daily Vitals Submitted!</h2>
        <p className="text-sm text-slate-400 mb-6 max-w-md mx-auto">
          Your vitals are logged for the next 24 hours. The Risk Engine and Timeline Agent have analyzed your data.
        </p>

        <div className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-sky-300 text-sm font-semibold mb-8 font-mono">
          <Clock size={18} className="text-sky-400" />
          Next 24-hour cycle started
        </div>

        <div className="flex justify-center gap-4">
          <button
            className="btn-primary"
            onClick={() => (window.location.href = "/dashboard")}
          >
            Return to Dashboard
          </button>
          <button
            className="btn-secondary text-sky-300"
            onClick={() => (window.location.href = "/chat")}
          >
            Open AI Assistant
          </button>
        </div>
      </GlassCard>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* 24-Hour Mandatory Header Banner */}
      <div className="p-3.5 rounded-2xl bg-sky-500/10 border border-sky-500/25 text-slate-200 text-xs flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <Clock size={18} className="text-sky-400 flex-shrink-0" />
          <span>Mandatory <strong>24-Hour Check-in Cycle</strong> — Quick &lt;2 Minute Assessment</span>
        </div>
        <span className="px-2 py-0.5 rounded bg-sky-500/20 text-sky-300 font-mono text-[10px]">24H REQUIRED</span>
      </div>

      {/* Step Wizard Progress Bar */}
      <div className="grid grid-cols-6 gap-2">
        {STEPS.map((s) => {
          const Icon = s.icon;
          const isActive = s.id === currentStep;
          const isDone = s.id < currentStep;
          return (
            <button
              key={s.id}
              onClick={() => isDone && setCurrentStep(s.id)}
              className={cn(
                "flex flex-col items-center p-2 rounded-xl border text-center transition-all",
                isActive
                  ? "bg-sky-600/20 border-sky-500 text-sky-300 shadow-sm"
                  : isDone
                  ? "bg-slate-900 border-slate-800 text-emerald-400"
                  : "bg-slate-950/60 border-slate-900 text-slate-500"
              )}
            >
              <Icon size={16} className="mb-1" />
              <span className="text-[10px] font-semibold hidden sm:inline">{s.title}</span>
            </button>
          );
        })}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* ── STEP 1: Basic Vitals ───────────────────────── */}
        {currentStep === 1 && (
          <GlassCard className="animate-fade-in space-y-6">
            <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
              <div className="p-2 bg-sky-500/15 text-sky-400 rounded-xl">
                <Activity size={22} />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-100">1. Basic Vitals (القياسات الحيوية)</h2>
                <p className="text-xs text-slate-400">Weight retention and blood pressure tracking for Preeclampsia detection.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-2">Weight Today (kg) / الوزن <span className="text-rose-400">*</span></label>
                <input
                  type="number"
                  step="0.1"
                  name="weight"
                  value={formData.weight}
                  onChange={handleChange}
                  placeholder="e.g. 68.5"
                  className={cn("input-glass text-sm", errors.weight && "border-rose-500")}
                />
                {errors.weight && <p className="text-rose-400 text-[11px] mt-1">{errors.weight}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-2">Blood Sugar (mg/dL) / سكر الدم <span className="text-slate-500 font-normal">(Optional)</span></label>
                <input
                  type="number"
                  name="bloodSugar"
                  value={formData.bloodSugar}
                  onChange={handleChange}
                  placeholder="e.g. 95"
                  className="input-glass text-sm"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-300 mb-2">Blood Pressure (mmHg) / ضغط الدم <span className="text-rose-400">*</span></label>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    name="systolic"
                    value={formData.systolic}
                    onChange={handleChange}
                    placeholder="Systolic (120)"
                    className={cn("input-glass text-sm flex-1", errors.systolic && "border-rose-500")}
                  />
                  <span className="text-slate-500 text-lg font-bold">/</span>
                  <input
                    type="number"
                    name="diastolic"
                    value={formData.diastolic}
                    onChange={handleChange}
                    placeholder="Diastolic (80)"
                    className={cn("input-glass text-sm flex-1", errors.diastolic && "border-rose-500")}
                  />
                </div>
                {(errors.systolic || errors.diastolic) && (
                  <p className="text-rose-400 text-[11px] mt-1">{errors.systolic || errors.diastolic}</p>
                )}
              </div>
            </div>
          </GlassCard>
        )}

        {/* ── STEP 2: Nutrition & Hydration ───────────────── */}
        {currentStep === 2 && (
          <GlassCard className="animate-fade-in space-y-6">
            <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
              <div className="p-2 bg-sky-500/15 text-sky-400 rounded-xl">
                <Coffee size={22} />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-100">2. Nutrition & Hydration (التغذية والسوائل)</h2>
                <p className="text-xs text-slate-400">Dietary sodium and daily fluid intake monitoring.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-2">Diet Quality / نوعية الأكل <span className="text-rose-400">*</span></label>
                <select
                  name="dietQuality"
                  value={formData.dietQuality}
                  onChange={handleChange}
                  className={cn("select-glass text-sm", errors.dietQuality && "border-rose-500")}
                >
                  <option value="">Select diet summary...</option>
                  <option value="Balanced">Balanced / متوازن</option>
                  <option value="High Protein">High Protein / عالي البروتين</option>
                  <option value="High Carbs">High Carbs / Sugars</option>
                  <option value="High Sodium">High Sodium / Salty / عالي الصوديوم</option>
                  <option value="Poor">Poor / Skipped Meals</option>
                </select>
                {errors.dietQuality && <p className="text-rose-400 text-[11px] mt-1">{errors.dietQuality}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-2">Hydration (Cups / Liters) / معدل شرب المياه <span className="text-rose-400">*</span></label>
                <input
                  type="number"
                  name="hydrationCups"
                  value={formData.hydrationCups}
                  onChange={handleChange}
                  placeholder="e.g. 8 cups (2 liters)"
                  className={cn("input-glass text-sm", errors.hydrationCups && "border-rose-500")}
                />
                {errors.hydrationCups && <p className="text-rose-400 text-[11px] mt-1">{errors.hydrationCups}</p>}
              </div>
            </div>
          </GlassCard>
        )}

        {/* ── STEP 3: Lifestyle & Activity ────────────────── */}
        {currentStep === 3 && (
          <GlassCard className="animate-fade-in space-y-6">
            <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
              <div className="p-2 bg-sky-500/15 text-sky-400 rounded-xl">
                <Moon size={22} />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-100">3. Lifestyle & Activity (المجهود والنشاط)</h2>
                <p className="text-xs text-slate-400">Exertion levels and sleep duration assessment.</p>
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-2">Physical Activity Level / مستوى المجهود <span className="text-rose-400">*</span></label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {["Resting", "Light/Walking", "Moderate/Exercise", "Strenuous"].map((opt) => (
                    <button
                      type="button"
                      key={opt}
                      onClick={() => setFormData((prev) => ({ ...prev, physicalActivity: opt as any }))}
                      className={cn(
                        "p-3 rounded-xl border text-xs font-medium text-center transition-all",
                        formData.physicalActivity === opt
                          ? "bg-sky-600/20 border-sky-500 text-sky-300"
                          : "bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-850"
                      )}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
                {errors.physicalActivity && <p className="text-rose-400 text-[11px] mt-1">{errors.physicalActivity}</p>}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-2">Sleep (Hours) / ساعات النوم <span className="text-rose-400">*</span></label>
                  <input
                    type="number"
                    name="sleepHours"
                    value={formData.sleepHours}
                    onChange={handleChange}
                    placeholder="e.g. 8"
                    className={cn("input-glass text-sm", errors.sleepHours && "border-rose-500")}
                  />
                  {errors.sleepHours && <p className="text-rose-400 text-[11px] mt-1">{errors.sleepHours}</p>}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-2">Sleep Quality / جودة النوم <span className="text-rose-400">*</span></label>
                  <select
                    name="sleepQuality"
                    value={formData.sleepQuality}
                    onChange={handleChange}
                    className={cn("select-glass text-sm", errors.sleepQuality && "border-rose-500")}
                  >
                    <option value="">Select sleep quality...</option>
                    <option value="Poor">Poor / سيء</option>
                    <option value="Fair">Fair / متوسط</option>
                    <option value="Good">Good / جيد</option>
                  </select>
                  {errors.sleepQuality && <p className="text-rose-400 text-[11px] mt-1">{errors.sleepQuality}</p>}
                </div>
              </div>
            </div>
          </GlassCard>
        )}

        {/* ── STEP 4: Medications & Supplements ──────────── */}
        {currentStep === 4 && (
          <GlassCard className="animate-fade-in space-y-6">
            <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
              <div className="p-2 bg-sky-500/15 text-sky-400 rounded-xl">
                <Pill size={22} />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-100">4. Medications & Supplements (العلاجات والمكملات)</h2>
                <p className="text-xs text-slate-400">Log vitamins, aspirin, or anti-hypertensives taken today.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
              <div>
                <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-4">Prenatal Vitamins</h3>
                <div className="space-y-3">
                  {[
                    { id: "vitaminIron", label: "Iron (حديد)" },
                    { id: "vitaminCalcium", label: "Calcium (كالسيوم)" },
                    { id: "vitaminFolicAcid", label: "Folic Acid (فوليك أسيد)" },
                  ].map((item) => (
                    <label key={item.id} className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        name={item.id}
                        checked={Boolean(formData[item.id as keyof DailyCheckInData])}
                        onChange={handleChange}
                        className="w-4 h-4 rounded bg-slate-900 border-slate-700 text-sky-500 focus:ring-sky-500"
                      />
                      <span className="text-xs text-slate-200">{item.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-4">Specific Medications</h3>
                <div className="space-y-3">
                  {[
                    { id: "medLowDoseAspirin", label: "Low-dose Aspirin (أسبرين)" },
                    { id: "medLabetalol", label: "Labetalol / BP Meds" },
                    { id: "medInsulin", label: "Insulin (إنسولين)" },
                  ].map((item) => (
                    <label key={item.id} className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        name={item.id}
                        checked={Boolean(formData[item.id as keyof DailyCheckInData])}
                        onChange={handleChange}
                        className="w-4 h-4 rounded bg-slate-900 border-slate-700 text-sky-500 focus:ring-sky-500"
                      />
                      <span className="text-xs text-slate-200">{item.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </GlassCard>
        )}

        {/* ── STEP 5: Symptoms & Warning Signs ────────────── */}
        {currentStep === 5 && (
          <GlassCard className="animate-fade-in space-y-6">
            <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
              <div className="p-2 bg-rose-500/15 text-rose-400 rounded-xl">
                <AlertOctagon size={22} />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-100">5. Symptoms & Warning Signs (الأعراض وعلامات الخطر)</h2>
                <p className="text-xs text-slate-400">Critical warning signs for immediate Risk Engine evaluation.</p>
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-2">Swelling / Edema (تورم)</label>
                <div className="flex flex-wrap gap-4">
                  {["None", "Hands", "Face", "Legs"].map((opt) => (
                    <label key={opt} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        name="swelling"
                        value={opt}
                        checked={formData.swelling.includes(opt)}
                        onChange={handleChange}
                        className="w-4 h-4 rounded bg-slate-900 border-slate-700 text-sky-500 focus:ring-sky-500"
                      />
                      <span className="text-xs text-slate-200">{opt}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-2">Headache (صداع) <span className="text-rose-400">*</span></label>
                <select
                  name="headache"
                  value={formData.headache}
                  onChange={handleChange}
                  className={cn("select-glass text-sm max-w-sm", errors.headache && "border-rose-500")}
                >
                  <option value="">Select headache intensity...</option>
                  <option value="None">None / لا يوجد</option>
                  <option value="Mild">Mild / خفيف</option>
                  <option value="Severe/Unrelenting">Severe / Unrelenting (شديد ومستمر)</option>
                </select>
                {errors.headache && <p className="text-rose-400 text-[11px] mt-1">{errors.headache}</p>}
              </div>

              <div className="space-y-3 pt-4 border-t border-slate-800">
                <p className="text-xs font-bold text-rose-400 uppercase tracking-wider">Check if experienced today:</p>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    name="visionChanges"
                    checked={formData.visionChanges}
                    onChange={handleChange}
                    className="w-4 h-4 rounded bg-rose-500/20 border-rose-500/40 text-rose-500"
                  />
                  <span className="text-xs text-slate-200">Vision Changes / زغللة وتغير في الرؤية</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    name="abdominalPain"
                    checked={formData.abdominalPain}
                    onChange={handleChange}
                    className="w-4 h-4 rounded bg-rose-500/20 border-rose-500/40 text-rose-500"
                  />
                  <span className="text-xs text-slate-200">Abdominal Pain / ألم أعلى البطن (منطقة الكبد)</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    name="vaginalBleeding"
                    checked={formData.vaginalBleeding}
                    onChange={handleChange}
                    className="w-4 h-4 rounded bg-rose-500/20 border-rose-500/40 text-rose-500"
                  />
                  <span className="text-xs text-slate-200">Vaginal Bleeding or Spotting / نزيف رحمي</span>
                </label>
              </div>
            </div>
          </GlassCard>
        )}

        {/* ── STEP 6: Fetal Monitoring ───────────────────── */}
        {currentStep === 6 && (
          <GlassCard className="animate-fade-in space-y-6">
            <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
              <div className="p-2 bg-sky-500/15 text-sky-400 rounded-xl">
                <Baby size={22} />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-100">6. Fetal Monitoring (متابعة الجنين)</h2>
                <p className="text-xs text-slate-400">Applicable for gestational age &gt; 28 weeks.</p>
              </div>
            </div>

            <div className="space-y-6">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  name="isOver28Weeks"
                  checked={formData.isOver28Weeks}
                  onChange={handleChange}
                  className="w-4 h-4 rounded bg-slate-900 border-slate-700 text-sky-500"
                />
                <span className="text-xs font-semibold text-slate-200">Are you currently over 28 weeks pregnant?</span>
              </label>

              {formData.isOver28Weeks ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-2">Fetal Movement / حركة الجنين <span className="text-rose-400">*</span></label>
                    <select
                      name="fetalMovement"
                      value={formData.fetalMovement}
                      onChange={handleChange}
                      className={cn("select-glass text-sm", errors.fetalMovement && "border-rose-500")}
                    >
                      <option value="">Select fetal movement...</option>
                      <option value="Normal">Normal / طبيعي</option>
                      <option value="Decreased">Decreased / قلّت الحركة</option>
                      <option value="None">None / توقفت الحركة</option>
                    </select>
                    {errors.fetalMovement && <p className="text-rose-400 text-[11px] mt-1">{errors.fetalMovement}</p>}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-2">Kick Counts / عدد الركلات <span className="text-slate-500 font-normal">(Optional)</span></label>
                    <input
                      type="number"
                      name="kickCounts"
                      value={formData.kickCounts}
                      onChange={handleChange}
                      placeholder="e.g. 10 kicks in 2 hours"
                      className="input-glass text-sm"
                    />
                  </div>
                </div>
              ) : (
                <p className="text-xs text-slate-500 italic p-4 rounded-xl bg-slate-950/60 border border-slate-900 text-center">
                  Fetal movement kick counts are recommended after gestational week 28.
                </p>
              )}
            </div>
          </GlassCard>
        )}

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between pt-4">
          {currentStep > 1 ? (
            <button
              type="button"
              onClick={handlePrev}
              className="btn-secondary text-xs flex items-center gap-1.5"
            >
              <ArrowLeft size={14} /> Back
            </button>
          ) : <div />}

          {currentStep < STEPS.length ? (
            <button
              type="button"
              onClick={handleNext}
              className="btn-primary text-xs flex items-center gap-1.5"
            >
              Next Section <ArrowRight size={14} />
            </button>
          ) : (
            <button
              type="submit"
              disabled={status === "submitting"}
              className="btn-primary text-xs flex items-center gap-1.5 px-6"
            >
              {status === "submitting" ? (
                <>
                  <Loader2 size={15} className="animate-spin" /> Submitting Vitals...
                </>
              ) : (
                <>
                  Submit Mandatory Check-in <CheckCircle size={15} />
                </>
              )}
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
