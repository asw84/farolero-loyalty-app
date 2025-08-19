#!/bin/bash

echo "🚀 Принудительное обновление фронтенда Farolero"
echo "==============================================="

# Перейти в директорию проекта
cd /var/www/farolero-loyalty-app

echo "💾 1. Сохраняем критически важные файлы..."
mkdir -p /tmp/farolero-backup

# Сохраняем файлы .env
if [ -f frontend/.env ]; then
    cp frontend/.env /tmp/farolero-backup/
    echo "✅ frontend/.env сохранен"
fi

echo "📥 2. Подтягиваем последние изменения из GitHub..."
git fetch origin
git reset --hard origin/main

echo "🔄 3. Восстанавливаем критически важные файлы..."
if [ -f /tmp/farolero-backup/frontend/.env ]; then
    cp /tmp/farolero-backup/frontend/.env frontend/
    echo "✅ frontend/.env восстановлен"
fi

echo "🛑 4. Останавливаем фронтенд контейнер..."
docker-compose stop frontend

echo "🧹 5. Удаляем фронтенд контейнер и образ..."
docker-compose rm -f frontend
docker rmi -f farolero-loyalty-app-frontend:latest

# Генерируем уникальную версию сборки для предотвращения кеширования
export BUILD_VERSION=$(date +%s)
echo "🔢 Версия сборки: $BUILD_VERSION"

echo "🏗️  6. Пересобираем фронтенд контейнер с новой версией..."
docker-compose build --no-cache --build-arg BUILD_VERSION=$BUILD_VERSION frontend

echo "🚀 7. Запускаем фронтенд контейнер..."
docker-compose up -d frontend

echo "⏳ 8. Ждем запуска контейнера..."
sleep 10

echo "📊 9. Проверяем статус контейнера..."
docker-compose ps frontend

echo "🔍 10. Проверяем доступность фронтенда..."
if curl -s -o /dev/null -w "%{http_code}" https://app.5425685-au70735.twc1.net | grep -q "200\|301\|302"; then
    echo "✅ Фронтенд доступен"
else
    echo "❌ Фронтенд недоступен"
fi

echo "📋 11. Показываем логи фронтенда..."
docker-compose logs --tail=20 frontend

echo ""
echo "✅ Обновление фронтенда завершено!"
echo ""
echo "📝 Для мониторинга логов:"
echo "   docker-compose logs -f frontend"
echo ""
echo "🌐 Проверьте приложение:"
echo "   Frontend: https://app.5425685-au70735.twc1.net"
echo ""
echo "🧹 ВАЖНО: Очистите кеш браузера или нажмите Ctrl+F5 / Cmd+Shift+R"
echo "   Это гарантирует загрузку последней версии фронтенда"