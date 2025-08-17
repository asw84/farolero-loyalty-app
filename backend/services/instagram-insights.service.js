// backend/services/instagram-insights.service.js
// Сервис для работы с Instagram Media Insights API

const axios = require('axios');

/**
 * Получить insights для Instagram медиа
 * @param {string} mediaId - ID медиа объекта Instagram
 * @param {string} accessToken - Токен доступа пользователя
 * @param {string[]} metrics - Список метрик для получения
 * @returns {Promise<object>} Данные insights
 */
async function getMediaInsights(mediaId, accessToken, metrics = ['views', 'likes', 'comments', 'shares']) {
    try {
        // Используем новый endpoint согласно документации
        const url = `https://graph.instagram.com/v23.0/${mediaId}/insights`;
        
        const response = await axios.get(url, {
            params: {
                metric: metrics.join(','),
                access_token: accessToken
            },
            timeout: 30000
        });

        return {
            success: true,
            data: response.data.data,
            media_id: mediaId
        };

    } catch (error) {
        console.error('[INSTAGRAM_INSIGHTS] Ошибка получения insights:', error.response ? error.response.data : error.message);
        
        // Обработка специфичных ошибок Instagram API
        if (error.response) {
            const { status, data } = error.response;
            
            if (status === 400 && data.error?.code === 10) {
                // Недостаточно просмотров для story insights
                return {
                    success: false,
                    error: 'insufficient_viewers',
                    message: 'Недостаточно просмотров для отображения insights'
                };
            }
            
            if (status === 403) {
                return {
                    success: false,
                    error: 'permission_denied',
                    message: 'Нет разрешения на получение insights'
                };
            }
        }

        throw new Error(`Instagram Insights API error: ${error.message}`);
    }
}

/**
 * Получить профильную активность с breakdown
 * @param {string} mediaId - ID медиа объекта
 * @param {string} accessToken - Токен доступа
 * @returns {Promise<object>} Данные профильной активности
 */
async function getProfileActivity(mediaId, accessToken) {
    try {
        const url = `https://graph.instagram.com/v23.0/${mediaId}/insights`;
        
        const response = await axios.get(url, {
            params: {
                metric: 'profile_activity',
                breakdown: 'action_type',
                access_token: accessToken
            },
            timeout: 30000
        });

        return {
            success: true,
            data: response.data.data[0], // Первый элемент содержит breakdown
            breakdown: response.data.data[0]?.total_value?.breakdowns || []
        };

    } catch (error) {
        console.error('[INSTAGRAM_INSIGHTS] Ошибка получения profile activity:', error.response ? error.response.data : error.message);
        throw new Error(`Profile activity API error: ${error.message}`);
    }
}

/**
 * Получить navigation insights для Story
 * @param {string} storyMediaId - ID story медиа
 * @param {string} accessToken - Токен доступа
 * @returns {Promise<object>} Данные навигации по story
 */
async function getStoryNavigation(storyMediaId, accessToken) {
    try {
        const url = `https://graph.instagram.com/v23.0/${storyMediaId}/insights`;
        
        const response = await axios.get(url, {
            params: {
                metric: 'navigation',
                breakdown: 'story_navigation_action_type',
                access_token: accessToken
            },
            timeout: 30000
        });

        return {
            success: true,
            data: response.data.data[0],
            navigation_breakdown: response.data.data[0]?.total_value?.breakdowns || []
        };

    } catch (error) {
        console.error('[INSTAGRAM_INSIGHTS] Ошибка получения story navigation:', error.response ? error.response.data : error.message);
        
        // Story insights доступны только 24 часа
        if (error.response?.status === 400) {
            return {
                success: false,
                error: 'story_expired',
                message: 'Story insights доступны только 24 часа'
            };
        }
        
        throw new Error(`Story navigation API error: ${error.message}`);
    }
}

/**
 * Получить рекомендуемые метрики в зависимости от типа медиа
 * @param {string} mediaType - Тип медиа (FEED, STORY, REELS)
 * @returns {string[]} Список рекомендуемых метрик
 */
function getRecommendedMetrics(mediaType) {
    const metricsMap = {
        'FEED': [
            'views',           // Новая метрика (рекомендуется)
            'likes',
            'comments', 
            'shares',
            'saved',
            'reach',
            'profile_visits',
            'profile_activity',
            'total_interactions'
        ],
        'STORY': [
            'views',           // Новая метрика
            'reach',
            'replies',
            'navigation',
            'profile_visits',
            'shares'
        ],
        'REELS': [
            'views',           // Новая метрика
            'likes',
            'comments',
            'shares', 
            'saved',
            'reach',
            'ig_reels_avg_watch_time',
            'ig_reels_video_view_total_time',
            'total_interactions'
        ]
    };

    return metricsMap[mediaType] || metricsMap['FEED'];
}

/**
 * Получить полную аналитику для медиа объекта
 * @param {string} mediaId - ID медиа объекта
 * @param {string} mediaType - Тип медиа
 * @param {string} accessToken - Токен доступа
 * @returns {Promise<object>} Полная аналитика медиа
 */
async function getFullMediaAnalytics(mediaId, mediaType, accessToken) {
    try {
        const metrics = getRecommendedMetrics(mediaType);
        
        // Основные insights
        const insights = await getMediaInsights(mediaId, accessToken, metrics);
        
        // Дополнительная аналитика для FEED контента
        let profileActivity = null;
        if (mediaType === 'FEED') {
            try {
                profileActivity = await getProfileActivity(mediaId, accessToken);
            } catch (error) {
                console.warn('[INSTAGRAM_INSIGHTS] Profile activity недоступна:', error.message);
            }
        }

        // Навигационная аналитика для Story
        let storyNavigation = null;
        if (mediaType === 'STORY') {
            try {
                storyNavigation = await getStoryNavigation(mediaId, accessToken);
            } catch (error) {
                console.warn('[INSTAGRAM_INSIGHTS] Story navigation недоступна:', error.message);
            }
        }

        return {
            success: true,
            media_id: mediaId,
            media_type: mediaType,
            insights: insights.data,
            profile_activity: profileActivity?.data || null,
            story_navigation: storyNavigation?.data || null,
            timestamp: new Date().toISOString()
        };

    } catch (error) {
        console.error('[INSTAGRAM_INSIGHTS] Ошибка получения полной аналитики:', error.message);
        throw error;
    }
}

module.exports = {
    getMediaInsights,
    getProfileActivity,
    getStoryNavigation,
    getRecommendedMetrics,
    getFullMediaAnalytics
};
