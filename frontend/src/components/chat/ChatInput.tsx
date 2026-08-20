"use client";

import React, { useRef, useState, useCallback } from "react";
import { cn } from "@/lib/utils";
import { Send, Paperclip, X, FileImage, FileText } from "lucide-react";
import { FileAttachment } from "@/types/chat";

const ACCEPTED_TYPES = ".jpg,.jpeg,.png,.pdf";
const ACCEPTED_MIME = ["image/jpeg", "image/png", "application/pdf"];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

interface ChatInputProps {
  onSend: (content: string, attachments: FileAttachment[]) => void;
  disabled?: boolean;
}

let fileIdCounter = 0;

export default function ChatInput({ onSend, disabled = false }: ChatInputProps) {
  const [text, setText] = useState("");
  const [pendingFiles, setPendingFiles] = useState<FileAttachment[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  /* ── File Selection ──────────────────────────────── */
  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (!files) return;

      const newAttachments: FileAttachment[] = [];

      Array.from(files).forEach((file) => {
        if (!ACCEPTED_MIME.includes(file.type)) return;
        if (file.size > MAX_FILE_SIZE) return;

        fileIdCounter += 1;
        const att: FileAttachment = {
          id: `file-${Date.now()}-${fileIdCounter}`,
          file,
          name: file.name,
          type: file.type,
          size: file.size,
          status: "selected",
          previewUrl: file.type.startsWith("image/")
            ? URL.createObjectURL(file)
            : undefined,
        };
        newAttachments.push(att);
      });

      setPendingFiles((prev) => [...prev, ...newAttachments]);

      // Reset input so the same file can be re-selected
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    },
    []
  );

  const removeFile = useCallback((id: string) => {
    setPendingFiles((prev) => {
      const removed = prev.find((f) => f.id === id);
      if (removed?.previewUrl) URL.revokeObjectURL(removed.previewUrl);
      return prev.filter((f) => f.id !== id);
    });
  }, []);

  /* ── Send ─────────────────────────────────────────── */
  const handleSend = useCallback(() => {
    const trimmed = text.trim();
    if (!trimmed && pendingFiles.length === 0) return;
    if (disabled) return;

    onSend(trimmed, pendingFiles);
    setText("");
    setPendingFiles([]);

    // Refocus the textarea
    setTimeout(() => textareaRef.current?.focus(), 50);
  }, [text, pendingFiles, disabled, onSend]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend]
  );

  const canSend = (text.trim().length > 0 || pendingFiles.length > 0) && !disabled;

  return (
    <div className="glass rounded-2xl p-3 space-y-3">
      {/* ── Pending File Previews ─────────────────────── */}
      {pendingFiles.length > 0 && (
        <div className="flex flex-wrap gap-2 px-1" role="list" aria-label="Selected files">
          {pendingFiles.map((att) => (
            <div
              key={att.id}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-glass-light border border-glass-border/50 text-xs animate-fade-in"
              role="listitem"
            >
              {att.type.startsWith("image/") ? (
                <FileImage size={14} className="text-brand-400 flex-shrink-0" aria-hidden="true" />
              ) : (
                <FileText size={14} className="text-alert-yellow flex-shrink-0" aria-hidden="true" />
              )}
              <span className="text-slate-300 max-w-[120px] truncate">
                {att.name}
              </span>
              <button
                onClick={() => removeFile(att.id)}
                className="p-0.5 rounded hover:bg-glass text-slate-500 hover:text-alert-red transition-colors"
                aria-label={`Remove ${att.name}`}
              >
                <X size={12} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* ── Input Row ─────────────────────────────────── */}
      <div className="flex items-end gap-2">
        {/* Attachment button */}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled}
          className={cn(
            "flex-shrink-0 p-2.5 rounded-xl transition-all duration-200",
            "text-slate-400 hover:text-brand-400 hover:bg-brand-500/10",
            disabled && "opacity-50 cursor-not-allowed"
          )}
          aria-label="Attach file (JPEG, PNG, or PDF)"
        >
          <Paperclip size={18} />
        </button>

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept={ACCEPTED_TYPES}
          multiple
          onChange={handleFileSelect}
          className="hidden"
          aria-label="Upload lab test file"
          id="chat-file-upload"
        />

        {/* Text input */}
        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type your message…"
          disabled={disabled}
          rows={1}
          className={cn(
            "flex-1 resize-none bg-transparent text-sm text-slate-100",
            "placeholder:text-slate-500 outline-none",
            "max-h-32 min-h-[36px] py-2",
            disabled && "opacity-50 cursor-not-allowed"
          )}
          aria-label="Chat message input"
          id="chat-message-input"
        />

        {/* Send button */}
        <button
          type="button"
          onClick={handleSend}
          disabled={!canSend}
          className={cn(
            "flex-shrink-0 p-2.5 rounded-xl transition-all duration-200",
            canSend
              ? "bg-brand-500/20 text-brand-400 hover:bg-brand-500/30 hover:shadow-glow-brand"
              : "text-slate-600 cursor-not-allowed"
          )}
          aria-label="Send message"
          id="chat-send-button"
        >
          <Send size={18} />
        </button>
      </div>
    </div>
  );
}
