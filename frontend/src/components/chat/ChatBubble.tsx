"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { ChatMessage } from "@/types/chat";
import { User, Brain, Clock } from "lucide-react";
import FileAttachmentCard from "./FileAttachmentCard";
import RiskAlertBanner from "./RiskAlertBanner";

interface ChatBubbleProps {
  message: ChatMessage;
  onRetryUpload?: (attachmentId: string) => void;
  onRemoveAttachment?: (attachmentId: string) => void;
}

export default function ChatBubble({
  message,
  onRetryUpload,
  onRemoveAttachment,
}: ChatBubbleProps) {
  const isUser = message.role === "user";
  const time = new Date(message.timestamp);
  const timeStr = time.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div
      className={cn(
        "flex gap-3 animate-fade-in-up",
        isUser ? "flex-row-reverse" : "flex-row"
      )}
      role="listitem"
      aria-label={`${isUser ? "You" : "Materna Assistant"} at ${timeStr}`}
    >
      {/* ── Avatar ────────────────────────────────────── */}
      <div
        className={cn(
          "flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center mt-1",
          isUser
            ? "bg-brand-500/20 text-brand-400"
            : "bg-gradient-brand text-white shadow-glow-brand"
        )}
        aria-hidden="true"
      >
        {isUser ? <User size={16} /> : <Brain size={16} />}
      </div>

      {/* ── Content ───────────────────────────────────── */}
      <div
        className={cn(
          "max-w-[75%] min-w-0 space-y-2",
          isUser ? "items-end" : "items-start"
        )}
      >
        {/* Risk Alert Banner (if present) */}
        {message.riskAlert && (
          <RiskAlertBanner
            level={message.riskAlert.level}
            message={message.riskAlert.message}
          />
        )}

        {/* Message bubble */}
        <div
          className={cn(
            "rounded-2xl px-4 py-3 text-sm leading-relaxed",
            isUser
              ? "bg-brand-500/20 border border-brand-500/30 text-slate-100 rounded-tr-md"
              : "glass text-slate-200 rounded-tl-md"
          )}
        >
          {/* Render newlines */}
          {message.content.split("\n").map((line, i) => (
            <React.Fragment key={i}>
              {line}
              {i < message.content.split("\n").length - 1 && <br />}
            </React.Fragment>
          ))}
        </div>

        {/* Attachments */}
        {message.attachments && message.attachments.length > 0 && (
          <div className="space-y-2">
            {message.attachments.map((attachment) => (
              <FileAttachmentCard
                key={attachment.id}
                attachment={attachment}
                onRetry={
                  onRetryUpload
                    ? () => onRetryUpload(attachment.id)
                    : undefined
                }
                onRemove={
                  onRemoveAttachment
                    ? () => onRemoveAttachment(attachment.id)
                    : undefined
                }
              />
            ))}
          </div>
        )}

        {/* Timestamp */}
        <div
          className={cn(
            "flex items-center gap-1 text-[10px] text-slate-600",
            isUser ? "justify-end" : "justify-start"
          )}
        >
          <Clock size={10} aria-hidden="true" />
          <time dateTime={message.timestamp}>{timeStr}</time>
        </div>
      </div>
    </div>
  );
}
