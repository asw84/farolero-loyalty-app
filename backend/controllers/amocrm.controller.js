// backend/controllers/amocrm.controller.js
const amocrmService = require('../services/amocrm.service');

const init = (req, res) => {
    res.status(200).send('Токены успешно получены');
};

// Экспортируем функции для основного функционала AmoCRM
module.exports = {
    init,
    // Здесь будут основные функции для работы с AmoCRM
    // например: createContact, updateContact, searchContact и т.д.
};