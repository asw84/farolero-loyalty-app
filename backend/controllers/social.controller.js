// backend/controllers/social.controller.js

const socialService = require('../services/social.service');

async function checkSubscription(req, res) {
    const { telegramId, socialNetwork } = req.body;

    try {
        const result = await socialService.checkSubscription(telegramId, socialNetwork);
        res.json(result);
    } catch (error) {
        console.error('❌ [SocialController] Критическая ошибка при проверке подписки:', error);
        res.status(error.statusCode || 500).json({ success: false, message: error.message || 'Внутренняя ошибка сервера.' });
    }
}

module.exports = {
    checkSubscription,
};
