/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      screens: {
        xs: '360px', // Mobile-first radical
      },
      colors: {
        brand: {
          primary: '#10B981', // Emerald 500 - Main actions, CTAs
          'primary-dark': '#059669', // Emerald 600 - Hover states
          'primary-light': '#34D399', // Emerald 400 - Accents
          secondary: '#334155', // Slate 700 - Text, borders
          'secondary-light': '#475569', // Slate 600 - Muted text
          accent: '#D1FAE5', // Emerald 100 - Light backgrounds
        },
      },
    },
  },
  plugins: [],
};
