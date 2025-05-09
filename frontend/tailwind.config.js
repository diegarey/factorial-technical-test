/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#EC1848',
          dark: '#D30D3B',
          light: '#FF4E74',
        },
        secondary: {
          DEFAULT: '#2D2D2D',
          dark: '#1A1A1A',
          light: '#555555',
        },
        background: {
          cream: '#FFF6E9',
        },
        factorialGray: '#F5F5F5',
      },
      boxShadow: {
        'factorial': '0 4px 10px rgba(0, 0, 0, 0.05)',
      },
      borderRadius: {
        'factorial': '8px',
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
  ],
} 