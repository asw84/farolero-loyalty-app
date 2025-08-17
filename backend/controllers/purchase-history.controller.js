// backend/controllers/purchase-history.controller.js
// Контроллер для детальной истории покупок с кэшбэком

const purchaseHistoryService = require('../services/purchase-history.service');

/**
 * Получить детальную историю покупок пользователя
 * GET /api/purchases/history/:telegramId
 * Query params: limit, offset, sortBy, sortOrder, dateFrom, dateTo, source, withCashback
 */
async function getDetailedHistory(req, res) {
    try {
        const { telegramId } = req.params;
        
        if (!telegramId) {
            return res.status(400).json({
                success: false,
                error: 'Требуется параметр telegramId'
            });
        }

        const options = {
            limit: parseInt(req.query.limit) || 50,
            offset: parseInt(req.query.offset) || 0,
            sortBy: req.query.sortBy || 'purchase_date',
            sortOrder: req.query.sortOrder || 'DESC',
            dateFrom: req.query.dateFrom || null,
            dateTo: req.query.dateTo || null,
            source: req.query.source || null,
            withCashback: req.query.withCashback === 'true' ? true : 
                         req.query.withCashback === 'false' ? false : null
        };

        const history = await purchaseHistoryService.getDetailedPurchaseHistory(telegramId, options);

        res.json({
            success: true,
            data: history
        });

    } catch (error) {
        console.error('❌ [PurchaseHistoryController] Ошибка получения истории:', error);
        res.status(500).json({
            success: false,
            error: 'Ошибка сервера при получении истории покупок',
            details: error.message
        });
    }
}

/**
 * Получить сводку покупок по периодам
 * GET /api/purchases/summary/:telegramId/:period
 */
async function getPurchaseSummary(req, res) {
    try {
        const { telegramId, period } = req.params;
        
        if (!telegramId) {
            return res.status(400).json({
                success: false,
                error: 'Требуется параметр telegramId'
            });
        }

        const validPeriods = ['day', 'week', 'month'];
        const selectedPeriod = validPeriods.includes(period) ? period : 'month';

        const summary = await purchaseHistoryService.getPurchaseSummaryByPeriod(telegramId, selectedPeriod);

        res.json({
            success: true,
            data: {
                period: selectedPeriod,
                summary: summary
            }
        });

    } catch (error) {
        console.error('❌ [PurchaseHistoryController] Ошибка получения сводки:', error);
        res.status(500).json({
            success: false,
            error: 'Ошибка сервера при получении сводки покупок',
            details: error.message
        });
    }
}

/**
 * Получить топ категорий покупок
 * GET /api/purchases/categories/:telegramId
 */
async function getTopCategories(req, res) {
    try {
        const { telegramId } = req.params;
        const limit = parseInt(req.query.limit) || 10;
        
        if (!telegramId) {
            return res.status(400).json({
                success: false,
                error: 'Требуется параметр telegramId'
            });
        }

        const categories = await purchaseHistoryService.getTopPurchaseCategories(telegramId, limit);

        res.json({
            success: true,
            data: {
                telegramId: telegramId,
                categories: categories
            }
        });

    } catch (error) {
        console.error('❌ [PurchaseHistoryController] Ошибка получения категорий:', error);
        res.status(500).json({
            success: false,
            error: 'Ошибка сервера при получении категорий покупок',
            details: error.message
        });
    }
}

/**
 * Получить рекомендации по оптимизации кэшбэка
 * GET /api/purchases/recommendations/:telegramId
 */
async function getCashbackRecommendations(req, res) {
    try {
        const { telegramId } = req.params;
        
        if (!telegramId) {
            return res.status(400).json({
                success: false,
                error: 'Требуется параметр telegramId'
            });
        }

        const recommendations = await purchaseHistoryService.getCashbackRecommendations(telegramId);

        res.json({
            success: true,
            data: recommendations
        });

    } catch (error) {
        console.error('❌ [PurchaseHistoryController] Ошибка получения рекомендаций:', error);
        res.status(500).json({
            success: false,
            error: 'Ошибка сервера при получении рекомендаций',
            details: error.message
        });
    }
}

/**
 * Получить полную аналитику покупок пользователя
 * GET /api/purchases/analytics/:telegramId
 */
async function getFullAnalytics(req, res) {
    try {
        const { telegramId } = req.params;
        
        if (!telegramId) {
            return res.status(400).json({
                success: false,
                error: 'Требуется параметр telegramId'
            });
        }

        // Получаем все данные параллельно
        const [
            recentHistory,
            monthlySummary,
            topCategories,
            recommendations
        ] = await Promise.all([
            purchaseHistoryService.getDetailedPurchaseHistory(telegramId, { limit: 10 }),
            purchaseHistoryService.getPurchaseSummaryByPeriod(telegramId, 'month'),
            purchaseHistoryService.getTopPurchaseCategories(telegramId, 5),
            purchaseHistoryService.getCashbackRecommendations(telegramId)
        ]);

        const analytics = {
            user: recentHistory.user,
            overview: {
                totalStatistics: recentHistory.statistics,
                recentPurchases: recentHistory.purchases.slice(0, 5),
                monthlySummary: monthlySummary.slice(0, 6),
                topCategories: topCategories
            },
            insights: {
                recommendations: recommendations.recommendations,
                potentialSavings: recommendations.potentialSavings,
                trends: {
                    isActive: recentHistory.statistics.totalPurchases > 0,
                    cashbackUsage: recentHistory.statistics.cashbackPercentage,
                    averageOrderValue: recentHistory.statistics.averagePurchase,
                    loyaltyLevel: recommendations.userStatus.status
                }
            }
        };

        res.json({
            success: true,
            data: analytics
        });

    } catch (error) {
        console.error('❌ [PurchaseHistoryController] Ошибка получения аналитики:', error);
        res.status(500).json({
            success: false,
            error: 'Ошибка сервера при получении аналитики',
            details: error.message
        });
    }
}

/**
 * Экспорт истории покупок в CSV
 * GET /api/purchases/export/:telegramId
 */
async function exportHistory(req, res) {
    try {
        const { telegramId } = req.params;
        
        if (!telegramId) {
            return res.status(400).json({
                success: false,
                error: 'Требуется параметр telegramId'
            });
        }

        const history = await purchaseHistoryService.getDetailedPurchaseHistory(telegramId, { limit: 1000 });
        
        // Формируем CSV
        const csvHeader = 'Дата,Событие,Сумма,Кэшбэк,Итого,Тип,Источник\n';
        const csvRows = history.purchases.map(purchase => {
            return [
                new Date(purchase.purchaseDate).toLocaleDateString('ru-RU'),
                purchase.eventName,
                purchase.originalPrice,
                purchase.cashbackUsed,
                purchase.finalPrice,
                purchase.transactionType === 'cashback' ? 'С кэшбэком' : 'Обычная',
                purchase.source
            ].join(',');
        }).join('\n');
        
        const csv = csvHeader + csvRows;

        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', `attachment; filename="purchase_history_${telegramId}.csv"`);
        res.send('\uFEFF' + csv); // BOM для корректного отображения русских символов в Excel

    } catch (error) {
        console.error('❌ [PurchaseHistoryController] Ошибка экспорта:', error);
        res.status(500).json({
            success: false,
            error: 'Ошибка сервера при экспорте истории',
            details: error.message
        });
    }
}

module.exports = {
    getDetailedHistory,
    getPurchaseSummary,
    getTopCategories,
    getCashbackRecommendations,
    getFullAnalytics,
    exportHistory
};
