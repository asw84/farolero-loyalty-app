// frontend/vite.config.ts
// САМАЯ ЧИСТАЯ ВЕРСИЯ

import { defineConfig, loadEnv, PluginOption } from 'vite';
import react from '@vitejs/plugin-react';
import mkcert from 'vite-plugin-mkcert';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const useMkcert = env.DOCKER_ENV !== 'true';
  
  const plugins: PluginOption[] = [react()];
  
  // Добавляем mkcert, только если он нужен для локальной разработки
  if (useMkcert) {
    plugins.push(mkcert());
  }
  
  return {
    plugins: plugins,
    server: {
      port: 5173,
      host: '0.0.0.0'
      // Мы полностью убрали свойство `https`.
      // Плагин mkcert сам его добавит и настроит, когда будет активен.
    }
  };
});