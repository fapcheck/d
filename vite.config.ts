import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  
  // 1. Tauri ожидает фиксированный порт, иначе скрипт инициализации не найдет его
  clearScreen: false,
  
  // 2. Tauri веб-вью работает лучше, если переменные окружения доступны
  envPrefix: ['VITE_', 'TAURI_'],
  
  server: {
    port: 5173,
    strictPort: true, // Vite не должен менять порт, если 5173 занят
    watch: {
      // 3. Игнорируем папку src-tauri при горячей перезагрузке веб-части
      ignored: ["**/src-tauri/**"],
    },
  },
  
  build: {
    // 4. Tauri поддерживает современные браузерные функции, можно не минимизировать слишком сильно
    target: process.env.TAURI_PLATFORM == "windows" ? "chrome105" : "safari13",
    minify: !process.env.TAURI_DEBUG ? "esbuild" : false,
    sourcemap: !!process.env.TAURI_DEBUG,
  },
})