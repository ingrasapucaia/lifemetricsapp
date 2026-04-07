import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./pages/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
          dark: "hsl(var(--primary-dark))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },
        metric: {
          habits: "hsl(var(--metric-habits))",
          "habits-bg": "hsl(var(--metric-habits-bg))",
          sleep: "hsl(var(--metric-sleep))",
          "sleep-bg": "hsl(var(--metric-sleep-bg))",
          exercise: "hsl(var(--metric-exercise))",
          "exercise-bg": "hsl(var(--metric-exercise-bg))",
          water: "hsl(var(--metric-water))",
          "water-bg": "hsl(var(--metric-water-bg))",
          mood: "hsl(var(--metric-mood))",
          "mood-bg": "hsl(var(--metric-mood-bg))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "bounce-check": {
          "0%": { transform: "scale(1)" },
          "30%": { transform: "scale(1.3)" },
          "50%": { transform: "scale(0.9)" },
          "70%": { transform: "scale(1.1)" },
          "100%": { transform: "scale(1)" },
        },
        "draw-check": {
          "0%": { opacity: "0", transform: "scale(0.5)" },
          "50%": { opacity: "1", transform: "scale(1.2)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        "confetti-dot": {
          "0%": { transform: "translate(-50%, -50%) rotate(var(--angle)) translateY(0) scale(1)", opacity: "1" },
          "100%": { transform: "translate(-50%, -50%) rotate(var(--angle)) translateY(-18px) scale(0)", opacity: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "bounce-check": "bounce-check 0.4s ease-out",
        "draw-check": "draw-check 0.3s ease-out",
        "confetti-dot": "confetti-dot 0.6s ease-out forwards",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
