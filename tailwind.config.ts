import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        fmc: {
          blue: "#256BF5",
          darkblue: "#1D4ED8",
          yellow: "#FFC800",
          amber: "#F59E0B",
          green: "#10B981",
          red: "#EF4444",
          light: "#EDF4FF",
          border: "#D6E6FE",
        }
      },
      fontFamily: {
        sans: ["var(--font-outfit)", "sans-serif"],
      },
    },
  },
  plugins: [],
};
export default config;
