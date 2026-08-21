"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import GlassCard from "@/components/ui/GlassCard";
import {
  Heart,
  Mail,
  Lock,
  LogIn,
  Shield,
  Eye,
  EyeOff,
  AlertCircle,
  Loader2,
  ArrowLeft,
  Home,
} from "lucide-react";
import { cn, getScopedKey, parseJwt } from "@/lib/utils";

const API_BASE = "https://travelling-klein-bargains-obituaries.trycloudflare.com/api/v1";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const formData = new URLSearchParams();
      formData.append("username", email);
      formData.append("password", password);

      const res = await fetch(`${API_BASE}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: formData.toString(),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.detail || "Incorrect email or password.");
      }

      const data = await res.json();
      localStorage.setItem("access_token", data.access_token);
      document.cookie = `access_token=${data.access_token}; path=/; max-age=86400; SameSite=Lax`;

      const decoded = parseJwt(data.access_token);
      const userRole = decoded?.role || "PATIENT";

      if (userRole === "ADMIN") {
        router.push("/admin");
      } else if (userRole === "DOCTOR") {
        router.push("/doctor");
      } else {
        const isCompleted = typeof window !== "undefined" && localStorage.getItem(getScopedKey("onboarding_completed")) === "true";
        if (!isCompleted) {
          router.push("/onboarding");
        } else {
          router.push("/dashboard");
        }
      }
    } catch (err: any) {
      setError(err.message || "Login failed. Please try again.");
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
            Welcome Back
          </h1>
          <p className="text-slate-400 text-sm">
            Sign in to your <span className="text-gradient-brand font-semibold">Materna</span> account
          </p>
        </div>

        {/* Login Card */}
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
                  autoComplete="current-password"
                  placeholder="••••••••"
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
                <LogIn size={18} />
              )}
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>

          {/* Divider */}
          <div className="divider-gradient my-6" />

          {/* Register Link & Back Home Link */}
          <div className="space-y-3 text-center">
            <p className="text-sm text-slate-400">
              Don&apos;t have an account?{" "}
              <Link
                href="/register"
                className="text-cyan-400 hover:text-cyan-300 font-medium transition-colors"
              >
                Create Account
              </Link>
            </p>
          </div>
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
