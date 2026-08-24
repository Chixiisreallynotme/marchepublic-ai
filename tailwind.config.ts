import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        border: "var(--border)",
        background: "var(--background)",
        foreground: "var(--foreground)",
        muted: {
          DEFAULT: "var(--muted)",
          foreground: "var(--muted-foreground)",
        },
        card: {
          DEFAULT: "var(--card)",
          foreground: "var(--card-foreground)",
        },
        brand: {
          50: "#eef4ff",
          100: "#dce7fe",
          200: "#c0d3fd",
          300: "#94b5fb",
          400: "#618df7",
          500: "#3d67f2",
          600: "#2747e7",
          700: "#1f36d4",
          800: "#202fab",
          900: "#1f2d87",
          950: "#171d51",
        },
        surface: {
          50: "#f8fafc",
          100: "#f1f5f9",
          800: "#1a2233",
          900: "#0f1626",
          950: "#080d18",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
        display: ["var(--font-display)", "Georgia", "serif"],
      },
      boxShadow: {
        glow: "0 0 40px -12px rgba(61, 103, 242, 0.45)",
        card: "0 1px 2px rgba(15, 22, 38, 0.06), 0 8px 24px -12px rgba(15, 22, 38, 0.18)",
      },
      keyframes: {
        "fade-up": {
          from: { opacity: "0", transform: "translateY(16px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.7s ease-out both",
      },
    },
  },
  plugins: [],
};

export default config;
