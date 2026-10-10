/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        resq: {
          blue: '#0284c7',
          dark: '#0f172a',
          red: '#dc2626',
          amber: '#d97706',
          emerald: '#059669',
        }
      }
    },
  },
  plugins: [],
}
