# /Dockerfile
# ВЕРСИЯ "КОПИРУЕМ ГОТОВЫЙ DIST"

# --- СТАДИЯ 1: Бэкенд (остается без изменений) ---
FROM node:18-alpine AS backend-builder
WORKDIR /app
COPY backend/package*.json ./
RUN npm install --omit=dev
COPY backend/ .

# --- ФИНАЛЬНАЯ СТАДИЯ: Запускаем Бэкенд и Фронтенд ---
FROM node:18-alpine
WORKDIR /app

# Копируем файлы бэкенда, но не node_modules
COPY --from=backend-builder /app/backend/package*.json ./backend/
# Переустанавливаем зависимости в финальной стадии для корректной компиляции нативных модулей
RUN cd backend && npm install --omit=dev

# Копируем остальные файлы бэкенда
COPY --from=backend-builder /app/backend/. ./backend/

# Копируем ГОТОВЫЙ ФРОНТЕНД из папки frontend/dist в папку 'public'
COPY frontend/dist ./public

EXPOSE 3001
CMD [ "node", "backend/server.js" ]