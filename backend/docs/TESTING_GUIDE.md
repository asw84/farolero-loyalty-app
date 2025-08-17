# 🧪 Руководство по тестированию проекта

## 🎯 Обзор системы тестирования

Проект включает **4-уровневую систему тестирования** для обеспечения качества и надежности перед деплоем:

### 🔄 Уровни тестирования:

1. **🔍 Pre-deploy validation** - быстрая проверка готовности
2. **🧪 Unit/API тесты** - тестирование функционала
3. **🔗 Интеграционные тесты** - проверка внешних сервисов  
4. **🐳 Docker комплексное тестирование** - полная проверка деплоя

---

## 🚀 Быстрый старт

### Запуск полного тестирования:
```bash
chmod +x test-deploy.sh
./test-deploy.sh
```

### Поэтапный запуск:
```bash
# 1. Быстрая проверка
bash scripts/pre-deploy-check.sh

# 2. Интеграционные тесты
node scripts/test-integrations.js

# 3. Полное Docker тестирование
bash scripts/test-complete.sh
```

---

## 📁 Структура тестов

```
├── test-deploy.sh                 # 🎯 Главный скрипт тестирования
├── scripts/
│   ├── pre-deploy-check.sh        # ⚡ Быстрая валидация
│   ├── test-complete.sh           # 🐳 Комплексное Docker тестирование
│   └── test-integrations.js       # 🔗 Тесты интеграций
├── backend/
│   └── tests/
│       ├── api.test.js            # 🧪 API unit тесты
│       └── integrations.test.js   # 🔗 Jest интеграционные тесты
└── test-results.json              # 📊 Отчеты тестирования
```

---

## 🔍 Детальное описание

### 1. **Pre-deploy Validation** (`scripts/pre-deploy-check.sh`)

**Цель:** Быстрая проверка базовых требований (30 сек)

**Проверяет:**
- ✅ Установку Docker и Docker Compose
- ✅ Наличие обязательных файлов
- ✅ Настройку критических переменных окружения
- ✅ Валидность docker-compose.yml
- ✅ Доступность портов

**Запуск:**
```bash
bash scripts/pre-deploy-check.sh
```

**Результат:**
- `Код 0` - можно продолжать деплой
- `Код 1` - критические ошибки, деплой невозможен

---

### 2. **API Unit Tests** (`backend/tests/api.test.js`)

**Цель:** Тестирование всех API endpoints

**Покрывает:**
- 🩺 Health checks
- 💾 Database operations  
- 👤 User management
- 🎯 Referral system
- 📊 Analytics & RFM
- 🔐 Authentication
- 🛒 Order processing
- ❌ Error handling
- ⚡ Performance tests

**Запуск:**
```bash
cd backend
npm run test:api
```

---

### 3. **Integration Tests** (`scripts/test-integrations.js`)

**Цель:** Проверка работы с внешними сервисами

**Тестирует:**
- 🏢 **AmoCRM API** - доступность и авторизация
- 🔵 **VK API** - OAuth настройки
- 📸 **Instagram API** - конфигурация
- 📱 **Telegram Bot API** - валидность токена
- 🏠 **Local Backend** - health check
- ⚙️ **Environment Config** - переменные окружения
- 📁 **File System** - наличие файлов

**Запуск:**
```bash
node scripts/test-integrations.js
```

**Отчет:** Сохраняется в `test-results.json`

---

### 4. **Docker Complete Testing** (`scripts/test-complete.sh`)

**Цель:** Полная проверка Docker деплоя (5-10 мин)

**Этапы:**
1. **🔍 Environment Check** - окружение
2. **🔨 Build & Local Tests** - сборка и локальные тесты  
3. **🐳 Docker Testing** - контейнеры
4. **🌐 API Testing** - HTTP endpoints
5. **🔍 Log Analysis** - анализ логов
6. **🏥 Health Checks** - Docker health статус
7. **🔄 Integration Tests** - внешние сервисы
8. **💾 Persistence Tests** - volumes и данные

