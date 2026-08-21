"use client";

import React, { useState } from "react";
import { cn } from "@/lib/utils";
import { ChatMessage } from "@/types/chat";
import {
  User,
  Bot,
  Clock,
  ShieldCheck,
  AlertTriangle,
  Activity,
  FileText,
  Copy,
  Check,
  Sparkles,
  Zap,
} from "lucide-react";
import FileAttachmentCard from "./FileAttachmentCard";

interface ChatBubbleProps {
  message: ChatMessage;
  onRetryUpload?: (attachmentId: string) => void;
  onRemoveAttachment?: (attachmentId: string) => void;
}

function renderFormattedText(text: string) {
  if (!text) return null;
  const lines = text.split("\n");

  return lines.map((line, lineIdx) => {
    let cleanLine = line.trim();
    if (!cleanLine) return <div key={lineIdx} className="h-2" />;

    const isHeading = cleanLine.match(/^#+\s+/);
    if (isHeading) {
      const headingText = cleanLine.replace(/^#+\s*/, "").replace(/\*\*/g, "");
      return (
        <h4 key={lineIdx} className="font-bold text-slate-100 text-sm mt-3 mb-1.5 flex items-center gap-2 text-cyan-300">
          <Sparkles size={14} className="text-cyan-400" />
          {headingText}
        </h4>
      );
    }

    const isBullet = cleanLine.startsWith("* ") || cleanLine.startsWith("- ") || cleanLine.startsWith("• ");
    if (isBullet) {
      cleanLine = cleanLine.replace(/^[\*\-\•]\s*/, "");
    }

    const parts = cleanLine.split(/(\*\*.*?\*\*)/g);
    const formattedContent = parts.map((part, partIdx) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return (
          <strong key={partIdx} className="font-semibold text-cyan-200 bg-cyan-950/40 px-1.5 py-0.5 rounded border border-cyan-500/20">
            {part.slice(2, -2)}
          </strong>
        );
      }
      return <span key={partIdx}>{part.replace(/\*/g, "")}</span>;
    });

    if (isBullet) {
      return (
        <div key={lineIdx} className="flex items-start gap-2.5 my-1.5 pl-2">
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 mt-2 flex-shrink-0 shadow-[0_0_8px_rgba(34,211,238,0.8)]" />
          <p className="text-slate-200 text-xs md:text-sm leading-relaxed flex-1">{formattedContent}</p>
        </div>
      );
    }

    return (
      <p key={lineIdx} className="text-xs md:text-sm leading-relaxed text-slate-200 my-1">
        {formattedContent}
      </p>
    );
  });
}

