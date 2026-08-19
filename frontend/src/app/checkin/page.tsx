import React from "react";
import DailyCheckInForm from "@/components/checkin/DailyCheckInForm";

export default function CheckInPage() {
  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-10 animate-fade-in">
        <h1 className="text-3xl font-bold text-slate-100 mb-2">Daily Check-in</h1>
        <p className="text-slate-400 max-w-2xl">
          Please log your daily vitals and symptoms. This takes less than 2 minutes and helps your care team ensure a safe pregnancy.
        </p>
      </div>
      
      <DailyCheckInForm />
    </div>
  );
}
