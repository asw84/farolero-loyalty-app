#!/bin/bash
# scripts/pre-deploy-check.sh
# Быстрая проверка готовности к деплою (запускается перед основным тестированием)

set -e

echo "🚀 === PRE-DEPLOY VALIDATION ==="
echo "⚡ Быстрая проверка готовности к деплою..."

# Цвета
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

ERRORS=0
WARNINGS=0

check_required() {
    local item="$1"
    local command="$2"
    
    if eval "$command" >/dev/null 2>&1; then
        echo -e "${GREEN}✅ $item${NC}"
    else
        echo -e "${RED}❌ $item${NC}"
        ((ERRORS++))
    fi
}

check_optional() {
    local item="$1"
    local command="$2"
    
    if eval "$command" >/dev/null 2>&1; then
        echo -e "${GREEN}✅ $item${NC}"
    else
        echo -e "${YELLOW}⚠️  $item${NC}"
        ((WARNINGS++))
    fi
}

echo ""
echo "🔍 ПРОВЕРКА ОБЯЗАТЕЛЬНЫХ КОМПОНЕНТОВ:"

check_required "Docker установлен" "docker --version"
check_required "Docker Compose установлен" "docker-compose --version"
check_required "Файл docker-compose.yml существует" "[ -f docker-compose.yml ]"
check_required "Директория backend существует" "[ -d backend ]"
check_required "Директория frontend существует" "[ -d frontend ]"
check_required "Файл backend/package.json существует" "[ -f backend/package.json ]"
check_required "Файл backend/.env существует" "[ -f backend/.env ]"
check_required "Файл backend/server.js существует" "[ -f backend/server.js ]"

echo ""
echo "🔧 ПРОВЕРКА КОНФИГУРАЦИИ:"

if [ -f "backend/.env" ]; then
    # Критические переменные
    check_required "AMOCRM_DOMAIN настроена" "grep -q '^AMOCRM_DOMAIN=.\+' backend/.env"
    check_required "AMOCRM_CLIENT_ID настроена" "grep -q '^AMOCRM_CLIENT_ID=.\+' backend/.env"
    check_required "AMOCRM_CLIENT_SECRET настроена" "grep -q '^AMOCRM_CLIENT_SECRET=.\+' backend/.env"
    check_required "VK_CLIENT_ID настроена" "grep -q '^VK_CLIENT_ID=.\+' backend/.env"
    check_required "JWT_SECRET настроена" "grep -q '^JWT_SECRET=.\+' backend/.env"
    
    # Опциональные переменные
    check_optional "TELEGRAM_BOT_TOKEN настроена" "grep -q '^TELEGRAM_BOT_TOKEN=.\+' backend/.env && ! grep -q 'YOUR_' backend/.env"
    check_optional "VK_CLIENT_SECRET настроена" "grep -q '^VK_CLIENT_SECRET=.\+' backend/.env && ! grep -q 'REQUIRED' backend/.env"
    check_optional "INSTAGRAM_APP_ID настроена" "grep -q '^INSTAGRAM_APP_ID=.\+' backend/.env && ! grep -q 'YOUR_' backend/.env"
fi

echo ""
echo "📁 ПРОВЕРКА СТРУКТУРЫ ПРОЕКТА:"

check_required "backend/amocrm/amocrm.json существует" "[ -f backend/amocrm/amocrm.json ]"
check_required "backend/database.js существует" "[ -f backend/database.js ]"
check_required "backend/amocrm/apiClient.js существует" "[ -f backend/amocrm/apiClient.js ]"

echo ""
echo "🐳 ПРОВЕРКА DOCKER КОНФИГУРАЦИИ:"

check_required "Docker daemon запущен" "docker info"
check_required "docker-compose.yml валиден" "docker-compose config"

# Проверка портов
check_optional "Порт 3001 свободен" "! netstat -tuln 2>/dev/null | grep ':3001 ' || ! ss -tuln 2>/dev/null | grep ':3001 '"
check_optional "Порт 8080 свободен" "! netstat -tuln 2>/dev/null | grep ':8080 ' || ! ss -tuln 2>/dev/null | grep ':8080 '"

echo ""
echo "📊 === РЕЗУЛЬТАТ PRE-DEPLOY ПРОВЕРКИ ==="

if [ $ERRORS -eq 0 ]; then
    echo -e "${GREEN}✅ ВСЕ ОБЯЗАТЕЛЬНЫЕ ПРОВЕРКИ ПРОШЛИ${NC}"
    
    if [ $WARNINGS -eq 0 ]; then
        echo -e "${GREEN}🎉 ПРОЕКТ ГОТОВ К ДЕПЛОЮ!${NC}"
        echo "Рекомендуется запустить полное тестирование:"
        echo "  bash scripts/test-complete.sh"
    else
        echo -e "${YELLOW}⚠️  ЕСТЬ $WARNINGS ПРЕДУПРЕЖДЕНИЙ${NC}"
        echo "Рекомендуется устранить предупреждения и запустить полное тестирование"
    fi
    
    exit 0
else
    echo -e "${RED}❌ НАЙДЕНО $ERRORS КРИТИЧЕСКИХ ОШИБОК${NC}"
    echo -e "${RED}ПРОЕКТ НЕ ГОТОВ К ДЕПЛОЮ!${NC}"
    echo ""
    echo "Устраните ошибки и повторите проверку."
    exit 1
fi
