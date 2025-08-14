#!/bin/bash
# scripts/test-complete.sh
# Комплексный скрипт тестирования перед деплоем

set -e  # Останавливаем выполнение при любой ошибке

echo "🧪 === КОМПЛЕКСНОЕ ТЕСТИРОВАНИЕ FAROLERO LOYALTY APP ==="
echo "📅 Дата: $(date)"
echo "🔄 Начинаем предварительную проверку..."

# Цвета для вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Функция для логирования
log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Счетчики для статистики
TESTS_PASSED=0
TESTS_FAILED=0
WARNINGS=0

# Функция для запуска теста
run_test() {
    local test_name="$1"
    local test_command="$2"
    
    log_info "Запуск теста: $test_name"
    
    if eval "$test_command"; then
        log_success "$test_name - УСПЕШНО"
        ((TESTS_PASSED++))
        return 0
    else
        log_error "$test_name - ОШИБКА"
        ((TESTS_FAILED++))
        return 1
    fi
}

# Функция проверки с предупреждением
check_warning() {
    local check_name="$1"
    local check_command="$2"
    local warning_message="$3"
    
    log_info "Проверка: $check_name"
    
    if eval "$check_command"; then
        log_success "$check_name - ОК"
        return 0
    else
        log_warning "$check_name - $warning_message"
        ((WARNINGS++))
        return 1
    fi
}

echo ""
echo "🔍 === ЭТАП 1: ПРОВЕРКА ОКРУЖЕНИЯ ==="

# Проверка наличия необходимых файлов
run_test "Проверка структуры проекта" "[ -f docker-compose.yml ] && [ -d backend ] && [ -d frontend ]"

# Проверка Docker
run_test "Проверка Docker" "docker --version > /dev/null 2>&1"
run_test "Проверка Docker Compose" "docker-compose --version > /dev/null 2>&1"

# Проверка Node.js (для локальных тестов)
check_warning "Проверка Node.js" "node --version > /dev/null 2>&1" "Node.js не установлен (опционально для Docker-деплоя)"

# Проверка переменных окружения
log_info "Проверка критических переменных окружения..."

if [ -f "backend/.env" ]; then
    log_success "Файл .env найден"
    
    # Критические переменные
    critical_vars=("AMOCRM_DOMAIN" "AMOCRM_CLIENT_ID" "AMOCRM_CLIENT_SECRET" "VK_CLIENT_ID" "JWT_SECRET")
    
    for var in "${critical_vars[@]}"; do
        if grep -q "^$var=" backend/.env && ! grep -q "^$var=$" backend/.env; then
            log_success "$var настроена"
        else
            log_error "$var не настроена или пуста"
            ((TESTS_FAILED++))
        fi
    done
    
    # Опциональные переменные с предупреждениями
    optional_vars=("TELEGRAM_BOT_TOKEN" "VK_CLIENT_SECRET" "INSTAGRAM_APP_ID")
    
    for var in "${optional_vars[@]}"; do
        if grep -q "^$var=" backend/.env && ! grep -q "^$var=$" backend/.env && ! grep -q "REQUIRED" backend/.env | grep "$var"; then
            log_success "$var настроена"
        else
            log_warning "$var не настроена (может потребоваться для полной функциональности)"
            ((WARNINGS++))
        fi
    done
else
    log_error "Файл backend/.env не найден"
    ((TESTS_FAILED++))
fi

echo ""
echo "🔨 === ЭТАП 2: СБОРКА И ЛОКАЛЬНЫЕ ТЕСТЫ ==="

# Переходим в директорию backend для тестов
cd backend

# Проверка зависимостей
run_test "Установка зависимостей backend" "npm install --silent"

# Запуск unit тестов (если Jest настроен)
if [ -f "package.json" ] && grep -q '"test"' package.json; then
    log_info "Запуск unit тестов..."
    if npm test 2>/dev/null; then
        log_success "Unit тесты прошли успешно"
        ((TESTS_PASSED++))
    else
        log_warning "Unit тесты не прошли или не настроены"
        ((WARNINGS++))
    fi
