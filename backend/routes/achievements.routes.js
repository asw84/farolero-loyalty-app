// backend/routes/achievements.routes.js
// Роуты для API системы достижений

const express = require('express');
const router = express.Router();
const achievementsController = require('../controllers/achievements.controller');

// Получить все доступные достижения
router.get('/', achievementsController.getAllAchievements);

// Получить категории достижений
router.get('/categories', achievementsController.getCategories);

// Получить топ пользователей по достижениям
router.get('/leaderboard', achievementsController.getLeaderboard);

// Получить достижения конкретного пользователя
router.get('/user/:telegramId', achievementsController.getUserAchievements);

// Получить статистику достижений пользователя
router.get('/stats/:telegramId', achievementsController.getUserStats);

// Получить прогресс конкретного достижения пользователя
router.get('/progress/:telegramId/:achievementId', achievementsController.getAchievementProgress);

// Проверить и разблокировать достижения пользователя
router.post('/check/:telegramId', achievementsController.checkAchievements);

// Триггер для автоматической проверки достижений (webhook)
router.post('/trigger', achievementsController.triggerAchievementCheck);

module.exports = router;
