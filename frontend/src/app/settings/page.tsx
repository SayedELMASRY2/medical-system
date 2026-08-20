"use client";

import React, { useState, useEffect, useRef } from "react";
import GlassCard from "@/components/ui/GlassCard";
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
import { cn } from "@/lib/utils";
import {
  User,
  Camera,
  Mail,
  Phone,
  Calendar,
  Heart,
  Shield,
  Save,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Upload,
  UserCheck,
  FileText,
  Activity,
} from "lucide-react";

export default function SettingsPage() {
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Profile Form States
  const [fullName, setFullName] = useState<string>("Patient User");
  const [email, setEmail] = useState<string>("patient@materna.ai");
  const [phone, setPhone] = useState<string>("+20 100 234 5678");
  const [emergencyPhone, setEmergencyPhone] = useState<string>("+20 101 987 6543");
  const [role, setRole] = useState<string>("PATIENT");
  const [gestationalWeek, setGestationalWeek] = useState<number>(28);
  const [bloodType, setBloodType] = useState<string>("O+");
  const [avatar, setAvatar] = useState<string>("/default_avatar.png");
  const [conditions, setConditions] = useState<string>("Gestational Diabetes monitoring, Mild hypertension");

  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);

  // Load existing saved profile on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("materna_user_profile");
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (parsed.fullName) setFullName(parsed.fullName);
          if (parsed.email) setEmail(parsed.email);
          if (parsed.phone) setPhone(parsed.phone);
          if (parsed.emergencyPhone) setEmergencyPhone(parsed.emergencyPhone);
          if (parsed.role) setRole(parsed.role);
          if (parsed.gestationalWeek) setGestationalWeek(parsed.gestationalWeek);
          if (parsed.bloodType) setBloodType(parsed.bloodType);
          if (parsed.avatar) setAvatar(parsed.avatar);
          if (parsed.conditions) setConditions(parsed.conditions);
        } catch (e) {}
      }
    }
  }, []);

  // Handle Photo Upload
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (reader.result) {
          const base64Image = reader.result as string;
          setAvatar(base64Image);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Save Profile Changes
  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    const updatedProfile = {
      fullName,
      email,
      phone,
      emergencyPhone,
      role,
      gestationalWeek,
      bloodType,
      avatar,
      conditions,
      updatedAt: new Date().toISOString(),
    };

    if (typeof window !== "undefined") {
      localStorage.setItem("materna_user_profile", JSON.stringify(updatedProfile));
    }

    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      // Reload page to refresh Header state seamlessly
      window.location.reload();
    }, 1200);
  };

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1 lg:ml-[var(--sidebar-width)]">
        <Header />
        <main className="p-6 max-w-5xl mx-auto">
          {/* Header Banner */}
          <div className="flex items-center justify-between flex-wrap gap-4 mb-6 animate-fade-in">
            <div>
              <h1 className="text-3xl font-bold text-slate-100 mb-1 flex items-center gap-3">
                <UserCheck size={28} className="text-sky-400" />
                Account & Profile Settings
              </h1>
              <p className="text-slate-400 text-sm">
                Manage your personal information, profile photo, emergency contacts, and clinical profile.
              </p>
            </div>
            {savedSuccess && (
              <span className="px-4 py-2 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center gap-2 animate-fade-in shadow-glow-brand">
                <CheckCircle2 size={16} /> Profile Saved & Synchronized!
              </span>
            )}
          </div>

          <form onSubmit={handleSaveProfile} className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* LEFT COLUMN: Profile Avatar & Quick Card (4 cols) */}
            <GlassCard className="lg:col-span-4 flex flex-col items-center text-center p-6 space-y-4 animate-fade-in">
              <div className="relative group">
                {/* Avatar Display */}
                <div className="w-32 h-32 rounded-full overflow-hidden border-2 border-sky-500/50 shadow-glow-brand bg-slate-900">
                  <img src={avatar} alt="Profile Photo" className="w-full h-full object-cover" />
                </div>

                {/* Upload Button Overlay */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute bottom-0 right-0 p-2.5 rounded-full bg-sky-500 text-white shadow-lg hover:bg-sky-400 transition-all border-2 border-slate-950 flex items-center justify-center"
                  title="Upload profile picture"
                >
                  <Camera size={16} />
                </button>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handlePhotoUpload}
                  accept="image/*"
                  className="hidden"
                />
              </div>

              <div>
                <h2 className="text-lg font-bold text-slate-100">{fullName}</h2>
                <p className="text-xs text-slate-400 flex items-center justify-center gap-1 mt-0.5">
                  <Mail size={12} className="text-sky-400" /> {email}
                </p>
                <span className="inline-block mt-2 px-3 py-1 rounded-full bg-sky-500/10 border border-sky-500/30 text-sky-300 text-[11px] font-semibold uppercase tracking-wider">
                  Role: {role}
                </span>
              </div>

              {/* Upload Helper Text */}
              <div className="w-full pt-4 border-t border-slate-800 text-xs text-slate-400 space-y-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="btn-secondary w-full text-xs flex items-center justify-center gap-2"
                >
                  <Upload size={14} /> Change Profile Photo
                </button>
                <p className="text-[10px] text-slate-500">Supports JPG, PNG, WebP up to 5MB.</p>
              </div>

              {/* Clinical Summary Badge */}
              <div className="w-full p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-left text-xs space-y-1.5">
                <div className="flex justify-between items-center text-slate-300 font-semibold">
                  <span>Gestational Status:</span>
                  <span className="text-sky-400 font-mono font-bold">Week {gestationalWeek}</span>
                </div>
                <div className="flex justify-between items-center text-slate-300 font-semibold">
                  <span>Blood Group:</span>
                  <span className="text-rose-400 font-mono font-bold">{bloodType}</span>
                </div>
              </div>
            </GlassCard>

            {/* RIGHT COLUMN: Profile Fields Form (8 cols) */}
            <GlassCard className="lg:col-span-8 space-y-6 animate-fade-in">
              <h2 className="text-sm font-bold text-slate-200 uppercase tracking-wider border-b border-slate-800 pb-3 flex items-center gap-2">
                <User size={16} className="text-sky-400" /> Personal & Medical Information
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Full Name */}
                <div>
                  <label className="text-xs font-medium text-slate-300 block mb-1">Full Name</label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                    className="input-glass w-full"
                  />
                </div>

                {/* Email Address */}
                <div>
                  <label className="text-xs font-medium text-slate-300 block mb-1">Email Address</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="input-glass w-full"
                  />
                </div>

                {/* Phone Number */}
                <div>
                  <label className="text-xs font-medium text-slate-300 block mb-1">Phone Number</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="input-glass w-full"
                  />
                </div>

                {/* Emergency Contact Phone */}
                <div>
                  <label className="text-xs font-medium text-slate-300 block mb-1">Emergency Phone Contact</label>
                  <input
                    type="tel"
                    value={emergencyPhone}
                    onChange={(e) => setEmergencyPhone(e.target.value)}
                    className="input-glass w-full text-rose-300 border-rose-500/30"
                  />
                </div>

                {/* Gestational Week */}
                <div>
                  <label className="text-xs font-medium text-slate-300 block mb-1">Gestational Age (Weeks)</label>
                  <input
                    type="number"
                    min={1}
                    max={42}
                    value={gestationalWeek}
                    onChange={(e) => setGestationalWeek(Number(e.target.value))}
                    className="input-glass w-full font-mono"
                  />
                </div>

                {/* Blood Type */}
                <div>
                  <label className="text-xs font-medium text-slate-300 block mb-1">Blood Type</label>
                  <select
                    value={bloodType}
                    onChange={(e) => setBloodType(e.target.value)}
                    className="input-glass w-full bg-slate-900 text-slate-200"
                  >
                    {["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map((bt) => (
                      <option key={bt} value={bt}>
                        {bt}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Pre-existing Medical Conditions */}
              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1">
                  Pre-existing Conditions / Medical Notes
                </label>
                <textarea
                  rows={3}
                  value={conditions}
                  onChange={(e) => setConditions(e.target.value)}
                  className="input-glass w-full text-xs"
                />
              </div>

              {/* Form Action Submit Button */}
              <div className="pt-4 border-t border-slate-800 flex justify-end">
                <button type="submit" className="btn-primary text-xs flex items-center gap-2">
                  <Save size={16} /> Save Profile Changes
                </button>
              </div>
            </GlassCard>
          </form>
        </main>
      </div>
    </div>
  );
}
