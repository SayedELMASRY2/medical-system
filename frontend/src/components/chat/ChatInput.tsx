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
    <div className="w-full relative">
      <div className="bg-slate-800 focus-within:bg-slate-700/80 rounded-3xl p-2 px-3 shadow-lg transition-all duration-300 flex flex-col relative border border-slate-700">
        
        {/* Pending File Previews */}
        {pendingFiles.length > 0 && (
          <div className="flex flex-wrap gap-2 px-2 pb-2 mt-2">
            {pendingFiles.map((att) => (
              <div
                key={att.id}
                className="relative group w-14 h-14 rounded-xl border border-slate-600 bg-slate-900 overflow-hidden flex-shrink-0 flex items-center justify-center"
              >
                {att.previewUrl ? (
                  <img src={att.previewUrl} alt="preview" className="w-full h-full object-cover" />
                ) : (
                  <FileText size={18} className="text-slate-400" />
                )}
                <button
                  type="button"
                  onClick={() => removeFile(att.id)}
                  className="absolute top-0.5 right-0.5 bg-slate-950/80 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-rose-500"
                >
                  <X size={10} />
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="flex items-end gap-2">
          {/* Attachment Button */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="p-2 text-slate-400 hover:text-slate-200 rounded-full hover:bg-slate-600/50 transition-colors shrink-0 mb-0.5"
            disabled={disabled}
            aria-label="Attach File"
          >
            <Paperclip size={20} />
          </button>
          <input
            type="file"
            multiple
            accept={ACCEPTED_TYPES}
            ref={fileInputRef}
            onChange={handleFileSelect}
            className="hidden"
          />

          {/* Text Area */}
          <textarea
            ref={textareaRef}
            value={text}
            onChange={(e) => {
              setText(e.target.value);
              e.target.style.height = "auto";
              e.target.style.height = Math.min(e.target.scrollHeight, 200) + "px";
            }}
            onKeyDown={handleKeyDown}
            disabled={disabled}
            placeholder="Message Materna AI..."
            className="flex-1 max-h-[200px] min-h-[24px] bg-transparent resize-none outline-none text-[15px] text-slate-100 placeholder:text-slate-500 py-2"
            rows={1}
            style={{ overflowY: text.split("\n").length > 5 ? "auto" : "hidden" }}
          />

          {/* Send Button */}
          <button
            onClick={handleSend}
            disabled={!canSend}
            className={cn(
              "p-2 rounded-full flex-shrink-0 transition-all mb-0.5",
              canSend
                ? "bg-white text-slate-900 hover:bg-slate-200 shadow-sm"
                : "bg-slate-700/50 text-slate-500 cursor-not-allowed"
            )}
            aria-label="Send Message"
          >
            <Send size={18} className={canSend ? "ml-0.5" : ""} />
          </button>
        </div>
      </div>
      <div className="text-center mt-2">
        <p className="text-[10px] text-slate-400">
          Materna AI can make mistakes. Check important info.
        </p>
      </div>
    </div>
  );
}
