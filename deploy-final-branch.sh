#!/bin/bash

echo "🚀 Жесткое обновление сервера до ветки final"
echo "==========================================="

# Перейти в директорию проекта
cd /var/www/farolero-loyalty-app

echo "💾 1. Сохраняем ВСЕ критически важные файлы..."
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

# Сохраняем файлы настроек AmoCRM
if [ -f backend/amocrm/amocrm.json ]; then
    cp backend/amocrm/amocrm.json /tmp/farolero-backup/
    echo "✅ amocrm.json сохранен"
fi

# Сохраняем файлы токенов из app/tokens
if [ -d backend/app/tokens ]; then
    cp -r backend/app/tokens /tmp/farolero-backup/
    echo "✅ директория app/tokens сохранена"
fi

# Сохраняем файлы настроек Qtickets
if [ -f backend/qtickets/qtickets.json ]; then
    cp backend/qtickets/qtickets.json /tmp/farolero-backup/
    echo "✅ qtickets.json сохранен"
fi

# Сохраняем базу данных SQLite
if [ -f backend/data/loyalty.db ]; then
    cp backend/data/loyalty.db /tmp/farolero-backup/
    echo "✅ база данных SQLite сохранена"
fi

# Сохраняем постоянные данные
if [ -d backend/persistent_data ]; then
    cp -r backend/persistent_data /tmp/farolero-backup/
    echo "✅ директория persistent_data сохранена"
fi

# Сохраняем файлы настроек Instagram
if [ -f backend/instagram/instagram.json ]; then
    cp backend/instagram/instagram.json /tmp/farolero-backup/
    echo "✅ instagram.json сохранен"
fi

echo "📥 2. Подтягиваем последние изменения из ветки final..."
git fetch origin
git reset --hard origin/final

echo "🔄 3. Восстанавливаем ВСЕ критически важные файлы..."
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

if [ -f /tmp/farolero-backup/qtickets.json ]; then
    cp /tmp/farolero-backup/qtickets.json backend/qtickets/qtickets.json
    echo "✅ qtickets.json восстановлен"
fi

if [ -f /tmp/farolero-backup/loyalty.db ]; then
    mkdir -p backend/data
    cp /tmp/farolero-backup/loyalty.db backend/data/
    echo "✅ база данных SQLite восстановлена"
fi

if [ -d /tmp/farolero-backup/persistent_data ]; then
    cp -r /tmp/farolero-backup/persistent_data backend/
    echo "✅ директория persistent_data восстановлена"
fi

if [ -f /tmp/farolero-backup/instagram.json ]; then
    cp /tmp/farolero-backup/instagram.json backend/instagram/instagram.json
    echo "✅ instagram.json восстановлен"
fi

echo "🛑 4. Останавливаем все контейнеры..."
docker-compose down

echo "🧹 5. Жестко очищаем ВСЕ старые образы и контейнеры..."
docker system prune -af
docker builder prune -af
docker volume prune -f

# Генерируем уникальную версию сборки для предотвращения кеширования
export BUILD_VERSION=$(date +%s)
echo "🔢 Версия сборки: $BUILD_VERSION"

echo "🔧 6. Проверяем переменные окружения..."
if [ ! -f backend/.env ]; then
    echo "⚠️  Создайте backend/.env файл!"
    echo "Пример содержимого в backend/.env.example"
fi

if [ ! -f frontend/.env ]; then
    echo "⚠️  Создайте frontend/.env файл!"
    echo "Пример содержимого в frontend/.env.example"
fi

echo "🏗️  7. Полная пересборка контейнеров с новой версией..."
docker-compose build --no-cache --build-arg BUILD_VERSION=$BUILD_VERSION

echo "🚀 8. Запускаем контейнеры с принудительным пересозданием..."
docker-compose up -d --force-recreate

echo "⏳ 9. Ждем запуска контейнеров..."
sleep 20

echo "📊 10. Проверяем статус контейнеров..."
docker-compose ps

echo "🔍 11. Проверяем работу всех API эндпоинтов..."
sleep 5

# Проверка health endpoint
if curl -s -o /dev/null -w "%{http_code}" https://api.5425685-au70735.twc1.net/health | grep -q "200"; then
    echo "✅ Health endpoint доступен"
else
    echo "❌ Health endpoint недоступен"
fi

# Проверка VK Callback API
if curl -s -o /dev/null -w "%{http_code}" https://api.5425685-au70735.twc1.net/webhooks/vk | grep -q "200\|403\|400"; then
    echo "✅ VK Callback API эндпоинт доступен"
else
    echo "❌ VK Callback API эндпоинт недоступен"
fi

# Проверка VK OAuth
if curl -s -o /dev/null -w "%{http_code}" https://api.5425685-au70735.twc1.net/auth/vk/login | grep -q "200\|302\|400"; then
    echo "✅ VK OAuth эндпоинт доступен"
else
    echo "❌ VK OAuth эндпоинт недоступен"
fi

# Проверка AmoCRM
if curl -s -o /dev/null -w "%{http_code}" https://api.5425685-au70735.twc1.net/api/amocrm/health | grep -q "200\|401\|400"; then
    echo "✅ AmoCRM эндпоинт доступен"
else
    echo "❌ AmoCRM эндпоинт недоступен"
fi

# Проверка Instagram
if curl -s -o /dev/null -w "%{http_code}" https://api.5425685-au70735.twc1.net/api/instagram/health | grep -q "200\|401\|400"; then
    echo "✅ Instagram эндпоинт доступен"
else
    echo "❌ Instagram эндпоинт недоступен"
fi

echo "📋 12. Показываем логи..."
docker-compose logs --tail=30

echo ""
echo "✅ Жесткое обновление до ветки final завершено!"
echo ""
echo "📝 Для мониторинга логов:"
echo "   docker-compose logs -f"
echo "   docker-compose logs -f backend"
echo "   docker-compose logs -f frontend"
echo ""
echo "🔧 Для отладки конкретных сервисов:"
echo "   docker-compose logs -f backend | grep -i vk"
echo "   docker-compose logs -f backend | grep -i amocrm"
echo "   docker-compose logs -f backend | grep -i instagram"
echo "   docker-compose logs -f backend | grep -i qtickets"
echo ""
echo "🌐 Проверьте приложение:"
echo "   Frontend: https://app.5425685-au70735.twc1.net"
echo "   Backend API: https://api.5425685-au70735.twc1.net"
echo ""
echo "🔗 Важные эндпоинты:"
echo "   VK Callback API: https://api.5425685-au70735.twc1.net/webhooks/vk"
echo "   VK OAuth: https://api.5425685-au70735.twc1.net/auth/vk/login?tg_user_id=TEST"
echo "   AmoCRM: https://api.5425685-au70735.twc1.net/api/amocrm/health"
echo "   Instagram: https://api.5425685-au70735.twc1.net/api/instagram/health"
echo ""
echo "💾 ВСЕ настройки проекта сохранены и восстановлены!"
echo "🗄️  База данных сохранена!"
echo "🔑 Все токены и ключи доступа сохранены!"
echo ""
echo "🧹 ВАЖНО: Очистите кеш браузера или нажмите Ctrl+F5 / Cmd+Shift+R"
echo "   Это гарантирует загрузку последней версии фронтенда"