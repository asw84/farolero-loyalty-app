// backend/routes/vk.oauth.routes.js
const express = require('express');
const router = express.Router();
const vkOAuthController = require('../controllers/vk.oauth.controller');

// Новый маршрут для верификации данных от VK ID SDK
// POST /api/oauth/vk/verify-auth
router.post('/oauth/vk/verify-auth', vkOAuthController.verifyVKIDAuth);


// Старые маршруты, которые больше не используются, будут удалены.
// GET /auth/vk/login?tg_user_id=123
// router.get('/auth/vk/login', vkOAuthController.handleVKLogin);

// GET /api/oauth/vk/callback?code=...&state=...
// router.get('/oauth/vk/callback', vkOAuthController.handleCallback);

// API маршруты для управления HTML шаблонами (оставлено для возможной кастомизации страниц ошибок)
router.get('/api/vk/oauth/templates/config', vkOAuthController.getTemplatesConfig);
router.put('/vk/oauth/templates/config', vkOAuthController.updateTemplatesConfig);

// Получение конфигурации VK для frontend
router.get('/api/vk/config', vkOAuthController.getVKConfig);

module.exports = router;