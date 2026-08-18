import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/lib/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
      },
      colors: {
        // ─── Base Surfaces ─────────────────────────
        surface: {
          DEFAULT: "#0a0e1a",
          50: "#f0f4ff",
          100: "#dbe4ff",
          200: "#1e293b",
          300: "#162032",
          400: "#111827",
          500: "#0d1321",
          600: "#0a0e1a",
          700: "#070b14",
          800: "#05080f",
          900: "#030509",
        },
        // ─── Glass ─────────────────────────────────
        glass: {
          DEFAULT: "rgba(255, 255, 255, 0.05)",
          light: "rgba(255, 255, 255, 0.08)",
          medium: "rgba(255, 255, 255, 0.12)",
          heavy: "rgba(255, 255, 255, 0.18)",
          border: "rgba(255, 255, 255, 0.10)",
          "border-light": "rgba(255, 255, 255, 0.15)",
        },
        // ─── Brand Accent (Teal → Violet) ──────────
        brand: {
          50: "#ecfeff",
          100: "#cffafe",
          200: "#a5f3fc",
          300: "#67e8f9",
          400: "#22d3ee",
          500: "#06b6d4",
          600: "#0891b2",
          700: "#0e7490",
          800: "#155e75",
          900: "#164e63",
        },
        // ─── Medical Alert: LOW / STABLE ───────────
        alert: {
          green: {
            DEFAULT: "#10b981",
            light: "#34d399",
            dark: "#059669",
            bg: "rgba(16, 185, 129, 0.12)",
            border: "rgba(16, 185, 129, 0.25)",
            glow: "rgba(16, 185, 129, 0.40)",
          },
          // ─── Medical Alert: MONITOR ──────────────
          yellow: {
            DEFAULT: "#f59e0b",
            light: "#fbbf24",
            dark: "#d97706",
            bg: "rgba(245, 158, 11, 0.12)",
            border: "rgba(245, 158, 11, 0.25)",
            glow: "rgba(245, 158, 11, 0.40)",
          },
          // ─── Medical Alert: CLINICAL REVIEW ──────
          orange: {
            DEFAULT: "#f97316",
            light: "#fb923c",
            dark: "#ea580c",
            bg: "rgba(249, 115, 22, 0.12)",
            border: "rgba(249, 115, 22, 0.25)",
            glow: "rgba(249, 115, 22, 0.40)",
          },
          // ─── Medical Alert: HIGH PRIORITY ────────
          red: {
            DEFAULT: "#ef4444",
            light: "#f87171",
            dark: "#dc2626",
            bg: "rgba(239, 68, 68, 0.12)",
            border: "rgba(239, 68, 68, 0.25)",
            glow: "rgba(239, 68, 68, 0.40)",
          },
        },
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-brand":
          "linear-gradient(135deg, #06b6d4 0%, #8b5cf6 50%, #ec4899 100%)",
        "gradient-brand-subtle":
          "linear-gradient(135deg, rgba(6,182,212,0.15) 0%, rgba(139,92,246,0.15) 50%, rgba(236,72,153,0.08) 100%)",
        "gradient-dark":
          "linear-gradient(180deg, #0a0e1a 0%, #111827 50%, #0d1321 100%)",
        "gradient-glass":
          "linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.02) 100%)",
        "gradient-green":
          "linear-gradient(135deg, rgba(16,185,129,0.2) 0%, rgba(16,185,129,0.05) 100%)",
        "gradient-yellow":
          "linear-gradient(135deg, rgba(245,158,11,0.2) 0%, rgba(245,158,11,0.05) 100%)",
        "gradient-orange":
          "linear-gradient(135deg, rgba(249,115,22,0.2) 0%, rgba(249,115,22,0.05) 100%)",
        "gradient-red":
          "linear-gradient(135deg, rgba(239,68,68,0.2) 0%, rgba(239,68,68,0.05) 100%)",
      },
      boxShadow: {
        glass: "0 8px 32px rgba(0, 0, 0, 0.3)",
        "glass-sm": "0 4px 16px rgba(0, 0, 0, 0.2)",
        "glass-lg": "0 16px 48px rgba(0, 0, 0, 0.4)",
        "glow-brand": "0 0 20px rgba(6, 182, 212, 0.3)",
        "glow-green": "0 0 20px rgba(16, 185, 129, 0.35)",
        "glow-yellow": "0 0 20px rgba(245, 158, 11, 0.35)",
        "glow-orange": "0 0 20px rgba(249, 115, 22, 0.35)",
        "glow-red": "0 0 20px rgba(239, 68, 68, 0.35)",
        "glow-red-intense": "0 0 40px rgba(239, 68, 68, 0.5)",
        "inner-glow": "inset 0 1px 0 rgba(255, 255, 255, 0.05)",
      },
      animation: {
        "pulse-glow": "pulse-glow 2s ease-in-out infinite",
        "pulse-glow-red": "pulse-glow-red 1.5s ease-in-out infinite",
        "slide-in-right": "slide-in-right 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
        "slide-in-up": "slide-in-up 0.5s cubic-bezier(0.16, 1, 0.3, 1)",
        "fade-in": "fade-in 0.4s ease-out",
        "fade-in-up": "fade-in-up 0.6s cubic-bezier(0.16, 1, 0.3, 1)",
        float: "float 6s ease-in-out infinite",
        "float-delayed": "float 6s ease-in-out 2s infinite",
        "float-slow": "float 8s ease-in-out 1s infinite",
        shimmer: "shimmer 2s linear infinite",
        typewriter: "typewriter 0.05s steps(1) infinite",
        "spin-slow": "spin 8s linear infinite",
        "heartbeat": "heartbeat 1.5s ease-in-out infinite",
      },
      keyframes: {
        "pulse-glow": {
          "0%, 100%": { opacity: "0.6" },
          "50%": { opacity: "1" },
        },
        "pulse-glow-red": {
          "0%, 100%": {
            opacity: "0.7",
            boxShadow: "0 0 20px rgba(239, 68, 68, 0.3)",
          },
          "50%": {
            opacity: "1",
            boxShadow: "0 0 40px rgba(239, 68, 68, 0.6)",
          },
        },
        "slide-in-right": {
          "0%": { transform: "translateX(20px)", opacity: "0" },
          "100%": { transform: "translateX(0)", opacity: "1" },
        },
        "slide-in-up": {
          "0%": { transform: "translateY(20px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        "fade-in-up": {
          "0%": { transform: "translateY(12px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-20px)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        typewriter: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        heartbeat: {
          "0%, 100%": { transform: "scale(1)" },
          "14%": { transform: "scale(1.1)" },
          "28%": { transform: "scale(1)" },
          "42%": { transform: "scale(1.1)" },
          "70%": { transform: "scale(1)" },
        },
      },
      borderRadius: {
        "2xl": "1rem",
        "3xl": "1.5rem",
        "4xl": "2rem",
      },
    },
  },
  plugins: [],
};
export default config;
