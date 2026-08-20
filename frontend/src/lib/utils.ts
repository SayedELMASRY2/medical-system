import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export type RiskLevel = "low" | "monitor" | "clinical_review" | "high";

export const RISK_LEVELS: Record<RiskLevel, any> = {
  low: {
    label: "Normal",
    bgClass: "bg-emerald-500/10",
    borderClass: "border-emerald-500/20",
    textClass: "text-emerald-500",
    icon: "🟢",
  },
  monitor: {
    label: "Monitor",
    bgClass: "bg-blue-500/10",
    borderClass: "border-blue-500/20",
    textClass: "text-blue-500",
    icon: "🔵",
  },
  clinical_review: {
    label: "Clinical Review",
    bgClass: "bg-amber-500/10",
    borderClass: "border-amber-500/20",
    textClass: "text-amber-500",
    icon: "🟡",
  },
  high: {
    label: "High Risk",
    bgClass: "bg-rose-500/10",
    borderClass: "border-rose-500/20",
    textClass: "text-rose-500",
    icon: "🔴",
  },
};
