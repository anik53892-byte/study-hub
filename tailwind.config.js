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
      },
      animation: {
        fadeIn: "fadeIn 0.4s ease-out both",
        introFade: "introFade 4s ease-in-out forwards",
      },
    },
  },
  plugins: [],
};
