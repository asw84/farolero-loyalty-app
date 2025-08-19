// backend/routes/vk.oauth.routes.js
const express = require('express');
const router = express.Router();
const vkOAuthController = require('../controllers/vk.oauth.controller');

console.log('[VK_OAUTH_ROUTES] Initializing VK OAuth routes...');

// Логирование всех запросов к VK OAuth роутам
router.use((req, res, next) => {
    console.log('[VK_OAUTH_ROUTES] HIT:', req.method, req.originalUrl);
    next();
});

// Новый маршрут для верификации данных от VK ID SDK
// POST /api/oauth/vk/verify-auth -> /verify-auth
router.post('/verify-auth', vkOAuthController.verifyVKIDAuth);
console.log('[VK_OAUTH_ROUTES] Registered POST /verify-auth');


// Старые маршруты, которые больше не используются, будут удалены.
// GET /auth/vk/login?tg_user_id=123
router.get('/auth/vk/login', vkOAuthController.handleVKLogin);

// GET /api/oauth/vk/callback?code=...&state=...
router.get('/oauth/vk/callback', vkOAuthController.handleCallback);

// API маршруты для управления HTML шаблонами (оставлено для возможной кастомизации страниц ошибок)
// GET /api/vk/oauth/templates/config -> /templates/config
router.get('/templates/config', vkOAuthController.getTemplatesConfig);
// PUT /api/vk/oauth/templates/config -> /templates/config
router.put('/templates/config', vkOAuthController.updateTemplatesConfig);
console.log('[VK_OAUTH_ROUTES] Registered GET/PUT /templates/config');

// Тестовый маршрут для проверки работы POST-запросов
// POST /api/vk/test -> /test
router.post('/test', (req, res) => {
    console.log('[VK_OAUTH_ROUTES] POST test route called!');
    res.json({ success: true, message: 'POST test route works!' });
});
console.log('[VK_OAUTH_ROUTES] Registered POST /test');

// Тестовый маршрут для проверки работы GET-запросов
// GET /api/vk/test -> /test
router.get('/test', (req, res) => {
    console.log('[VK_OAUTH_ROUTES] GET test route called!');
    res.json({ success: true, message: 'GET test route works!' });
});
console.log('[VK_OAUTH_ROUTES] Registered GET /test');

// Получение конфигурации VK для frontend
// GET /api/vk/config -> /config
router.get('/config', vkOAuthController.getVKConfig);
console.log('[VK_OAUTH_ROUTES] Registered GET /config');

console.log('[VK_OAUTH_ROUTES] VK OAuth routes initialized successfully');

module.exports = router;