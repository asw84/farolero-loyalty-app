# frontend/Dockerfile
# ФИНАЛЬНАЯ PRODUCTION-ВЕРСЯ С ИСПРАВЛЕНИЕМ ПРАВ ДОСТУПА

# --- СТАДИЯ 1: Сборка приложения (Builder) ---
# Используем стабильную версию Node.js, которая не конфликтует с Vite
FROM node:16 AS build

# Устанавливаем рабочую директорию
WORKDIR /app

# Копируем package.json и package-lock.json для кэширования зависимостей
COPY package*.json ./

# Устанавливаем зависимости
RUN npm install

# Копируем весь остальной код
COPY . .

# Собираем "боевую" версию фронтенда. Этот шаг создает папку /app/dist
RUN npm run build

# --- СТАДИЯ 2: Раздача готовых файлов (Runner) ---
# Используем супер-легкий и надежный веб-сервер Nginx
FROM nginx:stable-alpine
    
# Копируем УЖЕ СОБРАННЫЕ файлы из папки /app/dist в стадии "build"
# в рабочую папку веб-сервера Nginx
COPY --from=build /app/dist /usr/share/nginx/html
    
# Копируем наш файл конфигурации для Nginx, чтобы он знал, как раздавать React-приложение
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Открываем стандартный веб-порт 80, который слушает Nginx
EXPOSE 80

# Команда для запуска Nginx в "прямом" режиме, чтобы контейнер не завершался
CMD ["nginx", "-g", "daemon off;"]