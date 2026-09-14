/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx}",
    "./components/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          DEFAULT: "#00335e",
          50: "#e6edf3",
          100: "#c2d3e2",
          300: "#5c85ab",
          500: "#0a4a7d",
          700: "#00335e",
          800: "#022544",
          900: "#01192f",
          950: "#000d19",
        },
        brine: "#052033",
        seagreen: {
          DEFAULT: "#8ac640",
          400: "#a3d966",
          600: "#6ba62c",
        },
        chart: {
          paper: "#f4f0e4",
          line: "#0a4a7d",
        },
        amber: {
          signal: "#e8a33d",
        },
        coral: {
          signal: "#c1462f",
        },
      },
      fontFamily: {
        display: ["'Fraunces'", "serif"],
        mono: ["'IBM Plex Mono'", "monospace"],
        sans: ["'Inter'", "sans-serif"],
      },
      backgroundImage: {
        "chart-grid":
          "linear-gradient(rgba(10,74,125,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(10,74,125,0.08) 1px, transparent 1px)",
      },
      backgroundSize: {
        chart: "24px 24px",
      },
    },
  },
  plugins: [],
};
