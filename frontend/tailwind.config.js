/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/pages/**/*.{js,ts,jsx,tsx}", "./src/components/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        obsidienne: "#0D0D12",
        "obsidienne-light": "#17171F",
        champagne: "#C9A84C",
        "champagne-dark": "#A9873A",
        ivoire: "#FAF8F5",
      },
      fontFamily: {
        display: ['"Playfair Display"', "serif"],
        landing: ['"Playfair Display"', "serif"],
        sans: ['"Manrope"', "sans-serif"],
        "landing-sans": ['"Manrope"', "sans-serif"],
      },
    },
  },
  plugins: [],
};
