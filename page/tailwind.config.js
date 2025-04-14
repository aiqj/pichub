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
        'float-slow': 'float 5s ease-in-out infinite',
        'float-reverse': 'float 4s ease-in-out infinite reverse',
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'pulse-fast': 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'shimmer': 'shimmer 2s infinite linear',
        'fade-scale-up': 'fadeScaleUp 0.3s ease-out forwards',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        fadeScaleUp: {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
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
      backgroundSize: {
        '200%': '200%',
      },
      skew: {
        '30': '30deg',
      },
    },
  },
  plugins: [],
};