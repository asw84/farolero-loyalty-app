# 🎯 Farolero Loyalty App

> Telegram Mini App с интеграциями AmoCRM, VK, Instagram и системой лояльности

## 🚀 Особенности

- **📱 Telegram Mini App** - современный интерфейс пользователя
- **🏢 AmoCRM интеграция** - управление клиентами и лояльностью  
- **🔵 VK авторизация** - привязка социальных сетей
- **📸 Instagram интеграция** - связь с Instagram аккаунтами
- **🎯 Система рефералов** - с QR кодами и бонусами
- **📊 RFM анализ** - сегментация пользователей
- **🎫 Qtickets интеграция** - продажа билетов и кэшбек
- **🔧 Веб-интерфейс настройки** - простая конфигурация

## 📊 Статус готовности

| Компонент | Готовность | Статус |
|-----------|------------|--------|
| 🏢 AmoCRM | 100% | ✅ Готово |
| 🔵 VK | 100% | ✅ Готово |
| 💾 Backend | 98% | ✅ Готово |
| 🎫 Qtickets | 90% | ✅ Работает |
| 📸 Instagram | 75% | ⚠️ Нужна настройка |
| 📱 Telegram Bot | 80% | ⚠️ Опционально |

**Общая готовность: 85%** - готов к production использованию!

## 🛠️ Технологии

### Backend
- **Node.js** + Express.js
- **SQLite3** - база данных
- **Docker** - контейнеризация
- **JWT** - безопасная аутентификация
- **Axios** - HTTP клиент

### Frontend  
- **React 19** + TypeScript
- **Vite** - сборщик
- **React Router DOM** - маршрутизация
- **CSS3** - стилизация

### Интеграции
- **AmoCRM API** - CRM система
- **VK API** - социальная сеть
- **Instagram Basic Display API** - медиа контент
- **Telegram Bot API** - мини-приложение
- **Qtickets API** - продажа билетов

## ⚡ Быстрый старт

### 1. Клонирование
```bash
git clone https://github.com/your-username/farolero-loyalty-app.git
cd farolero-loyalty-app
```

### 2. Настройка окружения
```bash
# Скопируйте и заполните переменные окружения
cp backend/.env.example backend/.env
# Отредактируйте backend/.env с вашими API ключами
```

### 3. Docker запуск (рекомендуется)
```bash
docker-compose up -d --build
```

### 4. Или локальный запуск
```bash
# Backend
cd backend
npm install
node test-db-simple.js  # Инициализация БД
node server.js

# Frontend (в новом терминале)
cd frontend  
npm install
npm run dev
```

## 🔧 Настройка API ключей

### AmoCRM (обязательно)
1. Зайдите в https://your-domain.amocrm.ru/settings/integrations
2. Создайте интеграцию
3. Скопируйте Client ID и Client Secret
4. Используйте веб-интерфейс: `https://your-domain.com/auth/setup`

### VK (рекомендуется)
1. Создайте приложение в https://dev.vk.com/
2. Получите Client ID и Client Secret
3. Настройте Redirect URI: `https://your-domain.com/api/oauth/vk/callback`

### Instagram (опционально)
1. Создайте приложение в https://developers.facebook.com/
2. Добавьте продукт "Instagram Basic Display"
3. Получите App ID и App Secret

## 🧪 Тестирование

### Быстрая проверка
```bash
cd backend
node check-all-integrations.js
```

### Подробная диагностика
```bash
# Проверка всех компонентов
node test-quick.js

# Диагностика конкретных интеграций
node test-vk-integration.js
node test-instagram-integration.js

# Комплексное тестирование
./test-deploy.sh
```

### Генерация тестовых URL
```bash
node generate-vk-test-urls.js
node generate-instagram-test-urls.js
```

## 🌐 API Endpoints

### Авторизация
- `GET /auth/vk/login?tg_user_id=123` - VK авторизация
- `GET /auth/instagram/login?tg_user_id=123` - Instagram авторизация
- `GET /auth/setup` - веб-интерфейс настройки AmoCRM

### Пользователи
- `GET /api/users/:id` - получить пользователя
- `POST /api/users` - создать пользователя
- `PUT /api/users/:id` - обновить пользователя

