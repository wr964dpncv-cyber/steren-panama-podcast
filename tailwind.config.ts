import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{js,ts,jsx,tsx,mdx}", "./components/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#fff1f2",
          100: "#ffe1e3",
          200: "#ffc8cc",
          300: "#ff9aa3",
          400: "#fb5d6c",
          500: "#e30613",
          600: "#c20410",
          700: "#a1040d",
          DEFAULT: "#e30613",
          dark: "#a1040d",
        },
        ink: {
          950: "#06070a",
          900: "#0c0e13",
          800: "#15171c",
          700: "#1f2229",
          600: "#2b2e36",
          500: "#3a3e47",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        display: ["var(--font-inter)", "system-ui", "sans-serif"],
      },
      boxShadow: {
        soft: "0 1px 3px rgba(0,0,0,0.04), 0 8px 24px -8px rgba(0,0,0,0.08)",
        glow: "0 0 0 1px rgba(227,6,19,0.25), 0 8px 24px -8px rgba(227,6,19,0.5)",
      },
    },
  },
  plugins: [],
};
export default config;
