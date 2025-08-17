// backend/controllers/instagram-activity.controller.js
// Контроллер для API отслеживания активности Instagram

const instagramActivityService = require('../services/instagram-activity.service');
const { getUserByTelegramId } = require('../database');

/**
 * Проверяет активность пользователя Instagram и начисляет баллы
 * POST /api/instagram/check-activity
 * Body: { telegram_user_id: string, access_token: string }
 */
async function checkActivity(req, res) {
    try {
        const { telegram_user_id, access_token } = req.body;
        
        if (!telegram_user_id) {
            return res.status(400).json({
                error: 'missing_telegram_user_id',
                message: 'Требуется telegram_user_id'
            });
        }

        if (!access_token) {
            return res.status(400).json({
                error: 'missing_access_token',
                message: 'Требуется access_token Instagram'
            });
        }

        console.log(`[INSTAGRAM_ACTIVITY_CONTROLLER] 🔍 Проверяем активность пользователя ${telegram_user_id}`);

        const result = await instagramActivityService.checkUserActivity(telegram_user_id, access_token);
        
        if (result.success) {
            return res.json({
                success: true,
                message: `Проверка завершена. Начислено ${result.totalPointsAwarded} баллов`,
                data: {
                    account_id: result.accountId,
                    media_checked: result.mediaChecked,
                    total_points_awarded: result.totalPointsAwarded,
                    activities: result.activities
                }
            });
        } else {
            return res.status(500).json({
                success: false,
                error: result.error,
                message: 'Ошибка при проверке активности Instagram'
            });
        }

    } catch (error) {
        console.error('[INSTAGRAM_ACTIVITY_CONTROLLER] ❌ Ошибка в checkActivity:', error);
        return res.status(500).json({
            error: 'internal_error',
            message: 'Внутренняя ошибка сервера'
        });
    }
}

/**
 * Проверяет активность всех пользователей с привязанными Instagram аккаунтами
 * POST /api/instagram/check-all-activities
 * Для использования в cron job
 */
async function checkAllActivities(req, res) {
    try {
        console.log(`[INSTAGRAM_ACTIVITY_CONTROLLER] 🔄 Запуск массовой проверки Instagram активности`);
        
        // TODO: Получить список всех пользователей с привязанными Instagram аккаунтами
        // Это требует расширения базы данных для хранения Instagram токенов
        
        return res.json({
            success: true,
            message: 'Функция массовой проверки активности будет реализована в следующих итерациях',
            note: 'Требуется хранение Instagram access_token в базе данных'
        });

    } catch (error) {
        console.error('[INSTAGRAM_ACTIVITY_CONTROLLER] ❌ Ошибка в checkAllActivities:', error);
        return res.status(500).json({
            error: 'internal_error',
            message: 'Внутренняя ошибка сервера'
        });
    }
}

/**
 * Получает статистику активности пользователя Instagram
 * GET /api/instagram/activity-stats/:telegram_user_id
 */
async function getActivityStats(req, res) {
    try {
        const { telegram_user_id } = req.params;
        
        if (!telegram_user_id) {
            return res.status(400).json({
                error: 'missing_telegram_user_id',
                message: 'Требуется telegram_user_id'
            });
        }

        // Получаем пользователя из базы данных
        const user = await getUserByTelegramId(telegram_user_id);
        
        if (!user) {
            return res.status(404).json({
                error: 'user_not_found',
                message: 'Пользователь не найден'
            });
        }

        // TODO: Получить статистику активности из базы данных
        // Пока возвращаем заглушку
        return res.json({
            success: true,
            data: {
                user_id: user.id,
                telegram_user_id: telegram_user_id,
                instagram_stats: {
                    total_posts_checked: 0,
                    total_points_earned: 0,
                    last_check: null,
                    note: 'Статистика будет доступна после первой проверки активности'
                }
            }
        });

    } catch (error) {
        console.error('[INSTAGRAM_ACTIVITY_CONTROLLER] ❌ Ошибка в getActivityStats:', error);
        return res.status(500).json({
            error: 'internal_error',
            message: 'Внутренняя ошибка сервера'
        });
    }
}

/**
 * Проверяет конкретную активность пользователя Instagram
 * POST /api/instagram/verify-activity
 * Body: { telegram_user_id: string, access_token: string, action: string, target: object }
 */
async function verifyActivity(req, res) {
    try {
        const { telegram_user_id, access_token, action, target } = req.body;
        
        if (!telegram_user_id || !access_token || !action) {
            return res.status(400).json({
                error: 'missing_required_fields',
                message: 'Требуются поля: telegram_user_id, access_token, action'
            });
        }

        console.log(`[INSTAGRAM_ACTIVITY_CONTROLLER] 🎯 Проверяем активность: ${action} для пользователя ${telegram_user_id}`);

        // В Instagram API нельзя проверить лайки на чужих постах
        // Возвращаем информацию о ограничениях API
        const supportedActions = ['post_published', 'story_published'];
        
        if (!supportedActions.includes(action)) {
            return res.status(400).json({
                error: 'unsupported_action',
                message: `Instagram API не поддерживает проверку действия "${action}"`,
                supported_actions: supportedActions,
                note: 'Instagram API позволяет только отслеживать собственный контент пользователя'
            });
        }

        // Для поддерживаемых действий используем основной метод проверки активности
        const result = await instagramActivityService.checkUserActivity(telegram_user_id, access_token);
        
        return res.json({
            success: result.success,
            message: result.success ? 'Активность проверена' : 'Ошибка проверки активности',
            action: action,
            result: result
        });

    } catch (error) {
        console.error('[INSTAGRAM_ACTIVITY_CONTROLLER] ❌ Ошибка в verifyActivity:', error);
        return res.status(500).json({
            error: 'internal_error',
            message: 'Внутренняя ошибка сервера'
        });
    }
}

/**
 * Получает информацию о возможностях Instagram API
 * GET /api/instagram/api-capabilities
 */
async function getApiCapabilities(req, res) {
    try {
        return res.json({
            success: true,
            instagram_api_capabilities: {
                supported_features: [
                    'Отслеживание собственных публикаций пользователя',
                    'Анализ engagement собственного контента',
                    'Insights для постов, stories, reels',
                    'Метрики просмотров, лайков, комментариев',
                    'Начисление баллов за публикацию контента'
                ],
                limitations: [
                    'Нельзя проверить лайки пользователя на чужих постах',
                    'Нельзя отслеживать комментарии на чужих постах',
                    'Нет webhook API для событий (как в VK)',
                    'Требуется Instagram Business аккаунт',
                    'Insights доступны только для собственного контента'
                ],
                api_differences: {
                    vk_api: 'Позволяет проверять активность на любых постах',
                    instagram_api: 'Ограничивается собственным контентом пользователя'
                },
                recommended_workflow: [
                    '1. Пользователь авторизуется через Instagram OAuth',
                    '2. Система периодически проверяет его новые публикации',
                    '3. Начисляются баллы за публикацию и качество engagement',
                    '4. Премиум баллы за высокий engagement rate'
                ]
            }
        });
    } catch (error) {
        console.error('[INSTAGRAM_ACTIVITY_CONTROLLER] ❌ Ошибка в getApiCapabilities:', error);
        return res.status(500).json({
            error: 'internal_error',
            message: 'Внутренняя ошибка сервера'
        });
    }
}

module.exports = {
    checkActivity,
    checkAllActivities,
    getActivityStats,
    verifyActivity,
    getApiCapabilities
};
