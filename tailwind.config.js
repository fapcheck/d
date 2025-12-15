/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Ультра-глубокий фон (Deep Charcoal)
        bg: "#0f1117", 
        // Основной слой (Dark Slate)
        surface: "#161b22", 
        // Второстепенный слой для ховеров
        surfaceHighlight: "#1f2430",
        
        // Спокойные, "пыльные" акценты
        primary: "#82aaff",   // Soft Blue
        secondary: "#636e88", // Muted Grey-Blue
        accent: "#c792ea",    // Dusty Purple
        success: "#c3e88d",   // Soft Mint
        warning: "#ffcb6b",   // Muted Gold
        error: "#ff5370",     // Soft Red
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'zen': '0 4px 20px -2px rgba(0, 0, 0, 0.5)',
        'glow': '0 0 15px rgba(130, 170, 255, 0.1)',
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