// backend/routes/vk.routes.js

const express = require('express');
const router = express.Router();
const vkController = require('../controllers/vk.controller');

// VK будет отправлять все события на один и тот же эндпоинт
router.post('/webhooks/vk', vkController.handleVkCallback);

module.exports = router;
