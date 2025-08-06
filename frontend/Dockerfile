# frontend/Dockerfile
# ФИНАЛЬНАЯ PRODUCTION-ВЕРСИЯ С ДВУХСТАДИЙНОЙ СБОРКОЙ

# --- СТАДИЯ 1: Сборка приложения (Builder) ---
# Используем стабильную версию Node.js, которая не конфликтует с Vite
FROM node:16 AS build

# Устанавливаем рабочую директорию
WORKDIR /app

# Копируем package.json и устанавливаем зависимости
COPY package*.json ./
RUN npm install

# Копируем весь остальной код
COPY . .

# САМЫЙ ВАЖНЫЙ ШАГ: Собираем "боевую" версию фронтенда
RUN npm run build

# --- СТАДИЯ 2: Раздача готовых файлов (Runner) ---
# Используем супер-легкий и надежный веб-сервер Nginx
FROM nginx:stable-alpine

# Копируем УЖЕ СОБРАННЫЕ файлы из папки /app/dist в стадии "build"
# в рабочую папку веб-сервера Nginx
COPY --from=build /app/dist /usr/share/nginx/html

# Копируем наш файл конфигурации для Nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Открываем стандартный веб-порт 80
EXPOSE 80

# Команда для запуска Nginx
CMD ["nginx", "-g", "daemon off;"]