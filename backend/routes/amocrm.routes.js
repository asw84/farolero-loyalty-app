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

// Экспортируем роутер
module.exports = router;