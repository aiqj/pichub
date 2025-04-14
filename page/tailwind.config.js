/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      animation: {
        'float': 'float 3s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
      },
      boxShadow: {
        'glow': '0 0 10px rgba(139, 92, 246, 0.5)',
        'neon': '0 0 5px theme("colors.indigo.500"), 0 0 20px theme("colors.indigo.700")',
        'glow-light': '0 0 10px rgba(99, 102, 241, 0.4)',
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
      },
      colors: {
        'sci-fi': {
          'dark-bg': '#111827',
          'light-bg': '#f3f4f6',
          'dark-surface': '#1f2937',
          'light-surface': '#ffffff',
          'dark-border': '#374151',
          'light-border': '#e5e7eb',
        },
      },
    },
  },
  plugins: [],
};