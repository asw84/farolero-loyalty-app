// backend/controllers/referral.controller.js
// API контроллер для реферальной системы

const referralService = require('../services/referral.service');
const qrGenerator = require('../utils/qr-generator');
const { findUserByTelegramId, findOrCreateUser } = require('../database');

/**
 * Генерирует реферальный код для пользователя
 * POST /api/referral/generate
 */
const generateReferralCode = async (req, res) => {
    try {
        const { telegramId } = req.body;

        if (!telegramId) {
            return res.status(400).json({
                success: false,
                error: 'telegramId обязателен'
            });
        }

        // Проверяем, существует ли пользователь
        let user = await findUserByTelegramId(telegramId);
        if (!user) {
            // Создаем пользователя если его нет
            user = await findOrCreateUser(telegramId, 'telegram_user_id');
        }

        const referralCode = await referralService.createReferralCode(telegramId);
        const referralUrl = referralService.getReferralUrl(referralCode);

        console.log(`[REFERRAL_CONTROLLER] ✅ Код создан: ${referralCode} для ${telegramId}`);

        res.status(200).json({
            success: true,
            referralCode,
            referralUrl
        });

    } catch (error) {
        console.error('[REFERRAL_CONTROLLER] ❌ Ошибка генерации кода:', error);
        res.status(500).json({
            success: false,
            error: 'Ошибка при генерации реферального кода'
        });
    }
};

/**
 * Получает реферальный код пользователя
 * GET /api/referral/my-code/:telegramId
 */
const getMyReferralCode = async (req, res) => {
    try {
        const { telegramId } = req.params;

        const stats = await referralService.getReferralStats(telegramId);
        
        if (!stats.referralCode) {
            return res.status(404).json({
                success: false,
                error: 'Реферальный код не найден'
            });
        }

        const referralUrl = referralService.getReferralUrl(stats.referralCode);

        res.status(200).json({
            success: true,
            referralCode: stats.referralCode,
            referralUrl,
            stats: {
                totalReferrals: stats.totalReferrals,
                totalEarned: stats.totalEarned
            }
        });

    } catch (error) {
        console.error('[REFERRAL_CONTROLLER] ❌ Ошибка получения кода:', error);
        res.status(500).json({
            success: false,
            error: 'Ошибка при получении реферального кода'
        });
    }
};

/**
 * Активирует реферальный код
 * POST /api/referral/activate
 */
const activateReferralCode = async (req, res) => {
    try {
        const { referralCode, telegramId } = req.body;

        if (!referralCode || !telegramId) {
            return res.status(400).json({
                success: false,
                error: 'referralCode и telegramId обязательны'
            });
        }

        // Проверяем валидность кода
        const validation = await referralService.validateReferralCode(referralCode);
        if (!validation.valid) {
            return res.status(400).json({
                success: false,
                error: validation.reason
            });
        }

        // Создаем пользователя если его нет
        let user = await findUserByTelegramId(telegramId);
        if (!user) {
            user = await findOrCreateUser(telegramId, 'telegram_user_id');
        }

        // Активируем код
        const result = await referralService.activateReferralCode(referralCode, telegramId);

        console.log(`[REFERRAL_CONTROLLER] ✅ Код активирован: ${referralCode} -> ${telegramId}`);

        res.status(200).json({
            success: true,
            message: `Реферальный код активирован! Вы получили ${result.refereeBonus} баллов`,
            bonusReceived: result.refereeBonus,
            referrerBonus: result.referrerBonus
        });

    } catch (error) {
        console.error('[REFERRAL_CONTROLLER] ❌ Ошибка активации:', error);
        res.status(400).json({
            success: false,
            error: error.message || 'Ошибка при активации реферального кода'
        });
    }
};

/**
 * Получает статистику рефералов пользователя
 * GET /api/referral/stats/:telegramId
 */
const getReferralStats = async (req, res) => {
    try {
        const { telegramId } = req.params;

        const stats = await referralService.getReferralStats(telegramId);

        res.status(200).json({
            success: true,
            stats
        });

    } catch (error) {
        console.error('[REFERRAL_CONTROLLER] ❌ Ошибка получения статистики:', error);
        res.status(500).json({
            success: false,
            error: 'Ошибка при получении статистики рефералов'
        });
    }
};

/**
 * Генерирует QR-код для реферальной ссылки
 * GET /api/referral/qr/:referralCode
 */
const generateQRCode = async (req, res) => {
    try {
        const { referralCode } = req.params;
        const { format = 'png', style = 'default' } = req.query;

        // Валидируем код
        const validation = await referralService.validateReferralCode(referralCode);
        if (!validation.valid) {
            return res.status(400).json({
                success: false,
                error: validation.reason
            });
        }

        const referralUrl = referralService.getReferralUrl(referralCode);

        let qrCode;
        if (format === 'svg') {
            qrCode = await qrGenerator.generateReferralQRSvg(referralUrl);
            res.setHeader('Content-Type', 'image/svg+xml');
        } else {
            if (style === 'styled') {
                qrCode = await qrGenerator.generateStyledReferralQR(referralUrl);
            } else {
                qrCode = await qrGenerator.generateReferralQR(referralUrl);
            }
            // Возвращаем Data URL для PNG
            res.setHeader('Content-Type', 'application/json');
        }

        if (format === 'svg') {
            res.send(qrCode);
        } else {
            res.status(200).json({
                success: true,
                qrCode,
                referralUrl
            });
        }

        console.log(`[REFERRAL_CONTROLLER] ✅ QR-код сгенерирован для кода: ${referralCode}`);

    } catch (error) {
        console.error('[REFERRAL_CONTROLLER] ❌ Ошибка генерации QR:', error);
        res.status(500).json({
            success: false,
            error: 'Ошибка при генерации QR-кода'
        });
    }
};

/**
 * Валидирует реферальный код
 * GET /api/referral/validate/:referralCode
 */
const validateReferralCode = async (req, res) => {
    try {
        const { referralCode } = req.params;

        const validation = await referralService.validateReferralCode(referralCode);

        res.status(200).json({
            success: true,
            valid: validation.valid,
            reason: validation.reason || null,
            referrerTelegramId: validation.referrerTelegramId || null
        });

    } catch (error) {
        console.error('[REFERRAL_CONTROLLER] ❌ Ошибка валидации:', error);
        res.status(500).json({
            success: false,
            error: 'Ошибка при валидации реферального кода'
        });
    }
};

module.exports = {
    generateReferralCode,
    getMyReferralCode,
    activateReferralCode,
    getReferralStats,
    generateQRCode,
    validateReferralCode
};
