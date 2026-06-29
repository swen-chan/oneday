/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        cream: "#FAF6EF",
        "warm-white": "#FFFDF8",
        "dawn-orange": "#F59E5B",
        "night-blue": "#1F2A44",
        "growth-green": "#4C7A5D",
        "soft-gold": "#CFAE67",
        "muted-text": "#6B625A",
      },
      fontFamily: {
        sans: [
          "-apple-system",
          "BlinkMacSystemFont",
          "PingFang SC",
          "Microsoft YaHei",
          "Helvetica Neue",
          "Arial",
          "sans-serif",
        ],
      },
    },
  },
  plugins: [],
};
