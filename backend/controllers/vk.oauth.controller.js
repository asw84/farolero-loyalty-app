// backend/controllers/vk.oauth.controller.js

const vkOAuthService = require('../services/vk.oauth.service');

async function handleCallback(req, res) {
    const { code } = req.query;
    // TODO: Получить telegram_user_id из сессии или state-параметра
    const telegram_user_id = '123456789'; // ЗАГЛУШКА

    if (!code) {
        return res.status(400).send('Ошибка: отсутствует код авторизации.');
    }

    try {
        const result = await vkOAuthService.handleOAuthCallback(code, telegram_user_id);
        res.send(result.message);
    } catch (error) {
        res.status(500).send(error.message);
    }
}

module.exports = {
    handleCallback,
};
