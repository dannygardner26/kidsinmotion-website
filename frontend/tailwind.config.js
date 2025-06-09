/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}", // Scan all JS/JSX/TS/TSX files in the src directory
    "./public/index.html"        // Scan the main HTML file
  ],
  theme: {
    extend: {}, // You can add custom theme settings here later
  },
  plugins: [], // You can add Tailwind plugins here later
}
