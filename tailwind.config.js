/** @type {import('tailwindcss').Config} */
export default {
    content: [
      "./index.html",
      "./src/**/*.{js,jsx,ts,tsx}"
    ],
    theme: {
      extend: {
        colors: {
          text: "#D3D0FB",
          background: "#01010C",
          accent: "#F9F9F9",
          primary: "#6865E7",
          secondary: "#4787F3"
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