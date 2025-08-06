# frontend/Dockerfile
# ФИНАЛЬНАЯ ВЕРСИЯ С ЯВНЫМ УКАЗАНИЕМ ПРАВ НА ИСПОЛНЕНИЕ

# --- СТАДИЯ 1: Сборка приложения (Builder) ---
FROM node:16 AS build
WORKDIR /app

# Копируем сначала package.json, чтобы кэшировать установку зависимостей
COPY package*.json ./
RUN npm install

# Копируем остальные файлы
COPY . .

# --- КЛЮЧЕВОЕ ИСПРАВЛЕНИЕ ---
# Рекурсивно даем права на исполнение для всей папки node_modules.
# Это решает проблему "Permission denied" для tsc и vite.
RUN chmod -R +x node_modules/.bin
# --------------------------

# Теперь эта команда должна сработать
RUN npm run build

# --- СТАДИЯ 2: Раздача готовых файлов (Runner) ---
FROM nginx:stable-alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]