const express = require('express');
const router = express.Router();
const vkConfigController = require('../controllers/vk/config_controller');

// Логирование всех запросов к VK Config роутам
router.use((req, res, next) => {
    console.log('[VK_CONFIG_ROUTES] HIT:', req.method, req.originalUrl);
    next();
});

// Получить текущую конфигурацию VK
// GET /api/vk/config/service -> /service
router.get('/service', vkConfigController.getVKConfig);

// Обновить конфигурацию VK
// PUT /api/vk/config/service -> /service
router.put('/service', vkConfigController.updateVKConfig);

// Обновить конфигурацию VK через API VK
// POST /api/vk/config/service/refresh -> /service/refresh
router.post('/service/refresh', vkConfigController.refreshVKConfig);

// Получить строку подтверждения для группы VK
// POST /api/vk/config/service/confirmation-code -> /service/confirmation-code
router.post('/service/confirmation-code', vkConfigController.getConfirmationCode);

// Получить информацию о группе VK
// POST /api/vk/config/service/group-info -> /service/group-info
router.post('/service/group-info', vkConfigController.getGroupInfo);

// Получить статус сервиса конфигурации VK
// GET /api/vk/config/service/status -> /service/status
router.get('/service/status', vkConfigController.getVKConfigStatus);

module.exports = router;
