// backend/controllers/daily-tasks.controller.js
// Контроллер для API ежедневных заданий

const dailyTasksService = require('../services/daily-tasks.service');

class DailyTasksController {
    /**
     * GET /api/daily-tasks/:telegramId - Получить ежедневные задания пользователя
     */
    async getUserDailyTasks(req, res) {
        try {
            const { telegramId } = req.params;

            if (!telegramId) {
                return res.status(400).json({
                    success: false,
                    error: 'Telegram ID обязателен'
                });
            }

            const result = await dailyTasksService.getUserDailyTasks(telegramId);
            res.json(result);
        } catch (error) {
            console.error('❌ [DailyTasksController] Ошибка получения заданий:', error);
            res.status(500).json({
                success: false,
                error: 'Ошибка сервера',
                details: error.message
            });
        }
    }

    /**
     * POST /api/daily-tasks/:telegramId/progress - Обновить прогресс задания
     */
    async updateTaskProgress(req, res) {
        try {
            const { telegramId } = req.params;
            const { taskCode, increment = 1 } = req.body;

            if (!telegramId) {
                return res.status(400).json({
                    success: false,
                    error: 'Telegram ID обязателен'
                });
            }

            if (!taskCode) {
                return res.status(400).json({
                    success: false,
                    error: 'Код задания обязателен'
                });
            }

            const result = await dailyTasksService.updateTaskProgress(telegramId, taskCode, increment);
            res.json(result);
        } catch (error) {
            console.error('❌ [DailyTasksController] Ошибка обновления прогресса:', error);
            res.status(500).json({
                success: false,
                error: 'Ошибка сервера',
                details: error.message
            });
        }
    }

    /**
     * POST /api/daily-tasks/:telegramId/checkin - Отметить ежедневный вход
     */
    async dailyCheckin(req, res) {
        try {
            const { telegramId } = req.params;

            if (!telegramId) {
                return res.status(400).json({
                    success: false,
                    error: 'Telegram ID обязателен'
                });
            }

            // Автоматически отмечаем выполнение базовых заданий
            const checkinResult = await dailyTasksService.updateTaskProgress(telegramId, 'DAILY_CHECKIN', 1);
            const profileResult = await dailyTasksService.updateTaskProgress(telegramId, 'DAILY_PROFILE_VIEW', 1);

            // Получаем обновленный список заданий
            const tasksResult = await dailyTasksService.getUserDailyTasks(telegramId);

            res.json({
                success: true,
                message: 'Ежедневный вход зафиксирован',
                checkin: checkinResult,
                profile_view: profileResult,
                tasks: tasksResult.data
            });
        } catch (error) {
            console.error('❌ [DailyTasksController] Ошибка ежедневного входа:', error);
            res.status(500).json({
                success: false,
                error: 'Ошибка сервера',
                details: error.message
            });
        }
    }

    /**
     * GET /api/daily-tasks/:telegramId/streak - Получить статистику стрика
     */
    async getUserStreak(req, res) {
        try {
            const { telegramId } = req.params;

            if (!telegramId) {
                return res.status(400).json({
                    success: false,
                    error: 'Telegram ID обязателен'
                });
            }

            const result = await dailyTasksService.getUserStreak(telegramId);
            res.json(result);
        } catch (error) {
            console.error('❌ [DailyTasksController] Ошибка получения стрика:', error);
            res.status(500).json({
                success: false,
                error: 'Ошибка сервера',
                details: error.message
            });
        }
    }

    /**
     * POST /api/daily-tasks/generate/:telegramId - Сгенерировать задания для пользователя
     */
    async generateTasks(req, res) {
        try {
            const { telegramId } = req.params;
            const { date } = req.body;

            if (!telegramId) {
                return res.status(400).json({
                    success: false,
                    error: 'Telegram ID обязателен'
                });
            }

            const targetDate = date || new Date().toISOString().split('T')[0];
            const result = await dailyTasksService.generateDailyTasksForUser(telegramId, targetDate);
            
            res.json(result);
        } catch (error) {
            console.error('❌ [DailyTasksController] Ошибка генерации заданий:', error);
            res.status(500).json({
                success: false,
                error: 'Ошибка сервера',
                details: error.message
            });
        }
    }

    /**
     * POST /api/daily-tasks/reset - Сброс всех ежедневных заданий (админский endpoint)
     */
    async resetAllDailyTasks(req, res) {
        try {
            const result = await dailyTasksService.resetDailyTasks();
            res.json(result);
        } catch (error) {
            console.error('❌ [DailyTasksController] Ошибка сброса заданий:', error);
            res.status(500).json({
                success: false,
                error: 'Ошибка сервера',
                details: error.message
            });
        }
    }

