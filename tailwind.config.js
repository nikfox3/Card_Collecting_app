/** @type {import('tailwindcss').Config} */
export default {
    content: [
      "./index.html",
      "./src/**/*.{js,jsx,ts,tsx}"
    ],
    darkMode: 'class', // Enable class-based dark mode
    theme: {
      extend: {
        colors: {
          // Use CSS variables for theme-aware colors
          text: {
            DEFAULT: "var(--text-primary)",
          },
          background: {
            DEFAULT: "var(--bg-primary)",
          },
          accent: {
            DEFAULT: "var(--text-primary)",
          },
          primary: "#6865E7",
          secondary: "#4787F3",
        },
        fontFamily: {
          sans: [
            "Inter",
            "-apple-system",
            "BlinkMacSystemFont",
            "Segoe UI",
            "Roboto",
            "Helvetica Neue",
            "Arial",
            "sans-serif"
          ]
        }
      }
    },
    plugins: []
  }