"use client";

import React from "react";
import { FlaskConical } from "lucide-react";

interface OCRResultCardProps {
  result: Record<string, any>;
}

export default function OCRResultCard({ result }: OCRResultCardProps) {
  const entries = Object.entries(result);
  if (entries.length === 0) return null;

  return (
    <div className="mx-3 mb-3 p-3 rounded-lg bg-glass-light border border-glass-border/50">
      <div className="flex items-center gap-2 mb-2">
        <FlaskConical size={12} className="text-brand-400" aria-hidden="true" />
        <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
          Extracted Lab Results
        </p>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {entries.map(([key, value]) => {
          let displayValue = String(value);
          if (typeof value === "object" && value !== null) {
            displayValue = `${value.result || ""} ${value.unit || ""}`.trim();
          } else if (typeof value === "number") {
            displayValue = value.toLocaleString();
          }

          return (
            <div
              key={key}
              className="p-2 rounded-md bg-surface-400/50 border border-glass-border/30"
            >
              <p className="text-[10px] text-slate-500 capitalize">
                {key.replace(/_/g, " ")}
              </p>
              <p className="text-sm font-mono font-semibold text-slate-100">
                {displayValue}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
