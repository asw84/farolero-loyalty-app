# 🔧 Исправление OAuth URL для Instagram интеграции

## 🚨 Проблема
Ошибка "недействительная ссылка или страница была удалена" при попытке авторизации Instagram.

## ✅ Решение
Instagram изменил OAuth endpoints. Теперь используется **Facebook Graph API** вместо прямого Instagram OAuth.

## 🔄 Что изменилось

### Старый OAuth URL (НЕ РАБОТАЕТ):
```
https://www.instagram.com/oauth/authorize
```

### Новый OAuth URL (РАБОТАЕТ):
```
https://www.facebook.com/v23.0/dialog/oauth
```

### Старые scope (НЕ РАБОТАЮТ):
```
instagram_business_basic,instagram_business_content_publish,instagram_business_manage_insights
```

### Новые scope (РАБОТАЮТ):
```
instagram_basic,instagram_content_publish,instagram_manage_insights
```

## 🛠️ Что исправлено

### 1. Instagram контроллер
- ✅ OAuth URL изменен на Facebook Graph API
- ✅ Scope обновлен для нового API
- ✅ State параметр сохранен

### 2. Instagram сервис
- ✅ Token endpoint изменен на Facebook
- ✅ Profile endpoint обновлен для Facebook Graph API
- ✅ Добавлена логика получения Instagram Business Account

### 3. Переменные окружения
- ✅ INSTAGRAM_APP_ID теперь содержит Facebook App ID
- ✅ INSTAGRAM_APP_SECRET теперь содержит Facebook App Secret
- ✅ Комментарии обновлены

### 4. Скрипты настройки
- ✅ Все скрипты обновлены для Facebook App ID/Secret
- ✅ Проверки обновлены
- ✅ Диагностика исправлена

## 🧪 Тестирование исправления

### 1. Проверьте настройку:
```bash
node backend/scripts/check-instagram-setup.js
```

### 2. Протестируйте OAuth:
```bash
curl "https://api.5425685-au70735.twc1.net/auth/instagram/login?tg_user_id=test_123"
```

### 3. Ожидаемый результат:
✅ Перенаправление на **Facebook OAuth** (НЕ Instagram!)  
✅ Запрос разрешений Instagram  
✅ Успешная привязка аккаунта  

## 📋 Требования для работы

### Обязательно:
- ✅ Facebook App с Instagram API продуктом
- ✅ Instagram Business/Creator аккаунт
- ✅ Связь Instagram с Facebook Page
- ✅ Правильные Redirect URIs

### НЕ требуется:
- ❌ Instagram Basic Display API
- ❌ Прямой Instagram OAuth
- ❌ Старые scope values

## 🎯 Готово когда
- [x] OAuth URL исправлен на Facebook Graph API
- [x] Scope обновлен для нового API
- [x] Все сервисы обновлены
- [x] Скрипты настройки исправлены
- [x] Документация обновлена
- [x] Тестирование пройдено

## 🔗 Полезные ссылки
- [Facebook for Developers](https://developers.facebook.com/)
- [Instagram API Documentation](https://developers.facebook.com/docs/instagram-api/)
- [Facebook Graph API](https://developers.facebook.com/docs/graph-api/)

---

**Дата исправления:** 2025-01-31  
**Статус:** ✅ ИСПРАВЛЕНО  
**Проект:** Farolero Loyalty App
