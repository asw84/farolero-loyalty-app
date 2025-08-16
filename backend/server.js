// --- ИЗМЕНЕНИЕ №1: Условная загрузка dotenv ---
// Загружаем переменные из файла .env ТОЛЬКО в среде разработки.
// В Docker (production) переменные будут предоставлены через Docker Compose.
if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}

const express = require('express');
const cors = require('cors');
const fileUpload = require('express-fileupload');

// --- ИМПОРТЫ ---
const walkService = require('./services/walk.service');
const orderController = require('./controllers/order.controller');
const { initializeDatabase } = require('./database');
const VKConfigValidator = require('./utils/vk-config-validator');
const { bootstrapModules, injectModules } = require('./modules/bootstrap');

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
const vkConfigRoutes = require('./routes/vk.config.routes');
const activityRoutes = require('./routes/activity.routes');
const referralRoutes = require('./routes/referral.routes');
const analyticsRoutes = require('./routes/analytics.routes');
const healthRoutes = require('./routes/health.routes');
const oauthRouter = require('./routes/oauth');
const socialRouter = require('./routes/social');
const authRouter = require('./routes/auth');

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
// Middleware для загрузки файлов
app.use(fileUpload({
    limits: { fileSize: 50 * 1024 * 1024 }, // 50MB max
    abortOnLimit: true
}));

// --- ВНЕДРЕНИЕ МОДУЛЕЙ ---
app.use(injectModules);

// --- ИНИЦИАЛИЗАЦИЯ КОНТРОЛЛЕРОВ ---
orderController.init(WALK_URLS);

// --- HEALTH CHECK ENDPOINT ---
app.get('/health', async (req, res) => {
    try {
        // Проверяем основные компоненты системы
        const healthStatus = {
            status: 'OK',
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            version: process.env.npm_package_version || '1.0.0',
            environment: process.env.NODE_ENV || 'development',
            checks: {}
        };

        // Проверка базы данных
        try {
            const { dbGet } = require('./database');
            await dbGet('SELECT 1 as test');
            healthStatus.checks.database = 'OK';
        } catch (dbError) {
            healthStatus.checks.database = 'ERROR: ' + dbError.message;
            healthStatus.status = 'DEGRADED';
        }

        // Проверка файловой системы
        try {
            const fs = require('fs');
            const testPath = process.env.STORAGE_PATH || './';
            fs.accessSync(testPath, fs.constants.R_OK | fs.constants.W_OK);
            healthStatus.checks.filesystem = 'OK';
        } catch (fsError) {
            healthStatus.checks.filesystem = 'ERROR: ' + fsError.message;
            healthStatus.status = 'DEGRADED';
        }

        // Проверка AmoCRM токенов
        try {
            const amocrmClient = require('./amocrm/apiClient');
            const tokens = amocrmClient.getTokens();
            if (tokens.refresh_token) {
                healthStatus.checks.amocrm_tokens = 'OK';
            } else {
                healthStatus.checks.amocrm_tokens = 'WARNING: No refresh token';
                if (healthStatus.status === 'OK') healthStatus.status = 'WARNING';
            }
        } catch (amocrmError) {
            healthStatus.checks.amocrm_tokens = 'ERROR: ' + amocrmError.message;
            if (healthStatus.status === 'OK') healthStatus.status = 'DEGRADED';
        }

        // Возвращаем соответствующий статус код
        const statusCode = healthStatus.status === 'OK' ? 200 : 
                          healthStatus.status === 'WARNING' ? 200 : 503;

        res.status(statusCode).json(healthStatus);

    } catch (error) {
        res.status(503).json({
            status: 'ERROR',
            timestamp: new Date().toISOString(),
            error: error.message
        });
    }
});

// Endpoint для тестирования базы данных
app.get('/api/test/db', async (req, res) => {
    try {
        const { dbGet } = require('./database');
        const result = await dbGet('SELECT COUNT(*) as count FROM users');
        res.json({
            success: true,
            message: 'Database connection OK',
            user_count: result.count
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

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
app.use('/api', vkConfigRoutes);
app.use('/api', activityRoutes);
app.use('/api', referralRoutes);
app.use('/api', analyticsRoutes);
app.use('/health', healthRoutes);
app.use('/api/oauth', oauthRouter);
app.use('/api/social', socialRouter);
app.use('/auth', authRouter);


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
    
    // --- ИНИЦИАЛИЗАЦИЯ МОДУЛЕЙ ---
    const modules = bootstrapModules();
    console.log('🧩 Модульная архитектура готова');
    
    // --- ПРОВЕРКА VK КОНФИГУРАЦИИ ---
    const vkValidator = new VKConfigValidator();
    vkValidator.validateAtStartup();
    
    // Загружаем кеш прогулок при старте
    walkService.loadQticketsData();
});

// Экспортируем app для использования в тестах
module.exports = app;