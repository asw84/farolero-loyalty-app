# Система лояльности Farolero - Техническая документация

## 🎯 Обзор системы

Система лояльности Farolero состоит из двух основных компонентов:
1. **Начисление баллов** - за активность в соцсетях и покупки
2. **Кешбэк баллами** - использование накопленных баллов для скидок

## 🏗️ Архитектура системы

### Основные компоненты

```
Frontend (React) → API Endpoints → Controllers → Services → AmoCRM
     ↓
VK OAuth → VK API → Verification → Points Calculation
     ↓
Qtickets Webhook → Order Processing → Points Award
```

## 📁 Структура файлов

### 1. **Сервис лояльности** (`backend/services/loyaltyService.js`)

```javascript
const POINTS_CONFIG = {
  subscribe: 20,        // Подписка на сообщество
  social_like: 2,       // Лайк поста
  social_comment: 5,    // Комментарий к посту
  social_repost: 10     // Репост поста
};

async function addPoints(contactId, actionType) {
  // TODO: 1) получить текущие баллы из AmoCRM по contactId
  // const currentPoints = await amocrm.getPoints(contactId);
  
  // TODO: 2) добавить новые баллы
  // const newPoints = currentPoints + points;
  
  // TODO: 3) записать обратно в AmoCRM + пересчитать статус
  // await amocrm.updatePoints(contactId, newPoints);
  // await amocrm.updateStatus(contactId, calculateStatus(newPoints));
}
```

**Статус:** ✅ Базовая структура готова, интеграция с AmoCRM не реализована

### 2. **VK Контроллер** (`backend/controllers/vkController.js`)

```javascript
async function verifyAndReward(req, res) {
  // Получаем contactId и vkId из AmoCRM
  const { tg_user_id } = req.user;
  const contactId = await amocrm.findByTelegramId(tg_user_id);
  const vkId = await amocrm.getCustomField(contactId, 'VK_ID_FIELD_ID');
  
  // Проверяем действие и начисляем баллы
  switch (action) {
    case 'subscribe':
      ok = await vk.isMember(vkId);
      if (ok) await addPoints(contactId, 'subscribe'); // +20 баллов
      break;
    case 'like':
      ok = await vk.hasLikedPost(vkId, target.ownerId, target.postId);
      if (ok) await addPoints(contactId, 'social_like'); // +2 балла
      break;
    // ... другие действия
  }
}
```

**Статус:** ✅ Логика проверки действий готова, вызов `addPoints` не работает

### 3. **Order Controller** (`backend/controllers/order.controller.js`)

```javascript
// Обработка заказов Qtickets
// TODO: Интеграция с системой баллов для кешбэка
```

**Статус:** 🔄 Частично готов, интеграция с баллами отсутствует

## 🔄 Потоки начисления баллов

### **Поток 1: VK Активность**

```
1. Frontend → POST /api/social/vk/verify
   Body: { action: 'like', target: { ownerId: -GROUP_ID, postId: 123 } }

2. VK Controller → verifyAndReward()
   - Проверяет действие через VK API
   - Получает contactId из AmoCRM

3. Loyalty Service → addPoints(contactId, actionType)
   - Рассчитывает баллы по POINTS_CONFIG
   - Обновляет баланс в AmoCRM

4. Response → { ok: true, message: "Действие подтверждено и баллы начислены" }
```

### **Поток 2: Покупки через Qtickets**

```
1. Qtickets Webhook → POST /api/webhook/qtickets
   - Уведомление о покупке билета

2. Order Controller → processOrder()
   - Обрабатывает данные заказа
   - Вызывает начисление баллов

3. Loyalty Service → addPoints(contactId, 'purchase')
   - Начисляет баллы за покупку (например, 1 балл за 100₽)

4. AmoCRM Update → Обновляет баланс и статус клиента
```

## 💰 Система кешбэка

### **Текущее состояние:** ❌ НЕ РЕАЛИЗОВАНО

**Из MVP Pitch:**
> "Кэшбэк баллами: Ключевая особенность программы лояльности — возможность использовать накопленные баллы в качестве скидки при будущих покупках билетов через Qtickets."

### **Что отсутствует:**

1. **Логика списания баллов**
2. **Интеграция с Qtickets для применения скидок**
3. **API для проверки баланса баллов**
4. **Расчет скидок на основе накопленных баллов**

## 🚧 Что нужно доработать

### 1. **Создать AmoCRM сервис** (`backend/services/amocrm.js`)

