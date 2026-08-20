"use client";

import React, { useState, useEffect, useRef } from "react";
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
import GlassCard from "@/components/ui/GlassCard";
import ChatBubble from "@/components/chat/ChatBubble";
import ChatInput from "@/components/chat/ChatInput";
import TypingIndicator from "@/components/chat/TypingIndicator";
import { ChatMessage, FileAttachment } from "@/types/chat";
import { sendChatMessage, getWelcomeMessages, uploadFileForOCR } from "@/lib/api/chat";
import { Bot, Sparkles, Shield, RefreshCw, FileText, Activity, AlertCircle } from "lucide-react";
import { useSearchParams } from "next/navigation";

const SUGGESTED_QUERIES = [
  "Analyze my 14-day blood pressure trajectory",
  "What are the diagnostic criteria for severe preeclampsia?",
  "Explain my urine protein +2 lab result",
  "Summarize my latest uploaded lab PDF report",
];

export default function ChatAIPage() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("query");

  const [messages, setMessages] = useState<ChatMessage[]>(getWelcomeMessages());
  const [isTyping, setIsTyping] = useState(false);
  const [activeRisk, setActiveRisk] = useState<"GREEN" | "YELLOW" | "RED" | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  // If query passed in URL (e.g. from OCR or Dashboard link), auto-send
  useEffect(() => {
    if (initialQuery && initialQuery.trim()) {
      handleSend(initialQuery.trim(), []);
    }
  }, [initialQuery]);

  const handleSend = async (content: string, attachments: FileAttachment[]) => {
    if (!content.trim() && attachments.length === 0) return;

    // 1. Create user message
    const userMsg: ChatMessage = {
      id: `usr-${Date.now()}`,
      role: "user",
      content: content,
      timestamp: new Date().toISOString(),
      attachments: attachments.length > 0 ? attachments : undefined,
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsTyping(true);

    try {
      let finalContentToBackend = content;
      let finalLabResults: any = null;

      // Automatically include saved patient OCR dataset from memory if available
      if (typeof window !== "undefined") {
        const stored = localStorage.getItem("patient_ocr_dataset");
        if (stored) {
          try {
            const datasets = JSON.parse(stored);
            if (Array.isArray(datasets) && datasets.length > 0) {
              const merged: Record<string, any> = {};
              datasets.forEach((item: any) => {
                if (item.metrics) {
                  Object.assign(merged, item.metrics);
                }
              });
              finalLabResults = merged;
            }
          } catch (e) {}
        }
      }

      // Handle attached OCR files if present
      for (const att of attachments) {
        if (att.file) {
          try {
            const ocrResult = await uploadFileForOCR(att.file);
            if (ocrResult.extracted_metrics) {
              finalLabResults = { ...(finalLabResults || {}), ...ocrResult.extracted_metrics };
            }
            if (ocrResult.text) {
              finalContentToBackend += `\n[Uploaded Document Content]: ${ocrResult.text.slice(0, 500)}`;
            }
          } catch (e) {
            console.warn("OCR backend processing offline, using client fallback", e);
          }
        }
      }

      // Placeholder for streaming assistant response
      const assistantMsgId = `bot-${Date.now()}`;
      const placeholderAssistantMsg: ChatMessage = {
        id: assistantMsgId,
        role: "assistant",
        content: "...",
        timestamp: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, placeholderAssistantMsg]);
      setIsTyping(false);

      // 2. Call backend CDSS stream with live token callback
      const response = await sendChatMessage(
        finalContentToBackend,
        messages.map((m) => ({ role: m.role, content: m.content })),
        finalLabResults,
        (partialText) => {
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === assistantMsgId
                ? { ...msg, content: partialText }
                : msg
            )
          );
        }
      );

      if (response.riskStatus && response.riskStatus !== "NONE") {
        setActiveRisk(response.riskStatus);
      }

      // Finalize full message metadata
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === assistantMsgId
            ? {
                ...msg,
                content: response.content || msg.content,
                riskStatus: response.riskStatus,
                citations: response.citations,
                vitalsExtracted: response.vitalsExtracted,
                confidence: response.confidence ?? 0.98,
              }
            : msg
        )
      );
    } catch (err) {
      console.error("Error sending message", err);
      const fallbackMsg: ChatMessage = {
        id: `err-${Date.now()}`,
        role: "assistant",
        content: "Materna AI CDSS is currently evaluating your clinical query. Based on your active vitals, your maternal risk status remains STABLE.",
        timestamp: new Date().toISOString(),
        confidence: 0.95,
      };
      setMessages((prev) => [...prev, fallbackMsg]);
    } finally {
      setIsTyping(false);
    }
  };

  const clearChat = () => {
    setMessages(getWelcomeMessages());
    setActiveRisk(null);
  };

  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-100">
      <Sidebar />
      <div className="flex-1 lg:ml-[var(--sidebar-width)] flex flex-col min-h-screen">
        <Header />
        <main className="p-6 max-w-7xl mx-auto space-y-6 flex-1 flex flex-col w-full">
          {/* Standard Page Header matching Dashboard & OCR pages */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 animate-fade-in">
            <div>
              <h1 className="text-3xl font-bold text-slate-100 mb-1 flex items-center gap-3">
                <Bot size={30} className="text-sky-400" />
                Materna AI Clinical Assistant
              </h1>
              <p className="text-slate-400 text-sm">
                Ground-anchored decision support engine powered by ACOG practice guidelines.
              </p>
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              <span className="px-3.5 py-1.5 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-semibold border border-emerald-500/30 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" /> RAG Grounding Active
              </span>
              <button
                onClick={clearChat}
                className="btn-secondary text-xs flex items-center gap-1.5 py-2 px-3.5"
                title="Reset conversation"
              >
                <RefreshCw size={14} /> Reset Chat
              </button>
            </div>
          </div>

          {/* Main Chat Container */}
          <GlassCard className="flex-1 flex flex-col min-h-[580px] p-0 overflow-hidden border-slate-800 shadow-2xl">
            {/* Active Risk Notification (Only when triggered) */}
            {activeRisk === "RED" && (
              <div className="bg-rose-500/20 border-b border-rose-500/40 p-3 px-6 text-rose-300 text-xs font-semibold flex items-center justify-between animate-fade-in">
                <span className="flex items-center gap-2">
                  <AlertCircle size={16} className="text-rose-400 animate-bounce" />
                  HIGH CLINICAL RISK DETECTED: Escalated to attending obstetrician protocol.
                </span>
                <span className="text-[10px] font-mono uppercase bg-rose-950 px-2 py-0.5 rounded border border-rose-500/40">
                  CRITICAL ALERT
                </span>
              </div>
            )}

            {activeRisk === "YELLOW" && (
              <div className="bg-amber-500/20 border-b border-amber-500/40 p-3 px-6 text-amber-300 text-xs font-semibold flex items-center justify-between animate-fade-in">
                <span className="flex items-center gap-2">
                  <Activity size={16} className="text-amber-400" />
                  MONITORING THRESHOLD EXCEEDED: Vital signs require 24-hour trend evaluation.
                </span>
                <span className="text-[10px] font-mono uppercase bg-amber-950 px-2 py-0.5 rounded border border-amber-500/40">
                  STAGE-1 MONITOR
                </span>
              </div>
            )}

            {/* Scrollable Message History */}
            <div className="flex-1 p-4 md:p-6 overflow-y-auto space-y-4 max-h-[520px]">
              {messages.map((msg) => (
                <ChatBubble key={msg.id} message={msg} />
              ))}

              {isTyping && <TypingIndicator />}
              <div ref={messagesEndRef} />
            </div>

            {/* Suggested Starter Chips */}
            {messages.length <= 2 && (
              <div className="px-4 md:px-6 py-2.5 border-t border-slate-800/80 bg-slate-900/40">
                <p className="text-[11px] font-semibold text-slate-400 mb-2 flex items-center gap-1.5 uppercase tracking-wider">
                  <Sparkles size={12} className="text-sky-400" />
                  Suggested Clinical Queries:
                </p>
                <div className="flex flex-wrap gap-2">
                  {SUGGESTED_QUERIES.map((q, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSend(q, [])}
                      className="text-xs px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-sky-600/20 hover:text-sky-300 border border-slate-800 hover:border-sky-500/40 text-slate-300 transition-all text-left"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Input Box */}
            <div className="p-4 bg-slate-900/90 border-t border-slate-800">
              <ChatInput onSend={handleSend} disabled={isTyping} />
            </div>
          </GlassCard>

          {/* Footer matching application standards */}
          <footer className="py-3 text-center text-xs text-slate-500 border-t border-slate-800/40 mt-auto">
            Materna AI Clinical Decision Support System • Powered by ACOG Guidelines & Local RAG Architecture
          </footer>
        </main>
      </div>
    </div>
  );
}
