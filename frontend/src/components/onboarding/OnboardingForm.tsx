"use client";

import React, { useState } from "react";
import GlassCard from "@/components/ui/GlassCard";
import { cn } from "@/lib/utils";
import { CheckCircle, AlertTriangle, Loader2, User, Baby, Activity, HeartPulse, History } from "lucide-react";

export type OnboardingData = {
  // 1. Personal & Physical Basics
  age: string;
  height: string; // cm
  prePregnancyWeight: string; // kg
  baselineBp: string;

  // 2. Pregnancy Details
  dateType: "LMP" | "EDD";
  pregnancyDate: string;
  fetalCount: "Single" | "Twins" | "Multiples";

  // 3. Medical History
  chronicHypertension: boolean;
  preExistingDiabetes: "None" | "Type 1" | "Type 2";
  kidneyOrAutoimmune: boolean;

  // 4. Obstetric History
  firstTimeMother: boolean;
  gravida: string;
  para: string;
  previousPreeclampsia: boolean;
  previousGestationalDiabetes: boolean;

  // 5. Family History
  familyHistoryPreeclampsia: boolean;
};

const initialData: OnboardingData = {
  age: "",
  height: "",
  prePregnancyWeight: "",
  baselineBp: "",
  dateType: "LMP",
  pregnancyDate: "",
  fetalCount: "Single",
  chronicHypertension: false,
  preExistingDiabetes: "None",
  kidneyOrAutoimmune: false,
  firstTimeMother: true,
  gravida: "",
  para: "",
  previousPreeclampsia: false,
  previousGestationalDiabetes: false,
  familyHistoryPreeclampsia: false,
};

