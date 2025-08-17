// backend/services/instagram-activity.service.js
// Сервис для отслеживания активности пользователей в Instagram

const axios = require('axios');
const { findOrCreateUser, addPoints } = require('../database');

// Константы для баллов
const POINTS_FOR_POST = 50;            // За публикацию поста
const POINTS_FOR_STORY = 20;           // За публикацию истории
const POINTS_FOR_ENGAGEMENT = 10;      // За каждые 100 взаимодействий
const POINTS_FOR_VIEWS = 5;            // За каждую 1000 просмотров

/**
 * Проверяет активность пользователя Instagram и начисляет баллы
 * @param {string} telegramUserId - ID пользователя в Telegram
 * @param {string} accessToken - Instagram access token пользователя
 * @returns {Promise<object>} Результат проверки активности
 */
async function checkUserActivity(telegramUserId, accessToken) {
    try {
        console.log(`[INSTAGRAM_ACTIVITY] 🔍 Проверяем активность пользователя ${telegramUserId}`);
        
        // 1. Получаем Instagram Business Account ID
        const accountId = await getInstagramAccountId(accessToken);
        if (!accountId) {
            throw new Error('Instagram Business Account не найден');
        }

        // 2. Получаем последние медиа пользователя (за последние сутки)
        const recentMedia = await getRecentMedia(accountId, accessToken);
        
        // 3. Анализируем каждое медиа и начисляем баллы
        const activityResults = [];
        let totalPointsAwarded = 0;

        for (const media of recentMedia) {
            const result = await analyzeMediaActivity(media, telegramUserId, accessToken);
            activityResults.push(result);
            totalPointsAwarded += result.pointsAwarded;
        }

        console.log(`[INSTAGRAM_ACTIVITY] ✅ Проверка завершена. Начислено ${totalPointsAwarded} баллов за ${recentMedia.length} медиа`);

        return {
            success: true,
            accountId,
            mediaChecked: recentMedia.length,
            totalPointsAwarded,
            activities: activityResults
        };

    } catch (error) {
        console.error('[INSTAGRAM_ACTIVITY] ❌ Ошибка при проверке активности:', error.message);
        return {
            success: false,
            error: error.message,
            totalPointsAwarded: 0
        };
    }
}

/**
 * Получает Instagram Business Account ID пользователя
 * @param {string} accessToken - Instagram access token
 * @returns {Promise<string|null>} Instagram Account ID
 */
async function getInstagramAccountId(accessToken) {
    try {
        const response = await axios.get('https://graph.facebook.com/v23.0/me/accounts', {
            params: {
                access_token: accessToken
            }
        });
        
        const instagramAccount = response.data.data.find(account => account.instagram_business_account);
        return instagramAccount?.instagram_business_account?.id || null;
    } catch (error) {
        console.error('[INSTAGRAM_ACTIVITY] ❌ Ошибка получения Instagram Account ID:', error.message);
        return null;
    }
}

/**
 * Получает последние медиа пользователя за указанный период
 * @param {string} accountId - Instagram Account ID
 * @param {string} accessToken - Instagram access token
 * @param {number} hoursBack - Сколько часов назад искать (по умолчанию 24)
 * @returns {Promise<Array>} Массив медиа объектов
 */
async function getRecentMedia(accountId, accessToken, hoursBack = 24) {
    try {
        const response = await axios.get(`https://graph.facebook.com/v23.0/${accountId}/media`, {
            params: {
                fields: 'id,media_type,timestamp,permalink,caption',
                limit: 50, // Получаем до 50 последних медиа
                access_token: accessToken
            }
        });

        const allMedia = response.data.data || [];
        const cutoffTime = new Date(Date.now() - hoursBack * 60 * 60 * 1000);

        // Фильтруем медиа за последние hoursBack часов
        const recentMedia = allMedia.filter(media => {
            const mediaTime = new Date(media.timestamp);
            return mediaTime >= cutoffTime;
        });

        console.log(`[INSTAGRAM_ACTIVITY] 📱 Найдено ${recentMedia.length} медиа за последние ${hoursBack} часов`);
        return recentMedia;
    } catch (error) {
        console.error('[INSTAGRAM_ACTIVITY] ❌ Ошибка получения медиа:', error.message);
        return [];
    }
}

/**
 * Анализирует активность для конкретного медиа и начисляет баллы
 * @param {object} media - Объект медиа Instagram
 * @param {string} telegramUserId - ID пользователя в Telegram
 * @param {string} accessToken - Instagram access token
 * @returns {Promise<object>} Результат анализа
 */
