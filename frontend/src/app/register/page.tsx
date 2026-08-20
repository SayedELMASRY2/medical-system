"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import GlassCard from "@/components/ui/GlassCard";
import {
  Heart,
  Mail,
  Lock,
  UserPlus,
  Shield,
  Eye,
  EyeOff,
  AlertCircle,
  Loader2,
  User,
  Stethoscope,
  Baby,
  ArrowLeft,
  Home,
} from "lucide-react";
import { cn } from "@/lib/utils";

const API_BASE = "http://localhost:8000/api/v1";

type UserRole = "PATIENT" | "DOCTOR" | "MIDWIFE";

const ROLES: { value: UserRole; label: string; icon: React.ReactNode; description: string }[] = [
  {
    value: "PATIENT",
    label: "Patient",
    icon: <Baby size={20} />,
    description: "Expectant mother — track your pregnancy",
  },
  {
    value: "DOCTOR",
    label: "Doctor",
    icon: <Stethoscope size={20} />,
    description: "OB-GYN — monitor your patients",
  },
];

export default function RegisterPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState<UserRole>("PATIENT");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(`${API_BASE}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          password,
          full_name: fullName,
          role,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(
          data?.detail || "Registration failed. Please try again."
        );
      }

      // Save new user to localStorage so Admin panel picks them up instantly
      if (typeof window !== "undefined") {
        const existingUsers = JSON.parse(localStorage.getItem("materna_registered_users") || "[]");
        const newUserObj = {
          id: `usr-${Date.now()}`,
          name: fullName,
          email: email,
          role: role,
          status: "active",
          lastActive: "Just now",
          tokensUsed: 0,
        };
        existingUsers.push(newUserObj);
        localStorage.setItem("materna_registered_users", JSON.stringify(existingUsers));
      }

      // Set first signup onboarding flag for patients
      if (role === "PATIENT") {
        if (typeof window !== "undefined") {
          localStorage.setItem("onboarding_completed", "false");
        }
        router.push("/onboarding?signup=true");
      } else {
        router.push("/login?registered=true");
      }
    } catch (err: any) {
      setError(err.message || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 relative">
      {/* Back to Home Button */}
      <div className="absolute top-6 left-6 z-20">
        <Link
          href="/"
          className="btn-secondary py-2.5 px-4 text-xs flex items-center gap-2 text-cyan-300 hover:text-white"
        >
          <ArrowLeft size={16} />
          <Home size={15} />
          <span>Back to Home</span>
        </Link>
      </div>

      {/* Background accent */}
      <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-gradient-radial from-cyan-500/20 via-violet-500/10 to-transparent blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        {/* Logo / Branding */}
        <div className="text-center mb-8 animate-fade-in">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-cyan-500/20 border border-cyan-500/30 mb-4 shadow-[0_0_25px_rgba(6,182,212,0.3)]">
            <Heart size={32} className="text-cyan-400" fill="currentColor" />
          </div>
          <h1 className="text-3xl font-bold text-slate-100 mb-1">
            Create Account
          </h1>
          <p className="text-slate-400 text-sm">
            Join <span className="text-gradient-brand font-semibold">Materna</span> — safe pregnancy monitoring
          </p>
        </div>

        {/* Register Card */}
        <GlassCard
          padding="lg"
          className="animate-fade-in-up opacity-0 fill-mode-forwards animation-delay-100"
        >
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Error Alert */}
            {error && (
              <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-sm animate-fade-in">
                <AlertCircle size={16} className="flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Role Selector */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                I am a
              </label>
              <div className="grid grid-cols-2 gap-3">
                {ROLES.map((r) => (
                  <button
                    key={r.value}
                    type="button"
                    onClick={() => setRole(r.value)}
                    className={cn(
                      "flex flex-col items-center gap-2 px-4 py-4 rounded-xl border transition-all duration-200 text-center",
                      role === r.value
                        ? "border-cyan-500/50 bg-cyan-500/15 text-cyan-300 shadow-[0_0_20px_rgba(6,182,212,0.25)]"
                        : "border-glass-border bg-surface-800/60 text-slate-400 hover:border-glass-border-light hover:text-slate-200"
                    )}
                  >
                    <div
                      className={cn(
                        "w-10 h-10 rounded-xl flex items-center justify-center font-bold",
                        role === r.value
                          ? "bg-cyan-500/25 text-cyan-300"
                          : "bg-surface-700 text-slate-400"
                      )}
                    >
                      {r.icon}
                    </div>
                    <span className="text-sm font-medium">{r.label}</span>
                    <span className="text-[10px] text-slate-400 leading-tight">
                      {r.description}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Full Name */}
            <div>
              <label
                htmlFor="fullName"
                className="block text-sm font-medium text-slate-300 mb-2"
              >
                Full Name
              </label>
              <div className="relative">
                <User
                  size={18}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"
                />
                <input
                  id="fullName"
                  type="text"
                  required
                  autoComplete="name"
                  placeholder="Mariam Hassan"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="input-glass pl-11"
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-slate-300 mb-2"
              >
                Email Address
              </label>
              <div className="relative">
                <Mail
                  size={18}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"
                />
                <input
                  id="email"
                  type="email"
                  required
                  autoComplete="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input-glass pl-11"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-slate-300 mb-2"
              >
                Password
              </label>
              <div className="relative">
                <Lock
                  size={18}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"
                />
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  required
                  autoComplete="new-password"
                  placeholder="Min. 8 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-glass pl-11 pr-11"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              <p className="text-xs text-slate-500 mt-1.5 pl-1">
                At least 8 characters
              </p>
            </div>

            {/* Confirm Password */}
            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-sm font-medium text-slate-300 mb-2"
              >
                Confirm Password
              </label>
              <div className="relative">
                <Lock
                  size={18}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"
                />
                <input
                  id="confirmPassword"
                  type={showPassword ? "text" : "password"}
                  required
                  autoComplete="new-password"
                  placeholder="Repeat password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="input-glass pl-11"
                />
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className={cn(
                "btn-primary w-full text-base py-3.5",
                loading && "opacity-70 cursor-not-allowed"
              )}
            >
              {loading ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <UserPlus size={18} />
              )}
              {loading ? "Creating Account..." : "Create Account"}
            </button>
          </form>

          {/* Divider */}
          <div className="divider-gradient my-6" />

          {/* Login Link */}
          <p className="text-center text-sm text-slate-400">
            Already have an account?{" "}
            <Link
              href="/login"
              className="text-cyan-400 hover:text-cyan-300 font-medium transition-colors"
            >
              Sign In
            </Link>
          </p>
        </GlassCard>

        {/* CDSS Badge */}
        <div className="flex justify-center mt-6 animate-fade-in-up opacity-0 fill-mode-forwards animation-delay-300">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass text-xs text-slate-400 border border-glass-border">
            <Shield size={12} className="text-cyan-400" />
            Clinical Decision Support System — Protected Access
          </div>
        </div>
      </div>
    </div>
  );
}
