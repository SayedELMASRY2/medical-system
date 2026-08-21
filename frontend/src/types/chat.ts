import { RiskLevel } from "./patient";

/* ─── Chat Message Types ──────────────────────────────────────── */

export type MessageRole = "user" | "assistant" | "system";

export type FileUploadStatus =
  | "selected"    // File picked but not yet sent
  | "uploading"   // Being sent to backend
  | "processing"  // OCR extraction in progress
  | "success"     // OCR completed, results available
  | "error";      // Upload or OCR failed

export interface FileAttachment {
  id: string;
  file: File;
  name: string;
  type: string;          // MIME type
  size: number;          // bytes
  previewUrl?: string;   // Object URL for image previews
  status: FileUploadStatus;
  progress?: number;     // 0-100 upload progress
  errorMessage?: string;
  /** Structured OCR result from backend — shape is not finalized */
  ocrResult?: Record<string, number | string>;
}

export interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: string;     // ISO datetime
  attachments?: FileAttachment[];
  riskStatus?: "GREEN" | "YELLOW" | "RED" | "NONE";
  citations?: string[];
  vitalsExtracted?: Record<string, number | string>;
  confidence?: number;
  /** If the message triggered a risk escalation */
  riskAlert?: {
    level: RiskLevel;
    message: string;
  };
}

/* ─── Chat Service Types ──────────────────────────────────────── */

export interface SendMessageRequest {
  content: string;
  attachments?: File[];
}

export interface SendMessageResponse {
  message: ChatMessage;
}
