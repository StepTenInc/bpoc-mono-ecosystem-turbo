import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      fontFamily: {
        sans: ["var(--font-geist-sans)", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["var(--font-geist-mono)", "ui-monospace", "SFMono-Regular", "monospace"],
      },
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        // BPOC Core Backgrounds
        "bpoc-primary": "#0B0B0D", // Almost Black
        "bpoc-secondary": "#0F1419", // Darker Grey/Blue
        "bpoc-tertiary": "#1A1F2E", // Deep Blue/Grey
        
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
        // BPOC.IO Custom Colors (From Design Polish Guide)
        // Primary Brand - Orange
        "orange-500": "#F97316",
        "orange-600": "#EA580C",
        "orange-700": "#C2410C",
        
        // Secondary Brand - Cyan
        "cyan-400": "#22D3EE",
        "cyan-500": "#0EA5E9",
        "cyan-600": "#0284C7",
        
        // Accent - Electric Purple
        "purple-400": "#C084FC",
        "purple-500": "#A855F7",
        "purple-600": "#9333EA",
        
        // Success - Neon Green
        "green-400": "#4ADE80",
        "green-500": "#10B981",
        "green-600": "#059669",
        
        // Warning - Yellow
        "yellow-400": "#FACC15",
        "yellow-500": "#EAB308",
        
        // Error - Red
        "red-400": "#F87171",
        "red-500": "#EF4444",
        "red-600": "#DC2626",
        
        // Legacy support (mapping to new palette)
        "cyber-blue": "#0EA5E9",
        "electric-purple": "#A855F7", 
        "neon-green": "#10B981",
        "bpoc-red": "#EF4444",
      },
      backgroundImage: {
        'glass-gradient': 'linear-gradient(145deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.01) 100%)',
        'cyber-grid': "url('/images/grid-pattern.svg')",
      },
      backgroundSize: {
        '200': '200% 200%',
      },
      boxShadow: {
        'neon-blue': '0 0 20px -5px rgba(14, 165, 233, 0.5)',
        'neon-purple': '0 0 20px -5px rgba(168, 85, 247, 0.5)',
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
        "gradient-shift": {
          "0%, 100%": { backgroundPosition: "0% 50%" },
          "50%": { backgroundPosition: "100% 50%" },
        },
        "shimmer": {
          "0%": { transform: "translateX(-100%)" },
          "100%": { transform: "translateX(100%)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "gradient-shift": "gradient-shift 3s ease infinite",
        "gradient": "gradient-shift 3s ease infinite",
        "shimmer": "shimmer 2s infinite",
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;