async function analyzeMediaActivity(media, telegramUserId, accessToken) {
    try {
        console.log(`[INSTAGRAM_ACTIVITY] 📊 Анализируем медиа ${media.id} (${media.media_type})`);
        
        // 1. Получаем insights для медиа
        const insights = await getMediaInsights(media.id, media.media_type, accessToken);
        
        // 2. Находим или создаем пользователя
        const user = await findOrCreateUser(telegramUserId, 'telegram_user_id');
        
        // 3. Рассчитываем и начисляем баллы
        let pointsAwarded = 0;
        const reasons = [];

        // Баллы за публикацию
        if (media.media_type === 'STORY') {
            await addPoints(user.id, POINTS_FOR_STORY, 'instagram', 'story_post');
            pointsAwarded += POINTS_FOR_STORY;
            reasons.push(`Story публикация: +${POINTS_FOR_STORY}`);
        } else {
            await addPoints(user.id, POINTS_FOR_POST, 'instagram', 'feed_post');
            pointsAwarded += POINTS_FOR_POST;
            reasons.push(`Пост публикация: +${POINTS_FOR_POST}`);
        }

        // Баллы за engagement (лайки, комментарии, просмотры)
        if (insights.success) {
            const engagementPoints = calculateEngagementPoints(insights.data);
            if (engagementPoints > 0) {
                await addPoints(user.id, engagementPoints, 'instagram', 'engagement');
                pointsAwarded += engagementPoints;
                reasons.push(`Engagement: +${engagementPoints}`);
            }

            const viewsPoints = calculateViewsPoints(insights.data);
            if (viewsPoints > 0) {
                await addPoints(user.id, viewsPoints, 'instagram', 'views');
                pointsAwarded += viewsPoints;
                reasons.push(`Просмотры: +${viewsPoints}`);
            }
        }

        console.log(`[INSTAGRAM_ACTIVITY] ✅ Медиа ${media.id}: начислено ${pointsAwarded} баллов`);

        return {
            mediaId: media.id,
            mediaType: media.media_type,
            timestamp: media.timestamp,
            pointsAwarded,
            reasons,
            insights: insights.success ? insights.data : null
        };

    } catch (error) {
        console.error(`[INSTAGRAM_ACTIVITY] ❌ Ошибка анализа медиа ${media.id}:`, error.message);
        return {
            mediaId: media.id,
            mediaType: media.media_type,
            pointsAwarded: 0,
            error: error.message
        };
    }
}

/**
 * Получает insights для медиа
 * @param {string} mediaId - ID медиа
 * @param {string} mediaType - Тип медиа
 * @param {string} accessToken - Instagram access token
 * @returns {Promise<object>} Insights данные
 */
async function getMediaInsights(mediaId, mediaType, accessToken) {
    try {
        // Определяем метрики в зависимости от типа медиа
        const metrics = getMetricsForMediaType(mediaType);
        
        const response = await axios.get(`https://graph.instagram.com/v23.0/${mediaId}/insights`, {
            params: {
                metric: metrics.join(','),
                access_token: accessToken
            }
        });

        return {
            success: true,
            data: response.data.data
        };
    } catch (error) {
        console.error(`[INSTAGRAM_ACTIVITY] ⚠️  Не удалось получить insights для ${mediaId}:`, error.message);
        return {
            success: false,
            error: error.message
        };
    }
}

/**
 * Определяет метрики для типа медиа
 * @param {string} mediaType - Тип медиа (IMAGE, VIDEO, STORY, REELS)
 * @returns {Array<string>} Массив метрик
 */
function getMetricsForMediaType(mediaType) {
    switch (mediaType) {
        case 'STORY':
            return ['views', 'reach', 'replies'];
        case 'REELS':
        case 'VIDEO':
            return ['views', 'likes', 'comments', 'shares', 'saved'];
        case 'IMAGE':
        default:
            return ['views', 'likes', 'comments', 'shares', 'saved'];
    }
}

/**
 * Рассчитывает баллы за engagement
 * @param {Array} insights - Массив insights данных
 * @returns {number} Количество баллов за engagement
 */
function calculateEngagementPoints(insights) {
    let totalEngagement = 0;
    
    insights.forEach(insight => {
        const value = insight.values?.[0]?.value || 0;
        
        // Суммируем лайки, комментарии, репосты, сохранения
        if (['likes', 'comments', 'shares', 'saved', 'replies'].includes(insight.name)) {
            totalEngagement += value;
        }
    });

    // Начисляем баллы за каждые 100 взаимодействий
    return Math.floor(totalEngagement / 100) * POINTS_FOR_ENGAGEMENT;
}

/**
 * Рассчитывает баллы за просмотры
 * @param {Array} insights - Массив insights данных
 * @returns {number} Количество баллов за просмотры
 */
function calculateViewsPoints(insights) {
    const viewsInsight = insights.find(insight => insight.name === 'views');
    const views = viewsInsight?.values?.[0]?.value || 0;
    
    // Начисляем баллы за каждую 1000 просмотров
    return Math.floor(views / 1000) * POINTS_FOR_VIEWS;
}

/**
 * Проверяет активность пользователя по его Instagram аккаунту
 * @param {string} instagramUsername - Username Instagram пользователя
 * @param {string} telegramUserId - ID пользователя в Telegram
 * @returns {Promise<object>} Результат проверки
 */
async function checkUserActivityByUsername(instagramUsername, telegramUserId) {
    try {
        // В Instagram API нельзя получить токен по username
        // Этот метод требует предварительной авторизации пользователя
        console.log(`[INSTAGRAM_ACTIVITY] ⚠️  Для проверки активности @${instagramUsername} нужна авторизация пользователя`);
        
        return {
            success: false,
            error: 'Требуется авторизация пользователя через Instagram OAuth',
            suggestion: 'Используйте /auth/instagram/login для привязки аккаунта'
        };
    } catch (error) {
        console.error('[INSTAGRAM_ACTIVITY] ❌ Ошибка проверки по username:', error.message);
        return {
            success: false,
            error: error.message
        };
    }
}

module.exports = {
    checkUserActivity,
    checkUserActivityByUsername,
    getRecentMedia,
    analyzeMediaActivity,
    getMediaInsights,
    calculateEngagementPoints,
    calculateViewsPoints
};
