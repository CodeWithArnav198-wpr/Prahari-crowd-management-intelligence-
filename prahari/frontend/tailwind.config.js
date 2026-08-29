/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        bg: "#0a0e13",
        panel: "#111820",
        panel2: "#0d1319",
        line: "#1f2b36",
        lineSoft: "#182129",
        textDim: "#7c8b9a",
        textFaint: "#4a5866",
        signal: "#45e0d4",
        signalDim: "#1d5f5c",
        amber: "#f5a623",
        amberDim: "#4a3714",
        red: "#ff5c5c",
        redDim: "#4a1c1c",
        green: "#3ee08a",
        greenDim: "#123a29",
      },
      fontFamily: {
        display: ["'Space Grotesk'", "sans-serif"],
        mono: ["'JetBrains Mono'", "monospace"],
        body: ["'Inter'", "sans-serif"],
      },
    },
  },
  plugins: [],
};
