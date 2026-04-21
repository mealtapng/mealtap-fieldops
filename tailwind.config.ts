import type { Config } from "tailwindcss";
import { fontFamily } from "tailwindcss/defaultTheme";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // shadcn/ui CSS variable mappings
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        // ── PowerChat brand — matches powerchat.ng ────────────────────────────
        brand: {
          DEFAULT: "#1B5E20",   // green-deep
          dark:    "#0D1B0E",   // near-black green (footer / hero dark)
          light:   "#E8F5E9",   // green-pale
        },
        success: {
          DEFAULT: "#25D366",   // WhatsApp green (primary CTA)
          dark:    "#128C7E",   // WhatsApp dark
          light:   "#DCF8C6",   // bubble green / success bg
        },
        gold: {
          DEFAULT: "#F9A825",   // gold accent
          dark:    "#F57F17",
          light:   "#FFF8E1",
        },
        cream:      "#fafdfb",  // off-white with green tint (body bg)
        ink:        "#1a2e1b",  // primary text (dark green-black)
        "muted-brand": "#4a6b4c", // secondary text
        line:       "#d4e6d5",  // borders / dividers (green-tinted)
        muted: {
          DEFAULT:    "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
          brand:      "#4a6b4c",
        },
      },
      fontFamily: {
        sans:    ["var(--font-jakarta)", ...fontFamily.sans],
        display: ["var(--font-bricolage)", ...fontFamily.sans],
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
    },
  },
  plugins: [],
};
export default config;
