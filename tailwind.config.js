/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ashvin: {
          dark: '#121212',
          cyan: '#00f2ff',
        },
      },
    },
  },
  plugins: [],
}
