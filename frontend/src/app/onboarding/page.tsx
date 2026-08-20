import React from "react";
import OnboardingForm from "@/components/onboarding/OnboardingForm";

export default function OnboardingPage() {
  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-10 text-center animate-fade-in">
        <h1 className="text-3xl font-bold text-slate-100 mb-2">Patient Onboarding</h1>
        <p className="text-slate-400">
          Establish your clinical baseline. This information helps our AI Risk Engine provide safe, personalized monitoring throughout your pregnancy.
        </p>
      </div>
      
      <OnboardingForm />
    </div>
  );
}
