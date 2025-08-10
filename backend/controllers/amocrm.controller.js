// backend/controllers/amocrm.controller.js

// Импортируем наш клиент для работы с API AmoCRM
const amocrmClient = require('../amocrm/apiClient');

/**
 * Контроллер для временной инициализации токенов AmoCRM.
 * Вызывает функцию, которая обменивает auth_code на access_token и refresh_token.
 */
async function init(req, res) {
    try {
        // Вызываем основную логику из нашего API клиента
        await amocrmClient.getInitialToken();
        
        // Если все прошло успешно, отправляем позитивный ответ
        res.send('✅ Токены AmoCRM успешно получены и сохранены. Эндпоинт можно удалить.');
    } catch (error) {
        // Логируем полную ошибку в консоль сервера для отладки
        console.error('❌ [AMOCRM_INIT_CONTROLLER] Ошибка при вызове getInitialToken:', error);
        
        // Отправляем пользователю сообщение об ошибке
        res.status(500).send('Ошибка при получении токенов. Проверь консоль бэкенда.');
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