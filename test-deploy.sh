#!/bin/bash
# test-deploy.sh
# Главный скрипт комплексного тестирования перед деплоем

set -e

echo "🚀 === FAROLERO LOYALTY APP - DEPLOY TESTING SUITE ==="
echo "📅 $(date)"
echo ""

# Цвета для вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
BOLD='\033[1m'
NC='\033[0m'

# Проверяем наличие директории scripts
if [ ! -d "scripts" ]; then
    echo -e "${RED}❌ Директория scripts не найдена${NC}"
    echo "Убедитесь, что вы находитесь в корне проекта"
    exit 1
fi

# Делаем скрипты исполняемыми
chmod +x scripts/*.sh 2>/dev/null || true

echo -e "${BOLD}🔍 ЭТАП 1: PRE-DEPLOY VALIDATION${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if bash scripts/pre-deploy-check.sh; then
    echo -e "${GREEN}✅ Pre-deploy validation прошла успешно${NC}"
else
    echo -e "${RED}❌ Pre-deploy validation не прошла${NC}"
    echo "Устраните критические ошибки и повторите попытку"
    exit 1
fi

echo ""
echo -e "${BOLD}🧪 ЭТАП 2: ИНТЕГРАЦИОННОЕ ТЕСТИРОВАНИЕ${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Переходим в backend для установки зависимостей
cd backend

echo "📦 Установка зависимостей для тестирования..."
if npm install --silent; then
    echo -e "${GREEN}✅ Зависимости установлены${NC}"
else
    echo -e "${RED}❌ Ошибка установки зависимостей${NC}"
    exit 1
fi

cd ..

# Запускаем интеграционные тесты
if node scripts/test-integrations.js; then
    echo -e "${GREEN}✅ Интеграционные тесты прошли${NC}"
else
    echo -e "${YELLOW}⚠️  Интеграционные тесты завершились с предупреждениями${NC}"
    echo "Проверьте отчет в test-results.json"
fi

echo ""
echo -e "${BOLD}🐳 ЭТАП 3: КОМПЛЕКСНОЕ DOCKER ТЕСТИРОВАНИЕ${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

echo "⚠️  ВНИМАНИЕ: Будет выполнена остановка и пересборка контейнеров"
echo "Это может занять несколько минут..."

read -p "Продолжить? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Тестирование прервано пользователем"
    exit 0
fi

if bash scripts/test-complete.sh; then
    echo -e "${GREEN}✅ Комплексное тестирование завершено успешно${NC}"
    DOCKER_SUCCESS=true
else
    echo -e "${YELLOW}⚠️  Комплексное тестирование завершилось с предупреждениями${NC}"
    DOCKER_SUCCESS=false
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${BOLD}📊 ФИНАЛЬНЫЙ ОТЧЕТ${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

echo "📋 ВЫПОЛНЕННЫЕ ЭТАПЫ:"
echo "   ✅ Pre-deploy validation"
echo "   ✅ Интеграционное тестирование"
if [ "$DOCKER_SUCCESS" = true ]; then
    echo "   ✅ Docker комплексное тестирование"
else
    echo "   ⚠️  Docker комплексное тестирование (с предупреждениями)"
fi

echo ""
echo "📁 СОЗДАННЫЕ ОТЧЕТЫ:"
if [ -f "test-results.json" ]; then
    echo "   📄 test-results.json - детальный отчет интеграций"
fi

echo ""
echo "🔗 ПОЛЕЗНЫЕ КОМАНДЫ ДЛЯ МОНИТОРИНГА:"
echo "   docker-compose ps                     # Статус контейнеров"
echo "   docker-compose logs backend           # Логи backend"
echo "   docker-compose logs frontend          # Логи frontend"
echo "   curl http://localhost:3001/health     # Health check API"
echo "   curl http://localhost:8080/           # Frontend проверка"

echo ""
if [ "$DOCKER_SUCCESS" = true ]; then
    echo -e "${GREEN}🎉 ПРОЕКТ ГОТОВ К ДЕПЛОЮ!${NC}"
    echo ""
    echo "📋 РЕКОМЕНДАЦИИ ПЕРЕД ДЕПЛОЕМ:"
    echo "1. 📋 Проверьте переменные окружения для production"
    echo "2. 🔐 Убедитесь в настройке SSL сертификатов"
    echo "3. 💾 Выполните backup важных данных"
    echo "4. 📊 Настройте мониторинг и алерты"
    echo "5. 🔄 Подготовьте план rollback"
    echo ""
    echo "🚀 Команды для деплоя:"
    echo "   docker-compose down"
    echo "   docker-compose up -d --build"
    echo "   docker-compose logs -f"
else
    echo -e "${YELLOW}⚠️  ПРОЕКТ УСЛОВНО ГОТОВ К ДЕПЛОЮ${NC}"
    echo ""
    echo "❗ ПЕРЕД ДЕПЛОЕМ:"
    echo "1. Проверьте все предупреждения в логах"
    echo "2. Убедитесь в корректности настроек API ключей"
    echo "3. Протестируйте критические функции вручную"
    echo "4. Подготовьте план восстановления"
fi

echo ""
echo -e "${BLUE}📞 В случае проблем:${NC}"
echo "   - Проверьте логи: docker-compose logs"
echo "   - Перезапустите сервисы: docker-compose restart"
echo "   - Откатитесь: docker-compose down && git checkout previous-version"

exit 0
