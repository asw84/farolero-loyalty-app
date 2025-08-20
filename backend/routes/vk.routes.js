// backend/routes/vk.routes.js

const express = require('express');
const router = express.Router();
const vkController = require('../controllers/vk/webhook.controller');

// Логирование всех запросов к VK роутам
router.use((req, res, next) => {
    console.log('[VK_ROUTES] HIT:', req.method, req.originalUrl);
    next();
});

// VK будет отправлять все события на один и тот же эндпоинт
// POST /api/webhooks/vk -> /webhooks/vk
router.post('/webhooks/vk', vkController.handleVkCallback);

module.exports = router;
