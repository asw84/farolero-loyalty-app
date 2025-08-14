# 🚀 План развития проекта Farolero Loyalty App

## 📋 Обзор текущего состояния

**Готовность проекта: ~85%**

### ✅ Реализовано:
- Telegram Mini App (React + TypeScript)
- Backend API (Node.js + Express)
- AmoCRM интеграция (базовая)
- Система лояльности с баллами
- Qtickets интеграция
- Admin панель (базовая)
- Docker конфигурация
- **🆕 Реферальная система с QR-кодами**
- **🆕 RFM-анализ пользователей**
- **🆕 Аналитический дашборд**
- **🆕 Автоопределение полей AmoCRM**
- **🆕 Система управления токенами**

### ⚠️ Требует настройки (но код готов):
- VK/Instagram авторизация (нужны реальные API ключи)
- AmoCRM кастомные поля (использовать утилиту автоопределения)

### ❌ Осталось реализовать:
- Отслеживание активности в соцсетях
- Система статусов и кэшбэка

---

## 🎯 ЭТАП 1: Исправление критических проблем (1-2 дня)

### 1.1 Настройка реальных API ключей 🔑
**Приоритет: КРИТИЧЕСКИЙ**

#### VK API:
- [ ] Получить реальный `VK_CLIENT_SECRET` из [VK Developers](https://dev.vk.com/)
- [ ] Получить `VK_SERVICE_KEY` для серверной валидации
- [ ] Обновить `.env` файл
- [ ] Протестировать VK OAuth flow

#### Instagram API:
- [ ] Создать приложение в [Meta for Developers](https://developers.facebook.com/)
- [ ] Получить `INSTAGRAM_APP_ID` и `INSTAGRAM_APP_SECRET`
- [ ] Настроить Redirect URI
- [ ] Обновить `.env` файл

### 1.2 Автоматическое определение AmoCRM полей 🎯
```bash
# Запустить утилиту автоопределения
cd backend && node utils/autodetect-fields.js
```

### 1.3 Проверка инфраструктуры ⚡
```bash
# Применить исправления Docker
docker-compose down && docker-compose up --build

# Проверить логи
docker-compose logs -f backend
```

---

## 🎯 ЭТАП 2: Реферальная система (3-5 дней)

### 2.1 Backend компоненты

#### База данных:
```sql
-- Таблица рефералов
CREATE TABLE referrals (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    referrer_telegram_id TEXT NOT NULL,
    referee_telegram_id TEXT NOT NULL,
    referral_code TEXT UNIQUE NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    activated_at DATETIME,
    bonus_paid BOOLEAN DEFAULT FALSE,
    bonus_amount INTEGER DEFAULT 0
);

-- Индексы для быстрого поиска
CREATE INDEX idx_referral_code ON referrals(referral_code);
CREATE INDEX idx_referrer ON referrals(referrer_telegram_id);
```

#### API Endpoints:
- [ ] `POST /api/referral/generate` - генерация реферального кода
- [ ] `GET /api/referral/my-code` - получение своего кода
- [ ] `POST /api/referral/activate` - активация по коду
- [ ] `GET /api/referral/stats` - статистика рефералов
- [ ] `GET /api/referral/qr/:code` - генерация QR-кода

#### Файлы для создания:
```
backend/
├── services/referral.service.js      # Логика реферальной системы
├── controllers/referral.controller.js # API endpoints
├── routes/referral.routes.js          # Маршруты
└── utils/qr-generator.js              # Генерация QR-кодов
```

### 2.2 Frontend компоненты

#### Страницы:
- [ ] `ReferralPage.tsx` - основная страница рефералов
- [ ] `MyReferralsPage.tsx` - список приглашенных
- [ ] `ReferralStatsPage.tsx` - статистика и награды

#### Компоненты:
- [ ] `QRCodeGenerator.tsx` - генерация QR-кода
- [ ] `ReferralCodeInput.tsx` - ввод реферального кода
- [ ] `ReferralStats.tsx` - отображение статистики

### 2.3 Логика начисления баллов

#### При регистрации по рефералу:
1. Новый пользователь вводит код
2. Система проверяет валидность кода
3. Создается связь referrer ↔ referee
4. Начисляются баллы рефереру (50 баллов по умолчанию)
5. Бонус для нового пользователя (20 баллов)

#### Интеграция с AmoCRM:
- [ ] Обновление кастомных полей при активации рефералов
- [ ] Создание событий в AmoCRM
- [ ] Синхронизация начисленных баллов

---

## 🎯 ЭТАП 3: RFM-анализ пользователей (2-3 дня)

### 3.1 Теория RFM
**RFM = Recency + Frequency + Monetary**
- **R (Recency)** - когда последний раз покупал
- **F (Frequency)** - как часто покупает  
- **M (Monetary)** - сколько тратит денег

### 3.2 Database schema
```sql
-- Таблица покупок для RFM
CREATE TABLE purchases (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_telegram_id TEXT NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    purchase_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    source TEXT, -- 'qtickets', 'direct', etc.
    FOREIGN KEY (user_telegram_id) REFERENCES users(telegram_id)
);

-- Таблица RFM сегментов
CREATE TABLE rfm_segments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_telegram_id TEXT UNIQUE NOT NULL,
    recency_score INTEGER, -- 1-5
    frequency_score INTEGER, -- 1-5  
    monetary_score INTEGER, -- 1-5
    segment_name TEXT, -- 'Champions', 'Loyal Customers', etc.
    calculated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_telegram_id) REFERENCES users(telegram_id)
);
```

### 3.3 RFM сегменты пользователей

#### Премиум сегменты:
- **Champions** (R:5, F:5, M:5) - лучшие клиенты
- **Loyal Customers** (R:5, F:4, M:4) - лояльные покупатели
- **Potential Loyalists** (R:5, F:3, M:3) - потенциально лояльные

#### Средние сегменты:
- **New Customers** (R:5, F:1, M:1) - новые клиенты
- **Promising** (R:4, F:1, M:1) - перспективные
- **Need Attention** (R:3, F:3, M:3) - требуют внимания

#### Проблемные сегменты:
- **About to Sleep** (R:2, F:2, M:2) - засыпающие
- **At Risk** (R:2, F:4, M:4) - под угрозой оттока
- **Cannot Lose Them** (R:1, F:5, M:5) - нельзя потерять
- **Hibernating** (R:1, F:1, M:1) - спящие

### 3.4 Implementation

#### Файлы для создания:
```
backend/
├── services/rfm.service.js           # RFM расчеты
├── controllers/analytics.controller.js # Аналитика API
├── routes/analytics.routes.js        # Маршруты аналитики
└── utils/rfm-calculator.js           # Калькулятор RFM
```

#### API Endpoints:
- [ ] `GET /api/analytics/rfm/calculate` - пересчет RFM для всех пользователей
- [ ] `GET /api/analytics/rfm/segments` - получение сегментов
- [ ] `GET /api/analytics/rfm/user/:id` - RFM конкретного пользователя
- [ ] `GET /api/analytics/dashboard` - общая аналитика

#### Frontend:
- [ ] `AnalyticsPage.tsx` - страница аналитики
- [ ] `RFMChart.tsx` - визуализация RFM
- [ ] `SegmentsList.tsx` - список сегментов пользователей

---

## 🎯 ЭТАП 4: Отслеживание активности в соцсетях (2-3 дня)

### 4.1 VK активность

#### Отслеживание:
- [ ] Лайки постов сообщества
- [ ] Комментарии к постам
- [ ] Репосты контента
- [ ] Подписка на сообщество

#### Реализация:
```javascript
// backend/services/vk-activity.service.js
class VKActivityService {
    async checkUserActivity(vkUserId, postId) {
        // Проверка лайков через VK API
        // Проверка комментариев
        // Проверка репостов
    }
    
    async awardPointsForActivity(telegramId, activityType, points) {
        // Начисление баллов за активность
    }
}
```

### 4.2 Instagram активность

#### Отслеживание:
- [ ] Лайки постов
- [ ] Комментарии
- [ ] Подписка на аккаунт
- [ ] Stories interactions

#### Limitations:
Instagram API ограничивает доступ к данным о лайках/комментариях других пользователей. Возможные решения:
- Запрос разрешений у пользователя
- Использование Instagram Basic Display API
- Ручное подтверждение активности

### 4.3 Система начисления баллов

#### Тарифы:
```javascript
const SOCIAL_POINTS = {
    VK: {
        LIKE: 1,
        COMMENT: 3,
        REPOST: 5,
        SUBSCRIBE: 10
    },
    INSTAGRAM: {
        LIKE: 1,
        COMMENT: 3,
        FOLLOW: 10,
        STORY_VIEW: 2
    }
};
```

---

## 🎯 ЭТАП 5: Система статусов и кэшбэка (1-2 дня)

### 5.1 Уровни лояльности

#### Статусы по баллам:
```javascript
const LOYALTY_LEVELS = [
    { name: 'Новичок',   minPoints: 0,     cashbackPercent: 1,  color: '#gray' },
    { name: 'Друг',      minPoints: 100,   cashbackPercent: 3,  color: '#blue' },
    { name: 'VIP',       minPoints: 500,   cashbackPercent: 5,  color: '#gold' },
    { name: 'Платина',   minPoints: 1000,  cashbackPercent: 7,  color: '#platinum' },
    { name: 'Алмаз',     minPoints: 2500,  cashbackPercent: 10, color: '#diamond' }
];
```

### 5.2 Кэшбэк через Qtickets

#### Логика:
1. Пользователь копит баллы
2. При покупке билетов может потратить баллы
3. 1 балл = 1 рубль скидки
4. Максимальная скидка - 50% от стоимости билета

#### Integration:
- [ ] Обновить `qticketsService.js` для поддержки кэшбэка
- [ ] Добавить API endpoint `POST /api/tickets/purchase-with-cashback`
- [ ] Создать UI для выбора размера кэшбэка

---

## 📊 ПЛАН РЕАЛИЗАЦИИ ПО ВРЕМЕНИ

### Неделя 1 (5 рабочих дней):
- **День 1-2**: ЭТАП 1 - Исправление критических проблем
- **День 3-5**: ЭТАП 2 - Реферальная система (backend)

### Неделя 2 (5 рабочих дней):
- **День 1-2**: ЭТАП 2 - Реферальная система (frontend)
- **День 3-5**: ЭТАП 3 - RFM-анализ

### Неделя 3 (5 рабочих дней):
- **День 1-3**: ЭТАП 4 - Отслеживание соцсетей
- **День 4-5**: ЭТАП 5 - Система статусов

### Итого: ~15 рабочих дней (3 недели)

---

## 🧪 ТЕСТИРОВАНИЕ

### Автоматические тесты:
```bash
# Unit тесты для RFM
npm test -- rfm.service.test.js

# Integration тесты для реферальной системы  
npm test -- referral.integration.test.js

# E2E тесты для полного flow
npm run test:e2e
```

### Ручное тестирование:
- [ ] Тестирование VK/Instagram OAuth
- [ ] Проверка генерации QR-кодов
- [ ] Валидация RFM расчетов
- [ ] Тестирование кэшбэк системы

---

## 🚀 РАЗВЕРТЫВАНИЕ

### Production checklist:
- [ ] Все API ключи настроены
- [ ] Database миграции выполнены  
- [ ] Docker volumes настроены
- [ ] Мониторинг и логирование работает
- [ ] Backup стратегия настроена

### Мониторинг:
- [ ] Логирование всех операций с баллами
- [ ] Мониторинг API calls к внешним сервисам
- [ ] Отслеживание конверсии реферальной программы
- [ ] Метрики RFM сегментации

---

**Готовность к продакшену: 100% через 3 недели** 🎉
