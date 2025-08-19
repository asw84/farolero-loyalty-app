// backend/routes/vk-test.routes.js
const express = require('express');
const router = express.Router();

console.log('[VK_TEST_ROUTES] Initializing VK test routes...');

// Логирование всех запросов к VK тестовым роутам
router.use((req, res, next) => {
    console.log('[VK_TEST_ROUTES] HIT:', req.method, req.originalUrl);
    next();
});

// Минимальные тестовые роуты для проверки работы Express 5
router.get('/test', (req, res) => {
    console.log('[VK_TEST_ROUTES] GET /test called!');
    res.send('VK test OK');
});

router.get('/config', (req, res) => {
    console.log('[VK_TEST_ROUTES] GET /config called!');
    res.json({ ok: true, message: 'VK config works' });
});

router.post('/test', (req, res) => {
    console.log('[VK_TEST_ROUTES] POST /test called!');
    res.json({ success: true, message: 'POST test works!' });
});

console.log('[VK_TEST_ROUTES] VK test routes initialized successfully');

module.exports = router;