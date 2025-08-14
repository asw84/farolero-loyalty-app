// backend/controllers/analytics.controller.js
// API контроллер для аналитики и RFM-анализа

const rfmService = require('../services/rfm.service');
const { dbAll } = require('../database');

/**
 * Пересчитывает RFM для всех пользователей
 * POST /api/analytics/rfm/calculate
 */
const recalculateRFM = async (req, res) => {
    try {
        console.log('[ANALYTICS_CONTROLLER] 🔄 Запущен пересчет RFM...');
        
        await rfmService.calculateRFMForAllUsers();
        
        res.status(200).json({
            success: true,
            message: 'RFM анализ успешно пересчитан для всех пользователей'
        });

        console.log('[ANALYTICS_CONTROLLER] ✅ RFM пересчет завершен');

    } catch (error) {
        console.error('[ANALYTICS_CONTROLLER] ❌ Ошибка пересчета RFM:', error);
        res.status(500).json({
            success: false,
            error: 'Ошибка при пересчете RFM анализа'
        });
    }
};

/**
 * Получает сводку по всем сегментам
 * GET /api/analytics/rfm/segments
 */
const getSegmentsSummary = async (req, res) => {
    try {
        const summary = await rfmService.getSegmentsSummary();
        
        res.status(200).json({
            success: true,
            data: summary
        });

    } catch (error) {
        console.error('[ANALYTICS_CONTROLLER] ❌ Ошибка получения сегментов:', error);
        res.status(500).json({
            success: false,
            error: 'Ошибка при получении данных сегментов'
        });
    }
};

/**
 * Получает RFM данные конкретного пользователя
 * GET /api/analytics/rfm/user/:telegramId
 */
const getUserRFM = async (req, res) => {
    try {
        const { telegramId } = req.params;

        const rfmData = await rfmService.getUserRFM(telegramId);

        if (!rfmData) {
            return res.status(404).json({
                success: false,
                error: 'RFM данные не найдены для данного пользователя'
            });
        }

        res.status(200).json({
            success: true,
            data: rfmData
        });

    } catch (error) {
        console.error('[ANALYTICS_CONTROLLER] ❌ Ошибка получения RFM пользователя:', error);
        res.status(500).json({
            success: false,
            error: 'Ошибка при получении RFM данных пользователя'
        });
    }
};

/**
 * Получает пользователей конкретного сегмента
 * GET /api/analytics/rfm/segment/:segmentName
 */
const getSegmentUsers = async (req, res) => {
    try {
        const { segmentName } = req.params;
        const { limit = 50 } = req.query;

        // Проверяем, что сегмент существует
        if (!rfmService.RFM_SEGMENTS[segmentName]) {
            return res.status(400).json({
                success: false,
                error: 'Неизвестный сегмент'
            });
        }

        const users = await rfmService.getSegmentUsers(segmentName, parseInt(limit));

        res.status(200).json({
            success: true,
            segmentName,
            segmentInfo: rfmService.RFM_SEGMENTS[segmentName],
            users
        });

    } catch (error) {
        console.error('[ANALYTICS_CONTROLLER] ❌ Ошибка получения пользователей сегмента:', error);
        res.status(500).json({
            success: false,
            error: 'Ошибка при получении пользователей сегмента'
        });
    }
};

/**
 * Общий дашборд аналитики
 * GET /api/analytics/dashboard
 */
const getDashboard = async (req, res) => {
    try {
        // Получаем общую статистику
        const totalUsers = await dbAll('SELECT COUNT(*) as count FROM users')[0];
        const totalPurchases = await dbAll('SELECT COUNT(*) as count, SUM(amount) as total FROM purchases')[0];
        const activeUsers = await dbAll(`
            SELECT COUNT(DISTINCT user_telegram_id) as count 
            FROM purchases 
            WHERE purchase_date >= date('now', '-30 days')
        `)[0];

        // Получаем статистику по сегментам
        const segmentsSummary = await rfmService.getSegmentsSummary();

        // Получаем топ сегменты
        const topSegments = segmentsSummary.segments
            .sort((a, b) => b.user_count - a.user_count)
            .slice(0, 5);

        // Статистика по дням (последние 30 дней)
        const dailyStats = await dbAll(`
            SELECT 
                DATE(purchase_date) as date,
                COUNT(*) as purchases,
                COUNT(DISTINCT user_telegram_id) as unique_users,
                SUM(amount) as revenue
            FROM purchases 
            WHERE purchase_date >= date('now', '-30 days')
            GROUP BY DATE(purchase_date)
            ORDER BY date DESC
        `);

        res.status(200).json({
            success: true,
            data: {
                overview: {
                    totalUsers: totalUsers?.count || 0,
                    totalPurchases: totalPurchases?.count || 0,
                    totalRevenue: Math.round(totalPurchases?.total || 0),
                    activeUsers: activeUsers?.count || 0
                },
                segments: {
                    total: segmentsSummary.totalUsers,
                    topSegments
                },
                dailyStats,
                lastUpdated: new Date().toISOString()
            }
        });

    } catch (error) {
        console.error('[ANALYTICS_CONTROLLER] ❌ Ошибка получения дашборда:', error);
        res.status(500).json({
            success: false,
            error: 'Ошибка при получении данных дашборда'
        });
    }
};

/**
 * Получает метрики конверсии реферальной программы
 * GET /api/analytics/referrals
 */
const getReferralAnalytics = async (req, res) => {
    try {
        const referralStats = await dbAll(`
            SELECT 
                COUNT(*) as total_referrals,
                COUNT(CASE WHEN activated_at IS NOT NULL THEN 1 END) as activated_referrals,
                SUM(CASE WHEN bonus_paid = 1 THEN bonus_amount ELSE 0 END) as total_bonuses_paid,
                AVG(CASE WHEN activated_at IS NOT NULL THEN bonus_amount ELSE 0 END) as avg_bonus
            FROM referrals
        `)[0];

        // Топ рефереры
        const topReferrers = await dbAll(`
            SELECT 
                referrer_telegram_id,
                COUNT(*) as referrals_count,
                SUM(bonus_amount) as total_earned
            FROM referrals 
            WHERE activated_at IS NOT NULL
            GROUP BY referrer_telegram_id
            ORDER BY referrals_count DESC
            LIMIT 10
        `);

        // Статистика по дням
        const dailyReferrals = await dbAll(`
            SELECT 
                DATE(activated_at) as date,
                COUNT(*) as activated_referrals
            FROM referrals 
            WHERE activated_at IS NOT NULL 
            AND activated_at >= date('now', '-30 days')
            GROUP BY DATE(activated_at)
            ORDER BY date DESC
        `);

        const conversionRate = referralStats.total_referrals > 0 
            ? Math.round((referralStats.activated_referrals / referralStats.total_referrals) * 100)
            : 0;

        res.status(200).json({
            success: true,
            data: {
                overview: {
                    ...referralStats,
                    conversionRate: `${conversionRate}%`
                },
                topReferrers,
                dailyReferrals
            }
        });

    } catch (error) {
        console.error('[ANALYTICS_CONTROLLER] ❌ Ошибка получения аналитики рефералов:', error);
        res.status(500).json({
            success: false,
            error: 'Ошибка при получении аналитики рефералов'
        });
    }
};

module.exports = {
    recalculateRFM,
    getSegmentsSummary,
    getUserRFM,
    getSegmentUsers,
    getDashboard,
    getReferralAnalytics
};
