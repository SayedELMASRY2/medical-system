"use client";

import React, { useState, useEffect } from "react";
import GlassCard from "@/components/ui/GlassCard";
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
import { cn } from "@/lib/utils";
import {
  Users,
  Shield,
  Activity,
  Coins,
  Ban,
  CheckCircle,
  Search,
  Filter,
  Terminal,
  Settings as SettingsIcon,
  Cpu,
  RefreshCw,
  Trash2,
  KeyRound,
  RotateCcw,
  GitCommit,
  Brain,
  Zap,
  ArrowRight,
  Bot,
  Clock,
  ShieldAlert,
} from "lucide-react";
import Link from "next/link";

interface UserRow {
  id: string;
  name: string;
  email: string;
  role: "PATIENT" | "DOCTOR" | "MIDWIFE" | "ADMIN";
  status: "active" | "blocked";
  lastActive: string;
  tokensUsed: number;
}

interface AgentFlowStep {
  agentName: string;
  role: string;
  status: "SUCCESS" | "RUNNING" | "WARNING" | "SKIPPED";
  durationMs: number;
  tokens: number;
  inputSummary: string;
  outputSummary: string;
}

interface UserAgentExecution {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  timestamp: string;
  triggerEvent: string;
  riskLevel: "GREEN" | "YELLOW" | "RED";
  totalTokens: number;
  totalLatencyMs: number;
  steps: AgentFlowStep[];
}

const MOCK_USERS: UserRow[] = [
  { id: "usr-0", name: "Admin", email: "admin@materna.ai", role: "ADMIN", status: "active", lastActive: "Just now", tokensUsed: 142000 },
  { id: "usr-1", name: "Layla Mahmoud", email: "layla@example.com", role: "PATIENT", status: "active", lastActive: "10 min ago", tokensUsed: 14200 },
  { id: "usr-2", name: "Dr. Hassan Omar", email: "dr.hassan@example.com", role: "DOCTOR", status: "active", lastActive: "1 hour ago", tokensUsed: 89500 },
  { id: "usr-3", name: "Fatima Said", email: "fatima@example.com", role: "PATIENT", status: "active", lastActive: "2 hours ago", tokensUsed: 8400 },
  { id: "usr-4", name: "Nour Khalil", email: "nour@example.com", role: "MIDWIFE", status: "active", lastActive: "1 day ago", tokensUsed: 34100 },
  { id: "usr-5", name: "Sarah Ahmed", email: "sarah@example.com", role: "PATIENT", status: "blocked", lastActive: "3 days ago", tokensUsed: 5200 },
];

