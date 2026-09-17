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
      },
      animation: {
        fadeIn: "fadeIn 0.4s ease-out both",
        introFade: "introFade 4s ease-in-out forwards",
        floatSlow: "floatSlow 7s ease-in-out infinite",
        floatSlower: "floatSlower 9s ease-in-out infinite",
        colorWash: "colorWash 8s ease-in-out infinite",
        drift: "drift 10s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
