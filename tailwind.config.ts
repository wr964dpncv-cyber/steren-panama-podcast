import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{js,ts,jsx,tsx,mdx}", "./components/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#e6f7fc",
          100: "#c0eaf6",
          200: "#92dbef",
          300: "#5dc9e8",
          400: "#28b8e0",
          500: "#00B3E3",
          600: "#0095bf",
          700: "#00779b",
          800: "#005c78",
          900: "#003f54",
          DEFAULT: "#00B3E3",
          dark: "#0095bf",
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
        glow: "0 0 0 1px rgba(0,179,227,0.25), 0 8px 24px -8px rgba(0,179,227,0.55)",
      },
    },
  },
  plugins: [],
};
export default config;