### Рефералы
- `POST /api/referral/generate` - создать реферальный код
- `POST /api/referral/activate` - активировать код
- `GET /api/referral/stats/:id` - статистика рефералов

### Аналитика
- `GET /api/analytics/rfm` - RFM сегменты
- `POST /api/analytics/rfm/calculate` - пересчет RFM
- `GET /api/analytics/dashboard` - данные дашборда

### Система
- `GET /health` - проверка состояния
- `GET /api/test/db` - тест базы данных

## 🚀 Деплой на сервер

### Через Docker (рекомендуется)
```bash
# На сервере
git clone https://github.com/your-username/farolero-loyalty-app.git
cd farolero-loyalty-app
cp backend/.env.example backend/.env
# Настройте backend/.env
docker-compose up -d --build
```

### Через PM2
```bash
# Установка PM2
npm install -g pm2

# Запуск backend
cd backend
npm install
pm2 start server.js --name "farolero-backend"

# Запуск frontend
cd ../frontend
npm install
npm run build
pm2 serve dist 8080 --name "farolero-frontend"
```

## 📁 Структура проекта

```
farolero-loyalty-app/
├── 📂 backend/                 # Node.js API сервер
│   ├── 📂 amocrm/             # AmoCRM интеграция
│   ├── 📂 controllers/        # API контроллеры
│   ├── 📂 routes/             # Express маршруты  
│   ├── 📂 services/           # Бизнес логика
│   ├── 📂 tests/              # Автотесты
│   ├── 📂 utils/              # Утилиты
│   ├── 📄 database.js         # SQLite настройка
│   ├── 📄 server.js           # Главный файл
│   └── 📄 .env.example        # Пример переменных
├── 📂 frontend/               # React приложение
│   ├── 📂 src/                # Исходный код
│   ├── 📂 public/             # Статика
│   └── 📄 package.json        # Зависимости
├── 📂 scripts/                # Скрипты автоматизации
├── 📂 docs/                   # Документация
├── 📄 docker-compose.yml      # Docker конфигурация
├── 📄 .gitignore              # Git исключения
└── 📄 README.md               # Этот файл
```

## 🔒 Безопасность

- ✅ Все секретные ключи в `.env` (не в Git)
- ✅ JWT токены для состояния OAuth
- ✅ HTTPS обязателен для production
- ✅ Валидация входных данных
- ✅ Ограничение частоты запросов
- ✅ Docker health checks

## 📖 Документация

### Руководства по настройке
- [VK_SETUP_GUIDE.md](VK_SETUP_GUIDE.md) - настройка VK интеграции
- [INSTAGRAM_SETUP_GUIDE.md](INSTAGRAM_SETUP_GUIDE.md) - настройка Instagram
- [TESTING_GUIDE.md](TESTING_GUIDE.md) - гид по тестированию

### Статус и отчеты
- [INTEGRATIONS_STATUS_REPORT.md](INTEGRATIONS_STATUS_REPORT.md) - статус интеграций
- [DEVELOPMENT_ROADMAP.md](docs/DEVELOPMENT_ROADMAP.md) - план развития

## 🤝 Вклад в проект

1. Форкните проект
2. Создайте feature ветку (`git checkout -b feature/amazing-feature`)
3. Закоммитьте изменения (`git commit -m 'Add amazing feature'`)
4. Запушьте в ветку (`git push origin feature/amazing-feature`)
5. Создайте Pull Request

## 📄 Лицензия

Этот проект лицензирован под MIT License - см. файл [LICENSE](LICENSE) для деталей.

## 🆘 Поддержка

### Частые проблемы

1. **Ошибка "Module not found"**
   ```bash
   cd backend && npm install
   ```

2. **База данных не создается**
   ```bash
   node backend/test-db-simple.js
   ```

3. **VK авторизация не работает**
   ```bash
   node backend/test-vk-integration.js
   ```

### Контакты
- 📧 Email: support@farolero.com
- 💬 Telegram: @farolero_support
- 🐛 Issues: GitHub Issues

## 🏆 Авторы

- **Farolero Team** - *Разработка* - [GitHub](https://github.com/farolero)

## 🙏 Благодарности

- AmoCRM за отличное API
- VK за социальную интеграцию  
- Instagram за медиа возможности
- Telegram за платформу Mini Apps
- Qtickets за партнерство

---

**Made with ❤️ by Farolero Team**