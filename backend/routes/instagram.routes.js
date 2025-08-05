// backend/routes/instagram.routes.js

const express = require('express');
const router = express.Router();
const instagramController = require('../controllers/instagram.controller');

// Этот эндпоинт будет принимать редирект от Instagram после авторизации
router.get('/oauth/instagram/callback', instagramController.handleCallback);

module.exports = router;
