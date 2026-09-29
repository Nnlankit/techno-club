/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Light Sand Palette remapping for base slate utility classes across all pages
        slate: {
          50: '#FAF7F2',   // Canvas / main background (light warm sand)
          100: '#F4EFE6',  // Secondary sand / input fields / hover / muted surfaces
          200: '#E8E1D5',  // Warm sand border
          300: '#D7CCBC',  // Stronger sand border / scrollbars
          400: '#A89C8A',  // Muted sand icon / placeholder
          500: '#7D7162',  // Secondary text / warm taupe
          600: '#5E5346',  // Deep warm taupe
          700: '#463C32',  // Dark taupe text
          800: '#2F2821',  // Espresso dark surface
          900: '#231D17',  // Deep espresso text / dark mode card
          950: '#17130F',  // Obsidian dark sand
        },
        // Dedicated sand color tokens
        sand: {
          50: '#FAF7F2',
          100: '#F4EFE6',
          200: '#E8E1D5',
          300: '#D7CCBC',
          400: '#A89C8A',
          500: '#7D7162',
          600: '#5E5346',
          700: '#463C32',
          800: '#2F2821',
          900: '#231D17',
          950: '#17130F',
        },
        // Warm sand-amber primary accent
        primary: {
          50: '#FDFBF7',
          100: '#F7F1E1',
          200: '#EEDFB9',
          300: '#E2CA8C',
          400: '#D4B05F',
          500: '#C0933C',
          600: '#A6792D',
          700: '#855C22',
          800: '#6E4B1F',
          900: '#5B3E1C',
          950: '#34210B',
        },
      },
    },
  },
  plugins: [],
}
