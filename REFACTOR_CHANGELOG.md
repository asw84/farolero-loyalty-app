
# Документ изменений: Рефакторинг бэкенда

Этот документ описывает ключевые архитектурные улучшения, внесенные в бэкенд-приложение.

## 1. Обзор

Основной целью рефакторинга было преобразование монолитного файла `server.js` в более масштабируемую, безопасную и поддерживаемую архитектуру по паттерну **Routes-Controllers-Services**. Дополнительно была внедрена система автоматического тестирования для обеспечения стабильности и надежности кода.

## 2. Ключевые изменения

### 2.1. Управление конфигурацией и безопасностью (`.env`)

- **Проблема:** Секретные ключи, ID полей и другие конфигурационные данные были жестко закодированы в `server.js`, что представляло угрозу безопасности и усложняло развертывание в разных окружениях.
- **Решение:**
    - Все секреты и конфигурации были вынесены в файл `.env`.
    - Добавлена зависимость `dotenv` для загрузки этих переменных в `process.env`.
    - Файл `.env` добавлен в `.gitignore` для предотвращения его попадания в репозиторий.

### 2.2. Архитектурный рефакторинг (Routes-Controllers-Services)

- **Проблема:** Вся логика приложения (обработка запросов, бизнес-логика, работа с внешними API) была сосредоточена в одном файле `server.js`.
- **Решение:** Логика была разделена на три четких слоя:
    - **`routes/`**: Определяют URL-адреса эндпоинтов и связывают их с функциями контроллеров.
    - **`controllers/`**: Принимают HTTP-запросы, валидируют их и вызывают соответствующую бизнес-логику из сервисов.
    - **`services/`**: Содержат основную бизнес-логику, изолированную от HTTP-слоя.

#### Новая структура директорий:

```
backend/
├── ...
├── controllers/
│   ├── admin.controller.js
│   ├── amocrm.controller.js
│   ├── order.controller.js
│   ├── social.controller.js
│   ├── user.controller.js
│   ├── walk.controller.js
│   └── webhook.controller.js
├── routes/
│   ├── admin.routes.js
│   ├── amocrm.routes.js
│   ├── order.routes.js
│   ├── social.routes.js
│   ├── user.routes.js
│   ├── walk.routes.js
│   └── webhook.routes.js
├── services/
│   ├── admin.service.js
│   ├── order.service.js
│   ├── social.service.js
│   ├── user.service.js
│   ├── walk.service.js
│   └── webhook.service.js
├── tests/
│   └── api.test.js
├── .env
├── jest.config.js
├── jest.setup.js
└── server.js
```

#### Пример: `server.js` до и после

**До рефакторинга (фрагмент):**

```javascript
// ...
app.get('/api/walks', (req, res) => {
    console.log(`[Walks] Отдаю КОРОТКИЙ список из ${qticketsEventsCache.length} прогулок`);
    const walks = qticketsEventsCache.map(event => ({
        id: event.id,
        // ...
    }));
    res.json(walks);
});

app.post('/api/webhook/qtickets', async (req, res) => {
    // ... вся логика вебхука здесь
});
// ...
```

**После рефакторинга:**

```javascript
// ...
// --- MIDDLEWARE ---
app.use(cors({ origin: '*' }));
app.use(express.json({ verify: (req, res, buf) => { req.rawBody = buf; } }));

// --- РЕГИСТРАЦИЯ МАРШРУТОВ ---
app.use('/api', walkRoutes);
app.use('/api', userRoutes);
app.use('/api', orderRoutes);
app.use('/api', webhookRoutes);
// ...

// --- ЗАПУСК СЕРВЕРА ---
app.listen(PORT, () => {
    console.log(`✅ Основной бэкенд-сервер запущен на http://localhost:${PORT}`);
    walkService.loadQticketsData();
});
```

### 2.3. Внедрение автоматического тестирования

- **Проблема:** Отсутствие тестов делало любой рефакторинг рискованным и не гарантировало корректную работу API.
- **Решение:**
    - Внедрен фреймворк **Jest** для запуска тестов и **Supertest** для тестирования HTTP-эндпоинтов.
    - Создан файл `tests/api.test.js`, содержащий **14 тестов**, которые покрывают все эндпоинты API.
    - Настроена тестовая среда, включая автоматическую загрузку переменных окружения для тестов.
    - В `package.json` добавлен скрипт `npm test`.

## 3. Добавленные зависимости

В `devDependencies` были добавлены следующие пакеты:

- `jest`: Тестовый фреймворк.
- `supertest`: Библиотека для тестирования HTTP-запросов.
- `dotenv`: Для загрузки переменных из `.env` в `process.env`.
- `cross-env` и `dotenv-cli`: Утилиты для кросс-платформенной работы с переменными окружения (в процессе отладки).