else
    log_warning "Unit тесты не настроены"
    ((WARNINGS++))
fi

# Проверка синтаксиса
run_test "Проверка синтаксиса JavaScript" "node -c server.js"

# Возвращаемся в корень проекта
cd ..

echo ""
echo "🐳 === ЭТАП 3: ТЕСТИРОВАНИЕ DOCKER ==="

# Остановка существующих контейнеров
log_info "Остановка существующих контейнеров..."
docker-compose down --remove-orphans 2>/dev/null || true

# Сборка образов
run_test "Сборка Docker образов" "docker-compose build --no-cache"

# Запуск контейнеров
log_info "Запуск контейнеров..."
if docker-compose up -d; then
    log_success "Контейнеры запущены"
    ((TESTS_PASSED++))
else
    log_error "Ошибка запуска контейнеров"
    ((TESTS_FAILED++))
    exit 1
fi

# Ожидание готовности сервисов
log_info "Ожидание готовности сервисов (60 секунд)..."
sleep 60

echo ""
echo "🌐 === ЭТАП 4: ТЕСТИРОВАНИЕ API ==="

# Функция для тестирования HTTP endpoint
test_endpoint() {
    local name="$1"
    local url="$2"
    local expected_status="$3"
    
    log_info "Тестирование: $name"
    
    if command -v curl >/dev/null 2>&1; then
        response_code=$(curl -s -o /dev/null -w "%{http_code}" "$url" || echo "000")
        
        if [ "$response_code" = "$expected_status" ]; then
            log_success "$name доступен (HTTP $response_code)"
            ((TESTS_PASSED++))
        else
            log_error "$name недоступен (HTTP $response_code, ожидался $expected_status)"
            ((TESTS_FAILED++))
        fi
    else
        log_warning "curl не установлен, пропускаем HTTP тесты"
        ((WARNINGS++))
    fi
}

# Тестирование основных endpoints
test_endpoint "Backend Health Check" "http://localhost:3001/health" "200"
test_endpoint "Frontend" "http://localhost:8080/" "200"
test_endpoint "Auth Setup Page" "http://localhost:3001/auth/setup" "200"
test_endpoint "API Test DB" "http://localhost:3001/api/test/db" "200"

echo ""
echo "🔍 === ЭТАП 5: ПРОВЕРКА ЛОГОВ ==="

# Проверка логов на ошибки
log_info "Анализ логов backend..."
backend_logs=$(docker-compose logs backend 2>/dev/null | tail -50)

if echo "$backend_logs" | grep -qi "error\|exception\|failed"; then
    log_warning "Найдены потенциальные ошибки в логах backend"
    ((WARNINGS++))
    echo "Последние строки логов:"
    echo "$backend_logs" | tail -10
else
    log_success "Логи backend выглядят чистыми"
    ((TESTS_PASSED++))
fi

log_info "Анализ логов frontend..."
frontend_logs=$(docker-compose logs frontend 2>/dev/null | tail -50)

if echo "$frontend_logs" | grep -qi "error\|exception\|failed"; then
    log_warning "Найдены потенциальные ошибки в логах frontend"
    ((WARNINGS++))
else
    log_success "Логи frontend выглядят чистыми"
    ((TESTS_PASSED++))
fi

echo ""
echo "🏥 === ЭТАП 6: HEALTH CHECKS ==="

# Проверка Docker health статуса
log_info "Проверка health статуса контейнеров..."

backend_health=$(docker-compose ps --format "table {{.Name}}\t{{.Status}}" | grep backend | grep -o "healthy\|unhealthy\|starting" || echo "unknown")
frontend_health=$(docker-compose ps --format "table {{.Name}}\t{{.Status}}" | grep frontend | grep -o "healthy\|unhealthy\|starting" || echo "unknown")

if [ "$backend_health" = "healthy" ]; then
    log_success "Backend health check: здоровый"
    ((TESTS_PASSED++))
else
    log_warning "Backend health check: $backend_health"
    ((WARNINGS++))
fi

if [ "$frontend_health" = "healthy" ]; then
    log_success "Frontend health check: здоровый"
    ((TESTS_PASSED++))
