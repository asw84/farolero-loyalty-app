// backend/routes/qtickets-cashback.routes.js
// Роуты для операций с кэшбэком в Qtickets

const express = require('express');
const router = express.Router();
const qticketsCashbackController = require('../controllers/qtickets-cashback.controller');

// Расчет доступного кэшбэка для прогулки
router.get('/calculate/:telegramId/:walkId', qticketsCashbackController.calculateAvailableCashback);

// Валидация операции оплаты кэшбэком
router.post('/validate', qticketsCashbackController.validateCashbackPayment);

// Обработка оплаты кэшбэком
router.post('/pay', qticketsCashbackController.processCashbackPayment);

// История кэшбэк операций пользователя
router.get('/history/:telegramId', qticketsCashbackController.getCashbackHistory);

// Статистика кэшбэка пользователя
router.get('/stats/:telegramId', qticketsCashbackController.getCashbackStats);

module.exports = router;