    /**
     * POST /api/daily-tasks/track - Трекинг активности для автоматического обновления заданий
     */
    async trackActivity(req, res) {
        try {
            const { telegramId, activityType, data } = req.body;

            if (!telegramId || !activityType) {
                return res.status(400).json({
                    success: false,
                    error: 'telegramId и activityType обязательны'
                });
            }

            console.log(`📅 [DailyTasksController] Трекинг активности ${activityType} для ${telegramId}`);

            const updates = [];

            // Сопоставляем активность с заданиями
            switch (activityType) {
                case 'app_visit':
                    const checkinResult = await dailyTasksService.updateTaskProgress(telegramId, 'DAILY_CHECKIN', 1);
                    updates.push({ task: 'DAILY_CHECKIN', result: checkinResult });
                    break;

                case 'profile_view':
                    const profileResult = await dailyTasksService.updateTaskProgress(telegramId, 'DAILY_PROFILE_VIEW', 1);
                    updates.push({ task: 'DAILY_PROFILE_VIEW', result: profileResult });
                    break;

                case 'walk_view':
                    const walkResult = await dailyTasksService.updateTaskProgress(telegramId, 'DAILY_WALK_VIEW', 1);
                    updates.push({ task: 'DAILY_WALK_VIEW', result: walkResult });
                    break;

                case 'purchase':
                    const purchaseResult = await dailyTasksService.updateTaskProgress(telegramId, 'DAILY_PURCHASE_TASK', 1);
                    updates.push({ task: 'DAILY_PURCHASE_TASK', result: purchaseResult });
                    break;

                case 'cashback_use':
                    const cashbackResult = await dailyTasksService.updateTaskProgress(telegramId, 'DAILY_POINTS_SPEND', 1);
                    updates.push({ task: 'DAILY_POINTS_SPEND', result: cashbackResult });
                    break;

                case 'vk_activity':
                    const vkResult = await dailyTasksService.updateTaskProgress(telegramId, 'DAILY_VK_ACTIVITY', 1);
                    updates.push({ task: 'DAILY_VK_ACTIVITY', result: vkResult });
                    break;

                case 'instagram_activity':
                    const instagramResult = await dailyTasksService.updateTaskProgress(telegramId, 'DAILY_INSTAGRAM_ACTIVITY', 1);
                    updates.push({ task: 'DAILY_INSTAGRAM_ACTIVITY', result: instagramResult });
                    break;

                case 'referral_share':
                    const referralResult = await dailyTasksService.updateTaskProgress(telegramId, 'DAILY_REFERRAL_SHARE', 1);
                    updates.push({ task: 'DAILY_REFERRAL_SHARE', result: referralResult });
                    break;

                case 'achievement_unlock':
                    const achievementResult = await dailyTasksService.updateTaskProgress(telegramId, 'WEEKLY_ACHIEVEMENT_HUNT', 1);
                    updates.push({ task: 'WEEKLY_ACHIEVEMENT_HUNT', result: achievementResult });
                    break;

                default:
                    console.log(`⚠️ Неизвестный тип активности: ${activityType}`);
            }

            // Фильтруем успешные обновления
            const successfulUpdates = updates.filter(u => u.result.success);
            const completedTasks = successfulUpdates.filter(u => u.result.is_completed);

            res.json({
                success: true,
                message: `Обработано ${successfulUpdates.length} заданий`,
                updates: successfulUpdates,
                completed_tasks: completedTasks.length,
                completed_details: completedTasks
            });

        } catch (error) {
            console.error('❌ [DailyTasksController] Ошибка трекинга активности:', error);
            res.status(500).json({
                success: false,
                error: 'Ошибка сервера',
                details: error.message
            });
        }
    }

    /**
     * GET /api/daily-tasks/leaderboard - Топ пользователей по стрикам
     */
    async getStreakLeaderboard(req, res) {
        try {
            const limit = parseInt(req.query.limit) || 10;

            if (limit > 100) {
                return res.status(400).json({
                    success: false,
                    error: 'Максимальный лимит: 100'
                });
            }

            const { dbAll } = require('../database');
            const leaderboard = await dbAll(`
                SELECT 
                    us.user_telegram_id,
                    us.current_streak,
                    us.longest_streak,
                    us.total_days_active,
                    u.status,
                    u.points
                FROM user_streaks us
                JOIN users u ON us.user_telegram_id = u.telegram_user_id
                ORDER BY us.longest_streak DESC, us.current_streak DESC
                LIMIT ?
            `, [limit]);

            res.json({
                success: true,
                data: leaderboard
            });

        } catch (error) {
            console.error('❌ [DailyTasksController] Ошибка получения топа:', error);
            res.status(500).json({
                success: false,
                error: 'Ошибка сервера',
                details: error.message
            });
        }
    }
}

module.exports = new DailyTasksController();
