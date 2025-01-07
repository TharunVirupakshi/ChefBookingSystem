/** @type {import('tailwindcss').Config} */
const flowbitePlugin = require('flowbite/plugin')
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./node_modules/flowbite/**/*.js"
  ],
  theme: {
    extend: {
        fontFamily: {
          sans: ['Poppins', 'sans-serif'], 
          serif: ['serif'],
        },
    },
    
  },
  darkMode: 'selector',
  plugins: [
    flowbitePlugin
  ],
}

