/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#f8fafc', // pale gray page background
        surface: '#ffffff', // white sidebar and content cards
        navy: {
          900: '#0f172a', // deep navy text
          800: '#1e293b',
          700: '#334155',
          600: '#475569',
        },
        brand: {
          50: '#eef2ff',
          100: '#e0e7ff',
          500: '#6366f1',
          600: '#4f46e5', // indigo primary
          700: '#4338ca',
        },
        incoming: {
          light: '#ecfdf5',
          DEFAULT: '#10b981', // mint green / emerald
          dark: '#059669',
        },
        outgoing: {
          light: '#fff1f2',
          DEFAULT: '#f43f5e', // muted red / rose
          dark: '#e11d48',
        },
      },
    },
  },
  plugins: [],
}
