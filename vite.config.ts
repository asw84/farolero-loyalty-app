// vite.config.ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import mkcert from 'vite-plugin-mkcert' // Устанавливаем: npm install --save-dev vite-plugin-mkcert

export default defineConfig({
  plugins: [react(), mkcert()],
  server: {
    port: 5173,
    host: '0.0.0.0',
    // Настраиваем прокси для будущих запросов на наш бэкенд
    proxy: {
      '/api': {
        target: 'http://localhost:3001', // Адрес нашего будущего локального бэкенд-сервера
        changeOrigin: true,
      },
    },
  },
})