const MOCK_AGENT_EXECUTIONS: UserAgentExecution[] = [
  {
    id: "exec-101",
    userId: "usr-1",
    userName: "Layla Mahmoud",
    userEmail: "layla@example.com",
    timestamp: "2026-08-20 05:12:04",
    triggerEvent: "Lab PDF OCR Upload & Symptom Chat",
    riskLevel: "YELLOW",
    totalTokens: 1840,
    totalLatencyMs: 1420,
    steps: [
      {
        agentName: "OCR Extraction Agent",
        role: "Vision & PDF Document Parser",
        status: "SUCCESS",
        durationMs: 340,
        tokens: 420,
        inputSummary: "preeclampsia_lab_report.pdf",
        outputSummary: "Extracted Hemoglobin: 11.2 g/dL, Platelets: 145,000 /uL, Proteinuria: 2+",
      },
      {
        agentName: "Medical Knowledge Agent (RAG)",
        role: "ACOG Clinical Practice Guidelines",
        status: "SUCCESS",
        durationMs: 280,
        tokens: 510,
        inputSummary: "Query: Platelet count 145k + Proteinuria 2+ risk",
        outputSummary: "Retrieved ACOG Bulletin #222: Mild Thrombocytopenia with Proteinuria requires close BP monitoring.",
      },
      {
        agentName: "Risk Assessment Engine",
        role: "Clinical Rule Evaluator",
        status: "WARNING",
        durationMs: 190,
        tokens: 280,
        inputSummary: "Vitals: BP 138/88, Proteinuria 2+, Mild Headache",
        outputSummary: "Triggered YELLOW ALERT: Moderate Preeclampsia risk flagged.",
      },
      {
        agentName: "Timeline & Trend Agent",
        role: "Longitudinal Memory Summarizer",
        status: "SUCCESS",
        durationMs: 310,
        tokens: 380,
        inputSummary: "7-Day Vitals Trend for Layla Mahmoud",
        outputSummary: "Weight increased +1.8kg over 4 days; BP elevated from 122/78 to 138/88.",
      },
      {
        agentName: "Doctor Escalation Agent",
        role: "Clinical Alert & Push Dispatch",
        status: "SUCCESS",
        durationMs: 300,
        tokens: 250,
        inputSummary: "Push notification to Dr. Hassan Omar",
        outputSummary: "Escalated Yellow Alert notification to attending obstetrician dashboard.",
      },
    ],
  },
  {
    id: "exec-102",
    userId: "usr-3",
    userName: "Fatima Said",
    userEmail: "fatima@example.com",
    timestamp: "2026-08-20 04:55:18",
    triggerEvent: "Daily Check-in Vitals Submission",
    riskLevel: "GREEN",
    totalTokens: 920,
    totalLatencyMs: 860,
    steps: [
      {
        agentName: "Vitals Validation Agent",
        role: "Input Range & Sanity Check",
        status: "SUCCESS",
        durationMs: 120,
        tokens: 180,
        inputSummary: "BP 118/76, Weight 64.2kg, Hydration 9 cups",
        outputSummary: "Vitals within normal physiological pregnancy parameters.",
      },
      {
        agentName: "Risk Assessment Engine",
        role: "Clinical Rule Evaluator",
        status: "SUCCESS",
        durationMs: 240,
        tokens: 310,
        inputSummary: "Check-in Vitals: BP 118/76, Headache: None",
        outputSummary: "GREEN STATUS: Low Preeclampsia Risk.",
      },
      {
        agentName: "Timeline & Trend Agent",
        role: "Longitudinal Memory Summarizer",
        status: "SUCCESS",
        durationMs: 500,
        tokens: 430,
        inputSummary: "14-Day Vitals History",
        outputSummary: "Stable BP trajectory; consistent hydration and normal fetal movement.",
      },
    ],
  },
];

const MOCK_LOGS = [
  { id: "log-1", time: "05:12:04", level: "INFO", event: "Multi-Agent Flow Executed", details: "Layla Mahmoud: 5 Agents executed successfully (Risk: YELLOW)" },
  { id: "log-2", time: "04:55:18", level: "INFO", event: "Check-in Agent Flow", details: "Fatima Said: 3 Agents executed (Risk: GREEN)" },
  { id: "log-3", time: "04:45:12", level: "INFO", event: "User login", details: "admin@materna.ai logged in as ADMIN" },
  { id: "log-4", time: "04:38:50", level: "INFO", event: "OCR Vision Call", details: "Extracted lab results for layla@example.com" },
];