**Запуск:**
```bash
bash scripts/test-complete.sh
```

---

## 📊 Интерпретация результатов

### ✅ **Успешные тесты (Код выхода: 0)**
- Проект готов к деплою
- Все критические компоненты работают
- Можно переходить к production

### ⚠️ **Предупреждения**
- Проект условно готов к деплою
- Некритические проблемы (например, не настроены опциональные API)
- Рекомендуется устранить перед production

### ❌ **Ошибки (Код выхода: 1)**
- Деплой невозможен
- Критические проблемы требуют исправления
- Необходимо устранить ошибки

---

## 🛠️ Настройка CI/CD

### GitHub Actions пример:

```yaml
name: Deploy Tests
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Run Pre-deploy Check
        run: bash scripts/pre-deploy-check.sh
      - name: Run Integration Tests  
        run: node scripts/test-integrations.js
      - name: Run Complete Docker Tests
        run: bash scripts/test-complete.sh
```

---

## 🔧 Конфигурация тестов

### Environment Variables для тестирования:

```env
# Обязательные
AMOCRM_DOMAIN=your-domain.amocrm.ru
AMOCRM_CLIENT_ID=your-client-id
AMOCRM_CLIENT_SECRET=your-secret
VK_CLIENT_ID=your-vk-id
JWT_SECRET=your-jwt-secret

# Опциональные (для полного покрытия)
TELEGRAM_BOT_TOKEN=your-bot-token
VK_CLIENT_SECRET=your-vk-secret
INSTAGRAM_APP_ID=your-insta-id
INSTAGRAM_APP_SECRET=your-insta-secret
```

### Jest Configuration:

```json
{
  "testEnvironment": "node",
  "testTimeout": 30000,
  "setupFilesAfterEnv": ["./tests/setup.js"]
}
```

---

## 🚨 Troubleshooting

### Типичные проблемы:

1. **Docker не запускается**
   ```bash
   sudo systemctl start docker
   docker-compose down --remove-orphans
   ```

2. **Порты заняты**
   ```bash
   netstat -tuln | grep 3001
   docker-compose down
   ```

3. **Тесты API падают**
   ```bash
   # Проверьте health check
   curl http://localhost:3001/health
   
   # Проверьте логи
   docker-compose logs backend
   ```

4. **Интеграционные тесты не проходят**
   ```bash
   # Проверьте переменные окружения
   cat backend/.env
   
   # Проверьте сетевое подключение
   ping api.vk.com
   ```

### Восстановление после ошибок:

```bash
# Полная очистка
docker-compose down --remove-orphans --volumes
docker system prune -f

# Пересборка
docker-compose build --no-cache
docker-compose up -d
```

---

## 📈 Метрики качества

### Целевые показатели:
- **API Tests:** ≥ 95% success rate
- **Integration Tests:** ≥ 90% success rate  
- **Docker Health:** 100% healthy
- **Response Time:** < 1000ms
- **Error Rate:** < 5%

### Мониторинг:
- Логи в реальном времени: `docker-compose logs -f`
- Health checks: `curl http://localhost:3001/health`
- Статус контейнеров: `docker-compose ps`

---

## 🎯 Best Practices

### Перед каждым деплоем:
1. ✅ Запустите `./test-deploy.sh`
2. ✅ Проверьте все предупреждения
3. ✅ Убедитесь в готовности production переменных
4. ✅ Сделайте backup важных данных
5. ✅ Подготовьте план rollback

### Регулярное тестирование:
- **Ежедневно:** `bash scripts/pre-deploy-check.sh`  
- **Перед релизом:** `./test-deploy.sh`
- **После изменений:** Соответствующие unit тесты

### Мониторинг production:
- Health checks каждые 30 секунд
- Алерты при падении сервисов
- Логирование всех критических операций

---

Эта система тестирования обеспечивает **максимальную надежность** деплоя и **быстрое выявление** проблем на всех этапах разработки! 🚀
