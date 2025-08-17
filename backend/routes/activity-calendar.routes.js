// backend/routes/activity-calendar.routes.js
// Роуты для API календаря активности

const express = require('express');
const router = express.Router();
const activityCalendarController = require('../controllers/activity-calendar.controller');

// Получить календарь активности пользователя за период
router.get('/:telegramId', activityCalendarController.getUserActivityCalendar);

// Получить текущую активность (этот месяц)
router.get('/:telegramId/current', activityCalendarController.getCurrentActivity);

// Получить общую статистику активности
router.get('/:telegramId/stats', activityCalendarController.getActivityStats);

// Получить недельную активность
router.get('/:telegramId/week', activityCalendarController.getWeeklyActivity);

// Получить месячную активность
router.get('/:telegramId/month/:year/:month', activityCalendarController.getMonthlyActivity);

// Получить годовую активность (heat map)
router.get('/:telegramId/year/:year', activityCalendarController.getYearlyActivity);

module.exports = router;
