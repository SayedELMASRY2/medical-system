"use client";

import React, { useState } from "react";
import GlassCard from "@/components/ui/GlassCard";
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
import { cn } from "@/lib/utils";
import {
  Coins,
  DollarSign,
  TrendingUp,
  Cpu,
  BarChart2,
  ArrowLeft,
  PieChart as PieIcon,
  Calendar,
  Zap,
} from "lucide-react";
import Link from "next/link";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

/* ─── Mock Data ────────────────────────────────────── */
const MOCK_DAILY_USAGE = [
  { date: "Aug 14", tokens: 150000, cost: 0.55 },
  { date: "Aug 15", tokens: 180000, cost: 0.68 },
  { date: "Aug 16", tokens: 200000, cost: 0.75 },
  { date: "Aug 17", tokens: 160000, cost: 0.60 },
  { date: "Aug 18", tokens: 220000, cost: 0.82 },
  { date: "Aug 19", tokens: 190000, cost: 0.72 },
  { date: "Aug 20", tokens: 150000, cost: 0.63 },
];

const MOCK_MODEL_BREAKDOWN = [
  { name: "Qwen 2.5 72B", value: 800000, cost: 2.40, color: "#06b6d4" },
  { name: "Gemma 3 27B IT (Vision)", value: 350000, cost: 1.75, color: "#8b5cf6" },
  { name: "Cohere Embed v3", value: 100000, cost: 0.60, color: "#ec4899" },
];

const MOCK_TOP_USERS = [
  { name: "Admin System", role: "ADMIN", tokens: 142000, cost: "$2.13", calls: 410 },
  { name: "Dr. Hassan Omar", role: "DOCTOR", tokens: 89500, cost: "$1.34", calls: 245 },
  { name: "Nour Khalil", role: "MIDWIFE", tokens: 34100, cost: "$0.51", calls: 98 },
  { name: "Sarah Ahmed", role: "PATIENT", tokens: 14200, cost: "$0.21", calls: 42 },
  { name: "Fatima Said", role: "PATIENT", tokens: 8400, cost: "$0.13", calls: 28 },
];

export default function TokenUsagePage() {
  const totalTokens = 1250000;
  const totalCost = 4.75;

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1 lg:ml-[var(--sidebar-width)]">
        <Header />
        <main className="p-6 max-w-7xl mx-auto">
          {/* Top Bar */}
          <div className="flex items-center justify-between mb-8 animate-fade-in">
            <div>
              <Link href="/admin" className="text-xs text-brand-400 flex items-center gap-1 mb-2 hover:underline">
                <ArrowLeft size={14} /> Back to Admin Panel
              </Link>
              <h1 className="text-3xl font-bold text-slate-100 mb-1 flex items-center gap-3">
                <Coins size={28} className="text-alert-yellow" />
                API Token Usage & Cost Analytics
              </h1>
              <p className="text-slate-400">
                Track LLM token consumption, operational costs, and per-model performance.
              </p>
            </div>
          </div>

          {/* Stat Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <GlassCard hover className="animate-fade-in-up">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-slate-400">Total Tokens Consumed</span>
                <Coins size={22} className="text-alert-yellow" />
              </div>
              <p className="text-3xl font-bold text-slate-100">{(totalTokens / 1000000).toFixed(2)}M</p>
              <p className="text-xs text-slate-500 mt-1">1,250,000 exact tokens</p>
            </GlassCard>

            <GlassCard hover className="animate-fade-in-up animation-delay-100">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-slate-400">Total Operational Cost</span>
                <DollarSign size={22} className="text-alert-green" />
              </div>
              <p className="text-3xl font-bold text-slate-100">${totalCost.toFixed(2)}</p>
              <p className="text-xs text-alert-green mt-1">Avg ~$0.67 / day</p>
            </GlassCard>

            <GlassCard hover className="animate-fade-in-up animation-delay-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-slate-400">Active LLM Providers</span>
                <Cpu size={22} className="text-brand-400" />
              </div>
              <p className="text-3xl font-bold text-slate-100">3 Models</p>
              <p className="text-xs text-slate-500 mt-1">OpenRouter & Vision API</p>
            </GlassCard>
          </div>

          {/* Charts Row */}
          <div className="grid lg:grid-cols-2 gap-6 mb-8">
            {/* Daily Consumption Chart */}
            <GlassCard className="animate-fade-in-up opacity-0 fill-mode-forwards animation-delay-300">
              <h3 className="text-sm font-semibold text-slate-300 mb-4 flex items-center gap-2">
                <BarChart2 size={16} className="text-brand-400" />
                7-Day Daily Token Consumption
              </h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={MOCK_DAILY_USAGE}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="date" tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} />
                    <Tooltip
                      contentStyle={{ backgroundColor: "#0f172a", borderColor: "rgba(255,255,255,0.1)", borderRadius: "12px" }}
                      itemStyle={{ color: "#22d3ee" }}
                    />
                    <Bar dataKey="tokens" fill="#06b6d4" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </GlassCard>

            {/* Model Distribution Pie Chart */}
            <GlassCard className="animate-fade-in-up opacity-0 fill-mode-forwards animation-delay-400">
              <h3 className="text-sm font-semibold text-slate-300 mb-4 flex items-center gap-2">
                <PieIcon size={16} className="text-purple-400" />
                Token Distribution by Model
              </h3>
              <div className="h-64 flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={MOCK_MODEL_BREAKDOWN}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {MOCK_MODEL_BREAKDOWN.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ backgroundColor: "#0f172a", borderColor: "rgba(255,255,255,0.1)", borderRadius: "12px" }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex justify-center gap-4 text-xs mt-2">
                {MOCK_MODEL_BREAKDOWN.map((m) => (
                  <div key={m.name} className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: m.color }} />
                    <span className="text-slate-400">{m.name} ({m.cost.toFixed(2)}$)</span>
                  </div>
                ))}
              </div>
            </GlassCard>
          </div>

          {/* User Consumption Breakdown */}
          <GlassCard className="animate-fade-in-up">
            <h3 className="text-sm font-semibold text-slate-300 mb-4 flex items-center gap-2">
              <Zap size={16} className="text-alert-yellow" />
              Token Usage per User
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-glass-border text-xs uppercase text-slate-500 tracking-wider">
                    <th className="py-3 px-4">User</th>
                    <th className="py-3 px-4">Role</th>
                    <th className="py-3 px-4">Tokens Consumed</th>
                    <th className="py-3 px-4">Estimated Cost</th>
                    <th className="py-3 px-4">API Calls</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-glass-border/40 text-sm">
                  {MOCK_TOP_USERS.map((user, i) => (
                    <tr key={i} className="hover:bg-glass/30 transition-colors">
                      <td className="py-3.5 px-4 font-medium text-slate-200">{user.name}</td>
                      <td className="py-3.5 px-4 text-xs text-slate-400">{user.role}</td>
                      <td className="py-3.5 px-4 font-mono text-xs text-brand-300">
                        {user.tokens.toLocaleString()}
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-alert-green text-xs">{user.cost}</td>
                      <td className="py-3.5 px-4 text-slate-400 text-xs">{user.calls} calls</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </GlassCard>
        </main>
      </div>
    </div>
  );
}
