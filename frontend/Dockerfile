# frontend/Dockerfile
# ФИНАЛЬНАЯ ВЕРСИЯ: ПРОСТО РАЗДАЕМ ГОТОВЫЕ ФАЙЛЫ ИЗ ПАПКИ 'dist'

# Шаг 1: Используем самый легкий и надежный веб-сервер
FROM nginx:stable-alpine

# Шаг 2: Копируем УЖЕ СОБРАННЫЕ локально файлы из папки dist в рабочую папку веб-сервера
COPY dist/ /usr/share/nginx/html

# Шаг 3: Копируем наш файл конфигурации для Nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Шаг 4: Открываем стандартный веб-порт 80
EXPOSE 80

# Шаг 5: Запускаем Nginx в "прямом" режиме, чтобы контейнер не завершался
CMD ["nginx", "-g", "daemon off;"]