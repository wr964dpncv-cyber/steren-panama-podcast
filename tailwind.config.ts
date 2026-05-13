import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: "#e30613",
          dark: "#b8050f",
        },
      },
    },
  },
  plugins: [],
};
export default config;
