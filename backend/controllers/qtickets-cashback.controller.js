// backend/controllers/qtickets-cashback.controller.js
// Контроллер для операций с кэшбэком в Qtickets

const qticketsCashbackService = require('../services/qtickets-cashback.service');

/**
 * Рассчитать доступный кэшбэк для прогулки
 * GET /api/qtickets/cashback/calculate/:telegramId/:walkId
 */
async function calculateAvailableCashback(req, res) {
    try {
        const { telegramId, walkId } = req.params;
        
        if (!telegramId || !walkId) {
            return res.status(400).json({
                success: false,
                error: 'Требуются параметры telegramId и walkId'
            });
        }
        
        const cashbackInfo = await qticketsCashbackService.calculateAvailableCashback(telegramId, parseInt(walkId));
        
        res.json({
            success: true,
            data: cashbackInfo
        });
        
    } catch (error) {
        console.error('❌ [QticketsCashbackController] Ошибка расчета кэшбэка:', error);
        res.status(500).json({
            success: false,
            error: 'Ошибка сервера при расчете кэшбэка',
            details: error.message
        });
    }
}

/**
 * Валидировать операцию оплаты кэшбэком
 * POST /api/qtickets/cashback/validate
 * Body: { telegramId, walkId, pointsToUse }
 */
async function validateCashbackPayment(req, res) {
    try {
        const { telegramId, walkId, pointsToUse } = req.body;
        
        if (!telegramId || !walkId || pointsToUse === undefined) {
            return res.status(400).json({
                success: false,
                error: 'Требуются параметры: telegramId, walkId, pointsToUse'
            });
        }
        
        if (pointsToUse < 0) {
            return res.status(400).json({
                success: false,
                error: 'Количество баллов не может быть отрицательным'
            });
        }
        
        const validation = await qticketsCashbackService.validateCashbackPayment(telegramId, parseInt(walkId), parseInt(pointsToUse));
        
        res.json({
            success: true,
            validation: validation
        });
        
    } catch (error) {
        console.error('❌ [QticketsCashbackController] Ошибка валидации:', error);
        res.status(500).json({
            success: false,
            error: 'Ошибка сервера при валидации платежа',
            details: error.message
        });
    }
}

/**
 * Обработать оплату кэшбэком
 * POST /api/qtickets/cashback/pay
 * Body: { telegramId, walkId, pointsToUse }
 */
async function processCashbackPayment(req, res) {
    try {
        const { telegramId, walkId, pointsToUse } = req.body;
        
        if (!telegramId || !walkId || pointsToUse === undefined) {
            return res.status(400).json({
                success: false,
                error: 'Требуются параметры: telegramId, walkId, pointsToUse'
            });
        }
        
        if (pointsToUse <= 0) {
            return res.status(400).json({
                success: false,
                error: 'Количество баллов должно быть больше нуля'
            });
        }
        
        const result = await qticketsCashbackService.processCashbackPayment(telegramId, parseInt(walkId), parseInt(pointsToUse));
        
        if (!result.success) {
            return res.status(400).json(result);
        }
        
        res.json(result);
        
    } catch (error) {
        console.error('❌ [QticketsCashbackController] Ошибка обработки платежа:', error);
        res.status(500).json({
            success: false,
            error: 'Ошибка сервера при обработке платежа',
            details: error.message
        });
    }
}

/**
 * Получить историю кэшбэк операций пользователя
 * GET /api/qtickets/cashback/history/:telegramId
 */
async function getCashbackHistory(req, res) {
    try {
        const { telegramId } = req.params;
        
        if (!telegramId) {
            return res.status(400).json({
                success: false,
                error: 'Требуется параметр telegramId'
            });
        }
        
        const history = await qticketsCashbackService.getCashbackHistory(telegramId);
        
        res.json({
            success: true,
            data: {
                telegramId: telegramId,
                totalTransactions: history.length,
                totalSavings: history.reduce((sum, item) => sum + item.savings, 0),
                transactions: history
            }
        });
        
    } catch (error) {
        console.error('❌ [QticketsCashbackController] Ошибка получения истории:', error);
        res.status(500).json({
            success: false,
            error: 'Ошибка сервера при получении истории',
            details: error.message
        });
    }
}

/**
 * Получить статистику кэшбэка пользователя
 * GET /api/qtickets/cashback/stats/:telegramId
 */
async function getCashbackStats(req, res) {
    try {
        const { telegramId } = req.params;
        
        if (!telegramId) {
            return res.status(400).json({
                success: false,
                error: 'Требуется параметр telegramId'
            });
        }
        
        const statusService = require('../services/status.service');
        const userStatus = await statusService.getUserStatus(telegramId);
        const history = await qticketsCashbackService.getCashbackHistory(telegramId);
        
        const stats = {
            userInfo: {
                telegramId: telegramId,
                currentPoints: userStatus.points,
                status: userStatus.status,
                cashbackRate: userStatus.cashbackRate
            },
            cashbackStats: {
                totalTransactions: history.length,
                totalSavings: history.reduce((sum, item) => sum + item.savings, 0),
                averageTransaction: history.length > 0 ? Math.round(history.reduce((sum, item) => sum + item.originalPrice, 0) / history.length) : 0,
                lastTransaction: history.length > 0 ? history[0].purchaseDate : null
            },
            recommendations: {
                nextLevelPoints: userStatus.nextLevelPoints,
                pointsToNextLevel: userStatus.pointsToNextLevel,
                nextLevelBenefit: userStatus.nextLevelPoints ? `+${5}% кэшбэк` : 'Максимальный уровень'
            }
        };
        
        res.json({
            success: true,
            data: stats
        });
        
    } catch (error) {
        console.error('❌ [QticketsCashbackController] Ошибка получения статистики:', error);
        res.status(500).json({
            success: false,
            error: 'Ошибка сервера при получении статистики',
            details: error.message
        });
    }
}

module.exports = {
    calculateAvailableCashback,
    validateCashbackPayment,
    processCashbackPayment,
    getCashbackHistory,
    getCashbackStats
};
