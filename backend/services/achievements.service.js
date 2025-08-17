// backend/services/achievements.service.js
// Сервис для работы с системой достижений

const { dbRun, dbGet, dbAll, findUserByTelegramId, addPointsByTelegramId } = require('../database');
const amocrmService = require('./amocrm.service');

class AchievementsService {
    /**
     * Получить все доступные достижения
     */
    async getAllAchievements() {
        try {
            const achievements = await dbAll(
                'SELECT * FROM achievements WHERE is_active = 1 ORDER BY category, condition_value'
            );
            
            return {
                success: true,
                data: achievements
            };
        } catch (error) {
            console.error('❌ [AchievementsService] Ошибка получения достижений:', error);
            throw error;
        }
    }

    /**
     * Получить достижения пользователя с прогрессом
     */
    async getUserAchievements(telegramId) {
        try {
            const userAchievements = await dbAll(`
                SELECT 
                    a.*,
                    ua.unlocked_at,
                    ua.current_progress,
                    ua.is_completed,
                    ua.notified
                FROM achievements a
                LEFT JOIN user_achievements ua ON a.id = ua.achievement_id 
                    AND ua.user_telegram_id = ?
                WHERE a.is_active = 1
                ORDER BY 
                    ua.is_completed ASC,
                    a.category,
                    a.condition_value
            `, [telegramId]);

            // Добавляем расчет прогресса для каждого достижения
            const achievementsWithProgress = await Promise.all(
                userAchievements.map(async (achievement) => {
                    const progress = await this.calculateProgress(telegramId, achievement);
                    return {
                        ...achievement,
                        progress_percentage: Math.min(100, Math.round((progress / achievement.condition_value) * 100)),
                        current_progress: progress,
                        is_available: progress >= achievement.condition_value && !achievement.is_completed
                    };
                })
            );

            return {
                success: true,
                data: achievementsWithProgress
            };
        } catch (error) {
            console.error('❌ [AchievementsService] Ошибка получения достижений пользователя:', error);
            throw error;
        }
    }

    /**
     * Рассчитать текущий прогресс для конкретного достижения
     */
    async calculateProgress(telegramId, achievement) {
        try {
            const user = await findUserByTelegramId(telegramId);
            if (!user) return 0;

            let progress = 0;

            switch (achievement.condition_field) {
                case 'purchases':
                    const purchases = await dbGet(
                        'SELECT COUNT(*) as count FROM purchases WHERE user_telegram_id = ?',
                        [telegramId]
                    );
                    progress = purchases ? purchases.count : 0;
                    break;

                case 'referrals':
                    const referrals = await dbGet(
                        'SELECT COUNT(*) as count FROM referrals WHERE referrer_telegram_id = ? AND activated_at IS NOT NULL',
                        [telegramId]
                    );
                    progress = referrals ? referrals.count : 0;
                    break;

                case 'points':
                    progress = user.points || 0;
                    break;

                case 'status_silver':
                    progress = ['Серебро', 'Золото', 'Платина'].includes(user.status) ? 1 : 0;
                    break;

                case 'status_gold':
                    progress = ['Золото', 'Платина'].includes(user.status) ? 1 : 0;
                    break;

                case 'status_platinum':
                    progress = user.status === 'Платина' ? 1 : 0;
                    break;

                case 'vk_connected':
                    progress = user.vk_user_id ? 1 : 0;
                    break;

                case 'instagram_connected':
                    progress = user.instagram_user_id ? 1 : 0;
                    break;

                default:
                    progress = 0;
            }

            return progress;
        } catch (error) {
            console.error('❌ [AchievementsService] Ошибка расчета прогресса:', error);
            return 0;
        }
    }

    /**
     * Проверить и разблокировать новые достижения для пользователя
     */
    async checkAndUnlockAchievements(telegramId, triggerType = null) {
        try {
            console.log(`🎯 [AchievementsService] Проверка достижений для ${telegramId}, триггер: ${triggerType}`);

            const user = await findUserByTelegramId(telegramId);
            if (!user) {
                console.log('❌ Пользователь не найден');
                return { success: false, error: 'Пользователь не найден' };
            }

            // Получаем все активные достижения
            const allAchievements = await dbAll(
                'SELECT * FROM achievements WHERE is_active = 1'
            );

            // Получаем уже разблокированные достижения пользователя
            const unlockedAchievements = await dbAll(
                'SELECT achievement_id FROM user_achievements WHERE user_telegram_id = ? AND is_completed = 1',
                [telegramId]
            );
            const unlockedIds = unlockedAchievements.map(ua => ua.achievement_id);

            const newlyUnlocked = [];

            for (const achievement of allAchievements) {
                // Пропускаем уже разблокированные
                if (unlockedIds.includes(achievement.id)) continue;

                // Фильтруем по типу триггера для оптимизации
                if (triggerType && this.shouldCheckAchievement(achievement, triggerType)) {
                    const progress = await this.calculateProgress(telegramId, achievement);
                    
                    // Проверяем выполнение условия
                    const isCompleted = this.checkCondition(achievement, progress);

                    if (isCompleted) {
                        await this.unlockAchievement(telegramId, achievement);
                        newlyUnlocked.push(achievement);
                        console.log(`🏆 Разблокировано достижение: ${achievement.name}`);
                    } else {
                        // Обновляем прогресс
                        await this.updateProgress(telegramId, achievement.id, progress);
                    }
                }
            }

            return {
                success: true,
                newlyUnlocked,
                totalUnlocked: newlyUnlocked.length
            };

        } catch (error) {
            console.error('❌ [AchievementsService] Ошибка проверки достижений:', error);
            throw error;
        }
    }

