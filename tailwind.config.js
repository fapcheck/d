/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: "#0f1117",
        surface: "#161b22",
        surfaceHighlight: "#1f2430",
        primary: "#82aaff",
        secondary: "#636e88",
        accent: "#c792ea",
        success: "#c3e88d",
        warning: "#ffcb6b",
        error: "#ff5370",
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        zen: '0 4px 20px -2px rgba(0, 0, 0, 0.5)',
        glow: '0 0 15px rgba(130, 170, 255, 0.1)',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(5px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        }
      }
    },
  },
  plugins: [],
}