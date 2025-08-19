const express = require('express');
const router = express.Router();

// Импортируем контроллер AmoCRM
const amocrmController = require('../controllers/amocrm.controller');

// Маршруты для работы с AmoCRM
router.get('/init', amocrmController.init);
router.get('/callback', amocrmController.callback);
router.get('/test', amocrmController.testConnection);
router.get('/contact/:telegramId', amocrmController.getContactByTelegramId);
router.get('/contacts/search', amocrmController.searchContactByTelegramId);
router.get('/field/telegram', amocrmController.getTelegramFieldId);

// Экспортируем роутер
module.exports = router;