#!/bin/bash

echo "🔧 Исправление проблемы с модулями и перезапуск бэкенда"
echo "======================================================"

# Останавливаем контейнеры
echo "🛑 Останавливаем контейнеры..."
docker-compose down

# Собираем бэкенд заново с исправленными файлами
echo "🏗️ Пересобираем бэкенд..."
docker-compose build --no-cache backend

# Запускаем контейнеры
echo "🚀 Запускаем контейнеры..."
docker-compose up -d

echo "⏳ Ждем запуска контейнеров..."
sleep 20

echo "📊 Проверяем статус контейнеров..."
docker-compose ps

echo ""
echo "🔍 Проверяем работу API..."
sleep 5

# Проверка health endpoint
if curl -s -o /dev/null -w "%{http_code}" http://localhost:3001/health | grep -q "200"; then
    echo "✅ Health endpoint доступен"
else
    echo "❌ Health endpoint недоступен"
fi

echo ""
echo "📋 Показываем последние логи бэкенда..."
docker-compose logs --tail=20 backend

echo ""
echo "✅ Перезапуск завершен!"
echo ""
echo "📝 Для мониторинга логов:"
echo "   docker-compose logs -f backend"