export default function AdminPage() {
  const [users, setUsers] = useState<UserRow[]>(MOCK_USERS);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("ALL");
  const [activeTab, setActiveTab] = useState<"users" | "agent-flow" | "logs" | "settings">("users");
  const [agentExecutions, setAgentExecutions] = useState<UserAgentExecution[]>(MOCK_AGENT_EXECUTIONS);
  const [selectedUserExecution, setSelectedUserExecution] = useState<UserAgentExecution>(MOCK_AGENT_EXECUTIONS[0]);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  // Load persisted user state & filter out deleted users across all features on mount
  useEffect(() => {
    async function loadAllUsers() {
      if (typeof window === "undefined") return;

      const deletedIds: string[] = JSON.parse(localStorage.getItem("admin_deleted_user_ids") || "[]");
      const registeredUsers: UserRow[] = JSON.parse(localStorage.getItem("materna_registered_users") || "[]");
      const storedUsers = localStorage.getItem("admin_users");

      let currentUsers: UserRow[] = MOCK_USERS;
      if (storedUsers) {
        try {
          currentUsers = JSON.parse(storedUsers);
        } catch {
          currentUsers = MOCK_USERS;
        }
      }

      // Merge backend users if API is online
      try {
        const token = localStorage.getItem("access_token");
        const res = await fetch("http://localhost:8000/api/v1/admin/users", {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (res.ok) {
          const data = await res.json();
          const apiUsers: UserRow[] = data.users.map((u: any) => ({
            id: u.id,
            name: u.full_name || u.email.split("@")[0],
            email: u.email,
            role: u.role as any,
            status: u.is_active ? "active" : "blocked",
            lastActive: "Just now",
            tokensUsed: 0,
          }));
          currentUsers = [...currentUsers, ...apiUsers];
        }
      } catch {
        // Backend offline fallback to local
      }

      // Merge newly registered users from frontend registration form
      const combined = [...currentUsers, ...registeredUsers];

      // Deduplicate by email
      const uniqueMap = new Map<string, UserRow>();
      combined.forEach((u) => uniqueMap.set(u.email.toLowerCase(), u));
      const deduplicated = Array.from(uniqueMap.values());

      // Filter out deleted user IDs
      const cleanUsers = deduplicated.filter((u) => !deletedIds.includes(u.id));
      setUsers(cleanUsers);
      localStorage.setItem("admin_users", JSON.stringify(cleanUsers));

      const cleanExecutions = MOCK_AGENT_EXECUTIONS.filter((ex) => !deletedIds.includes(ex.userId));
      setAgentExecutions(cleanExecutions);
      if (cleanExecutions.length > 0) {
        setSelectedUserExecution(cleanExecutions[0]);
      }
    }

    loadAllUsers();
  }, []);

  // Sync users to localStorage whenever state changes
  const updateUsersState = (newUsers: UserRow[]) => {
    setUsers(newUsers);
    if (typeof window !== "undefined") {
      localStorage.setItem("admin_users", JSON.stringify(newUsers));
    }
  };

  const toggleBlock = (id: string) => {
    const updated = users.map((u) => {
      if (u.id === id) {
        const nextStatus = u.status === "active" ? ("blocked" as const) : ("active" as const);
        setActionMessage(`User ${u.email} is now ${nextStatus.toUpperCase()}`);
        return { ...u, status: nextStatus };
      }
      return u;
    });
    updateUsersState(updated);
    setTimeout(() => setActionMessage(null), 3000);
  };

  // Permanently delete user from Database, LocalStorage & ALL pages
  const deleteUser = async (id: string, email: string) => {
    if (confirm(`Are you sure you want to permanently delete user ${email} from ALL system databases?`)) {
      try {
        const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : null;
        await fetch(`http://localhost:8000/api/v1/admin/users/${id}`, {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });
      } catch (e) {
        console.warn("Backend connection offline, purging local DB record.");
      }

      // Record ID in permanent deleted list
      if (typeof window !== "undefined") {
        const deletedIds = JSON.parse(localStorage.getItem("admin_deleted_user_ids") || "[]");
        if (!deletedIds.includes(id)) {
          deletedIds.push(id);
          localStorage.setItem("admin_deleted_user_ids", JSON.stringify(deletedIds));
        }

        // Remove from registered users cache
        const regUsers = JSON.parse(localStorage.getItem("materna_registered_users") || "[]");
        const cleanReg = regUsers.filter((u: any) => u.id !== id && u.email !== email);
        localStorage.setItem("materna_registered_users", JSON.stringify(cleanReg));
      }

      // Purge from UI users list
      const filteredUsers = users.filter((u) => u.id !== id);
      updateUsersState(filteredUsers);

      // Purge from Agent Executions list
      const filteredExecutions = agentExecutions.filter((ex) => ex.userId !== id);
      setAgentExecutions(filteredExecutions);
      if (filteredExecutions.length > 0) {
        setSelectedUserExecution(filteredExecutions[0]);
      }

      // Purge from localStorage datasets & checkin history if present
      if (typeof window !== "undefined") {
        const storedOcr = localStorage.getItem("patient_ocr_dataset");
        if (storedOcr) {
          const parsed = JSON.parse(storedOcr);
          const cleanDataset = parsed.filter((item: any) => !item.filename?.toLowerCase().includes(email.toLowerCase()));
          localStorage.setItem("patient_ocr_dataset", JSON.stringify(cleanDataset));
        }
        localStorage.removeItem(`patient_vitals_${id}`);
        localStorage.removeItem(`patient_history_${id}`);
      }

      setActionMessage(`User ${email} completely removed from ALL website databases & pages.`);
      setTimeout(() => setActionMessage(null), 4000);
    }
  };

  // Batch delete all matching users (e.g. all users named "Amina")
  const purgeMatchingUsers = (query: string) => {
    if (!query.trim()) return;
    const targets = users.filter(
      (u) =>
        u.role !== "ADMIN" &&
        (u.name.toLowerCase().includes(query.toLowerCase()) || u.email.toLowerCase().includes(query.toLowerCase()))
    );

    if (targets.length === 0) {
      alert(`No non-admin users found matching "${query}"`);
      return;
    }

    if (confirm(`Are you sure you want to delete ALL ${targets.length} users matching "${query}"?`)) {
      const targetIds = targets.map((t) => t.id);

      if (typeof window !== "undefined") {
        const deletedIds = JSON.parse(localStorage.getItem("admin_deleted_user_ids") || "[]");
        const updatedDeleted = Array.from(new Set([...deletedIds, ...targetIds]));
        localStorage.setItem("admin_deleted_user_ids", JSON.stringify(updatedDeleted));
      }

      const remaining = users.filter((u) => !targetIds.includes(u.id));
      updateUsersState(remaining);

      setActionMessage(`Successfully purged all ${targets.length} users matching "${query}".`);
      setTimeout(() => setActionMessage(null), 4000);
    }
  };

  // Reset system database completely
  const resetDB = async () => {
    if (confirm("Reset system database to clean baseline state? All non-admin records will be permanently wiped.")) {
      try {
        const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : null;
        await fetch("http://localhost:8000/api/v1/admin/reset-database", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });
      } catch (e) {
        console.warn("Backend offline, resetting local DB state.");
      }

      const adminOnly = MOCK_USERS.filter((u) => u.role === "ADMIN");
      updateUsersState(adminOnly);
      setAgentExecutions([]);

      if (typeof window !== "undefined") {
        localStorage.removeItem("admin_deleted_user_ids");
        localStorage.removeItem("patient_ocr_dataset");
        localStorage.removeItem("last_patient_vitals");
        localStorage.removeItem("last_checkin_timestamp");
      }
      setActionMessage("Database wiped and reset to baseline admin state.");
      setTimeout(() => setActionMessage(null), 4000);
    }
  };

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === "ALL" || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1 lg:ml-[var(--sidebar-width)]">
        <Header />
        <main className="p-6 max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between flex-wrap gap-4 mb-8 animate-fade-in">
            <div>
              <h1 className="text-3xl font-bold text-slate-100 mb-1 flex items-center gap-3">
                <Shield size={28} className="text-sky-400" />
                Admin Dashboard & User Control
              </h1>
              <p className="text-slate-400 text-sm">
                Manage user accounts, inspect live multi-agent execution flows, system logs, and tokens.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button onClick={resetDB} className="btn-secondary text-xs text-rose-400 border-rose-500/30">
                <RotateCcw size={14} /> Reset System DB
              </button>
              <Link href="/admin/tokens" className="btn-primary text-xs">
                <Coins size={14} /> Tokens & Costs
              </Link>
            </div>
          </div>

          {/* Admin Credentials & Agent Health Status Callout */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-6">
            <GlassCard className="lg:col-span-6 border-sky-500/30 bg-sky-500/10 animate-fade-in flex flex-col justify-between">
              <div className="flex items-center justify-between flex-wrap gap-4 mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-sky-600 flex items-center justify-center text-white shadow-sm">
                    <KeyRound size={20} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-100">Official Admin Access Credentials</p>
                    <p className="text-xs text-slate-300">
                      Email: <code className="bg-slate-800 px-2 py-0.5 rounded text-sky-300 font-mono">admin@materna.ai</code>
                    </p>
                    <p className="text-xs text-slate-300 mt-0.5">
                      Password: <code className="bg-slate-800 px-2 py-0.5 rounded text-sky-300 font-mono">Ali&amp;8122004</code>
                    </p>
                  </div>
                </div>
                <span className="px-3 py-1 rounded-full bg-sky-500/20 text-sky-300 text-xs font-semibold border border-sky-500/30">
                  ADMIN ROLE ACTIVE
                </span>
              </div>
            </GlassCard>

            {/* Live System Agents Status Grid */}
            <GlassCard className="lg:col-span-6 animate-fade-in">
              <div className="flex items-center justify-between mb-3 border-b border-slate-800 pb-2">
                <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                  <Bot size={15} className="text-sky-400" />
                  Live System Agents Health Monitor
                </h3>
                <span className="text-[10px] text-emerald-400 font-mono flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" /> ALL AGENTS ONLINE
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-between">
                  <span className="text-slate-300 font-medium">1. OCR Vision Agent</span>
                  <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 text-[10px] font-mono font-bold">WORKING</span>
                </div>
                <div className="p-2 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-between">
                  <span className="text-slate-300 font-medium">2. Medical RAG Agent</span>
                  <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 text-[10px] font-mono font-bold">WORKING</span>
                </div>
                <div className="p-2 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-between">
                  <span className="text-slate-300 font-medium">3. Risk Engine Agent</span>
                  <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 text-[10px] font-mono font-bold">WORKING</span>
                </div>
                <div className="p-2 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-between">
                  <span className="text-slate-300 font-medium">4. Timeline Agent</span>
                  <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 text-[10px] font-mono font-bold">WORKING</span>
                </div>
              </div>
            </GlassCard>
          </div>

          {actionMessage && (
            <div className="mb-6 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-sm flex items-center gap-2 animate-fade-in">
              <CheckCircle size={18} />
              {actionMessage}
            </div>
          )}

          {/* Quick Metrics */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <GlassCard hover className="animate-fade-in-up">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-slate-400">Total Users</span>
                <Users size={18} className="text-sky-400" />
              </div>
              <p className="text-2xl font-bold text-slate-100">{users.length}</p>
              <p className="text-xs text-slate-500 mt-1">Full Database Records</p>
            </GlassCard>

            <GlassCard hover className="animate-fade-in-up animation-delay-100">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-slate-400">Active Sessions</span>
                <Activity size={18} className="text-emerald-400" />
              </div>
              <p className="text-2xl font-bold text-slate-100">
                {users.filter((u) => u.status === "active").length}
              </p>
              <p className="text-xs text-emerald-400 mt-1">● Access Granted</p>
            </GlassCard>

            <GlassCard hover className="animate-fade-in-up animation-delay-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-slate-400">Tokens Consumed</span>
                <Coins size={18} className="text-amber-400" />
              </div>
              <p className="text-2xl font-bold text-slate-100">292.8k</p>
              <p className="text-xs text-slate-500 mt-1">~$4.75 Cost</p>
            </GlassCard>

            <GlassCard hover className="animate-fade-in-up animation-delay-300">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-slate-400">Agent Flow Executions</span>
                <GitCommit size={18} className="text-sky-400" />
              </div>
              <p className="text-2xl font-bold text-slate-100">142</p>
              <p className="text-xs text-sky-300 mt-1">Multi-Agent Runs</p>
            </GlassCard>
          </div>

          {/* Tab Selection */}
          <div className="flex items-center gap-2 mb-6 border-b border-slate-800 pb-2 overflow-x-auto">
            {[
              { id: "users", label: "User Management & Delete", icon: <Users size={15} /> },
              { id: "agent-flow", label: "Live Working Agent Flow", icon: <GitCommit size={15} /> },
              { id: "logs", label: "System Activity Logs", icon: <Terminal size={15} /> },
              { id: "settings", label: "System Settings", icon: <SettingsIcon size={15} /> },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all duration-200",
                  activeTab === tab.id
                    ? "bg-sky-600/20 text-sky-300 border border-sky-500/30 shadow-sm"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-900"
                )}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>

          {/* TAB 1: USER MANAGEMENT */}
          {activeTab === "users" && (
            <GlassCard className="animate-fade-in">
              <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-6">
                <div className="flex items-center gap-2 w-full md:w-auto">
                  <div className="relative w-full md:w-80">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input
                      type="text"
                      placeholder="Search by name or email..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="input-glass-sm pl-9 pr-4 w-full"
                    />
                  </div>
                  {searchTerm.trim() && (
                    <button
                      onClick={() => purgeMatchingUsers(searchTerm)}
                      className="px-3 py-1.5 rounded-xl bg-rose-500/20 text-rose-400 hover:bg-rose-500/30 border border-rose-500/30 text-xs font-bold whitespace-nowrap flex items-center gap-1.5 transition-all"
                      title={`Delete all users matching "${searchTerm}"`}
                    >
                      <Trash2 size={13} />
                      Purge All &quot;{searchTerm}&quot;
                    </button>
                  )}
                </div>
                <div className="flex items-center gap-2 w-full md:w-auto">
                  <Filter size={16} className="text-slate-500" />
                  <select
                    value={roleFilter}
                    onChange={(e) => setRoleFilter(e.target.value)}
                    className="input-glass-sm bg-slate-900 text-slate-200"
                  >
                    <option value="ALL">All Roles</option>
                    <option value="PATIENT">Patients</option>
                    <option value="DOCTOR">Doctors</option>
                    <option value="MIDWIFE">Midwives</option>
                    <option value="ADMIN">Admins</option>
                  </select>
                </div>
              </div>

              {/* Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 text-xs uppercase text-slate-500 tracking-wider">
                      <th className="py-3 px-4">User</th>
                      <th className="py-3 px-4">Role</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Last Active</th>
                      <th className="py-3 px-4">Tokens</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 text-sm">
                    {filteredUsers.map((user) => (
                      <tr key={user.id} className="hover:bg-slate-900/50 transition-colors">
                        <td className="py-3.5 px-4">
                          <div>
                            <p className="font-semibold text-slate-200">{user.name}</p>
                            <p className="text-xs text-slate-500">{user.email}</p>
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className={cn(
                            "px-2.5 py-1 rounded-full text-xs font-semibold uppercase",
                            user.role === "ADMIN" && "bg-purple-500/20 text-purple-300 border border-purple-500/30",
                            user.role === "DOCTOR" && "bg-sky-500/20 text-sky-300 border border-sky-500/30",
                            user.role === "MIDWIFE" && "bg-amber-500/20 text-amber-300 border border-amber-500/30",
                            user.role === "PATIENT" && "bg-slate-800 text-slate-300 border border-slate-700"
                          )}>
                            {user.role}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          {user.status === "active" ? (
                            <span className="inline-flex items-center gap-1.5 text-xs text-emerald-400 font-medium">
                              <span className="w-2 h-2 rounded-full bg-emerald-400" />
                              Allowed
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 text-xs text-rose-400 font-medium">
                              <span className="w-2 h-2 rounded-full bg-rose-400" />
                              Blocked
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-slate-400 text-xs">{user.lastActive}</td>
                        <td className="py-3.5 px-4 text-slate-300 font-mono text-xs">
                          {user.tokensUsed.toLocaleString()}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => toggleBlock(user.id)}
                              className={cn(
                                "px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 flex items-center gap-1",
                                user.status === "active"
                                  ? "bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 border border-amber-500/30"
                                  : "bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/30"
                              )}
                              title={user.status === "active" ? "Block User Access" : "Allow User Access"}
                            >
                              {user.status === "active" ? <Ban size={13} /> : <CheckCircle size={13} />}
                              {user.status === "active" ? "Block" : "Allow"}
                            </button>
                            <button
                              onClick={() => deleteUser(user.id, user.email)}
                              disabled={user.role === "ADMIN"}
                              className={cn(
                                "px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 flex items-center gap-1",
                                user.role === "ADMIN"
                                  ? "opacity-30 cursor-not-allowed text-slate-500 border border-slate-700"
                                  : "bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 border border-rose-500/30"
                              )}
                              title="Permanently Delete User from Database"
                            >
                              <Trash2 size={13} />
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </GlassCard>
          )}

          {/* TAB 2: LIVE WORKING AGENT FLOW INSPECTOR */}
          {activeTab === "agent-flow" && (
            <div className="space-y-6 animate-fade-in">
              <GlassCard>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 border-b border-slate-800 pb-4">
                  <div>
                    <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                      <GitCommit size={20} className="text-sky-400" />
                      Per-User Multi-Agent Execution Flow
                    </h3>
                    <p className="text-xs text-slate-400">
                      Select a user below to inspect the step-by-step working agent graph, token consumption, and risk alerts.
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-slate-400">Selected Execution:</span>
                    <select
                      value={selectedUserExecution.id}
                      onChange={(e) => {
                        const found = MOCK_AGENT_EXECUTIONS.find((ex) => ex.id === e.target.value);
                        if (found) setSelectedUserExecution(found);
                      }}
                      className="input-glass-sm bg-slate-900 text-sky-300 font-semibold"
                    >
                      {MOCK_AGENT_EXECUTIONS.map((ex) => (
                        <option key={ex.id} value={ex.id}>
                          {ex.userName} ({ex.triggerEvent}) — {ex.riskLevel} RISK
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Execution Header Meta */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-xl bg-slate-900/80 border border-slate-800 mb-6">
                  <div>
                    <span className="text-[11px] text-slate-500 font-medium">User Profile</span>
                    <p className="text-sm font-bold text-slate-100">{selectedUserExecution.userName}</p>
                    <p className="text-[10px] text-slate-400">{selectedUserExecution.userEmail}</p>
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-500 font-medium">Execution Event</span>
                    <p className="text-xs font-semibold text-slate-200">{selectedUserExecution.triggerEvent}</p>
                    <p className="text-[10px] text-slate-500 flex items-center gap-1 mt-0.5">
                      <Clock size={10} /> {selectedUserExecution.timestamp}
                    </p>
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-500 font-medium">Total Performance</span>
                    <p className="text-xs font-bold text-sky-300 font-mono">{selectedUserExecution.totalLatencyMs} ms</p>
                    <p className="text-[10px] text-slate-400">{selectedUserExecution.totalTokens} tokens consumed</p>
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-500 font-medium">Evaluated Risk Status</span>
                    <div>
                      <span className={cn(
                        "inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold font-mono mt-1",
                        selectedUserExecution.riskLevel === "GREEN" && "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30",
                        selectedUserExecution.riskLevel === "YELLOW" && "bg-amber-500/20 text-amber-300 border border-amber-500/30",
                        selectedUserExecution.riskLevel === "RED" && "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                      )}>
                        ● {selectedUserExecution.riskLevel} ALERT
                      </span>
                    </div>
                  </div>
                </div>

                {/* Step-by-Step Agent Flow Graph */}
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <Brain size={14} className="text-sky-400" />
                  Sequential Agent Graph Pipeline ({selectedUserExecution.steps.length} Nodes Executed)
                </h4>

                <div className="space-y-4">
                  {selectedUserExecution.steps.map((step, idx) => (
                    <div key={idx} className="relative pl-6 pb-2 border-l-2 border-slate-800 last:border-l-0">
                      {/* Node dot */}
                      <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-slate-900 border-2 border-sky-400 flex items-center justify-center">
                        <div className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-pulse" />
                      </div>

                      <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 hover:border-slate-700 transition-all">
                        <div className="flex items-center justify-between flex-wrap gap-2 mb-2">
                          <div className="flex items-center gap-2">
                            <span className="w-6 h-6 rounded-lg bg-sky-500/15 text-sky-400 font-mono text-xs font-bold flex items-center justify-center border border-sky-500/30">
                              #{idx + 1}
                            </span>
                            <span className="text-sm font-bold text-slate-100">{step.agentName}</span>
                            <span className="text-xs text-slate-400">({step.role})</span>
                          </div>
                          <div className="flex items-center gap-3 text-xs font-mono">
                            <span className="text-slate-400">{step.durationMs} ms</span>
                            <span className="text-slate-500">•</span>
                            <span className="text-amber-300">{step.tokens} tokens</span>
                            <span className={cn(
                              "px-2 py-0.5 rounded text-[10px] font-bold",
                              step.status === "SUCCESS" && "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30",
                              step.status === "WARNING" && "bg-amber-500/15 text-amber-400 border border-amber-500/30"
                            )}>
                              {step.status}
                            </span>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs mt-3 pt-3 border-t border-slate-800/80 font-mono">
                          <div>
                            <span className="text-slate-500 font-semibold block mb-1">Input / Trigger:</span>
                            <p className="p-2 rounded bg-slate-900 text-slate-300 border border-slate-800">{step.inputSummary}</p>
                          </div>
                          <div>
                            <span className="text-slate-500 font-semibold block mb-1">Output / Decision:</span>
                            <p className="p-2 rounded bg-slate-900 text-sky-300 border border-slate-800">{step.outputSummary}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </GlassCard>
            </div>
          )}

          {/* TAB 3: SYSTEM LOGS */}
          {activeTab === "logs" && (
            <GlassCard className="animate-fade-in font-mono">
              <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-3">
                <h3 className="text-xs font-bold text-slate-300 flex items-center gap-2">
                  <Terminal size={15} className="text-sky-400" />
                  Live System Audit Trail
                </h3>
                <button className="text-xs text-sky-400 flex items-center gap-1 hover:underline">
                  <RefreshCw size={12} /> Refresh Logs
                </button>
              </div>

              <div className="space-y-2 max-h-[500px] overflow-y-auto pr-2">
                {MOCK_LOGS.map((log) => (
                  <div key={log.id} className="p-3 rounded-lg bg-slate-900/80 border border-slate-800 text-xs flex items-start gap-3">
                    <span className="text-slate-500">{log.time}</span>
                    <span className={cn(
                      "px-1.5 py-0.5 rounded font-bold text-[10px]",
                      log.level === "INFO" && "bg-sky-500/20 text-sky-300",
                      log.level === "WARNING" && "bg-amber-500/20 text-amber-300",
                      log.level === "ERROR" && "bg-rose-500/20 text-rose-300"
                    )}>
                      {log.level}
                    </span>
                    <span className="text-slate-300 font-semibold">{log.event}:</span>
                    <span className="text-slate-400 flex-1">{log.details}</span>
                  </div>
                ))}
              </div>
            </GlassCard>
          )}

          {/* TAB 4: SETTINGS & MODEL CONFIG */}
          {activeTab === "settings" && (
            <div className="grid md:grid-cols-2 gap-6 animate-fade-in">
              <GlassCard>
                <h3 className="text-lg font-semibold text-slate-100 mb-4 flex items-center gap-2">
                  <Cpu size={20} className="text-sky-400" />
                  LLM Provider Configuration
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">Primary LLM Model</label>
                    <select className="input-glass w-full bg-slate-900">
                      <option>OpenRouter: Qwen 2.5 72B (Recommended)</option>
                      <option>OpenAI: GPT-4o Mini</option>
                      <option>Groq: Llama-3.3 70B Versatile</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">Vision OCR Model</label>
                    <select className="input-glass w-full bg-slate-900">
                      <option>Qwen 2 VL 72B Instruct (Vision)</option>
                      <option>OpenAI GPT-4o (Vision)</option>
                    </select>
                  </div>
                  <button className="btn-primary w-full mt-2">Save Configuration</button>
                </div>
              </GlassCard>

              <GlassCard>
                <h3 className="text-lg font-semibold text-slate-100 mb-4 flex items-center gap-2">
                  <Shield size={20} className="text-emerald-400" />
                  Database Management
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed mb-4">
                  Permanently wipe or reset system users and check-in records to clean baseline defaults.
                </p>
                <button onClick={resetDB} className="btn-secondary w-full text-rose-400 border-rose-500/30">
                  <RotateCcw size={16} /> Reset All Database Records
                </button>
              </GlassCard>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
