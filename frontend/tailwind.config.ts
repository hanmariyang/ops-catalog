import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // 한마리양/하로 액센트
        haro: {
          50: "#fff7ed",
          500: "#f97316",
          600: "#ea580c",
        },
        // Tier 색
        tier1: "#3b82f6",
        tier2: "#10b981",
        tier3: "#8b5cf6",
        // Priority 색
        p0: "#dc2626",
        p1: "#f59e0b",
        p2: "#eab308",
        p3: "#94a3b8",
      },
      fontFamily: {
        sans: [
          "-apple-system", "BlinkMacSystemFont", "Apple SD Gothic Neo",
          "Noto Sans KR", "Segoe UI", "sans-serif",
        ],
      },
    },
  },
  plugins: [],
};

export default config;
