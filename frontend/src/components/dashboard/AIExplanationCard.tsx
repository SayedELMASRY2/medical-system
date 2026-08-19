"use client";

import React, { useState, useEffect } from "react";
import GlassCard from "@/components/ui/GlassCard";
import { Activity, Sparkles, BookOpen, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface AIExplanationCardProps {
  patientId: string;
  trendSummary: string;
}

// Mocked SSE stream words
const MOCK_STREAM_TEXT = 
  "Based on the longitudinal data, the patient's blood pressure has increased by 15% over the last 72 hours. This upward trend is now accompanied by newly reported visual disturbances (blurriness) in today's check-in. This combination of symptoms is a strong indicator of potential hypertensive disorders of pregnancy. Immediate clinical review is highly recommended to rule out preeclampsia.";

const MOCK_CITATIONS = [
  "ACOG Practice Bulletin No. 222: Gestational Hypertension and Preeclampsia.",
  "Maternal Fetal Medicine Guidelines (2024), Chapter 4: Risk Indication."
];

export default function AIExplanationCard({ patientId, trendSummary }: AIExplanationCardProps) {
  const [displayedText, setDisplayedText] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [showCitations, setShowCitations] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Reset state when patient changes
    setDisplayedText("");
    setShowCitations(false);
    setError(null);
    setIsStreaming(true);

    let currentIndex = 0;
    const words = MOCK_STREAM_TEXT.split(" ");
    
    // Simulate SSE word-by-word streaming
    const streamInterval = setInterval(() => {
      if (currentIndex < words.length) {
        setDisplayedText((prev) => prev + (prev ? " " : "") + words[currentIndex]);
        currentIndex++;
      } else {
        clearInterval(streamInterval);
        setIsStreaming(false);
        // Show citations shortly after the stream finishes
        setTimeout(() => setShowCitations(true), 500);
      }
    }, 100); // 100ms per word to simulate reading speed

    return () => clearInterval(streamInterval);
  }, [patientId]);

  return (
    <GlassCard variant="subtle" className="border-brand-500/30 flex flex-col h-full animate-fade-in-up animation-delay-200">
      <div className="flex items-center gap-3 mb-4 border-b border-glass-border/50 pb-4">
        <div className="p-2 bg-brand-500/20 text-brand-400 rounded-lg shadow-glow-blue relative">
          <Activity size={20} />
          {isStreaming && (
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-brand-400 rounded-full animate-ping" />
          )}
        </div>
        <div className="flex-1">
          <h2 className="text-lg font-semibold text-slate-100 flex items-center gap-2">
            AI Triage Analysis
            <Sparkles size={14} className="text-brand-400" />
          </h2>
          <p className="text-xs text-slate-400">
            {isStreaming ? "Synthesizing clinical data..." : "Analysis complete"}
          </p>
        </div>
      </div>

      {error ? (
        <div className="p-4 rounded-lg bg-alert-red-bg border border-alert-red/30 flex items-start gap-3">
          <AlertCircle className="text-alert-red flex-shrink-0 mt-0.5" size={18} />
          <p className="text-sm text-alert-red">{error}</p>
        </div>
      ) : (
        <div className="flex-1 flex flex-col space-y-4">
          <div className="p-4 rounded-lg bg-glass-light border border-glass-border/50 flex-1 relative">
            <p className="text-sm text-slate-200 leading-relaxed">
              {displayedText}
              {isStreaming && (
                <span className="inline-block w-1.5 h-4 ml-1 bg-brand-400 animate-pulse align-middle" />
              )}
            </p>
            
            {/* Show an empty state if streaming hasn't started */}
            {!displayedText && isStreaming && (
              <p className="text-sm text-slate-500 italic">Waiting for Triage Agent...</p>
            )}
          </div>

          {/* RAG Citations Section */}
          <div 
            className={cn(
              "transition-all duration-500 overflow-hidden",
              showCitations ? "max-h-48 opacity-100" : "max-h-0 opacity-0"
            )}
          >
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-2">
              <BookOpen size={12} />
              Evidence & Guidelines
            </h3>
            <ul className="space-y-2">
              {MOCK_CITATIONS.map((citation, index) => (
                <li key={index} className="text-xs text-slate-300 flex items-start gap-2 bg-glass border border-glass-border p-2 rounded-md">
                  <div className="w-1 h-1 rounded-full bg-brand-500 mt-1.5 flex-shrink-0" />
                  {citation}
                </li>
              ))}
            </ul>
          </div>

          <div className="pt-4 border-t border-glass-border/50 mt-auto">
            <p className="text-xs text-slate-500">
              <span className="font-semibold text-slate-400">Current Trend Summary:</span> {trendSummary}
            </p>
            <p className="text-[10px] text-slate-600 mt-2 italic text-center">
              Materna CDSS is an assistive tool. Do not use for definitive diagnosis.
            </p>
          </div>
        </div>
      )}
    </GlassCard>
  );
}
