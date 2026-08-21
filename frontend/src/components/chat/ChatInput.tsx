"use client";

import React, { useRef, useState, useCallback } from "react";
import { cn } from "@/lib/utils";
import { Send, Paperclip, X, FileImage, FileText, Sparkles } from "lucide-react";
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

  const handleSend = useCallback(() => {
    const trimmed = text.trim();
    if (!trimmed && pendingFiles.length === 0) return;
    if (disabled) return;

    onSend(trimmed, pendingFiles);
    setText("");
    setPendingFiles([]);

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
    <div className="w-full">
      {/* Floating Glass Dock Input Box */}
      <div className="bg-slate-900/90 backdrop-blur-2xl border border-glass-border/80 focus-within:border-cyan-500/50 rounded-2xl md:rounded-3xl p-3 shadow-2xl transition-all duration-300">
        {/* Pending File Previews */}
        {pendingFiles.length > 0 && (
          <div className="flex flex-wrap gap-2 px-2 pb-2">
            {pendingFiles.map((att) => (
              <div
                key={att.id}
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-800/90 border border-slate-700 text-xs animate-fade-in shadow-sm"
              >
                {att.type.startsWith("image/") ? (
                  <FileImage size={14} className="text-cyan-400" />
                ) : (
                  <FileText size={14} className="text-amber-400" />
                )}
                <span className="text-slate-200 max-w-[140px] truncate">{att.name}</span>
                <button
                  onClick={() => removeFile(att.id)}
                  className="p-1 text-slate-400 hover:text-rose-400 transition-colors"
                >
                  <X size={12} />
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="flex items-end gap-2 px-2">
          {/* Attachment Button */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={disabled}
            className="p-2.5 rounded-2xl text-slate-400 hover:text-cyan-400 hover:bg-cyan-500/10 transition-colors mb-0.5"
            title="Attach lab report or image"
          >
            <Paperclip size={18} />
          </button>

          <input
            ref={fileInputRef}
            type="file"
            accept={ACCEPTED_TYPES}
            multiple
            onChange={handleFileSelect}
            className="hidden"
          />

          {/* Textarea */}
          <textarea
            ref={textareaRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask Materna AI Co-Pilot (e.g., 'Evaluate my 14-day BP trend')..."
            disabled={disabled}
            rows={1}
            className="flex-1 bg-transparent text-slate-100 text-xs md:text-sm placeholder:text-slate-500 outline-none resize-none max-h-32 min-h-[38px] py-2"
          />

          {/* Glowing Send Button */}
          <button
            type="button"
            onClick={handleSend}
            disabled={!canSend}
            className={cn(
              "p-2.5 md:p-3 rounded-2xl flex items-center justify-center transition-all duration-200 flex-shrink-0 mb-0.5 shadow-md",
              canSend
                ? "bg-gradient-to-r from-brand-500 to-cyan-500 text-white shadow-glow-brand hover:scale-105"
                : "bg-slate-800 text-slate-600 cursor-not-allowed"
            )}
          >
            <Send size={16} className={cn(canSend && "translate-x-0.5")} />
          </button>
        </div>
      </div>

      <p className="text-[10px] md:text-[11px] text-slate-500 text-center mt-2">
        Materna AI provides clinical decision support anchored in ACOG protocols. Consult your attending physician for official diagnosis.
      </p>
    </div>
  );
}
