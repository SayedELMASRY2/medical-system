"use client";

import React, { useState } from "react";
import GlassCard from "@/components/ui/GlassCard";
import { cn } from "@/lib/utils";
import { 
  CheckCircle, 
  AlertTriangle, 
  Loader2, 
  Activity, 
  Coffee, 
  Moon, 
  Pill, 
  AlertOctagon, 
  Baby 
} from "lucide-react";

export type DailyCheckInData = {
  // 1. Basic Vitals
  weight: string;
  systolic: string;
  diastolic: string;
  bloodSugar: string;

  // 2. Nutrition & Hydration
  dietQuality: string;
  hydrationCups: string;

  // 3. Lifestyle & Activity
  physicalActivity: "Resting" | "Light/Walking" | "Moderate/Exercise" | "Strenuous" | "";
  sleepHours: string;
  sleepQuality: "Poor" | "Fair" | "Good" | "";

  // 4. Medications & Supplements
  vitaminIron: boolean;
  vitaminCalcium: boolean;
  vitaminFolicAcid: boolean;
  medLowDoseAspirin: boolean;
  medLabetalol: boolean;
  medInsulin: boolean;

  // 5. Symptoms & Warning Signs
  swelling: string[]; // Can be multiple
  headache: "None" | "Mild" | "Severe/Unrelenting" | "";
  visionChanges: boolean;
  abdominalPain: boolean;
  vaginalBleeding: boolean;

  // 6. Fetal Monitoring
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
  isOver28Weeks: false, // In a real app, derived from Onboarding baseline
  fetalMovement: "",
  kickCounts: "",
};

