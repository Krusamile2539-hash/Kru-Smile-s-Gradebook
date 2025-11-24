/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Mali', 'cursive'],
        display: ['Mali', 'cursive'],
      },
      colors: {
        cream: '#FFFDF7',
        peach: '#FFB5A7',
        mint: '#9BF6FF',
        lemon: '#FDFFB6',
        sky: '#A0C4FF',
        rose: '#FFC6FF',
        lavender: '#BDB2FF',
        dark: '#545454',
      },
      borderRadius: {
        'bubble': '2.5rem',
      },
      boxShadow: {
        'soft': '0 8px 20px rgba(149, 157, 165, 0.1)',
        'pop': '4px 4px 0px 0px rgba(0,0,0,0.1)',
        'pop-hover': '6px 6px 0px 0px rgba(0,0,0,0.1)',
      }
    },
  },
  plugins: [],
}