# 🔐 VK OAuth Setup для Telegram Mini-App

## 📋 Обзор
Данная инструкция описывает настройку VK OAuth для Telegram mini-app без использования Mini Apps "Размещение".

## 🎯 Предпосылки
- ✅ Бэкенд с публичным HTTPS и роутом коллбэка
- ✅ Тип приложения VK — Website (Сайт), не Standalone
- ✅ Кнопка в Telegram mini-app открывает внешний браузер (не WebView)

## ⚙️ Настройка приложения VK

### 1. Настройки VK приложения
В настройках приложения VK задайте:

- **Authorized redirect URI**: `https://api.5425685-au70735.twc1.net/api/oauth/vk/callback`
- **Base domain**: `api.5425685-au70735.twc1.net`
- **Site address**: ваш основной сайт (не критично для OAuth)

**Важно**: Сохраните настройки и подождите 1-2 минуты. `redirect_uri` в настройках VK и в запросе должны совпадать посимвольно.

## 🔧 Переменные окружения

Создайте файл `.env` в папке `backend/`:

```bash
# VK OAuth Configuration
VK_CLIENT_ID=XXXXXXXXXXXXXXXX
VK_CLIENT_SECRET=YYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYY
VK_REDIRECT_URI=https://api.5425685-au70735.twc1.net/api/oauth/vk/callback

# JWT Configuration for OAuth state security
JWT_SECRET=super_secret_for_state_use_strong_random_string

# App Configuration
APP_BASE_URL=https://api.5425685-au70735.twc1.net
```

## 🚀 Установка зависимостей

### Автоматическая установка
```bash
cd backend
chmod +x install-vk-oauth.sh
./install-vk-oauth.sh
```

### Ручная установка
```bash
cd backend
npm install jsonwebtoken
```

## 🔗 API Endpoints

### 1. Инициация авторизации
```
GET /auth/vk/login?tg_user_id=123
```

**Описание**: Формирует URL для авторизации VK и редиректит пользователя.

**Параметры**:
- `tg_user_id` (обязательный) - ID пользователя в Telegram

**Пример использования**:
```javascript
// В Telegram mini-app
const authUrl = `https://api.5425685-au70735.twc1.net/auth/vk/login?tg_user_id=${telegramUserId}`;
// Открыть во внешнем браузере
window.open(authUrl, '_blank');
```

### 2. OAuth Callback
```
GET /api/oauth/vk/callback?code=...&state=...
```

**Описание**: Обрабатывает callback от VK, обменивает код на токен и связывает аккаунт.

**Параметры** (от VK):
- `code` - временный код авторизации
- `state` - JWT токен с telegram_user_id
- `error` - ошибка (если есть)
- `error_description` - описание ошибки

## 🧪 Тестирование

### 1. Тест "чистым минимумом"
Откройте в обычном браузере:
```
https://oauth.vk.com/authorize?client_id=VK_CLIENT_ID&redirect_uri=https%3A%2F%2Fapi.5425685-au70735.twc1.net%2Fapi%2Foauth%2Fvk%2Fcallback&response_type=code&v=5.199&display=page&state=test
```

**Замените**:
- `VK_CLIENT_ID` на ваш реальный Client ID
- Убедитесь, что `redirect_uri` закодирован правильно

### 2. Проверка коллбэка
1. Пройдите логин VK
2. Убедитесь, что запрос приходит на ваш коллбэк
3. Проверьте обмен кода на токен

### 3. Тест через API
```bash
# Проверка логин роута
curl "https://api.5425685-au70735.twc1.net/auth/vk/login?tg_user_id=123"

# Проверка коллбэка (локально)
curl "http://localhost:3001/api/oauth/vk/callback"
```

## 🚨 Частые ошибки и решения

### 1. redirect_uri не совпадает
**Проблема**: URI в настройках VK и в запросе отличаются
**Решение**: Скопируйте из .env, закодируйте и проверьте 1:1

### 2. Base domain не совпадает
**Проблема**: Домен в настройках VK не совпадает с доменом редиректа
**Решение**: Установите `api.5425685-au70735.twc1.net`

### 3. Открытие в Telegram WebView
**Проблема**: Ссылка открывается внутри Telegram
**Решение**: Принудительно открывайте во внешнем браузере

### 4. 404/500 на коллбэке
**Проблема**: Ошибки на сервере
**Решение**: Проверьте роуты и логи сервера

### 5. Неверные credentials
**Проблема**: Неправильный client_id или client_secret
**Решение**: Перепроверьте приложение и env

## 📝 Логирование

### Включение логов
Сервис автоматически логирует:
- Вход в `/auth/vk/login`: tg_user_id, redirect_uri
- Приход в `/api/oauth/vk/callback`: параметры, домен
- URL обмена токена (без секретов)
- Статус и ответ VK (маскируя токены)

### Примеры логов
```
[VK_OAUTH_SERVICE] 🔗 Сформирован URL авторизации для Telegram ID 123
[VK_OAUTH_SERVICE] 📍 Redirect URI: https://api.5425685-au70735.twc1.net/api/oauth/vk/callback
[VK_OAUTH_SERVICE] 📥 Получен OAuth callback с code: present, state: present
[VK_OAUTH_SERVICE] ✅ Получен токен для VK пользователя 456789, expires in 86400s
```

## 🔒 Безопасность

### JWT State
- State содержит telegram_user_id в JWT токене
- Токен истекает через 10 минут
- Защищает от CSRF атак

### Валидация
- Проверка обязательных параметров
- Валидация JWT state
- Обработка ошибок VK

## 📱 Интеграция с Telegram Mini-App

### Кнопка авторизации
```javascript
// В вашем mini-app
function openVKOAuth(telegramUserId) {
    const authUrl = `https://api.5425685-au70735.twc1.net/auth/vk/login?tg_user_id=${telegramUserId}`;
    
    // Открыть во внешнем браузере
    if (window.Telegram && window.Telegram.WebApp) {
        window.Telegram.WebApp.openTelegramLink(authUrl);
    } else {
        window.open(authUrl, '_blank');
    }
}
```

### Обработка результата
После успешной авторизации пользователь получит HTML страницу с сообщением об успехе и автоматическим закрытием вкладки.

## 🔄 Обновление AmoCRM
При успешной авторизации VK ID автоматически записывается в кастомное поле AmoCRM для соответствующего контакта.

## 📚 Дополнительные ресурсы

- [VK OAuth Documentation](https://vk.com/dev/auth_sites)
- [JWT Documentation](https://jwt.io/)
- [Telegram Mini Apps](https://core.telegram.org/bots/webapps)

## 🆘 Поддержка

При возникновении проблем:
1. Проверьте логи сервера
2. Убедитесь, что все переменные окружения установлены
3. Проверьте настройки VK приложения
4. Протестируйте "чистым минимумом"
5. Проверьте права доступа к файлам конфигурации
