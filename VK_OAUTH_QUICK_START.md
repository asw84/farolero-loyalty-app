# VK OAuth Quick Start

## 🚀 Быстрый запуск

### 1. Установка зависимостей
```bash
cd backend
npm install jsonwebtoken
```

### 2. Настройка переменных окружения
Скопируйте `env.example` в `.env` и заполните:
```bash
cp env.example .env
```

**Обязательные переменные:**
```bash
VK_CLIENT_ID=XXXXXXXXXXXXXXXX
VK_CLIENT_SECRET=YYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYY
VK_REDIRECT_URI=https://api.5425685-au70735.twc1.net/api/oauth/vk/callback
JWT_SECRET=super_secret_for_state_use_strong_random_string
APP_BASE_URL=https://api.5425685-au70735.twc1.net
```

**Дополнительные настройки HTML шаблонов:**
```bash
# Основные настройки
VK_OAUTH_AUTO_CLOSE_DELAY=3000
VK_OAUTH_ERROR_AUTO_CLOSE_DELAY=5000

# Цвета и стили
VK_OAUTH_SUCCESS_BG=linear-gradient(135deg, #667eea 0%, #764ba2 100%)
VK_OAUTH_ERROR_BG=linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%)

# Тексты
VK_OAUTH_SUCCESS_TITLE=✅ Авторизация VK завершена!
VK_OAUTH_SUCCESS_MSG=Аккаунт VK успешно привязан к вашему Telegram аккаунту.
```

### 3. Настройка приложения VK
- **Тип приложения**: Website (Сайт)
- **Authorized redirect URI**: `https://api.5425685-au70735.twc1.net/api/oauth/vk/callback`
- **Base domain**: `api.5425685-au70735.twc1.net`

### 4. Запуск сервера
```bash
npm start
```

## 🔗 Настроенные endpoints

### OAuth Flow
- `GET /auth/vk/login?tg_user_id=123` - Инициация авторизации VK
- `GET /api/oauth/vk/callback` - Обработка OAuth callback

### Управление HTML шаблонами
- `GET /api/vk/oauth/templates/config` - Получить конфигурацию шаблонов
- `PUT /api/vk/oauth/templates/config` - Обновить конфигурацию шаблонов

### Управление конфигурацией VK
- `GET /api/vk/config` - Получить конфигурацию VK
- `PUT /api/vk/config` - Обновить конфигурацию VK
- `POST /api/vk/config/refresh` - Обновить через API VK
- `POST /api/vk/config/confirmation-code` - Получить строку подтверждения
- `GET /api/vk/config/status` - Статус сервиса

## 🧪 Тестирование

### Тест OAuth flow
```bash
# Откройте в браузере:
https://api.5425685-au70735.twc1.net/auth/vk/login?tg_user_id=123
```

### Проверка конфигурации
```bash
# Конфигурация шаблонов
curl http://localhost:3001/api/vk/oauth/templates/config

# Конфигурация VK
curl http://localhost:3001/api/vk/config

# Статус сервиса
curl http://localhost:3001/api/vk/config/status
```

### Обновление строки подтверждения
```bash
curl -X POST http://localhost:3001/api/vk/config/confirmation-code \
  -H "Content-Type: application/json" \
  -d '{"groupId":"123456789","accessToken":"your_token"}'
```

## 🎨 Настройка внешнего вида

### Изменение цветов
```bash
# В .env файле
VK_OAUTH_SUCCESS_BG=linear-gradient(135deg, #11998e 0%, #38ef7d 100%)
VK_OAUTH_SUCCESS_BTN_COLOR=#11998e
```

### Изменение текстов
```bash
# В .env файле
VK_OAUTH_SUCCESS_TITLE=🎉 Добро пожаловать!
VK_OAUTH_SUCCESS_MSG=Ваш аккаунт VK успешно подключен!
```

### Кастомные стили
```bash
# В .env файле
VK_OAUTH_CUSTOM_CSS=.custom-class { font-size: 18px; }
VK_OAUTH_CUSTOM_JS=console.log('Custom script loaded!');
```

## 🔄 Автоматическое обновление

Система автоматически обновляет строку подтверждения VK через API метод `groups.getCallbackConfirmationCode` каждые `VK_CONFIG_UPDATE_INTERVAL` миллисекунд (по умолчанию 1 час).

## 📚 Документация

- [Полная документация](./docs/VK_OAUTH_FLEXIBLE_SYSTEM.md)
- [Настройка VK OAuth](./docs/VK_OAUTH_SETUP.md)

## 🆘 Поддержка

При возникновении проблем проверьте:
1. Правильность переменных окружения
2. Настройки приложения VK
3. Логи сервера
4. Статус сервиса через `/api/vk/config/status`
