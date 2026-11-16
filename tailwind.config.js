/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        lab: {
          bg: '#0B1120',
          surface: '#111827',
          elevated: '#1E293B',
          border: '#334155',
        },
        flux: '#06B6D4',
        emf: '#F59E0B',
        pole: {
          north: '#EF4444',
          south: '#3B82F6',
        },
        current: '#10B981',
      },
      fontFamily: {
        display: ['"Space Grotesk"', 'system-ui', 'sans-serif'],
        sans: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
    },
  },
  plugins: [],
};

