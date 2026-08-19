"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { RiskLevel } from "@/types/patient";
import AlertBadge from "@/components/ui/AlertBadge";
import { AlertOctagon } from "lucide-react";

interface RiskAlertBannerProps {
  level: RiskLevel;
  message: string;
}

export default function RiskAlertBanner({
  level,
  message,
}: RiskAlertBannerProps) {
  return (
    <div
      className={cn(
        "rounded-xl p-3 flex items-start gap-3 animate-fade-in",
        level === "high" &&
          "bg-alert-red-bg border border-alert-red-border shadow-glow-red",
        level === "clinical_review" &&
          "bg-alert-orange-bg border border-alert-orange-border",
        level === "monitor" &&
          "bg-alert-yellow-bg border border-alert-yellow-border",
        level === "low" &&
          "bg-alert-green-bg border border-alert-green-border"
      )}
      role="alert"
      aria-live="assertive"
    >
      <AlertOctagon
        size={18}
        className={cn(
          "flex-shrink-0 mt-0.5",
          level === "high" && "text-alert-red animate-pulse-glow",
          level === "clinical_review" && "text-alert-orange",
          level === "monitor" && "text-alert-yellow",
          level === "low" && "text-alert-green"
        )}
        aria-hidden="true"
      />
      <div className="space-y-1.5">
        <AlertBadge level={level} size="sm" />
        <p className="text-xs text-slate-300 leading-relaxed">{message}</p>
      </div>
    </div>
  );
}
