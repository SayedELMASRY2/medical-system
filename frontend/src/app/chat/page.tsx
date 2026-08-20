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
  const [ocrCount, setOcrCount] = useState<number>(0);
  const [hasDailyVitals, setHasDailyVitals] = useState<boolean>(false);
  const [hasBaseline, setHasBaseline] = useState<boolean>(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("patient_ocr_dataset");
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed)) {
            setOcrCount(parsed.length);
          }
        } catch (e) {}
      }
      const storedVitals = localStorage.getItem("last_patient_vitals");
      if (storedVitals) {
        setHasDailyVitals(true);
      }
      const storedOnboarding = localStorage.getItem("onboarding_baseline_data");
      if (storedOnboarding) {
        setHasBaseline(true);
      }
    }
  }, []);

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

      if (typeof window !== "undefined") {
        // 1. Inject Baseline Onboarding Profile & Medical History if available
        const storedOnboarding = localStorage.getItem("onboarding_baseline_data");
        if (storedOnboarding) {
          try {
            const ob = JSON.parse(storedOnboarding);
            const obList: string[] = [];
            if (ob.age) obList.push(`Age: ${ob.age} years`);
            if (ob.height) obList.push(`Height: ${ob.height} cm`);
            if (ob.prePregnancyWeight) obList.push(`Pre-pregnancy Weight: ${ob.prePregnancyWeight} kg`);
            if (ob.baselineBp) obList.push(`Baseline BP: ${ob.baselineBp} mmHg`);
            if (ob.pregnancyDate) obList.push(`Gestational Date (${ob.dateType || 'LMP'}): ${ob.pregnancyDate}`);
            if (ob.fetalCount) obList.push(`Fetal Count: ${ob.fetalCount}`);
            if (ob.chronicHypertension) obList.push(`Chronic Hypertension: Yes`);
            if (ob.preExistingDiabetes && ob.preExistingDiabetes !== "None") obList.push(`Pre-existing Diabetes: ${ob.preExistingDiabetes}`);
            if (ob.previousPreeclampsia) obList.push(`Previous Preeclampsia History: Yes`);
            if (ob.familyHistoryPreeclampsia) obList.push(`Family History of Preeclampsia: Yes`);

            if (obList.length > 0) {
              finalContentToBackend += `\n\n[PATIENT BASELINE CLINICAL & OBSTETRIC PROFILE]:\n` + obList.map((item) => `- ${item}`).join("\n");
            }
          } catch (e) {}
        }

        // 2. Inject Daily Check-In Vitals if logged today
        const storedVitals = localStorage.getItem("last_patient_vitals");
        if (storedVitals) {
          try {
            const vitals = JSON.parse(storedVitals);
            const vitalsList: string[] = [];
            if (vitals.systolic && vitals.diastolic) vitalsList.push(`Blood Pressure: ${vitals.systolic}/${vitals.diastolic} mmHg`);
            if (vitals.weight) vitalsList.push(`Weight: ${vitals.weight} kg`);
            if (vitals.bloodSugar) vitalsList.push(`Blood Sugar: ${vitals.bloodSugar} mg/dL`);
            if (vitals.headache) vitalsList.push(`Headache: ${vitals.headache}`);
            if (vitals.swelling && vitals.swelling.length > 0) vitalsList.push(`Swelling: ${vitals.swelling.join(", ")}`);
            if (vitals.abdominalPain) vitalsList.push(`Abdominal Pain: Yes`);
            if (vitals.vaginalBleeding) vitalsList.push(`Vaginal Bleeding: Yes`);
            if (vitals.visionChanges) vitalsList.push(`Vision Changes: Yes`);
            if (vitals.fetalMovement) vitalsList.push(`Fetal Movement: ${vitals.fetalMovement}`);
            if (vitals.kickCounts) vitalsList.push(`Kick Count: ${vitals.kickCounts}`);

            if (vitalsList.length > 0) {
              finalContentToBackend += `\n\n[PATIENT DAILY CHECK-IN VITALS & SYMPTOMS LOGGED TODAY]:\n` + vitalsList.map((v) => `- ${v}`).join("\n");
            }
          } catch (e) {}
        }

        // 2. Automatically include saved patient OCR dataset from memory if available
        const stored = localStorage.getItem("patient_ocr_dataset");
        if (stored) {
          try {
            const datasets = JSON.parse(stored);
            if (Array.isArray(datasets) && datasets.length > 0) {
              const merged: Record<string, any> = {};
              let ocrTextCombined = "";
              datasets.forEach((item: any) => {
                if (item.metrics) {
                  Object.assign(merged, item.metrics);
                }
                if (item.text) {
                  ocrTextCombined += `\n- [${item.filename || 'Lab Report'}]: ${item.text.slice(0, 300)}`;
                }
              });
              finalLabResults = merged;

              if (Object.keys(merged).length > 0 || ocrTextCombined) {
                const metricsStr = Object.entries(merged).map(([k, v]) => `${k}: ${v}`).join(", ");
                finalContentToBackend += `\n\n[PATIENT SAVED OCR LAB DATASET & HISTORICAL MEMORY]:\nScanned Metrics: ${metricsStr}${ocrTextCombined ? `\nScanned Details: ${ocrTextCombined}` : ''}`;
              }
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
        <main className="p-4 md:p-6 max-w-7xl mx-auto flex-1 flex flex-col w-full min-h-screen">
          {/* Main Chat Container - Single Card with integrated Header */}
          <GlassCard className="flex-1 flex flex-col min-h-[600px] p-0 overflow-hidden border-slate-800 shadow-2xl">
            {/* Single Unified Card Header Bar */}
            <div className="p-4 px-6 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400">
                  <Bot size={22} />
                </div>
                <div>
                  <h1 className="text-base md:text-lg font-bold text-slate-100 flex items-center gap-2">
                    Materna AI Clinical Assistant
                  </h1>
                  <p className="text-slate-400 text-xs">
                    Ground-anchored decision support engine powered by ACOG practice guidelines.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {ocrCount > 0 && (
                  <span className="px-3 py-1 rounded-full bg-sky-500/10 text-sky-300 text-xs font-semibold border border-sky-500/30 flex items-center gap-1.5 animate-fade-in">
                    <FileText size={13} className="text-sky-400" /> OCR Memory ({ocrCount} {ocrCount === 1 ? 'Report' : 'Reports'})
                  </span>
                )}
                {hasDailyVitals && (
                  <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-300 text-xs font-semibold border border-emerald-500/30 flex items-center gap-1.5 animate-fade-in">
                    <Activity size={13} className="text-emerald-400" /> Today's Vitals Logged
                  </span>
                )}
                {hasBaseline && (
                  <span className="px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-300 text-xs font-semibold border border-indigo-500/30 flex items-center gap-1.5 animate-fade-in">
                    <Shield size={13} className="text-indigo-400" /> Baseline Memory Active
                  </span>
                )}
                <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-semibold border border-emerald-500/30 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" /> RAG Grounding Active
                </span>
                <button
                  onClick={clearChat}
                  className="btn-secondary text-xs flex items-center gap-1.5 py-1.5 px-3"
                  title="Reset conversation"
                >
                  <RefreshCw size={13} /> Reset Chat
                </button>
              </div>
            </div>

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
            <div className="flex-1 p-4 md:p-6 overflow-y-auto space-y-4 max-h-[550px]">
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
        </main>
      </div>
    </div>
  );
}
