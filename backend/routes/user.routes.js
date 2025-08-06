const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');

// Было: /user/:
// Стало: /user/:telegramId
router.get('/user/:telegramId', userController.getById);

module.exports = router;