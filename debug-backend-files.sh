#!/bin/bash

echo "🔍 Диагностика файлов в Docker контейнере бэкенда"
echo "================================================="

# Останавливаем контейнеры
echo "🛑 Останавливаем контейнеры..."
docker-compose down

# Собираем бэкенд с отладочной информацией
echo "🏗️ Собираем бэкенд..."
docker-compose build backend

# Запускаем бэкенд в режиме проверки файлов
echo "🚀 Запускаем контейнер для проверки файлов..."
docker run --rm -it --name farolero-debug \
  -v $(pwd)/backend:/app \
  farolero-loyalty-app-backend \
  sh -c "echo '=== Содержимое директории /app ===' && ls -la /app && \
          echo '' && \
          echo '=== Содержимое директории /app/services ===' && ls -la /app/services && \
          echo '' && \
          echo '=== Проверка существования файла vk.oauth.service.js ===' && \
          if [ -f /app/services/vk.oauth.service.js ]; then echo '✅ Файл существует'; else echo '❌ Файл не существует'; fi && \
          echo '' && \
          echo '=== Содержимое файла vk.oauth.service.js (первые 5 строк) ===' && \
          head -n 5 /app/services/vk.oauth.service.js"

echo ""
echo "🔍 Проверка завершена!"