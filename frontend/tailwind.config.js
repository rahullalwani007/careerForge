/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class', // the app toggles a `dark` class on <html> (see AppContext.jsx); without this, Tailwind's dark: variants would only follow OS preference and never match the in-app toggle
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['"Plus Jakarta Sans"', 'Inter', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      colors: {
        primary: {
          50:  '#eef2ff',
          100: '#e0e7ff',
          200: '#c7d2fe',
          300: '#a5b4fc',
          400: '#818cf8',
          500: '#6366f1',
          600: '#4f46e5',
          700: '#4338ca',
          800: '#3730a3',
          900: '#312e81',
        },
      },
      animation: {
        'fade-in': 'fadeIn .5s ease both',
        'fade-up': 'fadeUp .6s ease both',
        'slide-in': 'slideIn .4s cubic-bezier(.16,1,.3,1) both',
        'count-in': 'countIn .5s ease both',
        'breathe': 'breathe 3s ease-in-out infinite',
        'float': 'float 6s ease-in-out infinite',
        'shimmer': 'shimmer 3s ease infinite',
        'spin-slow': 'spin 20s linear infinite',
        'ping-slow': 'ping 3s cubic-bezier(0,0,.2,1) infinite',
      },
      keyframes: {
        fadeIn:   { from:{ opacity:0 }, to:{ opacity:1 } },
        fadeUp:   { from:{ opacity:0, transform:'translateY(20px)' }, to:{ opacity:1, transform:'translateY(0)' } },
        slideIn:  { from:{ opacity:0, transform:'translateY(12px)' }, to:{ opacity:1, transform:'translateY(0)' } },
        countIn:  { from:{ opacity:0, transform:'translateY(8px)' }, to:{ opacity:1, transform:'translateY(0)' } },
        breathe:  { '0%,100%':{ transform:'scale(1)' }, '50%':{ transform:'scale(1.06)' } },
        float:    { '0%,100%':{ transform:'translateY(0)' }, '50%':{ transform:'translateY(-8px)' } },
        shimmer:  { '0%,100%':{ backgroundPosition:'0% 50%' }, '50%':{ backgroundPosition:'100% 50%' } },
      },
      boxShadow: {
        'card': '0 1px 3px rgba(79,70,229,0.04), 0 4px 16px rgba(79,70,229,0.06)',
        'card-hover': '0 4px 24px rgba(79,70,229,0.1), 0 1px 6px rgba(79,70,229,0.04)',
        'primary': '0 4px 14px rgba(79,70,229,0.35)',
        'primary-lg': '0 8px 28px rgba(79,70,229,0.45)',
      },
    },
  },
  plugins: [],
}
