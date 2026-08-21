import type { Metadata } from "next";
import { Inter } from "next/font/google";
import ProtectedRoute from "@/components/layout/ProtectedRoute";
import { ShieldAlert, Stethoscope } from "lucide-react";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Materna CDSS — Maternal Health Clinical Decision Support",
  description:
    "AI-powered longitudinal pregnancy monitoring and early-warning system. Eliminate blind spots between prenatal visits with continuous tracking, intelligent risk assessment, and evidence-based clinical alerts.",
  keywords: [
    "maternal health",
    "pregnancy monitoring",
    "preeclampsia",
    "CDSS",
    "clinical decision support",
    "prenatal care",
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${inter.variable} font-sans bg-slate-950 text-slate-100 min-h-screen`}
      >
        {/* ── Animated Background Orbs ──────────────────── */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
          <div className="bg-orb bg-orb-brand w-[600px] h-[600px] -top-32 -left-32 opacity-15" />
          <div className="bg-orb bg-orb-violet w-[500px] h-[500px] top-1/3 right-0 opacity-15" />
        </div>

        {/* ── Main Content ─────────────────────────────── */}
        <div className="relative z-10 min-h-screen flex flex-col">
          <main className="flex-1">
            <ProtectedRoute>{children}</ProtectedRoute>
          </main>

          {/* ── Premium CDSS Disclaimer Banner ─────────────────── */}
          <footer className="w-full py-2.5 px-4 border-t border-glass-border/60 bg-slate-950/80 backdrop-blur-md lg:pl-[var(--sidebar-width)]">
            <div className="max-w-5xl mx-auto flex items-center justify-center gap-2.5 text-center">
              <ShieldAlert size={14} className="text-cyan-400 shrink-0 hidden sm:block" />
              <p className="text-[11px] text-slate-400">
                <span className="font-semibold text-slate-200">Materna CDSS</span> is an assistive decision-support tool. It does not diagnose, prescribe, or replace professional clinical judgment. Always consult a qualified healthcare provider.
              </p>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
