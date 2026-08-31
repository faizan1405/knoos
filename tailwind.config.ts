/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          black: "#0a0a0a",
          white: "#fafafa",
          gray: {
            50: "#f9f9f9",
            100: "#f0f0f0",
            200: "#e4e4e4",
            300: "#c4c4c4",
            400: "#9a9a9a",
            500: "#6e6e6e",
            600: "#4a4a4a",
            700: "#2e2e2e",
            800: "#1a1a1a",
            900: "#0f0f0f",
          },
          accent: "#c8a96e",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        serif: ["var(--font-serif)", "Georgia", "serif"],
        mono: ["var(--font-mono)", "monospace"],
      },
    },
  },
  plugins: [],
};