export default function OnboardingForm() {
  const [formData, setFormData] = useState<OnboardingData>(initialData);
  const [errors, setErrors] = useState<Partial<Record<keyof OnboardingData, string>>>({});
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof OnboardingData, string>> = {};

    if (!formData.age || isNaN(Number(formData.age)) || Number(formData.age) < 15 || Number(formData.age) > 60) {
      newErrors.age = "Please enter a valid age.";
    }
    if (!formData.height || isNaN(Number(formData.height)) || Number(formData.height) < 100 || Number(formData.height) > 250) {
      newErrors.height = "Please enter a valid height in cm.";
    }
    if (!formData.prePregnancyWeight || isNaN(Number(formData.prePregnancyWeight)) || Number(formData.prePregnancyWeight) < 30 || Number(formData.prePregnancyWeight) > 300) {
      newErrors.prePregnancyWeight = "Please enter a valid weight in kg.";
    }
    if (formData.baselineBp && !/^\d{2,3}\/\d{2,3}$/.test(formData.baselineBp)) {
      newErrors.baselineBp = "Format should be SYS/DIA (e.g., 120/80).";
    }
    if (!formData.pregnancyDate) {
      newErrors.pregnancyDate = "Please select a date.";
    }
    if (!formData.firstTimeMother) {
      if (!formData.gravida || isNaN(Number(formData.gravida)) || Number(formData.gravida) < 1) {
        newErrors.gravida = "Required.";
      }
      if (!formData.para || isNaN(Number(formData.para)) || Number(formData.para) < 0) {
        newErrors.para = "Required.";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validate()) {
      setStatus("error");
      setErrorMessage("Please correct the errors in the form before submitting.");
      return;
    }

    setStatus("submitting");
    setErrorMessage("");

    // Mock API call
    try {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      // In a real scenario, we would POST the structured formData here.
      setStatus("success");
    } catch (err) {
      setStatus("error");
      setErrorMessage("An unexpected error occurred. Please try again.");
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (type === "checkbox") {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
    
    // Clear error for this field
    if (errors[name as keyof OnboardingData]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  if (status === "success") {
    return (
      <GlassCard className="max-w-2xl mx-auto text-center py-12 animate-fade-in-up">
        <div className="w-20 h-20 bg-alert-green-bg text-alert-green rounded-full flex items-center justify-center mx-auto mb-6 shadow-glow-green">
          <CheckCircle size={40} />
        </div>
        <h2 className="text-3xl font-bold text-slate-100 mb-4">Profile Complete</h2>
        <p className="text-slate-400 mb-8 max-w-md mx-auto">
          Your baseline clinical profile has been established. Our AI and Risk Engine will use this to accurately monitor your pregnancy.
        </p>
        <button 
          className="btn-primary"
          onClick={() => window.location.href = '/dashboard'}
        >
          Go to Dashboard
        </button>
      </GlassCard>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-3xl mx-auto space-y-8 animate-fade-in-up">
      
      {/* ── 1. Personal & Physical Basics ───────────────────────── */}
      <GlassCard>
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-brand-500/15 text-brand-400 rounded-lg">
            <User size={20} />
          </div>
          <h2 className="text-xl font-semibold text-slate-100">Personal & Physical Basics</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Age</label>
            <input 
              type="number" 
              name="age" 
              value={formData.age} 
              onChange={handleChange}
              placeholder="Years" 
              className={cn("input-glass", errors.age && "border-alert-red focus:border-alert-red focus:ring-alert-red/20")} 
            />
            {errors.age && <p className="text-alert-red text-xs mt-1">{errors.age}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Height (cm)</label>
            <input 
              type="number" 
              name="height" 
              value={formData.height} 
              onChange={handleChange}
              placeholder="e.g. 165" 
              className={cn("input-glass", errors.height && "border-alert-red focus:border-alert-red")} 
            />
            {errors.height && <p className="text-alert-red text-xs mt-1">{errors.height}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Pre-pregnancy Weight (kg)</label>
            <input 
              type="number" 
              name="prePregnancyWeight" 
              value={formData.prePregnancyWeight} 
              onChange={handleChange}
              placeholder="e.g. 65" 
              className={cn("input-glass", errors.prePregnancyWeight && "border-alert-red focus:border-alert-red")} 
            />
            {errors.prePregnancyWeight && <p className="text-alert-red text-xs mt-1">{errors.prePregnancyWeight}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Baseline Blood Pressure <span className="text-slate-500 font-normal">(Optional)</span></label>
            <input 
              type="text" 
              name="baselineBp" 
              value={formData.baselineBp} 
              onChange={handleChange}
              placeholder="e.g. 110/70" 
              className={cn("input-glass", errors.baselineBp && "border-alert-red focus:border-alert-red")} 
            />
            {errors.baselineBp && <p className="text-alert-red text-xs mt-1">{errors.baselineBp}</p>}
          </div>
        </div>
      </GlassCard>

      {/* ── 2. Pregnancy Details ───────────────────────── */}
      <GlassCard>
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-brand-500/15 text-brand-400 rounded-lg">
            <Baby size={20} />
          </div>
          <h2 className="text-xl font-semibold text-slate-100">Pregnancy Details</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Date Type</label>
            <select name="dateType" value={formData.dateType} onChange={handleChange} className="select-glass">
              <option value="LMP">Last Menstrual Period (LMP)</option>
              <option value="EDD">Expected Date of Delivery (EDD)</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Select Date</label>
            <input 
              type="date" 
              name="pregnancyDate" 
              value={formData.pregnancyDate} 
              onChange={handleChange}
              className={cn("input-glass", errors.pregnancyDate && "border-alert-red focus:border-alert-red")} 
            />
            {errors.pregnancyDate && <p className="text-alert-red text-xs mt-1">{errors.pregnancyDate}</p>}
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-slate-300 mb-2">Fetal Count</label>
            <div className="flex gap-4">
              {["Single", "Twins", "Multiples"].map((opt) => (
                <label key={opt} className="flex items-center gap-2 cursor-pointer text-slate-200">
                  <input 
                    type="radio" 
                    name="fetalCount" 
                    value={opt} 
                    checked={formData.fetalCount === opt}
                    onChange={handleChange}
                    className="w-4 h-4 text-brand-500 bg-glass border-glass-border focus:ring-brand-500/50" 
                  />
                  {opt}
                </label>
              ))}
            </div>
          </div>
        </div>
      </GlassCard>

      {/* ── 3. Medical History ───────────────────────── */}
      <GlassCard>
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-brand-500/15 text-brand-400 rounded-lg">
            <HeartPulse size={20} />
          </div>
          <h2 className="text-xl font-semibold text-slate-100">Medical History</h2>
        </div>
        
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Pre-existing Diabetes</label>
            <select name="preExistingDiabetes" value={formData.preExistingDiabetes} onChange={handleChange} className="select-glass max-w-sm">
              <option value="None">None</option>
              <option value="Type 1">Type 1 Diabetes</option>
              <option value="Type 2">Type 2 Diabetes</option>
            </select>
          </div>
          <div className="flex items-center gap-3">
            <input 
              type="checkbox" 
              id="chronicHypertension" 
              name="chronicHypertension" 
              checked={formData.chronicHypertension} 
              onChange={handleChange}
              className="w-5 h-5 rounded bg-glass border-glass-border text-brand-500 focus:ring-brand-500/50"
            />
            <label htmlFor="chronicHypertension" className="text-slate-200 cursor-pointer select-none">
              Chronic Hypertension (Pre-existing high blood pressure)
            </label>
          </div>
          <div className="flex items-center gap-3">
            <input 
              type="checkbox" 
              id="kidneyOrAutoimmune" 
              name="kidneyOrAutoimmune" 
              checked={formData.kidneyOrAutoimmune} 
              onChange={handleChange}
              className="w-5 h-5 rounded bg-glass border-glass-border text-brand-500 focus:ring-brand-500/50"
            />
            <label htmlFor="kidneyOrAutoimmune" className="text-slate-200 cursor-pointer select-none">
              Kidney Disease or Autoimmune Disorder (e.g., Lupus)
            </label>
          </div>
        </div>
      </GlassCard>

      {/* ── 4. Obstetric & Family History ───────────────────────── */}
      <GlassCard>
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-brand-500/15 text-brand-400 rounded-lg">
            <History size={20} />
          </div>
          <h2 className="text-xl font-semibold text-slate-100">Obstetric & Family History</h2>
        </div>
        
        <div className="space-y-6">
          <div className="flex items-center gap-3 border-b border-glass-border pb-6">
            <input 
              type="checkbox" 
              id="firstTimeMother" 
              name="firstTimeMother" 
              checked={formData.firstTimeMother} 
              onChange={handleChange}
              className="w-5 h-5 rounded bg-glass border-glass-border text-brand-500 focus:ring-brand-500/50"
            />
            <label htmlFor="firstTimeMother" className="text-slate-200 cursor-pointer select-none">
              This is my first pregnancy (Nulliparous)
            </label>
          </div>

          {!formData.firstTimeMother && (
            <div className="grid grid-cols-2 gap-6 pb-6 border-b border-glass-border animate-fade-in">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Gravida (Total Pregnancies)</label>
                <input 
                  type="number" 
                  name="gravida" 
                  value={formData.gravida} 
                  onChange={handleChange}
                  className={cn("input-glass", errors.gravida && "border-alert-red focus:border-alert-red")} 
                />
                {errors.gravida && <p className="text-alert-red text-xs mt-1">{errors.gravida}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Para (Total Deliveries)</label>
                <input 
                  type="number" 
                  name="para" 
                  value={formData.para} 
                  onChange={handleChange}
                  className={cn("input-glass", errors.para && "border-alert-red focus:border-alert-red")} 
                />
                {errors.para && <p className="text-alert-red text-xs mt-1">{errors.para}</p>}
              </div>
              
              <div className="col-span-2 space-y-4 mt-2">
                <div className="flex items-center gap-3">
                  <input 
                    type="checkbox" 
                    id="previousPreeclampsia" 
                    name="previousPreeclampsia" 
                    checked={formData.previousPreeclampsia} 
                    onChange={handleChange}
                    className="w-5 h-5 rounded bg-glass border-glass-border text-brand-500 focus:ring-brand-500/50"
                  />
                  <label htmlFor="previousPreeclampsia" className="text-slate-200 cursor-pointer select-none">
                    Previous history of Preeclampsia
                  </label>
                </div>
                <div className="flex items-center gap-3">
                  <input 
                    type="checkbox" 
                    id="previousGestationalDiabetes" 
                    name="previousGestationalDiabetes" 
                    checked={formData.previousGestationalDiabetes} 
                    onChange={handleChange}
                    className="w-5 h-5 rounded bg-glass border-glass-border text-brand-500 focus:ring-brand-500/50"
                  />
                  <label htmlFor="previousGestationalDiabetes" className="text-slate-200 cursor-pointer select-none">
                    Previous history of Gestational Diabetes
                  </label>
                </div>
              </div>
            </div>
          )}

          <div className="flex items-center gap-3 pt-2">
            <input 
              type="checkbox" 
              id="familyHistoryPreeclampsia" 
              name="familyHistoryPreeclampsia" 
              checked={formData.familyHistoryPreeclampsia} 
              onChange={handleChange}
              className="w-5 h-5 rounded bg-glass border-glass-border text-brand-500 focus:ring-brand-500/50"
            />
            <label htmlFor="familyHistoryPreeclampsia" className="text-slate-200 cursor-pointer select-none">
              Family history of Preeclampsia (e.g., mother or sister)
            </label>
          </div>
        </div>
      </GlassCard>

      {/* ── Submission & Errors ───────────────────────── */}
      {status === "error" && errorMessage && (
        <div className="p-4 rounded-xl bg-alert-red-bg border border-alert-red-border flex items-start gap-3 animate-fade-in-up">
          <AlertTriangle className="text-alert-red flex-shrink-0 mt-0.5" size={20} />
          <p className="text-sm text-alert-red">{errorMessage}</p>
        </div>
      )}

      <div className="flex justify-end pt-4 pb-12">
        <button 
          type="submit" 
          disabled={status === "submitting"}
          className={cn(
            "btn-primary w-full sm:w-auto min-w-[200px]",
            status === "submitting" && "opacity-80 cursor-not-allowed"
          )}
        >
          {status === "submitting" ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              Processing...
            </>
          ) : (
            <>
              Complete Onboarding
              <CheckCircle size={18} />
            </>
          )}
        </button>
      </div>

    </form>
  );
}
