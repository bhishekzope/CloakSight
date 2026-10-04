/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        navy: {
          950: "#060A13",
          900: "#0B1120",
          850: "#0E1729",
          800: "#131F37",
          700: "#1E2D4A",
          600: "#2A3D63",
        },
        slate: {
          950: "#030712",
        },
        shield: {
          blue: "#3B82F6",
          teal: "#14B8A6",
          cyan: "#06B6D4",
          green: "#10B981",
          amber: "#F59E0B",
          red: "#EF4444",
        }
      },
      fontFamily: {
        sans: ["Inter", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "sans-serif"],
        mono: ["JetBrains Mono", "Fira Code", "Courier New", "monospace"],
      },
      keyframes: {
        pulseBorder: {
          '0%, 100%': { borderColor: 'rgba(59, 130, 246, 0.4)' },
          '50%': { borderColor: 'rgba(20, 184, 166, 0.9)' },
        },
        scanner: {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(1000%)' },
        }
      },
      animation: {
        'pulse-border': 'pulseBorder 2.5s infinite',
        'scanner': 'scanner 3s linear infinite',
      }
    },
  },
  plugins: [],
};
