# 📸 Руководство по настройке Instagram интеграции

## 🚨 ВАЖНОЕ ОБНОВЛЕНИЕ
**Instagram Basic Display API прекратил поддержку 4 декабря 2024 года!**

Переходим на новый **Instagram API через Facebook Graph API**.

## 🎯 Цель
Настроить Instagram API через Facebook Graph API для привязки Instagram Business/Creator аккаунтов пользователей к профилю в Farolero Loyalty App.

## 📋 Требования
- Facebook аккаунт разработчика
- **Instagram Business или Creator аккаунт** (обязательно!)
- Домен с HTTPS (обязательно для production)
- Настроенный backend сервер

## ⚡ Ключевые изменения в новом API:
- Требует Instagram Business/Creator аккаунт (не личный)
- **Новые scope values:** `instagram_basic`, `instagram_content_publish`, `instagram_manage_insights`
- **OAuth URL:** `https://www.facebook.com/v23.0/dialog/oauth` (НЕ Instagram!)
- Более мощные возможности для бизнеса
- **Требует связывания с Facebook Page** (обязательно!)

---

## 🚀 Пошаговая настройка

### Шаг 1: Создание приложения в Facebook for Developers

1. **Перейдите в Facebook for Developers**
   ```
   https://developers.facebook.com/
   ```

2. **Создайте новое приложение**
   - Нажмите "Создать приложение" (Create App)
   - Выберите тип: **"Другое"** (Other) - ВАЖНО!
   - Нажмите "Далее"
   - Выберите подтип: **"Потребительский"** (Consumer)
   - Введите название: "Farolero Loyalty App"
   - Введите email для связи

3. **Добавьте Instagram API**
   
   **Метод 1 (рекомендуемый):**
   - В левом меню найдите раздел "Продукты" (Products)
   - Нажмите "Добавить продукт" (Add Product)
   - Найдите **"Instagram API"** (НЕ Basic Display!)
   - Нажмите "Настроить" (Set up)

   **Метод 2 (поиск):**
   - В поиске продуктов введите "Instagram API"
   - Выберите "Instagram API" (основной API, не Basic Display)

   **⚠️ ВАЖНО:** НЕ выбирайте "Instagram Basic Display" - он устарел!

### Шаг 2: Настройка Instagram API

1. **Настройте Instagram API**
   - В разделе "Instagram API" → "Basic Display"
   - Заполните поля:
     - **Valid OAuth Redirect URIs:**
       ```
       https://api.5425685-au70735.twc1.net/api/instagram/callback
       ```
     - **Deauthorize Callback URL:**
       ```
       https://api.5425685-au70735.twc1.net/api/instagram/deauth
       ```
     - **Data Deletion Request URL:**
       ```
       https://api.5425685-au70735.twc1.net/api/instagram/delete
       ```

2. **Получите ключи приложения**
   - **Facebook App ID** - отображается на странице приложения
   - **Facebook App Secret** - нажмите "Показать" рядом с App Secret

### Шаг 3: Связывание с Facebook Page

1. **Создайте Facebook Page** (если нет)
   - Перейдите на https://www.facebook.com/pages/create
   - Создайте страницу для вашего бизнеса

2. **Свяжите Instagram с Facebook Page**
   - В Instagram: Настройки → Аккаунт → Связанные аккаунты → Facebook
   - Свяжите Instagram Business/Creator аккаунт с Facebook Page

### Шаг 4: Настройка тестовых пользователей

1. **Добавьте тестовых пользователей**
   - В разделе "Roles" → "Instagram Testers"
   - Добавьте Instagram аккаунты для тестирования
   - Пользователи должны принять приглашение

2. **Подтвердите тестовые аккаунты**
   - Каждый тестовый пользователь должен войти в Instagram
   - Перейти в Настройки → Безопасность → Приложения и сайты
   - Найти ваше приложение и подтвердить доступ

---

## ⚙️ Настройка переменных окружения

### Обновите файл `.env`:

```bash
# Instagram API Configuration (Facebook Graph API)
INSTAGRAM_APP_ID=1234567890123456        # Facebook App ID
INSTAGRAM_APP_SECRET=abcdef1234567890    # Facebook App Secret
INSTAGRAM_REDIRECT_URI=https://api.5425685-au70735.twc1.net/api/instagram/callback
```

### 🔑 Ключевые изменения:
- **INSTAGRAM_APP_ID** теперь содержит Facebook App ID
- **INSTAGRAM_APP_SECRET** теперь содержит Facebook App Secret
- **OAuth URL** изменен на `https://www.facebook.com/v23.0/dialog/oauth`
- **Scope** обновлен: `instagram_basic,instagram_content_publish,instagram_manage_insights`

---

## 🧪 Тестирование

### 1. Проверьте настройку:
```bash
node backend/scripts/check-instagram-setup.js
```

### 2. Протестируйте OAuth flow:
```bash
# Генерируйте тестовый URL
curl "https://api.5425685-au70735.twc1.net/auth/instagram/login?tg_user_id=test_123"
```

### 3. Ожидаемый результат:
✅ Перенаправление на Facebook OAuth (НЕ Instagram!)  
✅ Запрос разрешений Instagram  
✅ Успешная привязка аккаунта  

---

## 🚨 Решение проблем

### Ошибка "недействительная ссылка":
- ✅ **Исправлено:** OAuth URL изменен на Facebook Graph API
- ✅ **Исправлено:** Scope обновлен для нового API
- ✅ **Исправлено:** Token endpoint изменен на Facebook

### Требования для Instagram API:
- ✅ Instagram Business/Creator аккаунт
- ✅ Связь с Facebook Page
- ✅ Facebook App с Instagram API продуктом
- ✅ Правильные Redirect URIs

---

## 📚 Дополнительные ресурсы

- [Facebook for Developers](https://developers.facebook.com/)
- [Instagram API Documentation](https://developers.facebook.com/docs/instagram-api/)
- [Facebook Graph API](https://developers.facebook.com/docs/graph-api/)

---

## 🎯 Готово когда
- [x] Facebook App создан с Instagram API
- [x] Instagram Business/Creator аккаунт связан с Facebook Page
- [x] Redirect URIs настроены
- [x] .env обновлен с Facebook App ID/Secret
- [x] OAuth flow работает через Facebook (НЕ Instagram!)
- [x] Аккаунт успешно привязывается к профилю
