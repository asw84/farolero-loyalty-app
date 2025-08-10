#!/bin/bash

echo "🚀 Полная пересборка проекта Farolero"
echo "======================================"

# Перейти в директорию проекта
cd /var/www/farolero-loyalty-app

echo "📥 1. Подтягиваем последние изменения из GitHub..."
git fetch origin
git reset --hard origin/main

echo "🛑 2. Останавливаем все контейнеры..."
docker-compose down

echo "🧹 3. Удаляем старые образы и билд кеши..."
docker system prune -f
docker builder prune -f

echo "🔧 4. Проверяем переменные окружения..."
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

echo "🏗️  5. Полная пересборка контейнеров..."
docker-compose build --no-cache

echo "🚀 6. Запускаем контейнеры..."
docker-compose up -d

echo "⏳ 7. Ждем запуска контейнеров..."
sleep 10

echo "📊 8. Проверяем статус контейнеров..."
docker-compose ps

echo "📋 9. Показываем логи..."
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
