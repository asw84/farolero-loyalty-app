// backend/routes/user.routes.js

const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');

router.get('/user/:telegramId', userController.getUser);

module.exports = router;
