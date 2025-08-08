const express = require('express');
const router = express.Router();

// Импортируем наш новый контроллер
const amocrmController = require('../controllers/amocrm.controller');

// Регистрируем новый маршрут:
// GET-запрос на /api/amocrm/init будет вызывать функцию amocrmController.init
router.get('/amocrm/init', amocrmController.init);

/*
// Если у вас есть другие маршруты для AmoCRM, они остаются здесь. Например:
router.get('/amocrm/callback', amocrmController.handleCallback);
*/

// Экспортируем роутер, чтобы его можно было подключить в server.js
module.exports = router;