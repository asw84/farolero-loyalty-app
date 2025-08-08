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
        res.send('Токены AmoCRM успешно получены и сохранены. Эндпоинт можно удалить.');
    } catch (error) {
        // Логируем полную ошибку в консоль сервера для отладки
        console.error('❌ [AMOCRM_INIT_CONTROLLER] Ошибка при вызове getInitialToken:', error);
        
        // Отправляем пользователю сообщение об ошибке
        res.status(500).send('Ошибка при получении токенов. Проверь консоль бэкенда.');
    }
}

// Экспортируем функцию, чтобы ее можно было использовать в маршрутах
module.exports = {
    init,
};