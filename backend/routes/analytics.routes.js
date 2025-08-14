// backend/routes/analytics.routes.js
// API маршруты для аналитики и RFM-анализа

const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analytics.controller');

// RFM анализ
router.post('/analytics/rfm/calculate', analyticsController.recalculateRFM);
router.get('/analytics/rfm/segments', analyticsController.getSegmentsSummary);
router.get('/analytics/rfm/user/:telegramId', analyticsController.getUserRFM);
router.get('/analytics/rfm/segment/:segmentName', analyticsController.getSegmentUsers);

// Общая аналитика
router.get('/analytics/dashboard', analyticsController.getDashboard);
router.get('/analytics/referrals', analyticsController.getReferralAnalytics);

module.exports = router;
