// backend/server.js
// ФИНАЛЬНАЯ ВЕРСИЯ ПОСЛЕ РЕФАКТОРИНГА

require('dotenv').config();
const express = require('express');
const cors = require('cors');

// --- ИМПОРТЫ ---
const walkService = require('./services/walk.service');
const orderController = require('./controllers/order.controller');

// --- ИМПОРТЫ МАРШРУТОВ ---
const walkRoutes = require('./routes/walk.routes');
const userRoutes = require('./routes/user.routes');
const orderRoutes = require('./routes/order.routes');
const webhookRoutes = require('./routes/webhook.routes');
const adminRoutes = require('./routes/admin.routes');
const socialRoutes = require('./routes/social.routes');
const amocrmRoutes = require('./routes/amocrm.routes');

// --- ИНИЦИАЛИЗАЦИЯ ПРИЛОЖЕНИЯ ---
const app = express();
const PORT = process.env.PORT || 3001;

// --- КОНФИГУРАЦИЯ (только то, что нужно передать в контроллеры) ---
const WALK_URLS = {
    1578: 'https://t.me/QticketsBuyBot/buy?startapp=1578', 17333: 'https://t.me/QticketsBuyBot/buy?startapp=17333',
    16423: 'https://t.me/QticketsBuyBot/buy?startapp=16423', 1562: 'https://t.me/QticketsBuyBot/buy?startapp=1562',
    32248: 'https://t.me/QticketsBuyBot/buy?startapp=32248', 5623: 'https://t.me/QticketsBuyBot/buy?startapp=5623',
    25437: 'https://t.me/QticketsBuyBot/buy?startapp=25437', 18920: 'https://t.me/QticketsBuyBot/buy?startapp=18920',
    2616: 'https://t.me/QticketsBuyBot/buy?startapp=2616',
};

// --- MIDDLEWARE ---
app.use(cors({ origin: '*' }));
// Важно! express.json() с verify должен быть до регистрации роутов, которые его используют (вебхуки)
app.use(express.json({ verify: (req, res, buf) => { req.rawBody = buf; } }));

// --- ИНИЦИАЛИЗАЦИЯ КОНТРОЛЛЕРОВ ---
orderController.init(WALK_URLS);

// --- РЕГИСТРАЦИЯ МАРШРУТОВ ---
app.use('/api', walkRoutes);
app.use('/api', userRoutes);
app.use('/api', orderRoutes);
app.use('/api', webhookRoutes);
app.use('/api', adminRoutes);
app.use('/api', socialRoutes);
app.use('/api', amocrmRoutes);

// --- ЗАПУСК СЕРВЕРА ---
app.listen(PORT, () => {
    console.log(`✅ Основной бэкенд-сервер запущен на http://localhost:${PORT}`);
    // Загружаем кеш прогулок при старте
    walkService.loadQticketsData();
});

// Экспортируем app для использования в тестах
module.exports = app;