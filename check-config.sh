#!/bin/bash

echo "🔍 Проверка конфигурации проекта"
echo "================================="

# Проверяем VK настройки
echo "📱 VK Configuration:"
echo "   APP_ID: 54020829"
echo "   Базовый домен: app.5425685-au70735.twc1.net"
echo "   Redirect URL: https://api.5425685-au70735.twc1.net/api/oauth/vk/callback"

# Проверяем переменные окружения
echo ""
echo "🔧 Environment Variables:"
if [ -f backend/.env ]; then
    echo "✅ backend/.env существует"
    grep -E "^(VK_|NODE_ENV|STORAGE_MODE)" backend/.env | sed 's/=.*/=***/'
else
    echo "❌ backend/.env НЕ НАЙДЕН!"
fi

if [ -f frontend/.env ]; then
    echo "✅ frontend/.env существует"
    cat frontend/.env
else
    echo "❌ frontend/.env НЕ НАЙДЕН!"
fi

# Проверяем git статус
echo ""
echo "📦 Git Status:"
git log --oneline -3
echo "Current branch: $(git branch --show-current)"

# Проверяем Docker
echo ""
echo "🐳 Docker Status:"
docker-compose ps

# Ищем localhost в коде
echo ""
echo "🔍 Поиск localhost в коде:"
LOCALHOST_FILES=$(grep -r "localhost" frontend/src/ backend/src/ backend/routes/ backend/services/ backend/controllers/ 2>/dev/null | grep -v node_modules | head -5)
if [ -z "$LOCALHOST_FILES" ]; then
    echo "✅ localhost не найден в основном коде"
else
    echo "❌ Найден localhost:"
    echo "$LOCALHOST_FILES"
fi

echo ""
echo "🧪 Тестовые URL:"
echo "   VK OAuth: https://id.vk.com/auth?app_id=54020829&redirect_uri=https%3A%2F%2Fapi.5425685-au70735.twc1.net%2Fapi%2Foauth%2Fvk%2Fcallback&state=tg%3A123456789&response_type=code"
echo ""
echo "✨ Готово!"
