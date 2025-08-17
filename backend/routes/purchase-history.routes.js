// backend/routes/purchase-history.routes.js
// Роуты для детальной истории покупок с кэшбэком

const express = require('express');
const router = express.Router();
const purchaseHistoryController = require('../controllers/purchase-history.controller');

// Детальная история покупок с фильтрацией и пагинацией
router.get('/history/:telegramId', purchaseHistoryController.getDetailedHistory);

// Сводка покупок по периодам (день, неделя, месяц)
router.get('/summary/:telegramId/:period', purchaseHistoryController.getPurchaseSummary);

// Топ категорий покупок
router.get('/categories/:telegramId', purchaseHistoryController.getTopCategories);

// Рекомендации по оптимизации кэшбэка
router.get('/recommendations/:telegramId', purchaseHistoryController.getCashbackRecommendations);

// Полная аналитика покупок (дашборд)
router.get('/analytics/:telegramId', purchaseHistoryController.getFullAnalytics);

// Экспорт истории в CSV
router.get('/export/:telegramId', purchaseHistoryController.exportHistory);

module.exports = router;
