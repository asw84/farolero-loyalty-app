// backend/controllers/achievements.controller.js
// Контроллер для API системы достижений

const achievementsService = require('../services/achievements.service');

class AchievementsController {
    /**
     * GET /api/achievements - Получить все доступные достижения
     */
    async getAllAchievements(req, res) {
        try {
            const result = await achievementsService.getAllAchievements();
            res.json(result);
        } catch (error) {
            console.error('❌ [AchievementsController] Ошибка получения достижений:', error);
            res.status(500).json({
                success: false,
                error: 'Ошибка сервера',
                details: error.message
            });
        }
    }

    /**
     * GET /api/achievements/user/:telegramId - Получить достижения пользователя
     */
    async getUserAchievements(req, res) {
        try {
            const { telegramId } = req.params;

            if (!telegramId) {
                return res.status(400).json({
                    success: false,
                    error: 'Telegram ID обязателен'
                });
            }

            const result = await achievementsService.getUserAchievements(telegramId);
            res.json(result);
        } catch (error) {
            console.error('❌ [AchievementsController] Ошибка получения достижений пользователя:', error);
            res.status(500).json({
                success: false,
                error: 'Ошибка сервера',
                details: error.message
            });
        }
    }

    /**
     * POST /api/achievements/check/:telegramId - Проверить и разблокировать достижения
     */
    async checkAchievements(req, res) {
        try {
            const { telegramId } = req.params;
            const { triggerType } = req.body;

            if (!telegramId) {
                return res.status(400).json({
                    success: false,
                    error: 'Telegram ID обязателен'
                });
            }

            const result = await achievementsService.checkAndUnlockAchievements(telegramId, triggerType);
            res.json(result);
        } catch (error) {
            console.error('❌ [AchievementsController] Ошибка проверки достижений:', error);
            res.status(500).json({
                success: false,
                error: 'Ошибка сервера',
                details: error.message
            });
        }
    }

    /**
     * GET /api/achievements/stats/:telegramId - Статистика достижений пользователя
     */
    async getUserStats(req, res) {
        try {
            const { telegramId } = req.params;

            if (!telegramId) {
                return res.status(400).json({
                    success: false,
                    error: 'Telegram ID обязателен'
                });
            }

            const result = await achievementsService.getUserAchievementsStats(telegramId);
            res.json(result);
        } catch (error) {
            console.error('❌ [AchievementsController] Ошибка получения статистики:', error);
            res.status(500).json({
                success: false,
                error: 'Ошибка сервера',
                details: error.message
            });
        }
    }

    /**
     * GET /api/achievements/leaderboard - Топ пользователей по достижениям
     */
    async getLeaderboard(req, res) {
        try {
            const limit = parseInt(req.query.limit) || 10;

            if (limit > 100) {
                return res.status(400).json({
                    success: false,
                    error: 'Максимальный лимит: 100'
                });
            }

            const result = await achievementsService.getAchievementsLeaderboard(limit);
            res.json(result);
        } catch (error) {
            console.error('❌ [AchievementsController] Ошибка получения топа:', error);
            res.status(500).json({
                success: false,
                error: 'Ошибка сервера',
                details: error.message
            });
        }
    }

    /**
     * GET /api/achievements/categories - Получить категории достижений
     */
    async getCategories(req, res) {
        try {
            const categories = [
                {
                    code: 'purchases',
                    name: 'Покупки',
                    description: 'Достижения за покупки билетов',
                    icon: '🛍️'
                },
                {
                    code: 'referrals',
                    name: 'Рефералы',
                    description: 'Достижения за приглашение друзей',
                    icon: '👥'
                },
                {
                    code: 'points',
                    name: 'Баллы',
                    description: 'Достижения за накопление баллов',
                    icon: '💎'
                },
                {
                    code: 'status',
                    name: 'Статусы',
                    description: 'Достижения за повышение статуса',
                    icon: '🏆'
                },
                {
                    code: 'social',
                    name: 'Социальные сети',
                    description: 'Достижения за подключение соцсетей',
                    icon: '🔗'
                }
            ];

            res.json({
                success: true,
                data: categories
            });
        } catch (error) {
            console.error('❌ [AchievementsController] Ошибка получения категорий:', error);
            res.status(500).json({
                success: false,
                error: 'Ошибка сервера',
                details: error.message
            });
        }
    }

    /**
     * POST /api/achievements/trigger - Триггер для проверки достижений (webhook)
     */
    async triggerAchievementCheck(req, res) {
        try {
            const { telegramId, triggerType, data } = req.body;

            if (!telegramId || !triggerType) {
                return res.status(400).json({
                    success: false,
                    error: 'telegramId и triggerType обязательны'
                });
            }

            console.log(`🎯 [AchievementsController] Триггер ${triggerType} для пользователя ${telegramId}`);

            const result = await achievementsService.checkAndUnlockAchievements(telegramId, triggerType);

            // Добавляем информацию о новых достижениях в ответ
            if (result.newlyUnlocked && result.newlyUnlocked.length > 0) {
                console.log(`🏆 Разблокировано ${result.newlyUnlocked.length} новых достижений`);
                
                // Можно добавить уведомления пользователю здесь
                // await notificationService.sendAchievementNotifications(telegramId, result.newlyUnlocked);
            }

            res.json({
                success: true,
                message: `Проверка завершена. Разблокировано: ${result.totalUnlocked}`,
                ...result
            });

        } catch (error) {
            console.error('❌ [AchievementsController] Ошибка триггера достижений:', error);
            res.status(500).json({
                success: false,
                error: 'Ошибка сервера',
                details: error.message
            });
        }
    }

    /**
     * GET /api/achievements/progress/:telegramId/:achievementId - Прогресс конкретного достижения
     */
    async getAchievementProgress(req, res) {
        try {
            const { telegramId, achievementId } = req.params;

            if (!telegramId || !achievementId) {
                return res.status(400).json({
                    success: false,
                    error: 'telegramId и achievementId обязательны'
                });
            }

            // Получаем информацию о достижении
            const achievement = await achievementsService.getAllAchievements();
            const targetAchievement = achievement.data.find(a => a.id == achievementId);

            if (!targetAchievement) {
                return res.status(404).json({
                    success: false,
                    error: 'Достижение не найдено'
                });
            }

            // Рассчитываем текущий прогресс
            const currentProgress = await achievementsService.calculateProgress(telegramId, targetAchievement);
            const progressPercentage = Math.min(100, Math.round((currentProgress / targetAchievement.condition_value) * 100));

            res.json({
                success: true,
                data: {
                    achievement: targetAchievement,
                    current_progress: currentProgress,
                    required_progress: targetAchievement.condition_value,
                    progress_percentage: progressPercentage,
                    is_completed: currentProgress >= targetAchievement.condition_value
                }
            });

        } catch (error) {
            console.error('❌ [AchievementsController] Ошибка получения прогресса:', error);
            res.status(500).json({
                success: false,
                error: 'Ошибка сервера',
                details: error.message
            });
        }
    }
}

module.exports = new AchievementsController();
