import type { Config } from "tailwindcss";
import { fontFamily } from "tailwindcss/defaultTheme";

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
        // Mealtap brand colours
        forest: {
          DEFAULT: "#2D5A27",
          dark: "#1F3F1B",
          light: "#E8F3EC",
        },
        terra: {
          DEFAULT: "#C8622A",
          dark: "#A14F1F",
          light: "#FBEFE6",
        },
        cream: "#F5F5F0",
        ink: "#1A1A1A",
        muted: "#6B6B6B",
        line: "#E5E5E0",
      },
      fontFamily: {
        sans: ["var(--font-poppins)", ...fontFamily.sans],
      },
    },
  },
  plugins: [],
};
export default config;
