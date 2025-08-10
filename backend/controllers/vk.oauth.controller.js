// backend/controllers/vk.oauth.controller.js

const vkOAuthService = require('../services/vk.oauth.service');

const handleOAuthCallback = async (req, res) => {
    try {
        const { code, state } = req.query;
        const telegram_user_id = String(state || '').replace(/^tg:/, '') || '';
        
        if (!code || !telegram_user_id) {
            return res.status(400).send('Ошибка: отсутствует код авторизации или telegramId.');
        }

        const result = await vkOAuthService.handleOAuthCallback(code, telegram_user_id);
        res.json(result);
    } catch (error) {
        console.error('[VK_OAUTH_CONTROLLER] ❌ Ошибка:', error);
        res.status(500).json({ error: 'Внутренняя ошибка сервера' });
    }
};

module.exports = {
    handleCallback: handleOAuthCallback,
};
