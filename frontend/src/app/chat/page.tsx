"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";
import GlassCard from "@/components/ui/GlassCard";
import ChatBubble from "@/components/chat/ChatBubble";
import ChatInput from "@/components/chat/ChatInput";
import TypingIndicator from "@/components/chat/TypingIndicator";
import { ChatMessage, FileAttachment } from "@/types/chat";
import {
  sendChatMessage,
  sendChatMessageWithEscalation,
  uploadFileForOCR,
  getWelcomeMessages,
} from "@/lib/api/chat";
import {
  Brain,
  Shield,
  Sparkles,
  MessageCircle,
} from "lucide-react";

/* ─── Suggestion Chips ────────────────────────────────────────── */
const SUGGESTIONS = [
  "How is my blood pressure trend?",
  "What should I eat today?",
  "I have a headache and blurry vision",
  "Can you explain my risk level?",
];

/* ─── Main Chat Page ──────────────────────────────────────────── */
export default function ChatPage() {
  const [messages, setMessages] = useState<ChatMessage[]>(() =>
    getWelcomeMessages()
  );
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  /* ── Auto-scroll to bottom ─────────────────────────── */
  const scrollToBottom = useCallback(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping, scrollToBottom]);

  /* ── Send Message ──────────────────────────────────── */
  const handleSend = useCallback(
    async (content: string, attachments: FileAttachment[]) => {
      // Build the user message
      let msgIdCounter = Date.now();
      const userMessage: ChatMessage = {
        id: `user-${msgIdCounter++}`,
        role: "user",
        content: content || (attachments.length > 0 ? "📎 File attached" : ""),
        timestamp: new Date().toISOString(),
        attachments:
          attachments.length > 0
            ? attachments.map((a) => ({ ...a, status: "selected" as const }))
            : undefined,
      };

      setMessages((prev) => [...prev, userMessage]);
      setIsTyping(true);

      let finalContentToBackend = content;
      let finalLabResults: any = null;

      // ── Process file uploads (mock) ─────────────────
      if (attachments.length > 0) {
        // Simulate upload → processing → result for each file
        for (const att of attachments) {
          // Mark as uploading
          setMessages((prev) =>
            prev.map((m) =>
              m.id === userMessage.id
                ? {
                    ...m,
                    attachments: m.attachments?.map((a) =>
                      a.id === att.id ? { ...a, status: "uploading" as const } : a
                    ),
                  }
                : m
            )
          );
          await new Promise((r) => setTimeout(r, 800));

          // Mark as processing
          setMessages((prev) =>
            prev.map((m) =>
              m.id === userMessage.id
                ? {
                    ...m,
                    attachments: m.attachments?.map((a) =>
                      a.id === att.id
                        ? { ...a, status: "processing" as const }
                        : a
                    ),
                  }
                : m
            )
          );

          try {
            const result = await uploadFileForOCR(att.file);
            
            // Pass OCR data properly as an object to the backend instead of string
            if (result.ocrResult) {
              if (result.ocrResult.structured_data && Object.keys(result.ocrResult.structured_data).length > 0) {
                finalLabResults = result.ocrResult.structured_data;
              } else {
                finalLabResults = result.ocrResult;
              }
            }

            // Mark as success with OCR result
            setMessages((prev) =>
              prev.map((m) =>
                m.id === userMessage.id
                  ? {
                      ...m,
                      attachments: m.attachments?.map((a) =>
                        a.id === att.id
                          ? {
                              ...a,
                              status: "success" as const,
                              ocrResult: result.ocrResult,
                            }
                          : a
                      ),
                    }
                  : m
              )
            );
          } catch {
            // Mark as error
            setMessages((prev) =>
              prev.map((m) =>
                m.id === userMessage.id
                  ? {
                      ...m,
                      attachments: m.attachments?.map((a) =>
                        a.id === att.id
                          ? {
                              ...a,
                              status: "error" as const,
                              errorMessage: "Upload failed. Please try again.",
                            }
                          : a
                      ),
                    }
                  : m
              )
            );
          }
        }
      }

      // ── Build chat history ──────────────────────────
      // Skip welcome message and only take the last 6 messages to keep payload small
      const chatHistory = messages
        .filter(m => m.id !== "welcome-1")
        .slice(-6)
        .map(m => ({
          role: m.role,
          content: m.content
        }));

      // ── Generate assistant response ─────────────────
      try {
        // Check for severe symptom keywords to demo risk escalation
        const lower = finalContentToBackend.toLowerCase();
        const isSevere = lower.match(
          /\b(blurry vision|severe headache|seizure|convulsion|bleeding|unconscious)\b/
        );

        const response = isSevere
          ? await sendChatMessageWithEscalation(finalContentToBackend, chatHistory, finalLabResults)
          : await sendChatMessage(finalContentToBackend, chatHistory, finalLabResults);

        setMessages((prev) => [...prev, response]);
      } catch {
        setMessages((prev) => [
          ...prev,
          {
            id: `err-${Date.now()}`,
            role: "assistant",
            content:
              "[DEMO] Sorry, I encountered an error processing your message. In production, this would retry or show a proper error state.",
            timestamp: new Date().toISOString(),
          },
        ]);
      } finally {
        setIsTyping(false);
      }
    },
    [messages]
  );

  /* ── Suggestion Click ──────────────────────────────── */
  const handleSuggestion = useCallback(
    (text: string) => {
      handleSend(text, []);
    },
    [handleSend]
  );

  const hasUserMessages = messages.some((m) => m.role === "user");

  return (
    <main className="flex-1 flex flex-col overflow-hidden">
      {/* ── Chat Header Bar ───────────────────────────── */}
      <div className="flex-shrink-0 px-6 py-3 border-b border-glass-border/50 flex items-center justify-between animate-fade-in">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-brand flex items-center justify-center shadow-glow-brand">
            <Brain size={18} className="text-white" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-slate-100">
              Materna AI Chat
            </h1>
            <p className="text-[10px] text-slate-500 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-alert-green animate-pulse" />
              Powered by RAG Medical Guidelines
            </p>
          </div>
        </div>
        <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-glass-light border border-glass-border/50 text-[10px] text-slate-500">
          <Shield size={10} className="text-brand-400" aria-hidden="true" />
          Clinical Decision Support
        </div>
      </div>

      {/* ── Messages Area ─────────────────────────────── */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-4 md:px-6 py-6"
        role="list"
        aria-label="Chat messages"
        id="chat-messages"
      >
        <div className="max-w-3xl mx-auto space-y-6">
          {messages.map((msg) => (
            <ChatBubble key={msg.id} message={msg} />
          ))}

          {isTyping && <TypingIndicator />}

          {/* ── Suggestion Chips (show when no user messages yet) ── */}
          {!hasUserMessages && !isTyping && (
            <div className="animate-fade-in-up animation-delay-300 opacity-0 fill-mode-forwards">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles
                  size={14}
                  className="text-brand-400"
                  aria-hidden="true"
                />
                <p className="text-xs text-slate-500 font-medium">
                  Quick Questions
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    onClick={() => handleSuggestion(s)}
                    className={cn(
                      "px-3 py-2 rounded-xl text-xs font-medium",
                      "glass-subtle text-slate-300",
                      "hover:bg-glass-medium hover:text-slate-100 hover:border-brand-500/30",
                      "transition-all duration-200 active:scale-[0.98]"
                    )}
                  >
                    <MessageCircle
                      size={12}
                      className="inline mr-1.5 text-brand-400"
                      aria-hidden="true"
                    />
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div ref={bottomRef} aria-hidden="true" />
        </div>
      </div>

      {/* ── CDSS Disclaimer ───────────────────────────── */}
      <div className="flex-shrink-0 px-4 py-2 text-center">
        <p className="text-[10px] text-slate-600 max-w-2xl mx-auto leading-relaxed">
          <Shield
            size={10}
            className="inline mr-1 text-slate-600"
            aria-hidden="true"
          />
          Materna CDSS is an assistive clinical decision-support tool. It is{" "}
          <strong className="text-slate-500">not a substitute</strong> for
          professional medical advice, diagnosis, or treatment. Always consult
          your healthcare provider.
        </p>
      </div>

      {/* ── Input Area ────────────────────────────────── */}
      <div className="flex-shrink-0 p-4 pt-0">
        <div className="max-w-3xl mx-auto">
          <ChatInput onSend={handleSend} disabled={isTyping} />
        </div>
      </div>
    </main>
  );
}
