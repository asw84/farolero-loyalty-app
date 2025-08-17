// backend/routes/status.routes.js
// Роуты для работы со статусами пользователей

const express = require('express');
const router = express.Router();
const statusController = require('../controllers/status.controller');

// Получить все уровни статусов
router.get('/levels', statusController.getStatusLevels);

// Получить статус пользователя
router.get('/:telegramId', statusController.getUserStatus);

// Получить процент кэшбэка пользователя
router.get('/:telegramId/cashback-rate', statusController.getCashbackRate);

// Рассчитать кэшбэк для покупки
router.post('/:telegramId/calculate-cashback', statusController.calculateCashback);

// Обновить статус пользователя
router.post('/:telegramId/update-status', statusController.updateUserStatus);

module.exports = router;
