# 🔄 Миграция с Instagram Basic Display API на Instagram API with Instagram Login

## 🚨 Критическое обновление

**Instagram Basic Display API прекращает поддержку 4 декабря 2024 года.**

Официальная документация: [Instagram API with Instagram Login](https://developers.facebook.com/docs/instagram-platform/instagram-api-with-instagram-login)

---

## 📊 Сравнение API

| Характеристика | Basic Display API (устарел) | Instagram API with Instagram Login (новый) |
|---------------|---------------------------|-------------------------------------------|
| **Статус** | ❌ Устарел (4 дек 2024) | ✅ Активно поддерживается |
| **Тип аккаунта** | Личный Instagram | Instagram Business/Creator |
| **Facebook Page** | Не требуется | Не требуется |
| **Возможности** | Базовые (профиль, медиа) | Расширенные (insights, messaging, publishing) |
| **Scope values** | `user_profile`, `user_media` | `instagram_business_basic`, `instagram_business_content_publish` |

---

## 🔧 Необходимые изменения в коде

### 1. Обновление Scope Values

**Старые scope (устарели 27 января 2025):**
```javascript
// ❌ Устаревшие
scope: 'user_profile,user_media'
scope: 'business_basic,business_content_publish'
```

**Новые scope:**
```javascript
// ✅ Актуальные
scope: 'instagram_business_basic,instagram_business_content_publish'
```

### 2. Обновление API endpoints

**Старые endpoints:**
```javascript
// ❌ Basic Display API
https://graph.instagram.com/me
https://api.instagram.com/oauth/authorize
```

**Новые endpoints:**
```javascript
// ✅ Instagram API with Instagram Login
https://graph.instagram.com/me
https://www.instagram.com/oauth/authorize  // Изменился домен!
```

### 3. Обновление OAuth flow

**Старый код:**
```javascript
const authUrl = new URL('https://api.instagram.com/oauth/authorize');
authUrl.searchParams.set('scope', 'user_profile,user_media');
```

**Новый код:**
```javascript
const authUrl = new URL('https://www.instagram.com/oauth/authorize');
authUrl.searchParams.set('scope', 'instagram_business_basic,instagram_business_content_publish');
```

---

## 🛠️ План миграции

### Этап 1: Обновление Facebook App
- [ ] Удалить Instagram Basic Display продукт
- [ ] Добавить Instagram API продукт
- [ ] Настроить новые Redirect URIs
- [ ] Обновить App Review (если требуется)

### Этап 2: Обновление кода
- [ ] Изменить OAuth endpoints
- [ ] Обновить scope values
- [ ] Проверить API responses
- [ ] Обновить error handling

### Этап 3: Тестирование
- [ ] Тестирование с Business аккаунтом
- [ ] Проверка новых разрешений
- [ ] Валидация OAuth flow
- [ ] Проверка callback обработки

### Этап 4: Уведомление пользователей
- [ ] Требование Instagram Business/Creator аккаунта
- [ ] Инструкции по переключению типа аккаунта
- [ ] Обновление документации

---

## 🔄 Обновленные файлы для миграции

### 1. Обновить `instagram.controller.js`:
```javascript
// Изменить OAuth URL
const authUrl = new URL('https://www.instagram.com/oauth/authorize');
authUrl.searchParams.set('scope', 'instagram_business_basic');
```

### 2. Обновить `instagram.service.js`:
```javascript
// Новый токен endpoint (может измениться)
const response = await axios.post('https://api.instagram.com/oauth/access_token', {
    // Тот же формат, но возможны изменения в scope
});
```

### 3. Обновить `.env`:
```bash
# Новые настройки Instagram API
INSTAGRAM_API_VERSION=v18.0
INSTAGRAM_OAUTH_URL=https://www.instagram.com/oauth/authorize
INSTAGRAM_TOKEN_URL=https://api.instagram.com/oauth/access_token
INSTAGRAM_SCOPE=instagram_business_basic,instagram_business_content_publish
```

---

## 🎯 Требования к пользователям

### Обязательные изменения для пользователей:
1. **Переключиться на Instagram Business или Creator аккаунт**
2. **НЕ требуется Facebook Page** (в отличие от старого Graph API)
3. **Больше разрешений** - пользователи увидят расширенный список

### Инструкции для пользователей:
```
1. Откройте Instagram приложение
2. Перейдите в Настройки → Аккаунт
3. Переключитесь на "Профессиональный аккаунт"
4. Выберите "Бизнес" или "Автор"
5. Заполните информацию о категории
```

---

## 🚀 Преимущества нового API

### Расширенные возможности:
- **Comment moderation** - управление комментариями
- **Content publishing** - публикация контента
- **Media Insights** - аналитика медиа
- **Mentions** - отслеживание упоминаний
- **Messaging** - обмен сообщениями

### Для Loyalty App:
- Больше данных о пользователе (бизнес-метрики)
- Возможность отслеживания активности
- Лучшая интеграция с бизнес-функциями

---

## ⚠️ Риски и митигация

### Потенциальные проблемы:
1. **Пользователи с личными аккаунтами** не смогут авторизоваться
2. **Изменения в API responses** могут сломать интеграцию
3. **Новые разрешения** могут напугать пользователей

### Решения:
1. **Четкие инструкции** по переключению типа аккаунта
2. **Fallback механизмы** для обработки ошибок
3. **Объяснение** зачем нужны дополнительные разрешения

---

## 📅 Timeline миграции

### Немедленно (до 27 января 2025):
- Обновить scope values в коде
- Тестировать новые endpoints

### До 4 декабря 2024:
- Полностью мигрировать на новый API
- Обновить документацию
- Протестировать с реальными пользователями

---

## 🔗 Полезные ссылки

- [Instagram API with Instagram Login](https://developers.facebook.com/docs/instagram-platform/instagram-api-with-instagram-login)
- [Migration Guide](https://developers.facebook.com/docs/instagram-platform)
- [New Scope Values](https://developers.facebook.com/docs/instagram-platform/instagram-api-with-instagram-login#permissions)
- [Business Account Setup](https://help.instagram.com/502981923235522)

---

*Автор: AI Assistant*  
*Дата: 31.01.2025*  
*Критическое обновление для Farolero Loyalty App*
