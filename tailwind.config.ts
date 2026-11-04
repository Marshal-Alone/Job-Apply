import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#0F172A",
          hover: "#1E293B",
          light: "#334155",
        },
        accent: {
          DEFAULT: "#2563EB",
          hover: "#1D4ED8",
          subtle: "#EFF6FF",
          dark: "#3B82F6",
        },
        applied: {
          DEFAULT: "#10B981",
          hover: "#059669",
          subtle: "#ECFDF5",
          border: "#A7F3D0",
          text: "#065F46",
        },
        surface: {
          DEFAULT: "#FFFFFF",
          subtle: "#F8FAFC",
          dark: "#0B0F17",
          cardDark: "#131B2E",
          cardBorder: "#E2E8F0",
          cardBorderDark: "#1E293B",
        },
      },
      borderRadius: {
        sm: "6px",
        md: "10px",
        lg: "16px",
        xl: "20px",
      },
      boxShadow: {
        card: "0 1px 3px 0 rgba(0, 0, 0, 0.05), 0 1px 2px -1px rgba(0, 0, 0, 0.05)",
        cardHover: "0 12px 24px -4px rgba(0, 0, 0, 0.08), 0 6px 12px -4px rgba(0, 0, 0, 0.04)",
        appliedGlow: "0 0 15px rgba(16, 185, 129, 0.35)",
      },
    },
  },
  plugins: [],
};
export default config;
