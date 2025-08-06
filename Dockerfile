# /Dockerfile
# Многостадийный Dockerfile для Railway

# --- СТАДИЯ 1: Сборка Фронтенда ---
FROM node:16 AS frontend-builder
WORKDIR /app
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ .
RUN npm run build

# --- СТАДИЯ 2: Сборка Бэкенда ---
FROM node:18-alpine AS backend-builder
WORKDIR /app
COPY backend/package*.json ./
RUN npm install --omit=dev # Устанавливаем только production-зависимости
COPY backend/ .

# --- ФИНАЛЬНАЯ СТАДИЯ: Запускаем Бэкенд ---
FROM node:18-alpine
WORKDIR /app
# Копируем готовый бэкенд из стадии сборки
COPY --from=backend-builder /app .
# Копируем ГОТОВЫЙ ФРОНТЕНД из стадии сборки в папку 'public'
COPY --from=frontend-builder /app/dist ./public

EXPOSE 3001
CMD [ "node", "server.js" ]