const express = require('express');
const router = express.Router();

// Импортируем наш новый контроллер
const amocrmController = require('../controllers/amocrm.controller');

// Маршруты для AmoCRM OAuth
router.get('/auth', amocrmController.init);         // Инициация авторизации
router.get('/init', amocrmController.init);         // Алиас для совместимости  
router.get('/callback', amocrmController.handleCallback); // Callback после авторизации

// Экспортируем роутер, чтобы его можно было подключить в server.js
module.exports = router;