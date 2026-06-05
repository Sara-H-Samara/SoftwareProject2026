/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        gallery: {
          50: '#f5f3ff',
          100: '#ede9fe',
          200: '#ddd6fe',
          300: '#c4b5fd',
          400: '#a78bfa',
          500: '#8b5cf6',
          600: '#7c3aed',
          700: '#6d28d9',
          800: '#5b21b6',
          900: '#4c1d95',
          950: '#2e1065',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Playfair Display', 'Georgia', 'serif'],
      },
      boxShadow: {
        'card': '0 1px 3px rgba(0,0,0,0.1), 0 4px 16px rgba(0,0,0,0.05)',
        'card-hover': '0 8px 25px rgba(0,0,0,0.1), 0 0 0 1px rgba(139,92,246,0.1)',
        'gallery': '0 4px 14px rgba(139,92,246,0.2)',
      },
      animation: {
        'fade-in': 'fadeIn 0.4s ease-out',
        'slide-up': 'slideUp 0.4s ease-out',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float-up': 'floatUp 2s ease-out forwards',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        floatUp: {
          '0%': { transform: 'translateY(0)', opacity: '1' },
          '100%': { transform: 'translateY(-80px)', opacity: '0' },
        },
      },
      backgroundImage: {
        'gallery-gradient': 'linear-gradient(135deg, #f5f3ff 0%, #ede9fe 40%, #fef9c3 100%)',
        'dark-gradient': 'linear-gradient(135deg, #0f0f12 0%, #1a1a24 100%)',
      },
    },
  },
  plugins: [],
}