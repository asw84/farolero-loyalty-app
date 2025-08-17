// backend/controllers/instagram-insights.controller.js
// Контроллер для Instagram Insights API

const instagramInsightsService = require('../services/instagram-insights.service');

/**
 * Получить insights для медиа пользователя
 * GET /api/instagram/insights/:mediaId
 */
async function getMediaInsights(req, res) {
    const { mediaId } = req.params;
    const { metrics, media_type } = req.query;
    
    // В реальном приложении токен должен браться из сессии пользователя
    const accessToken = req.user?.instagram_access_token;
    
    if (!accessToken) {
        return res.status(401).json({
            error: 'unauthorized',
            message: 'Instagram аккаунт не привязан'
        });
    }

    try {
        let result;
        
        if (metrics) {
            // Запрос конкретных метрик
            const metricsArray = metrics.split(',');
            result = await instagramInsightsService.getMediaInsights(mediaId, accessToken, metricsArray);
        } else {
            // Полная аналитика на основе типа медиа
            const mediaType = media_type || 'FEED';
            result = await instagramInsightsService.getFullMediaAnalytics(mediaId, mediaType, accessToken);
        }

        return res.json(result);

    } catch (error) {
        console.error('[INSTAGRAM_INSIGHTS_CONTROLLER] Ошибка:', error.message);
        
        return res.status(500).json({
            error: 'insights_error',
            message: 'Ошибка получения Instagram insights',
            details: error.message
        });
    }
}

/**
 * Получить профильную активность с breakdown
 * GET /api/instagram/insights/:mediaId/profile-activity
 */
async function getProfileActivity(req, res) {
    const { mediaId } = req.params;
    const accessToken = req.user?.instagram_access_token;
    
    if (!accessToken) {
        return res.status(401).json({
            error: 'unauthorized',
            message: 'Instagram аккаунт не привязан'
        });
    }

    try {
        const result = await instagramInsightsService.getProfileActivity(mediaId, accessToken);
        return res.json(result);

    } catch (error) {
        console.error('[INSTAGRAM_INSIGHTS_CONTROLLER] Profile activity ошибка:', error.message);
        
        return res.status(500).json({
            error: 'profile_activity_error',
            message: 'Ошибка получения профильной активности',
            details: error.message
        });
    }
}

/**
 * Получить навигацию по Story
 * GET /api/instagram/insights/:storyId/navigation
 */
async function getStoryNavigation(req, res) {
    const { storyId } = req.params;
    const accessToken = req.user?.instagram_access_token;
    
    if (!accessToken) {
        return res.status(401).json({
            error: 'unauthorized',
            message: 'Instagram аккаунт не привязан'
        });
    }

    try {
        const result = await instagramInsightsService.getStoryNavigation(storyId, accessToken);
        return res.json(result);

    } catch (error) {
        console.error('[INSTAGRAM_INSIGHTS_CONTROLLER] Story navigation ошибка:', error.message);
        
        return res.status(500).json({
            error: 'story_navigation_error', 
            message: 'Ошибка получения навигации по Story',
            details: error.message
        });
    }
}

/**
 * Получить рекомендуемые метрики для типа медиа
 * GET /api/instagram/insights/metrics/:mediaType
 */
async function getRecommendedMetrics(req, res) {
    const { mediaType } = req.params;
    
    try {
        const metrics = instagramInsightsService.getRecommendedMetrics(mediaType.toUpperCase());
        
        return res.json({
            success: true,
            media_type: mediaType.toUpperCase(),
            recommended_metrics: metrics,
            deprecated_metrics: [
                'plays',
                'clips_replays_count', 
                'ig_reels_aggregated_all_plays_count',
                'impressions' // для контента после 2 июля 2024
            ],
            deprecation_date: '2025-04-21'
        });

    } catch (error) {
        return res.status(500).json({
            error: 'metrics_error',
            message: 'Ошибка получения рекомендуемых метрик'
        });
    }
}

/**
 * Тестовый endpoint для проверки Instagram Insights API
 * GET /api/instagram/insights/test
 */
async function testInsightsAPI(req, res) {
    const { media_id, access_token } = req.query;
    
    if (!media_id || !access_token) {
        return res.status(400).json({
            error: 'missing_parameters',
            message: 'Требуются параметры: media_id, access_token'
        });
    }

    try {
        // Тестируем базовые метрики
        const testMetrics = ['views', 'likes', 'comments'];
        const result = await instagramInsightsService.getMediaInsights(
            media_id, 
            access_token, 
            testMetrics
        );

        return res.json({
            test_status: 'success',
            api_version: 'v23.0',
            endpoint: 'graph.instagram.com',
            result: result
        });

    } catch (error) {
        return res.status(500).json({
            test_status: 'failed',
            error: error.message,
            recommendation: 'Проверьте access_token и media_id'
        });
    }
}

module.exports = {
    getMediaInsights,
    getProfileActivity,
    getStoryNavigation,
    getRecommendedMetrics,
    testInsightsAPI
};
