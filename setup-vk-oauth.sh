#!/bin/bash

echo "🔐 Настройка VK OAuth для Telegram Mini-App"
echo "=============================================="

# Проверяем, что мы в корневой папке проекта
if [ ! -f "docker-compose.yml" ]; then
    echo "❌ Ошибка: Запустите скрипт из корневой папки проекта"
    exit 1
fi

echo "📁 Текущая директория: $(pwd)"

# Переходим в backend
echo "📂 Переходим в backend директорию..."
cd backend

# Проверяем наличие package.json
if [ ! -f "package.json" ]; then
    echo "❌ Ошибка: package.json не найден в backend директории"
    exit 1
fi

# Устанавливаем зависимости
echo "📦 Устанавливаем jsonwebtoken..."
npm install jsonwebtoken

if [ $? -eq 0 ]; then
    echo "✅ jsonwebtoken установлен успешно!"
else
    echo "❌ Ошибка установки jsonwebtoken"
    exit 1
fi

# Проверяем, что .env существует
if [ ! -f ".env" ]; then
    echo "📝 Создаем .env файл из env.example..."
    if [ -f "env.example" ]; then
        cp env.example .env
        echo "✅ .env файл создан из env.example"
        echo "⚠️  ВАЖНО: Отредактируйте .env файл и заполните реальные значения!"
    else
        echo "❌ env.example не найден"
        exit 1
    fi
else
    echo "ℹ️  .env файл уже существует"
fi

# Проверяем права на скрипт установки
echo "🔧 Проверяем права на скрипт установки..."
chmod +x install-vk-oauth.sh

echo ""
echo "🎉 Настройка VK OAuth завершена!"
echo ""
echo "📋 Следующие шаги:"
echo "1. Отредактируйте backend/.env файл:"
echo "   - VK_CLIENT_ID (из настроек VK приложения)"
echo "   - VK_CLIENT_SECRET (из настроек VK приложения)"
echo "   - VK_REDIRECT_URI (https://api.5425685-au70735.twc1.net/api/oauth/vk/callback)"
echo "   - JWT_SECRET (сильный случайный пароль)"
echo ""
echo "2. В настройках VK приложения установите:"
echo "   - Authorized redirect URI: https://api.5425685-au70735.twc1.net/api/oauth/vk/callback"
echo "   - Base domain: api.5425685-au70735.twc1.net"
echo "   - Тип: Website (Сайт)"
echo ""
echo "3. Запустите backend сервер:"
echo "   cd backend && npm run dev"
echo ""
echo "4. Протестируйте:"
echo "   - Логин роут: https://api.5425685-au70735.twc1.net/auth/vk/login?tg_user_id=123"
echo "   - Callback: https://api.5425685-au70735.twc1.net/api/oauth/vk/callback"
echo ""
echo "📚 Документация:"
echo "   - Быстрый старт: VK_OAUTH_QUICK_START.md"
echo "   - Подробная инструкция: docs/VK_OAUTH_SETUP.md"
echo ""
echo "🔒 Безопасность:"
echo "   - JWT state защита от CSRF"
echo "   - Валидация параметров"
echo "   - Обработка ошибок VK"
echo "   - Автоматическое закрытие вкладки"
