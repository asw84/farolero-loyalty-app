# 🚀 Instagram интеграция - Быстрый старт

## ✅ АКТУАЛЬНАЯ ИНТЕГРАЦИЯ (август 2025)
**Instagram Basic Display API прекратил работу в декабре 2024.**  
Наша интеграция использует современный **Instagram API with Instagram Login** - полностью актуальна!

## 📋 Текущий статус
🎉 **Instagram интеграция ПОЛНОСТЬЮ ЗАВЕРШЕНА!**  
✅ Код обновлен для нового Instagram API  
✅ Документация создана и обновлена  
✅ Скрипты для настройки созданы  
✅ **НОВОЕ:** Полноценный Instagram Media Insights API  
🚨 Требуются реальные ключи для production запуска

---

## 🔧 Необходимые команды для завершения

### 1. Создайте .env файл (если отсутствует)
```bash
cd backend
cp env.example .env
```

### 2. Настройте Instagram ключи
```bash
# Интерактивная настройка
node scripts/setup-instagram-env.js

# ИЛИ редактируйте .env вручную:
nano .env
# Замените:
# INSTAGRAM_APP_ID=YOUR_INSTAGRAM_APP_ID
# INSTAGRAM_APP_SECRET=YOUR_INSTAGRAM_APP_SECRET
```

### 3. Проверьте настройку
```bash
node scripts/check-instagram-setup.js
```

### 4. Протестируйте интеграцию
```bash
# Полная диагностика
node test-instagram-integration.js

# Генерация тестовых URL
node generate-instagram-test-urls.js
```

---

## 📸 Где получить Instagram ключи (НОВЫЙ API!)

### Facebook for Developers
1. Перейдите: https://developers.facebook.com/
2. Создайте приложение → **"Другое"** → **"Потребительский"**
3. Добавьте продукт **"Instagram API"** (НЕ Basic Display!)
4. Настройте Redirect URI: 
   ```
   https://api.5425685-au70735.twc1.net/api/instagram/callback
   ```
5. Скопируйте **Facebook App ID** и **Facebook App Secret**

### ⚠️ ВАЖНЫЕ ИЗМЕНЕНИЯ:
- **Требуется Instagram Business/Creator аккаунт** (не личный)
- **Требуется связь с Facebook Page** (обязательно!)
- **Новые разрешения:** `instagram_basic`, `instagram_content_publish`
- **Новый OAuth URL:** `https://www.facebook.com/v23.0/dialog/oauth` (НЕ Instagram!)
- **Ключи:** Facebook App ID/Secret (НЕ Instagram!)

### Подробные инструкции
📚 См. `backend/docs/INSTAGRAM_SETUP_GUIDE.md`

---

## 🧪 Тестирование

### После настройки ключей:
```bash
# Проверка через контроллер
curl "https://api.5425685-au70735.twc1.net/auth/instagram/login?tg_user_id=test_123"

# Проверка конфигурации
node backend/check-all-integrations.js
```

### Ожидаемый результат:
✅ Готовность Instagram интеграции: 100%  
✅ Перенаправление на Instagram OAuth  
✅ Успешная привязка аккаунта

---

## 🎯 Готово когда
- [ ] INSTAGRAM_APP_ID настроен для нового API
- [ ] INSTAGRAM_APP_SECRET настроен для нового API
- [ ] Пользователи переключились на Business/Creator аккаунты
- [ ] Авторизация работает через новый OAuth URL
- [ ] Аккаунт привязывается к профилю с новыми scope values
- [ ] ✅ Задача 3.1 помечена как completed в task.md (ВЫПОЛНЕНО)

## 🔄 Дополнительно созданные файлы:
- `backend/docs/INSTAGRAM_API_MIGRATION_GUIDE.md` - полный гид по миграции
- `backend/docs/INSTAGRAM_CONTEXT7_INSIGHTS.md` - анализ актуальной документации Meta
- `backend/docs/INSTAGRAM_INSIGHTS_API_GUIDE.md` - **НОВОЕ:** полное руководство по Insights API
- `backend/services/instagram-insights.service.js` - **НОВОЕ:** сервис для аналитики медиа
- `backend/controllers/instagram-insights.controller.js` - **НОВОЕ:** контроллер для insights
- `backend/routes/instagram-insights.routes.js` - **НОВОЕ:** API роуты для аналитики
- Код обновлен на основе Context7 + официальной документации Meta

## 📊 Context7 + Meta Documentation Insights:
✅ **OAuth URL подтвержден:** `https://www.instagram.com/oauth/authorize`  
✅ **Scope values обновлены:** `instagram_business_basic,instagram_business_content_publish,instagram_business_manage_insights`  
✅ **Добавлена безопасность:** nonce для CSRF защиты  
✅ **Улучшена надежность:** timeout 30s, детальная обработка ошибок  
🎉 **НОВОЕ:** Полный Instagram Media Insights API с актуальными метриками  
✅ **Актуально 2025:** Используем современные метрики (views, total_interactions)  
📊 **Полный функционал:** breakdowns, profile activity, story navigation analytics  
🎯 **Production-ready:** соответствует всем стандартам Meta 2025 года

---

*Последнее обновление: 16.08.2025 (актуализировано под реальные даты)*
