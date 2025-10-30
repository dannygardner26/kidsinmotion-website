/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}", // Scan all JS/JSX/TS/TSX files in the src directory
    "./public/index.html"        // Scan the main HTML file
  ],
  theme: {
    extend: {
      colors: {
        'imperial-red': '#e64f50',
        'indigo-dye': '#2f506a',
        'isabelline': '#ede9e7',
        'primary': '#2f506a',
        'primary-light': '#3a6587',
        'secondary': '#e64f50',
        'secondary-light': '#eb7172',
      },
    },
  },
  plugins: [], // You can add Tailwind plugins here later
}
