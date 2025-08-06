# /Dockerfile
# ФИНАЛЬНАЯ ВЕРСИЯ С ИСПРАВЛЕНИЕМ ПРАВ ДОСТУПА

# --- СТАДИЯ 1: Сборка Фронтенда ---
FROM node:16 AS frontend-builder
WORKDIR /app
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ .

# --- КЛЮЧЕВОЕ ИСПРАВЛЕНИЕ ---
# Рекурсивно даем права на исполнение для папки с бинарниками npm
RUN chmod -R +x node_modules/.bin
# --------------------------

RUN npm run build

# --- СТАДИЯ 2: Сборка Бэкенда ---
FROM node:18-alpine AS backend-builder
WORKDIR /app
COPY backend/package*.json ./
RUN npm install --omit=dev
COPY backend/ .

# --- ФИНАЛЬНАЯ СТАДИЯ: Запускаем Бэкенд ---
FROM node:18-alpine
WORKDIR /app
COPY --from=backend-builder /app .
COPY --from=frontend-builder /app/dist ./public

EXPOSE 3001
CMD [ "node", "server.js" ]