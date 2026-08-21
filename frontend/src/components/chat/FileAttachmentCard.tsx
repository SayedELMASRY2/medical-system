"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { FileAttachment } from "@/types/chat";
import {
  FileImage,
  FileText,
  X,
  Loader2,
  CheckCircle,
  AlertCircle,
  RotateCcw,
} from "lucide-react";
import OCRResultCard from "./OCRResultCard";

interface FileAttachmentCardProps {
  attachment: FileAttachment;
  onRemove?: () => void;
  onRetry?: () => void;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getFileIcon(type: string) {
  if (type.startsWith("image/")) return <FileImage size={18} />;
  return <FileText size={18} />;
}

export default function FileAttachmentCard({
  attachment,
  onRemove,
  onRetry,
}: FileAttachmentCardProps) {
  const { name, type, size, status, previewUrl, errorMessage, ocrResult } =
    attachment;

  return (
    <div
      className={cn(
        "glass-subtle rounded-xl overflow-hidden max-w-xs",
        "transition-all duration-300",
        status === "error" && "border-alert-red/50"
      )}
    >
      {/* ── Image Preview ─────────────────────────────── */}
      {previewUrl && type.startsWith("image/") && (
        <div className="relative w-full h-32 bg-surface-400 overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={previewUrl}
            alt={`Preview of ${name}`}
            className="w-full h-full object-cover opacity-80"
          />
          {(status === "uploading" || status === "processing") && (
            <div className="absolute inset-0 bg-surface/60 backdrop-blur-sm flex items-center justify-center">
              <Loader2
                size={24}
                className="text-brand-400 animate-spin"
                aria-hidden="true"
              />
            </div>
          )}
        </div>
      )}

      {/* ── File Info Bar ─────────────────────────────── */}
      <div className="px-3 py-2.5 flex items-center gap-3">
        {/* Icon */}
        <div
          className={cn(
            "flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center",
            status === "success" && "bg-alert-green-bg text-alert-green",
            status === "error" && "bg-alert-red-bg text-alert-red",
            status === "uploading" && "bg-brand-500/15 text-brand-400",
            status === "processing" && "bg-alert-yellow-bg text-alert-yellow",
            status === "selected" && "bg-glass-light text-slate-400"
          )}
          aria-hidden="true"
        >
          {status === "uploading" || status === "processing" ? (
            <Loader2 size={16} className="animate-spin" />
          ) : status === "success" ? (
            <CheckCircle size={16} />
          ) : status === "error" ? (
            <AlertCircle size={16} />
          ) : (
            getFileIcon(type)
          )}
        </div>

        {/* Name + Status */}
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-slate-200 truncate">
            {name}
          </p>
          <p
            className={cn(
              "text-[10px]",
              status === "success" && "text-alert-green",
              status === "error" && "text-alert-red",
              status === "processing" && "text-alert-yellow",
              status === "uploading" && "text-brand-400",
              status === "selected" && "text-slate-500"
            )}
          >
            {status === "selected" && formatFileSize(size)}
            {status === "uploading" && "Uploading…"}
            {status === "processing" && "Processing OCR…"}
            {status === "success" && "OCR Complete"}
            {status === "error" && (errorMessage || "Upload failed")}
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1">
          {status === "error" && onRetry && (
            <button
              onClick={onRetry}
              className="p-1.5 rounded-lg hover:bg-glass text-slate-400 hover:text-slate-200 transition-colors"
              aria-label={`Retry upload for ${name}`}
            >
              <RotateCcw size={14} />
            </button>
          )}
          {onRemove && (status === "selected" || status === "error") && (
            <button
              onClick={onRemove}
              className="p-1.5 rounded-lg hover:bg-glass text-slate-400 hover:text-alert-red transition-colors"
              aria-label={`Remove ${name}`}
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {/* ── OCR Results ───────────────────────────────── */}
      {status === "success" && ocrResult?.structured_data && (
        <OCRResultCard result={ocrResult.structured_data as any} />
      )}
    </div>
  );
}
