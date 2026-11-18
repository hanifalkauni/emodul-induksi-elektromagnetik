/** @type {import('tailwindcss').Config} */
const shades = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950];
// Semua skala warna membaca CSS variable (src/theme-tokens.css) sehingga mode terang/gelap
// hanya perlu mengganti nilai variable pada class `.dark`.
const scale = (name) =>
  Object.fromEntries(shades.map((s) => [s, `rgb(var(--${name}-${s}) / <alpha-value>)`]));

export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        slate: scale('slate'),
        brand: scale('brand'),
        emerald: scale('emerald'),
        amber: scale('amber'),
        rose: scale('rose'),
        red: scale('red'),
        // Warna semantik fisika (dipakai pada simulasi SVG & legenda)
        flux: '#0891B2',
        emf: '#D97706',
        pole: {
          north: '#DC2626',
          south: '#2563EB',
        },
        current: '#059669',
      },
      fontFamily: {
        display: ['Outfit', 'system-ui', 'sans-serif'],
        sans: ['"Work Sans"', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      borderRadius: {
        card: '12px',
      },
    },
  },
  plugins: [],
};