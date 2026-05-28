/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ['Cinzel', 'serif'],
        body: ['Lora', 'serif'],
      },
      colors: {
        maleficent: { DEFAULT: '#4B0082', light: '#7B2FBE', dark: '#2D0050' },
        jafar:      { DEFAULT: '#8B1A00', light: '#BF3A00', dark: '#5C1000' },
        hook:       { DEFAULT: '#1B3A6B', light: '#2E5FA3', dark: '#0F2040' },
        ursula:     { DEFAULT: '#2D1B69', light: '#4A2EA8', dark: '#1A0F40' },
        princejohn: { DEFAULT: '#7B6000', light: '#B89000', dark: '#4A3A00' },
        queens:     { DEFAULT: '#8B0000', light: '#CC0000', dark: '#5C0000' },
      },
    },
  },
  plugins: [],
}
