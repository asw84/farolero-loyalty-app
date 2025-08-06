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

# Копируем готовый бэкенд из стадии сборки
COPY --from=backend-builder /app .

# Копируем ГОТОВЫЙ ФРОНТЕНД из папки frontend/dist в папку 'public'
COPY frontend/dist ./public

EXPOSE 3001
CMD [ "node", "server.js" ]