"use client";

import React from "react";
import { Brain } from "lucide-react";

export default function TypingIndicator() {
  return (
    <div
      className="flex gap-3 items-start animate-fade-in"
      role="status"
      aria-label="Materna assistant is typing"
    >
      {/* Avatar */}
      <div
        className="flex-shrink-0 w-8 h-8 rounded-lg bg-gradient-brand flex items-center justify-center text-white shadow-glow-brand"
        aria-hidden="true"
      >
        <Brain size={16} />
      </div>

      {/* Dots */}
      <div className="glass rounded-2xl rounded-tl-md px-4 py-3 flex items-center gap-1.5">
        <span
          className="w-2 h-2 rounded-full bg-brand-400 animate-pulse-glow"
          style={{ animationDelay: "0ms" }}
        />
        <span
          className="w-2 h-2 rounded-full bg-brand-400 animate-pulse-glow"
          style={{ animationDelay: "300ms" }}
        />
        <span
          className="w-2 h-2 rounded-full bg-brand-400 animate-pulse-glow"
          style={{ animationDelay: "600ms" }}
        />
      </div>
    </div>
  );
}