    /**
     * Определить, нужно ли проверять достижение при данном триггере
     */
    shouldCheckAchievement(achievement, triggerType) {
        const triggerMap = {
            'purchase': ['purchases'],
            'referral': ['referrals'],
            'points': ['points'],
            'status': ['status_silver', 'status_gold', 'status_platinum'],
            'social': ['vk_connected', 'instagram_connected']
        };

        if (!triggerType) return true; // Проверяем все если триггер не указан
        
        const relevantFields = triggerMap[triggerType] || [];
        return relevantFields.includes(achievement.condition_field);
    }

    /**
     * Проверить выполнение условия достижения
     */
    checkCondition(achievement, currentProgress) {
        switch (achievement.condition_type) {
            case 'count':
            case 'threshold':
                return currentProgress >= achievement.condition_value;
            case 'milestone':
                return currentProgress >= achievement.condition_value;
            default:
                return false;
        }
    }

    /**
     * Разблокировать достижение и начислить награду
     */
    async unlockAchievement(telegramId, achievement) {
        try {
            // Записываем разблокировку достижения
            await dbRun(`
                INSERT OR REPLACE INTO user_achievements 
                (user_telegram_id, achievement_id, current_progress, is_completed, unlocked_at)
                VALUES (?, ?, ?, 1, CURRENT_TIMESTAMP)
            `, [telegramId, achievement.id, achievement.condition_value]);

            // Начисляем награду в баллах
            if (achievement.points_reward > 0) {
                await addPointsByTelegramId(
                    telegramId, 
                    achievement.points_reward, 
                    'achievement', 
                    `achievement_${achievement.code}`
                );

                console.log(`💰 Начислено ${achievement.points_reward} баллов за достижение "${achievement.name}"`);
            }

            // Синхронизируем с AmoCRM
            try {
                const user = await findUserByTelegramId(telegramId);
                if (user && user.synced_with_amo) {
                    await amocrmService.syncUserToAmo(user);
                    console.log(`📞 Достижение синхронизировано с AmoCRM`);
                }
            } catch (amoError) {
                console.warn('⚠️ Ошибка синхронизации с AmoCRM:', amoError.message);
            }

            return {
                success: true,
                achievement,
                pointsAwarded: achievement.points_reward
            };

        } catch (error) {
            console.error('❌ [AchievementsService] Ошибка разблокировки достижения:', error);
            throw error;
        }
    }

    /**
     * Обновить прогресс достижения без разблокировки
     */
    async updateProgress(telegramId, achievementId, currentProgress) {
        try {
            await dbRun(`
                INSERT OR REPLACE INTO user_achievements 
                (user_telegram_id, achievement_id, current_progress, is_completed)
                VALUES (?, ?, ?, 0)
            `, [telegramId, achievementId, currentProgress]);

        } catch (error) {
            console.error('❌ [AchievementsService] Ошибка обновления прогресса:', error);
        }
    }

    /**
     * Получить статистику по достижениям пользователя
     */
    async getUserAchievementsStats(telegramId) {
        try {
            const stats = await dbGet(`
                SELECT 
                    COUNT(*) as total_achievements,
                    COUNT(CASE WHEN ua.is_completed = 1 THEN 1 END) as completed_achievements,
                    COALESCE(SUM(CASE WHEN ua.is_completed = 1 THEN a.points_reward ELSE 0 END), 0) as total_points_from_achievements
                FROM achievements a
                LEFT JOIN user_achievements ua ON a.id = ua.achievement_id 
                    AND ua.user_telegram_id = ?
                WHERE a.is_active = 1
            `, [telegramId]);

            const completionRate = stats.total_achievements > 0 
                ? Math.round((stats.completed_achievements / stats.total_achievements) * 100)
                : 0;

            return {
                success: true,
                data: {
                    ...stats,
                    completion_rate: completionRate
                }
            };

        } catch (error) {
            console.error('❌ [AchievementsService] Ошибка получения статистики:', error);
            throw error;
        }
    }

    /**
     * Получить топ пользователей по достижениям
     */
    async getAchievementsLeaderboard(limit = 10) {
        try {
            const leaderboard = await dbAll(`
                SELECT 
                    ua.user_telegram_id,
                    u.status,
                    u.points,
                    COUNT(ua.achievement_id) as achievements_count,
                    SUM(a.points_reward) as points_from_achievements
                FROM user_achievements ua
                JOIN users u ON ua.user_telegram_id = u.telegram_user_id
                JOIN achievements a ON ua.achievement_id = a.id
                WHERE ua.is_completed = 1
                GROUP BY ua.user_telegram_id
                ORDER BY achievements_count DESC, points_from_achievements DESC
                LIMIT ?
            `, [limit]);

            return {
                success: true,
                data: leaderboard
            };

        } catch (error) {
            console.error('❌ [AchievementsService] Ошибка получения топа:', error);
            throw error;
        }
    }
}

module.exports = new AchievementsService();
