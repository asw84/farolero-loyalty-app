# Гибкая система VK OAuth

## Обзор

Новая система VK OAuth решает проблему жестко прописанных ответов сервера, предоставляя гибкую конфигурацию через переменные окружения и API endpoints.

## Основные компоненты

### 1. HTML Template Service (`backend/services/html.template.service.js`)

Сервис для управления HTML шаблонами ответов VK OAuth с возможностью настройки:
- Цветов и стилей
- Текстов сообщений
- Времени автоматического закрытия
- Кастомных CSS и JavaScript

### 2. VK Config Service (`backend/services/vk.config.service.js`)

Сервис для динамического управления настройками VK:
- Автоматическое обновление строки подтверждения через API VK
- Управление конфигурацией группы
- Валидация настроек

## Конфигурация через переменные окружения

### HTML Templates

```bash
# Основные настройки
VK_OAUTH_AUTO_CLOSE_DELAY=3000
VK_OAUTH_ERROR_AUTO_CLOSE_DELAY=5000

# Цвета и стили
VK_OAUTH_SUCCESS_BG=linear-gradient(135deg, #667eea 0%, #764ba2 100%)
VK_OAUTH_ERROR_BG=linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%)
VK_OAUTH_SUCCESS_BTN_COLOR=#4CAF50
VK_OAUTH_ERROR_BTN_COLOR=#ff6b6b

# Тексты
VK_OAUTH_SUCCESS_TITLE=✅ Авторизация VK завершена!
VK_OAUTH_SUCCESS_MSG=Аккаунт VK успешно привязан к вашему Telegram аккаунту.
VK_OAUTH_SUCCESS_SUB_MSG=Теперь вы можете закрыть эту вкладку и вернуться в Telegram.
VK_OAUTH_CLOSE_BTN_TEXT=Закрыть вкладку

VK_OAUTH_ERROR_TITLE=❌ Ошибка авторизации VK
VK_OAUTH_ERROR_MSG=Произошла ошибка при привязке аккаунта VK.
VK_OAUTH_ERROR_SUB_MSG=Попробуйте еще раз или обратитесь в поддержку.

# Дополнительные настройки
VK_OAUTH_ENABLE_AUTO_CLOSE=true
VK_OAUTH_SHOW_CLOSE_BTN=true

# Кастомные CSS и JS (опционально)
VK_OAUTH_CUSTOM_CSS=
VK_OAUTH_CUSTOM_JS=
```

### VK Config

```bash
# VK Bot Configuration
VK_CONFIRMATION_TOKEN=your_confirmation_token_here
VK_SECRET_KEY=your_secret_key_here
VK_ACCESS_TOKEN=your_vk_access_token_here
VK_GROUP_ID=your_vk_group_id_here
VK_CONFIG_UPDATE_INTERVAL=3600000
```

## API Endpoints

### HTML Templates Management

#### Получить конфигурацию шаблонов
```http
GET /api/vk/oauth/templates/config
```

#### Обновить конфигурацию шаблонов
```http
PUT /api/vk/oauth/templates/config
Content-Type: application/json

{
  "successTitle": "🎉 Успешно!",
  "successMessage": "Ваш аккаунт VK привязан!",
  "autoCloseDelay": 5000
}
```

### VK Config Management

#### Получить конфигурацию VK
```http
GET /api/vk/config
```

#### Обновить конфигурацию VK
```http
PUT /api/vk/config
Content-Type: application/json

{
  "groupId": "123456789",
  "accessToken": "new_access_token"
}
```

#### Обновить конфигурацию через API VK
```http
POST /api/vk/config/refresh
```

#### Получить строку подтверждения
```http
POST /api/vk/config/confirmation-code
Content-Type: application/json

{
  "groupId": "123456789",
  "accessToken": "your_access_token"
}
```

#### Получить информацию о группе
```http
POST /api/vk/config/group-info
Content-Type: application/json

{
  "groupId": "123456789",
  "accessToken": "your_access_token"
}
```

#### Получить статус сервиса
```http
GET /api/vk/config/status
```

## Динамическое обновление строки подтверждения

### Автоматическое обновление

Сервис автоматически обновляет строку подтверждения VK через API метод `groups.getCallbackConfirmationCode`:

```javascript
// Автоматически каждые VK_CONFIG_UPDATE_INTERVAL миллисекунд
await vkConfigService.refreshConfig();
```

### Ручное обновление

```javascript
// Получить актуальную строку подтверждения
const confirmationCode = await vkConfigService.getCallbackConfirmationCode(groupId, accessToken);
```

## Примеры использования

### Изменение текста успешной авторизации

```bash
# В .env файле
VK_OAUTH_SUCCESS_TITLE=🎉 Добро пожаловать!
VK_OAUTH_SUCCESS_MSG=Ваш аккаунт VK успешно подключен!
```

### Изменение цветовой схемы

```bash
# В .env файле
VK_OAUTH_SUCCESS_BG=linear-gradient(135deg, #11998e 0%, #38ef7d 100%)
VK_OAUTH_SUCCESS_BTN_COLOR=#11998e
```

### Отключение автоматического закрытия

```bash
# В .env файле
VK_OAUTH_ENABLE_AUTO_CLOSE=false
```

### Добавление кастомных стилей

```bash
# В .env файле
VK_OAUTH_CUSTOM_CSS=.custom-class { font-size: 18px; }
VK_OAUTH_CUSTOM_JS=console.log('Custom script loaded!');
```

## Преимущества новой системы

1. **Гибкость**: Легко изменять внешний вид без переписывания кода
2. **Динамичность**: Автоматическое обновление настроек VK через API
3. **Конфигурируемость**: Все настройки через переменные окружения
4. **API управление**: Возможность изменения настроек через API endpoints
5. **Безопасность**: Строка подтверждения обновляется автоматически
6. **Мониторинг**: Статус и валидация конфигурации

## Миграция с жестко прописанных ответов

### Было (жестко прописано):
```javascript
const htmlResponse = `
<!DOCTYPE html>
<html>
<head>
    <title>VK Авторизация завершена</title>
    <style>
        body { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); }
    </style>
</head>
<body>
    <h1>✅ Авторизация VK завершена!</h1>
</body>
</html>`;
```

### Стало (гибко настраивается):
```javascript
const htmlResponse = htmlTemplateService.generateSuccessPage();
```

## Тестирование

### Проверка конфигурации шаблонов
```bash
curl http://localhost:3001/api/vk/oauth/templates/config
```

### Проверка конфигурации VK
```bash
curl http://localhost:3001/api/vk/config
```

### Обновление строки подтверждения
```bash
curl -X POST http://localhost:3001/api/vk/config/confirmation-code \
  -H "Content-Type: application/json" \
  -d '{"groupId":"123456789","accessToken":"your_token"}'
```

## Безопасность

- Все API endpoints защищены валидацией входных данных
- Строка подтверждения обновляется только через авторизованные запросы
- Конфигурация может быть ограничена по IP или через middleware аутентификации

## Мониторинг

Система предоставляет детальную информацию о:
- Времени последнего обновления конфигурации
- Интервале обновления
- Валидности настроек
- Ошибках и предупреждениях
