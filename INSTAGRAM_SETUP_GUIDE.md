# 📸 Руководство по настройке Instagram интеграции

## 🎯 Текущее состояние

### ✅ **Что уже готово:**
- INSTAGRAM_REDIRECT_URI: корректный ✅
- Файловая структура: все компоненты созданы ✅  
- URL структура: корректная ✅
- Instagram API: доступен ✅
- HTTPS: используется ✅
- Routes: подключены к server.js ✅

### ❌ **Критические проблемы:**
1. **INSTAGRAM_APP_ID** - содержит placeholder `YOUR_INSTAGRAM_APP_ID`
2. **INSTAGRAM_APP_SECRET** - содержит placeholder `YOUR_INSTAGRAM_APP_SECRET`

### 📊 **Сравнение с VK:**
- **VK**: 90% готова (только нужен реальный CLIENT_SECRET)
- **Instagram**: 75% готова (нужны APP_ID и APP_SECRET)

---

## 🏗️ Пошаговая настройка Instagram приложения

### **Шаг 1: Создание Facebook/Instagram приложения**

1. **Перейдите в Facebook Developers:**
   ```
   https://developers.facebook.com/
   ```

2. **Создайте новое приложение:**
   - Нажмите "Create App"
   - Выберите тип: "Consumer" или "Business"  
   - Введите название приложения: "Farolero Loyalty App"
   - Добавьте email контакт

3. **Добавьте Instagram Basic Display:**
   - В Dashboard приложения
   - Нажмите "+ Add Product"
   - Найдите "Instagram Basic Display"
   - Нажмите "Set Up"

### **Шаг 2: Настройка Instagram Basic Display**

1. **Настройте Valid OAuth Redirect URIs:**
   ```
   https://api.5425685-au70735.twc1.net/api/instagram/callback
   ```

2. **Настройте Deauthorize Callback URL:**
   ```
   https://api.5425685-au70735.twc1.net/api/instagram/deauth
   ```

3. **Настройите Data Deletion Request URL:**
   ```
   https://api.5425685-au70735.twc1.net/api/instagram/data-deletion
   ```

### **Шаг 3: Получение учетных данных**

1. **Instagram App ID:**
   - В разделе "Instagram Basic Display" → "Basic Display"
   - Скопируйте "Instagram App ID"

2. **Instagram App Secret:**
   - В том же разделе
   - Нажмите "Show" рядом с "Instagram App Secret"
   - Скопируйте секретный ключ

### **Шаг 4: Обновление .env файла**

Замените placeholders в `backend/.env`:

```env
# Instagram OAuth Configuration
INSTAGRAM_APP_ID=ваш_instagram_app_id_здесь
INSTAGRAM_APP_SECRET=ваш_instagram_app_secret_здесь
INSTAGRAM_REDIRECT_URI=https://api.5425685-au70735.twc1.net/api/instagram/callback
```

---

## 🧪 Тестирование после настройки

### **1. Проверка конфигурации:**
```bash
node test-instagram-integration.js
```

### **2. Тестирование авторизации:**

**URL для тестирования (замените APP_ID):**
```
https://api.instagram.com/oauth/authorize?client_id=ВАШ_APP_ID&redirect_uri=https%3A%2F%2Fapi.5425685-au70735.twc1.net%2Fapi%2Finstagram%2Fcallback&scope=user_profile%2Cuser_media&response_type=code&state=test_state
```

### **3. Проверка callback:**
После авторизации Instagram перенаправит на:
```
https://api.5425685-au70735.twc1.net/api/instagram/callback?code=XXX&state=YYY
```

---

## 🔧 Доработки кода

### **Проблема в instagram.controller.js:**

Текущий код использует заглушку для `telegram_user_id`:

```javascript
// ТЕКУЩИЙ КОД (ПРОБЛЕМА):
const telegram_user_id = '123456789'; // ЗАГЛУШКА
```

### **Исправление:**

<function_calls>
<invoke name="search_replace">
<parameter name="file_path">backend/controllers/instagram.controller.js