else
    log_warning "Frontend health check: $frontend_health"
    ((WARNINGS++))
fi

echo ""
echo "🔄 === ЭТАП 7: ИНТЕГРАЦИОННЫЕ ТЕСТЫ ==="

# Проверка доступности внешних сервисов
check_external_service() {
    local service_name="$1"
    local service_url="$2"
    
    if command -v curl >/dev/null 2>&1; then
        if curl -s --connect-timeout 10 "$service_url" >/dev/null; then
            log_success "$service_name доступен"
        else
            log_warning "$service_name недоступен или отвечает с ошибкой"
            ((WARNINGS++))
        fi
    fi
}

log_info "Проверка доступности внешних сервисов..."
check_external_service "AmoCRM API" "https://new5a097b0640fce.amocrm.ru"
check_external_service "VK API" "https://api.vk.com"
check_external_service "Telegram API" "https://api.telegram.org"

echo ""
echo "💾 === ЭТАП 8: ПРОВЕРКА ПЕРСИСТЕНТНОСТИ ==="

# Проверка volumes
log_info "Проверка Docker volumes..."
if docker volume ls | grep -q "tokens_volume"; then
    log_success "Volume для токенов создан"
    ((TESTS_PASSED++))
else
    log_warning "Volume для токенов не найден"
    ((WARNINGS++))
fi

# Проверка persistent_data директории
if [ -d "persistent_data" ]; then
    log_success "Директория persistent_data создана"
    ((TESTS_PASSED++))
else
    log_warning "Директория persistent_data не найдена"
    ((WARNINGS++))
fi

echo ""
echo "📊 === ФИНАЛЬНЫЙ ОТЧЕТ ==="

total_tests=$((TESTS_PASSED + TESTS_FAILED))
success_rate=0

if [ $total_tests -gt 0 ]; then
    success_rate=$((TESTS_PASSED * 100 / total_tests))
fi

echo "════════════════════════════════════════════════════════"
echo "📈 СТАТИСТИКА ТЕСТИРОВАНИЯ:"
echo "   ✅ Успешных тестов: $TESTS_PASSED"
echo "   ❌ Неудачных тестов: $TESTS_FAILED"
echo "   ⚠️  Предупреждений: $WARNINGS"
echo "   📊 Процент успеха: $success_rate%"
echo "════════════════════════════════════════════════════════"

# Рекомендации
echo ""
echo "💡 РЕКОМЕНДАЦИИ:"

if [ $TESTS_FAILED -eq 0 ] && [ $WARNINGS -eq 0 ]; then
    log_success "Проект готов к деплою! Все проверки прошли успешно."
    echo "🚀 Можно приступать к деплою на продакшн сервер."
elif [ $TESTS_FAILED -eq 0 ] && [ $WARNINGS -gt 0 ]; then
    log_warning "Проект условно готов к деплою."
    echo "🔧 Рекомендуется устранить предупреждения для лучшей стабильности."
else
    log_error "Проект НЕ готов к деплою!"
    echo "🛠️  Необходимо устранить критические ошибки перед деплоем."
fi

echo ""
echo "📋 СЛЕДУЮЩИЕ ШАГИ:"
echo "1. Устраните критические ошибки (если есть)"
echo "2. Рассмотрите предупреждения"
echo "3. Проверьте настройки production окружения"
echo "4. Выполните backup важных данных"
echo "5. Запустите деплой с мониторингом"

echo ""
echo "🔗 ПОЛЕЗНЫЕ КОМАНДЫ:"
echo "   docker-compose logs backend    # Логи бэкенда"
echo "   docker-compose logs frontend   # Логи фронтенда"
echo "   docker-compose ps              # Статус контейнеров"
echo "   curl http://localhost:3001/health  # Health check"

# Определяем код выхода
if [ $TESTS_FAILED -gt 0 ]; then
    echo ""
    log_error "Завершение с ошибками (код выхода: 1)"
    exit 1
else
    echo ""
    log_success "Тестирование завершено успешно (код выхода: 0)"
    exit 0
fi
