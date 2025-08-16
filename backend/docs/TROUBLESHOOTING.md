# 🔧 Устранение проблем - Farolero Loyalty App

## 🚨 Основные проблемы и их решения

### 1. ❌ Слетает токен авторизации AmoCRM

**Проблема:** При перезапуске Docker контейнера теряется файл `tokens.json` с токенами AmoCRM.

**Решение:**
1. ✅ **Исправлено:** Добавлен persistent volume для токенов в `docker-compose.yml`
2. ✅ **Исправлено:** Добавлен fallback для восстановления из переменных окружения
3. ✅ **Исправлено:** Улучшена система сохранения токенов

**Что делать:**
```bash
# Обновите refresh_token в .env из реального tokens.json
cp backend/tokens.json backend/tokens.json.backup
# Скопируйте refresh_token в AMOCRM_REFRESH_TOKEN в .env

# Перезапустите с новой конфигурацией
docker-compose down
docker-compose up --build
```

### 2. ❌ Не работает авторизация VK

**Проблема:** В .env настроены фиктивные ключи VK.

**Что исправить в `.env`:**
```env
# Замените на реальные значения
VK_CLIENT_SECRET=REAL_VK_CLIENT_SECRET_REQUIRED
VK_SERVICE_KEY=REAL_VK_SERVICE_KEY_REQUIRED
```

**Как получить ключи:**
1. Перейдите в [VK Developers](https://dev.vk.com/)
2. Создайте приложение типа "Mini App"
3. Получите Client Secret и Service Key
4. Обновите `.env` файл

### 3. ❌ Не работает авторизация Instagram

**Проблема:** Отсутствуют переменные для Instagram OAuth.

**Что добавить в `.env`:**
```env
INSTAGRAM_APP_ID=YOUR_INSTAGRAM_APP_ID
INSTAGRAM_APP_SECRET=YOUR_INSTAGRAM_APP_SECRET
INSTAGRAM_REDIRECT_URI=https://api.5425685-au70735.twc1.net/api/instagram/callback
```

**Как получить ключи:**
1. Перейдите в [Meta for Developers](https://developers.facebook.com/)
2. Создайте приложение Instagram Basic Display
3. Настройте OAuth redirect URI
4. Получите App ID и App Secret

### 4. ❌ AmoCRM не отслеживает кастомные поля

**Проблема:** ID полей жестко закодированы в `config.js`.

**Автоматическое решение:**
```bash
# Запустите утилиту автоопределения
cd backend
node utils/autodetect-fields.js
```

**Ручное решение:**
1. Перейдите в AmoCRM → Настройки → Поля
2. Найдите ID полей для Telegram, VK, Instagram, баллов
3. Обновите `backend/config.js`:
```javascript
const TELEGRAM_ID_FIELD_ID = 'ВАШ_ID';
const POINTS_FIELD_ID = 'ВАШ_ID';
const VK_ID_FIELD_ID = 'ВАШ_ID';
const INSTAGRAM_ID_FIELD_ID = 'ВАШ_ID';
```

### 5. ❌ При перезапуске Docker слетают настройки

**Решение:** ✅ **Исправлено** в `docker-compose.yml`

Добавлены persistent volumes:
- `./persistent_data:/app/persistent_data` - для БД и конфигов
- `tokens_volume:/app/tokens` - для токенов AmoCRM

## 🔍 Диагностика проблем

### Проверка токенов AmoCRM
```bash
# Проверить текущие токены
cat backend/tokens.json

# Тестировать подключение к AmoCRM
curl http://localhost:3001/api/amocrm/test
```

### Проверка VK авторизации
```bash
# Проверить конфигурацию VK
curl http://localhost:3001/api/vk/oauth/templates/config
```

### Проверка логов
```bash
# Логи backend
docker-compose logs backend

# Логи всех сервисов
docker-compose logs -f
```

## 📋 Чек-лист восстановления

- [ ] **Переменные окружения настроены**
  - [ ] VK_CLIENT_SECRET (реальный ключ)
  - [ ] VK_SERVICE_KEY (реальный ключ) 
  - [ ] INSTAGRAM_APP_ID (реальный ID)
  - [ ] INSTAGRAM_APP_SECRET (реальный секрет)
  - [ ] TELEGRAM_BOT_TOKEN (реальный токен)
  - [ ] AMOCRM_REFRESH_TOKEN (актуальный refresh token)

- [ ] **Кастомные поля AmoCRM настроены**
  - [ ] ID поля Telegram определен
  - [ ] ID поля VK определен
  - [ ] ID поля Instagram определен
  - [ ] ID поля баллов определен

- [ ] **Docker volumes созданы**
  - [ ] persistent_data директория существует
  - [ ] tokens_volume настроен в docker-compose.yml

- [ ] **Авторизация работает**
  - [ ] AmoCRM авторизация проходит
  - [ ] VK авторизация проходит
  - [ ] Instagram авторизация проходит

## 🚀 Быстрое исправление

```bash
# Запустите автоматический скрипт исправления (Linux/Mac)
./fix-issues.sh

# Или вручную:
mkdir -p persistent_data persistent_data/database persistent_data/tokens
docker-compose down
docker-compose up --build
```

## 🆘 Если ничего не помогает

1. **Полная перезагрузка:**
```bash
docker-compose down -v  # Удаляет volumes
docker system prune -f  # Очищает кеш
docker-compose up --build
```

2. **Проверьте сеть:**
```bash
# Проверьте доступность AmoCRM API
curl -I https://new5a097b0640fce.amocrm.ru/api/v4/account

# Проверьте доступность VK API
curl -I https://api.vk.com/method/users.get
```

3. **Логи для отладки:**
```bash
# Включите детальные логи
export DEBUG=*
docker-compose up
```

## 🎯 Соответствие ТЗ - что доделать

### ✅ Реализовано
- Telegram Mini App
- AmoCRM интеграция (частично)
- Система баллов
- Admin панель (базовая)

### ⚠️ Частично реализовано
- VK авторизация (нужны реальные ключи)
- Instagram авторизация (нужны реальные ключи)
- Qtickets интеграция (есть API клиент)

### ❌ Не реализовано
- **RFM-анализ пользователей**
- **Реферальная система с QR-кодами**
- **Интеграция с Unisender для рассылок**
- **Отслеживание активности в соцсетях**
- **Начисление баллов за лайки, комментарии, репосты**
- **Система статусов и кэшбэка**

### 📈 Приоритетность доработок
1. **Высокий приоритет** - настройка реальных API ключей
2. **Средний приоритет** - реферальная система
3. **Низкий приоритет** - RFM-анализ и расширенная аналитика

---

*Обновлено: $(date)*
