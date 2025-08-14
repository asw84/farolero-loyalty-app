#!/bin/bash
# fix-issues.sh - Скрипт для исправления основных проблем проекта

echo "🔧 Исправление проблем проекта Farolero Loyalty App"
echo "=================================================="

# 1. Создаем директории для persistent data
echo "📁 Создание директорий для постоянного хранения..."
mkdir -p persistent_data
mkdir -p persistent_data/database
mkdir -p persistent_data/tokens

# 2. Проверяем переменные окружения
echo "🔍 Проверка критически важных переменных окружения..."

check_env_var() {
    local var_name=$1
    local var_value=$(grep "^$var_name=" backend/.env | cut -d'=' -f2-)
    
    if [[ -z "$var_value" || "$var_value" == "your_"* || "$var_value" == "ВАШ_"* || "$var_value" == "REAL_"* || "$var_value" == "YOUR_"* ]]; then
        echo "❌ $var_name не настроена корректно: '$var_value'"
        return 1
    else
        echo "✅ $var_name настроена"
        return 0
    fi
}

# Список критически важных переменных
critical_vars=(
    "VK_CLIENT_SECRET"
    "VK_SERVICE_KEY"
    "INSTAGRAM_APP_ID"
    "INSTAGRAM_APP_SECRET"
    "TELEGRAM_BOT_TOKEN"
)

missing_vars=0
for var in "${critical_vars[@]}"; do
    if ! check_env_var "$var"; then
        ((missing_vars++))
    fi
done

if [ $missing_vars -gt 0 ]; then
    echo ""
    echo "⚠️  Найдены некорректно настроенные переменные окружения!"
    echo "Пожалуйста, отредактируйте backend/.env и установите реальные значения."
fi

# 3. Проверяем AmoCRM токены
echo ""
echo "🔐 Проверка токенов AmoCRM..."
if [ -f "backend/tokens.json" ]; then
    echo "✅ Файл tokens.json существует"
    # Проверяем валидность JSON
    if python3 -m json.tool backend/tokens.json > /dev/null 2>&1; then
        echo "✅ tokens.json содержит валидный JSON"
    else
        echo "❌ tokens.json содержит невалидный JSON"
    fi
else
    echo "⚠️  Файл tokens.json не найден - будет создан автоматически при первой авторизации"
fi

# 4. Проверяем кастомные поля AmoCRM
echo ""
echo "🎯 Проверка кастомных полей AmoCRM..."
echo "Для автоматического определения ID полей запустите:"
echo "  cd backend && node utils/autodetect-fields.js"

# 5. Предлагаем план исправления
echo ""
echo "📋 План действий для полного исправления:"
echo "========================================"
echo "1. ✅ Docker конфигурация исправлена"
echo "2. ✅ Система управления токенами улучшена"
echo "3. ✅ Добавлена утилита автоопределения полей"
echo "4. ⚠️  Настройте реальные API ключи в .env"
echo "5. ⚠️  Запустите автоопределение полей AmoCRM"
echo "6. ⚠️  Протестируйте VK и Instagram авторизацию"
echo "7. ⚠️  Реализуйте недостающий функционал (RFM, Unisender, и т.д.)"

echo ""
echo "🚀 Готово! Теперь можно перезапустить Docker контейнеры:"
echo "  docker-compose down && docker-compose up --build"

# 6. Проверяем структуру согласно ТЗ
echo ""
echo "📄 Соответствие техническому заданию:"
echo "===================================="

check_feature() {
    local feature=$1
    local status=$2
    local color=""
    
    case $status in
        "implemented") color="\033[32m✅" ;;
        "partial") color="\033[33m⚠️ " ;;
        "missing") color="\033[31m❌" ;;
    esac
    
    echo -e "${color} $feature\033[0m"
}

check_feature "Telegram Mini App (React + TypeScript)" "implemented"
check_feature "Backend API (Node.js + Express)" "implemented"
check_feature "AmoCRM интеграция" "partial"
check_feature "VK OAuth авторизация" "partial"
check_feature "Instagram OAuth авторизация" "partial"
check_feature "Система лояльности (баллы)" "implemented"
check_feature "Начисление баллов за покупки" "partial"
check_feature "Реферальная программа" "missing"
check_feature "RFM-анализ пользователей" "missing"
check_feature "Интеграция с Qtickets" "implemented"
check_feature "Рассылки через Unisender" "missing"
check_feature "Отслеживание активности в соцсетях" "missing"
check_feature "Админ-панель" "partial"

echo ""
echo "🎯 Процент готовности: ~60%"
echo ""
echo "📞 Для получения помощи:"
echo "  - Проверьте документацию в docs/"
echo "  - Используйте утилиты в backend/utils/"
echo "  - Обратитесь к логам: docker-compose logs backend"
