import type { Metadata } from "next";
import { Inter } from "next/font/google";
import ProtectedRoute from "@/components/layout/ProtectedRoute";
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
        className={`${inter.variable} font-sans bg-surface text-slate-100 min-h-screen`}
      >
        {/* ── Animated Background Orbs ──────────────────── */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
          <div className="bg-orb bg-orb-brand w-[600px] h-[600px] -top-32 -left-32 animate-float opacity-10" />
          <div className="bg-orb bg-orb-violet w-[500px] h-[500px] top-1/3 right-0 animate-float-delayed opacity-10" />
          <div className="bg-orb bg-orb-pink w-[400px] h-[400px] bottom-0 left-1/3 animate-float-slow opacity-[0.07]" />
        </div>

        {/* ── Main Content ─────────────────────────────── */}
        <div className="relative z-10 min-h-screen flex flex-col">
          <main className="flex-1">
            <ProtectedRoute>{children}</ProtectedRoute>
          </main>

          {/* ── CDSS Disclaimer Footer ─────────────────── */}
          <footer className="cdss-disclaimer">
            <p>
              ⚕️ Materna is a{" "}
              <strong className="text-slate-400">
                Clinical Decision Support System (CDSS)
              </strong>
              . It does not diagnose, prescribe, or replace clinical judgment.
              Always consult a qualified healthcare provider.
            </p>
          </footer>
        </div>
      </body>
    </html>
  );
}
