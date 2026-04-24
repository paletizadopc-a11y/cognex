/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Paleta Corporativa Softys - Proyecto Cognex
        primary: {
          DEFAULT: '#4A008B',
          dark: '#38006B',
          light: '#F3E8FF',
          hover: '#E0B3FF',
        },
        secondary: '#7B1FA2',
        accent: '#0AE8C6', // Turquesa para éxitos/validaciones
        industrial: {
          dark: '#2C0140',    // Fondos de Header/Sidebar
          text: '#343A40',    // Texto principal
          muted: '#555555',   // Texto secundario
          border: '#e6e6e6',
        }
      },
      fontFamily: {
        // Inter Tight para títulos, Hanken Grotesk para lectura de datos
        inter: ['"Inter Tight"', 'sans-serif'],
        hanken: ['"Hanken Grotesk"', 'sans-serif'],
      },
      boxShadow: {
        'soft': '0 2px 10px rgba(0,0,0,.08)',
        'industrial': '0 8px 22px rgba(0,0,0,.14)',
      }
    },
  },
  plugins: [],
}