const express = require('express');
const { verifyAndReward } = require('../controllers/vkController');

const router = express.Router();

// TODO: добавить middleware для авторизации
// const { requireAuth } = require('../telegram/middleware');

// Временно без авторизации для тестирования
router.post('/vk/verify', verifyAndReward);

module.exports = router;
