/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        serif: ['Merriweather', 'Georgia', 'serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      colors: {
        arid: {
          50:  '#f0f4ff',
          100: '#e0eaff',
          200: '#c2d4ff',
          300: '#93b4fe',
          400: '#608afb',
          500: '#3b63f8',
          600: '#2545ee',
          700: '#1d35db',
          800: '#1e2db2',
          900: '#1e2b8c',
          950: '#161c55',
        },
        surface: {
          50:  '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#1e293b',
          850: '#162032',
          900: '#0f172a',
          950: '#080f1d',
        },
        accent: {
          teal:   '#2dd4bf',
          purple: '#a78bfa',
          amber:  '#fbbf24',
          rose:   '#fb7185',
          green:  '#34d399',
        },
      },
      backgroundImage: {
        'gradient-hero': 'linear-gradient(135deg, #0f172a 0%, #1e2b8c 50%, #0f172a 100%)',
        'gradient-card': 'linear-gradient(145deg, rgba(30,41,59,0.8), rgba(15,23,42,0.9))',
        'gradient-accent': 'linear-gradient(135deg, #3b63f8, #a78bfa)',
      },
      boxShadow: {
        'card': '0 4px 24px rgba(0,0,0,0.25)',
        'glow': '0 0 20px rgba(59,99,248,0.4)',
        'glow-sm': '0 0 10px rgba(59,99,248,0.2)',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'slide-up': 'slideUp 0.4s ease-out',
        'pulse-slow': 'pulse 3s infinite',
        'spin-slow': 'spin 8s linear infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(16px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}
