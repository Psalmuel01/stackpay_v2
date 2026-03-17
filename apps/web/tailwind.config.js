/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        bg: "#000",
        surface: "rgba(255,255,255,0.04)",
        "surface-strong": "rgba(255,255,255,0.08)",
        border: "rgba(255,255,255,0.08)",
        "border-strong": "rgba(255,255,255,0.16)",
        text: "#F5F5F5",
        muted: "#A3A3A3",
        "muted-2": "#7D7D7D"
      },
      fontFamily: {
        sans: ["var(--font-bricolage)", "ui-sans-serif", "system-ui"],
        mono: ["var(--font-mono)", "ui-monospace", "SFMono-Regular"]
      },
      boxShadow: {
        glow: "0 0 40px rgba(255,255,255,0.08)",
        card: "0 20px 60px rgba(0,0,0,0.45)"
      },
      keyframes: {
        "fade-in": {
          "0%": { opacity: "0", transform: "translateY(6px)" },
          "100%": { opacity: "1", transform: "translateY(0)" }
        },
        "float": {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-6px)" }
        },
        "shine": {
          "0%": { opacity: "0" },
          "30%": { opacity: "0.35" },
          "100%": { opacity: "0" }
        }
      },
      animation: {
        "fade-in": "fade-in 600ms ease-out both",
        float: "float 6s ease-in-out infinite",
        shine: "shine 2.8s ease-in-out infinite"
      }
    }
  },
  plugins: []
};
