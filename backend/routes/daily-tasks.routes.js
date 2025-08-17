// backend/routes/daily-tasks.routes.js
// Роуты для API ежедневных заданий

const express = require('express');
const router = express.Router();
const dailyTasksController = require('../controllers/daily-tasks.controller');

// Получить ежедневные задания пользователя
router.get('/:telegramId', dailyTasksController.getUserDailyTasks);

// Получить статистику стрика пользователя
router.get('/:telegramId/streak', dailyTasksController.getUserStreak);

// Отметить ежедневный вход (автоматически выполняет базовые задания)
router.post('/:telegramId/checkin', dailyTasksController.dailyCheckin);

// Обновить прогресс конкретного задания
router.post('/:telegramId/progress', dailyTasksController.updateTaskProgress);

// Сгенерировать задания для пользователя (обычно автоматически)
router.post('/generate/:telegramId', dailyTasksController.generateTasks);

// Трекинг активности для автоматического обновления заданий
router.post('/track', dailyTasksController.trackActivity);

// Топ пользователей по стрикам
router.get('/leaderboard/streaks', dailyTasksController.getStreakLeaderboard);

// Админские endpoints
router.post('/reset', dailyTasksController.resetAllDailyTasks);

module.exports = router;
