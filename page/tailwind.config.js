/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "sans-serif"],
      },
      colors: {
        primary: "#f06292",
        "primary-hover": "#ec407a",
        secondary: "#66bb6a",
        "secondary-hover": "#4caf50",
        error: "#ff7043",
        warning: "#ffca28",
        "bg-pink": "#fce4ec",
        "text-brown": "#5d4037",
        "text-light": "#8d6e63",
        "border-pink": "#f8bbd0",
      },
      animation: {
        float: "float 3s ease-in-out infinite",
        pulse: "pulse 2s infinite",
        progress: "progress 1s linear infinite",
        scaleIn: "scaleIn 0.3s ease forwards",
        fadeOut: "fadeOut 0.3s ease forwards",
      },
      boxShadow: {
        card: "0 4px 15px rgba(240, 98, 146, 0.15)",
      },
      borderRadius: {
        card: "12px",
      },
    },
  },
  plugins: [],
} 