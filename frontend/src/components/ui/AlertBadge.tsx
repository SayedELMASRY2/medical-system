"use client";

import React from "react";
import { cn, type RiskLevel, RISK_LEVELS } from "@/lib/utils";

interface AlertBadgeProps {
  level: RiskLevel;
  size?: "sm" | "md" | "lg";
  showIcon?: boolean;
  pulse?: boolean;
  className?: string;
}

const sizeClasses = {
  sm: "px-2 py-0.5 text-xs",
  md: "px-3 py-1 text-sm",
  lg: "px-4 py-1.5 text-base",
};

export default function AlertBadge({
  level,
  size = "md",
  showIcon = true,
  pulse = false,
  className,
}: AlertBadgeProps) {
  const config = RISK_LEVELS[level];
  const shouldPulse = pulse || level === "high";

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 font-semibold rounded-full",
        "border backdrop-blur-sm",
        sizeClasses[size],
        config.bgClass,
        config.borderClass,
        config.textClass,
        shouldPulse && level === "high" && "animate-pulse-glow-red",
        shouldPulse && level !== "high" && "animate-pulse-glow",
        className
      )}
    >
      {showIcon && (
        <span className="flex-shrink-0" aria-hidden="true">
          {config.icon}
        </span>
      )}
      <span>{config.label}</span>
    </span>
  );
}