export default function DailyCheckInForm() {
  const [formData, setFormData] = useState<DailyCheckInData>(initialData);
  const [errors, setErrors] = useState<Partial<Record<keyof DailyCheckInData, string>>>({});
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof DailyCheckInData, string>> = {};

    if (!formData.weight || isNaN(Number(formData.weight)) || Number(formData.weight) < 30 || Number(formData.weight) > 300) {
      newErrors.weight = "Please enter a valid weight in kg.";
    }
    if (!formData.systolic || isNaN(Number(formData.systolic)) || Number(formData.systolic) < 50 || Number(formData.systolic) > 250) {
      newErrors.systolic = "Valid Systolic BP required (e.g. 120).";
    }
    if (!formData.diastolic || isNaN(Number(formData.diastolic)) || Number(formData.diastolic) < 30 || Number(formData.diastolic) > 150) {
      newErrors.diastolic = "Valid Diastolic BP required (e.g. 80).";
    }
    if (!formData.dietQuality) {
      newErrors.dietQuality = "Please select diet quality.";
    }
    if (!formData.hydrationCups || isNaN(Number(formData.hydrationCups)) || Number(formData.hydrationCups) < 0) {
      newErrors.hydrationCups = "Please enter a valid number of cups.";
    }
    if (!formData.physicalActivity) {
      newErrors.physicalActivity = "Please select physical activity level.";
    }
    if (!formData.sleepHours || isNaN(Number(formData.sleepHours)) || Number(formData.sleepHours) < 0 || Number(formData.sleepHours) > 24) {
      newErrors.sleepHours = "Please enter valid sleep hours.";
    }
    if (!formData.sleepQuality) {
      newErrors.sleepQuality = "Please select sleep quality.";
    }
    if (!formData.headache) {
      newErrors.headache = "Please indicate if you have a headache.";
    }
    if (formData.isOver28Weeks && !formData.fetalMovement) {
      newErrors.fetalMovement = "Please select fetal movement status.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validate()) {
      setStatus("error");
      setErrorMessage("Please correct the highlighted errors before submitting.");
      return;
    }

    setStatus("submitting");
    setErrorMessage("");

    try {
      // Mock API call to Risk Engine / Database
      await new Promise((resolve) => setTimeout(resolve, 2000));
      setStatus("success");
    } catch (err) {
      setStatus("error");
      setErrorMessage("An unexpected error occurred. Please try again.");
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    
    if (type === "checkbox") {
      const checked = (e.target as HTMLInputElement).checked;
      
      // Handle swelling multi-select
      if (name === "swelling") {
        if (value === "None") {
          setFormData(prev => ({ ...prev, swelling: checked ? ["None"] : [] }));
        } else {
          setFormData(prev => {
            let newSwelling = prev.swelling.filter(s => s !== "None"); // Remove 'None' if another option is selected
            if (checked) newSwelling.push(value);
            else newSwelling = newSwelling.filter(s => s !== value);
            return { ...prev, swelling: newSwelling };
          });
        }
      } else {
        setFormData(prev => ({ ...prev, [name]: checked }));
      }
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
    
    if (errors[name as keyof DailyCheckInData]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  if (status === "success") {
    return (
      <GlassCard className="max-w-2xl mx-auto text-center py-12 animate-fade-in-up">
        <div className="w-20 h-20 bg-alert-green-bg text-alert-green rounded-full flex items-center justify-center mx-auto mb-6 shadow-glow-green">
          <CheckCircle size={40} />
        </div>
        <h2 className="text-3xl font-bold text-slate-100 mb-4">Check-in Complete</h2>
        <p className="text-slate-400 mb-8 max-w-md mx-auto">
          Your daily vitals and symptoms have been securely logged and analyzed by the Materna CDSS. Have a great day!
        </p>
        <button 
          className="btn-primary"
          onClick={() => window.location.href = '/dashboard'}
        >
          Return to Dashboard
        </button>
      </GlassCard>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-3xl mx-auto space-y-8 animate-fade-in-up">
      
      {/* ── 1. Basic Vitals ───────────────────────── */}
      <GlassCard>
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-brand-500/15 text-brand-400 rounded-lg">
            <Activity size={20} />
          </div>
          <h2 className="text-xl font-semibold text-slate-100">Basic Vitals</h2>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Weight Today (kg) <span className="text-alert-red">*</span></label>
            <input 
              type="number" 
              step="0.1"
              name="weight" 
              value={formData.weight} 
              onChange={handleChange}
              placeholder="e.g. 68.5" 
              className={cn("input-glass", errors.weight && "border-alert-red focus:border-alert-red")} 
            />
            {errors.weight && <p className="text-alert-red text-xs mt-1">{errors.weight}</p>}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Blood Sugar (mg/dL) <span className="text-slate-500 font-normal">(Optional)</span></label>
            <input 
              type="number" 
              name="bloodSugar" 
              value={formData.bloodSugar} 
              onChange={handleChange}
              placeholder="e.g. 95" 
              className="input-glass"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-slate-300 mb-2">Blood Pressure (mmHg) <span className="text-alert-red">*</span></label>
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <input 
                  type="number" 
                  name="systolic" 
                  value={formData.systolic} 
                  onChange={handleChange}
                  placeholder="Systolic (120)" 
                  className={cn("input-glass", errors.systolic && "border-alert-red focus:border-alert-red")} 
                />
              </div>
              <span className="text-slate-400 text-xl font-light">/</span>
              <div className="flex-1">
                <input 
                  type="number" 
                  name="diastolic" 
                  value={formData.diastolic} 
                  onChange={handleChange}
                  placeholder="Diastolic (80)" 
                  className={cn("input-glass", errors.diastolic && "border-alert-red focus:border-alert-red")} 
                />
              </div>
            </div>
            {(errors.systolic || errors.diastolic) && (
              <p className="text-alert-red text-xs mt-1">{errors.systolic || errors.diastolic}</p>
            )}
          </div>
        </div>
      </GlassCard>

      {/* ── 2. Nutrition & Hydration ───────────────────────── */}
      <GlassCard>
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-brand-500/15 text-brand-400 rounded-lg">
            <Coffee size={20} />
          </div>
          <h2 className="text-xl font-semibold text-slate-100">Nutrition & Hydration</h2>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Diet Quality <span className="text-alert-red">*</span></label>
            <select 
              name="dietQuality" 
              value={formData.dietQuality} 
              onChange={handleChange} 
              className={cn("select-glass", errors.dietQuality && "border-alert-red focus:border-alert-red")}
            >
              <option value="">Select diet type</option>
              <option value="Balanced">Balanced</option>
              <option value="High Protein">High Protein</option>
              <option value="High Carbs">High Carbs / Sugars</option>
              <option value="High Sodium">High Sodium / Salty</option>
              <option value="Poor">Poor / Skipped Meals</option>
            </select>
            {errors.dietQuality && <p className="text-alert-red text-xs mt-1">{errors.dietQuality}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Hydration (Cups) <span className="text-alert-red">*</span></label>
            <input 
              type="number" 
              name="hydrationCups" 
              value={formData.hydrationCups} 
              onChange={handleChange}
              placeholder="e.g. 8" 
              className={cn("input-glass", errors.hydrationCups && "border-alert-red focus:border-alert-red")} 
            />
            {errors.hydrationCups && <p className="text-alert-red text-xs mt-1">{errors.hydrationCups}</p>}
          </div>
        </div>
      </GlassCard>

      {/* ── 3. Lifestyle & Activity ───────────────────────── */}
      <GlassCard>
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-brand-500/15 text-brand-400 rounded-lg">
            <Moon size={20} />
          </div>
          <h2 className="text-xl font-semibold text-slate-100">Lifestyle & Activity</h2>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-slate-300 mb-2">Physical Activity Level <span className="text-alert-red">*</span></label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {["Resting", "Light/Walking", "Moderate/Exercise", "Strenuous"].map((opt) => (
                <label 
                  key={opt} 
                  className={cn(
                    "flex flex-col items-center justify-center p-3 rounded-xl border cursor-pointer transition-all text-sm text-center",
                    formData.physicalActivity === opt 
                      ? "bg-brand-500/15 border-brand-500 text-brand-400" 
                      : "bg-glass border-glass-border text-slate-300 hover:bg-glass-light"
                  )}
                >
                  <input 
                    type="radio" 
                    name="physicalActivity" 
                    value={opt} 
                    checked={formData.physicalActivity === opt}
                    onChange={handleChange}
                    className="sr-only" 
                  />
                  {opt}
                </label>
              ))}
            </div>
            {errors.physicalActivity && <p className="text-alert-red text-xs mt-1">{errors.physicalActivity}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Sleep (Hours) <span className="text-alert-red">*</span></label>
            <input 
              type="number" 
              name="sleepHours" 
              value={formData.sleepHours} 
              onChange={handleChange}
              placeholder="e.g. 7" 
              className={cn("input-glass", errors.sleepHours && "border-alert-red focus:border-alert-red")} 
            />
            {errors.sleepHours && <p className="text-alert-red text-xs mt-1">{errors.sleepHours}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Sleep Quality <span className="text-alert-red">*</span></label>
            <select 
              name="sleepQuality" 
              value={formData.sleepQuality} 
              onChange={handleChange} 
              className={cn("select-glass", errors.sleepQuality && "border-alert-red focus:border-alert-red")}
            >
              <option value="">Select quality</option>
              <option value="Poor">Poor</option>
              <option value="Fair">Fair</option>
              <option value="Good">Good</option>
            </select>
            {errors.sleepQuality && <p className="text-alert-red text-xs mt-1">{errors.sleepQuality}</p>}
          </div>
        </div>
      </GlassCard>

      {/* ── 4. Medications & Supplements ───────────────────────── */}
      <GlassCard>
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-brand-500/15 text-brand-400 rounded-lg">
            <Pill size={20} />
          </div>
          <h2 className="text-xl font-semibold text-slate-100">Medications Taken Today</h2>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
          <div>
            <h3 className="text-sm font-medium text-slate-300 mb-4">Vitamins & Minerals</h3>
            <div className="space-y-3">
              {[
                { id: "vitaminIron", label: "Iron" },
                { id: "vitaminCalcium", label: "Calcium" },
                { id: "vitaminFolicAcid", label: "Folic Acid" }
              ].map(item => (
                <div key={item.id} className="flex items-center gap-3">
                  <input 
                    type="checkbox" 
                    id={item.id} 
                    name={item.id} 
                    checked={formData[item.id as keyof DailyCheckInData] as boolean} 
                    onChange={handleChange}
                    className="w-5 h-5 rounded bg-glass border-glass-border text-brand-500 focus:ring-brand-500/50"
                  />
                  <label htmlFor={item.id} className="text-slate-200 cursor-pointer select-none">
                    {item.label}
                  </label>
                </div>
              ))}
            </div>
          </div>
          <div>
            <h3 className="text-sm font-medium text-slate-300 mb-4">Specific Medications</h3>
            <div className="space-y-3">
              {[
                { id: "medLowDoseAspirin", label: "Low-dose Aspirin" },
                { id: "medLabetalol", label: "Labetalol (BP)" },
                { id: "medInsulin", label: "Insulin" }
              ].map(item => (
                <div key={item.id} className="flex items-center gap-3">
                  <input 
                    type="checkbox" 
                    id={item.id} 
                    name={item.id} 
                    checked={formData[item.id as keyof DailyCheckInData] as boolean} 
                    onChange={handleChange}
                    className="w-5 h-5 rounded bg-glass border-glass-border text-brand-500 focus:ring-brand-500/50"
                  />
                  <label htmlFor={item.id} className="text-slate-200 cursor-pointer select-none">
                    {item.label}
                  </label>
                </div>
              ))}
            </div>
          </div>
        </div>
      </GlassCard>

      {/* ── 5. Symptoms & Warning Signs ───────────────────────── */}
      <GlassCard variant="subtle" className="border-alert-orange/30">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-alert-orange-bg text-alert-orange rounded-lg">
            <AlertOctagon size={20} />
          </div>
          <h2 className="text-xl font-semibold text-slate-100">Symptoms & Warning Signs</h2>
        </div>
        
        <div className="space-y-6">
          {/* Swelling */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Swelling / Edema <span className="text-slate-500 font-normal">(Select all that apply)</span></label>
            <div className="flex flex-wrap gap-4">
              {["None", "Hands", "Face", "Legs"].map(opt => (
                <div key={opt} className="flex items-center gap-2">
                  <input 
                    type="checkbox" 
                    id={`swelling-${opt}`} 
                    name="swelling" 
                    value={opt}
                    checked={formData.swelling.includes(opt)} 
                    onChange={handleChange}
                    className="w-5 h-5 rounded bg-glass border-glass-border text-brand-500 focus:ring-brand-500/50"
                  />
                  <label htmlFor={`swelling-${opt}`} className="text-slate-200 cursor-pointer select-none">
                    {opt}
                  </label>
                </div>
              ))}
            </div>
          </div>

          {/* Headache */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Headache <span className="text-alert-red">*</span></label>
            <select 
              name="headache" 
              value={formData.headache} 
              onChange={handleChange} 
              className={cn("select-glass max-w-sm", errors.headache && "border-alert-red focus:border-alert-red")}
            >
              <option value="">Select...</option>
              <option value="None">None</option>
              <option value="Mild">Mild</option>
              <option value="Severe/Unrelenting">Severe / Unrelenting</option>
            </select>
            {errors.headache && <p className="text-alert-red text-xs mt-1">{errors.headache}</p>}
          </div>

          {/* Critical Toggles */}
          <div className="space-y-4 pt-2 border-t border-glass-border/50">
            <p className="text-sm text-slate-400 mb-2">Please check any of the following if experienced today:</p>
            
            <div className="flex items-center gap-3">
              <input 
                type="checkbox" 
                id="visionChanges" 
                name="visionChanges" 
                checked={formData.visionChanges} 
                onChange={handleChange}
                className="w-5 h-5 rounded bg-alert-red-bg border-alert-red-border text-alert-red focus:ring-alert-red/50"
              />
              <label htmlFor="visionChanges" className="text-slate-200 cursor-pointer select-none">
                Vision Changes <span className="text-slate-500 text-sm">(blurriness, spots, light sensitivity)</span>
              </label>
            </div>
            
            <div className="flex items-center gap-3">
              <input 
                type="checkbox" 
                id="abdominalPain" 
                name="abdominalPain" 
                checked={formData.abdominalPain} 
                onChange={handleChange}
                className="w-5 h-5 rounded bg-alert-red-bg border-alert-red-border text-alert-red focus:ring-alert-red/50"
              />
              <label htmlFor="abdominalPain" className="text-slate-200 cursor-pointer select-none">
                Severe Abdominal Pain <span className="text-slate-500 text-sm">(especially upper right side)</span>
              </label>
            </div>
            
            <div className="flex items-center gap-3">
              <input 
                type="checkbox" 
                id="vaginalBleeding" 
                name="vaginalBleeding" 
                checked={formData.vaginalBleeding} 
                onChange={handleChange}
                className="w-5 h-5 rounded bg-alert-red-bg border-alert-red-border text-alert-red focus:ring-alert-red/50"
              />
              <label htmlFor="vaginalBleeding" className="text-slate-200 cursor-pointer select-none">
                Vaginal Bleeding or Spotting
              </label>
            </div>
          </div>
        </div>
      </GlassCard>

      {/* ── 6. Fetal Monitoring ───────────────────────── */}
      <GlassCard>
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-brand-500/15 text-brand-400 rounded-lg">
            <Baby size={20} />
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-semibold text-slate-100">Fetal Monitoring</h2>
            <p className="text-xs text-slate-400">Applicable if gestational age {'>'} 28 weeks</p>
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-300">
            <label htmlFor="isOver28Weeks" className="cursor-pointer">Are you over 28 weeks?</label>
            <input 
              type="checkbox" 
              id="isOver28Weeks" 
              name="isOver28Weeks" 
              checked={formData.isOver28Weeks} 
              onChange={handleChange}
              className="w-5 h-5 rounded bg-glass border-glass-border text-brand-500 focus:ring-brand-500/50"
            />
          </div>
        </div>
        
        {formData.isOver28Weeks ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 animate-fade-in">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Fetal Movement <span className="text-alert-red">*</span></label>
              <select 
                name="fetalMovement" 
                value={formData.fetalMovement} 
                onChange={handleChange} 
                className={cn("select-glass", errors.fetalMovement && "border-alert-red focus:border-alert-red")}
              >
                <option value="">Select movement</option>
                <option value="Normal">Normal</option>
                <option value="Decreased">Decreased</option>
                <option value="None">None</option>
              </select>
              {errors.fetalMovement && <p className="text-alert-red text-xs mt-1">{errors.fetalMovement}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Kick Counts <span className="text-slate-500 font-normal">(Optional)</span></label>
              <input 
                type="number" 
                name="kickCounts" 
                value={formData.kickCounts} 
                onChange={handleChange}
                placeholder="Number of kicks observed" 
                className="input-glass" 
              />
            </div>
          </div>
        ) : (
          <p className="text-slate-500 text-sm text-center py-4 bg-glass-light rounded-xl">
            This section is only required for pregnancies beyond 28 weeks.
          </p>
        )}
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
              Submitting...
            </>
          ) : (
            <>
              Submit Check-in
              <CheckCircle size={18} />
            </>
          )}
        </button>
      </div>

    </form>
  );
}
