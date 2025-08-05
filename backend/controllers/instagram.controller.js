// backend/controllers/instagram.controller.js

const instagramService = require('../services/instagram.service');

async function handleCallback(req, res) {
    const { code } = req.query;
    // TODO: Получить telegram_user_id из сессии или state-параметра
    // Для MVP пока можем использовать заглушку
    const telegram_user_id = '123456789'; // ЗАГЛУШКА

    if (!code) {
        return res.status(400).send('Ошибка: отсутствует код авторизации.');
    }

    try {
        const result = await instagramService.handleOAuthCallback(code, telegram_user_id);
        // В реальном приложении здесь нужно перенаправить пользователя
        // обратно в Telegram Mini App с сообщением об успехе.
        res.send(result.message);
    } catch (error) {
        res.status(500).send(error.message);
    }
}

module.exports = {
    handleCallback,
};
