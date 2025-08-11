# VK OAuth Setup для социнтеграции Farolero

## 🎯 Цель
VK используется не как основная платформа, а для социнтеграции:
- Начисление баллов за активность в соцсетях (лайки, комментарии, репосты, подписки)
- Привязка VK-аккаунта к пользователю бота для сопоставления действий

## 🛠 Настройка Backend

### 1. Переменные окружения
Создайте файл `backend/.env`:

```env
# VK OAuth Configuration
VK_CLIENT_ID=54020028
VK_CLIENT_SECRET=ВАШ_ЗАЩИЩЁННЫЙ_КЛЮЧ_ИЗ_VK
VK_REDIRECT_URI=https://api.5425685-au70735.twc1.net/api/oauth/vk/callback

# VK Group Configuration (для проверки действий в сообществе)
VK_GROUP_ID=ID_СООБЩЕСТВА_БЕЗ_- (например 227733445)
VK_GROUP_TOKEN=ГРУППОВОЙ_ТОКЕН_С_ПРАВАМИ wall,groups,offline

# JWT Configuration
JWT_SECRET=supersecretjwt

# App Configuration
APP_BASE_URL=https://api.5425685-au70735.twc1.net
```

### 2. Получение VK Group Token
1. Перейдите в [VK Developer Console](https://vk.com/dev)
2. Создайте Standalone-приложение
3. Получите токен сообщества с правами: `wall`, `groups`, `offline`
4. Добавьте токен в переменную `VK_GROUP_TOKEN`

## 🚀 API Endpoints

### VK Login (начало OAuth)
```
GET /auth/vk/login?tg_user_id=TELEGRAM_USER_ID
```
- Создает JWT state с Telegram ID
- Редиректит на VK OAuth

### OAuth Callback
```
GET /api/oauth/vk/callback?code=CODE_FROM_VK&state=JWT_STATE
```
- Получает `code` и `state` от VK
- Валидирует JWT state
- Обменивает `code` на `user_id`
- Связывает VK ID с контактом в AmoCRM
- Редиректит на miniapp с `vk_id`

### Проверка действий
```
POST /api/social/vk/verify
```
Body:
```json
{
  "action": "subscribe|like|comment|repost",
  "target": {
    "ownerId": -GROUP_ID,
    "postId": 123
  },
  "user": {
    "contactId": 456,
    "vkId": 789
  }
}
```

## 💰 Система баллов

| Действие | Баллы | Описание |
|----------|-------|----------|
| `subscribe` | +20 | Подписка на сообщество |
| `social_like` | +2 | Лайк поста |
| `social_comment` | +5 | Комментарий к посту |
| `social_repost` | +10 | Репост поста |

## 🔧 Интеграция с AmoCRM

### ✅ Связать VK ID с контактом
```javascript
// В backend/routes/oauth.js
const contactId = await amocrm.findByTelegramId(tg_user_id);
await amocrm.setCustomField(contactId, 'VK_ID_FIELD_ID', user_id);
```

### TODO: Обновление баллов
```javascript
// В backend/services/loyaltyService.js
const currentPoints = await amocrm.getPoints(contactId);
const newPoints = currentPoints + points;
await amocrm.updatePoints(contactId, newPoints);
```

## 🧪 Тестирование

### 1. Привязка VK аккаунта
1. Откройте приложение
2. Нажмите "Привязать VK через OAuth"
3. Система создаст JWT state с вашим Telegram ID
4. Редирект на VK OAuth с защищенным state
5. После авторизации VK вернет code + state
6. Backend валидирует state и связывает VK ID с контактом
7. Редирект на miniapp с подтверждением привязки

### 2. Проверка действий
1. Выполните действие в VK сообществе (лайк, комментарий, репост)
2. Нажмите соответствующую кнопку проверки в приложении
3. Убедитесь, что баллы начислены

## 📱 Frontend компоненты

### VKIDAuth.tsx
- Кнопка привязки VK через OAuth
- Интеграция с VK ID SDK
- Использует новый `/auth/vk/login` роут

### VKActions.tsx
- Проверка подписки на сообщество
- Проверка лайков/комментариев/репостов
- Отображение результатов и баллов
- Работает с новой системой авторизации

## 🔐 Новые файлы безопасности

### backend/routes/auth.js
- Создание JWT state для VK OAuth
- Защита от CSRF атак
- Редирект на VK с защищенными параметрами

## 🔒 Безопасность

- **НЕ храним** пользовательские `access_token` на backend
- Используем JWT state для защиты от CSRF атак
- Используем только групповой токен для проверки действий
- Все данные пользователей хранятся в AmoCRM
- OAuth используется только для получения `vk_user_id`
- Telegram ID передается через защищенный JWT state

## 🚨 Лимиты VK API

- **Запросы в секунду**: 3
- **Запросы в день**: 1000
- **Рекомендация**: Добавить кэширование результатов на 5-10 минут

## 📋 Следующие шаги

1. ✅ Создать VK приложение и получить токены
2. ✅ Настроить переменные окружения
3. ✅ Реализовать JWT state для безопасности
4. ✅ Интегрировать с AmoCRM для сохранения VK ID
5. ✅ Реализовать систему начисления баллов
6. 🔄 Добавить авторизацию пользователей (middleware)
7. 🔄 Настроить кэширование VK API запросов
8. 🔄 Добавить логирование действий и баллов

## 🆘 Troubleshooting

### Ошибка "oauth_vk_failed"
- Проверьте правильность `VK_APP_ID` и `VK_APP_SECRET`
- Убедитесь, что `VK_REDIRECT_URI` совпадает с настройками в VK

### Ошибка "vk_verify_failed"
- Проверьте `VK_GROUP_TOKEN` и права доступа
- Убедитесь, что `VK_GROUP_ID` указан без минуса

### Действия не находятся
- Проверьте, что пользователь действительно выполнил действие
- Убедитесь, что используете правильный `postId`
- Проверьте права токена сообщества
