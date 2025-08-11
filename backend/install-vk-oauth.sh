#!/bin/bash

echo "🔐 Установка зависимостей для VK OAuth..."

# Установка JWT пакета
echo "📦 Устанавливаю jsonwebtoken..."
npm install jsonwebtoken

# Проверка установки
if [ $? -eq 0 ]; then
    echo "✅ jsonwebtoken установлен успешно!"
else
    echo "❌ Ошибка установки jsonwebtoken"
    exit 1
fi

echo ""
echo "🎉 Установка завершена!"
echo ""
echo "📋 Следующие шаги:"
echo "1. Скопируйте env.example в .env"
echo "2. Заполните переменные окружения:"
echo "   - VK_CLIENT_ID (из настроек VK приложения)"
echo "   - VK_CLIENT_SECRET (из настроек VK приложения)"
echo "   - VK_REDIRECT_URI (https://api.5425685-au70735.twc1.net/api/oauth/vk/callback)"
echo "   - JWT_SECRET (сильный случайный пароль)"
echo "3. Перезапустите сервер: npm run dev"
echo ""
echo "🔗 API endpoints:"
echo "   - GET /auth/vk/login?tg_user_id=123 - инициация авторизации"
echo "   - GET /api/oauth/vk/callback - обработка callback"
