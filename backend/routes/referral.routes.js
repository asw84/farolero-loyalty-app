// backend/routes/referral.routes.js
// API маршруты для реферальной системы

const express = require('express');
const router = express.Router();
const referralController = require('../controllers/referral.controller');

// Генерация реферального кода
router.post('/referral/generate', referralController.generateReferralCode);

// Получение реферального кода пользователя
router.get('/referral/my-code/:telegramId', referralController.getMyReferralCode);

// Активация реферального кода
router.post('/referral/activate', referralController.activateReferralCode);

// Статистика рефералов
router.get('/referral/stats/:telegramId', referralController.getReferralStats);

// Генерация QR-кода
// Поддерживает query параметры: ?format=png|svg&style=default|styled
router.get('/referral/qr/:referralCode', referralController.generateQRCode);

// Валидация реферального кода
router.get('/referral/validate/:referralCode', referralController.validateReferralCode);

module.exports = router;
