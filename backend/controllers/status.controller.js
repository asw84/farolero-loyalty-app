// backend/controllers/status.controller.js
// Контроллер для управления статусами пользователей

const statusService = require('../services/status.service');

/**
 * Получить статус пользователя
 * GET /api/users/:telegramId/status
 */
async function getUserStatus(req, res) {
    try {
        const { telegramId } = req.params;
        
        if (!telegramId) {
            return res.status(400).json({
                success: false,
                error: 'Telegram ID обязателен'
            });
        }

        const statusInfo = await statusService.getUserStatus(telegramId);
        
        res.json({
            success: true,
            data: statusInfo
        });

    } catch (error) {
        console.error('❌ [StatusController] Ошибка при получении статуса:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
}

/**
 * Получить процент кэшбэка пользователя
 * GET /api/users/:telegramId/cashback-rate
 */
async function getCashbackRate(req, res) {
    try {
        const { telegramId } = req.params;
        
        if (!telegramId) {
            return res.status(400).json({
                success: false,
                error: 'Telegram ID обязателен'
            });
        }

        const statusInfo = await statusService.getUserStatus(telegramId);
        
        res.json({
            success: true,
            cashbackRate: statusInfo.cashbackRate,
            status: statusInfo.status,
            points: statusInfo.points
        });

    } catch (error) {
        console.error('❌ [StatusController] Ошибка при получении кэшбэка:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
}

/**
 * Рассчитать кэшбэк для покупки
 * POST /api/users/:telegramId/calculate-cashback
 * Body: { "purchaseAmount": 1000 }
 */
async function calculateCashback(req, res) {
    try {
        const { telegramId } = req.params;
        const { purchaseAmount } = req.body;
        
        if (!telegramId) {
            return res.status(400).json({
                success: false,
                error: 'Telegram ID обязателен'
            });
        }

        if (!purchaseAmount || purchaseAmount <= 0) {
            return res.status(400).json({
                success: false,
                error: 'Сумма покупки должна быть больше 0'
            });
        }

        const cashbackInfo = await statusService.calculateCashback(telegramId, purchaseAmount);
        
        res.json({
            success: true,
            data: cashbackInfo
        });

    } catch (error) {
        console.error('❌ [StatusController] Ошибка при расчете кэшбэка:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
}

/**
 * Обновить статус пользователя (проверить повышение)
 * POST /api/users/:telegramId/update-status
 */
async function updateUserStatus(req, res) {
    try {
        const { telegramId } = req.params;
        
        if (!telegramId) {
            return res.status(400).json({
                success: false,
                error: 'Telegram ID обязателен'
            });
        }

        const result = await statusService.updateUserStatus(telegramId);
        
        res.json({
            success: true,
            data: result
        });

    } catch (error) {
        console.error('❌ [StatusController] Ошибка при обновлении статуса:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
}

/**
 * Получить все уровни статусов
 * GET /api/status/levels
 */
async function getStatusLevels(req, res) {
    try {
        const levels = statusService.getStatusLevels();
        
        res.json({
            success: true,
            data: levels
        });

    } catch (error) {
        console.error('❌ [StatusController] Ошибка при получении уровней:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
}

module.exports = {
    getUserStatus,
    getCashbackRate,
    calculateCashback,
    updateUserStatus,
    getStatusLevels
};
