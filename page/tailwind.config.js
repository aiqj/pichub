/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './pages/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
    './app/**/*.{js,ts,jsx,tsx}'
  ],
  theme: {
    extend: {
      colors: {
        zinc: {
          900: '#18181b',
          800: '#27272a',
          700: '#3f3f46',
          600: '#52525b',
          500: '#71717a',
          400: '#a1a1aa',
          300: '#d4d4d8',
          200: '#e4e4e7',
          100: '#f4f4f5',
          50: '#fafafa'
        },
        purple: {
          900: '#581c87',
          800: '#6b21a8',
          700: '#7e22ce',
          600: '#9333ea',
          500: '#a855f7',
          400: '#c084fc',
          300: '#d8b4fe'
        },
        red: {
          900: '#7f1d1d',
          800: '#991b1b',
          600: '#dc2626',
          500: '#ef4444',
          400: '#f87171'
        },
        green: {
          900: '#14532d',
          800: '#166534',
          600: '#16a34a',
          500: '#22c55e',
          400: '#4ade80'
        },
        amber: {
          900: '#78350f',
          800: '#92400e',
          600: '#d97706',
          500: '#f59e0b',
          400: '#fbbf24'
        },
        orange: {
          600: '#ea580c',
          500: '#f97316'
        },
        blue: {
          900: '#1e3a8a',
          800: '#1e40af',
          600: '#2563eb',
          500: '#3b82f6',
          400: '#60a5fa'
        },
        cyan: {
          600: '#0891b2',
          500: '#06b6d4'
        },
        emerald: {
          600: '#059669',
          500: '#10b981'
        }
      },
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
        'neon': '0 0 5px theme("colors.purple.500"), 0 0 20px theme("colors.purple.700")',
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
      }
    },
  },
  plugins: [],
};