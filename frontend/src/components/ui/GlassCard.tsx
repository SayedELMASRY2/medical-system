"use client";

import React from "react";
import { cn, type RiskLevel } from "@/lib/utils";

export interface GlassCardProps {
  children?: React.ReactNode;
  className?: string;
  variant?: "default" | "subtle" | "heavy" | RiskLevel;
  hover?: boolean;
  padding?: "none" | "sm" | "md" | "lg";
  animate?: boolean;
  onClick?: (e: React.MouseEvent<HTMLDivElement>) => void;
}

const variantClasses: Record<string, string> = {
  default: "glass",
  subtle: "glass-subtle",
  heavy: "glass-heavy",
  low: "alert-card-green",
  monitor: "alert-card-yellow",
  clinical_review: "alert-card-orange",
  high: "alert-card-red",
};

const paddingClasses: Record<string, string> = {
  none: "",
  sm: "p-4",
  md: "p-6",
  lg: "p-8",
};

const GlassCard: React.FC<GlassCardProps> = ({
  children,
  className,
  variant = "default",
  hover = false,
  padding = "md",
  animate = false,
  onClick,
}) => {
  return (
    <div
      onClick={onClick}
      className={cn(
        variantClasses[variant],
        paddingClasses[padding],
        hover &&
        "transition-all duration-300 ease-out hover:scale-[1.02] hover:shadow-glass-lg hover:border-glass-border-light cursor-pointer",
        animate && "animate-fade-in-up",
        className
      )}
    >
      {children}
    </div>
  );
};

export default GlassCard;

