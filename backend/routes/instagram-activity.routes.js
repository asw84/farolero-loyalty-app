// backend/routes/instagram-activity.routes.js
// Роуты для API отслеживания активности Instagram

const express = require('express');
const router = express.Router();
const instagramActivityController = require('../controllers/instagram-activity.controller');

/**
 * @route POST /api/instagram/check-activity
 * @desc Проверяет активность пользователя Instagram и начисляет баллы
 * @body { telegram_user_id: string, access_token: string }
 */
router.post('/check-activity', instagramActivityController.checkActivity);

/**
 * @route POST /api/instagram/check-all-activities  
 * @desc Проверяет активность всех пользователей (для cron job)
 */
router.post('/check-all-activities', instagramActivityController.checkAllActivities);

/**
 * @route GET /api/instagram/activity-stats/:telegram_user_id
 * @desc Получает статистику активности пользователя
 */
router.get('/activity-stats/:telegram_user_id', instagramActivityController.getActivityStats);

/**
 * @route POST /api/instagram/verify-activity
 * @desc Проверяет конкретную активность пользователя
 * @body { telegram_user_id: string, access_token: string, action: string, target: object }
 */
router.post('/verify-activity', instagramActivityController.verifyActivity);

/**
 * @route GET /api/instagram/api-capabilities
 * @desc Получает информацию о возможностях Instagram API
 */
router.get('/api-capabilities', instagramActivityController.getApiCapabilities);

module.exports = router;
