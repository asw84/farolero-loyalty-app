# 🏗️ Модульная архитектура Farolero Loyalty App

## 📋 Принципы модульности

### ✅ Каждый модуль отвечает за ОДНУ функцию
### ✅ Зависимости только через dependency injection  
### ✅ Четкие интерфейсы между модулями
### ✅ Изолированное тестирование

---

## 🧩 Структура модулей

```
backend/modules/
├── core/                    # Основные модули
│   ├── User/               # Управление пользователями
│   ├── Points/             # Система баллов
│   ├── Loyalty/            # Программа лояльности
│   └── Analytics/          # RFM-анализ
├── integrations/           # Внешние интеграции  
│   ├── AmoCRM/            # AmoCRM API
│   ├── VK/                # VK API и OAuth
│   ├── Instagram/         # Instagram API
│   └── Telegram/          # Telegram Bot
├── business/              # Бизнес-логика
│   ├── ReferralSystem/    # Реферальная система
│   ├── StatusCalculator/  # Расчет статусов
│   └── OrderProcessor/    # Обработка заказов
└── utils/                 # Утилиты
    ├── TokenManager/      # Управление токенами
    ├── ConfigValidator/   # Валидация конфигурации
    └── Logger/            # Структурированное логирование
```

---

## 🎯 Модули по ответственности

### CORE модули

#### User Module
```javascript
// Единственная ответственность: CRUD пользователей
class UserModule {
    async findByTelegramId(telegramId) { }
    async create(userData) { }
    async update(userId, data) { }
    async delete(userId) { }
}
```

#### Points Module  
```javascript
// Единственная ответственность: операции с баллами
class PointsModule {
    async addPoints(userId, amount, reason) { }
    async deductPoints(userId, amount, reason) { }
    async getBalance(userId) { }
    async getHistory(userId) { }
}
```

#### Loyalty Module
```javascript
// Единственная ответственность: логика программы лояльности
class LoyaltyModule {
    calculateStatus(points) { }
    calculateCashback(status, amount) { }
    getStatusBenefits(status) { }
}
```

### INTEGRATION модули

#### AmoCRM Module
```javascript  
// Единственная ответственность: AmoCRM API
class AmoCRMModule {
    async findContact(criteria) { }
    async createContact(data) { }
    async updateContact(id, data) { }
    async syncPoints(contactId, points) { }
}
```

#### VK Module
```javascript
// Единственная ответственность: VK API операции
class VKModule {
    async getUserInfo(accessToken) { }
    async checkSubscription(userId, groupId) { }
    async checkLikes(userId, postId) { }
    async trackActivity(userId) { }
}
```

### BUSINESS модули

#### ReferralSystem Module
```javascript
// Единственная ответственность: реферальная логика
class ReferralSystemModule {
    async generateCode(userId) { }
    async activateCode(code, newUserId) { }
    async calculateBonus(referrerId, refereeId) { }
}
```

---

## 🔄 Dependency Injection

### Container
```javascript
// backend/modules/container.js
class Container {
    constructor() {
        this.services = {};
    }
    
    register(name, factory) {
        this.services[name] = factory;
    }
    
    resolve(name) {
        const serviceFactory = this.services[name];
        return serviceFactory(this);
    }
}
```

### Регистрация зависимостей
```javascript
container.register('userModule', (container) => {
    return new UserModule(
        container.resolve('database'),
        container.resolve('logger')
    );
});

container.register('pointsModule', (container) => {
    return new PointsModule(
        container.resolve('database'),
        container.resolve('userModule'),
        container.resolve('logger')
    );
});
```

---

## 📊 Миграция существующих сервисов

### Этап 1: Выделение core модулей
- [ ] User Module из user.service.js
- [ ] Points Module из loyaltyService.js + admin.service.js
- [ ] Loyalty Module (новый)

### Этап 2: Рефакторинг интеграций
- [ ] AmoCRM Module из amocrm.service.js
- [ ] VK Module из vk.service.js + vk.oauth.service.js
- [ ] Instagram Module из instagram.service.js

### Этап 3: Выделение бизнес-логики
- [ ] ReferralSystem Module из referral.service.js
- [ ] StatusCalculator Module (новый)
- [ ] OrderProcessor Module из order.service.js

### Этап 4: Обновление контроллеров
- [ ] Использование DI container
- [ ] Упрощение логики в контроллерах
- [ ] Унификация API responses

---

## 🧪 Тестирование модулей

### Unit тесты для каждого модуля
```javascript
// tests/modules/User.test.js
describe('User Module', () => {
    let userModule;
    let mockDatabase;
    
    beforeEach(() => {
        mockDatabase = createMockDatabase();
        userModule = new UserModule(mockDatabase);
    });
    
    test('should create user with valid data', async () => {
        const userData = { telegramId: '123', firstName: 'Test' };
        const user = await userModule.create(userData);
        expect(user.id).toBeDefined();
    });
});
```

### Integration тесты между модулями
```javascript
// tests/integration/UserPoints.test.js
describe('User + Points Integration', () => {
    test('should add points to existing user', async () => {
        const user = await userModule.create(userData);
        const result = await pointsModule.addPoints(user.id, 100, 'welcome');
        expect(result.success).toBe(true);
    });
});
```

---

## 📈 Ожидаемые результаты

### После модуляризации:
- ✅ **Чистая архитектура** - каждый модуль имеет единственную ответственность
- ✅ **Легкое тестирование** - изолированные unit тесты
- ✅ **Масштабируемость** - простое добавление новых модулей
- ✅ **Переиспользование** - модули используются в разных контроллерах
- ✅ **Dependency Injection** - четкие зависимости между модулями

### Метрики улучшения:
- **Cyclomatic Complexity**: ↓ 50%
- **Test Coverage**: ↑ 90%
- **Code Duplication**: ↓ 80%  
- **Module Coupling**: ↓ 60%

---

*Документ создан для рефакторинга архитектуры проекта Farolero Loyalty App*
