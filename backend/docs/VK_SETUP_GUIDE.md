# 🔵 Руководство по настройке VK интеграции

## 🎯 Текущее состояние

### ✅ **Что уже настроено:**
- VK_CLIENT_ID: `54020028` ✅
- VK_REDIRECT_URI: корректный ✅
- JWT_SECRET: настроен ✅ 
- URL структура: корректная ✅
- VK API: доступен ✅

### ❌ **Критические проблемы:**
1. **VK_CLIENT_SECRET** - содержит placeholder `REAL_VK_CLIENT_SECRET_REQUIRED`

### ⚠️ **Предупреждения:**
1. **VK_SERVICE_KEY** - нужен для VK ID API
2. **VK_GROUP_TOKEN** - нужен для проверки активности в группе  
3. **VK_GROUP_ID** - содержит placeholder

---

## 🔧 Пошаговая настройка

### **Шаг 1: Получение VK_CLIENT_SECRET (КРИТИЧНО)**

1. **Перейдите в VK Developers:**
   ```
   https://dev.vk.com/
   ```

2. **Найдите ваше приложение с ID: 54020028**
   - Если приложения нет - создайте новое
   - Если есть - откройте настройки

3. **Скопируйте "Защищённый ключ":**
   - В разделе "Настройки" → "Ключи доступа"
   - Найдите "Защищённый ключ" (Client Secret)
   - Скопируйте его

4. **Обновите .env:**
   ```env
   VK_CLIENT_SECRET=ваш_защищённый_ключ_здесь
   ```

### **Шаг 2: Настройка Redirect URI в VK приложении**

1. **В настройках VK приложения:**
   - Раздел "Настройки" → "Redirect URI"
   - Добавьте: `https://api.5425685-au70735.twc1.net/api/oauth/vk/callback`

2. **Проверьте домен:**
   - Убедитесь что домен добавлен в "Доверенные домены"

### **Шаг 3: Получение VK_SERVICE_KEY (опционально)**

1. **В настройках VK приложения:**
   - Найдите "Сервисный ключ" (Service Key)
   - Скопируйте его

2. **Обновите .env:**
   ```env
   VK_SERVICE_KEY=ваш_сервисный_ключ
   ```

### **Шаг 4: Настройка VK группы (опционально)**

1. **Получите ID группы:**
   - Откройте вашу VK группу
   - ID видно в URL: `vk.com/club123456789` → ID = `123456789`

2. **Получите токен группы:**
   - Настройки группы → "Работа с API"
   - Создайте токен с правами: `wall`, `groups`, `offline`

3. **Обновите .env:**
   ```env
   VK_GROUP_ID=123456789
   VK_GROUP_TOKEN=ваш_групповой_токен
   ```

---

## 🧪 Тестирование

### **1. Быстрая проверка конфигурации:**
```bash
node test-vk-integration.js
```

### **2. Тестирование авторизации:**

**Локальный тест:**
```
http://localhost:3001/auth/vk/login?tg_user_id=test_user_123
```

**Production тест:**
```
https://api.5425685-au70735.twc1.net/auth/vk/login?tg_user_id=test_user_123
```

### **3. Прямое тестирование VK OAuth:**
```
https://oauth.vk.com/authorize?client_id=54020028&redirect_uri=https%3A%2F%2Fapi.5425685-au70735.twc1.net%2Fapi%2Foauth%2Fvk%2Fcallback&response_type=code&v=5.199&scope=offline&state=test_state_123
```

---

## 🔗 API Endpoints

### **Инициация авторизации:**
```
GET /auth/vk/login?tg_user_id={telegram_user_id}
```

### **Callback обработка:**
```
GET /api/oauth/vk/callback?code={auth_code}&state={jwt_state}
```

---

## 🛠️ Troubleshooting

### **Ошибка: "invalid_client"**
- Проверьте VK_CLIENT_SECRET
- Убедитесь что Client ID корректный

### **Ошибка: "redirect_uri_mismatch"**
- Проверьте Redirect URI в настройках VK приложения
- Убедитесь что домен добавлен в доверенные

### **Ошибка: "access_denied"**
- Пользователь отклонил авторизацию
- Проверьте scope параметры

### **Ошибка: "invalid_state"**
- Проблема с JWT токеном
- Проверьте JWT_SECRET

---

## 🎉 После настройки

1. **Перезапустите сервер:**
   ```bash
   node server.js
   ```

2. **Протестируйте интеграцию:**
   ```bash
   node test-vk-integration.js
   ```

3. **Проверьте в браузере:**
   - Откройте тестовый URL
   - Пройдите авторизацию VK
   - Проверьте что callback работает

---

## 🔒 Безопасность

- **JWT_SECRET** должен быть длинным и случайным
- **VK_CLIENT_SECRET** НЕ должен попадать в публичный код
- **VK_GROUP_TOKEN** имеет ограниченные права
- Используйте HTTPS для всех продакшн URL

---

## 📊 Мониторинг

После настройки проверяйте:
- Логи авторизации в backend
- Статистику в VK приложении
- Ошибки callback'ов
- Время ответа API

---

**Главное:** Исправьте `VK_CLIENT_SECRET` и все заработает! 🚀
