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

export function parseJwt(token: string) {
  try {
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    return JSON.parse(jsonPayload);
  } catch (e) {
    return null;
  }
}

export function getCurrentUserId(): string {
  if (typeof window === "undefined") return "default_user";
  const token = localStorage.getItem("access_token");
  if (token) {
    const decoded = parseJwt(token);
    if (decoded?.sub) return String(decoded.sub);
  }
  const explicitId = localStorage.getItem("user_id");
  if (explicitId) return explicitId;
  return "default_user";
}

export function getScopedKey(baseKey: string): string {
  const userId = getCurrentUserId();
  return `${baseKey}_user_${userId}`;
}
