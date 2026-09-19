/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx}",
    "./components/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Poppins", "system-ui", "sans-serif"],
      },
      colors: {
        ink: "#2d2a3a",
        paper: "#faf8ff",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: 0, transform: "translateY(8px)" },
          "100%": { opacity: 1, transform: "translateY(0)" },
        },
        introFade: {
          "0%": { opacity: 0, transform: "scale(0.96)" },
          "15%": { opacity: 1, transform: "scale(1)" },
          "85%": { opacity: 1, transform: "scale(1)" },
          "100%": { opacity: 0, transform: "scale(1.02)" },
        },
        floatSlow: {
          "0%, 100%": { transform: "translate(0, 0)" },
          "50%": { transform: "translate(20px, -30px)" },
        },
        floatSlower: {
          "0%, 100%": { transform: "translate(0, 0)" },
          "50%": { transform: "translate(-25px, 20px)" },
        },
        colorWash: {
          "0%, 100%": { backgroundColor: "rgba(124,108,240,0.35)" },
          "33%": { backgroundColor: "rgba(255,196,140,0.3)" },
          "66%": { backgroundColor: "rgba(140,200,255,0.3)" },
        },
        drift: {
          "0%, 100%": { transform: "translate(0,0) scale(1)" },
          "50%": { transform: "translate(15px,-15px) scale(1.05)" },
        },
        floatUp: {
          "0%": { transform: "translateY(0) scale(1)", opacity: 0 },
          "10%": { opacity: 1 },
          "90%": { opacity: 1 },
          "100%": { transform: "translateY(-110vh) scale(1.15)", opacity: 0 },
        },
        floatUpDrift: {
          "0%": { transform: "translate(0, 0) scale(0.9)", opacity: 0 },
          "12%": { opacity: 1 },
          "50%": { transform: "translate(var(--dx, 20px), -55vh) scale(1.05)" },
          "88%": { opacity: 1 },
          "100%": { transform: "translate(calc(var(--dx, 20px) * 1.8), -110vh) scale(1.2)", opacity: 0 },
        },
        introGlow: {
          "0%, 100%": { color: "#f5eeff", textShadow: "0 0 22px rgba(216,180,254,0.55), 0 0 50px rgba(168,85,247,0.35)" },
          "50%": { color: "#e9d5ff", textShadow: "0 0 34px rgba(216,180,254,0.85), 0 0 70px rgba(168,85,247,0.55)" },
        },
        underlinePulse: {
          "0%, 100%": { opacity: 0.4, width: "3rem" },
          "50%": { opacity: 1, width: "5rem" },
        },
      },
      animation: {
        fadeIn: "fadeIn 0.4s ease-out both",
        introFade: "introFade 4s ease-in-out forwards",
        floatSlow: "floatSlow 7s ease-in-out infinite",
        floatSlower: "floatSlower 9s ease-in-out infinite",
        colorWash: "colorWash 8s ease-in-out infinite",
        drift: "drift 10s ease-in-out infinite",
        floatUp: "floatUp linear infinite",
        floatUpDrift: "floatUpDrift linear infinite",
        introGlow: "introGlow 3.2s ease-in-out infinite",
        underlinePulse: "underlinePulse 3.2s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
