// --- ИЗМЕНЕНИЕ №1: Условная загрузка dotenv ---
// Загружаем переменные из файла .env ТОЛЬКО в среде разработки.
// В Docker (production) переменные будут предоставлены через Docker Compose.
if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}

const express = require('express');
const cors = require('cors');

// --- ИМПОРТЫ ---
const walkService = require('./services/walk.service');
const orderController = require('./controllers/order.controller');
const { initializeDatabase } = require('./database');

// --- ИМПОРТЫ МАРШРУТОВ ---
const walkRoutes = require('./routes/walk.routes');
const userRoutes = require('./routes/user.routes');
const orderRoutes = require('./routes/order.routes');
const webhookRoutes = require('./routes/webhook.routes');
const adminRoutes = require('./routes/admin.routes');
const socialRoutes = require('./routes/social.routes');
const amocrmRoutes = require('./routes/amocrm.routes');
const vkRoutes = require('./routes/vk.routes');
const instagramRoutes = require('./routes/instagram.routes');
const vkOAuthRoutes = require('./routes/vk.oauth.routes');

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

// --- РЕГИСТРАЦИЯ API МАРШРУТОВ ---
// Бэкенд теперь отвечает ТОЛЬКО на запросы, начинающиеся с /api
app.use('/api', walkRoutes);
app.use('/api', userRoutes);
app.use('/api', orderRoutes);
app.use('/api', webhookRoutes);
app.use('/api', adminRoutes);
app.use('/api', socialRoutes);
app.use('/api/amocrm', amocrmRoutes);
app.use('/api', vkRoutes);
app.use('/api', instagramRoutes);
app.use('/api', vkOAuthRoutes);


// --- ИЗМЕНЕНИЕ №2: БЛОК РАЗДАЧИ ФРОНТЕНДА УДАЛЕН ---
// В нашей архитектуре с Docker + Caddy, за раздачу фронтенда отвечает
// отдельный контейнер с Nginx, а Caddy направляет к нему запросы.
// Бэкенд должен быть чистым API-сервером и не заниматься раздачей HTML.
// Это делает архитектуру правильной и чистой.


// --- ЗАПУСК СЕРВЕРА ---
app.listen(PORT, () => {
    console.log(`✅ Сервер запущен на порту ${PORT}`);
    // Инициализируем базу данных
    initializeDatabase();
    // Загружаем кеш прогулок при старте
    walkService.loadQticketsData();
});

// Экспортируем app для использования в тестах
module.exports = app;