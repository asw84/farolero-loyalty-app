# 🔵 Автоматическая настройка VK интеграции

## 🎯 Быстрая настройка (5 минут)

### 1. Получение VK ключей

#### Шаг 1: Заходим в VK Developers
```bash
# Открываем браузер
https://dev.vk.com/
```

#### Шаг 2: Создаем/выбираем приложение
- **Тип**: Веб-сайт  
- **Домен**: `api.5425685-au70735.twc1.net`
- **Redirect URI**: `https://api.5425685-au70735.twc1.net/api/oauth/vk/callback`

#### Шаг 3: Копируем ключи
```env
VK_CLIENT_ID=54020028                    # ✅ Уже настроен
VK_CLIENT_SECRET=РЕАЛЬНЫЙ_ЗАЩИЩЁННЫЙ_КЛЮЧ  # ❌ Нужно заменить
VK_SERVICE_KEY=РЕАЛЬНЫЙ_СЕРВИСНЫЙ_КЛЮЧ     # ❌ Нужно заменить
```

---

## 🛠️ Автоматическая проверка

### Запуск диагностики
```bash
cd backend
node test-vk-integration.js
```

### Ожидаемый результат
```
✅ VK_CLIENT_ID настроен: 54020028
✅ VK_CLIENT_SECRET настроен  
✅ VK_REDIRECT_URI настроен
✅ JWT_SECRET настроен
✅ VK API доступен

🎯 VK готовность: 100%
```

---

## 🔧 Автоматический скрипт настройки

### Создание .env с правильными ключами
```bash
# Запуск интерактивной настройки
node scripts/setup-vk-keys.js
```

Скрипт запросит:
1. VK_CLIENT_SECRET из разработки  
2. VK_SERVICE_KEY (опционально)
3. VK_GROUP_ID (для отслеживания активности)
4. Сгенерирует JWT_SECRET автоматически

---

## 📊 Уровни интеграции VK

### Уровень 1: Базовая авторизация (90%)
```env
VK_CLIENT_ID=54020028
VK_CLIENT_SECRET=ваш_реальный_ключ  # ⚠️ ОБЯЗАТЕЛЬНО
VK_REDIRECT_URI=https://api.5425685-au70735.twc1.net/api/oauth/vk/callback
JWT_SECRET=auto_generated_secret
```

**Что работает**: OAuth авторизация, привязка аккаунтов

### Уровень 2: VK ID API (95%)
```env
# + Уровень 1
VK_SERVICE_KEY=ваш_сервисный_ключ  # Для расширенных функций
```

**Что работает**: + Получение расширенной информации пользователя

### Уровень 3: Отслеживание активности (100%)
```env
# + Уровень 2  
VK_GROUP_ID=123456789              # ID вашей группы
VK_GROUP_TOKEN=групповой_токен     # Токен с правами
```

**Что работает**: + Отслеживание лайков, комментариев, репостов

---

## 🚀 Тестирование после настройки

### Проверка авторизации
```bash
curl "https://api.5425685-au70735.twc1.net/api/oauth/vk/login?tg_user_id=test_123"
```

### Проверка через веб-интерфейс
```
https://api.5425685-au70735.twc1.net/auth/vk-test
```

### Health check
```bash
curl "https://api.5425685-au70735.twc1.net/health"
```

---

## ❌ Частые ошибки

### Ошибка: "VK_CLIENT_SECRET содержит placeholder"
```bash
# Проблема: VK_CLIENT_SECRET=ВАШ_ЗАЩИЩЁННЫЙ_КЛЮЧ_ИЗ_VK

# Решение:
1. Зайти в https://dev.vk.com/
2. Выбрать приложение
3. Скопировать "Защищённый ключ" 
4. Заменить в backend/.env
```

### Ошибка: "OAuth redirect_uri mismatch"
```bash
# Проблема: Неправильный redirect_uri в настройках VK

# Решение:
1. В настройках VK приложения
2. Добавить: https://api.5425685-au70735.twc1.net/api/oauth/vk/callback
3. Сохранить изменения
```

### Ошибка: "JWT_SECRET too short"
```bash
# Автоматическая генерация нового секрета:
node -e "console.log('JWT_SECRET=' + require('crypto').randomBytes(64).toString('hex'))"
```

---

## 📋 Чек-лист готовности

- [ ] VK_CLIENT_SECRET заменен на реальный ключ
- [ ] VK_SERVICE_KEY настроен (опционально)  
- [ ] JWT_SECRET сгенерирован (32+ символов)
- [ ] VK_REDIRECT_URI добавлен в настройки приложения
- [ ] `node test-vk-integration.js` показывает 100%
- [ ] Тестовая авторизация работает

---

## 🔐 Безопасность

### ❌ НЕ коммитить в Git
```bash
# Эти файлы в .gitignore:
backend/.env
backend/tokens.json
```

### ✅ Для production
```bash
# Использовать переменные окружения Docker:
docker-compose.yml:
  environment:
    - VK_CLIENT_SECRET=${VK_CLIENT_SECRET}
    - VK_SERVICE_KEY=${VK_SERVICE_KEY}
```

### 🔄 Ротация ключей
```bash
# Каждые 90 дней обновлять:
1. VK_CLIENT_SECRET в VK Developers
2. VK_SERVICE_KEY
3. JWT_SECRET (генерировать новый)
```

---

*Документ создан для быстрой настройки VK интеграции проекта Farolero Loyalty App*
