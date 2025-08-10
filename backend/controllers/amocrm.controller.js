// backend/controllers/amocrm.controller.js

// Импортируем наш клиент для работы с API AmoCRM
const amocrmClient = require('../amocrm/apiClient');

/**
 * Инициация OAuth авторизации AmoCRM
 */
async function init(req, res) {
    try {
        const authUrl = amocrmClient.getAuthUrl();
        res.redirect(authUrl);
    } catch (error) {
        console.error('❌ [AMOCRM_INIT_CONTROLLER] Ошибка при создании auth URL:', error);
        res.status(500).send('Ошибка при создании ссылки авторизации.');
    }
}

/**
 * Обработка callback после авторизации AmoCRM
 */
async function handleCallback(req, res) {
    try {
        const { code } = req.query;
        
        if (!code) {
            return res.status(400).send('Отсутствует код авторизации');
        }

        await amocrmClient.exchangeCodeForTokens(code);
        res.send('✅ Токены AmoCRM успешно получены и сохранены!');
    } catch (error) {
        console.error('❌ [AMOCRM_CALLBACK_CONTROLLER] Ошибка при обработке callback:', error);
        res.status(500).send('Ошибка при получении токенов. Проверьте консоль бэкенда.');
    }
}

// Экспортируем функции, чтобы их можно было использовать в маршрутах
module.exports = {
    init,
    handleCallback,
};