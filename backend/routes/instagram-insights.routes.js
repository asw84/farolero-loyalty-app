// backend/routes/instagram-insights.routes.js
// Роуты для Instagram Insights API

const express = require('express');
const router = express.Router();
const instagramInsightsController = require('../controllers/instagram-insights.controller');

/**
 * @route GET /api/instagram/insights/:mediaId
 * @description Получить insights для медиа объекта
 * @params mediaId - ID медиа объекта Instagram
 * @query metrics - Список метрик через запятую (опционально)
 * @query media_type - Тип медиа: FEED, STORY, REELS (опционально)
 */
router.get('/:mediaId', instagramInsightsController.getMediaInsights);

/**
 * @route GET /api/instagram/insights/:mediaId/profile-activity
 * @description Получить профильную активность с breakdown
 * @params mediaId - ID медиа объекта Instagram
 */
router.get('/:mediaId/profile-activity', instagramInsightsController.getProfileActivity);

/**
 * @route GET /api/instagram/insights/:storyId/navigation
 * @description Получить навигацию по Story
 * @params storyId - ID story медиа Instagram
 */
router.get('/:storyId/navigation', instagramInsightsController.getStoryNavigation);

/**
 * @route GET /api/instagram/insights/metrics/:mediaType
 * @description Получить рекомендуемые метрики для типа медиа
 * @params mediaType - Тип медиа: feed, story, reels
 */
router.get('/metrics/:mediaType', instagramInsightsController.getRecommendedMetrics);

/**
 * @route GET /api/instagram/insights/test
 * @description Тестовый endpoint для проверки API
 * @query media_id - ID медиа для тестирования
 * @query access_token - Токен доступа для тестирования
 */
router.get('/test', instagramInsightsController.testInsightsAPI);

module.exports = router;