```javascript
// Необходимые методы:
async function getPoints(contactId) {
  // Получить баллы из кастомного поля AmoCRM
}

async function updatePoints(contactId, newPoints) {
  // Обновить баллы в AmoCRM
}

async function findByTelegramId(tgUserId) {
  // Найти контакт по Telegram ID
}

async function setCustomField(contactId, fieldId, value) {
  // Установить кастомное поле (например, VK ID)
}
```

### 2. **Расширить Loyalty Service**

```javascript
// Добавить методы для кешбэка:
async function spendPoints(contactId, points) {
  // Списать баллы при покупке
}

async function getBalance(contactId) {
  // Получить текущий баланс
}

async function applyDiscount(contactId, ticketPrice) {
  // Применить скидку баллами к билету
}

async function calculateDiscount(balance, maxDiscountPercent) {
  // Рассчитать максимальную скидку
}
```

### 3. **Интегрировать с Qtickets**

```javascript
// В order.controller.js добавить:
async function processPurchaseWithPoints(orderData, contactId) {
  const balance = await loyaltyService.getBalance(contactId);
  const maxDiscount = orderData.price * 0.2; // Максимум 20% скидки
  const discount = Math.min(balance, maxDiscount);
  
  if (discount > 0) {
    await loyaltyService.spendPoints(contactId, discount);
    // Применить скидку к заказу в Qtickets
    const finalPrice = orderData.price - discount;
    return { discount, finalPrice };
  }
  
  return { discount: 0, finalPrice: orderData.price };
}
```

### 4. **Создать новые API endpoints**

```javascript
// GET /api/loyalty/balance - Проверить баланс баллов
// POST /api/loyalty/apply-discount - Применить скидку
// GET /api/loyalty/history - История начислений и списаний
```

## 📊 Текущий статус файлов

| Файл | Роль | Статус | Что нужно |
|------|------|---------|-----------|
| `loyaltyService.js` | Основная логика баллов | ✅ Структура готова | AmoCRM интеграция |
| `vkController.js` | Начисление за VK активность | ✅ Логика готова | Рабочий addPoints |
| `order.controller.js` | Обработка заказов Qtickets | 🔄 Частично готов | Интеграция с баллами |
| `amocrm.js` | Интеграция с CRM | ❌ Не создан | Создать с нуля |

## 🎯 Приоритеты разработки

### **Высокий приоритет:**
1. **Создать AmoCRM сервис** - критично для работы системы
2. **Реализовать методы** `getPoints`, `updatePoints`
3. **Протестировать начисление баллов** за VK активность

### **Средний приоритет:**
1. **Добавить логику кешбэка** в `loyaltyService.js`
2. **Интегрировать с Qtickets** для применения скидок
3. **Создать API endpoints** для управления баллами

### **Низкий приоритет:**
1. **Добавить кэширование** VK API запросов
2. **Логирование** действий и баллов
3. **Аналитика** по использованию системы лояльности

## 🔍 Технические детали

### **Структура баллов в AmoCRM:**
- **Кастомное поле:** `LOYALTY_POINTS` - текущий баланс баллов
- **Кастомное поле:** `LOYALTY_STATUS` - статус (Bronze/Silver/Gold/VIP)
- **Кастомное поле:** `VK_ID_FIELD_ID` - привязанный VK ID

### **Лимиты и ограничения:**
- **Максимальная скидка:** 20% от стоимости билета
- **Минимальная сумма для скидки:** 100 баллов
- **Срок действия баллов:** 12 месяцев с момента начисления

### **Безопасность:**
- **JWT токены** для авторизации пользователей
- **Валидация** всех операций с баллами
- **Логирование** всех изменений баланса

## 📋 Чек-лист готовности

- [ ] AmoCRM сервис создан и протестирован
- [ ] Начисление баллов за VK активность работает
- [ ] Начисление баллов за покупки работает
- [ ] Кешбэк баллами реализован
- [ ] API endpoints для управления баллами созданы
- [ ] Интеграция с Qtickets протестирована
- [ ] Система готова к production

## 🆘 Troubleshooting

### **Проблема: Баллы не начисляются**
- Проверить интеграцию с AmoCRM
- Убедиться, что `addPoints` вызывается
- Проверить права доступа к AmoCRM

### **Проблема: Кешбэк не применяется**
- Проверить баланс баллов
- Убедиться в интеграции с Qtickets
- Проверить логику расчета скидок

### **Проблема: VK действия не проверяются**
- Проверить VK Group Token
- Убедиться в правильности ID группы
- Проверить права токена сообщества
