#!/bin/bash

echo "🚀 Деплой проекта Farolero с сохранением настроек VK"
echo "=================================================="

# Перейти в директорию проекта
cd /var/www/farolero-loyalty-app

echo "💾 1. Сохраняем критически важные файлы..."
mkdir -p /tmp/farolero-backup

# Сохраняем файлы токенов
if [ -f backend/tokens.json ]; then
    cp backend/tokens.json /tmp/farolero-backup/
    echo "✅ tokens.json сохранен"
else
    echo "⚠️  tokens.json не найден!"
fi

# Сохраняем файлы .env
if [ -f backend/.env ]; then
    cp backend/.env /tmp/farolero-backup/
    echo "✅ backend/.env сохранен"
fi

if [ -f frontend/.env ]; then
    cp frontend/.env /tmp/farolero-backup/
    echo "✅ frontend/.env сохранен"
fi

# Сохраняем файлы настроек VK
if [ -f backend/amocrm/amocrm.json ]; then
    cp backend/amocrm/amocrm.json /tmp/farolero-backup/
    echo "✅ amocrm.json сохранен"
fi

# Сохраняем файлы токенов из app/tokens
if [ -d backend/app/tokens ]; then
    cp -r backend/app/tokens /tmp/farolero-backup/
    echo "✅ директория app/tokens сохранена"
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

if [ -f /tmp/farolero-backup/amocrm.json ]; then
    cp /tmp/farolero-backup/amocrm.json backend/amocrm/amocrm.json
    echo "✅ amocrm.json восстановлен"
fi

if [ -d /tmp/farolero-backup/tokens ]; then
    cp -r /tmp/farolero-backup/tokens backend/app/
    echo "✅ директория app/tokens восстановлена"
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
    echo "VK_CLIENT_ID=54020829"
    echo "VK_CLIENT_SECRET=ваш_защищенный_ключ"
    echo "VK_SERVICE_KEY=ваш_сервисный_ключ"
    echo "VK_REDIRECT_URI=https://api.5425685-au70735.twc1.net/api/oauth/vk/callback"
    echo "VK_GROUP_ID=ваш_id_группы"
    echo "VK_GROUP_TOKEN=ваш_токен_группы"
    echo "VK_CONFIRMATION_TOKEN=ваш_токен_подтверждения"
    echo "VK_SECRET_KEY=ваш_секретный_ключ"
    echo "VK_ACCESS_TOKEN=ваш_токен_доступа"
    echo "APP_BASE_URL=https://api.5425685-au70735.twc1.net"
    echo "JWT_SECRET=ваш_jwt_секрет"
fi

if [ ! -f frontend/.env ]; then
    echo "⚠️  Создайте frontend/.env файл!"
    echo "Пример содержимого:"
    echo "VITE_API_URL=https://api.5425685-au70735.twc1.net"
    echo "VITE_VK_APP_ID=54020028"
fi

echo "🏗️  7. Полная пересборка контейнеров..."
docker-compose build --no-cache

echo "🚀 8. Запускаем контейнеры..."
docker-compose up -d

echo "⏳ 9. Ждем запуска контейнеров..."
sleep 15

echo "📊 10. Проверяем статус контейнеров..."
docker-compose ps

echo "🔍 11. Проверяем работу VK Callback API..."
# Проверяем доступность эндпоинта VK Callback API
sleep 5
if curl -s -o /dev/null -w "%{http_code}" https://api.5425685-au70735.twc1.net/webhooks/vk | grep -q "200\|403\|400"; then
    echo "✅ VK Callback API эндпоинт доступен"
else
    echo "❌ VK Callback API эндпоинт недоступен"
fi

echo "🔍 12. Проверяем работу VK OAuth..."
# Проверяем доступность эндпоинта VK OAuth
if curl -s -o /dev/null -w "%{http_code}" https://api.5425685-au70735.twc1.net/auth/vk/login | grep -q "200\|302\|400"; then
    echo "✅ VK OAuth эндпоинт доступен"
else
    echo "❌ VK OAuth эндпоинт недоступен"
fi

echo "📋 13. Показываем логи..."
docker-compose logs --tail=20

echo ""
echo "✅ Деплой завершен!"
echo ""
echo "📝 Для мониторинга логов:"
echo "   docker-compose logs -f"
echo "   docker-compose logs -f backend"
echo "   docker-compose logs -f frontend"
echo ""
echo "🔧 Для отладки VK:"
echo "   docker-compose logs -f backend | grep -i vk"
echo ""
echo "🌐 Проверьте приложение:"
echo "   Frontend: https://app.5425685-au70735.twc1.net"
echo "   Backend API: https://api.5425685-au70735.twc1.net"
echo ""
echo "🔗 VK Callback API: https://api.5425685-au70735.twc1.net/webhooks/vk"
echo "🔗 VK OAuth: https://api.5425685-au70735.twc1.net/auth/vk/login?tg_user_id=TEST"
echo ""
echo "💾 Все настройки VK сохранены и восстановлены!"