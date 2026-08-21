"use client";

import React, { useState } from "react";
import GlassCard from "@/components/ui/GlassCard";
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
import { cn } from "@/lib/utils";
import {
  Brain,
  Shield,
  MessageCircle,
  Activity,
  Eye,
  Stethoscope,
  BarChart3,
  Network,
  Zap,
  CheckCircle2,
  Clock,
  ArrowRight,
} from "lucide-react";

/* ─── Agent Definitions ──────────────────────────────── */
interface Agent {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  status: "online" | "idle" | "processing";
  lastRun: string;
  totalCalls: number;
  avgLatency: string;
}

const AGENTS: Agent[] = [
  {
    id: "supervisor",
    name: "Supervisor Agent",
    description: "Orchestrates all sub-agents. Routes queries to the correct specialist based on context analysis.",
    icon: <Network size={24} />,
    color: "brand",
    status: "online",
    lastRun: "2 min ago",
    totalCalls: 1250,
    avgLatency: "120ms",
  },
  {
    id: "triage",
    name: "Clinical Triage Agent",
    description: "Evaluates patient symptoms against evidence-based clinical rules. Deterministic risk scoring.",
    icon: <Shield size={24} />,
    color: "red",
    status: "online",
    lastRun: "5 min ago",
    totalCalls: 890,
    avgLatency: "85ms",
  },
  {
    id: "timeline",
    name: "Longitudinal Timeline Agent",
    description: "Analyzes multi-day trends across vitals, weight, and symptoms. Detects gradual deterioration.",
    icon: <Activity size={24} />,
    color: "yellow",
    status: "idle",
    lastRun: "30 min ago",
    totalCalls: 420,
    avgLatency: "340ms",
  },
  {
    id: "medical_rag",
    name: "Medical RAG Agent",
    description: "Retrieves evidence from WHO, ACOG, and NICE clinical guidelines. Grounds all AI responses in citations.",
    icon: <Stethoscope size={24} />,
    color: "green",
    status: "online",
    lastRun: "1 min ago",
    totalCalls: 780,
    avgLatency: "450ms",
  },
  {
    id: "ocr",
    name: "Vision OCR Agent",
    description: "Extracts structured lab results from uploaded images and PDFs using Gemma Vision model.",
    icon: <Eye size={24} />,
    color: "violet",
    status: "idle",
    lastRun: "2 hrs ago",
    totalCalls: 120,
    avgLatency: "1200ms",
  },
  {
    id: "chatbot",
    name: "Empathetic Chatbot Agent",
    description: "Provides compassionate, safe responses to patient queries. Always includes CDSS disclaimers.",
    icon: <MessageCircle size={24} />,
    color: "brand",
    status: "online",
    lastRun: "Just now",
    totalCalls: 1500,
    avgLatency: "280ms",
  },
  {
    id: "dashboard_agent",
    name: "Dashboard Insight Agent",
    description: "Generates personalized health summaries and recommendations for the patient dashboard.",
    icon: <BarChart3 size={24} />,
    color: "green",
    status: "idle",
    lastRun: "1 hr ago",
    totalCalls: 200,
    avgLatency: "520ms",
  },
];

const statusConfig = {
  online: { label: "Online", color: "text-alert-green", dot: "bg-alert-green" },
  idle: { label: "Idle", color: "text-slate-500", dot: "bg-slate-500" },
  processing: { label: "Processing", color: "text-alert-yellow", dot: "bg-alert-yellow animate-pulse" },
};

/* ─── Recent Invocation Log ──────────────────────────── */
const RECENT_LOGS = [
  { time: "01:35 AM", agent: "Supervisor Agent", action: "Routed query to Medical RAG", status: "success" },
  { time: "01:33 AM", agent: "Medical RAG Agent", action: "Retrieved 3 ACOG guidelines", status: "success" },
  { time: "01:33 AM", agent: "Empathetic Chatbot", action: "Generated patient response", status: "success" },
  { time: "01:30 AM", agent: "Clinical Triage", action: "Evaluated vitals: LOW risk", status: "success" },
  { time: "01:25 AM", agent: "Timeline Agent", action: "Analyzed 7-day BP trend", status: "success" },
  { time: "01:20 AM", agent: "Vision OCR", action: "Processed lab image (CBC)", status: "success" },
  { time: "01:15 AM", agent: "Supervisor Agent", action: "Escalated to Triage (severe headache)", status: "warning" },
  { time: "01:10 AM", agent: "Clinical Triage", action: "HIGH RISK: BP 165/108 + headache", status: "critical" },
];

/* ═══════════════════════════════════════════════════════
   AGENTS PAGE
   ═══════════════════════════════════════════════════════ */
