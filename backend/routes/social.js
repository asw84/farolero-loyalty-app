const express = require('express');
// VK action controller удален - миграция на VK ID SDK
// const { verifyAndReward } = require('../controllers/vk/action_controller');

const router = express.Router();

// TODO: Переписать VK социальную активность под новый VK ID SDK
// Временная заглушка для совместимости
router.post('/vk/verify', (req, res) => {
    res.status(501).json({ 
        error: 'VK verification temporarily disabled during VK ID SDK migration',
        message: 'Функция проверки VK активности временно отключена во время миграции на VK ID SDK'
    });
});

module.exports = router;