export default function ChatBubble({ message, onRetryUpload, onRemoveAttachment }: ChatBubbleProps) {
  const isUser = message.role === "user";
  const [copied, setCopied] = useState(false);
  const timeStr = new Date(message.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className={cn(
        "flex gap-4 w-full my-6 animate-fade-in-up",
        isUser ? "justify-end" : "justify-start"
      )}
    >
      {/* AI Avatar */}
      {!isUser && (
        <div className="w-8 h-8 md:w-9 md:h-9 rounded-full flex items-center justify-center flex-shrink-0 mt-1 border border-brand-500/30 bg-gradient-to-br from-brand-600 to-brand-800 text-white shadow-sm">
          <Bot size={18} />
        </div>
      )}

      {/* Main Content Container */}
      <div className={cn("w-full flex flex-col space-y-2", isUser ? "items-end" : "items-start")}>
        
        {/* Sub Header for AI (Grounded Badge) */}
        {!isUser && message.confidence !== undefined && (
          <div className="flex items-center gap-2 mb-1">
            <span className="font-semibold text-slate-300 text-sm">Materna Neural AI</span>
            <span className="px-1.5 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-mono font-semibold flex items-center gap-1">
              <ShieldCheck size={11} /> {(message.confidence * 100).toFixed(0)}% Grounded
            </span>
          </div>
        )}

        {/* Message Content */}
        <div
          className={cn(
            "relative text-[15px] leading-relaxed",
            isUser
              ? "bg-slate-800 text-slate-100 rounded-3xl rounded-tr-sm px-5 py-3 shadow-sm"
              : "text-slate-200"
          )}
        >
          {isUser ? (
            <p className="whitespace-pre-wrap">{message.content}</p>
          ) : (
            renderFormattedText(message.content)
          )}

          {/* Vitals Extracted Block */}
          {!isUser && message.vitalsExtracted && Object.keys(message.vitalsExtracted).length > 0 && (
            <div className="mt-4 p-3.5 rounded-xl bg-slate-950/80 border border-slate-800/90 flex flex-wrap gap-3">
              {Object.entries(message.vitalsExtracted).map(([key, val]) => (
                <div key={key} className="flex items-center gap-2 text-xs bg-slate-900/60 px-2.5 py-1 rounded-lg border border-slate-800">
                  <Activity size={13} className="text-cyan-400" />
                  <span className="text-slate-400 capitalize">{key}:</span>
                  <span className="text-slate-100 font-bold font-mono">{String(val)}</span>
                </div>
              ))}
            </div>
          )}

          {/* Clinical Risk Assessment Banner */}
          {!isUser && message.riskStatus && message.riskStatus !== "NONE" && (
            <div
              className={cn(
                "mt-4 p-3.5 rounded-xl border text-xs font-semibold flex items-start gap-3 shadow-inner",
                message.riskStatus === "RED"
                  ? "bg-rose-500/10 border-rose-500/40 text-rose-400"
                  : message.riskStatus === "YELLOW"
                  ? "bg-amber-500/10 border-amber-500/40 text-amber-400"
                  : "bg-emerald-500/10 border-emerald-500/40 text-emerald-400"
              )}
            >
              <AlertTriangle size={17} className="shrink-0 mt-0.5" />
              <div>
                <p className="font-bold uppercase tracking-wider text-[10px] opacity-90 mb-0.5">
                  Clinical Risk Protocol: {message.riskStatus}
                </p>
                {message.riskStatus === "RED"
                  ? "CRITICAL ALERT: Symptoms align with severe preeclampsia protocol. Attending physician notification triggered."
                  : message.riskStatus === "YELLOW"
                  ? "ELEVATED RISK: Vitals require monitoring. Re-check blood pressure in 4 hours."
                  : "NORMAL: Vitals remain within expected baseline limits."}
              </div>
            </div>
          )}

          {/* Supporting Evidence Citations */}
          {!isUser && message.citations && message.citations.length > 0 && (
            <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between flex-wrap gap-2 text-xs">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500 flex items-center gap-1">
                  <FileText size={11} /> Citations:
                </span>
                {message.citations.map((cite, idx) => (
                  <span
                    key={idx}
                    className="px-2 py-0.5 rounded-md bg-slate-950/70 border border-slate-800 text-[10px] text-slate-400 font-mono"
                  >
                    {cite}
                  </span>
                ))}
              </div>

              {/* Copy button */}
              <button
                onClick={handleCopy}
                className="hover:text-cyan-400 transition-colors p-1 rounded hover:bg-slate-800 text-slate-500 flex items-center gap-1 text-[11px]"
                title="Copy response text"
              >
                {copied ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
                {copied && <span className="text-emerald-400 text-[10px]">Copied</span>}
              </button>
            </div>
          )}

          {/* Attachments */}
          {message.attachments && message.attachments.length > 0 && (
            <div className="mt-3 space-y-2 max-w-sm">
              {message.attachments.map((attachment) => (
                <FileAttachmentCard
                  key={attachment.id}
                  attachment={attachment}
                  onRetry={onRetryUpload ? () => onRetryUpload(attachment.id) : undefined}
                  onRemove={onRemoveAttachment ? () => onRemoveAttachment(attachment.id) : undefined}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
