// backend/routes/vk-config-only.routes.js

const express = require('express');
const router = express.Router();
const vkOAuthController = require('../controllers/vk.oauth.controller');

console.log('[VK_CONFIG_ONLY_ROUTES] Initializing VK config only routes...');

// Получение конфигурации VK для frontend
router.get('/', vkOAuthController.getVKConfig);
console.log('[VK_CONFIG_ONLY_ROUTES] Registered GET /');

console.log('[VK_CONFIG_ONLY_ROUTES] VK config only routes initialized successfully');

module.exports = router;