export default function AgentsPage() {
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1 lg:ml-[var(--sidebar-width)]">
        <Header />
        <main className="p-6 max-w-7xl mx-auto">
          <div className="mb-8 animate-fade-in">
            <h1 className="text-3xl font-bold text-slate-100 mb-1">AI Agent Architecture</h1>
            <p className="text-slate-400">
              Multi-agent clinical decision support system powered by LangGraph.
            </p>
          </div>

          {/* ── System Status Bar ────────────────────── */}
          <GlassCard className="mb-6 animate-fade-in-up opacity-0 fill-mode-forwards">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-brand flex items-center justify-center shadow-glow-brand">
                  <Brain size={20} className="text-white" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-200">Materna Multi-Agent System</p>
                  <p className="text-xs text-slate-500">LangGraph Orchestration • 7 Agents Active</p>
                </div>
              </div>
              <div className="flex items-center gap-4 text-xs">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-alert-green animate-pulse" />
                  <span className="text-slate-400">System Healthy</span>
                </div>
                <div className="px-3 py-1 rounded-full bg-glass-light text-slate-400">
                  <Zap size={12} className="inline mr-1" />
                  5,160 total invocations
                </div>
              </div>
            </div>
          </GlassCard>

          {/* ── Agent Cards Grid ─────────────────────── */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-8">
            {AGENTS.map((agent, i) => {
              const st = statusConfig[agent.status];
              return (
                <GlassCard
                  key={agent.id}
                  hover
                  className={cn(
                    "animate-fade-in-up opacity-0 fill-mode-forwards cursor-pointer group",
                    `animation-delay-${(i + 1) * 100}`,
                    selectedAgent?.id === agent.id && "border-brand-500/30 bg-brand-500/5",
                  )}
                  padding="md"
                >
                  <button onClick={() => setSelectedAgent(agent)} className="w-full text-left">
                    <div className="flex items-start justify-between mb-3">
                      <div className={cn(
                        "w-11 h-11 rounded-xl flex items-center justify-center transition-transform duration-300 group-hover:scale-110",
                        agent.color === "brand" && "bg-brand-500/15 text-brand-400",
                        agent.color === "green" && "bg-alert-green-bg text-alert-green",
                        agent.color === "yellow" && "bg-alert-yellow-bg text-alert-yellow",
                        agent.color === "red" && "bg-alert-red-bg text-alert-red",
                        agent.color === "violet" && "bg-purple-500/15 text-purple-400",
                      )}>
                        {agent.icon}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className={cn("w-1.5 h-1.5 rounded-full", st.dot)} />
                        <span className={cn("text-[10px] font-medium", st.color)}>{st.label}</span>
                      </div>
                    </div>
                    <h3 className="text-sm font-semibold text-slate-200 mb-1 group-hover:text-brand-400 transition-colors">
                      {agent.name}
                    </h3>
                    <p className="text-xs text-slate-500 leading-relaxed line-clamp-2">
                      {agent.description}
                    </p>
                    <div className="flex items-center gap-3 mt-3 pt-3 border-t border-glass-border/50 text-[10px] text-slate-500">
                      <span>{agent.totalCalls} calls</span>
                      <span>•</span>
                      <span>{agent.avgLatency} avg</span>
                      <span>•</span>
                      <span>{agent.lastRun}</span>
                    </div>
                  </button>
                </GlassCard>
              );
            })}
          </div>

          {/* ── Agent Activity Log ───────────────────── */}
          <GlassCard className="animate-fade-in-up opacity-0 fill-mode-forwards animation-delay-500">
            <h3 className="text-sm font-semibold text-slate-300 mb-4 flex items-center gap-2">
              <Clock size={16} className="text-brand-400" />
              Recent Agent Invocations
            </h3>
            <div className="space-y-2">
              {RECENT_LOGS.map((log, i) => (
                <div key={i} className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-glass-light transition-colors text-sm">
                  <span className="text-xs text-slate-600 w-16 flex-shrink-0">{log.time}</span>
                  <span className={cn(
                    "w-1.5 h-1.5 rounded-full flex-shrink-0",
                    log.status === "success" && "bg-alert-green",
                    log.status === "warning" && "bg-alert-yellow",
                    log.status === "critical" && "bg-alert-red animate-pulse",
                  )} />
                  <span className="text-slate-400 font-medium w-40 flex-shrink-0 truncate">{log.agent}</span>
                  <span className="text-slate-300 flex-1 truncate">{log.action}</span>
                </div>
              ))}
            </div>
          </GlassCard>
        </main>
      </div>
    </div>
  );
}
