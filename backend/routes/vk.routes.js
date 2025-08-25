// backend/routes/vk.routes.js
const express = require('express');
const router = express.Router();
const vkController = require('../controllers/vk.controller');

// Логирование всех VK запросов
router.use((req, res, next) => {
    console.log(`[VK_ROUTES] ${req.method} ${req.originalUrl}`);
    next();
});

// Привязка VK аккаунта через VK ID SDK
router.post('/link', vkController.linkVKAccount);

// Статус привязки VK аккаунта
router.get('/status', vkController.getVKStatus);

module.exports = router;