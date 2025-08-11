const express = require('express');
const router = express.Router();

// Импортируем контроллер AmoCRM
const amocrmController = require('../controllers/amocrm.controller');

// Здесь будут основные маршруты для работы с AmoCRM
// например: router.get('/contacts', amocrmController.getContacts);
// router.post('/contacts', amocrmController.createContact);
router.get('/init', amocrmController.init);

// Экспортируем роутер
module.exports = router;