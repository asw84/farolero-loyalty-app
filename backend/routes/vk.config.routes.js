const express = require('express');
const router = express.Router();
const vkConfigController = require('../controllers/vk.config.controller');

// Получить текущую конфигурацию VK
// GET /api/vk/config
router.get('/api/vk/config', vkConfigController.getVKConfig);

// Обновить конфигурацию VK
// PUT /api/vk/config
router.put('/api/vk/config', vkConfigController.updateVKConfig);

// Обновить конфигурацию VK через API VK
// POST /api/vk/config/refresh
router.post('/api/vk/config/refresh', vkConfigController.refreshVKConfig);

// Получить строку подтверждения для группы VK
// POST /api/vk/config/confirmation-code
router.post('/api/vk/config/confirmation-code', vkConfigController.getConfirmationCode);

// Получить информацию о группе VK
// POST /api/vk/config/group-info
router.post('/api/vk/config/group-info', vkConfigController.getGroupInfo);

// Получить статус сервиса конфигурации VK
// GET /api/vk/config/status
router.get('/api/vk/config/status', vkConfigController.getVKConfigStatus);

module.exports = router;
