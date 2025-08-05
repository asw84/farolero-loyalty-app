// backend/controllers/amocrm.controller.js

const amocrmClient = require('../amocrm/apiClient');

async function init(req, res) {
    try {
        await amocrmClient.getInitialToken();
        res.send('Токены AmoCRM успешно получены и сохранены. Эндпоинт можно удалить.');
    } catch (error) {
        res.status(500).send('Ошибка при получении токенов. Проверь консоль бэкенда.');
    }
}

module.exports = {
    init,
};
