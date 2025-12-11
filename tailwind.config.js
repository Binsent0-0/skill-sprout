/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        sprout: {
          base: '#1a1a1a',    // Dark Charcoal (Softer than pure black)
          dark: '#0f0f0f',    // Deep Black (For footers/navs)
          primary: '#ff7e21', // Vibrant Orange (Main Buttons/Highlights)
          light: '#ffbf85',   // Apricot (Hover states/Accents)
          text: '#f3f4f6',    // Off-white text for dark backgrounds
        }
      }
    },
  },
  plugins: [],
}