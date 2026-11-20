/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: { brand: { black: '#111111', red: '#E5242A', white: '#FFFFFF', gray: '#F5F5F6' } },
      fontFamily: { sans: ['Inter', 'system-ui', 'Segoe UI', 'Roboto', 'Arial', 'sans-serif'] },
      boxShadow: { card: '0 2px 14px rgba(17,17,17,0.07)', lift: '0 12px 30px rgba(17,17,17,0.14)' },
      keyframes: { 'fade-up': { '0%': { opacity: '0', transform: 'translateY(12px)' }, '100%': { opacity: '1', transform: 'translateY(0)' } } },
      animation: { 'fade-up': 'fade-up .5s ease-out both' },
    },
  },
  plugins: [],
}
