#!/bin/bash

echo "🚀 Полная пересборка проекта Farolero"
echo "======================================"

# Перейти в директорию проекта
cd /var/www/farolero-loyalty-app

echo "💾 1. Сохраняем критически важные файлы..."
mkdir -p /tmp/farolero-backup
if [ -f backend/tokens.json ]; then
    cp backend/tokens.json /tmp/farolero-backup/
    echo "✅ tokens.json сохранен"
else
    echo "⚠️  tokens.json не найден!"
fi

if [ -f backend/.env ]; then
    cp backend/.env /tmp/farolero-backup/
    echo "✅ backend/.env сохранен"
fi

if [ -f frontend/.env ]; then
    cp frontend/.env /tmp/farolero-backup/
    echo "✅ frontend/.env сохранен"
fi

echo "📥 2. Подтягиваем последние изменения из GitHub..."
git fetch origin
git reset --hard origin/main

echo "🔄 3. Восстанавливаем критически важные файлы..."
if [ -f /tmp/farolero-backup/tokens.json ]; then
    cp /tmp/farolero-backup/tokens.json backend/
    echo "✅ tokens.json восстановлен"
fi

if [ -f /tmp/farolero-backup/backend/.env ]; then
    cp /tmp/farolero-backup/backend/.env backend/
    echo "✅ backend/.env восстановлен"
fi

if [ -f /tmp/farolero-backup/frontend/.env ]; then
    cp /tmp/farolero-backup/frontend/.env frontend/
    echo "✅ frontend/.env восстановлен"
fi

echo "🛑 4. Останавливаем все контейнеры..."
docker-compose down

echo "🧹 5. Удаляем старые образы и билд кеши..."
docker system prune -f
docker builder prune -f

echo "🔧 6. Проверяем переменные окружения..."
if [ ! -f backend/.env ]; then
    echo "⚠️  Создайте backend/.env файл!"
    echo "Пример содержимого:"
    echo "NODE_ENV=production"
    echo "STORAGE_MODE=hybrid"
    echo "VK_APP_ID=54020829"
    echo "VK_APP_SECRET=ваш_защищенный_ключ"
    echo "VK_REDIRECT_URI=https://api.5425685-au70735.twc1.net/api/oauth/vk/callback"
    echo "VK_CONFIRMATION_TOKEN=5a92b0bc"
    echo "VK_SECRET_KEY=gK7pW9sRzE2xY4qA0jF8vU3mB1nC5h"
    # exit 1
fi

if [ ! -f frontend/.env ]; then
    echo "⚠️  Создайте frontend/.env файл!"
    echo "Пример содержимого:"
    echo "VITE_API_URL=https://api.5425685-au70735.twc1.net"
    # exit 1
fi

echo "🏗️  7. Полная пересборка контейнеров..."
docker-compose build --no-cache

echo "🚀 8. Запускаем контейнеры..."
docker-compose up -d

echo "⏳ 9. Ждем запуска контейнеров..."
sleep 10

echo "📊 10. Проверяем статус контейнеров..."
docker-compose ps

echo "📋 11. Показываем логи..."
docker-compose logs --tail=20

echo ""
echo "✅ Пересборка завершена!"
echo ""
echo "📝 Для мониторинга логов:"
echo "   docker-compose logs -f"
echo "   docker-compose logs -f backend"
echo "   docker-compose logs -f frontend"
echo ""
echo "🔧 Для отладки VK OAuth:"
echo "   docker-compose logs -f backend | grep -i vk"
echo ""
echo "🌐 Проверьте приложение:"
echo "   Frontend: https://app.5425685-au70735.twc1.net"
echo "   Backend API: https://api.5425685-au70735.twc1.net"
